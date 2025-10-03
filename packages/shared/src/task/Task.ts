import { EventEmitter } from "events"
import crypto from "crypto"
import * as path from "path"
import { Anthropic } from "@anthropic-ai/sdk"
import { serializeError } from "serialize-error"
import delay from "delay"
import pWaitFor from "p-wait-for"

import type {
	ClineMessage,
	ClineAsk,
	ClineSay,
	ProviderSettings,
	TokenUsage,
	ToolUsage,
	ToolName,
} from "@roo-code/types"

import type { ApiHandler, ApiHandlerCreateMessageMetadata } from "../api/index.js"
import { buildApiHandler } from "../api/index.js"
import type { TaskDependencies, TaskOptions, TaskEvents, FileSystemAdapter } from "./interfaces.js"
import type { ClineAskResponse } from "../index.js"
import { generateWebSystemPrompt } from "../prompts/system.js"

export class Task extends EventEmitter<TaskEvents> {
	readonly taskId: string
	readonly workspacePath: string
	readonly globalStoragePath: string

	// Dependencies
	private dependencies: TaskDependencies
	private fileSystem: FileSystemAdapter

	// API
	readonly apiConfiguration: ProviderSettings
	api: ApiHandler

	// State
	abort: boolean = false
	isInitialized = false
	
	// Working directory management
	private currentWorkingDirectory: string

	// Messages - persistent conversation history
	clineMessages: ClineMessage[] = []
	apiConversationHistory: any[] = []
	private conversationInitialized = false

	// Ask/Response handling
	private askResponse?: ClineAskResponse
	private askResponseText?: string
	private askResponseImages?: string[]
	public lastMessageTs?: number

	// Tool usage tracking
	toolUsage: ToolUsage = {}

	// Streaming state
	isStreaming = false
	assistantMessageContent: any[] = []
	userMessageContent: any[] = []
	userMessageContentReady = false

	constructor(options: TaskOptions) {
		super()

		this.taskId = options.taskId || crypto.randomUUID()
		this.dependencies = options.dependencies
		this.workspacePath = options.dependencies.workspacePath
		this.globalStoragePath = options.dependencies.globalStoragePath
		this.currentWorkingDirectory = this.workspacePath // Initialize to workspace path

		// Set up file system adapter
		this.fileSystem = options.dependencies.fileSystem || this.createDefaultFileSystem()

		this.apiConfiguration = options.apiConfiguration
		this.api = buildApiHandler(options.apiConfiguration)

		// Load existing conversation history and working directory if available
		this.initializeConversationHistory().then(() => {
			if (options.task || options.images) {
				this.startTask(options.task, options.images)
			}
		}).catch(error => {
			console.error("Failed to initialize conversation history:", error)
			if (options.task || options.images) {
				this.startTask(options.task, options.images)
			}
		})
	}

	private async initializeConversationHistory(): Promise<void> {
		await Promise.all([
			this.loadApiConversationHistory(),
			this.loadClineMessages(),
			this.loadWorkingDirectory()
		])
		this.conversationInitialized = true
	}

	private createDefaultFileSystem(): FileSystemAdapter {
		// Default in-memory file system for web environment
		const files = new Map<string, string>()

		return {
			async readFile(path: string): Promise<string> {
				const content = files.get(path)
				if (content === undefined) {
					throw new Error(`File not found: ${path}`)
				}
				return content
			},

			async writeFile(path: string, content: string): Promise<void> {
				files.set(path, content)
			},

			async readDirectory(path: string): Promise<string[]> {
				const entries: string[] = []
				for (const [filePath] of files) {
					if (filePath.startsWith(path)) {
						const relativePath = filePath.slice(path.length + 1)
						if (!relativePath.includes("/")) {
							entries.push(relativePath)
						}
					}
				}
				return entries
			},

			async exists(path: string): Promise<boolean> {
				return files.has(path)
			},

			async createDirectory(path: string): Promise<void> {
				// No-op for in-memory system
			},

			async deleteFile(path: string): Promise<void> {
				files.delete(path)
			},
		}
	}

