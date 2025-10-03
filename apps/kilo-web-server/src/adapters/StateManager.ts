import type { GlobalState, HistoryItem, ClineMessage } from "@roo-code/types"
import * as path from "path"
import * as fs from "fs/promises"

export class WebStateManager {
	private state = new Map<string, any>()
	private taskHistory: HistoryItem[] = []
	private conversations = new Map<string, ClineMessage[]>()
	private storageDir: string

	constructor(storageDir: string = "./storage") {
		this.storageDir = storageDir
		this.initializeDefaults()
	}

	private initializeDefaults() {
		// Set default values for required GlobalState properties
		this.state.set("currentApiConfigName", "default")
		this.state.set("listApiConfigMeta", [])
		this.state.set("mode", "code")
		this.state.set("customModes", [])
		this.state.set("taskHistory", [])
		this.state.set("experiments", {})
		this.state.set("telemetrySetting", "unset")
		this.state.set("alwaysAllowReadOnly", true)
		this.state.set("alwaysAllowWrite", true)
		this.state.set("alwaysAllowExecute", true)
		this.state.set("alwaysAllowBrowser", true)
		this.state.set("alwaysAllowMcp", true)
		this.state.set("autoApprovalEnabled", true)
		this.state.set("diffEnabled", true)
		this.state.set("enableCheckpoints", true)
		this.state.set("mcpEnabled", true)
		this.state.set("browserToolEnabled", true)
	}

	// Implement GlobalState interface methods
	getValue<K extends keyof GlobalState>(key: K): GlobalState[K] {
		return this.state.get(key as string)
	}

	async setValue<K extends keyof GlobalState>(key: K, value: GlobalState[K]): Promise<void> {
		this.state.set(key as string, value)

		// Update specific collections
		if (key === "taskHistory") {
			this.taskHistory = value as HistoryItem[]
		}

		// Persist critical state to file system
		if (this.shouldPersistKey(key)) {
			await this.persistState()
		}
	}

	getValues(): GlobalState {
		const values: Partial<GlobalState> = {}

		// Convert Map to object
		for (const [key, value] of this.state.entries()) {
			;(values as any)[key] = value
		}

		return values as GlobalState
	}

	async setValues(values: Partial<GlobalState>): Promise<void> {
		for (const [key, value] of Object.entries(values)) {
			await this.setValue(key as keyof GlobalState, value)
		}
	}

	// Task history management
	async updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]> {
		const existingIndex = this.taskHistory.findIndex((h) => h.id === item.id)

		if (existingIndex !== -1) {
			this.taskHistory[existingIndex] = item
		} else {
			this.taskHistory.push(item)
		}

		await this.setValue("taskHistory", this.taskHistory)
		return this.taskHistory
	}

	async deleteTaskFromHistory(taskId: string): Promise<void> {
		this.taskHistory = this.taskHistory.filter((task) => task.id !== taskId)
		await this.setValue("taskHistory", this.taskHistory)

		// Also clean up conversation history
		this.conversations.delete(taskId)
	}

	// Conversation management
	getConversation(taskId: string): ClineMessage[] {
		return this.conversations.get(taskId) || []
	}

	async saveConversation(taskId: string, messages: ClineMessage[]): Promise<void> {
		this.conversations.set(taskId, messages)

		// Persist to file
		try {
			const conversationFile = path.join(this.storageDir, `conversation_${taskId}.json`)
			await fs.writeFile(conversationFile, JSON.stringify(messages, null, 2))
		} catch (error) {
			console.error(`Failed to persist conversation for task ${taskId}:`, error)
		}
	}

	// Determine which keys should be persisted to disk
	private shouldPersistKey(key: keyof GlobalState): boolean {
		const persistKeys: (keyof GlobalState)[] = [
			"taskHistory",
			"currentApiConfigName",
			"listApiConfigMeta",
			"mode",
			"customModes",
			"customInstructions",
			"telemetrySetting",
		]
		return persistKeys.includes(key)
	}

	// Persist state to file system
	private async persistState() {
		try {
			await fs.mkdir(this.storageDir, { recursive: true })

			const stateFile = path.join(this.storageDir, "globalState.json")
			const stateToSave: Record<string, any> = {}

			// Only save persistable keys
			for (const [key, value] of this.state.entries()) {
				if (this.shouldPersistKey(key as keyof GlobalState)) {
					stateToSave[key] = value
				}
			}

			await fs.writeFile(stateFile, JSON.stringify(stateToSave, null, 2))
		} catch (error) {
			console.error("Failed to persist state:", error)
		}
	}

	// Load persisted state from file system
	async loadPersistedState(): Promise<void> {
		try {
			const stateFile = path.join(this.storageDir, "globalState.json")
			const data = await fs.readFile(stateFile, "utf-8")
			const persistedState = JSON.parse(data)

			// Load persisted values
			for (const [key, value] of Object.entries(persistedState)) {
				this.state.set(key, value)
				if (key === "taskHistory") {
					this.taskHistory = value as HistoryItem[]
				}
			}

			console.log(`[WebStateManager] Loaded persisted state with ${Object.keys(persistedState).length} keys`)
		} catch (error) {
			console.log("[WebStateManager] No persisted state found, using defaults")
		}

		// Load conversations
		await this.loadPersistedConversations()
	}

	private async loadPersistedConversations(): Promise<void> {
		try {
			const files = await fs.readdir(this.storageDir)
			const conversationFiles = files.filter((file) => file.startsWith("conversation_") && file.endsWith(".json"))

			for (const file of conversationFiles) {
				try {
					const taskId = file.replace("conversation_", "").replace(".json", "")
					const filePath = path.join(this.storageDir, file)
					const data = await fs.readFile(filePath, "utf-8")
					const messages = JSON.parse(data) as ClineMessage[]
					this.conversations.set(taskId, messages)
				} catch (error) {
					console.error(`Failed to load conversation from ${file}:`, error)
				}
			}

			console.log(`[WebStateManager] Loaded ${this.conversations.size} persisted conversations`)
		} catch (error) {
			console.log("[WebStateManager] No persisted conversations found")
		}
	}

	// Reset all state
	async resetAllState(): Promise<void> {
		this.state.clear()
		this.taskHistory = []
		this.conversations.clear()
		this.initializeDefaults()

		// Clear persisted files
		try {
			const files = await fs.readdir(this.storageDir)
			for (const file of files) {
				if (file.endsWith(".json")) {
					await fs.unlink(path.join(this.storageDir, file))
				}
			}
			console.log("[WebStateManager] All state reset and files cleared")
		} catch (error) {
			console.error("Failed to clear persisted files:", error)
		}
	}

	// Get statistics
	getStats() {
		return {
			stateKeys: this.state.size,
			taskHistoryCount: this.taskHistory.length,
			conversationCount: this.conversations.size,
			storageDir: this.storageDir,
		}
	}
}
