import WebSocket from "ws"
import { createServer } from "http"
import express from "express"
import cors from "cors"

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
}

export class SimpleWebServer {
	private app = express()
	private server = createServer(this.app)
	private wss!: WebSocket.Server
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
		this.wss = new WebSocket.Server({
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
		// Simple simulation of agent behavior for POC
		let response = ""

		if (userText.toLowerCase().includes("list") && userText.toLowerCase().includes("file")) {
			response = `I'll list the files in the current project for you.

Here are the files I found:
- README.md
- src/index.js
- src/utils.js
- package.json
- .gitignore

Would you like me to read any of these files or perform another operation?`
		} else if (userText.toLowerCase().includes("read") && userText.toLowerCase().includes("readme")) {
			response = `I'll read the README.md file for you.

# My Project

This is a test project for the Kilo Code web POC.

## Features
- Basic file operations
- Tool execution
- Agent conversation

## Getting Started
Run the agent and ask it to explore the project structure.

The README shows this is a test project with basic functionality.`
		} else {
			response = `I understand you want me to: "${userText}"

For this POC, I can help you with:
- Listing files in the project
- Reading file contents
- Basic code analysis

Try asking me to "list the files in the project" or "read the README file".`
		}

		// Stream the response in chunks to simulate real agent behavior
		await this.streamResponse(session, response)
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

// Start the server if this file is run directly
if (require.main === module) {
	const server = new SimpleWebServer()
	server.start()

	// Graceful shutdown
	process.on("SIGTERM", () => {
		console.log("[SimpleWebServer] Shutting down gracefully")
		server.stop()
		process.exit(0)
	})

	process.on("SIGINT", () => {
		console.log("[SimpleWebServer] Shutting down gracefully")
		server.stop()
		process.exit(0)
	})
}