	async ask(
		type: ClineAsk,
		text?: string,
		partial?: boolean,
	): Promise<{ response: ClineAskResponse; text?: string; images?: string[] }> {
		if (this.abort) {
			console.warn(`[Task] Attempted to ask question on aborted task ${this.taskId}`)
			return { response: "noButtonClicked" } // Return gracefully instead of throwing
		}

		const askTs = Date.now()
		this.lastMessageTs = askTs

		await this.addToClineMessages({
			ts: askTs,
			type: "ask",
			ask: type,
			text,
			partial: partial || false,
		})

		// Wait for askResponse to be set
		await pWaitFor(() => this.askResponse !== undefined || this.lastMessageTs !== askTs, { interval: 100 })

		if (this.lastMessageTs !== askTs) {
			throw new Error("Current ask promise was ignored")
		}

		const result = {
			response: this.askResponse!,
			text: this.askResponseText,
			images: this.askResponseImages,
		}

		this.askResponse = undefined
		this.askResponseText = undefined
		this.askResponseImages = undefined

		return result
	}

	async say(type: ClineSay, text?: string, images?: string[], partial?: boolean): Promise<void> {
		if (this.abort) {
			console.warn(`[Task] Attempted to say message on aborted task ${this.taskId}`)
			return // Return gracefully instead of throwing
		}

		const sayTs = Date.now()
		this.lastMessageTs = sayTs

		await this.addToClineMessages({
			ts: sayTs,
			type: "say",
			say: type,
			text,
			images,
			partial: partial || false,
		})
	}

	private async addToClineMessages(message: ClineMessage) {
		this.clineMessages.push(message)
		
		// PERFORMANCE OPTIMIZATION: Only save complete messages to avoid excessive Firebase writes
		// This prevents saving every partial streaming chunk and dramatically improves performance
		if (!message.partial) {
			await this.saveClineMessages()
		}
		
		this.emit("message", message)
	}

	public setMessageResponse(text: string, images?: string[]) {
		this.askResponseText = text
		this.askResponseImages = images
		this.askResponse = "messageResponse"
	}

	// Method to continue an existing conversation with a new user message
	public async continueConversation(text: string, images?: string[]): Promise<void> {
		if (this.abort) {
			console.warn(`[Task] Attempted to continue conversation on aborted task ${this.taskId}`)
			return // Return gracefully instead of throwing
		}

		console.log(`[Task] Continuing conversation for task ${this.taskId}`)

		// Add user message to conversation
		await this.say("user_feedback", text, images)

		// Create user content for API
		let userContent: Anthropic.Messages.ContentBlockParam[] = [
			{ type: "text", text }
		]

		if (images && images.length > 0) {
			const imageBlocks: Anthropic.ImageBlockParam[] = images.map((image) => ({
				type: "image" as const,
				source: {
					type: "base64" as const,
					media_type: "image/jpeg" as const,
					data: image.split(",")[1] || image,
				},
			}))
			userContent.push(...imageBlocks)
		}

		// Continue the task loop with the new user content
		await this.initiateTaskLoop(userContent)
	}

	public approveAsk({ text, images }: { text?: string; images?: string[] } = {}) {
		this.askResponseText = text
		this.askResponseImages = images
		this.askResponse = "yesButtonClicked"
	}

	public denyAsk({ text, images }: { text?: string; images?: string[] } = {}) {
		this.askResponseText = text
		this.askResponseImages = images
		this.askResponse = "noButtonClicked"
	}

