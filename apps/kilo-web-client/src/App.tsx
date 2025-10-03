import React, { useState, useEffect, useRef, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import {
	WebSocketMessage,
	ServerMessage,
	isStreamChunkMessage,
	isTaskStateMessage,
	isErrorMessage,
	isConnectionStatusMessage,
	TaskCreatedMessage,
} from "@roo-code/web-types"
import type { ClineMessage } from "@roo-code/types"
import "./App.css"

// Add missing type guard
function isTaskCreatedMessage(msg: ServerMessage): msg is TaskCreatedMessage {
	return msg.type === "task_created"
}

interface ChatMessage {
	id: string
	content: string
	type: "user" | "assistant" | "tool" | "error"
	timestamp: number
	partial?: boolean
	ask?: string
	say?: string
	messageIndex?: number // Add sequence number for better correlation
	streamId?: string // Add unique stream identifier
}

interface TaskState {
	taskId?: string
	status: "idle" | "running" | "waiting" | "completed" | "error"
	isStreaming: boolean
	enableButtons: boolean
	primaryButtonText?: string
	secondaryButtonText?: string
}

// Dynamic WebSocket URL based on current host
const getWebSocketUrl = () => {
	if (process.env.REACT_APP_WS_URL) {
		return process.env.REACT_APP_WS_URL
	}
	
	// Use current host for WebSocket connection
	const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
	const host = window.location.hostname
	const port = window.location.hostname === 'localhost' ? '3001' : '3001'
	
	return `${protocol}//${host}:${port}/ws`
}

const WS_URL = getWebSocketUrl()

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
	const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
	const [clientId, setClientId] = useState<string>("")
	const [messageCounter, setMessageCounter] = useState(0)
	const [activeStreamIds, setActiveStreamIds] = useState<Set<string>>(new Set())
	const [isHistoryOpen, setIsHistoryOpen] = useState(false)
	const [taskHistory, setTaskHistory] = useState<any[]>([])
	const [historyLoading, setHistoryLoading] = useState(false)

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
			// Automatically load task history when connected
			setTimeout(() => {
				loadTaskHistory()
			}, 500) // Small delay to ensure connection is stable
			return
		}

		if (isTaskCreatedMessage(message)) {
			// Handle task creation - update task state with new task info
			setTaskState((prev) => ({
				...prev,
				taskId: message.payload.taskId,
				status: "running",
				isStreaming: true,
			}))
			return
		}

		if (isStreamChunkMessage(message)) {
			const { content, partial, messageType, ask, say, ts, messageId, streamId } = message.payload

			setMessages((prev) => {
				// Use server-provided streamId if available, otherwise generate one
				const effectiveStreamId = streamId || `${currentTaskId || 'unknown'}_${messageType}_${say || ask || 'default'}_${Math.floor(ts / 1000)}`
				const effectiveMessageId = messageId || `msg_${ts}_${Math.random().toString(36).substr(2, 9)}`
				
				// Find existing message with same stream ID for streaming updates
				const existingIndex = prev.findIndex((msg) =>
					(msg.streamId === effectiveStreamId && msg.partial !== false) ||
					(msg.id === effectiveMessageId && msg.partial !== false)
				)

				if (existingIndex !== -1) {
					// Update existing message with new content (replace, don't append)
					return prev.map((msg, idx) =>
						idx === existingIndex
							? {
									...msg,
									content: content, // Replace content entirely for clean streaming
									partial,
									timestamp: ts, // Update timestamp to latest
								}
							: msg,
					)
				} else {
					// Add new message with server-provided IDs
					const newMessage: ChatMessage = {
						id: effectiveMessageId,
						content: content,
						type: messageType === "ask" ? "assistant" : "assistant",
						timestamp: ts,
						partial,
						ask,
						say,
						messageIndex: prev.length,
						streamId: effectiveStreamId,
					}
					return [...prev, newMessage]
				}
			})
			
			// Update task state when streaming completes
			if (!partial) {
				setTaskState((prev) => ({
					...prev,
					isStreaming: false,
					status: "idle" // Reset to idle when streaming completes
				}))
				
				// Remove from active stream IDs when complete
				const effectiveStreamId = streamId || `${currentTaskId || 'unknown'}_${messageType}_${say || ask || 'default'}_${Math.floor(ts / 1000)}`
				setActiveStreamIds(prev => {
					const newSet = new Set(prev)
					newSet.delete(effectiveStreamId)
					return newSet
				})
			} else {
				// Add to active stream IDs when streaming
				const effectiveStreamId = streamId || `${currentTaskId || 'unknown'}_${messageType}_${say || ask || 'default'}_${Math.floor(ts / 1000)}`
				setActiveStreamIds(prev => new Set(prev).add(effectiveStreamId))
			}
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
			
			// Update current task ID when task state changes
			setCurrentTaskId(message.payload.taskId)
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

		// Handle task history response
		if ((message as any).type === "task_history_response") {
			const payload = (message as any).payload
			setHistoryLoading(false)
			if (payload.success) {
				setTaskHistory(payload.tasks || [])
			} else {
				console.error("[App] Failed to load task history:", payload.error)
			}
			return
		}

		// Handle task resumed
		if ((message as any).type === "task_resumed") {
			const payload = (message as any).payload
			// Load the resumed task messages
			setMessages(payload.messages || [])
			setCurrentTaskId(payload.taskId)
			setTaskState((prev) => ({
				...prev,
				taskId: payload.taskId,
				status: payload.status === "completed" ? "idle" : "idle",
			}))
			return
		}

		// Handle task deleted response
		if ((message as any).type === "task_deleted_response") {
			const payload = (message as any).payload
			if (payload.success) {
				// Remove task from history
				setTaskHistory((prev) => prev.filter((task) => task.taskId !== payload.taskId))
			} else {
				console.error("[App] Failed to delete task:", payload.error)
			}
			return
		}

		console.warn("[App] Unhandled message type:", (message as any).type)
	}

	const sendMessage = () => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !input.trim()) {
			return
		}

		const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		const currentMessageIndex = messageCounter
		
		const userMessage: ChatMessage = {
			id: messageId,
			content: input,
			type: "user",
			timestamp: Date.now(),
			messageIndex: currentMessageIndex,
		}

		setMessages((prev) => [...prev, userMessage])
		setMessageCounter(prev => prev + 1)

		// Determine message type based on whether we have an active task
		const messageType = currentTaskId ? "continue_task" : "new_task"
		
		const message = {
			type: messageType,
			payload: {
				text: input,
				taskId: currentTaskId, // Include taskId for continuing tasks
				messageIndex: currentMessageIndex // Include message sequence
			},
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

	const loadTaskHistory = () => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			return
		}

		setHistoryLoading(true)
		const message = {
			type: "get_task_history",
			payload: { limit: 20 },
			requestId: clientId,
			timestamp: Date.now(),
		}

		wsRef.current.send(JSON.stringify(message))
	}

	const resumeTask = (taskId: string) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			return
		}

		const message = {
			type: "resume_task",
			payload: {
				taskId,
				mode: "continue"
			},
			requestId: clientId,
			timestamp: Date.now(),
		}

		wsRef.current.send(JSON.stringify(message))
	}

	const deleteTask = (taskId: string) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			return
		}

		const message = {
			type: "delete_task",
			payload: { taskId },
			requestId: clientId,
			timestamp: Date.now(),
		}

		wsRef.current.send(JSON.stringify(message))
	}

	const getConnectionStatusColor = () => {
		switch (connectionStatus) {
			case "connected":
				return "text-green-400"
			case "connecting":
				return "text-yellow-400"
			case "disconnected":
				return "text-red-400"
			case "error":
				return "text-red-300"
			default:
				return "text-gray-400"
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
		<div className="flex h-screen bg-gray-900 text-gray-100">
			{/* Task History Sidebar */}
			{isHistoryOpen && (
				<div className="w-[90vw] md:w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
					{/* History Header */}
					<div className="p-4 border-b border-gray-700">
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold">Task History</h2>
							<button
								onClick={() => setIsHistoryOpen(false)}
								className="text-gray-400 hover:text-gray-200">
								✕
							</button>
						</div>
						<button
							onClick={loadTaskHistory}
							disabled={historyLoading}
							className="mt-2 w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
							{historyLoading ? "Loading..." : "Refresh History"}
						</button>
					</div>

					{/* History List */}
					<div className="flex-1 overflow-y-auto p-2">
						{taskHistory.length === 0 ? (
							<div className="text-center text-gray-400 mt-8">
								<p>No task history yet</p>
								<p className="text-sm mt-2">Start a conversation to see your tasks here</p>
							</div>
						) : (
							taskHistory.map((task) => (
								<div
									key={task.taskId}
									className="mb-2 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
									onClick={() => resumeTask(task.taskId)}>
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<h3 className="text-sm font-medium text-gray-100 truncate">
												{task.messages?.[0]?.content?.slice(0, 50) || "Untitled Task"}...
											</h3>
											<p className="text-xs text-gray-400 mt-1">
												{new Date(task.updatedAt).toLocaleDateString()} • {task.messages?.length || 0} messages
											</p>
											<span className={`inline-block px-2 py-1 text-xs rounded mt-2 ${
												task.status === "completed" ? "bg-green-600 text-green-100" :
												task.status === "error" ? "bg-red-600 text-red-100" :
												"bg-blue-600 text-blue-100"
											}`}>
												{task.status}
											</span>
										</div>
										<button
											onClick={(e) => {
												e.stopPropagation()
												deleteTask(task.taskId)
											}}
											className="text-gray-400 hover:text-red-400 ml-2">
											🗑️
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			)}

			{/* Main Chat Area */}
			<div className="flex flex-col flex-1">
				{/* Header */}
				<div className="bg-gray-800 border-b border-gray-700 p-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-3">
							<button
								onClick={() => setIsHistoryOpen(!isHistoryOpen)}
								className="text-gray-400 hover:text-gray-200">
								📋
							</button>
							<h1 className="text-xl font-semibold text-gray-100">Kilo Code Web POC</h1>
						</div>
						<div className="flex items-center gap-2">
							<div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
							<span className={`text-sm ${getConnectionStatusColor()}`}>{getConnectionStatusText()}</span>
							{clientId && <span className="text-xs text-gray-400">ID: {clientId.slice(-8)}</span>}
						</div>
					</div>

					{taskState.taskId && (
						<div className="mt-2 text-sm text-gray-300">
							Task: {taskState.taskId} | Status: {taskState.status}
							{taskState.isStreaming && <span className="text-blue-400"> • Streaming...</span>}
						</div>
					)}
				</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-0 md:p-4 space-y-4">
				{messages.length === 0 && (
					<div className="text-center text-gray-400 mt-8">
						<h2 className="text-lg font-medium mb-2">Welcome to Kilo Code Web</h2>
						<p>Start a conversation with the AI agent by typing a message below.</p>
						<p className="text-sm mt-2">Try: "List the files in the current project"</p>
					</div>
				)}

				{messages.map((message) => (
					<div
						key={message.id}
						className={`${message.type === "user" ? "flex justify-end" : "w-full"}`}>
						<div
							className={`px-2 md:px-4 py-3 ${
								message.type === "user"
									? "bg-blue-600 text-white max-w-xs lg:max-w-md rounded-lg mx-2 md:mx-0"
									: message.type === "error"
										? "bg-red-900 text-red-200 border border-red-700 w-full rounded-none md:rounded-lg"
										: "bg-gray-800 text-gray-100 border border-gray-700 w-full rounded-none md:rounded-lg"
							}`}>
							<div className="text-xs opacity-70 mb-2">
								{message.type === "user" ? "You" : "Assistant"}
								{message.ask && ` (${message.ask})`}
								{message.say && ` (${message.say})`}
								{message.partial && " • Streaming..."}
							</div>
							<div className="text-sm">
								<ReactMarkdown
									components={{
										code: ({ className, children, ...props }) => {
											const isInline = !className?.includes("language-")
											return isInline ? (
												<code
													className="bg-gray-700 text-gray-200 px-1 py-0.5 rounded text-xs font-mono"
													{...props}>
													{children}
												</code>
											) : (
												<pre className="bg-gray-900 border border-gray-600 p-3 rounded-lg overflow-x-auto mt-2 mb-2">
													<code className="text-xs font-mono text-gray-200" {...props}>
														{children}
													</code>
												</pre>
											)
										},
										p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
										ul: ({ children }) => (
											<ul className="list-disc list-inside mb-2 text-gray-200">{children}</ul>
										),
										ol: ({ children }) => (
											<ol className="list-decimal list-inside mb-2 text-gray-200">{children}</ol>
										),
										li: ({ children }) => <li className="mb-1">{children}</li>,
										h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-gray-100">{children}</h1>,
										h2: ({ children }) => (
											<h2 className="text-md font-semibold mb-2 text-gray-100">{children}</h2>
										),
										h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-gray-200">{children}</h3>,
									}}>
									{message.content}
								</ReactMarkdown>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Tool Approval Buttons */}
			{taskState.enableButtons && (taskState.primaryButtonText || taskState.secondaryButtonText) && (
				<div className="border-t border-gray-700 bg-gray-800 p-3 md:p-4">
					<div className="flex gap-2 justify-center">
						{taskState.primaryButtonText && (
							<button
								onClick={() => handleApproval(true)}
								className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
								disabled={!isConnected}>
								{taskState.primaryButtonText}
							</button>
						)}
						{taskState.secondaryButtonText && (
							<button
								onClick={() => handleApproval(false)}
								className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
								disabled={!isConnected}>
								{taskState.secondaryButtonText}
							</button>
						)}
					</div>
				</div>
			)}

			{/* Input */}
			<div className="border-t border-gray-700 bg-gray-800 p-3 md:p-4">
				<div className="flex gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
						placeholder={taskState.status === "idle" ? "Send a message..." : "Send a message..."}
						className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						disabled={!isConnected || taskState.isStreaming}
					/>
					<button
						onClick={sendMessage}
						disabled={!isConnected || !input.trim() || taskState.isStreaming}
						className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
						{taskState.isStreaming ? "Sending..." : "Send"}
					</button>
				</div>

				<div className="flex justify-between items-center mt-2 text-xs text-gray-400">
					<span>
						Status: {getConnectionStatusText()}
						{taskState.status !== "idle" && ` • Task: ${taskState.status}`}
					</span>
					<span>Press Enter to send, Shift+Enter for new line</span>
				</div>
			</div>
			</div>
		</div>
	)
}
