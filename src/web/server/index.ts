import WebSocket from "ws"
import { createServer } from "http"
import express from "express"
import cors from "cors"
import {
	WebSocketMessage,
	ClientMessage,
	isNewTaskMessage,
	isToolApprovalMessage,
	isAskResponseMessage,
	createErrorMessage,
	createConnectionStatusMessage,
} from "@web/types/web-messages"
import { WebTaskManager } from "./WebTaskManager"

const app = express()
const server = createServer(app)

// Enable CORS for development
app.use(
	cors({
		origin: ["http://localhost:3000", "http://localhost:3001"],
		credentials: true,
	}),
)

app.use(express.json())

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// WebSocket server
const wss = new WebSocket.Server({
	server,
	path: "/ws",
})

class WebSocketServer {
	private taskManager: WebTaskManager
	private clients = new Map<string, WebSocket>()

	constructor() {
		this.taskManager = new WebTaskManager()
		this.setupWebSocket()
	}

	private setupWebSocket() {
		wss.on("connection", (ws, req) => {
			const clientId = this.generateClientId()
			this.clients.set(clientId, ws)

			console.log(`[WebSocketServer] Client connected: ${clientId}`)

			// Send connection status
			this.sendMessage(ws, createConnectionStatusMessage("connected", clientId))

			ws.on("message", async (data) => {
				try {
					const message: ClientMessage = JSON.parse(data.toString())
					await this.handleMessage(ws, clientId, message)
				} catch (error) {
					console.error("[WebSocketServer] Invalid message format:", error)
					this.sendMessage(ws, createErrorMessage("Invalid message format", "INVALID_JSON"))
				}
			})

			ws.on("close", () => {
				console.log(`[WebSocketServer] Client disconnected: ${clientId}`)
				this.clients.delete(clientId)
				this.taskManager.cleanupClient(clientId)
			})

			ws.on("error", (error) => {
				console.error(`[WebSocketServer] WebSocket error for client ${clientId}:`, error)
				this.clients.delete(clientId)
				this.taskManager.cleanupClient(clientId)
			})
		})
	}

	private async handleMessage(ws: WebSocket, clientId: string, message: ClientMessage) {
		try {
			console.log(`[WebSocketServer] Received message from ${clientId}:`, message.type)

			switch (message.type) {
				case "new_task":
					if (isNewTaskMessage(message)) {
						await this.taskManager.createTask(clientId, message.payload.text, message.payload.images, ws)
					}
					break

				case "tool_approval":
					if (isToolApprovalMessage(message)) {
						await this.taskManager.handleToolApproval(clientId, message.payload, ws)
					}
					break

				case "ask_response":
					if (isAskResponseMessage(message)) {
						await this.taskManager.handleAskResponse(clientId, message.payload, ws)
					}
					break

				case "terminal_operation":
					await this.taskManager.handleTerminalOperation(clientId, message.payload.operation, ws)
					break

				case "cancel_task":
					await this.taskManager.cancelTask(clientId, ws)
					break

				default:
					console.warn(`[WebSocketServer] Unhandled message type: ${(message as any).type}`)
					this.sendMessage(
						ws,
						createErrorMessage(
							`Unhandled message type: ${(message as any).type}`,
							"UNHANDLED_MESSAGE_TYPE",
						),
					)
			}
		} catch (error) {
			console.error(`[WebSocketServer] Error handling message:`, error)
			this.sendMessage(
				ws,
				createErrorMessage(error instanceof Error ? error.message : "Unknown error", "MESSAGE_HANDLER_ERROR"),
			)
		}
	}

	private sendMessage(ws: WebSocket, message: WebSocketMessage) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message))
		}
	}

	private generateClientId(): string {
		return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	// Broadcast message to all connected clients
	broadcast(message: WebSocketMessage) {
		this.clients.forEach((ws, clientId) => {
			if (ws.readyState === WebSocket.OPEN) {
				this.sendMessage(ws, message)
			} else {
				// Clean up dead connections
				this.clients.delete(clientId)
			}
		})
	}

	// Get connected client count
	getClientCount(): number {
		return this.clients.size
	}
}

// Initialize and start server
const webSocketServer = new WebSocketServer()

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
	console.log(`[WebSocketServer] Server running on port ${PORT}`)
	console.log(`[WebSocketServer] WebSocket endpoint: ws://localhost:${PORT}/ws`)
	console.log(`[WebSocketServer] Health check: http://localhost:${PORT}/health`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
	console.log("[WebSocketServer] Received SIGTERM, shutting down gracefully")
	server.close(() => {
		console.log("[WebSocketServer] Server closed")
		process.exit(0)
	})
})

process.on("SIGINT", () => {
	console.log("[WebSocketServer] Received SIGINT, shutting down gracefully")
	server.close(() => {
		console.log("[WebSocketServer] Server closed")
		process.exit(0)
	})
})
