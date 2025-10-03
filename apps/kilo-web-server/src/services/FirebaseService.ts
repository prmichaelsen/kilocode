import admin from 'firebase-admin'
import { ChatMessage } from '../SimpleWebServer'
import { FirebaseCollections } from './FirebaseCollections'

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
			await this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskHistory.taskId).set({
				...taskHistory,
				createdAt: admin.firestore.Timestamp.fromDate(taskHistory.createdAt),
				updatedAt: admin.firestore.Timestamp.fromDate(taskHistory.updatedAt),
			})
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
			return {
				...data,
				createdAt: data.createdAt.toDate(),
				updatedAt: data.updatedAt.toDate(),
			} as TaskHistory
		} catch (error) {
			console.error('[FirebaseService] Error getting task history:', error)
			throw error
		}
	}

	async getGlobalTaskHistory(limit: number = 50): Promise<TaskHistory[]> {
		try {
			const snapshot = await this.db
				.collection(FirebaseCollections.TASK_HISTORY)
				.orderBy('updatedAt', 'desc')
				.limit(limit)
				.get()

			return snapshot.docs.map(doc => {
				const data = doc.data()
				return {
					...data,
					createdAt: data.createdAt.toDate(),
					updatedAt: data.updatedAt.toDate(),
				} as TaskHistory
			})
		} catch (error) {
			console.error('[FirebaseService] Error getting global task history:', error)
			throw error
		}
	}

	// Keep the client-specific method for backward compatibility
	async getClientTaskHistory(clientId: string, limit: number = 50): Promise<TaskHistory[]> {
		// For now, return global history regardless of clientId
		return this.getGlobalTaskHistory(limit)
	}

	async updateTaskStatus(taskId: string, status: TaskHistory['status']): Promise<void> {
		try {
			await this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskId).update({
				status,
				updatedAt: admin.firestore.Timestamp.now(),
			})
		} catch (error) {
			console.error('[FirebaseService] Error updating task status:', error)
			throw error
		}
	}

	async addMessageToTask(taskId: string, message: ChatMessage): Promise<void> {
		try {
			await this.db.collection(FirebaseCollections.TASK_HISTORY).doc(taskId).update({
				messages: admin.firestore.FieldValue.arrayUnion(message),
				updatedAt: admin.firestore.Timestamp.now(),
			})
		} catch (error) {
			console.error('[FirebaseService] Error adding message to task:', error)
			throw error
		}
	}
}

export { TaskHistory }