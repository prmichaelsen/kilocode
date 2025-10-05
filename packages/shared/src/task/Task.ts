import { EventEmitter } from "events"
import crypto from "crypto"
import * as path from "path"
import { Anthropic } from "@anthropic-ai/sdk"
import { serializeError } from "serialize-error"
import delay from "delay"
import pWaitFor from "p-wait-for"

function escapeRegExp(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
import type { McpHub } from "../services/mcp/McpHub.js"
import type { DiffStrategy } from "../shared/tools.js"
import { ContextCondenser, CondensedContext } from "../context/ContextCondenser.js"

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

	// MCP Support
	private mcpHub?: McpHub
	private diffStrategy?: DiffStrategy
	private enableMcpServerCreation?: boolean

	// Context Management
	private contextCondenser?: ContextCondenser
	private condensationCount: number = 0
	private lastCondensationRatio?: number

	// State
	abort: boolean = false
	isInitialized = false
	
	// Interruption & Control
	private interrupted: boolean = false
	private interruptReason?: string
	private currentStreamController?: AbortController
	
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

		// Store MCP-related options
		this.mcpHub = options.mcpHub
		this.diffStrategy = options.diffStrategy
		this.enableMcpServerCreation = options.enableMcpServerCreation

		this.apiConfiguration = options.apiConfiguration
		this.api = buildApiHandler(options.apiConfiguration)

		// Initialize context condenser with API handler and custom config
		this.contextCondenser = new ContextCondenser(this.api, options.contextCondensationConfig)

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

		// ENHANCED FIX: Better handling of interrupted state
		// Wait for any current streaming to complete before continuing
		if (this.isStreaming) {
			console.log(`[Task] Waiting for current streaming to complete before continuing conversation`)
			// Abort current stream controller if active
			if (this.currentStreamController) {
				this.currentStreamController.abort()
			}
			// Wait a bit for stream to finish
			await new Promise(resolve => setTimeout(resolve, 200))
		}

		// Reset interrupted state when user sends new message
		if (this.interrupted) {
			console.log(`[Task] Auto-resuming interrupted task ${this.taskId} due to new user message`)
			this.interrupted = false
			this.interruptReason = undefined
			this.abort = false // Ensure abort flag is also reset
		}

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

		while (!this.abort && !this.interrupted) {
			// CRITICAL FIX: Check for interruption at the start of each loop iteration
			// This prevents the agent from getting stuck in thinking loops
			if (this.interrupted) {
				console.log(`[Task] Task loop interrupted for task ${this.taskId}`)
				break
			}

			const result = await this.recursivelyMakeClineRequests(nextUserContent)

			if (result.didEndLoop) {
				break
			} else {
				// CRITICAL FIX: Check for interruption before continuing the loop
				// This gives user messages a chance to interrupt between iterations
				if (this.interrupted || this.abort) {
					console.log(`[Task] Task loop stopping due to interruption: interrupted=${this.interrupted}, abort=${this.abort}`)
					break
				}

				nextUserContent = result.nextUserContent || [
					{
						type: "text",
						text: "Please continue with the task or use attempt_completion if you're finished.",
					},
				]

				// CRITICAL FIX: Add a small delay between iterations to allow interruption processing
				// This prevents the agent from monopolizing the event loop
				await new Promise(resolve => setTimeout(resolve, 50))
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

		// CRITICAL FIX: Reset interrupted state when starting new request
		// This prevents the task from getting stuck in interrupted state
		if (this.interrupted) {
			console.log(`[Task] Resetting interrupted state for new request in task ${this.taskId}`)
			this.interrupted = false
			this.interruptReason = undefined
		}

		const finalUserContent = [...userContent]

		await this.addToApiConversationHistory({ role: "user", content: finalUserContent })

		try {
			const systemPrompt = await this.getSystemPrompt()

			// Create AbortController for streaming interruption
			this.currentStreamController = new AbortController()

			const stream = this.api.createMessage(systemPrompt, this.apiConversationHistory, {
				taskId: this.taskId,
				mode: "code",
			})

			let assistantMessage = ""
			let usageData: {
				inputTokens: number
				outputTokens: number
				cacheWriteTokens?: number
				cacheReadTokens?: number
				totalCost?: number
			} | null = null
			this.isStreaming = true

			try {
				for await (const chunk of stream) {
					// Check for abort or interruption
					if (this.abort || this.interrupted) {
						console.log(`[Task] Stream interrupted: abort=${this.abort}, interrupted=${this.interrupted}`)
						break
					}

					switch (chunk.type) {
						case "text":
							assistantMessage += chunk.text
							await this.say("text", assistantMessage, undefined, true)
							break
						case "usage":
							// Capture usage data to create api_req_started message
							usageData = {
								inputTokens: chunk.inputTokens,
								outputTokens: chunk.outputTokens,
								cacheWriteTokens: chunk.cacheWriteTokens,
								cacheReadTokens: chunk.cacheReadTokens,
								totalCost: chunk.totalCost,
							}
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
				this.currentStreamController = undefined
			}

			// Create api_req_started message with actual token usage data
			if (usageData) {
				await this.say(
					"api_req_started",
					JSON.stringify({
						tokensIn: usageData.inputTokens,
						tokensOut: usageData.outputTokens,
						cacheWrites: usageData.cacheWriteTokens || 0,
						cacheReads: usageData.cacheReadTokens || 0,
						cost: usageData.totalCost || 0,
						apiProtocol: this.api.getModel().id.includes("claude") ? "anthropic" : "openai",
					}),
				)
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
		
		// Check if context condensation is needed
		if (this.contextCondenser) {
			const currentTokens = this.contextCondenser.estimateTokenCount(this.apiConversationHistory)
			
			if (this.contextCondenser.shouldCondenseContext(this.apiConversationHistory, currentTokens)) {
				console.log(`[Task] Context condensation triggered - ${this.apiConversationHistory.length} messages, ~${currentTokens} tokens`)
				
				// Notify user that condensation is starting
				await this.say("text", "🔄 Condensing conversation context to optimize token usage...", undefined, false)
				
				try {
					const result = await this.contextCondenser.condenseContext(this.apiConversationHistory)
					
					if (result.condensed && result.condensedHistory) {
						console.log(`[Task] Context condensed: ${result.originalTokens} -> ${result.condensedTokens} tokens (${Math.round(result.compressionRatio * 100)}% compression)`)
						this.apiConversationHistory = result.condensedHistory
						this.condensationCount++
						this.lastCondensationRatio = result.compressionRatio
						
						// Save condensed history immediately
						await this.saveApiConversationHistory()
						
						// Notify user of successful condensation
						await this.say("text", `✅ Context condensed: ${result.originalTokens} → ${result.condensedTokens} tokens (${Math.round(result.compressionRatio * 100)}% compression)`, undefined, false)
					}
				} catch (error) {
					console.error(`[Task] Context condensation failed:`, error)
					await this.say("error", `⚠️ Context condensation failed: ${error instanceof Error ? error.message : String(error)}`)
					// Continue without condensation if it fails
				}
			}
		}
		
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

	private async getSystemPrompt(): Promise<string> {
		// Calculate diagnostics data
		const tokenUsage = this.getTokenUsage()
		const messageCount = this.clineMessages.length
		const toolExecutionCount = Object.values(this.toolUsage).reduce((sum, usage) => sum + usage.attempts, 0)
		const errorCount = Object.values(this.toolUsage).reduce((sum, usage) => sum + usage.failures, 0)
		const sessionDuration = this.clineMessages.length > 0 ? Date.now() - (this.clineMessages[0]?.ts || Date.now()) : 0
		const contextUtilization = Math.min(tokenUsage.contextTokens / 1000000, 1.0) // 1M context window
		
		// Get last tool used
		const lastToolUsed = Object.keys(this.toolUsage).reduce((latest: string | undefined, toolName) => {
			const usage = this.toolUsage[toolName as ToolName]
			return (usage?.attempts || 0) > 0 ? toolName : latest
		}, undefined as string | undefined)

		const systemPrompt = await generateWebSystemPrompt(
			this.workspacePath,
			this.mcpHub,
			this.diffStrategy,
			this.enableMcpServerCreation,
			{
				tokenUsage: {
					input: tokenUsage.totalTokensIn,
					output: tokenUsage.totalTokensOut,
					total: tokenUsage.totalTokensIn + tokenUsage.totalTokensOut
				},
				messageCount,
				toolExecutionCount,
				sessionDuration,
				currentCost: tokenUsage.totalCost,
				taskId: this.taskId,
				modelId: this.api.getModel().id,
				errorCount,
				interruptionCount: this.interrupted ? 1 : 0,
				lastToolUsed,
				contextUtilization,
				condensationCount: this.condensationCount,
				lastCondensationRatio: this.lastCondensationRatio
			}
		)
		
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
		// Use the same logic as the main extension to track actual token usage
		// from api_req_started messages
		const result: TokenUsage = {
			totalTokensIn: 0,
			totalTokensOut: 0,
			totalCacheWrites: undefined,
			totalCacheReads: undefined,
			totalCost: 0,
			contextTokens: 0,
		}

		// Calculate running totals from api_req_started messages
		this.clineMessages.forEach((message) => {
			if (message.type === "say" && message.say === "api_req_started" && message.text) {
				try {
					const parsedText = JSON.parse(message.text)
					const { tokensIn, tokensOut, cacheWrites, cacheReads, cost } = parsedText

					if (typeof tokensIn === "number") {
						result.totalTokensIn += tokensIn
					}

					if (typeof tokensOut === "number") {
						result.totalTokensOut += tokensOut
					}

					if (typeof cacheWrites === "number") {
						result.totalCacheWrites = (result.totalCacheWrites ?? 0) + cacheWrites
					}

					if (typeof cacheReads === "number") {
						result.totalCacheReads = (result.totalCacheReads ?? 0) + cacheReads
					}

					if (typeof cost === "number") {
						result.totalCost += cost
					}
				} catch (error) {
					console.error("[Task] Error parsing api_req_started JSON:", error)
				}
			} else if (message.type === "say" && message.say === "condense_context") {
				// Add condensation costs
				result.totalCost += (message as any).contextCondense?.cost ?? 0
			}
		})

		// Calculate context tokens from the last API request
		for (let i = this.clineMessages.length - 1; i >= 0; i--) {
			const message = this.clineMessages[i]

			if (message && message.type === "say" && message.say === "api_req_started" && message.text) {
				try {
					const parsedText = JSON.parse(message.text)
					const { tokensIn, tokensOut, cacheWrites, cacheReads, apiProtocol } = parsedText

					// Calculate context tokens based on API protocol
					if (apiProtocol === "anthropic") {
						result.contextTokens = (tokensIn || 0) + (tokensOut || 0) + (cacheWrites || 0) + (cacheReads || 0)
					} else {
						// For OpenAI (or when protocol is not specified)
						result.contextTokens = (tokensIn || 0) + (tokensOut || 0)
					}
					break
				} catch (error) {
					console.error("[Task] Error parsing api_req_started JSON for context tokens:", error)
					continue
				}
			} else if (message && message.type === "say" && message.say === "condense_context") {
				result.contextTokens = (message as any).contextCondense?.newContextTokens ?? 0
				break
			}
		}

		return result
	}

	public async abortTask() {
		this.abort = true
		this.emit("error", "Task aborted")
	}

	// Enhanced interruption methods for Task Interruption & Control
	public async interruptTask(reason: string = "User interrupted"): Promise<void> {
		console.log(`[Task] Interrupting task ${this.taskId}: ${reason}`)
		
		this.interrupted = true
		this.interruptReason = reason
		
		// Abort current streaming if active
		if (this.currentStreamController) {
			this.currentStreamController.abort()
		}
		
		// Emit interruption event
		this.emit("interrupted", reason)
		
		// SIMPLE FIX: Don't add interruption message to conversation
		// The server will handle notifying the client about interruption
		// This prevents duplicate interruption messages in the chat
	}

	public async haltTask(reason: string = "Task halted by user"): Promise<void> {
		console.log(`[Task] Halting task ${this.taskId}: ${reason}`)
		
		// More aggressive halt - sets abort flag and interrupts
		this.abort = true
		this.interrupted = true
		this.interruptReason = reason
		
		// Abort current streaming
		if (this.currentStreamController) {
			this.currentStreamController.abort()
		}
		
		// Emit halt event
		this.emit("halted", reason)
		
		// SIMPLE FIX: Don't add halt message to conversation
		// The server will handle notifying the client about halt
		// This prevents duplicate halt messages in the chat
	}

	public isInterrupted(): boolean {
		return this.interrupted
	}

	public getInterruptReason(): string | undefined {
		return this.interruptReason
	}

	public async resumeTask(): Promise<void> {
		if (!this.interrupted) {
			console.warn(`[Task] Attempted to resume non-interrupted task ${this.taskId}`)
			return
		}
		
		console.log(`[Task] Resuming task ${this.taskId}`)
		
		this.interrupted = false
		this.interruptReason = undefined
		this.abort = false
		
		// Emit resume event
		this.emit("resumed")
		
		// SIMPLE FIX: Don't add resume message to conversation
		// The server will handle notifying the client about resume
		// This prevents duplicate resume messages in the chat
	}

	/**
	 * Manually trigger context condensation
	 */
	public async manuallyCondenseContext(preserveRecent: number = 10, force: boolean = false): Promise<{
		success: boolean
		message: string
		compressionRatio?: number
	}> {
		if (!this.contextCondenser) {
			return {
				success: false,
				message: "Context condenser not available"
			}
		}

		try {
			const validPreserveRecent = Math.max(5, Math.min(20, preserveRecent))
			
			// Temporarily update options
			const originalOptions = this.contextCondenser.getOptions()
			this.contextCondenser.updateOptions({
				preserveRecentMessages: validPreserveRecent,
				enableAutoCondensation: force ? true : originalOptions.enableAutoCondensation
			})
			
			const currentTokens = this.contextCondenser.estimateTokenCount(this.apiConversationHistory)
			const shouldCondense = force || this.contextCondenser.shouldCondenseContext(this.apiConversationHistory, currentTokens)
			
			if (!shouldCondense) {
				this.contextCondenser.updateOptions(originalOptions)
				return {
					success: false,
					message: `Context condensation not needed (${this.apiConversationHistory.length} messages, ~${currentTokens} tokens)`
				}
			}
			
			const result = await this.contextCondenser.condenseContext(this.apiConversationHistory)
			
			if (result.condensed && result.condensedHistory) {
				this.apiConversationHistory = result.condensedHistory
				await this.saveApiConversationHistory()
				
				this.contextCondenser.updateOptions(originalOptions)
				return {
					success: true,
					message: `Context condensed: ${result.originalTokens} -> ${result.condensedTokens} tokens`,
					compressionRatio: result.compressionRatio
				}
			}
			
			this.contextCondenser.updateOptions(originalOptions)
			return {
				success: false,
				message: "Condensation would not provide meaningful compression"
			}
		} catch (error) {
			return {
				success: false,
				message: `Condensation failed: ${error instanceof Error ? error.message : String(error)}`
			}
		}
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
			/<condense_context>/,
			/<use_mcp_tool>/,
			/<access_mcp_resource>/,
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
	// CRITICAL FIX: Add interruption checks between tool executions to prevent "thinking loops"
	private async executeToolsInMessage(message: string): Promise<string | null> {
		try {
			console.log(`[Task] Executing tools in message for task ${this.taskId}`)
			console.log(`[Task] Message content preview: ${message.substring(0, 200)}...`)
			
			// Check if we have a file system adapter for tool execution
			if (!this.fileSystem) {
				console.warn("[Task] No file system adapter available for tool execution")
				return null
			}

			// CRITICAL: Check for interruption before executing any tools
			if (this.abort || this.interrupted) {
				console.log(`[Task] Tool execution interrupted: abort=${this.abort}, interrupted=${this.interrupted}`)
				return `[Tool Execution Interrupted]\n\nTask was interrupted before tool execution could complete.`
			}

			// Parse all tools from the message first to execute them sequentially with interruption checks
			const toolResults: string[] = []
			
			// Log detected tools
			const detectedTools = []
			if (message.includes('<list_files>')) detectedTools.push('list_files')
			if (message.includes('<read_file>')) detectedTools.push('read_file')
			if (message.includes('<execute_command>')) detectedTools.push('execute_command')
			if (message.includes('<write_to_file>')) detectedTools.push('write_to_file')
			if (message.includes('<search_and_replace>')) detectedTools.push('search_and_replace')
			if (message.includes('<change_working_directory>')) detectedTools.push('change_working_directory')
			if (message.includes('<use_mcp_tool>')) detectedTools.push('use_mcp_tool')
			if (message.includes('<access_mcp_resource>')) detectedTools.push('access_mcp_resource')
			
			console.log(`[Task] Detected tools: ${detectedTools.join(', ')}`)
			console.log(`[Task] MCP Hub available: ${!!this.mcpHub}`)

			// Execute list_files tool
			if (message.includes('<list_files>')) {
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during list_files`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				try {
					const files = await this.fileSystem.readDirectory(this.currentWorkingDirectory)
					toolResults.push(`[list_files Result]\n\nFiles in ${this.currentWorkingDirectory}:\n${files.join('\n')}`)
				} catch (error) {
					toolResults.push(`[list_files Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`)
				}
			}

			// Execute read_file tool
			if (message.includes('<read_file>')) {
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during read_file`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				const pathMatch = message.match(/<path>(.*?)<\/path>/s)
				if (pathMatch && pathMatch[1] && this.fileSystem) {
					try {
						const filePath = pathMatch[1].trim()
						const resolvedPath = this.resolvePath(filePath)
						const content = await this.fileSystem.readFile(resolvedPath)
						// Add line numbers like the main extension does
						const numberedContent = content.split('\n').map((line, index) => `${index + 1} | ${line}`).join('\n')
						toolResults.push(`[read_file Result]\n\nFile: ${filePath}\n\n${numberedContent}`)
					} catch (error) {
						toolResults.push(`[read_file Result]\n\nError reading file ${pathMatch[1]}: ${error instanceof Error ? error.message : String(error)}`)
					}
				}
			}

			// Execute execute_command tool
			if (message.includes('<execute_command>')) {
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during execute_command`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				const commandMatch = message.match(/<command>(.*?)<\/command>/s)
				if (commandMatch && commandMatch[1] && this.dependencies.terminalAdapter) {
					try {
						const command = commandMatch[1].trim()
						const result = await this.dependencies.terminalAdapter.executeCommand(command, this.currentWorkingDirectory)
						toolResults.push(`[execute_command Result]\n\nCommand: ${command}\nExit Code: ${result.exitCode}\n\nOutput:\n${result.stdout}\n\nError:\n${result.stderr}`)
					} catch (error) {
						toolResults.push(`[execute_command Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`)
					}
				}
			}

			// Execute write_to_file tool
			if (message.includes('<write_to_file>')) {
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during write_to_file`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				const pathMatch = message.match(/<path>(.*?)<\/path>/s)
				const contentMatch = message.match(/<content>(.*?)<\/content>/s)
				if (pathMatch && pathMatch[1] && contentMatch && contentMatch[1]) {
					try {
						const filePath = pathMatch[1].trim()
						const resolvedPath = this.resolvePath(filePath)
						const content = contentMatch[1].trim()
						await this.fileSystem.writeFile(resolvedPath, content)
						toolResults.push(`[write_to_file Result]\n\nSuccessfully wrote to file: ${filePath}`)
					} catch (error) {
						toolResults.push(`[write_to_file Result]\n\nError writing file ${pathMatch[1]}: ${error instanceof Error ? error.message : String(error)}`)
					}
				}
			}

			// Execute search_and_replace tool
			if (message.includes('<search_and_replace>')) {
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during search_and_replace`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				const pathMatch = message.match(/<path>(.*?)<\/path>/s)
				const searchMatch = message.match(/<search>(.*?)<\/search>/s)
				const replaceMatch = message.match(/<replace>(.*?)<\/replace>/s)
				const useRegexMatch = message.match(/<use_regex>(.*?)<\/use_regex>/s)
				const ignoreCaseMatch = message.match(/<ignore_case>(.*?)<\/ignore_case>/s)
				const startLineMatch = message.match(/<start_line>(.*?)<\/start_line>/s)
				const endLineMatch = message.match(/<end_line>(.*?)<\/end_line>/s)
				
				if (pathMatch && pathMatch[1] && searchMatch && searchMatch[1] && replaceMatch) {
					const filePath = pathMatch[1].trim()
					const resolvedPath = this.resolvePath(filePath)
					const searchText = searchMatch[1].trim()
					const replaceText = replaceMatch[1] ? replaceMatch[1].trim() : ''
					const useRegex = useRegexMatch && useRegexMatch[1] && useRegexMatch[1].trim().toLowerCase() === 'true'
					const ignoreCase = ignoreCaseMatch && ignoreCaseMatch[1] && ignoreCaseMatch[1].trim().toLowerCase() === 'true'
					const startLine = startLineMatch && startLineMatch[1] ? parseInt(startLineMatch[1].trim(), 10) : undefined
					const endLine = endLineMatch && endLineMatch[1] ? parseInt(endLineMatch[1].trim(), 10) : undefined
					
					try {
						// Validate file exists
						const fileExists = await this.fileSystem.exists(resolvedPath)
						if (!fileExists) {
							toolResults.push(`[search_and_replace Result]\n\nError: File does not exist at path: ${filePath}\nThe specified file could not be found. Please verify the file path and try again.`)
						} else {
							// Read the file
							let content: string
							try {
								content = await this.fileSystem.readFile(resolvedPath)
							} catch (readError) {
								toolResults.push(`[search_and_replace Result]\n\nError reading file: ${filePath}\nFailed to read the file content: ${readError instanceof Error ? readError.message : String(readError)}\nPlease verify file permissions and try again.`)
								throw readError
							}
							
							// Create search pattern with proper escaping and flags
							const flags = ignoreCase ? 'gi' : 'g'
							let searchPattern: RegExp
							
							try {
								if (useRegex) {
									// Use regex directly, but validate it first
									searchPattern = new RegExp(searchText, flags)
								} else {
									// Escape special regex characters for literal search
									searchPattern = new RegExp(escapeRegExp(searchText), flags)
								}
							} catch (regexError) {
								toolResults.push(`[search_and_replace Result]\n\nError: Invalid regex pattern: ${searchText}\n${regexError instanceof Error ? regexError.message : String(regexError)}`)
								throw regexError
							}
							
							// Perform replacement based on line range
							let newContent: string
							if (startLine !== undefined || endLine !== undefined) {
								// Handle line-specific replacement
								const lines = content.split('\n')
								const start = Math.max((startLine ?? 1) - 1, 0)
								const end = Math.min((endLine ?? lines.length) - 1, lines.length - 1)
								
								// Validate line range
								if (start > lines.length - 1) {
									toolResults.push(`[search_and_replace Result]\n\nError: start_line (${startLine}) exceeds file length (${lines.length} lines)`)
								} else {
									// Get content before and after target section
									const beforeLines = lines.slice(0, start)
									const afterLines = lines.slice(end + 1)
									
									// Get and modify target section
									const targetContent = lines.slice(start, end + 1).join('\n')
									const modifiedContent = targetContent.replace(searchPattern, replaceText)
									const modifiedLines = modifiedContent.split('\n')
									
									// Reconstruct full content
									newContent = [...beforeLines, ...modifiedLines, ...afterLines].join('\n')
									
									// Check if any changes were made and write
									if (content === newContent) {
										const rangeInfo = ` in lines ${startLine ?? 1}-${endLine ?? 'end'}`
										toolResults.push(`[search_and_replace Result]\n\nNo matches found for "${searchText}"${rangeInfo} in file: ${filePath}`)
									} else {
										// Write the updated content back
										await this.fileSystem.writeFile(resolvedPath, newContent)
										
										// Count matches in the affected section
										const affectedContent = lines.slice(start, end + 1).join('\n')
										const matchCount = (affectedContent.match(searchPattern) || []).length
										
										const rangeInfo = ` in lines ${startLine ?? 1}-${endLine ?? 'end'}`
										const regexInfo = useRegex ? ' (regex)' : ''
										const caseInfo = ignoreCase ? ' (case-insensitive)' : ''
										
										toolResults.push(`[search_and_replace Result]\n\nSuccessfully replaced ${matchCount} occurrence(s) of "${searchText}" with "${replaceText}"${rangeInfo}${regexInfo}${caseInfo} in file: ${filePath}`)
									}
								}
							} else {
								// Global replacement
								newContent = content.replace(searchPattern, replaceText)
								
								// Check if any changes were made
								if (content === newContent) {
									toolResults.push(`[search_and_replace Result]\n\nNo matches found for "${searchText}" in file: ${filePath}`)
								} else {
									// Write the updated content back
									await this.fileSystem.writeFile(resolvedPath, newContent)
									
									// Count matches
									const matchCount = (content.match(searchPattern) || []).length
									
									const regexInfo = useRegex ? ' (regex)' : ''
									const caseInfo = ignoreCase ? ' (case-insensitive)' : ''
									
									toolResults.push(`[search_and_replace Result]\n\nSuccessfully replaced ${matchCount} occurrence(s) of "${searchText}" with "${replaceText}"${regexInfo}${caseInfo} in file: ${filePath}`)
								}
							}
						}
					} catch (error) {
						// Only add error if not already added
						if (!toolResults.some(r => r.includes('[search_and_replace Result]') && r.includes('Error'))) {
							toolResults.push(`[search_and_replace Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`)
						}
					}
				} else {
					// Missing required parameters
					const missing: string[] = []
					if (!pathMatch || !pathMatch[1]) missing.push('path')
					if (!searchMatch || !searchMatch[1]) missing.push('search')
					if (!replaceMatch) missing.push('replace')
					
					if (missing.length > 0) {
						toolResults.push(`[search_and_replace Result]\n\nError: Missing required parameter(s): ${missing.join(', ')}`)
					}
				}
			}

			// Execute change_working_directory tool
			if (message.includes('<change_working_directory>')) {
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during change_working_directory`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				const pathMatch = message.match(/<path>(.*?)<\/path>/s)
				if (pathMatch && pathMatch[1]) {
					try {
						const newDirectory = pathMatch[1].trim()
						const resolvedPath = await this.changeWorkingDirectory(newDirectory)
						toolResults.push(`[change_working_directory Result]\n\nChanged working directory to: ${resolvedPath}\n\nAll subsequent file operations and commands will be relative to this directory.`)
					} catch (error) {
						toolResults.push(`[change_working_directory Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`)
					}
				}
			}

			// Execute condense_context tool
			if (message.includes('<condense_context>')) {
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during condense_context`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				try {
					const preserveRecentMatch = message.match(/<preserve_recent>(.*?)<\/preserve_recent>/s)
					const forceMatch = message.match(/<force>(.*?)<\/force>/s)
					
					const preserveRecent = (preserveRecentMatch && preserveRecentMatch[1]) ? parseInt(preserveRecentMatch[1].trim()) : 10
					const force = (forceMatch && forceMatch[1]) ? forceMatch[1].trim().toLowerCase() === 'true' : false
					
					// Validate preserve_recent parameter
					const validPreserveRecent = Math.max(5, Math.min(20, preserveRecent))
					
					if (this.contextCondenser) {
						// Temporarily update options if needed
						const originalOptions = this.contextCondenser.getOptions()
						this.contextCondenser.updateOptions({
							preserveRecentMessages: validPreserveRecent,
							enableAutoCondensation: force ? true : originalOptions.enableAutoCondensation
						})
						
						const currentTokens = this.contextCondenser.estimateTokenCount(this.apiConversationHistory)
						const shouldCondense = force || this.contextCondenser.shouldCondenseContext(this.apiConversationHistory, currentTokens)
						
						if (!shouldCondense) {
							toolResults.push(`[condense_context Result]\n\nContext condensation not needed:\n- Current messages: ${this.apiConversationHistory.length}\n- Estimated tokens: ${currentTokens}\n- Threshold not met (use force=true to condense anyway)`)
						} else {
							const result = await this.contextCondenser.condenseContext(this.apiConversationHistory)
							
							if (result.condensed && result.condensedHistory) {
								this.apiConversationHistory = result.condensedHistory
								await this.saveApiConversationHistory()
								
								toolResults.push(`[condense_context Result]\n\nContext successfully condensed:\n- Original tokens: ${result.originalTokens}\n- Condensed tokens: ${result.condensedTokens}\n- Compression ratio: ${Math.round(result.compressionRatio * 100)}%\n- Messages preserved: ${validPreserveRecent}\n\nThe conversation context has been optimized while preserving essential information.`)
							} else {
								toolResults.push(`[condense_context Result]\n\nContext condensation skipped - compression would not be beneficial`)
							}
						}
						
						// Restore original options
						this.contextCondenser.updateOptions(originalOptions)
					} else {
						toolResults.push(`[condense_context Result]\n\nError: Context condenser not available`)
					}
				} catch (error) {
					toolResults.push(`[condense_context Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`)
				}
			}

			// Execute use_mcp_tool
			if (message.includes('<use_mcp_tool>')) {
				console.log(`[Task] Executing use_mcp_tool`)
				
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during use_mcp_tool`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				const serverNameMatch = message.match(/<server_name>(.*?)<\/server_name>/s)
				const toolNameMatch = message.match(/<tool_name>(.*?)<\/tool_name>/s)
				const argumentsMatch = message.match(/<arguments>(.*?)<\/arguments>/s)
				
				console.log(`[Task] MCP tool parsing - server: ${serverNameMatch?.[1]}, tool: ${toolNameMatch?.[1]}, hasArgs: ${!!argumentsMatch?.[1]}`)
				
				if (serverNameMatch?.[1] && toolNameMatch?.[1] && this.mcpHub) {
					try {
						const serverName = serverNameMatch[1].trim()
						const toolName = toolNameMatch[1].trim()
						let toolArguments = {}
						
						if (argumentsMatch?.[1]) {
							try {
								toolArguments = JSON.parse(argumentsMatch[1].trim())
								console.log(`[Task] Parsed MCP tool arguments:`, toolArguments)
							} catch (parseError) {
								console.error(`[Task] Error parsing MCP tool arguments:`, parseError)
								toolResults.push(`[use_mcp_tool Result]\n\nError parsing arguments: ${parseError instanceof Error ? parseError.message : String(parseError)}`)
								return toolResults.join('\n\n')
							}
						}
						
						console.log(`[Task] Calling MCP tool: ${serverName}.${toolName}`)
						const result = await this.mcpHub.callTool(serverName, toolName, toolArguments)
						console.log(`[Task] MCP tool result received:`, result)
						toolResults.push(`[use_mcp_tool Result]\n\nServer: ${serverName}\nTool: ${toolName}\n\nResult:\n${JSON.stringify(result, null, 2)}`)
					} catch (error) {
						console.error(`[Task] Error executing MCP tool:`, error)
						toolResults.push(`[use_mcp_tool Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`)
					}
				} else if (!this.mcpHub) {
					console.warn(`[Task] MCP Hub not available for use_mcp_tool`)
					toolResults.push(`[use_mcp_tool Result]\n\nError: MCP Hub not available`)
				} else {
					console.warn(`[Task] Invalid use_mcp_tool parameters - server: ${!!serverNameMatch?.[1]}, tool: ${!!toolNameMatch?.[1]}`)
				}
			}

			// Execute access_mcp_resource
			if (message.includes('<access_mcp_resource>')) {
				console.log(`[Task] Executing access_mcp_resource`)
				
				// Check for interruption before each tool
				if (this.abort || this.interrupted) {
					console.log(`[Task] Tool execution interrupted during access_mcp_resource`)
					return this.buildToolResults(toolResults, "[Tool Execution Interrupted] Task was interrupted during tool execution.")
				}

				const serverNameMatch = message.match(/<server_name>(.*?)<\/server_name>/s)
				const uriMatch = message.match(/<uri>(.*?)<\/uri>/s)
				
				console.log(`[Task] MCP resource parsing - server: ${serverNameMatch?.[1]}, uri: ${uriMatch?.[1]}`)
				
				if (serverNameMatch?.[1] && uriMatch?.[1] && this.mcpHub) {
					try {
						const serverName = serverNameMatch[1].trim()
						const uri = uriMatch[1].trim()
						
						console.log(`[Task] Accessing MCP resource: ${serverName}/${uri}`)
						const result = await this.mcpHub.readResource(serverName, uri)
						console.log(`[Task] MCP resource result received:`, result)
						toolResults.push(`[access_mcp_resource Result]\n\nServer: ${serverName}\nURI: ${uri}\n\nResult:\n${JSON.stringify(result, null, 2)}`)
					} catch (error) {
						console.error(`[Task] Error accessing MCP resource:`, error)
						toolResults.push(`[access_mcp_resource Result]\n\nError: ${error instanceof Error ? error.message : String(error)}`)
					}
				} else if (!this.mcpHub) {
					console.warn(`[Task] MCP Hub not available for access_mcp_resource`)
					toolResults.push(`[access_mcp_resource Result]\n\nError: MCP Hub not available`)
				} else {
					console.warn(`[Task] Invalid access_mcp_resource parameters - server: ${!!serverNameMatch?.[1]}, uri: ${!!uriMatch?.[1]}`)
				}
			}

			// Return combined results or null if no tools were executed
			return toolResults.length > 0 ? toolResults.join('\n\n') : null
		} catch (error) {
			console.error("[Task] Error executing tools:", error)
			return `[Tool Execution Error]\n\n${error instanceof Error ? error.message : String(error)}`
		}
	}

	// Helper method to build tool results with interruption message
	private buildToolResults(existingResults: string[], interruptionMessage: string): string {
		const results = [...existingResults]
		if (interruptionMessage) {
			results.push(interruptionMessage)
		}
		return results.join('\n\n')
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