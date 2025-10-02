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
exports.generateTerminalCommand = generateTerminalCommand
// kilocode_change - new file
const vscode = __importStar(require("vscode"))
const ContextProxy_1 = require("../core/config/ContextProxy")
const ProviderSettingsManager_1 = require("../core/config/ProviderSettingsManager")
const support_prompt_1 = require("../shared/support-prompt")
const single_completion_handler_1 = require("./single-completion-handler")
const i18n_1 = require("../i18n")
const mentions_1 = require("../core/mentions")
async function generateTerminalCommand(options) {
	const { outputChannel, context } = options
	try {
		const shouldProceed = await showWarningIfNeeded(context)
		if (!shouldProceed) {
			return
		}
		const userInput = await getUserInput()
		if (!userInput) {
			return
		}
		const activeTerminal = vscode.window.activeTerminal
		if (!activeTerminal) {
			vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:terminalCommandGenerator.noActiveTerminal"))
			return
		}
		await executeCommandGeneration(activeTerminal, userInput, context)
	} catch (error) {
		handleError(error, outputChannel, "generateTerminalCommand")
	}
}
async function showWarningIfNeeded(context) {
	const warningAcknowledged = context.globalState.get("terminalCommandWarningAcknowledged") ?? false
	if (!warningAcknowledged) {
		const warningChoice = await vscode.window.showInformationMessage(
			(0, i18n_1.t)("kilocode:terminalCommandGenerator.warningDialog.title"),
			{ modal: true, detail: (0, i18n_1.t)("kilocode:terminalCommandGenerator.warningDialog.message") },
			(0, i18n_1.t)("kilocode:terminalCommandGenerator.warningDialog.okButton"),
			(0, i18n_1.t)("kilocode:terminalCommandGenerator.warningDialog.cancelButton"),
		)
		if (warningChoice !== (0, i18n_1.t)("kilocode:terminalCommandGenerator.warningDialog.okButton")) {
			return false
		}
		await context.globalState.update("terminalCommandWarningAcknowledged", true)
	}
	return true
}
async function getUserInput() {
	return await vscode.window.showInputBox({
		prompt: (0, i18n_1.t)("kilocode:terminalCommandGenerator.inputPrompt"),
		placeHolder: (0, i18n_1.t)("kilocode:terminalCommandGenerator.inputPlaceholder"),
		ignoreFocusOut: true,
	})
}
async function executeCommandGeneration(activeTerminal, userInput, context) {
	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: (0, i18n_1.t)("kilocode:terminalCommandGenerator.generatingProgress"),
			cancellable: false,
		},
		async () => {
			const terminalContext = await buildTerminalContext(activeTerminal)
			const apiConfiguration = await getApiConfiguration(context)
			const customSupportPrompts = ContextProxy_1.ContextProxy.instance?.getValue("customSupportPrompts") || {}
			const prompt = support_prompt_1.supportPrompt.create(
				"TERMINAL_GENERATE",
				{
					userInput,
					...terminalContext,
				},
				customSupportPrompts,
			)
			const generatedCommand = await (0, single_completion_handler_1.singleCompletionHandler)(
				apiConfiguration,
				prompt,
			)
			const cleanCommand = generatedCommand
				.trim()
				.replace(/^```[\w]*\n?|```$/g, "")
				.trim()
			activeTerminal.sendText(cleanCommand, false)
			activeTerminal.show()
			vscode.window.showInformationMessage(
				(0, i18n_1.t)("kilocode:terminalCommandGenerator.commandGenerated", { command: cleanCommand }),
			)
		},
	)
}
async function buildTerminalContext(activeTerminal) {
	const terminalHistory = await getTerminalHistory()
	return {
		operatingSystem: process.platform,
		currentDirectory:
			activeTerminal.shellIntegration?.cwd?.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "~",
		shell: process.env.SHELL || (process.platform === "win32" ? "cmd" : "bash"),
		terminalHistory,
	}
}
async function getTerminalHistory() {
	try {
		const fullOutput = await (0, mentions_1.getLatestTerminalOutput)()
		if (!fullOutput) {
			return ""
		}
		const lines = fullOutput.split("\n")
		const lastLines = lines.slice(-200)
		return lastLines.join("\n").trim()
	} catch (error) {
		console.warn("Failed to retrieve terminal history:", error)
		return ""
	}
}
function handleError(error, outputChannel, context) {
	const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
	outputChannel.appendLine(`Error in ${context}: ${errorMessage}`)
	if (context === "generateTerminalCommand") {
		vscode.window.showErrorMessage(
			(0, i18n_1.t)("kilocode:terminalCommandGenerator.generationFailed", { error: errorMessage }),
		)
	} else {
		vscode.window.showErrorMessage(`Error: ${errorMessage}`)
	}
}
async function getApiConfiguration(context) {
	const contextProxy = ContextProxy_1.ContextProxy.instance
	if (!contextProxy) {
		throw new Error("ContextProxy not initialized")
	}
	const apiConfiguration = contextProxy.getProviderSettings()
	const terminalCommandApiConfigId = contextProxy.getValue("terminalCommandApiConfigId")
	const listApiConfigMeta = contextProxy.getValue("listApiConfigMeta") || []
	let configToUse = apiConfiguration
	if (terminalCommandApiConfigId && listApiConfigMeta.find(({ id }) => id === terminalCommandApiConfigId)) {
		try {
			const providerSettingsManager = new ProviderSettingsManager_1.ProviderSettingsManager(context)
			await providerSettingsManager.initialize()
			const { name: _, ...providerSettings } = await providerSettingsManager.getProfile({
				id: terminalCommandApiConfigId,
			})
			if (providerSettings.apiProvider) {
				configToUse = providerSettings
			}
		} catch (error) {
			console.warn(`Failed to load terminal command API config ${terminalCommandApiConfigId}:`, error)
		}
	}
	if (!configToUse || !configToUse.apiProvider) {
		throw new Error("No valid API configuration available")
	}
	return configToUse
}
//# sourceMappingURL=terminalCommandGenerator.js.map
