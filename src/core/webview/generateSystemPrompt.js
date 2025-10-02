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
Object.defineProperty(exports, "__esModule", { value: true })
exports.generateSystemPrompt = void 0
const vscode = __importStar(require("vscode"))
const modes_1 = require("../../shared/modes")
const api_1 = require("../../api")
const experiments_1 = require("../../shared/experiments")
const system_1 = require("../prompts/system")
const multi_search_replace_1 = require("../diff/strategies/multi-search-replace")
const multi_file_search_replace_1 = require("../diff/strategies/multi-file-search-replace")
const generateSystemPrompt = async (provider, message) => {
	const state = await provider.getState() // kilocode_change
	const {
		apiConfiguration,
		customModePrompts,
		customInstructions,
		browserViewportSize,
		diffEnabled,
		mcpEnabled,
		fuzzyMatchThreshold,
		experiments,
		enableMcpServerCreation,
		browserToolEnabled,
		language,
		maxReadFileLine,
		maxConcurrentFileReads,
	} = state // kilocode_change
	// Check experiment to determine which diff strategy to use
	const isMultiFileApplyDiffEnabled = experiments_1.experiments.isEnabled(
		experiments ?? {},
		experiments_1.EXPERIMENT_IDS.MULTI_FILE_APPLY_DIFF,
	)
	const diffStrategy = isMultiFileApplyDiffEnabled
		? new multi_file_search_replace_1.MultiFileSearchReplaceDiffStrategy(fuzzyMatchThreshold)
		: new multi_search_replace_1.MultiSearchReplaceDiffStrategy(fuzzyMatchThreshold)
	const cwd = provider.cwd
	const mode = message.mode ?? modes_1.defaultModeSlug
	const customModes = await provider.customModesManager.getCustomModes()
	const rooIgnoreInstructions = provider.getCurrentTask()?.rooIgnoreController?.getInstructions()
	// Determine if browser tools can be used based on model support, mode, and user settings
	let modelSupportsComputerUse = false
	// Create a temporary API handler to check if the model supports computer use
	// This avoids relying on an active Cline instance which might not exist during preview
	try {
		const tempApiHandler = (0, api_1.buildApiHandler)(apiConfiguration)
		// kilocode_change: supports images => supports browser
		modelSupportsComputerUse = tempApiHandler.getModel().info.supportsImages ?? false
	} catch (error) {
		console.error("Error checking if model supports computer use:", error)
	}
	// Check if the current mode includes the browser tool group
	const modeConfig = (0, modes_1.getModeBySlug)(mode, customModes)
	const modeSupportsBrowser =
		modeConfig?.groups.some((group) => (0, modes_1.getGroupName)(group) === "browser") ?? false
	// Only enable browser tools if the model supports it, the mode includes browser tools,
	// and browser tools are enabled in settings
	const canUseBrowserTool = modelSupportsComputerUse && modeSupportsBrowser && (browserToolEnabled ?? true)
	const systemPrompt = await (0, system_1.SYSTEM_PROMPT)(
		provider.context,
		cwd,
		canUseBrowserTool,
		mcpEnabled ? provider.getMcpHub() : undefined,
		diffStrategy,
		browserViewportSize ?? "900x600",
		mode,
		customModePrompts,
		customModes,
		customInstructions,
		diffEnabled,
		experiments,
		enableMcpServerCreation,
		language,
		rooIgnoreInstructions,
		maxReadFileLine !== -1,
		{
			maxConcurrentFileReads: maxConcurrentFileReads ?? 5,
			todoListEnabled: apiConfiguration?.todoListEnabled ?? true,
			useAgentRules: vscode.workspace.getConfiguration("kilo-code").get("useAgentRules") ?? true,
			newTaskRequireTodos: vscode.workspace.getConfiguration("kilo-code").get("newTaskRequireTodos", false),
		},
		// kilocode_change start
		undefined,
		undefined,
		state,
	)
	return systemPrompt
}
exports.generateSystemPrompt = generateSystemPrompt
//# sourceMappingURL=generateSystemPrompt.js.map
