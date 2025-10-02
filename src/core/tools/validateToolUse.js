"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.validateToolUse = validateToolUse
const modes_1 = require("../../shared/modes")
function validateToolUse(toolName, mode, customModes, toolRequirements, toolParams) {
	if (!(0, modes_1.isToolAllowedForMode)(toolName, mode, customModes ?? [], toolRequirements, toolParams)) {
		throw new Error(`Tool "${toolName}" is not allowed in ${mode} mode.`)
	}
}
//# sourceMappingURL=validateToolUse.js.map
