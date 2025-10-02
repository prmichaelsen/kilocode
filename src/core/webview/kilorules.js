"use strict"
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				var desc = Object.getOwnPropertyDescriptor(m, k)
				if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k]
						},
					}
				}
				Object.defineProperty(o, k2, desc)
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				o[k2] = m[k]
			})
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, "default", { enumerable: true, value: v })
			}
		: function (o, v) {
				o["default"] = v
			})
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = []
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
					return ar
				}
			return ownKeys(o)
		}
		return function (mod) {
			if (mod && mod.__esModule) return mod
			var result = {}
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== "default") __createBinding(result, mod, k[i])
			__setModuleDefault(result, mod)
			return result
		}
	})()
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.getEnabledRules = getEnabledRules
exports.toggleWorkflow = toggleWorkflow
exports.toggleRule = toggleRule
exports.createRuleFile = createRuleFile
exports.deleteRuleFile = deleteRuleFile
const os_1 = __importDefault(require("os"))
const path = __importStar(require("path"))
const promises_1 = __importDefault(require("fs/promises"))
const vscode = __importStar(require("vscode"))
const fs_1 = require("../../utils/fs")
const open_file_1 = require("../../integrations/misc/open-file")
const path_1 = require("../../utils/path")
const i18n_1 = require("../../i18n")
const globalFileNames_1 = require("../../shared/globalFileNames")
const rules_1 = require("../../shared/kilocode/rules")
async function getEnabledRules(workspacePath, contextProxy, context) {
	const homedir = os_1.default.homedir()
	return {
		globalRules: await getEnabledRulesFromDirectory(
			path.join(homedir, globalFileNames_1.GlobalFileNames.kiloRules),
			(await contextProxy.getGlobalState("globalRulesToggles")) || {},
		),
		localRules: await getEnabledRulesFromDirectory(
			path.join(workspacePath, globalFileNames_1.GlobalFileNames.kiloRules),
			(await contextProxy.getWorkspaceState(context, "localRulesToggles")) || {},
		),
		globalWorkflows: await getEnabledRulesFromDirectory(
			path.join(os_1.default.homedir(), globalFileNames_1.GlobalFileNames.workflows),
			(await contextProxy.getGlobalState("globalWorkflowToggles")) || {},
		),
		localWorkflows: await getEnabledRulesFromDirectory(
			path.join(workspacePath, globalFileNames_1.GlobalFileNames.workflows),
			(await contextProxy.getWorkspaceState(context, "localWorkflowToggles")) || {},
		),
	}
}
async function getEnabledRulesFromDirectory(dirPath, toggleState = {}) {
	const exists = await (0, fs_1.fileExistsAtPath)(dirPath)
	if (!exists) {
		return {}
	}
	const files = await promises_1.default.readdir(dirPath, { withFileTypes: true })
	const rules = {}
	for (const file of files) {
		if (file.isFile() && rules_1.allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))) {
			const filePath = path.join(dirPath, file.name)
			rules[filePath] = toggleState[filePath] ?? true
		}
	}
	return rules
}
async function toggleWorkflow(workflowPath, enabled, isGlobal, contextProxy, context) {
	if (isGlobal) {
		const toggles = (await contextProxy.getGlobalState("globalWorkflowToggles")) || {}
		toggles[workflowPath] = enabled
		await contextProxy.updateGlobalState("globalWorkflowToggles", toggles)
	} else {
		const toggles = (await contextProxy.getWorkspaceState(context, "localWorkflowToggles")) || {}
		toggles[workflowPath] = enabled
		await contextProxy.updateWorkspaceState(context, "localWorkflowToggles", toggles)
	}
}
async function toggleRule(rulePath, enabled, isGlobal, contextProxy, context) {
	if (isGlobal) {
		const toggles = (await contextProxy.getGlobalState("globalRulesToggles")) || {}
		toggles[rulePath] = enabled
		await contextProxy.updateGlobalState("globalRulesToggles", toggles)
	} else {
		const toggles = (await contextProxy.getWorkspaceState(context, "localRulesToggles")) || {}
		toggles[rulePath] = enabled
		await contextProxy.updateWorkspaceState(context, "localRulesToggles", toggles)
	}
}
function getRuleDirectoryPath(baseDir, ruleType) {
	return ruleType === "workflow"
		? path.join(baseDir, globalFileNames_1.GlobalFileNames.workflows)
		: path.join(baseDir, globalFileNames_1.GlobalFileNames.kiloRules)
}
async function createRuleFile(filename, isGlobal, ruleType) {
	const workspacePath = (0, path_1.getWorkspacePath)()
	if (!workspacePath && !isGlobal) {
		vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:rules.errors.noWorkspaceFound"))
		return
	}
	const rulesDir = isGlobal
		? getRuleDirectoryPath(os_1.default.homedir(), ruleType)
		: getRuleDirectoryPath(workspacePath, ruleType)
	await promises_1.default.mkdir(rulesDir, { recursive: true })
	const filePath = path.join(rulesDir, filename)
	if (await (0, fs_1.fileExistsAtPath)(filePath)) {
		vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:rules.errors.fileAlreadyExists", { filename }))
		return
	}
	const baseFileName = path.basename(filename)
	const content = ruleType === "workflow" ? workflowTemplate(baseFileName) : ruleTemplate(baseFileName)
	await promises_1.default.writeFile(filePath, content, "utf8")
	await (0, open_file_1.openFile)(filePath)
}
function workflowTemplate(baseFileName) {
	return `# ${baseFileName}

${(0, i18n_1.t)("kilocode:rules.templates.workflow.description")}

${(0, i18n_1.t)("kilocode:rules.templates.workflow.stepsHeader")}

1. ${(0, i18n_1.t)("kilocode:rules.templates.workflow.step1")}
2. ${(0, i18n_1.t)("kilocode:rules.templates.workflow.step2")}
`
}
function ruleTemplate(baseFileName) {
	return `# ${baseFileName}

${(0, i18n_1.t)("kilocode:rules.templates.rule.description")}

${(0, i18n_1.t)("kilocode:rules.templates.rule.guidelinesHeader")}

- ${(0, i18n_1.t)("kilocode:rules.templates.rule.guideline1")}
- ${(0, i18n_1.t)("kilocode:rules.templates.rule.guideline2")}
`
}
async function deleteRuleFile(rulePath) {
	const deleteAction = (0, i18n_1.t)("kilocode:rules.actions.delete")
	const filename = path.basename(rulePath)
	const result = await vscode.window.showWarningMessage(
		(0, i18n_1.t)("kilocode:rules.actions.confirmDelete", { filename }),
		{ modal: true },
		deleteAction,
	)
	if (result === deleteAction) {
		await promises_1.default.unlink(rulePath)
		vscode.window.showInformationMessage((0, i18n_1.t)("kilocode:rules.actions.deleted", { filename }))
	}
}
//# sourceMappingURL=kilorules.js.map
