"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.CloudService = void 0
const events_1 = __importDefault(require("events"))
const errors_js_1 = require("./errors.js")
const WebAuthService_js_1 = require("./WebAuthService.js")
const StaticTokenAuthService_js_1 = require("./StaticTokenAuthService.js")
const CloudSettingsService_js_1 = require("./CloudSettingsService.js")
const StaticSettingsService_js_1 = require("./StaticSettingsService.js")
const TelemetryClient_js_1 = require("./TelemetryClient.js")
const CloudShareService_js_1 = require("./CloudShareService.js")
const CloudAPI_js_1 = require("./CloudAPI.js")
const index_js_1 = require("./retry-queue/index.js")
class CloudService extends events_1.default {
	get authService() {
		return this._authService
	}
	get settingsService() {
		return this._settingsService
	}
	get telemetryClient() {
		return this._telemetryClient
	}
	get shareService() {
		return this._shareService
	}
	get cloudAPI() {
		return this._cloudAPI
	}
	get retryQueue() {
		return this._retryQueue
	}
	constructor(context, log) {
		super()
		Object.defineProperty(this, "context", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "authStateListener", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "authUserInfoListener", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "settingsListener", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "isInitialized", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: false,
		})
		Object.defineProperty(this, "log", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		/**
		 * Services
		 */
		Object.defineProperty(this, "_authService", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "_settingsService", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "_telemetryClient", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "_shareService", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "_cloudAPI", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "_retryQueue", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		this.context = context
		this.log = log || console.log
		this.authStateListener = (data) => {
			// Handle retry queue based on auth state changes
			this.handleAuthStateChangeForRetryQueue(data)
			this.emit("auth-state-changed", data)
		}
		this.authUserInfoListener = (data) => {
			this.emit("user-info", data)
		}
		this.settingsListener = (data) => {
			this.emit("settings-updated", data)
		}
	}
	async initialize() {
		if (this.isInitialized) {
			return
		}
		try {
			// For testing you can create a token with:
			// `pnpm --filter @roo-code-cloud/roomote-cli development auth job-token --job-id 1 --user-id user_2xmBhejNeDTwanM8CgIOnMgVxzC --org-id org_2wbhchVXZMQl8OS1yt0mrDazCpW`
			// The token will last for 1 hour.
			const cloudToken = process.env.ROO_CODE_CLOUD_TOKEN
			if (cloudToken && cloudToken.length > 0) {
				this._authService = new StaticTokenAuthService_js_1.StaticTokenAuthService(
					this.context,
					cloudToken,
					this.log,
				)
			} else {
				this._authService = new WebAuthService_js_1.WebAuthService(this.context, this.log)
			}
			this._authService.on("auth-state-changed", this.authStateListener)
			this._authService.on("user-info", this.authUserInfoListener)
			await this._authService.initialize()
			// Check for static settings environment variable.
			const staticOrgSettings = process.env.ROO_CODE_CLOUD_ORG_SETTINGS
			if (staticOrgSettings && staticOrgSettings.length > 0) {
				this._settingsService = new StaticSettingsService_js_1.StaticSettingsService(
					staticOrgSettings,
					this.log,
				)
			} else {
				const cloudSettingsService = new CloudSettingsService_js_1.CloudSettingsService(
					this.context,
					this._authService,
					this.log,
				)
				cloudSettingsService.on("settings-updated", this.settingsListener)
				await cloudSettingsService.initialize()
				this._settingsService = cloudSettingsService
			}
			this._cloudAPI = new CloudAPI_js_1.CloudAPI(this._authService, this.log)
			// Initialize retry queue with auth header provider
			this._retryQueue = new index_js_1.RetryQueue(
				this.context,
				undefined, // Use default config
				this.log,
				() => {
					// Provide fresh auth headers for retries
					const sessionToken = this._authService?.getSessionToken()
					if (sessionToken) {
						return {
							Authorization: `Bearer ${sessionToken}`,
						}
					}
					return undefined
				},
			)
			this._telemetryClient = new TelemetryClient_js_1.CloudTelemetryClient(
				this._authService,
				this._settingsService,
				this._retryQueue,
			)
			this._shareService = new CloudShareService_js_1.CloudShareService(
				this._cloudAPI,
				this._settingsService,
				this.log,
			)
			this.isInitialized = true
		} catch (error) {
			this.log("[CloudService] Failed to initialize:", error)
			throw new Error(`Failed to initialize CloudService: ${error}`)
		}
	}
	// AuthService
	async login(landingPageSlug) {
		this.ensureInitialized()
		return this.authService.login(landingPageSlug)
	}
	async logout() {
		this.ensureInitialized()
		return this.authService.logout()
	}
	isAuthenticated() {
		this.ensureInitialized()
		return this.authService.isAuthenticated()
	}
	hasActiveSession() {
		this.ensureInitialized()
		return this.authService.hasActiveSession()
	}
	hasOrIsAcquiringActiveSession() {
		this.ensureInitialized()
		return this.authService.hasOrIsAcquiringActiveSession()
	}
	getUserInfo() {
		this.ensureInitialized()
		return this.authService.getUserInfo()
	}
	getOrganizationId() {
		this.ensureInitialized()
		const userInfo = this.authService.getUserInfo()
		return userInfo?.organizationId || null
	}
	getOrganizationName() {
		this.ensureInitialized()
		const userInfo = this.authService.getUserInfo()
		return userInfo?.organizationName || null
	}
	getOrganizationRole() {
		this.ensureInitialized()
		const userInfo = this.authService.getUserInfo()
		return userInfo?.organizationRole || null
	}
	hasStoredOrganizationId() {
		this.ensureInitialized()
		return this.authService.getStoredOrganizationId() !== null
	}
	getStoredOrganizationId() {
		this.ensureInitialized()
		return this.authService.getStoredOrganizationId()
	}
	getAuthState() {
		this.ensureInitialized()
		return this.authService.getState()
	}
	async handleAuthCallback(code, state, organizationId) {
		this.ensureInitialized()
		return this.authService.handleCallback(code, state, organizationId)
	}
	async switchOrganization(organizationId) {
		this.ensureInitialized()
		// Perform the organization switch
		// StaticTokenAuthService will throw an error if organization switching is not supported
		await this.authService.switchOrganization(organizationId)
	}
	async getOrganizationMemberships() {
		this.ensureInitialized()
		// StaticTokenAuthService will throw an error if organization memberships are not supported
		return await this.authService.getOrganizationMemberships()
	}
	// SettingsService
	getAllowList() {
		this.ensureInitialized()
		return this.settingsService.getAllowList()
	}
	getOrganizationSettings() {
		this.ensureInitialized()
		return this.settingsService.getSettings()
	}
	getUserSettings() {
		this.ensureInitialized()
		return this.settingsService.getUserSettings()
	}
	getUserFeatures() {
		this.ensureInitialized()
		return this.settingsService.getUserFeatures()
	}
	getUserSettingsConfig() {
		this.ensureInitialized()
		return this.settingsService.getUserSettingsConfig()
	}
	async updateUserSettings(settings) {
		this.ensureInitialized()
		return this.settingsService.updateUserSettings(settings)
	}
	isTaskSyncEnabled() {
		this.ensureInitialized()
		return this.settingsService.isTaskSyncEnabled()
	}
	// TelemetryClient
	captureEvent(event) {
		this.ensureInitialized()
		this.telemetryClient.capture(event)
	}
	// ShareService
	async shareTask(taskId, visibility = "organization", clineMessages) {
		this.ensureInitialized()
		try {
			return await this.shareService.shareTask(taskId, visibility)
		} catch (error) {
			if (error instanceof errors_js_1.TaskNotFoundError && clineMessages) {
				// Backfill messages and retry.
				await this.telemetryClient.backfillMessages(clineMessages, taskId)
				return await this.shareService.shareTask(taskId, visibility)
			}
			throw error
		}
	}
	async canShareTask() {
		this.ensureInitialized()
		return this.shareService.canShareTask()
	}
	// Lifecycle
	dispose() {
		if (this.authService) {
			this.authService.off("auth-state-changed", this.authStateListener)
			this.authService.off("user-info", this.authUserInfoListener)
		}
		if (this.settingsService) {
			if (this.settingsService instanceof CloudSettingsService_js_1.CloudSettingsService) {
				this.settingsService.off("settings-updated", this.settingsListener)
			}
			this.settingsService.dispose()
		}
		if (this._retryQueue) {
			this._retryQueue.dispose()
		}
		this.isInitialized = false
	}
	ensureInitialized() {
		if (!this.isInitialized) {
			throw new Error("CloudService not initialized.")
		}
	}
	static get instance() {
		if (!this._instance) {
			throw new Error("CloudService not initialized")
		}
		return this._instance
	}
	static async createInstance(context, log, eventHandlers) {
		if (this._instance) {
			throw new Error("CloudService instance already created")
		}
		this._instance = new CloudService(context, log)
		await this._instance.initialize()
		if (eventHandlers) {
			for (const [event, handler] of Object.entries(eventHandlers)) {
				if (handler) {
					this._instance.on(event, handler)
				}
			}
		}
		await this._instance.authService?.broadcast()
		return this._instance
	}
	static hasInstance() {
		return this._instance !== null && this._instance.isInitialized
	}
	static resetInstance() {
		if (this._instance) {
			this._instance.dispose()
			this._instance = null
		}
	}
	static isEnabled() {
		return !!this._instance?.isAuthenticated()
	}
	/**
	 * Handle auth state changes for the retry queue
	 * - Pause queue when not in 'active-session' state
	 * - Clear queue when user logs out or logs in as different user
	 * - Resume queue when returning to active-session with same user
	 */
	handleAuthStateChangeForRetryQueue(data) {
		if (!this._retryQueue) {
			return
		}
		const newState = data.state
		const userInfo = this.getUserInfo()
		const newUserId = userInfo?.id
		this.log(`[CloudService] Auth state changed to: ${newState}, user: ${newUserId}`)
		// Handle different auth states
		switch (newState) {
			case "active-session": {
				// Check if user changed (different user logged in)
				const wasCleared = this._retryQueue.clearIfUserChanged(newUserId)
				if (!wasCleared) {
					// Same user or first login, resume the queue
					this._retryQueue.resume()
					this.log("[CloudService] Resuming retry queue for active session")
				} else {
					// Different user, queue was cleared, but we can resume processing
					this._retryQueue.resume()
					this.log("[CloudService] Retry queue cleared for new user, resuming processing")
				}
				break
			}
			case "logged-out":
				// User is logged out, clear the queue
				this._retryQueue.clearIfUserChanged(undefined)
				this._retryQueue.pause()
				this.log("[CloudService] Pausing and clearing retry queue for logged-out state")
				break
			case "initializing":
			case "attempting-session":
				// Transitional states, pause the queue but don't clear
				this._retryQueue.pause()
				this.log(`[CloudService] Pausing retry queue during ${newState}`)
				break
			case "inactive-session":
				// Session is inactive (possibly expired), pause but don't clear
				// The queue might resume if the session becomes active again
				this._retryQueue.pause()
				this.log("[CloudService] Pausing retry queue for inactive session")
				break
			default:
				// Unknown state, pause as a safety measure
				this._retryQueue.pause()
				this.log(`[CloudService] Pausing retry queue for unknown state: ${newState}`)
		}
	}
}
exports.CloudService = CloudService
Object.defineProperty(CloudService, "_instance", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: null,
})
//# sourceMappingURL=CloudService.js.map
