import { WebExtensionContext } from "./ExtensionContextAdapter"
import { WebOutputChannel } from "./OutputChannelAdapter"
import { WebContextProxy } from "./ContextProxyAdapter"
import type { ClineMessage, TaskLike } from "@roo-code/types"
import WebSocket from "ws"
import { ErrorMessage, StreamChunkMessage, TaskStateMessage } from "@roo-code/web-types"

export class WebClineProvider extends ClineProvider {
	private wsConnection?: WebSocket
	private clientId: string

	constructor(context: WebExtensionContext, clientId: string) {
		const outputChannel = new WebOutputChannel("Kilo-Code-Web")
		const contextProxy = new WebContextProxy(context)

		// Call parent constructor with web adapters
		super(
			context as any, // Type assertion for compatibility
			outputChannel as any,
			"sidebar", // renderContext
			contextProxy as any,
		)

		this.clientId = clientId
	}

	// Set WebSocket connection for this provider instance
	setWebSocketConnection(ws: WebSocket) {
		this.wsConnection = ws
	}

	// Override postMessageToWebview to use WebSocket instead of VSCode webview
	override async postMessageToWebview(message: ExtensionMessage) {
		if (!this.wsConnection || this.wsConnection.readyState !== WebSocket.OPEN) {
			console.warn("[WebClineProvider] No active WebSocket connection for postMessageToWebview")
			return
		}

		try {
			// Convert ExtensionMessage to WebSocket message format
			const webMessage = this.convertExtensionMessageToWebSocket(message)
			if (webMessage) {
				this.sendWebSocketMessage(webMessage)
			}
		} catch (error) {
			console.error("[WebClineProvider] Error sending message to webview:", error)
		}
	}

	// Convert ExtensionMessage to WebSocket message
	private convertExtensionMessageToWebSocket(message: ExtensionMessage): StreamChunkMessage | TaskStateMessage | ErrorMessage | null {
		switch (message.type) {
			case "state":
				// For state updates, we'll send task state information
				if (message.state) {
					const currentTask = this.getCurrentTask()
					if (currentTask) {
						return {
							type: "task_state",
							payload: {
								taskId: currentTask.taskId,
								status: "running",
								isStreaming: false,
								enableButtons: false,
								requestId: this.clientId,
							},
						} as TaskStateMessage
					}
				}
				return null

			case "messageUpdated":
				// Convert ClineMessage to stream chunk
				if (message.clineMessage) {
					const msg = message.clineMessage
					return {
						type: "stream_chunk",
						payload: {
							content: msg.text || "",
							partial: msg.partial || false,
							messageType: msg.type,
							say: msg.say,
							ts: msg.ts,
							ask: msg.ask,
							requestId: this.clientId,
						},
					} as StreamChunkMessage
				}
				return null

			default:
				// For other message types, log and ignore for now
				console.log("[WebClineProvider] Unhandled message type:", message.type)
				return null
		}
	}

	// Send WebSocket message
	private sendWebSocketMessage(message: StreamChunkMessage | TaskStateMessage | ErrorMessage) {
		if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
			this.wsConnection.send(JSON.stringify(message))
		}
	}

	// Override log method to use console instead of VSCode output channel
	override log(message: string) {
		console.log(`[WebClineProvider:${this.clientId}] ${message}`)

		// Also send to the original output channel for consistency
		try {
			super.log(message)
		} catch (error) {
			// Ignore errors from parent log method
		}
	}

	// Handle task events and stream them to client
	setupTaskEventStreaming() {
		// Listen for task creation events
		this.on("taskCreated" as any, (task: TaskLike) => {
			console.log(`[WebClineProvider] Task created: ${(task as any).taskId}`)

			// Set up message streaming for this task
			if ("on" in task && typeof task.on === "function") {
				(task as any).on("message", (eventData: { action: string; message: ClineMessage }) => {
					if (eventData.action === "created" || eventData.action === "updated") {
						const msg = eventData.message
						const streamMessage: StreamChunkMessage = {
							type: "stream_chunk",
							payload: {
								content: msg.text || "",
								partial: msg.partial || false,
								messageType: msg.type,
								say: msg.say,
								ts: msg.ts,
								ask: msg.ask,
								requestId: this.clientId,
							},
						}
						this.sendWebSocketMessage(streamMessage)
					}
				})
			}
		})
	}

	// Cleanup method
	override async dispose() {
		if (this.wsConnection) {
			this.wsConnection = undefined
		}
		await super.dispose()
	}
}
