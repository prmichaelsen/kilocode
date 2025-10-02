"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.switchModeTool = switchModeTool
const delay_1 = __importDefault(require("delay"))
const responses_1 = require("../prompts/responses")
const modes_1 = require("../../shared/modes")
async function switchModeTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const mode_slug = block.params.mode_slug
	const reason = block.params.reason
	try {
		if (block.partial) {
			const partialMessage = JSON.stringify({
				tool: "switchMode",
				mode: removeClosingTag("mode_slug", mode_slug),
				reason: removeClosingTag("reason", reason),
			})
			await cline.ask("tool", partialMessage, block.partial).catch(() => {})
			return
		} else {
			if (!mode_slug) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("switch_mode")
				pushToolResult(await cline.sayAndCreateMissingParamError("switch_mode", "mode_slug"))
				return
			}
			cline.consecutiveMistakeCount = 0
			// Verify the mode exists
			const targetMode = (0, modes_1.getModeBySlug)(
				mode_slug,
				(await cline.providerRef.deref()?.getState())?.customModes,
			)
			if (!targetMode) {
				cline.recordToolError("switch_mode")
				pushToolResult(responses_1.formatResponse.toolError(`Invalid mode: ${mode_slug}`))
				return
			}
			// Check if already in requested mode
			const currentMode = (await cline.providerRef.deref()?.getState())?.mode ?? modes_1.defaultModeSlug
			if (currentMode === mode_slug) {
				cline.recordToolError("switch_mode")
				pushToolResult(`Already in ${targetMode.name} mode.`)
				return
			}
			const completeMessage = JSON.stringify({ tool: "switchMode", mode: mode_slug, reason })
			const didApprove = await askApproval("tool", completeMessage)
			if (!didApprove) {
				return
			}
			// Switch the mode using shared handler
			await cline.providerRef.deref()?.handleModeSwitch(mode_slug)
			pushToolResult(
				`Successfully switched from ${(0, modes_1.getModeBySlug)(currentMode)?.name ?? currentMode} mode to ${targetMode.name} mode${reason ? ` because: ${reason}` : ""}.`,
			)
			await (0, delay_1.default)(500) // Delay to allow mode change to take effect before next tool is executed
			return
		}
	} catch (error) {
		await handleError("switching mode", error)
		return
	}
}
//# sourceMappingURL=switchModeTool.js.map