	private async startTask(task?: string, images?: string[]): Promise<void> {
		// Only reset conversation history if this is truly a new conversation
		if (!this.conversationInitialized) {
			this.clineMessages = []
			this.apiConversationHistory = []
			this.conversationInitialized = true
		}

		// Don't add the user message here - it's already added by the web server
		// This prevents duplication of the first user message
		this.isInitialized = true

		let imageBlocks: Anthropic.ImageBlockParam[] = []
		if (images) {
			imageBlocks = images.map((image) => ({
				type: "image" as const,
				source: {
					type: "base64" as const,
					media_type: "image/jpeg" as const,
					data: image.split(",")[1] || image,
				},
			}))
		}

		// Start the task loop
		await this.initiateTaskLoop([
			{
				type: "text",
				text: `<task>\n${task}\n</task>`,
			},
			...imageBlocks,
		])
	}

	private async initiateTaskLoop(userContent: Anthropic.Messages.ContentBlockParam[]): Promise<void> {
		let nextUserContent = userContent

		while (!this.abort) {
			const result = await this.recursivelyMakeClineRequests(nextUserContent)

			if (result.didEndLoop) {
				break
			} else {
				nextUserContent = result.nextUserContent || [
					{
						type: "text",
						text: "Please continue with the task or use attempt_completion if you're finished.",
					},
				]
			}
		}
	}

	private async recursivelyMakeClineRequests(
		userContent: Anthropic.Messages.ContentBlockParam[],
	): Promise<{ didEndLoop: boolean; nextUserContent?: Anthropic.Messages.ContentBlockParam[] }> {
		if (this.abort) {
			console.warn(`[Task] Attempted to make requests on aborted task ${this.taskId}`)
			return { didEndLoop: true } // End gracefully instead of throwing
		}

		const finalUserContent = [...userContent]

		await this.addToApiConversationHistory({ role: "user", content: finalUserContent })

		try {
			const systemPrompt = this.getSystemPrompt()

			const stream = this.api.createMessage(systemPrompt, this.apiConversationHistory, {
				taskId: this.taskId,
				mode: "code",
			})

			let assistantMessage = ""
			this.isStreaming = true

			try {
				for await (const chunk of stream) {
					if (this.abort) {
						break
					}

					switch (chunk.type) {
						case "text":
							assistantMessage += chunk.text
							await this.say("text", assistantMessage, undefined, true)
							break
						case "usage":
							console.log(
								`[Task] Usage: ${chunk.inputTokens} in, ${chunk.outputTokens} out, cost: $${chunk.totalCost || 0}`,
							)
							break
						case "error":
							console.error(`[Task] Stream error: ${chunk.error}`)
							await this.say("error", chunk.message)
							return { didEndLoop: true }
					}
				}
			} finally {
				this.isStreaming = false
			}

			// Complete the partial message
			if (assistantMessage) {
				await this.say("text", assistantMessage, undefined, false)
				await this.addToApiConversationHistory({
					role: "assistant",
					content: [{ type: "text", text: assistantMessage }],
				})

				// Check for tool use and completion
				const hasToolUse = this.checkForToolUse(assistantMessage)
				const hasAttemptCompletion = assistantMessage.includes('<attempt_completion>')

				// Only complete if there's an explicit attempt_completion tag
				if (hasAttemptCompletion) {
					console.log(`[Task] Task completed with attempt_completion`)
					this.emit("completed", "Task completed")
					return { didEndLoop: true }
				}

				if (hasToolUse) {
					// Execute tools and add results to conversation context
					const toolResults = await this.executeToolsInMessage(assistantMessage)
					if (toolResults) {
						// Add tool results as user message to maintain conversation context
						await this.addToApiConversationHistory({
							role: "user",
							content: [{ type: "text", text: toolResults }],
						})
						
						// Continue the conversation with tool results
						return {
							didEndLoop: false,
							nextUserContent: [{ type: "text", text: toolResults }],
						}
					}
				}

				if (!hasToolUse) {
					// If no tools used, ask for completion or tool use
					return {
						didEndLoop: false,
						nextUserContent: [
							{
								type: "text",
								text: "Please either use a tool to help with the task, or use attempt_completion if you have finished the task.",
							},
						],
					}
				}
			}

			return { didEndLoop: false }
		} catch (error) {
			console.error("[Task] Error in request loop:", error)
			await this.say("error", `Error: ${error instanceof Error ? error.message : String(error)}`)
			return { didEndLoop: true }
		}
	}

