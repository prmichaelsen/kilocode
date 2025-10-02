"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.getUserAgent = getUserAgent
function getUserAgent(context) {
	return `Kilo-Code ${context?.extension?.packageJSON?.version || "unknown"}`
}
//# sourceMappingURL=utils.js.map
