"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.BaseTelemetryClient = void 0
class BaseTelemetryClient {
	constructor(subscription, debug = false) {
		Object.defineProperty(this, "subscription", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: subscription,
		})
		Object.defineProperty(this, "debug", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: debug,
		})
		Object.defineProperty(this, "providerRef", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "telemetryEnabled", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: false,
		})
	}
	isEventCapturable(eventName) {
		if (!this.subscription) {
			return true
		}
		return this.subscription.type === "include"
			? this.subscription.events.includes(eventName)
			: !this.subscription.events.includes(eventName)
	}
	/**
	 * Determines if a specific property should be included in telemetry events
	 * Override in subclasses to filter specific properties
	 */
	isPropertyCapturable(_propertyName) {
		return true
	}
	async getEventProperties(event) {
		let providerProperties = {}
		const provider = this.providerRef?.deref()
		if (provider) {
			try {
				// Get properties from the provider
				providerProperties = await provider.getTelemetryProperties()
			} catch (error) {
				// Log error but continue with capturing the event.
				console.error(
					`Error getting telemetry properties: ${error instanceof Error ? error.message : String(error)}`,
				)
				providerProperties.exception = error instanceof Error ? error.stack || error.message : String(error) // kilocode_change
			}
		}
		// Merge provider properties with event-specific properties.
		// Event properties take precedence in case of conflicts.
		const mergedProperties = { ...providerProperties, ...(event.properties || {}) }
		// Filter out properties that shouldn't be captured by this client
		return Object.fromEntries(Object.entries(mergedProperties).filter(([key]) => this.isPropertyCapturable(key)))
	}
	setProvider(provider) {
		this.providerRef = new WeakRef(provider)
	}
	// kilocode_change start
	async captureException(_error, _properties) {}
	updateIdentity(_kilocodeToken) {
		return Promise.resolve()
	}
	// kilocode_change end
	isTelemetryEnabled() {
		return this.telemetryEnabled
	}
}
exports.BaseTelemetryClient = BaseTelemetryClient
//# sourceMappingURL=BaseTelemetryClient.js.map
