import { EventEmitter } from "events"
import * as path from "path"
import * as os from "os"
import WebSocket from "ws"

import type {
	TaskProviderLike,
	TaskProviderEvents,
	ProviderSettings,
	HistoryItem,
	CreateTaskOptions,
	RooCodeSettings,
	ClineMessage,
	TokenUsage,
} from "@roo-code/types"
import { TelemetryService } from "@roo-code/telemetry"

import { buildApiHandler } from "../../../src/api"
import { Task } from "../../../src/core/task/Task"
import { WebExtensionContext } from "./adapters/ExtensionContextAdapter"
import { WebStateManager } from "./adapters/StateManager"
import { defaultModeSlug } from "../../../src/shared/modes"

export interface WebClientSession {
	id: string
	ws: WebSocket
	currentTask?: Task
	stateManager: WebStateManager
	extensionContext: WebExtensionContext
}

export class WebClineProvider extends EventEmitter<TaskProviderEvents> implements TaskProviderLike {
	private sessions = new Map<string, WebClientSession>()
	private globalStateManager: WebStateManager
	private globalExtensionContext: WebExtensionContext

	constructor() {
		super()
		
		// Initialize global state management
		this.globalStateManager = new WebStateManager("./storage/global")
		this.globalExtensionContext = new WebExtensionContext("./storage/global")
		
		// Initialize telemetry service
		TelemetryService.instance.setProvider(this)
		
		this.initializeDefaults()
	}

	private async initializeDefaults() {
		await this.globalStateManager.loadPersistedState()
		await this.globalExtensionContext.loadPersistedData()
		
		// Set default API configuration if none exists
		const currentConfig = this.globalStateManager.getValue("currentApiConfigName")
		if (!currentConfig) {
			await this.setDefaultApiConfiguration()
		}
	}

	private async setDefaultApiConfiguration() {
		const defaultConfig: ProviderSettings = {
			apiProvider: "anthropic",
			anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
			apiModelId: "claude-3-5-sonnet-20241022",
		}

		await this.globalStateManager.setValue("currentApiConfigName", "default")
		await this.globalStateManager.setValue("listApiConfigMeta", [
			{
				id: "default",
				name: "default",
				apiProvider: "anthropic",
			},
		])

		// Store provider settings in extension context
		await this.globalExtensionContext.secrets.store("anthropicApiKey", defaultConfig.anthropicApiKey || "")
	}

	// Session management
	createSession(clientId: string, ws: WebSocket): WebClientSession {
		const session: WebClientSession = {
			id: clientId,
			ws,
			stateManager: new WebStateManager(`./storage/sessions/${clientId}`),
			extensionContext: new WebExtensionContext(`./storage/sessions/${clientId}`),
		}

		this.sessions.set(clientId, session)
		
		// Initialize session state
		session.stateManager.loadPersistedState().catch(console.error)
		session.extensionContext.loadPersistedData().catch(console.error)

		return session
	}

	removeSession(clientId: string): void {
		const session = this.sessions.get(clientId)
		if (session) {
			// Clean up any active task
			if (session.currentTask) {
				session.currentTask.abortTask(true).catch(console.error)
			}
			
			// Dispose adapters
			session.extensionContext.dispose()
			
			this.sessions.delete(clientId)
		}
	}

	getSession(clientId: string): WebClientSession | undefined {
		return this.sessions.get(clientId)
	}

	// TaskProviderLike implementation
	async createTask(
		text?: string,
		images?: string[],
		parentTask?: Task,
		options: CreateTaskOptions = {},
		configuration: RooCodeSettings = {},
		sessionId?: string,
	): Promise<Task> {
		const session = sessionId ? this.getSession(sessionId) : undefined
		if (!session) {
			throw new Error("Session required for web task creation")
		}

		// Get API configuration
		const apiConfiguration = await this.getApiConfiguration()

		const task = new Task({
			context: session.extensionContext as any, // Cast to vscode.ExtensionContext
			provider: this as any, // Cast to ClineProvider interface
			apiConfiguration,
			enableDiff: false, // Disable diff for web environment
			enableCheckpoints: false, // Disable checkpoints for web environment
			enableBridge: false, // Disable bridge for web environment
			fuzzyMatchThreshold: 1.0,
			consecutiveMistakeLimit: 3,
			task: text,
			images,
			experiments: {},
			workspacePath: "/project",
			onCreated: (task: Task) => {
				this.emit("taskCreated", task)
			},
			...options,
		})

		// Store task in session
		session.currentTask = task

		return task
	}

