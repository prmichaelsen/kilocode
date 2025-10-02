import WebSocket from "ws"
import { WebClineProvider } from "@web/adapters/ClineProviderAdapter"
import { WebExtensionContext } from "@web/adapters/ExtensionContextAdapter"
import { createTaskCreatedMessage, createErrorMessage, createTaskStateMessage } from "@web/types/web-messages"
import type { Task } from "@src/core/task/Task"
import type { ClineAskResponse } from "@src/shared/WebviewMessage"

export class WebTaskManager {
	private providers = new Map<string, WebClineProvider>()
	private contexts = new Map<string, WebExtensionContext>()
	private tasks = new Map<string, Task>()

	async createTask(clientId: string, text: string, images?: string[], ws?: WebSocket): Promise<void> {
		try {
			console.log(`[WebTaskManager] Creating task for client ${clientId}`)

			// Get or create provider for this client
			let provider = this.providers.get(clientId)
			if (!provider) {
				const context = new WebExtensionContext(`./storage/${clientId}`)
				await context.loadPersistedData()

				provider = new WebClineProvider(context, clientId)
				if (ws) {
					provider.setWebSocketConnection(ws)
				}
				provider.setupTaskEventStreaming()

				this.providers.set(clientId, provider)
				this.contexts.set(clientId, context)
			}

			// Create the task using the provider
			const task = await provider.createTask(text, images)
			this.tasks.set(`${clientId}:${task.taskId}`, task)

			console.log(`[WebTaskManager] Task created: ${task.taskId} for client ${clientId}`)

			// Send task created message to client
			if (ws && ws.readyState === WebSocket.OPEN) {
				const message = createTaskCreatedMessage(task.taskId, await task.getTaskMode(), task.cwd)
				ws.send(JSON.stringify(message))
			}
		} catch (error) {
			console.error(`[WebTaskManager] Error creating task for client ${clientId}:`, error)

			if (ws && ws.readyState === WebSocket.OPEN) {
				const errorMessage = createErrorMessage(
					error instanceof Error ? error.message : "Failed to create task",
					"TASK_CREATION_ERROR",
				)
				ws.send(JSON.stringify(errorMessage))
			}
		}
	}

	async handleToolApproval(
		clientId: string,
		payload: { approved: boolean; feedback?: string; images?: string[] },
		ws: WebSocket,
	): Promise<void> {
		try {
			const provider = this.providers.get(clientId)
			if (!provider) {
				throw new Error(`No provider found for client ${clientId}`)
			}

			const currentTask = provider.getCurrentTask()
			if (!currentTask) {
				throw new Error(`No active task found for client ${clientId}`)
			}

			// Handle the approval/rejection
			if (payload.approved) {
				currentTask.handleWebviewAskResponse("yesButtonClicked", payload.feedback, payload.images)
			} else {
				currentTask.handleWebviewAskResponse("noButtonClicked", payload.feedback, payload.images)
			}
		} catch (error) {
			console.error(`[WebTaskManager] Error handling tool approval:`, error)
			const errorMessage = createErrorMessage(
				error instanceof Error ? error.message : "Failed to handle tool approval",
				"TOOL_APPROVAL_ERROR",
			)
			ws.send(JSON.stringify(errorMessage))
		}
	}

	async handleAskResponse(
		clientId: string,
		payload: { response: ClineAskResponse; text?: string; images?: string[] },
		ws: WebSocket,
	): Promise<void> {
		try {
			const provider = this.providers.get(clientId)
			if (!provider) {
				throw new Error(`No provider found for client ${clientId}`)
			}

			const currentTask = provider.getCurrentTask()
			if (!currentTask) {
				throw new Error(`No active task found for client ${clientId}`)
			}

			currentTask.handleWebviewAskResponse(payload.response, payload.text, payload.images)
		} catch (error) {
			console.error(`[WebTaskManager] Error handling ask response:`, error)
			const errorMessage = createErrorMessage(
				error instanceof Error ? error.message : "Failed to handle ask response",
				"ASK_RESPONSE_ERROR",
			)
			ws.send(JSON.stringify(errorMessage))
		}
	}

	async handleTerminalOperation(clientId: string, operation: "continue" | "abort", ws: WebSocket): Promise<void> {
		try {
			const provider = this.providers.get(clientId)
			if (!provider) {
				throw new Error(`No provider found for client ${clientId}`)
			}

			const currentTask = provider.getCurrentTask()
			if (!currentTask) {
				throw new Error(`No active task found for client ${clientId}`)
			}

			await currentTask.handleTerminalOperation(operation)
		} catch (error) {
			console.error(`[WebTaskManager] Error handling terminal operation:`, error)
			const errorMessage = createErrorMessage(
				error instanceof Error ? error.message : "Failed to handle terminal operation",
				"TERMINAL_OPERATION_ERROR",
			)
			ws.send(JSON.stringify(errorMessage))
		}
	}

	async cancelTask(clientId: string, ws: WebSocket): Promise<void> {
		try {
			const provider = this.providers.get(clientId)
			if (!provider) {
				throw new Error(`No provider found for client ${clientId}`)
			}

			await provider.cancelTask()
			console.log(`[WebTaskManager] Task cancelled for client ${clientId}`)
		} catch (error) {
			console.error(`[WebTaskManager] Error cancelling task:`, error)
			const errorMessage = createErrorMessage(
				error instanceof Error ? error.message : "Failed to cancel task",
				"TASK_CANCELLATION_ERROR",
			)
			ws.send(JSON.stringify(errorMessage))
		}
	}

	// Cleanup resources for a disconnected client
	cleanupClient(clientId: string): void {
		try {
			const provider = this.providers.get(clientId)
			if (provider) {
				provider.dispose()
				this.providers.delete(clientId)
			}

			const context = this.contexts.get(clientId)
			if (context) {
				context.dispose()
				this.contexts.delete(clientId)
			}

			// Clean up tasks for this client
			const tasksToDelete: string[] = []
			this.tasks.forEach((task, key) => {
				if (key.startsWith(`${clientId}:`)) {
					tasksToDelete.push(key)
				}
			})

			tasksToDelete.forEach((key) => {
				this.tasks.delete(key)
			})

			console.log(`[WebTaskManager] Cleaned up resources for client ${clientId}`)
		} catch (error) {
			console.error(`[WebTaskManager] Error cleaning up client ${clientId}:`, error)
		}
	}

	// Get statistics
	getStats() {
		return {
			connectedClients: this.providers.size,
			activeTasks: this.tasks.size,
			timestamp: new Date().toISOString(),
		}
	}
}
