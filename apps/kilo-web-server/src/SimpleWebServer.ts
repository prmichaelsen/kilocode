import { WebSocketServer } from "ws"
import WebSocket from "ws"
import { createServer } from "http"
import express from "express"
import cors from "cors"

// Import from shared package
import { buildApiHandler, Task } from "@roo-code/shared"
import type { ApiHandler, ProviderSettings, VSCodeAPI, TaskOptions, TaskDependencies } from "@roo-code/shared"

// Import Firebase service
import { FirebaseService, TaskHistory } from "./services/FirebaseService"

// Import web adapters
import { NodeTerminalAdapter } from "./adapters/TerminalAdapter"
import { NodeFileSystemAdapter } from "./adapters/FileSystemAdapter"
import { FirebaseTaskStorageAdapter } from "./adapters/TaskStorageAdapter"
import { WebMcpHub } from "./services/WebMcpHub"

export interface ChatMessage {
	id: string
	content: string
	type: "user" | "assistant" | "error"
	timestamp: number
	partial?: boolean
	messageIndex?: number
	streamId?: string
}

interface ClientSession {
	id: string
	ws: WebSocket
	messages: ChatMessage[]
	isActive: boolean
	kilocodeToken?: string
	currentTask?: any // Store the current Task instance
	messageCounter: number // Track message sequence
	storageAdapter?: FirebaseTaskStorageAdapter // Storage adapter for conversation persistence
	messageQueue: Array<{ message: any; resolve: Function; reject: Function }> // Message queue for ordering
	isProcessingMessage: boolean // Flag to prevent concurrent message processing
	pendingInterrupt?: { taskId: string; reason: string } // Track pending interrupts
}

export class SimpleWebServer {
	private app = express()
	private server = createServer(this.app)
	private wss!: WebSocketServer
	private clients = new Map<string, ClientSession>()
	private firebaseService: FirebaseService

	constructor() {
		this.setupExpress()
		this.setupWebSocket()
		
		// Initialize Firebase service - FATAL if it fails
		try {
			this.firebaseService = FirebaseService.getInstance()
			console.log('[SimpleWebServer] Firebase service initialized successfully')
		} catch (error) {
			console.error('[SimpleWebServer] FATAL: Failed to initialize Firebase service:', error)
			console.error('[SimpleWebServer] Firebase connection is required for server operation')
			throw new Error(`FATAL: Firebase initialization failed: ${error}`)
		}

		// MCP hub will be initialized per task with the correct workspace path
		console.log('[SimpleWebServer] MCP hub will be initialized per task with workspace-specific configuration')
	}

	private setupExpress() {
		this.app.use(
			cors({
				origin: [
					"http://localhost:3000",
					"http://localhost:3001",
					"http://localhost:8080",
					"http://137.184.37.88:3000",
					"http://137.184.37.88:8080",
					"https://137.184.37.88:3000",
					"https://137.184.37.88:8080"
				],
				credentials: true,
			}),
		)

		this.app.use(express.json())

		this.app.get("/health", (req, res) => {
			res.json({
				status: "ok",
				timestamp: new Date().toISOString(),
				clients: this.clients.size,
			})
		})

		this.app.get("/stats", (req, res) => {
			res.json({
				connectedClients: this.clients.size,
				totalMessages: Array.from(this.clients.values()).reduce(
					(sum, client) => sum + client.messages.length,
					0,
				),
			})
		})

	}

	private setupWebSocket() {
		this.wss = new WebSocketServer({
			server: this.server,
			path: "/ws",
		})

		this.wss.on("connection", (ws, req) => {
			const clientId = this.generateClientId()
			const session: ClientSession = {
				id: clientId,
				ws,
				messages: [],
				isActive: true,
				messageCounter: 0,
				messageQueue: [],
				isProcessingMessage: false,
			}

			this.clients.set(clientId, session)
			console.log(`[SimpleWebServer] Client connected: ${clientId}`)

			// Send connection confirmation
			this.sendToClient(session, {
				type: "connection_status",
				payload: {
					status: "connected",
					clientId,
				},
			})

			ws.on("message", async (data) => {
				try {
					const message = JSON.parse(data.toString())
					await this.queueMessage(session, message)
				} catch (error) {
					console.error("[SimpleWebServer] Invalid message:", error)
					this.sendToClient(session, {
						type: "error",
						payload: { message: "Invalid message format" },
					})
				}
			})

			ws.on("close", () => {
				console.log(`[SimpleWebServer] Client disconnected: ${clientId}`)
				// Clean up any active tasks
				const session = this.clients.get(clientId)
				if (session?.currentTask) {
					try {
						session.currentTask.abortTask()
					} catch (error) {
						console.error(`[SimpleWebServer] Error aborting task for disconnected client:`, error)
					}
				}
				this.clients.delete(clientId)
			})

			ws.on("error", (error) => {
				console.error(`[SimpleWebServer] WebSocket error for ${clientId}:`, error)
				// Clean up any active tasks
				const session = this.clients.get(clientId)
				if (session?.currentTask) {
					try {
						session.currentTask.abortTask()
					} catch (error) {
						console.error(`[SimpleWebServer] Error aborting task for errored client:`, error)
					}
				}
				this.clients.delete(clientId)
			})
		})
	}

