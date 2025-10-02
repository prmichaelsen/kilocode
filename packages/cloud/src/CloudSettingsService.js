"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.CloudSettingsService = void 0
const events_1 = __importDefault(require("events"))
const zod_1 = require("zod")
const types_1 = require("@roo-code/types")
const config_js_1 = require("./config.js")
const RefreshTimer_js_1 = require("./RefreshTimer.js")
const ORGANIZATION_SETTINGS_CACHE_KEY = "organization-settings"
const USER_SETTINGS_CACHE_KEY = "user-settings"
const parseExtensionSettingsResponse = (data) => {
	const shapeResult = zod_1.z.object({ organization: zod_1.z.unknown(), user: zod_1.z.unknown() }).safeParse(data)
	if (!shapeResult.success) {
		return { success: false, error: shapeResult.error }
	}
	const orgResult = types_1.organizationSettingsSchema.safeParse(shapeResult.data.organization)
	if (!orgResult.success) {
		return { success: false, error: orgResult.error }
	}
	const userResult = types_1.userSettingsDataSchema.safeParse(shapeResult.data.user)
	if (!userResult.success) {
		return { success: false, error: userResult.error }
	}
	return {
		success: true,
		data: { organization: orgResult.data, user: userResult.data },
	}
}
class CloudSettingsService extends events_1.default {
	constructor(context, authService, log) {
		super()
		Object.defineProperty(this, "context", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "authService", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "settings", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: undefined,
		})
		Object.defineProperty(this, "userSettings", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: undefined,
		})
		Object.defineProperty(this, "timer", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "log", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.context = context
		this.authService = authService
		this.log = log || console.log
		this.timer = new RefreshTimer_js_1.RefreshTimer({
			callback: async () => {
				return await this.fetchSettings()
			},
			successInterval: 30000,
			initialBackoffMs: 1000,
			maxBackoffMs: 30000,
		})
	}
	async initialize() {
		this.loadCachedSettings()
		// Clear cached settings if we have missed a log out.
		if (this.authService.getState() == "logged-out" && (this.settings || this.userSettings)) {
			await this.removeSettings()
		}
		this.authService.on("auth-state-changed", async (data) => {
			try {
				if (data.state === "active-session") {
					this.timer.start()
				} else if (data.previousState === "active-session") {
					this.timer.stop()
					if (data.state === "logged-out") {
						await this.removeSettings()
					}
				}
			} catch (error) {
				this.log(`[cloud-settings] error processing auth-state-changed: ${error}`, error)
			}
		})
		if (this.authService.hasActiveSession()) {
			this.timer.start()
		}
	}
	async fetchSettings() {
		const token = this.authService.getSessionToken()
		if (!token) {
			return false
		}
		try {
			const response = await fetch(`${(0, config_js_1.getRooCodeApiUrl)()}/api/extension-settings`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			})
			if (!response.ok) {
				this.log("[cloud-settings] Failed to fetch extension settings:", response.status, response.statusText)
				return false
			}
			const data = await response.json()
			const result = parseExtensionSettingsResponse(data)
			if (!result.success) {
				this.log("[cloud-settings] Invalid extension settings format:", result.error)
				return false
			}
			const { organization: newOrgSettings, user: newUserSettings } = result.data
			let orgChanged = false
			let userChanged = false
			// Check for organization settings changes
			if (!this.settings || this.settings.version !== newOrgSettings.version) {
				this.settings = newOrgSettings
				orgChanged = true
			}
			// Check for user settings changes
			if (!this.userSettings || this.userSettings.version !== newUserSettings.version) {
				this.userSettings = newUserSettings
				userChanged = true
			}
			// Emit a single event if either settings changed
			if (orgChanged || userChanged) {
				this.emit("settings-updated", {})
			}
			const hasChanges = orgChanged || userChanged
			if (hasChanges) {
				await this.cacheSettings()
			}
			return true
		} catch (error) {
			this.log("[cloud-settings] Error fetching extension settings:", error)
			return false
		}
	}
	async cacheSettings() {
		// Store settings in separate globalState values
		if (this.settings) {
			await this.context.globalState.update(ORGANIZATION_SETTINGS_CACHE_KEY, this.settings)
		}
		if (this.userSettings) {
			await this.context.globalState.update(USER_SETTINGS_CACHE_KEY, this.userSettings)
		}
	}
	loadCachedSettings() {
		// Load settings from separate globalState values
		this.settings = this.context.globalState.get(ORGANIZATION_SETTINGS_CACHE_KEY)
		this.userSettings = this.context.globalState.get(USER_SETTINGS_CACHE_KEY)
	}
	getAllowList() {
		return this.settings?.allowList || types_1.ORGANIZATION_ALLOW_ALL
	}
	getSettings() {
		return this.settings
	}
	getUserSettings() {
		return this.userSettings
	}
	getUserFeatures() {
		return this.userSettings?.features || {}
	}
	getUserSettingsConfig() {
		return this.userSettings?.settings || {}
	}
	async updateUserSettings(settings) {
		const token = this.authService.getSessionToken()
		if (!token) {
			this.log("[cloud-settings] No session token available for updating user settings")
			return false
		}
		try {
			const currentVersion = this.userSettings?.version
			const requestBody = {
				settings,
			}
			// Include current version for optimistic locking if we have cached settings
			if (currentVersion !== undefined) {
				requestBody.version = currentVersion
			}
			const response = await fetch(`${(0, config_js_1.getRooCodeApiUrl)()}/api/user-settings`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(requestBody),
			})
			if (!response.ok) {
				if (response.status === 409) {
					this.log(
						"[cloud-settings] Version conflict when updating user settings - settings may have been updated elsewhere",
					)
				} else {
					this.log("[cloud-settings] Failed to update user settings:", response.status, response.statusText)
				}
				return false
			}
			const updatedUserSettings = await response.json()
			const result = types_1.userSettingsDataSchema.safeParse(updatedUserSettings)
			if (!result.success) {
				this.log("[cloud-settings] Invalid user settings response format:", result.error)
				return false
			}
			if (!this.userSettings || result.data.version > this.userSettings.version) {
				this.userSettings = result.data
				await this.cacheSettings()
				this.emit("settings-updated", {})
			}
			return true
		} catch (error) {
			this.log("[cloud-settings] Error updating user settings:", error)
			return false
		}
	}
	isTaskSyncEnabled() {
		// Org settings take precedence
		if (this.authService.getStoredOrganizationId()) {
			return this.settings?.cloudSettings?.recordTaskMessages ?? false
		}
		// User settings default to true if unspecified
		const userSettings = this.userSettings
		if (userSettings) {
			return userSettings.settings.taskSyncEnabled ?? true
		}
		return false
	}
	async removeSettings() {
		this.settings = undefined
		this.userSettings = undefined
		// Clear both cache keys
		await this.context.globalState.update(ORGANIZATION_SETTINGS_CACHE_KEY, undefined)
		await this.context.globalState.update(USER_SETTINGS_CACHE_KEY, undefined)
	}
	dispose() {
		this.removeAllListeners()
		this.timer.stop()
	}
}
exports.CloudSettingsService = CloudSettingsService
//# sourceMappingURL=CloudSettingsService.js.map
