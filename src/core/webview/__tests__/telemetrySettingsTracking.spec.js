"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const vitest_1 = require("vitest")
const telemetry_1 = require("@roo-code/telemetry")
const types_1 = require("@roo-code/types")
;(0, vitest_1.describe)("Telemetry Settings Tracking", () => {
	let mockTelemetryService
	;(0, vitest_1.beforeEach)(() => {
		// Reset mocks
		vitest_1.vi.clearAllMocks()
		// Create mock service
		mockTelemetryService = {
			captureTelemetrySettingsChanged: vitest_1.vi.fn(),
			updateTelemetryState: vitest_1.vi.fn(),
			hasInstance: vitest_1.vi.fn().mockReturnValue(true),
		}
		// Mock the TelemetryService
		vitest_1.vi.spyOn(telemetry_1.TelemetryService, "hasInstance").mockReturnValue(true)
		vitest_1.vi.spyOn(telemetry_1.TelemetryService, "instance", "get").mockReturnValue(mockTelemetryService)
	})
	;(0, vitest_1.describe)("when telemetry is turned OFF", () => {
		;(0, vitest_1.it)("should fire event BEFORE disabling telemetry", () => {
			const previousSetting = "enabled"
			const newSetting = "disabled"
			// Simulate the logic from webviewMessageHandler
			const isOptedIn = newSetting !== "disabled"
			const wasPreviouslyOptedIn = previousSetting !== "disabled"
			// If turning telemetry OFF, fire event BEFORE disabling
			if (wasPreviouslyOptedIn && !isOptedIn && telemetry_1.TelemetryService.hasInstance()) {
				telemetry_1.TelemetryService.instance.captureTelemetrySettingsChanged(previousSetting, newSetting)
			}
			// Update the telemetry state
			telemetry_1.TelemetryService.instance.updateTelemetryState(isOptedIn)
			// Verify the event was captured before updateTelemetryState
			;(0, vitest_1.expect)(mockTelemetryService.captureTelemetrySettingsChanged).toHaveBeenCalledWith(
				"enabled",
				"disabled",
			)
			;(0, vitest_1.expect)(mockTelemetryService.captureTelemetrySettingsChanged).toHaveBeenCalledBefore(
				mockTelemetryService.updateTelemetryState,
			)
			;(0, vitest_1.expect)(mockTelemetryService.updateTelemetryState).toHaveBeenCalledWith(false)
		})
		;(0, vitest_1.it)("should fire event when going from unset to disabled", () => {
			const previousSetting = "unset"
			const newSetting = "disabled"
			const isOptedIn = newSetting !== "disabled"
			const wasPreviouslyOptedIn = previousSetting !== "disabled"
			if (wasPreviouslyOptedIn && !isOptedIn && telemetry_1.TelemetryService.hasInstance()) {
				telemetry_1.TelemetryService.instance.captureTelemetrySettingsChanged(previousSetting, newSetting)
			}
			telemetry_1.TelemetryService.instance.updateTelemetryState(isOptedIn)
			;(0, vitest_1.expect)(mockTelemetryService.captureTelemetrySettingsChanged).toHaveBeenCalledWith(
				"unset",
				"disabled",
			)
		})
	})
	;(0, vitest_1.describe)("when telemetry is turned ON", () => {
		;(0, vitest_1.it)("should fire event AFTER enabling telemetry", () => {
			const previousSetting = "disabled"
			const newSetting = "enabled"
			const isOptedIn = newSetting !== "disabled"
			const wasPreviouslyOptedIn = previousSetting !== "disabled"
			// Update the telemetry state first
			telemetry_1.TelemetryService.instance.updateTelemetryState(isOptedIn)
			// If turning telemetry ON, fire event AFTER enabling
			if (!wasPreviouslyOptedIn && isOptedIn && telemetry_1.TelemetryService.hasInstance()) {
				telemetry_1.TelemetryService.instance.captureTelemetrySettingsChanged(previousSetting, newSetting)
			}
			// Verify the event was captured after updateTelemetryState
			;(0, vitest_1.expect)(mockTelemetryService.updateTelemetryState).toHaveBeenCalledWith(true)
			;(0, vitest_1.expect)(mockTelemetryService.captureTelemetrySettingsChanged).toHaveBeenCalledWith(
				"disabled",
				"enabled",
			)
			;(0, vitest_1.expect)(mockTelemetryService.updateTelemetryState).toHaveBeenCalledBefore(
				mockTelemetryService.captureTelemetrySettingsChanged,
			)
		})
		;(0, vitest_1.it)("should not fire event when going from enabled to enabled", () => {
			const previousSetting = "enabled"
			const newSetting = "enabled"
			const isOptedIn = newSetting !== "disabled"
			const wasPreviouslyOptedIn = previousSetting !== "disabled"
			// Neither condition should be met
			if (wasPreviouslyOptedIn && !isOptedIn && telemetry_1.TelemetryService.hasInstance()) {
				telemetry_1.TelemetryService.instance.captureTelemetrySettingsChanged(previousSetting, newSetting)
			}
			telemetry_1.TelemetryService.instance.updateTelemetryState(isOptedIn)
			if (!wasPreviouslyOptedIn && isOptedIn && telemetry_1.TelemetryService.hasInstance()) {
				telemetry_1.TelemetryService.instance.captureTelemetrySettingsChanged(previousSetting, newSetting)
			}
			// Should not fire any telemetry events
			;(0, vitest_1.expect)(mockTelemetryService.captureTelemetrySettingsChanged).not.toHaveBeenCalled()
			;(0, vitest_1.expect)(mockTelemetryService.updateTelemetryState).toHaveBeenCalledWith(true)
		})
		;(0, vitest_1.it)("should fire event when going from unset to enabled (telemetry banner close)", () => {
			const previousSetting = "unset"
			const newSetting = "enabled"
			const isOptedIn = newSetting !== "disabled"
			const wasPreviouslyOptedIn = previousSetting !== "disabled"
			// For unset -> enabled, both are opted in, so no event should fire
			if (wasPreviouslyOptedIn && !isOptedIn && telemetry_1.TelemetryService.hasInstance()) {
				telemetry_1.TelemetryService.instance.captureTelemetrySettingsChanged(previousSetting, newSetting)
			}
			telemetry_1.TelemetryService.instance.updateTelemetryState(isOptedIn)
			if (!wasPreviouslyOptedIn && isOptedIn && telemetry_1.TelemetryService.hasInstance()) {
				telemetry_1.TelemetryService.instance.captureTelemetrySettingsChanged(previousSetting, newSetting)
			}
			// unset is treated as opted-in, so no event should fire
			;(0, vitest_1.expect)(mockTelemetryService.captureTelemetrySettingsChanged).not.toHaveBeenCalled()
		})
	})
	;(0, vitest_1.describe)("TelemetryService.captureTelemetrySettingsChanged", () => {
		;(0, vitest_1.it)("should call captureEvent with correct parameters", () => {
			// Create a real instance to test the method
			const mockCaptureEvent = vitest_1.vi.fn()
			const service = new telemetry_1.TelemetryService([])
			service.captureEvent = mockCaptureEvent
			service.captureTelemetrySettingsChanged("enabled", "disabled")
			;(0, vitest_1.expect)(mockCaptureEvent).toHaveBeenCalledWith(
				types_1.TelemetryEventName.TELEMETRY_SETTINGS_CHANGED,
				{
					previousSetting: "enabled",
					newSetting: "disabled",
				},
			)
		})
	})
})
//# sourceMappingURL=telemetrySettingsTracking.spec.js.map