	private async addToApiConversationHistory(message: any) {
		const messageWithTs = { ...message, ts: Date.now() }
		this.apiConversationHistory.push(messageWithTs)
		
		// PERFORMANCE OPTIMIZATION: Debounce API conversation history saves
		// Only save when we have significant changes to avoid excessive Firebase writes
		if (this.apiConversationHistory.length % 5 === 0) {
			await this.saveApiConversationHistory()
		}
	}

	private async saveApiConversationHistory() {
		try {
			// Save to dependencies storage if available
			if (this.dependencies.storage) {
				await this.dependencies.storage.saveApiMessages(this.taskId, this.apiConversationHistory)
			}
		} catch (error) {
			console.error(`[Task] Failed to save API conversation history for ${this.taskId}:`, error)
			// Don't throw - continue task execution even if storage fails
		}
	}

	private async loadApiConversationHistory(): Promise<void> {
		try {
			if (this.dependencies.storage) {
				const savedHistory = await this.dependencies.storage.loadApiMessages(this.taskId)
				if (savedHistory && savedHistory.length > 0) {
					this.apiConversationHistory = savedHistory
					console.log(`[Task] Loaded ${savedHistory.length} API messages from storage`)
				}
			}
		} catch (error) {
			console.error(`[Task] Failed to load API conversation history for ${this.taskId}:`, error)
			// Continue with empty history if loading fails
			this.apiConversationHistory = []
		}
	}

	private async saveClineMessages() {
		try {
			if (this.dependencies.storage) {
				await this.dependencies.storage.saveClineMessages(this.taskId, this.clineMessages)
			}
		} catch (error) {
			console.error(`[Task] Failed to save Cline messages for ${this.taskId}:`, error)
			// Don't throw - continue task execution even if storage fails
		}
	}

	private async loadClineMessages(): Promise<void> {
		try {
			if (this.dependencies.storage) {
				const savedMessages = await this.dependencies.storage.loadClineMessages(this.taskId)
				if (savedMessages && savedMessages.length > 0) {
					this.clineMessages = savedMessages
					console.log(`[Task] Loaded ${savedMessages.length} Cline messages from storage`)
				}
			}
		} catch (error) {
			console.error(`[Task] Failed to load Cline messages for ${this.taskId}:`, error)
			// Continue with empty messages if loading fails
			this.clineMessages = []
		}
	}

	private getSystemPrompt(): string {
		const systemPrompt = generateWebSystemPrompt(this.workspacePath)
		
		// Debug: Log the entire system prompt for inspection
		// console.log('[Task] System Prompt:')
		// console.log('='.repeat(80))
		// console.log(systemPrompt)
		// console.log('='.repeat(80))
		
		return systemPrompt
	}

	public recordToolUsage(toolName: ToolName) {
		if (!this.toolUsage[toolName]) {
			this.toolUsage[toolName] = { attempts: 0, failures: 0 }
		}
		this.toolUsage[toolName].attempts++
		this.emit("toolUsed", toolName)
	}

	public recordToolError(toolName: ToolName, error?: string) {
		if (!this.toolUsage[toolName]) {
			this.toolUsage[toolName] = { attempts: 0, failures: 0 }
		}
		this.toolUsage[toolName].failures++
	}

	public getTokenUsage(): TokenUsage {
		// Simple token usage calculation
		const totalMessages = this.clineMessages.length
		return {
			totalTokensIn: totalMessages * 100, // Rough estimate
			totalTokensOut: totalMessages * 50,
			totalCost: totalMessages * 0.01,
			contextTokens: totalMessages * 150,
		}
	}

	public async abortTask() {
		this.abort = true
		this.emit("error", "Task aborted")
	}

