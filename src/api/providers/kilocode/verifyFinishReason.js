"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.throwMaxCompletionTokensReachedError = throwMaxCompletionTokensReachedError
exports.verifyFinishReason = verifyFinishReason
const i18n_1 = require("../../../i18n")
const telemetry_1 = require("@roo-code/telemetry")
const types_1 = require("@roo-code/types")
function throwMaxCompletionTokensReachedError() {
	telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.MAX_COMPLETION_TOKENS_REACHED_ERROR)
	throw Error((0, i18n_1.t)("kilocode:task.maxCompletionTokens"))
}
function verifyFinishReason(choice) {
	if (choice?.finish_reason === "length") {
		throwMaxCompletionTokensReachedError()
	}
}
//# sourceMappingURL=verifyFinishReason.js.map
