"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.CloudShareService = void 0
const importVscode_js_1 = require("./importVscode.js")
class CloudShareService {
	constructor(cloudAPI, settingsService, log) {
		Object.defineProperty(this, "cloudAPI", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "settingsService", {
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
		this.cloudAPI = cloudAPI
		this.settingsService = settingsService
		this.log = log || console.log
	}
	async shareTask(taskId, visibility = "organization") {
		try {
			const response = await this.cloudAPI.shareTask(taskId, visibility)
			if (response.success && response.shareUrl) {
				const vscode = await (0, importVscode_js_1.importVscode)()
				if (vscode?.env?.clipboard?.writeText) {
					try {
						await vscode.env.clipboard.writeText(response.shareUrl)
					} catch (copyErr) {
						this.log("[ShareService] Clipboard write failed (non-fatal):", copyErr)
					}
				} else {
					this.log("[ShareService] VS Code clipboard unavailable; running outside extension host.")
				}
			}
			return response
		} catch (error) {
			this.log("[ShareService] Error sharing task:", error)
			throw error
		}
	}
	async canShareTask() {
		try {
			return !!this.settingsService.getSettings()?.cloudSettings?.enableTaskSharing
		} catch (error) {
			this.log("[ShareService] Error checking if task can be shared:", error)
			return false
		}
	}
}
exports.CloudShareService = CloudShareService
//# sourceMappingURL=CloudShareService.js.map
