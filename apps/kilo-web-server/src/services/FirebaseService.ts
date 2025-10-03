import admin from 'firebase-admin'
import { ChatMessage } from '../SimpleWebServer'
import { FirebaseCollections } from './FirebaseCollections'
import { prepareForFirestore, sanitizeFirestoreData } from '../utils/firestore-utils'

interface TaskHistory {
	taskId: string
	clientId: string
	messages: ChatMessage[]
	createdAt: Date
	updatedAt: Date
	status: 'active' | 'completed' | 'error' | 'deleted'
}

// Initialize Firebase Admin SDK
// This is a singleton pattern to ensure we only initialize the app once
let firebaseAdmin: admin.app.App

function getFirebaseAdmin(): admin.app.App {
	if (firebaseAdmin) {
		return firebaseAdmin
	}

	// Get the service account key from environment variable
	const serviceAccountKey = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY

	if (!serviceAccountKey) {
		throw new Error('FIREBASE_ADMIN_SERVICE_ACCOUNT_KEY environment variable is not set')
	}

	try {
		// Parse the service account key JSON
		const serviceAccount = JSON.parse(serviceAccountKey)

		// Check if any Firebase apps have been initialized
		if (!admin.apps || admin.apps.length === 0) {
			// Initialize the app
			console.log('[FirebaseService] Initializing new Firebase app...')
			firebaseAdmin = admin.initializeApp({
				credential: admin.credential.cert(serviceAccount),
			})
		} else {
			// Use the existing app
			console.log('[FirebaseService] Using existing Firebase app...')
			firebaseAdmin = admin.app()
		}

		return firebaseAdmin
	} catch (error) {
		console.error('[FirebaseService] Error initializing Firebase Admin SDK:', error)
		console.error('[FirebaseService] Error details:', {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			adminApps: admin.apps,
			adminType: typeof admin,
		})
		throw new Error(`FATAL: Failed to initialize Firebase Admin SDK: ${error}`)
	}
}

export class FirebaseService {
	private db: admin.firestore.Firestore
	private static instance: FirebaseService | null = null

	private constructor() {
		try {
			const app = getFirebaseAdmin()
			this.db = app.firestore()
			console.log('[FirebaseService] Firebase Admin initialized successfully')
		} catch (error) {
			console.error('[FirebaseService] Failed to initialize Firebase:', error)
			throw error
		}
	}

	public static getInstance(): FirebaseService {
		if (!FirebaseService.instance) {
			FirebaseService.instance = new FirebaseService()
		}
		return FirebaseService.instance
	}

