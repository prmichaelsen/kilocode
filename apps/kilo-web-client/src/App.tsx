import React, { useState, useEffect, useRef, useCallback } from "react"
import {
	WebSocketMessage,
	ServerMessage,
	isStreamChunkMessage,
	isTaskStateMessage,
	isErrorMessage,
	isConnectionStatusMessage,
} from "@roo-code/web-types"
import type { ClineMessage } from "@roo-code/types"
import "./App.css"

interface ChatMessage {
	id: string
	content: string
	type: "user" | "assistant" | "tool" | "error"
	timestamp: number
	partial?: boolean
	ask?: string
	say?: string
}

interface TaskState {
	taskId?: string
	status: "idle" | "running" | "waiting" | "completed" | "error"
	isStreaming: boolean
	enableButtons: boolean
	primaryButtonText?: string
	secondaryButtonText?: string
}

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:3001/ws"

export default function App() {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [input, setInput] = useState("")
	const [isConnected, setIsConnected] = useState(false)
	const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">(
		"connecting",
	)
	const [taskState, setTaskState] = useState<TaskState>({
		status: "idle",
		isStreaming: false,
		enableButtons: false,
	})
	const [clientId, setClientId] = useState<string>("")

	const wsRef = useRef<WebSocket | null>(null)
	const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const reconnectAttempts = useRef(0)
	const maxReconnectAttempts = 5

	const connectWebSocket = useCallback(() => {
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			return
		}

		console.log(`[App] Connecting to WebSocket: ${WS_URL}`)
		setConnectionStatus("connecting")

		const ws = new WebSocket(WS_URL)
		wsRef.current = ws

		ws.onopen = () => {
			console.log("[App] WebSocket connected")
			setIsConnected(true)
			setConnectionStatus("connected")
			reconnectAttempts.current = 0
		}

		ws.onmessage = (event) => {
			try {
				const message: ServerMessage = JSON.parse(event.data)
				handleServerMessage(message)
			} catch (error) {
				console.error("[App] Failed to parse WebSocket message:", error)
			}
		}

		ws.onclose = (event) => {
			console.log("[App] WebSocket disconnected:", event.code, event.reason)
			setIsConnected(false)
			setConnectionStatus("disconnected")

			// Attempt to reconnect if not a normal closure
			if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
				const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
				console.log(
					`[App] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`,
				)

				reconnectTimeoutRef.current = setTimeout(() => {
					reconnectAttempts.current++
					connectWebSocket()
				}, delay)
			}
		}

		ws.onerror = (error) => {
			console.error("[App] WebSocket error:", error)
			setConnectionStatus("error")
		}
	}, [])

	useEffect(() => {
		connectWebSocket()

		return () => {
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current)
			}
			if (wsRef.current) {
				wsRef.current.close(1000, "Component unmounting")
			}
		}
	}, [connectWebSocket])

	const handleServerMessage = (message: ServerMessage) => {
		console.log("[App] Received message:", message.type)

		if (isConnectionStatusMessage(message)) {
			setClientId(message.payload.clientId)
			return
		}

		if (isStreamChunkMessage(message)) {
			const { content, partial, messageType, ask, say, ts } = message.payload

			setMessages((prev) => {
				// Find existing message with same timestamp for partial updates
				const existingIndex = prev.findIndex((msg) => msg.id === ts.toString())

				if (existingIndex !== -1 && partial) {
					// Update existing partial message
					return prev.map((msg, idx) =>
						idx === existingIndex ? { ...msg, content: msg.content + content, partial } : msg,
					)
				} else {
					// Add new message or complete partial message
					const newMessage: ChatMessage = {
						id: ts.toString(),
						content: existingIndex !== -1 ? prev[existingIndex].content + content : content,
						type: messageType === "ask" ? "assistant" : "assistant",
						timestamp: ts,
						partial,
						ask,
						say,
					}

					if (existingIndex !== -1) {
						// Replace existing message
						return prev.map((msg, idx) => (idx === existingIndex ? newMessage : msg))
					} else {
						// Add new message
						return [...prev, newMessage]
					}
				}
			})
			return
		}

		if (isTaskStateMessage(message)) {
			setTaskState({
				taskId: message.payload.taskId,
				status: message.payload.status,
				isStreaming: message.payload.isStreaming,
				enableButtons: message.payload.enableButtons,
				primaryButtonText: message.payload.primaryButtonText,
				secondaryButtonText: message.payload.secondaryButtonText,
			})
			return
		}

		if (isErrorMessage(message)) {
			const errorMessage: ChatMessage = {
				id: Date.now().toString(),
				content: `Error: ${message.payload.message}`,
				type: "error",
				timestamp: Date.now(),
			}
			setMessages((prev) => [...prev, errorMessage])
			return
		}

		console.warn("[App] Unhandled message type:", (message as any).type)
	}

	const sendMessage = () => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !input.trim()) {
			return
		}

		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			content: input,
			type: "user",
			timestamp: Date.now(),
		}

		setMessages((prev) => [...prev, userMessage])

		// Send new task message to server
		const message = {
			type: "new_task",
			payload: { text: input },
			requestId: clientId,
			timestamp: Date.now(),
		}

		wsRef.current.send(JSON.stringify(message))
		setInput("")
		setTaskState((prev) => ({ ...prev, status: "running", isStreaming: true }))
	}

	const handleApproval = (approved: boolean) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			return
		}

		const message = {
			type: "tool_approval",
			payload: { approved },
			requestId: clientId,
			timestamp: Date.now(),
		}

		wsRef.current.send(JSON.stringify(message))
	}

	const getConnectionStatusColor = () => {
		switch (connectionStatus) {
			case "connected":
				return "text-green-600"
			case "connecting":
				return "text-yellow-600"
			case "disconnected":
				return "text-red-600"
			case "error":
				return "text-red-800"
			default:
				return "text-gray-600"
		}
	}

	const getConnectionStatusText = () => {
		switch (connectionStatus) {
			case "connected":
				return "Connected"
			case "connecting":
				return "Connecting..."
			case "disconnected":
				return "Disconnected"
			case "error":
				return "Connection Error"
			default:
				return "Unknown"
		}
	}

	return (
		<div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200 p-4">
				<div className="flex justify-between items-center">
					<h1 className="text-xl font-semibold text-gray-800">Kilo Code Web POC</h1>
					<div className="flex items-center gap-2">
						<div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
						<span className={`text-sm ${getConnectionStatusColor()}`}>{getConnectionStatusText()}</span>
						{clientId && <span className="text-xs text-gray-500">ID: {clientId.slice(-8)}</span>}
					</div>
				</div>

				{taskState.taskId && (
					<div className="mt-2 text-sm text-gray-600">
						Task: {taskState.taskId} | Status: {taskState.status}
						{taskState.isStreaming && <span className="text-blue-600"> • Streaming...</span>}
					</div>
				)}
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 && (
					<div className="text-center text-gray-500 mt-8">
						<h2 className="text-lg font-medium mb-2">Welcome to Kilo Code Web</h2>
						<p>Start a conversation with the AI agent by typing a message below.</p>
						<p className="text-sm mt-2">Try: "List the files in the current project"</p>
					</div>
				)}

				{messages.map((message) => (
					<div
						key={message.id}
						className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
						<div
							className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
								message.type === "user"
									? "bg-blue-500 text-white"
									: message.type === "error"
										? "bg-red-100 text-red-800 border border-red-200"
										: "bg-white text-gray-800 border border-gray-200"
							}`}>
							<div className="text-xs text-opacity-70 mb-1">
								{message.type === "user" ? "You" : "Assistant"}
								{message.ask && ` (${message.ask})`}
								{message.say && ` (${message.say})`}
								{message.partial && " • Streaming..."}
							</div>
							<div className="whitespace-pre-wrap text-sm">{message.content}</div>
						</div>
					</div>
				))}
			</div>

			{/* Tool Approval Buttons */}
			{taskState.enableButtons && (taskState.primaryButtonText || taskState.secondaryButtonText) && (
				<div className="border-t border-gray-200 bg-white p-4">
					<div className="flex gap-2 justify-center">
						{taskState.primaryButtonText && (
							<button
								onClick={() => handleApproval(true)}
								className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
								disabled={!isConnected}>
								{taskState.primaryButtonText}
							</button>
						)}
						{taskState.secondaryButtonText && (
							<button
								onClick={() => handleApproval(false)}
								className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
								disabled={!isConnected}>
								{taskState.secondaryButtonText}
							</button>
						)}
					</div>
				</div>
			)}

			{/* Input */}
			<div className="border-t border-gray-200 bg-white p-4">
				<div className="flex gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
						placeholder={taskState.status === "idle" ? "Start a conversation..." : "Send a message..."}
						className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={!isConnected || taskState.isStreaming}
					/>
					<button
						onClick={sendMessage}
						disabled={!isConnected || !input.trim() || taskState.isStreaming}
						className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
						{taskState.isStreaming ? "Sending..." : "Send"}
					</button>
				</div>

				<div className="flex justify-between items-center mt-2 text-xs text-gray-500">
					<span>
						Status: {getConnectionStatusText()}
						{taskState.status !== "idle" && ` • Task: ${taskState.status}`}
					</span>
					<span>Press Enter to send, Shift+Enter for new line</span>
				</div>
			</div>
		</div>
	)
}
