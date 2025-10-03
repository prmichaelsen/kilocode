/**
 * Firebase Firestore collection names for Kilo Code Web Server
 * All collections are prefixed with "kilo." for namespace organization
 */

export const FirebaseCollections = {
	// Task-related collections
	TASK_HISTORY: 'kilo.taskHistory',
	TASK_MESSAGES: 'kilo.taskMessages',
	TASK_METADATA: 'kilo.taskMetadata',
	API_MESSAGES: 'kilo.apiMessages',
	
	// User and session collections
	USER_SESSIONS: 'kilo.userSessions',
	CLIENT_SESSIONS: 'kilo.clientSessions',
	
	// Analytics and monitoring
	USAGE_ANALYTICS: 'kilo.usageAnalytics',
	ERROR_LOGS: 'kilo.errorLogs',
	PERFORMANCE_METRICS: 'kilo.performanceMetrics',
	
	// Configuration and settings
	USER_PREFERENCES: 'kilo.userPreferences',
	SYSTEM_CONFIG: 'kilo.systemConfig',
	
	// Future collections for additional features
	SHARED_TASKS: 'kilo.sharedTasks',
	TASK_TEMPLATES: 'kilo.taskTemplates',
	USER_FEEDBACK: 'kilo.userFeedback',
} as const

/**
 * Type-safe collection name type
 */
export type CollectionName = typeof FirebaseCollections[keyof typeof FirebaseCollections]

/**
 * Helper function to get collection reference with type safety
 */
export function getCollectionName(collection: keyof typeof FirebaseCollections): string {
	return FirebaseCollections[collection]
}

/**
 * Validate that a collection name follows the "kilo." prefix convention
 */
export function isValidKiloCollection(collectionName: string): boolean {
	return collectionName.startsWith('kilo.') && collectionName.length > 5
}

/**
 * Get all collection names as an array
 */
export function getAllCollectionNames(): string[] {
	return Object.values(FirebaseCollections)
}