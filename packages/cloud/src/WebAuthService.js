"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.WebAuthService = void 0
const crypto_1 = __importDefault(require("crypto"))
const events_1 = __importDefault(require("events"))
const zod_1 = require("zod")
const config_js_1 = require("./config.js")
const utils_js_1 = require("./utils.js")
const importVscode_js_1 = require("./importVscode.js")
const errors_js_1 = require("./errors.js")
const RefreshTimer_js_1 = require("./RefreshTimer.js")
const AUTH_STATE_KEY = "clerk-auth-state"
/**
 * AuthCredentials
 */
const authCredentialsSchema = zod_1.z.object({
	clientToken: zod_1.z.string().min(1, "Client token cannot be empty"),
	sessionId: zod_1.z.string().min(1, "Session ID cannot be empty"),
	organizationId: zod_1.z.string().nullable().optional(),
})
/**
 * Clerk Schemas
 */
const clerkSignInResponseSchema = zod_1.z.object({
	response: zod_1.z.object({
		created_session_id: zod_1.z.string(),
	}),
})
const clerkCreateSessionTokenResponseSchema = zod_1.z.object({
	jwt: zod_1.z.string(),
})
const clerkMeResponseSchema = zod_1.z.object({
	response: zod_1.z.object({
		id: zod_1.z.string().optional(),
		first_name: zod_1.z.string().nullish(),
		last_name: zod_1.z.string().nullish(),
		image_url: zod_1.z.string().optional(),
		primary_email_address_id: zod_1.z.string().optional(),
		email_addresses: zod_1.z
			.array(
				zod_1.z.object({
					id: zod_1.z.string(),
					email_address: zod_1.z.string(),
				}),
			)
			.optional(),
		public_metadata: zod_1.z.record(zod_1.z.any()).optional(),
	}),
})
const clerkOrganizationMembershipsSchema = zod_1.z.object({
	response: zod_1.z.array(
		zod_1.z.object({
			id: zod_1.z.string(),
			role: zod_1.z.string(),
			permissions: zod_1.z.array(zod_1.z.string()).optional(),
			created_at: zod_1.z.number().optional(),
			updated_at: zod_1.z.number().optional(),
			organization: zod_1.z.object({
				id: zod_1.z.string(),
				name: zod_1.z.string(),
				slug: zod_1.z.string().optional(),
				image_url: zod_1.z.string().optional(),
				has_image: zod_1.z.boolean().optional(),
				created_at: zod_1.z.number().optional(),
				updated_at: zod_1.z.number().optional(),
			}),
		}),
	),
})
class WebAuthService extends events_1.default {
	constructor(context, log) {
		super()
		Object.defineProperty(this, "context", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "timer", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "state", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "initializing",
		})
		Object.defineProperty(this, "log", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "authCredentialsKey", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "credentials", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "sessionToken", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "userInfo", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "isFirstRefreshAttempt", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: false,
		})
		this.context = context
		this.log = log || console.log
		this.log("[auth] Using WebAuthService")
		// Calculate auth credentials key based on Clerk base URL.
		const clerkBaseUrl = (0, config_js_1.getClerkBaseUrl)()
		if (clerkBaseUrl !== config_js_1.PRODUCTION_CLERK_BASE_URL) {
			this.authCredentialsKey = `clerk-auth-credentials-${clerkBaseUrl}`
		} else {
			this.authCredentialsKey = "clerk-auth-credentials"
		}
		this.timer = new RefreshTimer_js_1.RefreshTimer({
			callback: async () => {
				await this.refreshSession()
				return true
			},
			successInterval: 50000,
			initialBackoffMs: 1000,
			maxBackoffMs: 300000,
		})
	}
	changeState(newState) {
		const previousState = this.state
		this.state = newState
		this.log(`[auth] changeState: ${previousState} -> ${newState}`)
		this.emit("auth-state-changed", { state: newState, previousState })
	}
	async handleCredentialsChange() {
		try {
			const credentials = await this.loadCredentials()
			if (credentials) {
				if (
					this.credentials === null ||
					this.credentials.clientToken !== credentials.clientToken ||
					this.credentials.sessionId !== credentials.sessionId ||
					this.credentials.organizationId !== credentials.organizationId
				) {
					this.transitionToAttemptingSession(credentials)
				}
			} else {
				if (this.state !== "logged-out") {
					this.transitionToLoggedOut()
				}
			}
		} catch (error) {
			this.log("[auth] Error handling credentials change:", error)
		}
	}
	transitionToLoggedOut() {
		this.timer.stop()
		this.credentials = null
		this.sessionToken = null
		this.userInfo = null
		this.changeState("logged-out")
	}
	transitionToAttemptingSession(credentials) {
		this.credentials = credentials
		this.sessionToken = null
		this.userInfo = null
		this.isFirstRefreshAttempt = true
		this.changeState("attempting-session")
		this.timer.stop()
		this.timer.start()
	}
	transitionToInactiveSession() {
		this.sessionToken = null
		this.userInfo = null
		this.changeState("inactive-session")
	}
	/**
	 * Initialize the auth state
	 *
	 * This method loads tokens from storage and determines the current auth state.
	 * It also starts the refresh timer if we have an active session.
	 */
	async initialize() {
		if (this.state !== "initializing") {
			this.log("[auth] initialize() called after already initialized")
			return
		}
		await this.handleCredentialsChange()
		this.context.subscriptions.push(
			this.context.secrets.onDidChange((e) => {
				if (e.key === this.authCredentialsKey) {
					this.handleCredentialsChange()
				}
			}),
		)
	}
	broadcast() {}
	async storeCredentials(credentials) {
		await this.context.secrets.store(this.authCredentialsKey, JSON.stringify(credentials))
	}
	async loadCredentials() {
		const credentialsJson = await this.context.secrets.get(this.authCredentialsKey)
		if (!credentialsJson) return null
		try {
			const parsedJson = JSON.parse(credentialsJson)
			const credentials = authCredentialsSchema.parse(parsedJson)
			// Migration: If no organizationId but we have userInfo, add it
			if (credentials.organizationId === undefined && this.userInfo?.organizationId) {
				credentials.organizationId = this.userInfo.organizationId
				await this.storeCredentials(credentials)
				this.log("[auth] Migrated credentials with organizationId")
			}
			return credentials
		} catch (error) {
			if (error instanceof zod_1.z.ZodError) {
				this.log("[auth] Invalid credentials format:", error.errors)
			} else {
				this.log("[auth] Failed to parse stored credentials:", error)
			}
			return null
		}
	}
	async clearCredentials() {
		await this.context.secrets.delete(this.authCredentialsKey)
	}
	/**
	 * Start the login process
	 *
	 * This method initiates the authentication flow by generating a state parameter
	 * and opening the browser to the authorization URL.
	 *
	 * @param landingPageSlug Optional slug of a specific landing page (e.g., "supernova", "special-offer", etc.)
	 */
	async login(landingPageSlug) {
		try {
			const vscode = await (0, importVscode_js_1.importVscode)()
			if (!vscode) {
				throw new Error("VS Code API not available")
			}
			// Generate a cryptographically random state parameter.
			const state = crypto_1.default.randomBytes(16).toString("hex")
			await this.context.globalState.update(AUTH_STATE_KEY, state)
			const packageJSON = this.context.extension?.packageJSON
			const publisher = packageJSON?.publisher ?? "RooVeterinaryInc"
			const name = packageJSON?.name ?? "roo-cline"
			const params = new URLSearchParams({
				state,
				auth_redirect: `${vscode.env.uriScheme}://${publisher}.${name}`,
			})
			// Use landing page URL if slug is provided, otherwise use default sign-in URL
			const url = landingPageSlug
				? `${(0, config_js_1.getRooCodeApiUrl)()}/l/${landingPageSlug}?${params.toString()}`
				: `${(0, config_js_1.getRooCodeApiUrl)()}/extension/sign-in?${params.toString()}`
			await vscode.env.openExternal(vscode.Uri.parse(url))
		} catch (error) {
			const context = landingPageSlug ? ` (landing page: ${landingPageSlug})` : ""
			this.log(`[auth] Error initiating Roo Code Cloud auth${context}: ${error}`)
			throw new Error(`Failed to initiate Roo Code Cloud authentication${context}: ${error}`)
		}
	}
	/**
	 * Handle the callback from Roo Code Cloud
	 *
	 * This method is called when the user is redirected back to the extension
	 * after authenticating with Roo Code Cloud.
	 *
	 * @param code The authorization code from the callback
	 * @param state The state parameter from the callback
	 * @param organizationId The organization ID from the callback (null for personal accounts)
	 */
	async handleCallback(code, state, organizationId) {
		if (!code || !state) {
			const vscode = await (0, importVscode_js_1.importVscode)()
			if (vscode) {
				vscode.window.showInformationMessage("Invalid Roo Code Cloud sign in url")
			}
			return
		}
		try {
			// Validate state parameter to prevent CSRF attacks.
			const storedState = this.context.globalState.get(AUTH_STATE_KEY)
			if (state !== storedState) {
				this.log("[auth] State mismatch in callback")
				throw new Error("Invalid state parameter. Authentication request may have been tampered with.")
			}
			const credentials = await this.clerkSignIn(code)
			// Set organizationId (null for personal accounts)
			credentials.organizationId = organizationId || null
			await this.storeCredentials(credentials)
			const vscode = await (0, importVscode_js_1.importVscode)()
			if (vscode) {
				vscode.window.showInformationMessage("Successfully authenticated with Roo Code Cloud")
			}
			this.log("[auth] Successfully authenticated with Roo Code Cloud")
		} catch (error) {
			this.log(`[auth] Error handling Roo Code Cloud callback: ${error}`)
			this.changeState("logged-out")
			throw new Error(`Failed to handle Roo Code Cloud callback: ${error}`)
		}
	}
	/**
	 * Log out
	 *
	 * This method removes all stored tokens and stops the refresh timer.
	 */
	async logout() {
		const oldCredentials = this.credentials
		try {
			// Clear credentials from storage - onDidChange will handle state transitions
			await this.clearCredentials()
			await this.context.globalState.update(AUTH_STATE_KEY, undefined)
			if (oldCredentials) {
				try {
					await this.clerkLogout(oldCredentials)
				} catch (error) {
					this.log("[auth] Error calling clerkLogout:", error)
				}
			}
			const vscode = await (0, importVscode_js_1.importVscode)()
			if (vscode) {
				vscode.window.showInformationMessage("Logged out from Roo Code Cloud")
			}
			this.log("[auth] Logged out from Roo Code Cloud")
		} catch (error) {
			this.log(`[auth] Error logging out from Roo Code Cloud: ${error}`)
			throw new Error(`Failed to log out from Roo Code Cloud: ${error}`)
		}
	}
	getState() {
		return this.state
	}
	getSessionToken() {
		if (this.state === "active-session" && this.sessionToken) {
			return this.sessionToken
		}
		return
	}
	/**
	 * Check if the user is authenticated
	 *
	 * @returns True if the user is authenticated (has an active, attempting, or inactive session)
	 */
	isAuthenticated() {
		return (
			this.state === "active-session" || this.state === "attempting-session" || this.state === "inactive-session"
		)
	}
	hasActiveSession() {
		return this.state === "active-session"
	}
	/**
	 * Check if the user has an active session or is currently attempting to acquire one
	 *
	 * @returns True if the user has an active session or is attempting to get one
	 */
	hasOrIsAcquiringActiveSession() {
		return this.state === "active-session" || this.state === "attempting-session"
	}
	/**
	 * Refresh the session
	 *
	 * This method refreshes the session token using the client token.
	 */
	async refreshSession() {
		if (!this.credentials) {
			this.log("[auth] Cannot refresh session: missing credentials")
			return
		}
		try {
			const previousState = this.state
			this.sessionToken = await this.clerkCreateSessionToken()
			if (previousState !== "active-session") {
				this.changeState("active-session")
				this.fetchUserInfo()
			} else {
				this.state = "active-session"
			}
		} catch (error) {
			if (error instanceof errors_js_1.InvalidClientTokenError) {
				this.log("[auth] Invalid/Expired client token: clearing credentials")
				this.clearCredentials()
			} else if (this.isFirstRefreshAttempt && this.state === "attempting-session") {
				this.isFirstRefreshAttempt = false
				this.transitionToInactiveSession()
			}
			this.log("[auth] Failed to refresh session", error)
			throw error
		}
	}
	async fetchUserInfo() {
		if (!this.credentials) {
			return
		}
		this.userInfo = await this.clerkMe()
		this.emit("user-info", { userInfo: this.userInfo })
	}
	/**
	 * Extract user information from the ID token
	 *
	 * @returns User information from ID token claims or null if no ID token available
	 */
	getUserInfo() {
		return this.userInfo
	}
	/**
	 * Get the stored organization ID from credentials
	 *
	 * @returns The stored organization ID, null for personal accounts or if no credentials exist
	 */
	getStoredOrganizationId() {
		return this.credentials?.organizationId || null
	}
	/**
	 * Switch to a different organization context
	 * @param organizationId The organization ID to switch to, or null for personal account
	 */
	async switchOrganization(organizationId) {
		if (!this.credentials) {
			throw new Error("Cannot switch organization: not authenticated")
		}
		// Update the stored credentials with the new organization ID
		const updatedCredentials = {
			...this.credentials,
			organizationId: organizationId,
		}
		// Store the updated credentials, handleCredentialsChange will handle the update
		await this.storeCredentials(updatedCredentials)
	}
	/**
	 * Get all organization memberships for the current user
	 * @returns Array of organization memberships
	 */
	async getOrganizationMemberships() {
		if (!this.credentials) {
			return []
		}
		try {
			return await this.clerkGetOrganizationMemberships()
		} catch (error) {
			this.log(`[auth] Failed to get organization memberships: ${error}`)
			return []
		}
	}
	async clerkSignIn(ticket) {
		const formData = new URLSearchParams()
		formData.append("strategy", "ticket")
		formData.append("ticket", ticket)
		const response = await fetch(`${(0, config_js_1.getClerkBaseUrl)()}/v1/client/sign_ins`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"User-Agent": this.userAgent(),
			},
			body: formData.toString(),
			signal: AbortSignal.timeout(10000),
		})
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}
		const {
			response: { created_session_id: sessionId },
		} = clerkSignInResponseSchema.parse(await response.json())
		// 3. Extract the client token from the Authorization header.
		const clientToken = response.headers.get("authorization")
		if (!clientToken) {
			throw new Error("No authorization header found in the response")
		}
		return authCredentialsSchema.parse({ clientToken, sessionId })
	}
	async clerkCreateSessionToken() {
		const formData = new URLSearchParams()
		formData.append("_is_native", "1")
		// Handle 3 cases for organization_id:
		// 1. Have an org id: organization_id=THE_ORG_ID
		// 2. Have a personal account: organization_id= (empty string)
		// 3. Don't know if you have an org id (old style credentials): don't send organization_id param at all
		const organizationId = this.getStoredOrganizationId()
		if (this.credentials?.organizationId !== undefined) {
			// We have organization context info (either org id or personal account)
			formData.append("organization_id", organizationId || "")
		}
		// If organizationId is undefined, don't send the param at all (old credentials)
		const response = await fetch(
			`${(0, config_js_1.getClerkBaseUrl)()}/v1/client/sessions/${this.credentials.sessionId}/tokens`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Bearer ${this.credentials.clientToken}`,
					"User-Agent": this.userAgent(),
				},
				body: formData.toString(),
				signal: AbortSignal.timeout(10000),
			},
		)
		if (response.status === 401 || response.status === 404) {
			throw new errors_js_1.InvalidClientTokenError()
		} else if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}
		const data = clerkCreateSessionTokenResponseSchema.parse(await response.json())
		return data.jwt
	}
	async clerkMe() {
		const response = await fetch(`${(0, config_js_1.getClerkBaseUrl)()}/v1/me`, {
			headers: {
				Authorization: `Bearer ${this.credentials.clientToken}`,
				"User-Agent": this.userAgent(),
			},
			signal: AbortSignal.timeout(10000),
		})
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}
		const payload = await response.json()
		const { response: userData } = clerkMeResponseSchema.parse(payload)
		const userInfo = {
			id: userData.id,
			picture: userData.image_url,
		}
		const names = [userData.first_name, userData.last_name].filter((name) => !!name)
		userInfo.name = names.length > 0 ? names.join(" ") : undefined
		const primaryEmailAddressId = userData.primary_email_address_id
		const emailAddresses = userData.email_addresses
		if (primaryEmailAddressId && emailAddresses) {
			userInfo.email = emailAddresses.find((email) => primaryEmailAddressId === email.id)?.email_address
		}
		let extensionBridgeEnabled = true
		// Fetch organization info if user is in organization context
		try {
			const storedOrgId = this.getStoredOrganizationId()
			if (this.credentials?.organizationId !== undefined) {
				// We have organization context info
				if (storedOrgId !== null) {
					// User is in organization context - fetch user's memberships and filter
					const orgMemberships = await this.clerkGetOrganizationMemberships()
					const userMembership = this.findOrganizationMembership(orgMemberships, storedOrgId)
					if (userMembership) {
						this.setUserOrganizationInfo(userInfo, userMembership)
						extensionBridgeEnabled = await this.isExtensionBridgeEnabledForOrganization(storedOrgId)
						this.log("[auth] User in organization context:", {
							id: userMembership.organization.id,
							name: userMembership.organization.name,
							role: userMembership.role,
						})
					} else {
						this.log("[auth] Warning: User not found in stored organization:", storedOrgId)
					}
				} else {
					this.log("[auth] User in personal account context - not setting organization info")
				}
			} else {
				// Old credentials without organization context - fetch organization info to determine context
				const orgMemberships = await this.clerkGetOrganizationMemberships()
				const primaryOrgMembership = this.findPrimaryOrganizationMembership(orgMemberships)
				if (primaryOrgMembership) {
					this.setUserOrganizationInfo(userInfo, primaryOrgMembership)
					extensionBridgeEnabled = await this.isExtensionBridgeEnabledForOrganization(
						primaryOrgMembership.organization.id,
					)
					this.log("[auth] Legacy credentials: Found organization membership:", {
						id: primaryOrgMembership.organization.id,
						name: primaryOrgMembership.organization.name,
						role: primaryOrgMembership.role,
					})
				} else {
					this.log("[auth] Legacy credentials: No organization memberships found")
				}
			}
		} catch (error) {
			this.log("[auth] Failed to fetch organization info:", error)
			// Don't throw - organization info is optional
		}
		// Set the extension bridge enabled flag
		userInfo.extensionBridgeEnabled = extensionBridgeEnabled
		return userInfo
	}
	findOrganizationMembership(memberships, organizationId) {
		return memberships?.find((membership) => membership.organization.id === organizationId)
	}
	findPrimaryOrganizationMembership(memberships) {
		return memberships && memberships.length > 0 ? memberships[0] : undefined
	}
	setUserOrganizationInfo(userInfo, membership) {
		userInfo.organizationId = membership.organization.id
		userInfo.organizationName = membership.organization.name
		userInfo.organizationRole = membership.role
		userInfo.organizationImageUrl = membership.organization.image_url
	}
	async clerkGetOrganizationMemberships() {
		if (!this.credentials) {
			this.log("[auth] Cannot get organization memberships: missing credentials")
			return []
		}
		const response = await fetch(`${(0, config_js_1.getClerkBaseUrl)()}/v1/me/organization_memberships`, {
			headers: {
				Authorization: `Bearer ${this.credentials.clientToken}`,
				"User-Agent": this.userAgent(),
			},
			signal: AbortSignal.timeout(10000),
		})
		return clerkOrganizationMembershipsSchema.parse(await response.json()).response
	}
	async getOrganizationMetadata(organizationId) {
		try {
			const response = await fetch(`${(0, config_js_1.getClerkBaseUrl)()}/v1/organizations/${organizationId}`, {
				headers: {
					Authorization: `Bearer ${this.credentials.clientToken}`,
					"User-Agent": this.userAgent(),
				},
				signal: AbortSignal.timeout(10000),
			})
			if (!response.ok) {
				this.log(`[auth] Failed to fetch organization metadata: ${response.status} ${response.statusText}`)
				return null
			}
			const data = await response.json()
			return data.response || data
		} catch (error) {
			this.log("[auth] Error fetching organization metadata:", error)
			return null
		}
	}
	async isExtensionBridgeEnabledForOrganization(organizationId) {
		const orgMetadata = await this.getOrganizationMetadata(organizationId)
		return orgMetadata?.public_metadata?.extension_bridge_enabled === true
	}
	async clerkLogout(credentials) {
		const formData = new URLSearchParams()
		formData.append("_is_native", "1")
		const response = await fetch(
			`${(0, config_js_1.getClerkBaseUrl)()}/v1/client/sessions/${credentials.sessionId}/remove`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Bearer ${credentials.clientToken}`,
					"User-Agent": this.userAgent(),
				},
				body: formData.toString(),
				signal: AbortSignal.timeout(10000),
			},
		)
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`)
		}
	}
	userAgent() {
		return (0, utils_js_1.getUserAgent)(this.context)
	}
}
exports.WebAuthService = WebAuthService
//# sourceMappingURL=WebAuthService.js.map