	getCurrentTask(): Task | undefined {
		// For web environment, we need to specify which session
		// This will be called by Task class, so we need a way to determine current session
		// For now, return the first active task found
		for (const session of this.sessions.values()) {
			if (session.currentTask) {
				return session.currentTask
			}
		}
		return undefined
	}

	async cancelTask(): Promise<void> {
		const task = this.getCurrentTask()
		if (task) {
			await task.abortTask()
		}
	}

	clearTask(): Promise<void> {
		// Implementation for clearing current task
		const task = this.getCurrentTask()
		if (task) {
			return task.abortTask(true)
		}
		return Promise.resolve()
	}

	resumeTask(taskId: string): void {
		// Implementation for resuming a task from history
		console.log(`[WebClineProvider] Resume task requested: ${taskId}`)
		// TODO: Implement task resumption from history
	}

	// Mode management
	async getModes(): Promise<{ slug: string; name: string }[]> {
		return [
			{ slug: "code", name: "Code" },
			{ slug: "architect", name: "Architect" },
			{ slug: "ask", name: "Ask" },
			{ slug: "debug", name: "Debug" },
		]
	}

	async getMode(): Promise<string> {
		return this.globalStateManager.getValue("mode") || defaultModeSlug
	}

	async setMode(mode: string): Promise<void> {
		await this.globalStateManager.setValue("mode", mode)
	}

	// Provider profile management
	async getProviderProfiles(): Promise<{ name: string; provider?: string }[]> {
		const profiles = this.globalStateManager.getValue("listApiConfigMeta") || []
		return profiles.map((p: any) => ({ name: p.name, provider: p.apiProvider }))
	}

	async getProviderProfile(): Promise<string> {
		return this.globalStateManager.getValue("currentApiConfigName") || "default"
	}

	async setProviderProfile(name: string): Promise<void> {
		await this.globalStateManager.setValue("currentApiConfigName", name)
	}

	// State management
	async getState(): Promise<any> {
		return {
			mode: await this.getMode(),
			apiConfiguration: await this.getApiConfiguration(),
			customInstructions: this.globalStateManager.getValue("customInstructions"),
			experiments: this.globalStateManager.getValue("experiments") || {},
			mcpEnabled: true,
			enableMcpServerCreation: true,
			browserToolEnabled: false, // Disable browser tools for web environment
			diffEnabled: false,
			enableCheckpoints: false,
			autoApprovalEnabled: true,
			alwaysAllowReadOnly: true,
			alwaysAllowWrite: true,
			alwaysAllowExecute: true,
			alwaysAllowBrowser: false,
			alwaysAllowMcp: true,
			telemetrySetting: "unset",
		}
	}

	private async getApiConfiguration(): Promise<ProviderSettings> {
		const configName = this.globalStateManager.getValue("currentApiConfigName") || "default"
		
		// For now, return a basic Anthropic configuration
		// TODO: Implement proper profile management
		return {
			apiProvider: "anthropic",
			anthropicApiKey: await this.globalExtensionContext.secrets.get("anthropicApiKey") || "",
			apiModelId: "claude-3-5-sonnet-20241022",
		}
	}

	// Required by Task class but not used in web environment
	async postStateToWebview(): Promise<void> {
		// No-op for web environment - state is managed via WebSocket messages
	}

	async postMessageToWebview(message: any): Promise<void> {
		// No-op for web environment - messages sent via WebSocket
	}

	async updateTaskHistory(item: HistoryItem): Promise<HistoryItem[]> {
		return this.globalStateManager.updateTaskHistory(item)
	}

	log(message: string): void {
		console.log(`[WebClineProvider] ${message}`)
	}

	// Required by TelemetryPropertiesProvider interface
	get appProperties() {
		return {
			appName: "kilo-code-web",
			appVersion: "1.0.0",
			vscodeVersion: "web",
			platform: process.platform,
			editorName: "Kilo Code Web",
			wrapped: false,
		}
	}

	get gitProperties() {
		return {
			hasGitRepo: false,
			gitBranch: undefined,
			gitCommit: undefined,
		}
	}

	async getTelemetryProperties() {
		const state = await this.getState()
		return {
			...this.appProperties,
			...this.gitProperties,
			language: "en",
			mode: state.mode,
			apiProvider: state.apiConfiguration?.apiProvider,
		}
	}

	// Cleanup
	async dispose(): Promise<void> {
		// Clean up all sessions
		for (const [clientId, session] of this.sessions) {
			if (session.currentTask) {
				await session.currentTask.abortTask(true)
			}
			session.extensionContext.dispose()
		}
		this.sessions.clear()
		
		// Clean up global resources
		this.globalExtensionContext.dispose()
		this.removeAllListeners()
	}
}