	// Enhanced message queueing system with priority handling
	private async queueMessage(session: ClientSession, message: any): Promise<void> {
		return new Promise((resolve, reject) => {
			// Special handling for interrupt messages
			if (message.type === 'interrupt_task') {
				// Store pending interrupt to coordinate with continue messages
				session.pendingInterrupt = {
					taskId: message.payload.taskId,
					reason: message.payload.reason
				}
			}
			
			session.messageQueue.push({ message, resolve, reject })
			
			this.processMessageQueue(session)
		})
	}

	

	private async processMessageQueue(session: ClientSession): Promise<void> {
		// Prevent concurrent processing
		if (session.isProcessingMessage) {
			return
		}

		session.isProcessingMessage = true

		try {
			while (session.messageQueue.length > 0) {
				const { message, resolve, reject } = session.messageQueue.shift()!
				
				try {
					// Special coordination for continue_task messages after interrupts
					if (message.type === 'continue_task' && session.pendingInterrupt) {
						const interrupt = session.pendingInterrupt
						
						// Check if this continue message is for the same task that was interrupted
						if (message.payload.taskId === interrupt.taskId) {
							console.log(`[SimpleWebServer] Coordinating interrupt and continue for task ${interrupt.taskId}`)
							
							// First handle the interrupt
							await this.handleInterruptTask(session, {
								taskId: interrupt.taskId,
								reason: interrupt.reason
							})
							
							// Clear the pending interrupt
							session.pendingInterrupt = undefined
							
							// Small delay to ensure interrupt is processed
							await new Promise(resolve => setTimeout(resolve, 100))
						}
					}
					
					await this.handleClientMessage(session, message)
					resolve()
				} catch (error) {
					console.error(`[SimpleWebServer] Error processing queued message:`, error)
					reject(error)
				}
			}
		} finally {
			session.isProcessingMessage = false
		}
	}

	private async handleClientMessage(session: ClientSession, message: any) {
		console.log(`[SimpleWebServer] Processing message from ${session.id}:`, message.type)

		switch (message.type) {
			case "new_task":
				await this.handleNewTask(session, message.payload.text)
				break
			case "continue_task":
				await this.handleContinueTask(session, message.payload.text, message.payload.taskId)
				break
			case "tool_approval":
				await this.handleToolApproval(session, message.payload)
				break
			case "get_task_history":
				await this.handleGetTaskHistory(session, message.payload)
				break
			case "resume_task":
				await this.handleResumeTask(session, message.payload)
				break
			case "delete_task":
				await this.handleDeleteTask(session, message.payload)
				break
			case "interrupt_task":
				await this.handleInterruptTask(session, message.payload)
				break
			case "halt_task":
				await this.handleHaltTask(session, message.payload)
				break
			case "resume_interrupted_task":
				await this.handleResumeInterruptedTask(session, message.payload)
				break
			default:
				console.warn(`[SimpleWebServer] Unhandled message type: ${message.type}`)
		}
	}

	private async handleNewTask(session: ClientSession, text: string) {
		try {
			// Generate unique message ID
			const messageId = `msg_${session.id}_${session.messageCounter++}_${Date.now()}`
			
			// Add user message to session
			const userMessage: ChatMessage = {
				id: messageId,
				content: text,
				type: "user",
				timestamp: Date.now(),
				messageIndex: session.messageCounter - 1,
			}
			session.messages.push(userMessage)

			// Create a new task ID
			const taskId = `task_${Date.now()}_${session.id}`

			// Send task created confirmation
			this.sendToClient(session, {
				type: "task_created",
				payload: {
					taskId,
					mode: "code",
					workspace: "/project",
				},
			})

			// Create and store the task for continuous interaction
			await this.createTaskForSession(session, text, taskId)
		} catch (error) {
			console.error("[SimpleWebServer] Error handling new task:", error)
			this.sendToClient(session, {
				type: "error",
				payload: { message: "Failed to create task" },
			})
		}
	}

