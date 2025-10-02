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
exports.importSettingsWithFeedback =
	exports.exportSettings =
	exports.importSettingsFromFile =
	exports.importSettings =
		void 0
exports.importSettingsFromPath = importSettingsFromPath
const safeWriteJson_1 = require("../../utils/safeWriteJson")
const os_1 = __importDefault(require("os"))
const path = __importStar(require("path"))
const promises_1 = __importDefault(require("fs/promises"))
const vscode = __importStar(require("vscode"))
const zod_1 = require("zod")
const types_1 = require("@roo-code/types")
const telemetry_1 = require("@roo-code/telemetry")
const ProviderSettingsManager_1 = require("./ProviderSettingsManager")
const i18n_1 = require("../../i18n")
/**
 * Imports configuration from a specific file path
 * Shares base functionality for import settings for both the manual
 * and automatic settings importing
 */
async function importSettingsFromPath(filePath, { providerSettingsManager, contextProxy, customModesManager }) {
	const schema = zod_1.z.object({
		providerProfiles: ProviderSettingsManager_1.providerProfilesSchema,
		globalSettings: types_1.globalSettingsSchema.optional(),
	})
	try {
		const previousProviderProfiles = await providerSettingsManager.export()
		const { providerProfiles: newProviderProfiles, globalSettings = {} } = schema.parse(
			JSON.parse(await promises_1.default.readFile(filePath, "utf-8")),
		)
		const providerProfiles = {
			currentApiConfigName: newProviderProfiles.currentApiConfigName,
			apiConfigs: {
				...previousProviderProfiles.apiConfigs,
				...newProviderProfiles.apiConfigs,
			},
			modeApiConfigs: {
				...previousProviderProfiles.modeApiConfigs,
				...newProviderProfiles.modeApiConfigs,
			},
		}
		await Promise.all(
			(globalSettings.customModes ?? []).map((mode) => customModesManager.updateCustomMode(mode.slug, mode)),
		)
		// OpenAI Compatible settings are now correctly stored in codebaseIndexConfig
		// They will be imported automatically with the config - no special handling needed
		await providerSettingsManager.import(providerProfiles)
		await contextProxy.setValues(globalSettings)
		// Set the current provider.
		const currentProviderName = providerProfiles.currentApiConfigName
		const currentProvider = providerProfiles.apiConfigs[currentProviderName]
		contextProxy.setValue("currentApiConfigName", currentProviderName)
		// TODO: It seems like we don't need to have the provider settings in
		// the proxy; we can just use providerSettingsManager as the source of
		// truth.
		if (currentProvider) {
			contextProxy.setProviderSettings(currentProvider)
		}
		contextProxy.setValue("listApiConfigMeta", await providerSettingsManager.listConfig())
		return { providerProfiles, globalSettings, success: true }
	} catch (e) {
		let error = "Unknown error"
		if (e instanceof zod_1.ZodError) {
			error = e.issues.map((issue) => `[${issue.path.join(".")}]: ${issue.message}`).join("\n")
			telemetry_1.TelemetryService.instance.captureSchemaValidationError({ schemaName: "ImportExport", error: e })
		} else if (e instanceof Error) {
			error = e.message
		}
		return { success: false, error }
	}
}
/**
 * Import settings from a file using a file dialog
 * @param options - Import options containing managers and proxy
 * @returns Promise resolving to import result
 */
const importSettings = async ({ providerSettingsManager, contextProxy, customModesManager }) => {
	const uris = await vscode.window.showOpenDialog({
		filters: { JSON: ["json"] },
		canSelectMany: false,
	})
	if (!uris) {
		return { success: false, error: "User cancelled file selection" }
	}
	return importSettingsFromPath(uris[0].fsPath, {
		providerSettingsManager,
		contextProxy,
		customModesManager,
	})
}
exports.importSettings = importSettings
/**
 * Import settings from a specific file
 * @param options - Import options containing managers and proxy
 * @param fileUri - URI of the file to import from
 * @returns Promise resolving to import result
 */
const importSettingsFromFile = async ({ providerSettingsManager, contextProxy, customModesManager }, fileUri) => {
	return importSettingsFromPath(fileUri.fsPath, {
		providerSettingsManager,
		contextProxy,
		customModesManager,
	})
}
exports.importSettingsFromFile = importSettingsFromFile
const exportSettings = async ({ providerSettingsManager, contextProxy }) => {
	const uri = await vscode.window.showSaveDialog({
		filters: { JSON: ["json"] },
		defaultUri: vscode.Uri.file(path.join(os_1.default.homedir(), "Documents", "kilo-code-settings.json")),
	})
	if (!uri) {
		return
	}
	try {
		const providerProfiles = await providerSettingsManager.export()
		const globalSettings = await contextProxy.export()
		// It's okay if there are no global settings, but if there are no
		// provider profile configured then don't export. If we wanted to
		// support this case then the `importSettings` function would need to
		// be updated to handle the case where there are no provider profiles.
		if (typeof providerProfiles === "undefined") {
			return
		}
		// OpenAI Compatible settings are now correctly stored in codebaseIndexConfig
		// No workaround needed - they will be exported automatically with the config
		const dirname = path.dirname(uri.fsPath)
		await promises_1.default.mkdir(dirname, { recursive: true })
		await (0, safeWriteJson_1.safeWriteJson)(uri.fsPath, { providerProfiles, globalSettings })
	} catch (e) {
		console.error("Failed to export settings:", e)
		// Don't re-throw - the UI will handle showing error messages
	}
}
exports.exportSettings = exportSettings
/**
 * Import settings with complete UI feedback and provider state updates
 * @param options - Import options with provider instance
 * @param filePath - Optional file path to import from. If not provided, a file dialog will be shown.
 * @returns Promise that resolves when import is complete
 */
const importSettingsWithFeedback = async (
	{ providerSettingsManager, contextProxy, customModesManager, provider },
	filePath,
) => {
	let result
	if (filePath) {
		// Validate file path and check if file exists
		try {
			// Check if file exists and is readable
			await promises_1.default.access(
				filePath,
				promises_1.default.constants.F_OK | promises_1.default.constants.R_OK,
			)
			result = await importSettingsFromPath(filePath, {
				providerSettingsManager,
				contextProxy,
				customModesManager,
			})
		} catch (error) {
			result = {
				success: false,
				error: `Cannot access file at path "${filePath}": ${error instanceof Error ? error.message : "Unknown error"}`,
			}
		}
	} else {
		result = await (0, exports.importSettings)({ providerSettingsManager, contextProxy, customModesManager })
	}
	if (result.success) {
		provider.settingsImportedAt = Date.now()
		await provider.postStateToWebview()
		await vscode.window.showInformationMessage((0, i18n_1.t)("common:info.settings_imported"))
	} else if (result.error) {
		await vscode.window.showErrorMessage(
			(0, i18n_1.t)("common:errors.settings_import_failed", { error: result.error }),
		)
	}
}
exports.importSettingsWithFeedback = importSettingsWithFeedback
//# sourceMappingURL=importExport.js.map