	async saveTaskHistory(taskHistory: TaskHistory): Promise<void> {
		try {
			// Separate messages from main task document to avoid size limits
			const { messages, ...taskMetadata } = taskHistory
			
			const sanitizedData = prepareForFirestore({
				...taskMetadata,
				messageCount: messages.length,
				createdAt: admin.firestore.Timestamp.fromDate(taskHistory.createdAt),
				updatedAt: admin.firestore.Timestamp.fromDate(taskHistory.updatedAt),
			}, 'task history save')

			// Save task metadata without messages
			await this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskHistory.taskId).set(sanitizedData)
			
			// Save messages to subcollection if any exist
			if (messages && messages.length > 0) {
				const batch = this.db.batch()
				
				messages.forEach(message => {
					const sanitizedMessage = prepareForFirestore(message, 'message save')
					const messageRef = this.db
						.collection(FirebaseCollections.TASK_HISTORY)
						.doc(taskHistory.taskId)
						.collection('messages')
						.doc(message.id)
					
					batch.set(messageRef, {
						...sanitizedMessage,
						createdAt: admin.firestore.Timestamp.now(),
					})
				})
				
				await batch.commit()
			}
		} catch (error) {
			console.error('[FirebaseService] Error saving task history:', error)
			throw error
		}
	}

	async getTaskHistory(taskId: string): Promise<TaskHistory | null> {
		try {
			const doc = await this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskId).get()
			if (!doc.exists) {
				return null
			}

			const data = doc.data()!
			
			// Load messages from subcollection
			const messagesSnapshot = await this.db
				.collection(FirebaseCollections.TASK_HISTORY)
				.doc(taskId)
				.collection('messages')
				.orderBy('timestamp', 'asc')
				.get()

			const messages: ChatMessage[] = messagesSnapshot.docs.map(messageDoc => {
				const messageData = messageDoc.data()
				
				// Fix: Extract actual text content instead of JSON structure
				let content = messageData.content || ""
				if (typeof content === 'object' && content.text) {
					content = content.text
				}
				
				return {
					id: messageDoc.id,
					content,
					type: messageData.type || "assistant",
					timestamp: messageData.timestamp || Date.now(),
					partial: messageData.partial || false,
					messageIndex: messageData.messageIndex,
					streamId: messageData.streamId,
				} as ChatMessage
			})
			
			// Safe date parsing with fallbacks
			const parseDate = (dateField: any): Date => {
				try {
					if (!dateField) {
						return new Date()
					}
					if (typeof dateField.toDate === 'function') {
						return dateField.toDate()
					}
					if (dateField instanceof Date) {
						return dateField
					}
					if (typeof dateField === 'string' || typeof dateField === 'number') {
						return new Date(dateField)
					}
					return new Date()
				} catch (error) {
					console.warn(`[FirebaseService] Error parsing date field:`, error)
					return new Date()
				}
			}

			return {
				...data,
				messages, // Use messages from subcollection
				createdAt: parseDate(data.createdAt),
				updatedAt: parseDate(data.updatedAt),
			} as TaskHistory
		} catch (error) {
			console.error('[FirebaseService] Error getting task history:', error)
			// Return null instead of throwing to prevent crashes
			return null
		}
	}

	async getGlobalTaskHistory(limit: number = 50): Promise<TaskHistory[]> {
		try {
			const snapshot = await this.db
				.collection(FirebaseCollections.TASK_HISTORY)
				.orderBy('updatedAt', 'desc')
				.limit(limit)
				.get()

			// Safe date parsing helper
			const parseDate = (dateField: any): Date => {
				try {
					if (!dateField) {
						return new Date()
					}
					if (typeof dateField.toDate === 'function') {
						return dateField.toDate()
					}
					if (dateField instanceof Date) {
						return dateField
					}
					if (typeof dateField === 'string' || typeof dateField === 'number') {
						return new Date(dateField)
					}
					return new Date()
				} catch (error) {
					console.warn(`[FirebaseService] Error parsing date field:`, error)
					return new Date()
				}
			}

			// PERFORMANCE OPTIMIZATION: Return task metadata only, load messages on demand
			// This dramatically improves performance by avoiding expensive subcollection queries
			const tasks = snapshot.docs.map(doc => {
				const data = doc.data()
				return {
					...data,
					messages: [], // Empty array - messages loaded on demand when task is opened
					createdAt: parseDate(data.createdAt),
					updatedAt: parseDate(data.updatedAt),
				} as TaskHistory
			}).filter(task => task.taskId) // Filter out any malformed tasks

			return tasks
		} catch (error) {
			console.error('[FirebaseService] Error getting global task history:', error)
			// Return empty array instead of throwing to prevent crashes
			return []
		}
	}

	// Keep the client-specific method for backward compatibility
	async getClientTaskHistory(clientId: string, limit: number = 50): Promise<TaskHistory[]> {
		// For now, return global history regardless of clientId
		return this.getGlobalTaskHistory(limit)
	}

	async updateTaskStatus(taskId: string, status: TaskHistory['status']): Promise<void> {
		try {
			const sanitizedData = prepareForFirestore({
				status,
				updatedAt: admin.firestore.Timestamp.now(),
			}, 'task status update')

			await this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskId).update(sanitizedData)
		} catch (error) {
			console.error('[FirebaseService] Error updating task status:', error)
			throw error
		}
	}

	async addMessageToTask(taskId: string, message: ChatMessage): Promise<void> {
		try {
			// PERFORMANCE OPTIMIZATION: Use batch operations for better performance
			const batch = this.db.batch()
			const sanitizedMessage = prepareForFirestore(message, 'message add')
			
			// Store individual message in subcollection
			const messageRef = this.db
				.collection(FirebaseCollections.TASK_HISTORY)
				.doc(taskId)
				.collection('messages')
				.doc(message.id)
			
			batch.set(messageRef, {
				...sanitizedMessage,
				createdAt: admin.firestore.Timestamp.now(),
			})

			// Update task document with just metadata (no large message content)
			const taskRef = this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskId)
			const updateData = prepareForFirestore({
				lastMessageId: message.id,
				lastMessageTimestamp: message.timestamp,
				messageCount: admin.firestore.FieldValue.increment(1),
				updatedAt: admin.firestore.Timestamp.now(),
			}, 'task metadata update')

			batch.update(taskRef, updateData)
			
			// Execute both operations in a single batch for better performance
			await batch.commit()
		} catch (error) {
			console.error('[FirebaseService] Error adding message to task:', error)
			throw error
		}
	}

	// API Messages storage for conversation context
	async saveApiMessages(taskId: string, messages: any[]): Promise<void> {
		try {
			const sanitizedData = prepareForFirestore({
				taskId,
				messages: messages.map(msg => prepareForFirestore(msg, 'API message')),
				updatedAt: admin.firestore.Timestamp.now(),
			}, 'API messages save')

			await this.db.collection(FirebaseCollections.API_MESSAGES).doc(taskId).set(sanitizedData)
			console.log(`[FirebaseService] Saved ${messages.length} API messages for task ${taskId}`)
		} catch (error) {
			console.error(`[FirebaseService] Error saving API messages:`, error)
			throw error
		}
	}

	async loadApiMessages(taskId: string): Promise<any[]> {
		try {
			const doc = await this.db.collection(FirebaseCollections.API_MESSAGES).doc(taskId).get()
			if (doc.exists) {
				const data = doc.data()
				return data?.messages || []
			}
			return []
		} catch (error) {
			console.error(`[FirebaseService] Error loading API messages:`, error)
			return []
		}
	}

	async saveWorkingDirectory(taskId: string, workingDirectory: string): Promise<void> {
		try {
			const sanitizedData = prepareForFirestore({
				workingDirectory,
				updatedAt: admin.firestore.Timestamp.now(),
			}, 'working directory save')

			await this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskId).update(sanitizedData)
		} catch (error) {
			console.error('[FirebaseService] Error saving working directory:', error)
			throw error
		}
	}

	async loadWorkingDirectory(taskId: string): Promise<string | null> {
		try {
			const doc = await this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskId).get()
			if (doc.exists) {
				const data = doc.data()
				return data?.workingDirectory || null
			}
			return null
		} catch (error) {
			console.error('[FirebaseService] Error loading working directory:', error)
			return null
		}
	}
}

export { TaskHistory }