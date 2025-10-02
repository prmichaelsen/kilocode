"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.StaticSettingsService = void 0
const types_1 = require("@roo-code/types")
class StaticSettingsService {
	constructor(envValue, log) {
		Object.defineProperty(this, "settings", {
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
		this.log = log || console.log
		this.settings = this.parseEnvironmentSettings(envValue)
	}
	parseEnvironmentSettings(envValue) {
		try {
			const decodedValue = Buffer.from(envValue, "base64").toString("utf-8")
			const parsedJson = JSON.parse(decodedValue)
			return types_1.organizationSettingsSchema.parse(parsedJson)
		} catch (error) {
			this.log(
				`[StaticSettingsService] failed to parse static settings: ${error instanceof Error ? error.message : String(error)}`,
				error,
			)
			throw new Error("Failed to parse static settings", { cause: error })
		}
	}
	getAllowList() {
		return this.settings?.allowList || types_1.ORGANIZATION_ALLOW_ALL
	}
	getSettings() {
		return this.settings
	}
	/**
	 * Returns static user settings with roomoteControlEnabled and extensionBridgeEnabled as true
	 */
	getUserSettings() {
		return {
			features: {
				roomoteControlEnabled: true,
			},
			settings: {
				extensionBridgeEnabled: true,
				taskSyncEnabled: true,
			},
			version: 1,
		}
	}
	getUserFeatures() {
		return {
			roomoteControlEnabled: true,
		}
	}
	getUserSettingsConfig() {
		return {
			extensionBridgeEnabled: true,
			taskSyncEnabled: true,
		}
	}
	async updateUserSettings(_settings) {
		throw new Error("User settings updates are not supported in static mode")
	}
	isTaskSyncEnabled() {
		// Static settings always enable task sync
		return true
	}
	dispose() {
		// No resources to clean up for static settings.
	}
}
exports.StaticSettingsService = StaticSettingsService
//# sourceMappingURL=StaticSettingsService.js.map
