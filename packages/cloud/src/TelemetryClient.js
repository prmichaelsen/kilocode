"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.CloudTelemetryClient = void 0
/* eslint-disable @typescript-eslint/no-unused-vars */ /* kilocode_change this file is meant to be a stub */
const types_1 = require("@roo-code/types")
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
			}
		}
		// Merge provider properties with event-specific properties.
		// Event properties take precedence in case of conflicts.
		const mergedProperties = {
			...providerProperties,
			...(event.properties || {}),
		}
		// Filter out properties that shouldn't be captured by this client
		return Object.fromEntries(Object.entries(mergedProperties).filter(([key]) => this.isPropertyCapturable(key)))
	}
	setProvider(provider) {
		this.providerRef = new WeakRef(provider)
	}
	isTelemetryEnabled() {
		return this.telemetryEnabled
	}
}
class CloudTelemetryClient extends BaseTelemetryClient {
	constructor(authService, settingsService, retryQueue) {
		super({
			type: "exclude",
			events: [types_1.TelemetryEventName.TASK_CONVERSATION_MESSAGE],
		})
		Object.defineProperty(this, "authService", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: authService,
		})
		Object.defineProperty(this, "settingsService", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: settingsService,
		})
		Object.defineProperty(this, "retryQueue", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		this.retryQueue = retryQueue || null
	}
	// kilocode_change
	async fetch(path, options, allowQueueing = true) {
		if (!this.authService.isAuthenticated()) {
			return
		}
		const token = this.authService.getSessionToken()
		if (!token) {
			console.error(`[TelemetryClient#fetch] Unauthorized: No session token available.`)
			return
		}
		/* kilocode_change
        const response = await fetch(`${getRooCodeApiUrl()}/api/${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }

        try {
            const response = await fetch(url, fetchOptions)

            if (!response.ok) {
                console.error(
                    `[TelemetryClient#fetch] ${options.method} ${path} -> ${response.status} ${response.statusText}`,
                )

                // Queue for retry on server errors (5xx) or rate limiting (429)
                // Do NOT retry on client errors (4xx) except 429 - they won't succeed
                if (this.retryQueue && allowQueueing && (response.status >= 500 || response.status === 429)) {
                    await this.retryQueue.enqueue(url, fetchOptions, "telemetry")
                }
            }

            return response
        } catch (error) {
            console.error(`[TelemetryClient#fetch] Network error for ${options.method} ${path}: ${error}`)

            // Queue for retry on network failures (typically TypeError with "fetch failed" message)
            // These are transient network issues that may succeed on retry
            if (
                this.retryQueue &&
                allowQueueing &&
                error instanceof TypeError &&
                error.message.includes("fetch failed")
            ) {
                await this.retryQueue.enqueue(url, fetchOptions, "telemetry")
            }

            throw error
        }
            */
	}
	async capture(event) {
		/* kilocode_change

        if (!this.isTelemetryEnabled() || !this.isEventCapturable(event.event)) {
            if (this.debug) {
                console.info(`[TelemetryClient#capture] Skipping event: ${event.event}`)
            }

            return
        }

        const payload = {
            type: event.event,
            properties: await this.getEventProperties(event),
        }

        if (this.debug) {
            console.info(`[TelemetryClient#capture] ${JSON.stringify(payload)}`)
        }

        const result = rooCodeTelemetryEventSchema.safeParse(payload)

        if (!result.success) {
            console.error(
                `[TelemetryClient#capture] Invalid telemetry event: ${result.error.message} - ${JSON.stringify(payload)}`,
            )

            return
        }

        try {
            await this.fetch(`events`, {
                method: "POST",
                body: JSON.stringify(result.data),
            })
        } catch (error) {
            console.error(`[TelemetryClient#capture] Error sending telemetry event: ${error}`)
            // Error is already queued for retry in the fetch method
        }
        */
	}
	async backfillMessages(messages, taskId) {
		/* kilocode_change
        if (!this.authService.isAuthenticated()) {
            if (this.debug) {
                console.info(`[TelemetryClient#backfillMessages] Skipping: Not authenticated`)
            }
            return
        }

        const token = this.authService.getSessionToken()

        if (!token) {
            console.error(`[TelemetryClient#backfillMessages] Unauthorized: No session token available.`)
            return
        }

        try {
            const mergedProperties = await this.getEventProperties({
                event: TelemetryEventName.TASK_MESSAGE,
                properties: { taskId },
            })

            const formData = new FormData()
            formData.append("taskId", taskId)
            formData.append("properties", JSON.stringify(mergedProperties))

            formData.append(
                "file",
                new File([JSON.stringify(messages)], "task.json", {
                    type: "application/json",
                }),
            )

            if (this.debug) {
                console.info(
                    `[TelemetryClient#backfillMessages] Uploading ${messages.length} messages for task ${taskId}`,
                )
            }

            const url = `${getRooCodeApiUrl()}/api/events/backfill`
            const fetchOptions: RequestInit = {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            }

            try {
                const response = await fetch(url, fetchOptions)

                if (!response.ok) {
                    console.error(
                        `[TelemetryClient#backfillMessages] POST events/backfill -> ${response.status} ${response.statusText}`,
                    )
                }
            } catch (fetchError) {
                console.error(`[TelemetryClient#backfillMessages] Network error: ${fetchError}`)
                throw fetchError
            }
        } catch (error) {
            console.error(`[TelemetryClient#backfillMessages] Error uploading messages: ${error}`)
        }
        */
	}
	updateTelemetryState(_didUserOptIn) {}
	isTelemetryEnabled() {
		return true
	}
	isEventCapturable(eventName) {
		// Ensure that this event type is supported by the telemetry client
		if (!super.isEventCapturable(eventName)) {
			return false
		}
		// Only record message telemetry if task sync is enabled
		if (eventName === types_1.TelemetryEventName.TASK_MESSAGE) {
			return this.settingsService.isTaskSyncEnabled()
		}
		// Other telemetry types are capturable at this point
		return true
	}
	captureException(error, properties) {} // kilocode_change
	async updateIdentity(kilocodeToken) {} // kilocode_change
	async shutdown() {}
}
exports.CloudTelemetryClient = CloudTelemetryClient
//# sourceMappingURL=TelemetryClient.js.map
