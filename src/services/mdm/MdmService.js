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
Object.defineProperty(exports, "__esModule", { value: true })
exports.MdmService = void 0
const fs = __importStar(require("fs"))
const path = __importStar(require("path"))
const os = __importStar(require("os"))
const zod_1 = require("zod")
const cloud_1 = require("@roo-code/cloud")
const i18n_1 = require("../../i18n")
// MDM Configuration Schema
const mdmConfigSchema = zod_1.z.object({
	requireCloudAuth: zod_1.z.boolean(),
	organizationId: zod_1.z.string().optional(),
})
class MdmService {
	constructor(log) {
		Object.defineProperty(this, "mdmConfig", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "log", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.log = log || console.log
	}
	/**
	 * Initialize the MDM service by loading configuration
	 */
	async initialize() {
		try {
			this.mdmConfig = await this.loadMdmConfig()
			if (this.mdmConfig) {
				this.log(`[MDM] Loaded MDM configuration: ${JSON.stringify(this.mdmConfig)}`)
			}
		} catch (error) {
			this.log(`[MDM] Error loading MDM configuration: ${error instanceof Error ? error.message : String(error)}`)
			// Don't throw - extension should work without MDM config.
		}
	}
	/**
	 * Check if cloud authentication is required by MDM policy
	 */
	requiresCloudAuth() {
		return this.mdmConfig?.requireCloudAuth ?? false
	}
	/**
	 * Get the required organization ID from MDM policy
	 */
	getRequiredOrganizationId() {
		return this.mdmConfig?.organizationId
	}
	/**
	 * Check if the current state is compliant with MDM policy
	 */
	isCompliant() {
		// If no MDM policy, always compliant
		if (!this.requiresCloudAuth()) {
			return { compliant: true }
		}
		// Check if cloud service is available and has active or attempting session
		if (!cloud_1.CloudService.hasInstance() || !cloud_1.CloudService.instance.hasOrIsAcquiringActiveSession()) {
			return {
				compliant: false,
				reason: (0, i18n_1.t)("mdm.errors.cloud_auth_required"),
			}
		}
		// Check organization match if specified
		const requiredOrgId = this.getRequiredOrganizationId()
		if (requiredOrgId) {
			try {
				// First try to get from active session
				let currentOrgId = cloud_1.CloudService.instance.getOrganizationId()
				// If no active session, check stored credentials
				if (!currentOrgId) {
					const storedOrgId = cloud_1.CloudService.instance.getStoredOrganizationId()
					// null means personal account, which is not compliant for org requirements
					if (storedOrgId === null || storedOrgId !== requiredOrgId) {
						return {
							compliant: false,
							reason: (0, i18n_1.t)("mdm.errors.organization_mismatch"),
						}
					}
					currentOrgId = storedOrgId
				}
				if (currentOrgId !== requiredOrgId) {
					return {
						compliant: false,
						reason: (0, i18n_1.t)("mdm.errors.organization_mismatch"),
					}
				}
			} catch (error) {
				this.log("[MDM] Error checking organization ID:", error)
				return {
					compliant: false,
					reason: (0, i18n_1.t)("mdm.errors.verification_failed"),
				}
			}
		}
		return { compliant: true }
	}
	/**
	 * Load MDM configuration from system location
	 */
	async loadMdmConfig() {
		const configPath = this.getMdmConfigPath()
		try {
			// Check if file exists
			if (!fs.existsSync(configPath)) {
				return null
			}
			// Read and parse the configuration file
			const configContent = fs.readFileSync(configPath, "utf-8")
			const parsedConfig = JSON.parse(configContent)
			// Validate against schema
			return mdmConfigSchema.parse(parsedConfig)
		} catch (error) {
			this.log(`[MDM] Error reading MDM config from ${configPath}:`, error)
			return null
		}
	}
	/**
	 * Get the platform-specific MDM configuration file path
	 */
	getMdmConfigPath() {
		const platform = os.platform()
		const isProduction = (0, cloud_1.getClerkBaseUrl)() === cloud_1.PRODUCTION_CLERK_BASE_URL
		const configFileName = isProduction ? "mdm.json" : "mdm.dev.json"
		switch (platform) {
			case "win32": {
				// Windows: %ProgramData%\RooCode\mdm.json or mdm.dev.json
				const programData = process.env.PROGRAMDATA || "C:\\ProgramData"
				return path.join(programData, "RooCode", configFileName)
			}
			case "darwin":
				// macOS: /Library/Application Support/RooCode/mdm.json or mdm.dev.json
				return `/Library/Application Support/RooCode/${configFileName}`
			case "linux":
			default:
				// Linux: /etc/roo-code/mdm.json or mdm.dev.json
				return `/etc/roo-code/${configFileName}`
		}
	}
	/**
	 * Get the singleton instance
	 */
	static getInstance() {
		if (!this._instance) {
			throw new Error("MdmService not initialized. Call createInstance() first.")
		}
		return this._instance
	}
	/**
	 * Create and initialize the singleton instance
	 */
	static async createInstance(log) {
		if (this._instance) {
			throw new Error("MdmService instance already exists")
		}
		this._instance = new MdmService(log)
		await this._instance.initialize()
		return this._instance
	}
	/**
	 * Check if instance exists
	 */
	static hasInstance() {
		return this._instance !== null
	}
	/**
	 * Reset the instance (for testing)
	 */
	static resetInstance() {
		this._instance = null
	}
}
exports.MdmService = MdmService
Object.defineProperty(MdmService, "_instance", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: null,
})
//# sourceMappingURL=MdmService.js.map
