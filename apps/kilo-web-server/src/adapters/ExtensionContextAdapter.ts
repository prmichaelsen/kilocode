import { EventEmitter } from "events"
import * as path from "path"
import * as fs from "fs/promises"

// Minimal adapter that replaces vscode.ExtensionContext
export class WebExtensionContext {
	private globalStateMap = new Map<string, any>()
	private secretsMap = new Map<string, string>()
	private subscriptionsArray: Array<{ dispose(): void }> = []
	private storageDir: string

	constructor(storageDir: string = "./storage") {
		this.storageDir = storageDir
		this.ensureStorageDir()
	}

	private async ensureStorageDir() {
		try {
			await fs.mkdir(this.storageDir, { recursive: true })
		} catch (error) {
			console.error("Failed to create storage directory:", error)
		}
	}

	// Mock vscode.ExtensionContext interface
	get globalStorageUri() {
		return { fsPath: this.storageDir }
	}

	get extension() {
		return {
			packageJSON: {
				name: "kilo-code-web",
				version: "1.0.0",
			},
		}
	}

	// Global state management
	globalState = {
		get: <T>(key: string): T | undefined => {
			return this.globalStateMap.get(key)
		},
		update: async (key: string, value: any): Promise<void> => {
			this.globalStateMap.set(key, value)
			// Persist to file for important state
			if (key === "taskHistory" || key === "currentApiConfigName") {
				await this.persistState()
			}
		},
	}

	// Secrets management
	secrets = {
		get: async (key: string): Promise<string | undefined> => {
			return this.secretsMap.get(key)
		},
		store: async (key: string, value: string): Promise<void> => {
			this.secretsMap.set(key, value)
			await this.persistSecrets()
		},
		delete: async (key: string): Promise<void> => {
			this.secretsMap.delete(key)
			await this.persistSecrets()
		},
	}

	// Subscription management
	subscriptions = this.subscriptionsArray

	// Persistence methods
	private async persistState() {
		try {
			const stateFile = path.join(this.storageDir, "globalState.json")
			const stateObj = Object.fromEntries(this.globalStateMap)
			await fs.writeFile(stateFile, JSON.stringify(stateObj, null, 2))
		} catch (error) {
			console.error("Failed to persist global state:", error)
		}
	}

	private async persistSecrets() {
		try {
			const secretsFile = path.join(this.storageDir, "secrets.json")
			const secretsObj = Object.fromEntries(this.secretsMap)
			await fs.writeFile(secretsFile, JSON.stringify(secretsObj, null, 2))
		} catch (error) {
			console.error("Failed to persist secrets:", error)
		}
	}

	// Load persisted data
	async loadPersistedData() {
		try {
			// Load global state
			const stateFile = path.join(this.storageDir, "globalState.json")
			try {
				const stateData = await fs.readFile(stateFile, "utf-8")
				const stateObj = JSON.parse(stateData)
				this.globalStateMap = new Map(Object.entries(stateObj))
			} catch (error) {
				console.log("No persisted global state found, starting fresh")
			}

			// Load secrets
			const secretsFile = path.join(this.storageDir, "secrets.json")
			try {
				const secretsData = await fs.readFile(secretsFile, "utf-8")
				const secretsObj = JSON.parse(secretsData)
				this.secretsMap = new Map(Object.entries(secretsObj))
			} catch (error) {
				console.log("No persisted secrets found, starting fresh")
			}
		} catch (error) {
			console.error("Failed to load persisted data:", error)
		}
	}

	// Cleanup method
	dispose() {
		this.subscriptionsArray.forEach((sub) => {
			try {
				sub.dispose()
			} catch (error) {
				console.error("Error disposing subscription:", error)
			}
		})
		this.subscriptionsArray.length = 0
	}
}