	private async handleContinueTask(session: ClientSession, text: string, taskId: string) {
		try {
			// Generate unique message ID
			const messageId = `msg_${session.id}_${session.messageCounter++}_${Date.now()}`
			
			// Add user message to session
			const userMessage: ChatMessage = {
				id: messageId,
				content: text,
				type: "user",
				timestamp: Date.now(),
				messageIndex: session.messageCounter - 1,
			}
			session.messages.push(userMessage)

			// PERFORMANCE OPTIMIZATION: Make Firebase operations non-blocking
			// Add user message to Firebase (async, don't block task creation)
			this.firebaseService.addMessageToTask(taskId, userMessage).catch(firebaseError => {
				console.error(`[SimpleWebServer] Failed to add user message to Firebase for task ${taskId}:`, firebaseError)
				// Continue task execution - Firebase failures should not stop the agent
			})

			// Continue with existing task or create new one if task doesn't exist
			if (session.currentTask && session.currentTask.taskId === taskId) {
				// Continue existing task by sending user message to it
				await this.continueExistingTask(session, text)
			} else {
				// Task doesn't exist, try to load from Firebase and resume
				console.log(`[SimpleWebServer] Task ${taskId} not found in session, attempting to load from Firebase`)
				try {
					const taskHistory = await this.firebaseService.getTaskHistory(taskId)
					if (taskHistory) {
						// Load the task and continue conversation
						await this.resumeTaskFromFirebase(session, taskHistory, text)
					} else {
						// Task doesn't exist anywhere, create a new one
						console.log(`[SimpleWebServer] Task ${taskId} not found in Firebase, creating new task`)
						await this.createTaskForSession(session, text, taskId)
					}
				} catch (error) {
					console.error(`[SimpleWebServer] Error loading task from Firebase:`, error)
					// Fallback to creating new task
					await this.createTaskForSession(session, text, taskId)
				}
			}
		} catch (error) {
			console.error("[SimpleWebServer] Error handling continue task:", error)
			this.sendToClient(session, {
				type: "error",
				payload: { message: "Failed to continue task" },
			})
		}
	}

