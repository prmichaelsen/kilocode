import WebSocket from "ws"

export interface ErrorContext {
	clientId?: string
	operation?: string
	timestamp: number
}

export class WebServerErrorHandler {
	private errorLog: Array<{ error: Error; context: ErrorContext; timestamp: number }> = []
	private maxLogSize = 1000

	logError(error: Error, context: ErrorContext) {
		const logEntry = {
			error,
			context,
			timestamp: Date.now(),
		}

		this.errorLog.push(logEntry)

		// Keep log size manageable
		if (this.errorLog.length > this.maxLogSize) {
			this.errorLog = this.errorLog.slice(-this.maxLogSize)
		}

		// Log to console with context
		console.error(
			`[WebServerError] ${context.operation || "Unknown"} failed for client ${context.clientId || "unknown"}:`,
			error.message,
		)

		// Log stack trace for debugging
		if (error.stack) {
			console.error(error.stack)
		}
	}

	sendErrorToClient(ws: WebSocket, error: Error, context: ErrorContext) {
		if (ws.readyState === WebSocket.OPEN) {
			const errorMessage = {
				type: "error",
				payload: {
					message: error.message,
					code: (error as any).code || "UNKNOWN_ERROR",
					operation: context.operation,
				},
				timestamp: Date.now(),
			}

			try {
				ws.send(JSON.stringify(errorMessage))
			} catch (sendError) {
				console.error("[WebServerErrorHandler] Failed to send error message to client:", sendError)
			}
		}
	}

	getRecentErrors(count: number = 10): Array<{ error: Error; context: ErrorContext; timestamp: number }> {
		return this.errorLog.slice(-count)
	}

	getErrorStats() {
		const now = Date.now()
		const oneHourAgo = now - 60 * 60 * 1000
		const recentErrors = this.errorLog.filter((entry) => entry.timestamp > oneHourAgo)

		return {
			totalErrors: this.errorLog.length,
			recentErrors: recentErrors.length,
			errorRate: recentErrors.length / 60, // errors per minute in last hour
			lastError: this.errorLog.length > 0 ? this.errorLog[this.errorLog.length - 1] : null,
		}
	}

	clearErrorLog() {
		this.errorLog = []
		console.log("[WebServerErrorHandler] Error log cleared")
	}
}

export class ConnectionManager {
	private reconnectAttempts = new Map<string, number>()
	private maxReconnectAttempts = 5
	private reconnectDelay = 1000 // Start with 1 second

	shouldAttemptReconnect(clientId: string): boolean {
		const attempts = this.reconnectAttempts.get(clientId) || 0
		return attempts < this.maxReconnectAttempts
	}

	getReconnectDelay(clientId: string): number {
		const attempts = this.reconnectAttempts.get(clientId) || 0
		// Exponential backoff: 1s, 2s, 4s, 8s, 16s
		return this.reconnectDelay * Math.pow(2, attempts)
	}

	recordReconnectAttempt(clientId: string): number {
		const currentAttempts = this.reconnectAttempts.get(clientId) || 0
		const newAttempts = currentAttempts + 1
		this.reconnectAttempts.set(clientId, newAttempts)
		return newAttempts
	}

	resetReconnectAttempts(clientId: string) {
		this.reconnectAttempts.delete(clientId)
	}

	cleanupClient(clientId: string) {
		this.reconnectAttempts.delete(clientId)
	}

	getConnectionStats() {
		return {
			clientsWithReconnectAttempts: this.reconnectAttempts.size,
			totalReconnectAttempts: Array.from(this.reconnectAttempts.values()).reduce(
				(sum, attempts) => sum + attempts,
				0,
			),
		}
	}
}
