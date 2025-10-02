"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.fetchInstructions = fetchInstructions
const create_mcp_server_1 = require("./create-mcp-server")
const create_mode_1 = require("./create-mode")
async function fetchInstructions(text, detail) {
	switch (text) {
		case "create_mcp_server": {
			return await (0, create_mcp_server_1.createMCPServerInstructions)(detail.mcpHub, detail.diffStrategy)
		}
		case "create_mode": {
			return await (0, create_mode_1.createModeInstructions)(detail.context)
		}
		default: {
			return ""
		}
	}
}
//# sourceMappingURL=instructions.js.map
