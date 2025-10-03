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
			// Sanitize messages for Firebase storage - remove complex nested objects
			const sanitizedMessages = messages.map(msg => {
				// Create a simplified version that Firebase can handle
				return {
					role: msg.role,
					content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
					ts: msg.ts || Date.now(),
					// Only include simple properties, avoid complex nested objects
				}
			})
			
			// Store sanitized API messages in Firebase under a separate collection
			await this.firebaseService.saveApiMessages(taskId, sanitizedMessages)
		} catch (error) {
			console.error(`[FirebaseTaskStorageAdapter] Failed to save API messages for task ${taskId}:`, error)
			// Don't throw - allow task to continue even if storage fails
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
			// Convert ClineMessages to ChatMessages for storage
			const chatMessages = messages.map(msg => ({
				id: `cline_${msg.ts}`,
				content: msg.text || "",
				type: (msg.type === "ask" ? "user" : "assistant") as "user" | "assistant",
				timestamp: msg.ts,
				partial: msg.partial || false,
				// Store minimal metadata to avoid nested entity issues
				messageType: msg.type,
				ask: msg.ask || "",
				say: msg.say || "",
			}))

			// Use the new subcollection approach via addMessageToTask
			for (const chatMessage of chatMessages) {
				try {
					await this.firebaseService.addMessageToTask(taskId, chatMessage)
				} catch (messageError) {
					console.error(`[FirebaseTaskStorageAdapter] Failed to save individual message ${chatMessage.id}:`, messageError)
					// Continue with other messages even if one fails
				}
			}
		} catch (error) {
			console.error(`[FirebaseTaskStorageAdapter] Failed to save Cline messages for task ${taskId}:`, error)
			// Don't throw - allow task to continue even if storage fails
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