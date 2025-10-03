import { WebSocketServer } from "ws"
import WebSocket from "ws"
import { createServer } from "http"
import express from "express"
import cors from "cors"

// Import from shared package
import { buildApiHandler, Task } from '@roo-code/shared'
import type { ApiHandler, ProviderSettings, VSCodeAPI, TaskOptions, TaskDependencies } from '@roo-code/shared'

interface ChatMessage {
	id: string
	content: string
	type: "user" | "assistant" | "error"
	timestamp: number
	partial?: boolean
}

interface ClientSession {
	id: string
	ws: WebSocket
	messages: ChatMessage[]
	isActive: boolean
	kilocodeToken?: string
}

export class SimpleWebServer {
	private app = express()
	private server = createServer(this.app)
	private wss!: WebSocketServer
	private clients = new Map<string, ClientSession>()

	constructor() {
		this.setupExpress()
		this.setupWebSocket()
	}

	private setupExpress() {
		this.app.use(
			cors({
				origin: ["http://localhost:3000", "http://localhost:3001"],
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
				this.clients.delete(clientId)
			})

			ws.on("error", (error) => {
				console.error(`[SimpleWebServer] WebSocket error for ${clientId}:`, error)
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
			case "tool_approval":
				await this.handleToolApproval(session, message.payload)
				break
			default:
				console.warn(`[SimpleWebServer] Unhandled message type: ${message.type}`)
		}
	}

	private async handleNewTask(session: ClientSession, text: string) {
		try {
			// Add user message to session
			const userMessage: ChatMessage = {
				id: Date.now().toString(),
				content: text,
				type: "user",
				timestamp: Date.now(),
			}
			session.messages.push(userMessage)

			// Send task created confirmation
			this.sendToClient(session, {
				type: "task_created",
				payload: {
					taskId: `task_${Date.now()}`,
					mode: "code",
					workspace: "/project",
				},
			})

			// Simulate agent response for POC
			await this.simulateAgentResponse(session, text)
		} catch (error) {
			console.error("[SimpleWebServer] Error handling new task:", error)
			this.sendToClient(session, {
				type: "error",
				payload: { message: "Failed to create task" },
			})
		}
	}

	private async simulateAgentResponse(session: ClientSession, userText: string) {
		try {
			// Initialize Kilo Code token if not already done
			if (!session.kilocodeToken) {
				const token = process.env.KILOCODE_TOKEN
				if (!token) {
					console.error("[SimpleWebServer] KILOCODE_TOKEN environment variable not set")
					await this.streamResponse(session, "Error: Kilo Code token not configured. Please set KILOCODE_TOKEN environment variable.")
					return
				}

				session.kilocodeToken = token
				console.log(`[SimpleWebServer] Kilo Code token configured for session ${session.id}`)
			}

			// Create system prompt
			const systemPrompt = `You are Kilo Code, a helpful AI assistant. You can help with coding tasks, answer questions, and provide explanations.

For this web interface demonstration, respond naturally and helpfully to the user's request.`

			// Convert session messages to Kilo Code API format
			const apiMessages = session.messages
				.filter(msg => msg.type !== "error")
				.map(msg => ({
					role: msg.type === "user" ? "user" : "assistant",
					content: [{ type: "text", text: msg.content }],
				}))

			// Use shared Task orchestration instead of direct API calls
			await this.streamWithTaskOrchestration(session, userText)

		} catch (error) {
			console.error("[SimpleWebServer] Error with Kilo Code API:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			await this.streamResponse(session, `I encountered an error: ${errorMessage}`)
		}
	}

	private async streamWithTaskOrchestration(session: ClientSession, userText: string) {
		try {
			// Create provider configuration for KiloCode
			const providerConfig: ProviderSettings = {
				apiProvider: "kilocode",
				kilocodeToken: session.kilocodeToken!,
				kilocodeModel: "anthropic/claude-3.5-sonnet:beta"
			}

			// Create task dependencies for web environment
			const dependencies: TaskDependencies = {
				workspacePath: "/project",
				globalStoragePath: "/storage"
			}

			// Create Task with orchestration
			const task = new Task({
				apiConfiguration: providerConfig,
				dependencies,
				task: userText
			})

			// Listen to task events and stream to client
			task.on("message", (message) => {
				if (message.type === "say" && message.say === "text") {
					this.sendToClient(session, {
						type: "stream_chunk",
						payload: {
							content: message.text || "",
							partial: message.partial || false,
							messageType: "say",
							say: "text",
							ts: message.ts,
						},
					})
				}
			})

			task.on("completed", (result) => {
				console.log(`[SimpleWebServer] Task completed: ${result}`)
			})

			task.on("error", (error) => {
				console.error(`[SimpleWebServer] Task error: ${error}`)
				this.sendToClient(session, {
					type: "error",
					payload: { message: error },
				})
			})

			console.log(`[SimpleWebServer] Started Task orchestration for session ${session.id}`)

		} catch (error) {
			console.error("[SimpleWebServer] Error with Task orchestration:", error)
			const errorMessage = error instanceof Error ? error.message : String(error)
			await this.streamResponse(session, `Task orchestration error: ${errorMessage}`)
		}
	}

	private async streamWithSharedApiHandler(session: ClientSession, systemPrompt: string, apiMessages: any[], userText: string) {
		try {
			// Create provider configuration for KiloCode
			const providerConfig: ProviderSettings = {
				apiProvider: "kilocode",
				kilocodeToken: session.kilocodeToken!,
				kilocodeModel: "anthropic/claude-3.5-sonnet:beta"
			}

			// Create API handler using shared buildApiHandler
			const apiHandler = buildApiHandler(providerConfig)
			console.log(`[SimpleWebServer] Created API handler for model: ${apiHandler.getModel().id}`)

			// Create streaming request
			const stream = apiHandler.createMessage(systemPrompt, apiMessages, {
				taskId: `task_${Date.now()}`,
				mode: "code"
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
						console.log(`[SimpleWebServer] Usage: ${chunk.inputTokens} in, ${chunk.outputTokens} out, cost: $${chunk.totalCost || 0}`)
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

	private async streamKilocodeResponse(session: ClientSession, systemPrompt: string, apiMessages: any[], userText: string) {
		try {
			// Determine Kilo Code API base URL from token
			const baseUri = this.getKiloBaseUriFromToken(session.kilocodeToken!)
			const apiUrl = `${baseUri}/api/openrouter/chat/completions`

			// Prepare request payload
			const payload = {
				model: "anthropic/claude-3.5-sonnet:beta", // Default Kilo Code model
				messages: [
					{ role: "system", content: systemPrompt },
					...apiMessages,
				],
				stream: true,
				max_tokens: 4096,
			}

			// Make streaming request to Kilo Code API
			const response = await fetch(apiUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${session.kilocodeToken}`,
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
				const lines = chunk.split('\n')

				for (const line of lines) {
					if (line.startsWith('data: ') && line !== 'data: [DONE]') {
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
			await this.streamResponse(session, `Streaming error: ${error instanceof Error ? error.message : String(error)}`)
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
		this.server.listen(port, () => {
			console.log(`[SimpleWebServer] Server running on port ${port}`)
			console.log(`[SimpleWebServer] WebSocket endpoint: ws://localhost:${port}/ws`)
			console.log(`[SimpleWebServer] Health check: http://localhost:${port}/health`)
		})
	}

	stop() {
		this.wss.close()
		this.server.close()
	}
}

// Export the class for use in index.ts (already exported above)
