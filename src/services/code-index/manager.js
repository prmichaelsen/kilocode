"use strict"
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				var desc = Object.getOwnPropertyDescriptor(m, k)
				if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k]
						},
					}
				}
				Object.defineProperty(o, k2, desc)
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				o[k2] = m[k]
			})
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, "default", { enumerable: true, value: v })
			}
		: function (o, v) {
				o["default"] = v
			})
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = []
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
					return ar
				}
			return ownKeys(o)
		}
		return function (mod) {
			if (mod && mod.__esModule) return mod
			var result = {}
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== "default") __createBinding(result, mod, k[i])
			__setModuleDefault(result, mod)
			return result
		}
	})()
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.CodeIndexManager = void 0
const vscode = __importStar(require("vscode"))
const config_manager_1 = require("./config-manager")
const state_manager_1 = require("./state-manager")
const service_factory_1 = require("./service-factory")
const search_service_1 = require("./search-service")
const orchestrator_1 = require("./orchestrator")
const cache_manager_1 = require("./cache-manager")
const RooIgnoreController_1 = require("../../core/ignore/RooIgnoreController")
const promises_1 = __importDefault(require("fs/promises"))
const ignore_1 = __importDefault(require("ignore"))
const path_1 = __importDefault(require("path"))
const telemetry_1 = require("@roo-code/telemetry")
const types_1 = require("@roo-code/types")
class CodeIndexManager {
	static getInstance(context, workspacePath) {
		// If workspacePath is not provided, try to get it from the active editor or first workspace folder
		if (!workspacePath) {
			const activeEditor = vscode.window.activeTextEditor
			if (activeEditor) {
				const workspaceFolder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri)
				workspacePath = workspaceFolder?.uri.fsPath
			}
			if (!workspacePath) {
				const workspaceFolders = vscode.workspace.workspaceFolders
				if (!workspaceFolders || workspaceFolders.length === 0) {
					return undefined
				}
				// Use the first workspace folder as fallback
				workspacePath = workspaceFolders[0].uri.fsPath
			}
		}
		if (!CodeIndexManager.instances.has(workspacePath)) {
			CodeIndexManager.instances.set(workspacePath, new CodeIndexManager(workspacePath, context))
		}
		return CodeIndexManager.instances.get(workspacePath)
	}
	static disposeAll() {
		for (const instance of CodeIndexManager.instances.values()) {
			instance.dispose()
		}
		CodeIndexManager.instances.clear()
	}
	// Private constructor for singleton pattern
	constructor(workspacePath, context) {
		// Specialized class instances
		Object.defineProperty(this, "_configManager", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "_stateManager", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "_serviceFactory", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "_orchestrator", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "_searchService", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "_cacheManager", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		// Flag to prevent race conditions during error recovery
		Object.defineProperty(this, "_isRecoveringFromError", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: false,
		})
		Object.defineProperty(this, "workspacePath", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "context", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.workspacePath = workspacePath
		this.context = context
		this._stateManager = new state_manager_1.CodeIndexStateManager()
	}
	// --- Public API ---
	get onProgressUpdate() {
		return this._stateManager.onProgressUpdate
	}
	assertInitialized() {
		if (!this._configManager || !this._orchestrator || !this._searchService || !this._cacheManager) {
			throw new Error("CodeIndexManager not initialized. Call initialize() first.")
		}
	}
	get state() {
		if (!this.isFeatureEnabled) {
			return "Standby"
		}
		this.assertInitialized()
		return this._orchestrator.state
	}
	get isFeatureEnabled() {
		return this._configManager?.isFeatureEnabled ?? false
	}
	get isFeatureConfigured() {
		return this._configManager?.isFeatureConfigured ?? false
	}
	get isInitialized() {
		try {
			this.assertInitialized()
			return true
		} catch (error) {
			return false
		}
	}
	/**
	 * Initializes the manager with configuration and dependent services.
	 * Must be called before using any other methods.
	 * @returns Object indicating if a restart is needed
	 */
	async initialize(contextProxy) {
		// 1. ConfigManager Initialization and Configuration Loading
		if (!this._configManager) {
			this._configManager = new config_manager_1.CodeIndexConfigManager(contextProxy)
		}
		// Load configuration once to get current state and restart requirements
		const { requiresRestart } = await this._configManager.loadConfiguration()
		// 2. Check if feature is enabled
		if (!this.isFeatureEnabled) {
			if (this._orchestrator) {
				this._orchestrator.stopWatcher()
			}
			return { requiresRestart }
		}
		// 3. Check if workspace is available
		const workspacePath = this.workspacePath
		if (!workspacePath) {
			this._stateManager.setSystemState("Standby", "No workspace folder open")
			return { requiresRestart }
		}
		// 4. CacheManager Initialization
		if (!this._cacheManager) {
			this._cacheManager = new cache_manager_1.CacheManager(this.context, this.workspacePath)
			await this._cacheManager.initialize()
		}
		// 4. Determine if Core Services Need Recreation
		const needsServiceRecreation = !this._serviceFactory || requiresRestart
		if (needsServiceRecreation) {
			await this._recreateServices()
		}
		// 5. Handle Indexing Start/Restart
		// The enhanced vectorStore.initialize() in startIndexing() now handles dimension changes automatically
		// by detecting incompatible collections and recreating them, so we rely on that for dimension changes
		const shouldStartOrRestartIndexing =
			requiresRestart ||
			(needsServiceRecreation && (!this._orchestrator || this._orchestrator.state !== "Indexing"))
		if (shouldStartOrRestartIndexing) {
			this._orchestrator?.startIndexing() // This method is async, but we don't await it here
		}
		return { requiresRestart }
	}
	/**
	 * Initiates the indexing process (initial scan and starts watcher).
	 * Automatically recovers from error state if needed before starting.
	 *
	 * @important This method should NEVER be awaited as it starts a long-running background process.
	 * The indexing will continue asynchronously and progress will be reported through events.
	 */
	async startIndexing() {
		if (!this.isFeatureEnabled) {
			return
		}
		// Check if we're in error state and recover if needed
		const currentStatus = this.getCurrentStatus()
		if (currentStatus.systemStatus === "Error") {
			await this.recoverFromError()
			// After recovery, we need to reinitialize since recoverFromError clears all services
			// This will be handled by the caller (webviewMessageHandler) checking isInitialized
			return
		}
		this.assertInitialized()
		await this._orchestrator.startIndexing()
	}
	/**
	 * Stops the file watcher and potentially cleans up resources.
	 */
	stopWatcher() {
		if (!this.isFeatureEnabled) {
			return
		}
		if (this._orchestrator) {
			this._orchestrator.stopWatcher()
		}
	}
	// kilocode_change start
	/**
	 * Cancel any active indexing activity immediately.
	 */
	cancelIndexing() {
		if (!this.isFeatureEnabled) {
			return
		}
		if (this._orchestrator) {
			this._orchestrator.cancelIndexing()
		}
	}
	// kilocode_change end
	/**
	 * Recovers from error state by clearing the error and resetting internal state.
	 * This allows the manager to be re-initialized after a recoverable error.
	 *
	 * This method clears all service instances (configManager, serviceFactory, orchestrator, searchService)
	 * to force a complete re-initialization on the next operation. This ensures a clean slate
	 * after recovering from errors such as network failures or configuration issues.
	 *
	 * @remarks
	 * - Safe to call even when not in error state (idempotent)
	 * - Does not restart indexing automatically - call initialize() after recovery
	 * - Service instances will be recreated on next initialize() call
	 * - Prevents race conditions from multiple concurrent recovery attempts
	 */
	async recoverFromError() {
		// Prevent race conditions from multiple rapid recovery attempts
		if (this._isRecoveringFromError) {
			return
		}
		this._isRecoveringFromError = true
		try {
			// Clear error state
			this._stateManager.setSystemState("Standby", "")
		} catch (error) {
			// Log error but continue with recovery - clearing service instances is more important
			console.error("Failed to clear error state during recovery:", error)
		} finally {
			// Force re-initialization by clearing service instances
			// This ensures a clean slate even if state update failed
			this._configManager = undefined
			this._serviceFactory = undefined
			this._orchestrator = undefined
			this._searchService = undefined
			// Reset the flag after recovery is complete
			this._isRecoveringFromError = false
		}
	}
	/**
	 * Cleans up the manager instance.
	 */
	dispose() {
		if (this._orchestrator) {
			this.stopWatcher()
		}
		this._stateManager.dispose()
	}
	/**
	 * Clears all index data by stopping the watcher, clearing the Qdrant collection,
	 * and deleting the cache file.
	 */
	async clearIndexData() {
		if (!this.isFeatureEnabled) {
			return
		}
		this.assertInitialized()
		await this._orchestrator.clearIndexData()
		await this._cacheManager.clearCacheFile()
	}
	// --- Private Helpers ---
	getCurrentStatus() {
		const status = this._stateManager.getCurrentStatus()
		return {
			...status,
			workspacePath: this.workspacePath,
		}
	}
	async searchIndex(query, directoryPrefix) {
		if (!this.isFeatureEnabled) {
			return []
		}
		this.assertInitialized()
		return this._searchService.searchIndex(query, directoryPrefix)
	}
	/**
	 * Private helper method to recreate services with current configuration.
	 * Used by both initialize() and handleSettingsChange().
	 */
	async _recreateServices() {
		// Stop watcher if it exists
		if (this._orchestrator) {
			this.stopWatcher()
		}
		// Clear existing services to ensure clean state
		this._orchestrator = undefined
		this._searchService = undefined
		// (Re)Initialize service factory
		this._serviceFactory = new service_factory_1.CodeIndexServiceFactory(
			this._configManager,
			this.workspacePath,
			this._cacheManager,
		)
		const ignoreInstance = (0, ignore_1.default)()
		const workspacePath = this.workspacePath
		if (!workspacePath) {
			this._stateManager.setSystemState("Standby", "")
			return
		}
		// Create .gitignore instance
		const ignorePath = path_1.default.join(workspacePath, ".gitignore")
		try {
			const content = await promises_1.default.readFile(ignorePath, "utf8")
			ignoreInstance.add(content)
			ignoreInstance.add(".gitignore")
		} catch (error) {
			// Should never happen: reading file failed even though it exists
			console.error("Unexpected error loading .gitignore:", error)
			telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CODE_INDEX_ERROR, {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				location: "_recreateServices",
			})
		}
		// Create RooIgnoreController instance
		const rooIgnoreController = new RooIgnoreController_1.RooIgnoreController(workspacePath)
		await rooIgnoreController.initialize()
		// (Re)Create shared service instances
		const { embedder, vectorStore, scanner, fileWatcher } = this._serviceFactory.createServices(
			this.context,
			this._cacheManager,
			ignoreInstance,
			rooIgnoreController,
		)
		// kilocode_change start
		// Only validate the embedder if it matches the currently configured provider
		const config = this._configManager.getConfig()
		const shouldValidate = embedder.embedderInfo.name === config.embedderProvider
		if (shouldValidate) {
			const validationResult = await this._serviceFactory.validateEmbedder(embedder)
			if (!validationResult.valid) {
				const errorMessage = validationResult.error || "Embedder configuration validation failed"
				this._stateManager.setSystemState("Error", errorMessage)
				throw new Error(errorMessage)
			}
		}
		// kilocode_change end
		// (Re)Initialize orchestrator
		this._orchestrator = new orchestrator_1.CodeIndexOrchestrator(
			this._configManager,
			this._stateManager,
			this.workspacePath,
			this._cacheManager,
			vectorStore,
			scanner,
			fileWatcher,
		)
		// (Re)Initialize search service
		this._searchService = new search_service_1.CodeIndexSearchService(
			this._configManager,
			this._stateManager,
			embedder,
			vectorStore,
		)
		// Clear any error state after successful recreation
		this._stateManager.setSystemState("Standby", "")
	}
	/**
	 * Handle code index settings changes.
	 * This method should be called when code index settings are updated
	 * to ensure the CodeIndexConfigManager picks up the new configuration.
	 * If the configuration changes require a restart, the service will be restarted.
	 */
	async handleSettingsChange() {
		if (this._configManager) {
			const { requiresRestart } = await this._configManager.loadConfiguration()
			const isFeatureEnabled = this.isFeatureEnabled
			const isFeatureConfigured = this.isFeatureConfigured
			// If feature is disabled, stop the service
			if (!isFeatureEnabled) {
				// Stop the orchestrator if it exists
				if (this._orchestrator) {
					this._orchestrator.stopWatcher()
				}
				// Set state to indicate service is disabled
				this._stateManager.setSystemState("Standby", "Code indexing is disabled")
				return
			}
			if (requiresRestart && isFeatureEnabled && isFeatureConfigured) {
				try {
					// Ensure cacheManager is initialized before recreating services
					if (!this._cacheManager) {
						this._cacheManager = new cache_manager_1.CacheManager(this.context, this.workspacePath)
						await this._cacheManager.initialize()
					}
					// Recreate services with new configuration
					await this._recreateServices()
				} catch (error) {
					// Error state already set in _recreateServices
					console.error("Failed to recreate services:", error)
					telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CODE_INDEX_ERROR, {
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
						location: "handleSettingsChange",
					})
					// Re-throw the error so the caller knows validation failed
					throw error
				}
			}
		}
	}
}
exports.CodeIndexManager = CodeIndexManager
// --- Singleton Implementation ---
Object.defineProperty(CodeIndexManager, "instances", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: new Map(),
}) // Map workspace path to instance
//# sourceMappingURL=manager.js.map
