"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.refreshWorkflowToggles = refreshWorkflowToggles
const path_1 = __importDefault(require("path"))
const os_1 = __importDefault(require("os"))
const ContextProxy_1 = require("../../config/ContextProxy")
const globalFileNames_1 = require("../../../shared/globalFileNames")
const rule_helpers_1 = require("./rule-helpers")
async function refreshLocalWorkflowToggles(proxy, context, workingDirectory) {
	const workflowRulesToggles = (await proxy.getWorkspaceState(context, "localWorkflowToggles")) || {}
	const workflowsDirPath = path_1.default.resolve(workingDirectory, globalFileNames_1.GlobalFileNames.workflows)
	const updatedWorkflowToggles = await (0, rule_helpers_1.synchronizeRuleToggles)(
		workflowsDirPath,
		workflowRulesToggles,
	)
	await proxy.updateWorkspaceState(context, "localWorkflowToggles", updatedWorkflowToggles)
	return updatedWorkflowToggles
}
async function refreshGlobalWorkflowToggles(proxy) {
	const globalWorkflowToggles = (await proxy.getGlobalState("globalWorkflowToggles")) || {}
	const globalWorkflowsDir = path_1.default.join(os_1.default.homedir(), globalFileNames_1.GlobalFileNames.workflows)
	const updatedGlobalWorkflowToggles = await (0, rule_helpers_1.synchronizeRuleToggles)(
		globalWorkflowsDir,
		globalWorkflowToggles,
	)
	await proxy.updateGlobalState("globalWorkflowToggles", updatedGlobalWorkflowToggles)
	return updatedGlobalWorkflowToggles
}
async function refreshWorkflowToggles(context, workingDirectory) {
	const proxy = new ContextProxy_1.ContextProxy(context)
	return {
		globalWorkflowToggles: await refreshGlobalWorkflowToggles(proxy),
		localWorkflowToggles: await refreshLocalWorkflowToggles(proxy, context, workingDirectory),
	}
}
//# sourceMappingURL=workflows.js.map
