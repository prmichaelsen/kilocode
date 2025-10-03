import type { GlobalState, ProviderSettings, RooCodeSettings } from "@roo-code/types"
import { WebExtensionContext } from "./ExtensionContextAdapter"

// Adapter for ContextProxy that works with WebExtensionContext
export class WebContextProxy {
	private context: WebExtensionContext
	private providerSettings: ProviderSettings = {} as ProviderSettings

	constructor(context: WebExtensionContext) {
		this.context = context
	}

	get extensionUri() {
		return { fsPath: process.cwd() }
	}

	get globalStorageUri() {
		return this.context.globalStorageUri
	}

	get extensionMode() {
		return 1 // ExtensionMode.Production equivalent
	}

	// Global state management
	getValue<K extends keyof GlobalState>(key: K): GlobalState[K] {
		return this.context.globalState.get(key)
	}

	async setValue<K extends keyof GlobalState>(key: K, value: GlobalState[K]): Promise<void> {
		await this.context.globalState.update(key, value)
	}

	getValues(): GlobalState {
		// Return all values as an object
		const values: Partial<GlobalState> = {}

		// Add default values for required properties
		return {
			currentApiConfigName: this.getValue("currentApiConfigName") || "default",
			listApiConfigMeta: this.getValue("listApiConfigMeta") || [],
			mode: this.getValue("mode") || "code",
			customModes: this.getValue("customModes") || [],
			taskHistory: this.getValue("taskHistory") || [],
			experiments: this.getValue("experiments") || {},
			telemetrySetting: this.getValue("telemetrySetting") || "unset",
			...values,
		} as GlobalState
	}

	async setValues(values: Partial<RooCodeSettings>): Promise<void> {
		for (const [key, value] of Object.entries(values)) {
			await this.setValue(key as keyof GlobalState, value)
		}
	}

	// Provider settings management
	getProviderSettings(): ProviderSettings {
		return this.providerSettings
	}

	async setProviderSettings(settings: ProviderSettings): Promise<void> {
		this.providerSettings = { ...settings }
	}

	// Secret storage
	async storeSecret(key: string, value: string): Promise<void> {
		await this.context.secrets.store(key, value)
	}

	async getSecret(key: string): Promise<string | undefined> {
		return await this.context.secrets.get(key)
	}

	async deleteSecret(key: string): Promise<void> {
		await this.context.secrets.delete(key)
	}

	// Reset all state
	async resetAllState(): Promise<void> {
		// Clear global state
		const currentValues = this.getValues()
		for (const key of Object.keys(currentValues)) {
			await this.setValue(key as keyof GlobalState, undefined)
		}

		// Clear provider settings
		this.providerSettings = {} as ProviderSettings

		// Note: We don't clear secrets here as they might be needed
		console.log("All state reset")
	}
}
