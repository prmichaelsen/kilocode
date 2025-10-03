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
					await this.handleClientMessage(session, message)
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

	private async handleClientMessage(session: ClientSession, message: any) {
		console.log(`[SimpleWebServer] Message from ${session.id}:`, message.type)

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

			// Add user message to Firebase
			try {
				await this.firebaseService.addMessageToTask(taskId, userMessage)
			} catch (firebaseError) {
				console.error(`[SimpleWebServer] Failed to add user message to Firebase:`, firebaseError)
			}

			// Continue with existing task or create new one if task doesn't exist
			if (session.currentTask && session.currentTask.taskId === taskId) {
				// Continue existing task by sending user message to it
				await this.continueExistingTask(session, text)
			} else {
				// Task doesn't exist, create a new one
				console.log(`[SimpleWebServer] Task ${taskId} not found, creating new task`)
				await this.createTaskForSession(session, text, taskId)
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

			// Create task dependencies for web environment
			const dependencies: TaskDependencies = {
				workspacePath: "/project",
				globalStoragePath: "/storage",
			}

			// Create Task with orchestration
			const task = new Task({
				taskId,
				apiConfiguration: providerConfig,
				dependencies,
				task: userText,
			})

			// Store task in session for continuous interaction
			session.currentTask = task

			// Create Firebase task history entry (if Firebase is available)
			if (this.firebaseService) {
				const taskHistory: TaskHistory = {
					taskId,
					clientId: session.id,
					messages: [...session.messages], // Include existing messages
					createdAt: new Date(),
					updatedAt: new Date(),
					status: 'active'
				}

				try {
					await this.firebaseService.saveTaskHistory(taskHistory)
					console.log(`[SimpleWebServer] Task history saved to Firebase: ${taskId}`)
				} catch (firebaseError) {
					console.error(`[SimpleWebServer] Failed to save task history to Firebase:`, firebaseError)
					// Continue without Firebase - don't fail the task
				}
			}

			// Generate unique message ID for this response stream
			const messageId = `msg_${taskId}_${session.messageCounter++}_${Date.now()}`
			const streamId = `stream_${taskId}_${session.messageCounter}`

			// Listen to task events and stream to client
			task.on("message", async (message) => {
				if (message.type === "say" && message.say === "text") {
					// Send streaming chunk with consistent message ID
					this.sendToClient(session, {
						type: "stream_chunk",
						payload: {
							content: message.text || "",
							partial: message.partial || false,
							messageType: "say",
							say: "text",
							ts: message.ts || Date.now(),
							messageId,
							streamId,
						},
					})

					// Only add to session messages when complete
					if (!message.partial) {
						const assistantMessage: ChatMessage = {
							id: messageId,
							content: message.text || "",
							type: "assistant",
							timestamp: message.ts || Date.now(),
							messageIndex: session.messageCounter,
							streamId,
						}
						session.messages.push(assistantMessage)

						// Update Firebase with new message
						try {
							await this.firebaseService.addMessageToTask(taskId, assistantMessage)
						} catch (firebaseError) {
							console.error(`[SimpleWebServer] Failed to add message to Firebase:`, firebaseError)
						}
					}
				}
			})

			task.on("completed", async (result) => {
				console.log(`[SimpleWebServer] Task completed: ${result}`)
				
				// Update Firebase task status
				try {
					await this.firebaseService.updateTaskStatus(taskId, 'completed')
				} catch (firebaseError) {
					console.error(`[SimpleWebServer] Failed to update task status in Firebase:`, firebaseError)
				}

				// Send task state update to indicate completion
				this.sendToClient(session, {
					type: "task_state",
					payload: {
						taskId,
						status: "completed",
						isStreaming: false,
						enableButtons: false,
					},
				})
			})

			task.on("error", async (error) => {
				console.error(`[SimpleWebServer] Task error: ${error}`)
				
				// Update Firebase task status
				try {
					await this.firebaseService.updateTaskStatus(taskId, 'error')
				} catch (firebaseError) {
					console.error(`[SimpleWebServer] Failed to update task status in Firebase:`, firebaseError)
				}

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

			console.log(`[SimpleWebServer] Created Task ${taskId} for session ${session.id}`)
		} catch (error) {
			console.error("[SimpleWebServer] Error creating task:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			await this.streamResponse(session, `Task creation error: ${errorMessage}`)
		}
	}

	private async continueExistingTask(session: ClientSession, userText: string) {
		try {
			if (!session.currentTask) {
				throw new Error("No current task to continue")
			}

			// For resumed tasks, we need to create a new Task instance or handle differently
			// Since we're using the shared Task class, we need to create a proper task
			// For now, let's create a new task with the user's message
			const taskId = session.currentTask.taskId || `task_${Date.now()}_${session.id}`
			await this.createTaskForSession(session, userText, taskId)
			
			console.log(`[SimpleWebServer] Continued task ${taskId} for session ${session.id}`)
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
			// Note: Firebase doesn't have a built-in delete method in our service
			// We could implement soft delete by updating status to 'deleted'
			await this.firebaseService.updateTaskStatus(taskId, 'deleted' as any)
			
			this.sendToClient(session, {
				type: "task_deleted_response",
				payload: {
					success: true,
					taskId,
					requestId: payload.requestId,
				},
			})
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
