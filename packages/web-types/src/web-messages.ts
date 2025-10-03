// Base message interface for all WebSocket messages
export interface BaseWebSocketMessage {
	requestId?: string
	timestamp?: number
}

// Client to Server Messages
export interface NewTaskMessage extends BaseWebSocketMessage {
	type: "new_task"
	payload: {
		text: string
		images?: string[]
	}
}

export interface ToolApprovalMessage extends BaseWebSocketMessage {
	type: "tool_approval"
	payload: {
		approved: boolean
		feedback?: string
		images?: string[]
	}
}

export interface AskResponseMessage extends BaseWebSocketMessage {
	type: "ask_response"
	payload: {
		response: "yesButtonClicked" | "noButtonClicked" | "messageResponse"
		text?: string
		images?: string[]
	}
}

export interface TerminalOperationMessage extends BaseWebSocketMessage {
	type: "terminal_operation"
	payload: {
		operation: "continue" | "abort"
	}
}

export interface CancelTaskMessage extends BaseWebSocketMessage {
	type: "cancel_task"
	payload: {}
}

// Server to Client Messages
export interface TaskCreatedMessage extends BaseWebSocketMessage {
	type: "task_created"
	payload: {
		taskId: string
		mode: string
		workspace: string
	}
}

export interface StreamChunkMessage extends BaseWebSocketMessage {
	type: "stream_chunk"
	payload: {
		content: string
		partial: boolean
		messageType: "ask" | "say"
		ask?: string
		say?: string
		toolUse?: {
			name: string
			params: Record<string, any>
		}
		ts: number
		messageId?: string // Add unique message identifier
		streamId?: string // Add stream correlation identifier
	}
}

export interface TaskStateMessage extends BaseWebSocketMessage {
	type: "task_state"
	payload: {
		taskId: string
		status: "running" | "waiting" | "completed" | "error"
		isStreaming: boolean
		enableButtons: boolean
		primaryButtonText?: string
		secondaryButtonText?: string
	}
}

export interface ErrorMessage extends BaseWebSocketMessage {
	type: "error"
	payload: {
		message: string
		code?: string
		stack?: string
	}
}

export interface ToolExecutionMessage extends BaseWebSocketMessage {
	type: "tool_execution"
	payload: {
		toolName: string
		parameters: Record<string, any>
		result?: string
		error?: string
	}
}

export interface ConnectionStatusMessage extends BaseWebSocketMessage {
	type: "connection_status"
	payload: {
		status: "connected" | "disconnected" | "reconnecting"
		clientId: string
	}
}

// Union types for message discrimination
export type ClientMessage =
	| NewTaskMessage
	| ToolApprovalMessage
	| AskResponseMessage
	| TerminalOperationMessage
	| CancelTaskMessage

export type ServerMessage =
	| TaskCreatedMessage
	| StreamChunkMessage
	| TaskStateMessage
	| ErrorMessage
	| ToolExecutionMessage
	| ConnectionStatusMessage

export type WebSocketMessage = ClientMessage | ServerMessage

// Type guards for message handling
export function isNewTaskMessage(msg: WebSocketMessage): msg is NewTaskMessage {
	return msg.type === "new_task"
}

export function isToolApprovalMessage(msg: WebSocketMessage): msg is ToolApprovalMessage {
	return msg.type === "tool_approval"
}

export function isAskResponseMessage(msg: WebSocketMessage): msg is AskResponseMessage {
	return msg.type === "ask_response"
}

export function isStreamChunkMessage(msg: WebSocketMessage): msg is StreamChunkMessage {
	return msg.type === "stream_chunk"
}

export function isTaskStateMessage(msg: WebSocketMessage): msg is TaskStateMessage {
	return msg.type === "task_state"
}

export function isErrorMessage(msg: WebSocketMessage): msg is ErrorMessage {
	return msg.type === "error"
}

export function isConnectionStatusMessage(msg: WebSocketMessage): msg is ConnectionStatusMessage {
	return msg.type === "connection_status"
}

// Message creation helpers
export function createErrorMessage(message: string, code?: string, requestId?: string): ErrorMessage {
	return {
		type: "error",
		payload: { message, code },
		requestId,
		timestamp: Date.now(),
	}
}

export function createStreamChunkMessage(
	content: string,
	partial: boolean,
	messageType: "ask" | "say",
	ts: number,
	options?: {
		ask?: string
		say?: string
		toolUse?: { name: string; params: Record<string, any> }
		requestId?: string
	},
): StreamChunkMessage {
	return {
		type: "stream_chunk",
		payload: {
			content,
			partial,
			messageType,
			ts,
			ask: options?.ask,
			say: options?.say,
			toolUse: options?.toolUse,
		},
		requestId: options?.requestId,
		timestamp: Date.now(),
	}
}

export function createTaskStateMessage(
	taskId: string,
	status: "running" | "waiting" | "completed" | "error",
	isStreaming: boolean,
	enableButtons: boolean,
	options?: {
		primaryButtonText?: string
		secondaryButtonText?: string
		requestId?: string
	},
): TaskStateMessage {
	return {
		type: "task_state",
		payload: {
			taskId,
			status,
			isStreaming,
			enableButtons,
			primaryButtonText: options?.primaryButtonText,
			secondaryButtonText: options?.secondaryButtonText,
		},
		requestId: options?.requestId,
		timestamp: Date.now(),
	}
}
export function createTaskCreatedMessage(
	taskId: string,
	mode: string,
	workspace: string,
	requestId?: string,
): TaskCreatedMessage {
	return {
		type: "task_created",
		payload: {
			taskId,
			mode,
			workspace,
		},
		requestId,
		timestamp: Date.now(),
	}
}

export function createConnectionStatusMessage(
	status: "connected" | "disconnected" | "reconnecting",
	clientId: string,
	requestId?: string,
): ConnectionStatusMessage {
	return {
		type: "connection_status",
		payload: {
			status,
			clientId,
		},
		requestId,
		timestamp: Date.now(),
	}
}
