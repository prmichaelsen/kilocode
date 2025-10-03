import type { TaskStorageAdapter } from "@roo-code/shared"
import type { ClineMessage } from "@roo-code/types"
import { FirebaseService } from "../services/FirebaseService"
import { prepareForFirestore } from "../utils/firestore-utils"

export class FirebaseTaskStorageAdapter implements TaskStorageAdapter {
	private firebaseService: FirebaseService

	constructor() {
		this.firebaseService = FirebaseService.getInstance()
	}

	async saveApiMessages(taskId: string, messages: any[]): Promise<void> {
		try {
			// Store API messages in Firebase under a separate collection
			await this.firebaseService.saveApiMessages(taskId, messages)
		} catch (error) {
			console.error(`[FirebaseTaskStorageAdapter] Failed to save API messages for task ${taskId}:`, error)
			throw error
		}
	}

	async loadApiMessages(taskId: string): Promise<any[]> {
		try {
			const messages = await this.firebaseService.loadApiMessages(taskId)
			return messages || []
		} catch (error) {
			console.error(`[FirebaseTaskStorageAdapter] Failed to load API messages for task ${taskId}:`, error)
			return []
		}
	}

	async saveClineMessages(taskId: string, messages: ClineMessage[]): Promise<void> {
		try {
			// Update the task history with the latest messages
			const taskHistory = await this.firebaseService.getTaskHistory(taskId)
			if (taskHistory) {
				// Ensure we always create a proper array structure
				taskHistory.messages = messages.map(msg => {
					// Create the message object with all required fields
					const chatMessage = {
						id: `${msg.ts}`,
						content: msg.text || "",
						type: (msg.type === "ask" ? "user" : "assistant") as "user" | "assistant",
						timestamp: msg.ts,
						// Only include clineMessage if it has defined values
						...(msg.text !== undefined || msg.ask !== undefined || msg.say !== undefined ? {
							clineMessage: {
								type: msg.type,
								ts: msg.ts,
								...(msg.text !== undefined && { text: msg.text }),
								...(msg.ask !== undefined && { ask: msg.ask }),
								...(msg.say !== undefined && { say: msg.say }),
								...(msg.partial !== undefined && { partial: msg.partial }),
							}
						} : {})
					}
					
					return chatMessage
				})
				taskHistory.updatedAt = new Date()
				await this.firebaseService.saveTaskHistory(taskHistory)
			} else {
				// If no task history exists, create a new one with proper array initialization
				const newTaskHistory = {
					taskId,
					clientId: 'unknown', // We don't have clientId in this context
					messages: messages.map(msg => ({
						id: `${msg.ts}`,
						content: msg.text || "",
						type: (msg.type === "ask" ? "user" : "assistant") as "user" | "assistant",
						timestamp: msg.ts,
						clineMessage: {
							type: msg.type,
							ts: msg.ts,
							...(msg.text !== undefined && { text: msg.text }),
							...(msg.ask !== undefined && { ask: msg.ask }),
							...(msg.say !== undefined && { say: msg.say }),
							...(msg.partial !== undefined && { partial: msg.partial }),
						}
					})),
					createdAt: new Date(),
					updatedAt: new Date(),
					status: 'active' as const
				}
				await this.firebaseService.saveTaskHistory(newTaskHistory)
			}
		} catch (error) {
			console.error(`[FirebaseTaskStorageAdapter] Failed to save Cline messages for task ${taskId}:`, error)
			throw error
		}
	}

	async loadClineMessages(taskId: string): Promise<ClineMessage[]> {
		try {
			const taskHistory = await this.firebaseService.getTaskHistory(taskId)
			if (taskHistory && taskHistory.messages) {
				// Ensure messages is an array before processing
				const messages = Array.isArray(taskHistory.messages) ? taskHistory.messages : []
				
				// Extract ClineMessage objects from stored messages
				return messages
					.map(msg => (msg as any).clineMessage)
					.filter(msg => msg) // Filter out any null/undefined messages
			}
			return []
		} catch (error) {
			console.error(`[FirebaseTaskStorageAdapter] Failed to load Cline messages for task ${taskId}:`, error)
			return []
		}
	}
}