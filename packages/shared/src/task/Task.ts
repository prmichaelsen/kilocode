import { EventEmitter } from "events"
import crypto from "crypto"
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

	// Messages
	clineMessages: ClineMessage[] = []
	apiConversationHistory: any[] = []

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

		// Set up file system adapter
		this.fileSystem = options.dependencies.fileSystem || this.createDefaultFileSystem()

		this.apiConfiguration = options.apiConfiguration
		this.api = buildApiHandler(options.apiConfiguration)

		if (options.task || options.images) {
			this.startTask(options.task, options.images)
		}
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
			throw new Error(`Task ${this.taskId} aborted`)
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
			throw new Error(`Task ${this.taskId} aborted`)
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
		this.emit("message", message)
	}

	public setMessageResponse(text: string, images?: string[]) {
		this.askResponseText = text
		this.askResponseImages = images
		this.askResponse = "messageResponse"
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
		this.clineMessages = []
		this.apiConversationHistory = []

		await this.say("text", task, images)
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
			throw new Error(`Task ${this.taskId} aborted`)
		}

		// Add environment details
		const environmentDetails = `<environment_details>
# Current Working Directory
${this.workspacePath}

# Available Tools
- read_file: Read file contents
- write_to_file: Write content to files  
- list_files: List directory contents
- execute_command: Execute shell commands
- attempt_completion: Complete the task

# File System
In-memory file system for web environment
</environment_details>`

		const finalUserContent = [...userContent, { type: "text" as const, text: environmentDetails }]

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

				// Check for completion or tool use
				const hasToolUse = this.checkForToolUse(assistantMessage)
				const hasCompletion = this.checkForCompletion(assistantMessage)

				if (hasCompletion) {
					console.log(`[Task] Task completed successfully`)
					this.emit("completed", "Task completed")
					return { didEndLoop: true }
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
		this.apiConversationHistory.push({ ...message, ts: Date.now() })
	}

	private getSystemPrompt(): string {
		return `You are Kilo Code, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices.

You have access to tools that let you read and write files, execute commands, and interact with the user. Use these tools to help accomplish the user's task.

When you need to read a file, use the read_file tool.
When you need to write or modify files, use the write_to_file tool.
When you need to execute commands, use the execute_command tool.
When you have completed the task, use the attempt_completion tool.

Always be helpful, accurate, and efficient in your responses.`
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
		]
		return toolPatterns.some((pattern) => pattern.test(message))
	}

	private checkForCompletion(message: string): boolean {
		// Check for completion patterns
		const completionPatterns = [
			/<attempt_completion>/,
			/task.*complete/i,
			/finished.*task/i,
			/I have completed/i,
			/The task is complete/i,
		]
		return completionPatterns.some((pattern) => pattern.test(message))
	}

	public get cwd() {
		return this.workspacePath
	}
}