	private checkForToolUse(message: string): boolean {
		// Simple check for tool usage patterns
		const toolPatterns = [
			/<read_file>/,
			/<write_to_file>/,
			/<execute_command>/,
			/<list_files>/,
			/<apply_diff>/,
			/<search_files>/,
			/<search_and_replace>/,
			/<change_working_directory>/,
			/<attempt_completion>/,
		]
		return toolPatterns.some((pattern) => pattern.test(message))
	}

	private checkForCompletion(message: string): boolean {
		// Only check for explicit attempt_completion tag, not general completion language
		return /<attempt_completion>/.test(message)
	}

	public get cwd() {
		return this.currentWorkingDirectory
	}
	
	// Working directory management methods
	private async loadWorkingDirectory(): Promise<void> {
		try {
			if (this.dependencies.storage?.loadWorkingDirectory) {
				const savedWorkingDirectory = await this.dependencies.storage.loadWorkingDirectory(this.taskId)
				if (savedWorkingDirectory) {
					this.currentWorkingDirectory = savedWorkingDirectory
					console.log(`[Task] Loaded working directory: ${savedWorkingDirectory}`)
				}
			}
		} catch (error) {
			console.error(`[Task] Failed to load working directory for ${this.taskId}:`, error)
			// Continue with default working directory if loading fails
		}
	}
	
	private async saveWorkingDirectory(): Promise<void> {
		try {
			if (this.dependencies.storage?.saveWorkingDirectory) {
				await this.dependencies.storage.saveWorkingDirectory(this.taskId, this.currentWorkingDirectory)
			}
		} catch (error) {
			console.error(`[Task] Failed to save working directory for ${this.taskId}:`, error)
			// Don't throw - continue task execution even if storage fails
		}
	}
	
