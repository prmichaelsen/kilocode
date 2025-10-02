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
exports.PostHogTelemetryClient = void 0
const posthog_node_1 = require("posthog-node")
const vscode = __importStar(require("vscode"))
const types_1 = require("@roo-code/types")
const BaseTelemetryClient_1 = require("./BaseTelemetryClient")
/**
 * PostHogTelemetryClient handles telemetry event tracking for the Roo Code extension.
 * Uses PostHog analytics to track user interactions and system events.
 * Respects user privacy settings and VSCode's global telemetry configuration.
 */
class PostHogTelemetryClient extends BaseTelemetryClient_1.BaseTelemetryClient {
	constructor(debug = false) {
		super(
			{
				type: "exclude",
				events: [
					types_1.TelemetryEventName.TASK_MESSAGE,
					// TelemetryEventName.LLM_COMPLETION // kilocode_change
				],
			},
			debug,
		)
		Object.defineProperty(this, "client", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "distinctId", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: vscode.env.machineId,
		})
		// Git repository properties that should be filtered out
		Object.defineProperty(this, "gitPropertyNames", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: ["repositoryUrl", "repositoryName", "defaultBranch"],
		})
		Object.defineProperty(this, "counter", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: 0,
		})
		Object.defineProperty(this, "kilocodeToken", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: "",
		})
		this.client = new posthog_node_1.PostHog(process.env.KILOCODE_POSTHOG_API_KEY || "", {
			host: "https://us.i.posthog.com",
			disableGeoip: false, // kilocode_change
		})
	}
	/**
	 * Filter out git repository properties for PostHog telemetry
	 * @param propertyName The property name to check
	 * @returns Whether the property should be included in telemetry events
	 */
	isPropertyCapturable(propertyName) {
		// Filter out git repository properties
		if (this.gitPropertyNames.includes(propertyName)) {
			return false
		}
		return true
	}
	async capture(event) {
		if (!this.isTelemetryEnabled() || !this.isEventCapturable(event.event)) {
			if (this.debug) {
				console.info(`[PostHogTelemetryClient#capture] Skipping event: ${event.event}`)
			}
			return
		}
		if (this.debug) {
			console.info(`[PostHogTelemetryClient#capture] ${event.event}`)
		}
		this.client.capture({
			distinctId: this.distinctId,
			event: event.event,
			properties: await this.getEventProperties(event),
		})
	}
	/**
	 * Updates the telemetry state based on user preferences and VSCode settings.
	 * Only enables telemetry if both VSCode global telemetry is enabled and
	 * user has opted in.
	 * @param didUserOptIn Whether the user has explicitly opted into telemetry
	 */
	updateTelemetryState(didUserOptIn) {
		this.telemetryEnabled = false
		// First check global telemetry level - telemetry should only be enabled when level is "all".
		const telemetryLevel = vscode.workspace.getConfiguration("telemetry").get("telemetryLevel", "all")
		const globalTelemetryEnabled = telemetryLevel === "all"
		// We only enable telemetry if global vscode telemetry is enabled.
		if (globalTelemetryEnabled) {
			this.telemetryEnabled = didUserOptIn
		}
		// Update PostHog client state based on telemetry preference.
		if (this.telemetryEnabled) {
			this.client.optIn()
		} else {
			this.client.optOut()
		}
	}
	async shutdown() {
		await this.client.shutdown()
	}
	// kilocode_change start
	async captureException(error, properties) {
		if (this.isTelemetryEnabled()) {
			let providerProperties = {}
			try {
				providerProperties = (await this.providerRef?.deref()?.getTelemetryProperties()) || {}
			} catch (error) {
				console.error("Error getting provider properties", error)
			}
			this.client.captureException(error, this.distinctId, {
				...(providerProperties || {}),
				...(properties || {}),
			})
		}
	}
	async updateIdentity(kilocodeToken) {
		if (kilocodeToken === this.kilocodeToken) {
			console.debug("KILOTEL: Identity up-to-date")
			return
		}
		if (!kilocodeToken) {
			console.debug("KILOTEL: Updating identity to machine ID")
			this.distinctId = vscode.env.machineId
			this.kilocodeToken = ""
			return
		}
		const id = ++this.counter
		try {
			const response = await fetch("https://api.kilocode.ai/api/profile", {
				headers: {
					Authorization: `Bearer ${kilocodeToken}`,
					"Content-Type": "application/json",
				},
			})
			const data = await response.json()
			if (!data?.user?.email) {
				throw new Error("Invalid response")
			}
			if (id === this.counter) {
				this.distinctId = data.user.email
				this.kilocodeToken = kilocodeToken
				console.debug("KILOTEL: Identity updated to:", this.distinctId)
			} else {
				console.debug("KILOTEL: Identity update ignored, newer request in progress")
			}
		} catch (error) {
			console.error("KILOTEL: Failed to update identity", error)
			if (id === this.counter) {
				this.distinctId = vscode.env.machineId
				this.kilocodeToken = ""
			}
		}
	}
}
exports.PostHogTelemetryClient = PostHogTelemetryClient
//# sourceMappingURL=PostHogTelemetryClient.js.map