	private async createTaskForSession(session: ClientSession, userText: string, taskId: string) {
		try {
			// Initialize Kilo Code token if not already done
			if (!session.kilocodeToken) {
				const token = process.env.KILOCODE_TOKEN
				if (!token) {
					console.error("[SimpleWebServer] KILOCODE_TOKEN environment variable not set")
					await this.streamResponse(
						session,
						"Error: Kilo Code token not configured. Please set KILOCODE_TOKEN environment variable.",
					)
					return
				}

				session.kilocodeToken = token
				console.log(`[SimpleWebServer] Kilo Code token configured for session ${session.id}`)
			}

			// Create provider configuration for KiloCode
			const providerConfig: ProviderSettings = {
				apiProvider: "kilocode",
				kilocodeToken: session.kilocodeToken!,
				kilocodeModel: "anthropic/claude-3.5-sonnet:beta",
			}

			// Create task dependencies for web environment with real adapters
			// PRIORITY: Initial working directory should always be $HOME
			const workspacePath = process.env.HOME || "/home/user"
			const fileSystemAdapter = new NodeFileSystemAdapter(workspacePath)
			const terminalAdapter = new NodeTerminalAdapter(workspacePath)
			const storageAdapter = new FirebaseTaskStorageAdapter()
			
			const dependencies: TaskDependencies = {
				workspacePath,
				globalStoragePath: "/tmp/notebin-storage", // Use temp directory for storage
				fileSystem: fileSystemAdapter,
				terminalAdapter,
				storage: storageAdapter,
			}

			// Store storage adapter in session for reuse
			session.storageAdapter = storageAdapter

			// Initialize MCP hub for this task's workspace
			let mcpHub: WebMcpHub | undefined
			try {
				mcpHub = WebMcpHub.getInstance(workspacePath)
				console.log(`[SimpleWebServer] MCP hub initialized for workspace: ${workspacePath}`)
			} catch (error) {
				console.error('[SimpleWebServer] Warning: Failed to initialize MCP hub:', error)
				// MCP is optional, continue without it
			}

			// Create Task with orchestration and MCP support
			const task = new Task({
				taskId,
				apiConfiguration: providerConfig,
				dependencies,
				task: userText,
				mcpHub: mcpHub?.mcpHub,
				enableMcpServerCreation: true,
			})

			// Store task in session for continuous interaction
			session.currentTask = task

			// PERFORMANCE OPTIMIZATION: Make Firebase operations non-blocking
			// Create Firebase task history entry (async, don't block task creation)
			if (this.firebaseService) {
				const taskHistory: TaskHistory = {
					taskId,
					clientId: session.id,
					messages: Array.isArray(session.messages) ? [...session.messages] : [], // Ensure messages is always an array
					createdAt: new Date(),
					updatedAt: new Date(),
					status: 'active'
				}

				// Fire and forget - don't await to avoid blocking task creation
				this.firebaseService.saveTaskHistory(taskHistory).then(() => {
					console.log(`[SimpleWebServer] Task history saved to Firebase: ${taskId}`)
				}).catch(firebaseError => {
					console.error(`[SimpleWebServer] Failed to save task history to Firebase for task ${taskId}:`, firebaseError)
					// Continue without Firebase - don't fail the task creation
				})
			}

			// Set up task event listeners for streaming
			this.setupTaskEventListeners(session, task, taskId)

			console.log(`[SimpleWebServer] Created Task ${taskId} for session ${session.id}`)
		} catch (error) {
			console.error("[SimpleWebServer] Error creating task:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			await this.streamResponse(session, `Task creation error: ${errorMessage}`)
		}
	}

	private setupTaskEventListeners(session: ClientSession, task: any, taskId: string) {
		// Track if we've already added a message for this timestamp to prevent duplicates
		const processedTimestamps = new Set<number>()

		// Listen to task events and stream to client
		task.on("message", async (message: any) => {
			if (message.type === "say" && message.say === "text") {
				const messageTimestamp = message.ts || Date.now()
				
				// Skip if we've already processed this timestamp (prevents duplicates)
				if (processedTimestamps.has(messageTimestamp) && !message.partial) {
					return
				}

				let messageContent = message.text || ""
				
				// CRITICAL FIX: Remove duplicate tool execution
				// The Task class already handles tool execution properly in its conversation loop
				// Duplicate execution was causing tools to show output to user but not provide context to agent
				// Now the Task class handles all tool execution and feeds results back into conversation context

				// Generate unique message ID for streaming
				const messageId = `msg_${taskId}_${messageTimestamp}`
				const streamId = `stream_${taskId}_${session.messageCounter}`

				// Send streaming chunk with consistent message ID
				this.sendToClient(session, {
					type: "stream_chunk",
					payload: {
						content: messageContent,
						partial: message.partial || false,
						messageType: "say",
						say: "text",
						ts: messageTimestamp,
						messageId,
						streamId,
					},
				})

				// Only add to session messages when complete and not already processed
				if (!message.partial && !processedTimestamps.has(messageTimestamp)) {
					processedTimestamps.add(messageTimestamp)
					
					const assistantMessage: ChatMessage = {
						id: messageId,
						content: messageContent,
						type: "assistant",
						timestamp: messageTimestamp,
						messageIndex: session.messageCounter++,
						streamId,
					}
					session.messages.push(assistantMessage)

					// CRITICAL PERFORMANCE FIX: Only save COMPLETE messages to Firebase
					// This prevents excessive Firebase writes during streaming and improves performance
					if (this.firebaseService) {
						// Fire and forget - don't await Firebase operations to avoid blocking streaming
						this.firebaseService.addMessageToTask(taskId, assistantMessage).catch(firebaseError => {
							console.error(`[SimpleWebServer] Failed to add complete message to Firebase for task ${taskId}:`, firebaseError)
							// Continue task execution - Firebase failures should not stop the agent
						})
					}

					// Keep task in running state after messages (unless explicit completion)
					const hasAttemptCompletion = messageContent.includes('<attempt_completion>')
					if (!hasAttemptCompletion) {
						this.sendToClient(session, {
							type: "task_state",
							payload: {
								taskId,
								status: "idle", // Set to idle to allow further input
								isStreaming: false,
								enableButtons: false,
							},
						})
					}
				}
			}
		})

		task.on("completed", async (result: string) => {
			console.log(`[SimpleWebServer] Task completed: ${result}`)
			
			// PERFORMANCE OPTIMIZATION: Make Firebase operations non-blocking
			// Update Firebase task status (async, don't block completion)
			this.firebaseService.updateTaskStatus(taskId, 'completed').catch(firebaseError => {
				console.error(`[SimpleWebServer] Failed to update task status to completed in Firebase for task ${taskId}:`, firebaseError)
				// Continue - task completion should not be blocked by storage failures
			})

			// Send task state update to indicate completion but keep task available for continuation
			this.sendToClient(session, {
				type: "task_state",
				payload: {
					taskId,
					status: "idle", // Change to idle instead of completed to allow continuation
					isStreaming: false,
					enableButtons: false,
				},
			})
		})

		task.on("error", async (error: string) => {
			console.error(`[SimpleWebServer] Task error: ${error}`)
			
			// PERFORMANCE OPTIMIZATION: Make Firebase operations non-blocking
			// Update Firebase task status (async, don't block error handling)
			this.firebaseService.updateTaskStatus(taskId, 'error').catch(firebaseError => {
				console.error(`[SimpleWebServer] Failed to update task status to error in Firebase for task ${taskId}:`, firebaseError)
				// Continue - error reporting should not be blocked by storage failures
			})

			this.sendToClient(session, {
				type: "error",
				payload: { message: error },
			})
			// Reset task state on error
			this.sendToClient(session, {
				type: "task_state",
				payload: {
					taskId,
					status: "error",
					isStreaming: false,
					enableButtons: false,
				},
			})
		})

		// Task Interruption & Control event listeners
		task.on("interrupted", async (reason: string) => {
			console.log(`[SimpleWebServer] Task interrupted: ${reason}`)
			
			// SIMPLE FIX: Don't send task_interrupted message to client
			// Just update the task state, no chat message needed
			
			// Update task state to show interruption
			this.sendToClient(session, {
				type: "task_state",
				payload: {
					taskId,
					status: "interrupted",
					isStreaming: false,
					enableButtons: true, // Enable resume button
				},
			})
		})

		task.on("halted", async (reason: string) => {
			console.log(`[SimpleWebServer] Task halted: ${reason}`)
			
			// SIMPLE FIX: Don't send task_halted message to client
			// Just update the task state, no chat message needed
			
			// Update task state to show halt
			this.sendToClient(session, {
				type: "task_state",
				payload: {
					taskId,
					status: "halted",
					isStreaming: false,
					enableButtons: true, // Enable resume button
				},
			})
		})

		task.on("resumed", async () => {
			console.log(`[SimpleWebServer] Task resumed`)
			
			// SIMPLE FIX: Don't send task_resumed message to client
			// Just update the task state, no chat message needed
			
			// Update task state to show active
			this.sendToClient(session, {
				type: "task_state",
				payload: {
					taskId,
					status: "active",
					isStreaming: false,
					enableButtons: false,
				},
			})
		})
	}

	private async continueExistingTask(session: ClientSession, userText: string) {
		try {
			if (!session.currentTask) {
				throw new Error("No current task to continue")
			}

			const task = session.currentTask
			const taskId = task.taskId

			console.log(`[SimpleWebServer] Continuing existing task ${taskId} with conversation context`)

			// Use the new continueConversation method to maintain context
			if (task.continueConversation) {
				await task.continueConversation(userText)
				console.log(`[SimpleWebServer] Continued conversation for task ${taskId}`)
			} else if (task.setMessageResponse) {
				// Fallback to setMessageResponse for compatibility
				task.setMessageResponse(userText)
				console.log(`[SimpleWebServer] Sent user message to existing task ${taskId}`)
			} else {
				console.warn(`[SimpleWebServer] Task ${taskId} doesn't support conversation continuation, creating new task`)
				await this.createTaskForSession(session, userText, taskId)
			}
		} catch (error) {
			console.error("[SimpleWebServer] Error continuing task:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			
			// Clean up the failed task from session
			if (session.currentTask) {
				try {
					session.currentTask.abortTask()
				} catch (abortError) {
					console.error("[SimpleWebServer] Error aborting failed task:", abortError)
				}
				session.currentTask = undefined
			}
			
			// Send error to client
			this.sendToClient(session, {
				type: "error",
				payload: { message: `Task continuation error: ${errorMessage}` },
			})
		}
	}

	private async resumeTaskFromFirebase(session: ClientSession, taskHistory: any, newUserText: string) {
		try {
			console.log(`[SimpleWebServer] Resuming task ${taskHistory.taskId} from Firebase with ${taskHistory.messages?.length || 0} messages`)

			// Create provider configuration
			if (!session.kilocodeToken) {
				const token = process.env.KILOCODE_TOKEN
				if (!token) {
					throw new Error("KILOCODE_TOKEN environment variable not set")
				}
				session.kilocodeToken = token
			}

			const providerConfig: ProviderSettings = {
				apiProvider: "kilocode",
				kilocodeToken: session.kilocodeToken!,
				kilocodeModel: "anthropic/claude-3.5-sonnet:beta",
			}

			// Create task dependencies with storage adapter
			// PRIORITY: Initial working directory should always be $HOME
			const workspacePath = process.env.HOME || "/home/user"
			const fileSystemAdapter = new NodeFileSystemAdapter(workspacePath)
			const terminalAdapter = new NodeTerminalAdapter(workspacePath)
			const storageAdapter = new FirebaseTaskStorageAdapter()
			
			const dependencies: TaskDependencies = {
				workspacePath,
				globalStoragePath: "/tmp/notebin-storage",
				fileSystem: fileSystemAdapter,
				terminalAdapter,
				storage: storageAdapter,
			}

			// Initialize MCP hub for this task's workspace
			let mcpHub: WebMcpHub | undefined
			try {
				mcpHub = WebMcpHub.getInstance(workspacePath)
				console.log(`[SimpleWebServer] MCP hub initialized for resumed task workspace: ${workspacePath}`)
			} catch (error) {
				console.error('[SimpleWebServer] Warning: Failed to initialize MCP hub for resumed task:', error)
				// MCP is optional, continue without it
			}

			// Create Task instance with existing taskId to load conversation history
			const task = new Task({
				taskId: taskHistory.taskId,
				apiConfiguration: providerConfig,
				dependencies,
				// Don't provide task text - we're resuming, not starting fresh
				mcpHub: mcpHub?.mcpHub,
				enableMcpServerCreation: true,
			})

			// Store task and storage adapter in session
			session.currentTask = task
			session.storageAdapter = storageAdapter

			// Load existing messages into session (ensure messages is an array)
			session.messages = Array.isArray(taskHistory.messages) ? [...taskHistory.messages] : []

			// Set up task event listeners for streaming
			this.setupTaskEventListeners(session, task, taskHistory.taskId)

			// Continue the conversation with the new user message
			if (task.continueConversation) {
				await task.continueConversation(newUserText)
			} else {
				console.warn(`[SimpleWebServer] Task doesn't support continueConversation, using setMessageResponse`)
				task.setMessageResponse(newUserText)
			}

			console.log(`[SimpleWebServer] Successfully resumed task ${taskHistory.taskId} and continued conversation`)
		} catch (error) {
			console.error("[SimpleWebServer] Error continuing task:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			await this.streamResponse(session, `Task continuation error: ${errorMessage}`)
		}
	}

	private async simulateAgentResponse(session: ClientSession, userText: string) {
		try {
			// This method is now deprecated in favor of createTaskForSession
			// Keeping for backward compatibility
			const taskId = `task_${Date.now()}`
			await this.createTaskForSession(session, userText, taskId)
		} catch (error) {
			console.error("[SimpleWebServer] Error with agent response:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			await this.streamResponse(session, `I encountered an error: ${errorMessage}`)
		}
	}


	private async streamWithSharedApiHandler(
		session: ClientSession,
		systemPrompt: string,
		apiMessages: any[],
		userText: string,
	) {
		try {
			// Create provider configuration for KiloCode
			const providerConfig: ProviderSettings = {
				apiProvider: "kilocode",
				kilocodeToken: session.kilocodeToken!,
				kilocodeModel: "anthropic/claude-3.5-sonnet:beta",
			}

			// Create API handler using shared buildApiHandler
			const apiHandler = buildApiHandler(providerConfig)
			console.log(`[SimpleWebServer] Created API handler for model: ${apiHandler.getModel().id}`)

			// Create streaming request
			const stream = apiHandler.createMessage(systemPrompt, apiMessages, {
				taskId: `task_${Date.now()}`,
				mode: "code",
			})

			let fullResponse = ""

			// Process the stream
			for await (const chunk of stream) {
				switch (chunk.type) {
					case "text":
						fullResponse += chunk.text

						// Send streaming chunk to client
						this.sendToClient(session, {
							type: "stream_chunk",
							payload: {
								content: fullResponse,
								partial: true,
								messageType: "say",
								say: "text",
								ts: Date.now(),
							},
						})
						break

					case "usage":
						console.log(
							`[SimpleWebServer] Usage: ${chunk.inputTokens} in, ${chunk.outputTokens} out, cost: $${chunk.totalCost || 0}`,
						)
						break

					case "error":
						console.error(`[SimpleWebServer] Stream error: ${chunk.error}`)
						await this.streamResponse(session, `Error: ${chunk.message}`)
						return
				}
			}

			// Send final complete message
			this.sendToClient(session, {
				type: "stream_chunk",
				payload: {
					content: fullResponse,
					partial: false,
					messageType: "say",
					say: "text",
					ts: Date.now(),
				},
			})

			// Add assistant message to session
			const assistantMessage: ChatMessage = {
				id: Date.now().toString(),
				content: fullResponse,
				type: "assistant",
				timestamp: Date.now(),
			}
			session.messages.push(assistantMessage)

			console.log(`[SimpleWebServer] Completed shared API handler streaming for session ${session.id}`)
		} catch (error) {
			console.error("[SimpleWebServer] Error with shared API handler:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			await this.streamResponse(session, `Shared API handler error: ${errorMessage}`)
		}
	}

	private async streamKilocodeResponse(
		session: ClientSession,
		systemPrompt: string,
		apiMessages: any[],
		userText: string,
	) {
		try {
			// Determine Kilo Code API base URL from token
			const baseUri = this.getKiloBaseUriFromToken(session.kilocodeToken!)
			const apiUrl = `${baseUri}/api/openrouter/chat/completions`

			// Prepare request payload
			const payload = {
				model: "anthropic/claude-3.5-sonnet:beta", // Default Kilo Code model
				messages: [{ role: "system", content: systemPrompt }, ...apiMessages],
				stream: true,
				max_tokens: 4096,
			}

			// Make streaming request to Kilo Code API
			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${session.kilocodeToken}`,
					"X-KILOCODE-TASKID": `task_${Date.now()}`,
				},
				body: JSON.stringify(payload),
			})

			if (!response.ok) {
				throw new Error(`Kilo Code API error: ${response.status} ${response.statusText}`)
			}

			// Stream the response
			await this.processKilocodeStream(session, response)
		} catch (error) {
			console.error("[SimpleWebServer] Error with Kilo Code API:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			await this.streamResponse(session, `Kilo Code API error: ${errorMessage}`)
		}
	}

	private async processKilocodeStream(session: ClientSession, response: Response) {
		const reader = response.body?.getReader()
		if (!reader) {
			throw new Error("No response body reader available")
		}

		const decoder = new TextDecoder()
		let fullResponse = ""

		try {
			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				const chunk = decoder.decode(value, { stream: true })
				const lines = chunk.split("\n")

				for (const line of lines) {
					if (line.startsWith("data: ") && line !== "data: [DONE]") {
						try {
							const data = JSON.parse(line.slice(6))
							if (data.choices?.[0]?.delta?.content) {
								fullResponse += data.choices[0].delta.content

								// Send streaming chunk to client
								this.sendToClient(session, {
									type: "stream_chunk",
									payload: {
										content: fullResponse,
										partial: true,
										messageType: "say",
										say: "text",
										ts: Date.now(),
									},
								})
							}
						} catch (parseError) {
							// Skip invalid JSON lines
							continue
						}
					}
				}
			}

			// Send final complete message
			this.sendToClient(session, {
				type: "stream_chunk",
				payload: {
					content: fullResponse,
					partial: false,
					messageType: "say",
					say: "text",
					ts: Date.now(),
				},
			})

			// Add assistant message to session
			const assistantMessage: ChatMessage = {
				id: Date.now().toString(),
				content: fullResponse,
				type: "assistant",
				timestamp: Date.now(),
			}
			session.messages.push(assistantMessage)

			console.log(`[SimpleWebServer] Completed Kilo Code LLM streaming for session ${session.id}`)
		} catch (error) {
			console.error("[SimpleWebServer] Error processing Kilo Code stream:", error)
			await this.streamResponse(
				session,
				`Streaming error: ${error instanceof Error ? error.message : String(error)}`,
			)
		} finally {
			reader.releaseLock()
		}
	}

	private getKiloBaseUriFromToken(token: string): string {
		// Simple token-based URL determination (simplified version)
		// In the real implementation, this would parse the token to determine the correct base URI
		return "https://api.kilocode.ai" // Default Kilo Code API URL
	}

	private async streamResponse(session: ClientSession, fullResponse: string) {
		const words = fullResponse.split(" ")
		let currentContent = ""

		for (let i = 0; i < words.length; i++) {
			currentContent += (i > 0 ? " " : "") + words[i]
			const isPartial = i < words.length - 1

			this.sendToClient(session, {
				type: "stream_chunk",
				payload: {
					content: currentContent,
					partial: isPartial,
					messageType: "say",
					say: "text",
					ts: Date.now(),
				},
			})

			// Add delay to simulate streaming
			await new Promise((resolve) => setTimeout(resolve, 50))
		}

		// Add final message to session
		const assistantMessage: ChatMessage = {
			id: Date.now().toString(),
			content: fullResponse,
			type: "assistant",
			timestamp: Date.now(),
		}
		session.messages.push(assistantMessage)
	}

	private async handleToolApproval(session: ClientSession, payload: any) {
		console.log(`[SimpleWebServer] Tool approval from ${session.id}:`, payload.approved)

		if (payload.approved) {
			await this.streamResponse(
				session,
				"Thank you for approving the tool use. The operation has been completed successfully.",
			)
		} else {
			await this.streamResponse(
				session,
				"I understand you don't want me to proceed with that operation. What would you like me to do instead?",
			)
		}
	}

	private async handleGetTaskHistory(session: ClientSession, payload: any) {
		try {
			const limit = payload.limit || 50
			const taskHistory = await this.firebaseService.getClientTaskHistory(session.id, limit)
			
			this.sendToClient(session, {
				type: "task_history_response",
				payload: {
					success: true,
					tasks: taskHistory,
					requestId: payload.requestId,
				},
			})
		} catch (error) {
			console.error("[SimpleWebServer] Error fetching task history:", error)
			this.sendToClient(session, {
				type: "task_history_response",
				payload: {
					success: false,
					error: error instanceof Error ? error.message : String(error),
					requestId: payload.requestId,
				},
			})
		}
	}

	private async handleResumeTask(session: ClientSession, payload: any) {
		try {
			const { taskId, mode } = payload
			
			// Get task history from Firebase
			if (!this.firebaseService) {
				throw new Error("Firebase service not available")
			}
			
			const taskHistory = await this.firebaseService.getTaskHistory(taskId)
			if (!taskHistory) {
				throw new Error(`Task ${taskId} not found`)
			}

			// Load the task messages into current session
			session.messages = [...taskHistory.messages]
			
			// Set current task ID for continuation
			if (mode === "continue") {
				// Resume the existing task - client will handle setting currentTaskId
				session.currentTask = { taskId } // Simplified task reference
			}

			// Send task resumed response
			this.sendToClient(session, {
				type: "task_resumed",
				payload: {
					taskId,
					messages: taskHistory.messages,
					status: taskHistory.status,
				},
			})

			console.log(`[SimpleWebServer] Task ${taskId} resumed for session ${session.id} in ${mode} mode`)
		} catch (error) {
			console.error("[SimpleWebServer] Error resuming task:", error)
			this.sendToClient(session, {
				type: "error",
				payload: {
					message: error instanceof Error ? error.message : String(error),
				},
			})
		}
	}

	private async handleDeleteTask(session: ClientSession, payload: any) {
		try {
			const { taskId } = payload
			
			// Soft delete by updating status to 'deleted' with proper error handling
			try {
				await this.firebaseService.updateTaskStatus(taskId, 'deleted' as any)
				
				this.sendToClient(session, {
					type: "task_deleted_response",
					payload: {
						success: true,
						taskId,
						requestId: payload.requestId,
					},
				})
			} catch (firebaseError) {
				console.error(`[SimpleWebServer] Failed to delete task ${taskId} in Firebase:`, firebaseError)
				// Still report success to client since the task is effectively removed from their session
				this.sendToClient(session, {
					type: "task_deleted_response",
					payload: {
						success: true,
						taskId,
						requestId: payload.requestId,
					},
				})
			}
		} catch (error) {
			console.error("[SimpleWebServer] Error deleting task:", error)
			this.sendToClient(session, {
				type: "task_deleted_response",
				payload: {
					success: false,
					error: error instanceof Error ? error.message : String(error),
					requestId: payload.requestId,
				},
			})
		}
	}

	private async handleInterruptTask(session: ClientSession, payload: any) {
		try {
			const { taskId, reason = "User interrupted task" } = payload
			
			console.log(`[SimpleWebServer] Interrupting task ${taskId}: ${reason}`)
			
			if (session.currentTask && session.currentTask.taskId === taskId) {
				await session.currentTask.interruptTask(reason)
				
				this.sendToClient(session, {
					type: "task_interrupted_response",
					payload: {
						success: true,
						taskId,
						reason,
						requestId: payload.requestId,
					},
				})
			} else {
				throw new Error(`Task ${taskId} not found or not active`)
			}
		} catch (error) {
			console.error("[SimpleWebServer] Error interrupting task:", error)
			this.sendToClient(session, {
				type: "task_interrupted_response",
				payload: {
					success: false,
					error: error instanceof Error ? error.message : String(error),
					requestId: payload.requestId,
				},
			})
		}
	}

	private async handleHaltTask(session: ClientSession, payload: any) {
		try {
			const { taskId, reason = "Task halted by user" } = payload
			
			console.log(`[SimpleWebServer] Halting task ${taskId}: ${reason}`)
			
			if (session.currentTask && session.currentTask.taskId === taskId) {
				await session.currentTask.haltTask(reason)
				
				// Update Firebase task status
				this.firebaseService.updateTaskStatus(taskId, 'halted' as any).catch(firebaseError => {
					console.error(`[SimpleWebServer] Failed to update task status to halted in Firebase for task ${taskId}:`, firebaseError)
				})
				
				this.sendToClient(session, {
					type: "task_halted_response",
					payload: {
						success: true,
						taskId,
						reason,
						requestId: payload.requestId,
					},
				})
			} else {
				throw new Error(`Task ${taskId} not found or not active`)
			}
		} catch (error) {
			console.error("[SimpleWebServer] Error halting task:", error)
			this.sendToClient(session, {
				type: "task_halted_response",
				payload: {
					success: false,
					error: error instanceof Error ? error.message : String(error),
					requestId: payload.requestId,
				},
			})
		}
	}

	private async handleResumeInterruptedTask(session: ClientSession, payload: any) {
		try {
			const { taskId } = payload
			
			console.log(`[SimpleWebServer] Resuming interrupted task ${taskId}`)
			
			if (session.currentTask && session.currentTask.taskId === taskId) {
				await session.currentTask.resumeTask()
				
				// Update Firebase task status
				this.firebaseService.updateTaskStatus(taskId, 'active').catch(firebaseError => {
					console.error(`[SimpleWebServer] Failed to update task status to active in Firebase for task ${taskId}:`, firebaseError)
				})
				
				this.sendToClient(session, {
					type: "task_resumed_response",
					payload: {
						success: true,
						taskId,
						requestId: payload.requestId,
					},
				})
			} else {
				throw new Error(`Task ${taskId} not found`)
			}
		} catch (error) {
			console.error("[SimpleWebServer] Error resuming interrupted task:", error)
			this.sendToClient(session, {
				type: "task_resumed_response",
				payload: {
					success: false,
					error: error instanceof Error ? error.message : String(error),
					requestId: payload.requestId,
				},
			})
		}
	}

	private sendToClient(session: ClientSession, message: any) {
		if (session.ws.readyState === WebSocket.OPEN) {
			session.ws.send(
				JSON.stringify({
					...message,
					timestamp: Date.now(),
				}),
			)
		}
	}

	private generateClientId(): string {
		return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	start(port: number = 3001) {
		this.server.listen(port, '0.0.0.0', () => {
			console.log(`[SimpleWebServer] Server running on port ${port}`)
			console.log(`[SimpleWebServer] WebSocket endpoint: ws://0.0.0.0:${port}/ws`)
			console.log(`[SimpleWebServer] Health check: http://0.0.0.0:${port}/health`)
		})
	}

	stop() {
		this.wss.close()
		this.server.close()
	}
}

// Export the class for use in index.ts (already exported above)
