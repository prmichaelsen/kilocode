"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.handleHumanRelayResponse = exports.unregisterHumanRelayCallback = exports.registerHumanRelayCallback = void 0
// Callback mapping of human relay response.
const humanRelayCallbacks = new Map()
/**
 * Register a callback function for human relay response.
 * @param requestId
 * @param callback
 */
const registerHumanRelayCallback = (requestId, callback) => humanRelayCallbacks.set(requestId, callback)
exports.registerHumanRelayCallback = registerHumanRelayCallback
const unregisterHumanRelayCallback = (requestId) => humanRelayCallbacks.delete(requestId)
exports.unregisterHumanRelayCallback = unregisterHumanRelayCallback
const handleHumanRelayResponse = (response) => {
	const callback = humanRelayCallbacks.get(response.requestId)
	if (callback) {
		if (response.cancelled) {
			callback(undefined)
		} else {
			callback(response.text)
		}
		humanRelayCallbacks.delete(response.requestId)
	}
}
exports.handleHumanRelayResponse = handleHumanRelayResponse
//# sourceMappingURL=humanRelay.js.map