	private async changeWorkingDirectory(newDirectory: string): Promise<string> {
		try {
			// Resolve the new directory path
			const resolvedPath = newDirectory.startsWith('/')
				? newDirectory
				: `${this.currentWorkingDirectory}/${newDirectory}`
			
			// Verify the directory exists
			const exists = await this.fileSystem.exists(resolvedPath)
			if (!exists) {
				throw new Error(`Directory does not exist: ${resolvedPath}`)
			}
			
			// Update the current working directory
			this.currentWorkingDirectory = resolvedPath
			
			// Save to storage
			await this.saveWorkingDirectory()
			
			return resolvedPath
		} catch (error) {
			throw new Error(`Failed to change working directory: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	// Execute tools found in assistant message and return results
	private async executeToolsInMessage(message: string): Promise<string | null> {
		try {
			// Check if we have a file system adapter for tool execution
			if (!this.fileSystem) {
				console.warn("[Task] No file system adapter available for tool execution")
				return null
			}

			// Simple tool execution - this should be replaced with proper tool executor
			if (message.includes('<list_files>')) {
				try {
					const files = await this.fileSystem.readDirectory(this.currentWorkingDirectory)
					return `[list_files Result]\n\nFiles in ${this.currentWorkingDirectory}:\n${files.join('\n')}`
				} catch (error) {
					return `[list_files Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`
				}
			}

			if (message.includes('<read_file>')) {
				// Extract file path from XML tags
				const pathMatch = message.match(/<path>(.*?)<\/path>/s)
				if (pathMatch && pathMatch[1] && this.fileSystem) {
					try {
						const filePath = pathMatch[1].trim()
						const resolvedPath = this.resolvePath(filePath)
						const content = await this.fileSystem.readFile(resolvedPath)
						// Add line numbers like the main extension does
						const numberedContent = content.split('\n').map((line, index) => `${index + 1} | ${line}`).join('\n')
						return `[read_file Result]\n\nFile: ${filePath}\n\n${numberedContent}`
					} catch (error) {
						return `[read_file Result]\n\nError reading file ${pathMatch[1]}: ${error instanceof Error ? error.message : String(error)}`
					}
				}
			}

			if (message.includes('<execute_command>')) {
				// Extract command from XML tags
				const commandMatch = message.match(/<command>(.*?)<\/command>/s)
				if (commandMatch && commandMatch[1] && this.dependencies.terminalAdapter) {
					try {
						const command = commandMatch[1].trim()
						const result = await this.dependencies.terminalAdapter.executeCommand(command, this.currentWorkingDirectory)
						return `[execute_command Result]\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n\nError:\n${result.stderr}`
					} catch (error) {
						return `[execute_command Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`
					}
				}
			}

			if (message.includes('<write_to_file>')) {
				// Extract file path and content from XML tags
				const pathMatch = message.match(/<path>(.*?)<\/path>/s)
				const contentMatch = message.match(/<content>(.*?)<\/content>/s)
				if (pathMatch && pathMatch[1] && contentMatch && contentMatch[1]) {
					try {
						const filePath = pathMatch[1].trim()
						const resolvedPath = this.resolvePath(filePath)
						const content = contentMatch[1].trim()
						await this.fileSystem.writeFile(resolvedPath, content)
						return `[write_to_file Result]\n\nSuccessfully wrote to file: ${filePath}`
					} catch (error) {
						return `[write_to_file Result]\n\nError writing file ${pathMatch[1]}: ${error instanceof Error ? error.message : String(error)}`
					}
				}
			}

			if (message.includes('<search_and_replace>')) {
				// Extract parameters from XML tags
				const pathMatch = message.match(/<path>(.*?)<\/path>/s)
				const searchMatch = message.match(/<search>(.*?)<\/search>/s)
				const replaceMatch = message.match(/<replace>(.*?)<\/replace>/s)
				
				if (pathMatch && pathMatch[1] && searchMatch && searchMatch[1] && replaceMatch && replaceMatch[1]) {
					try {
						const filePath = pathMatch[1].trim()
						const resolvedPath = this.resolvePath(filePath)
						const searchText = searchMatch[1].trim()
						const replaceText = replaceMatch[1].trim()
						
						// Read the file
						const content = await this.fileSystem.readFile(resolvedPath)
						
						// Perform the replacement
						const updatedContent = content.replace(new RegExp(searchText, 'g'), replaceText)
						
						// Check if any changes were made
						if (content === updatedContent) {
							return `[search_and_replace Result]\n\nNo matches found for "${searchText}" in file: ${filePath}`
						}
						
						// Write the updated content back
						await this.fileSystem.writeFile(resolvedPath, updatedContent)
						
						const matchCount = (content.match(new RegExp(searchText, 'g')) || []).length
						return `[search_and_replace Result]\n\nSuccessfully replaced ${matchCount} occurrence(s) of "${searchText}" with "${replaceText}" in file: ${filePath}`
					} catch (error) {
						return `[search_and_replace Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`
					}
				}
			}

			if (message.includes('<change_working_directory>')) {
				// Extract directory path from XML tags
				const pathMatch = message.match(/<path>(.*?)<\/path>/s)
				if (pathMatch && pathMatch[1]) {
					try {
						const newDirectory = pathMatch[1].trim()
						const resolvedPath = await this.changeWorkingDirectory(newDirectory)
						return `[change_working_directory Result]\n\nChanged working directory to: ${resolvedPath}\n\nAll subsequent file operations and commands will be relative to this directory.`
					} catch (error) {
						return `[change_working_directory Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`
					}
				}
			}

			// Add more tool implementations as needed
			return null
		} catch (error) {
			console.error("[Task] Error executing tools:", error)
			return `[Tool Execution Error]\n\n${error instanceof Error ? error.message : String(error)}`
		}
	}

	// Helper method to resolve relative paths based on current working directory
	private resolvePath(filePath: string): string {
		if (path.isAbsolute(filePath)) {
			// Absolute path - use as is
			return filePath
		} else {
			// Relative path - resolve relative to current working directory using proper path utilities
			return path.resolve(this.currentWorkingDirectory, filePath)
		}
	}
}