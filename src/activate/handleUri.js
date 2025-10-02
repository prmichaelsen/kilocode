"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.handleUri = void 0
const cloud_1 = require("@roo-code/cloud")
const ClineProvider_1 = require("../core/webview/ClineProvider")
const handleUri = async (uri) => {
	const path = uri.path
	const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
	const visibleProvider = ClineProvider_1.ClineProvider.getVisibleInstance()
	if (!visibleProvider) {
		return
	}
	switch (path) {
		case "/glama": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleGlamaCallback(code)
			}
			break
		}
		case "/openrouter": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleOpenRouterCallback(code)
			}
			break
		}
		case "/kilocode": {
			const token = query.get("token")
			if (token) {
				await visibleProvider.handleKiloCodeCallback(token)
			}
			break
		}
		// kilocode_change start
		case "/kilocode/profile": {
			await visibleProvider.postMessageToWebview({
				type: "action",
				action: "profileButtonClicked",
			})
			await visibleProvider.postMessageToWebview({
				type: "updateProfileData",
			})
			break
		}
		// kilocode_change end
		case "/requesty": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleRequestyCallback(code)
			}
			break
		}
		case "/auth/clerk/callback": {
			const code = query.get("code")
			const state = query.get("state")
			const organizationId = query.get("organizationId")
			await cloud_1.CloudService.instance.handleAuthCallback(
				code,
				state,
				organizationId === "null" ? null : organizationId,
			)
			break
		}
		default:
			break
	}
}
exports.handleUri = handleUri
//# sourceMappingURL=handleUri.js.map
