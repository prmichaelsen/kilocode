"use strict"
// kilocode_change - new file
Object.defineProperty(exports, "__esModule", { value: true })
exports.escapeHtml = escapeHtml
function escapeHtml(text) {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;")
}
//# sourceMappingURL=escapeHtml.js.map
