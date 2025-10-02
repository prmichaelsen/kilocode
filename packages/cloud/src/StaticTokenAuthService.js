"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.StaticTokenAuthService = void 0
const events_1 = __importDefault(require("events"))
const jwt_decode_1 = require("jwt-decode")
class StaticTokenAuthService extends events_1.default {
	constructor(context, token, log) {
		super()
		Object.defineProperty(this, "state", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "active-session",
		})
		Object.defineProperty(this, "token", {
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
		Object.defineProperty(this, "userInfo", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.token = token
		this.log = log || console.log
		this.log("[auth] Using StaticTokenAuthService")
		let payload
		try {
			payload = (0, jwt_decode_1.jwtDecode)(token)
		} catch (error) {
			this.log("[auth] Failed to parse JWT:", error)
		}
		this.userInfo = {
			id: payload?.r?.u || payload?.sub || undefined,
			organizationId: payload?.r?.o || undefined,
			extensionBridgeEnabled: true,
		}
	}
	async initialize() {
		this.state = "active-session"
	}
	broadcast() {
		this.emit("auth-state-changed", {
			state: this.state,
			previousState: "initializing",
		})
		this.emit("user-info", { userInfo: this.userInfo })
	}
	async login() {
		throw new Error("Authentication methods are disabled in StaticTokenAuthService")
	}
	async logout() {
		throw new Error("Authentication methods are disabled in StaticTokenAuthService")
	}
	async handleCallback(_code, _state, _organizationId) {
		throw new Error("Authentication methods are disabled in StaticTokenAuthService")
	}
	async switchOrganization(_organizationId) {
		throw new Error("Authentication methods are disabled in StaticTokenAuthService")
	}
	async getOrganizationMemberships() {
		throw new Error("Authentication methods are disabled in StaticTokenAuthService")
	}
	getState() {
		return this.state
	}
	getSessionToken() {
		return this.token
	}
	isAuthenticated() {
		return true
	}
	hasActiveSession() {
		return true
	}
	hasOrIsAcquiringActiveSession() {
		return true
	}
	getUserInfo() {
		return this.userInfo
	}
	getStoredOrganizationId() {
		return this.userInfo?.organizationId || null
	}
}
exports.StaticTokenAuthService = StaticTokenAuthService
//# sourceMappingURL=StaticTokenAuthService.js.map
