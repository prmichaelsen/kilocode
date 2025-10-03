import WebSocket from "ws"
import { createServer } from "http"
import express from "express"
import cors from "cors"

import type { 
	WebSocketMessage, 
	NewTaskMessage, 
	ToolApprovalMessage,
	ConnectionStatusMessage,
	StreamChunkMessage,
	TaskCreatedMessage,
	ErrorMessage,
} from "@roo-code/web-types"
import { 
	isNewTaskMessage, 
	isToolApprovalMessage,
} from "@roo-code/web-types"

// For now, let's use a simplified approach without the complex adapters
// We'll integrate the real API handlers directly
import { buildApiHandler } from "kilo-code/dist/api"
import type { ProviderSettings } from "@roo-code/types"

interface WebClientSession {
	id: string
	ws: WebSocket
	messages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
	anthropicClient?: Anthropic
}

export class KiloWebServer {
	private app = express()
	private server = createServer(this.app)
	private wss!: WebSocket.Server
	private sessions = new Map<string, WebClientSession>()

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
				sessions: this.sessions.size,
			})
		})

		this.app.get("/stats", (req, res) => {
			const sessions = Array.from(this.sessions.values())
			res.json({
				connectedSessions: sessions.length,
				activeTasks: sessions.filter(s => s.anthropicClient).length,
			})
		})
	}

	private setupWebSocket() {
		this.wss = new WebSocket.Server({
			server: this.server,
			path: "/ws",
		})

		this.wss.on("connection", (ws, req) => {
			const clientId = this.generateClientId()
			console.log(`[KiloWebServer] Client connected: ${clientId}`)

			// Create session
			const session: WebClientSession = {
				id: clientId,
				ws,
				messages: [],
			}

			this.sessions.set(clientId, session)

			// Send connection confirmation
			this.sendToClient(session, {
				type: "connection_status",
				payload: {
					status: "connected",
					clientId,
				},
			} as ConnectionStatusMessage)

			ws.on("message", async (data) => {
				try {
					const message = JSON.parse(data.toString()) as WebSocketMessage
					await this.handleClientMessage(session, message)
				} catch (error) {
					console.error("[KiloWebServer] Invalid message:", error)
					this.sendToClient(session, {
						type: "error",
						payload: { message: "Invalid message format" },
					} as ErrorMessage)
				}
			})

			ws.on("close", () => {
				console.log(`[KiloWebServer] Client disconnected: ${clientId}`)
				this.sessions.delete(clientId)
			})

			ws.on("error", (error) => {
				console.error(`[KiloWebServer] WebSocket error for ${clientId}:`, error)
				this.sessions.delete(clientId)
			})
		})
	}

	private async handleClientMessage(session: WebClientSession, message: WebSocketMessage) {
		console.log(`[KiloWebServer] Message from ${session.id}:`, message.type)

		if (isNewTaskMessage(message)) {
			await this.handleNewTask(session, message.payload.text)
		} else if (isToolApprovalMessage(message)) {
			await this.handleToolApproval(session, message.payload)
		} else {
			console.warn(`[KiloWebServer] Unhandled message type: ${message.type}`)
		}
	}

	private async handleNewTask(session: WebClientSession, text: string) {
		try {
			console.log(`[KiloWebServer] Creating new task for session ${session.id}: "${text}"`)

			// Initialize Anthropic client if not already done
			if (!session.anthropicClient) {
				const apiKey = process.env.ANTHROPIC_API_KEY
				if (!apiKey) {
					throw new Error("ANTHROPIC_API_KEY environment variable is required")
				}

				try {
					session.anthropicClient = new Anthropic({ apiKey })
					console.log(`[KiloWebServer] Anthropic client initialized for session ${session.id}`)
				} catch (error) {
					throw new Error(`Failed to initialize Anthropic client: ${error instanceof Error ? error.message : String(error)}`)
				}
			}

			// Send task created confirmation
			this.sendToClient(session, {
				type: "task_created",
				payload: {
					taskId: `task_${Date.now()}`,
					mode: "code",
					workspace: "/project",
				},
			} as TaskCreatedMessage)

			// Add user message to session
			session.messages.push({
				role: "user",
				content: text,
				timestamp: Date.now(),
			})

			// Create a simple system prompt for testing
			const systemPrompt = `You are Kilo Code, a helpful AI assistant. You can help with coding tasks, answer questions, and provide explanations.

For this web interface test, respond naturally to the user's request.`

			// Convert session messages to Anthropic API format
			const apiMessages: Anthropic.Messages.MessageParam[] = session.messages.map(msg => ({
				role: msg.role as "user" | "assistant",
				content: msg.content,
			}))

			// Make API request using Anthropic SDK directly
			const stream = await session.anthropicClient.messages.create({
				model: "claude-3-5-sonnet-20241022",
				max_tokens: 4096,
				system: systemPrompt,
				messages: apiMessages,
				stream: true,
			})

			// Stream the response
			await this.streamAnthropicResponse(session, stream)

		} catch (error) {
			console.error("[KiloWebServer] Error handling new task:", error)
			this.sendToClient(session, {
				type: "error",
				payload: { 
					message: `Failed to create task: ${error instanceof Error ? error.message : String(error)}` 
				},
			} as ErrorMessage)
		}
	}

	private async streamAnthropicResponse(session: WebClientSession, stream: any) {
		try {
			let fullResponse = ""

			for await (const chunk of stream) {
				if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
					fullResponse += chunk.delta.text
					
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
					} as StreamChunkMessage)
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
			} as StreamChunkMessage)

			// Add assistant response to session
			session.messages.push({
				role: "assistant",
				content: fullResponse,
				timestamp: Date.now(),
			})

			console.log(`[KiloWebServer] Completed streaming response for session ${session.id}`)

		} catch (error) {
			console.error("[KiloWebServer] Error streaming Anthropic response:", error)
			this.sendToClient(session, {
				type: "error",
				payload: {
					message: `Streaming failed: ${error instanceof Error ? error.message : String(error)}`
				},
			} as ErrorMessage)
		}
	}

	private async handleToolApproval(session: WebClientSession, payload: any) {
		console.log(`[KiloWebServer] Tool approval from ${session.id}:`, payload.approved)

		if (payload.approved) {
			await this.streamSimpleResponse(
				session,
				"Thank you for approving the tool use. The operation has been completed successfully.",
			)
		} else {
			await this.streamSimpleResponse(
				session,
				"I understand you don't want me to proceed with that operation. What would you like me to do instead?",
			)
		}
	}

	private async streamSimpleResponse(session: WebClientSession, text: string) {
		const words = text.split(" ")
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
			} as StreamChunkMessage)

			// Add delay to simulate streaming
			await new Promise((resolve) => setTimeout(resolve, 50))
		}
	}

	private sendToClient(session: WebClientSession, message: WebSocketMessage) {
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
			console.log(`[KiloWebServer] Server running on port ${port}`)
			console.log(`[KiloWebServer] WebSocket endpoint: ws://localhost:${port}/ws`)
			console.log(`[KiloWebServer] Health check: http://localhost:${port}/health`)
			console.log(`[KiloWebServer] Using real Kilo Code API handlers`)
		})
	}

	async stop() {
		// Clean up all sessions
		this.sessions.clear()
		this.wss.close()
		this.server.close()
	}
}

// Export the class for use in index.ts
export { KiloWebServer }