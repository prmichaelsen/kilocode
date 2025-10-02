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
exports.openClineInNewTab = exports.registerCommands = void 0
exports.getVisibleProviderOrLog = getVisibleProviderOrLog
exports.getPanel = getPanel
exports.setPanel = setPanel
const vscode = __importStar(require("vscode"))
const delay_1 = __importDefault(require("delay"))
const telemetry_1 = require("@roo-code/telemetry")
const commands_1 = require("../utils/commands")
const ClineProvider_1 = require("../core/webview/ClineProvider")
const importExport_1 = require("../core/config/importExport") // kilocode_change
const ContextProxy_1 = require("../core/config/ContextProxy")
const focusPanel_1 = require("../utils/focusPanel")
const humanRelay_1 = require("./humanRelay")
const handleTask_1 = require("./handleTask")
const manager_1 = require("../services/code-index/manager")
const importExport_2 = require("../core/config/importExport")
const MdmService_1 = require("../services/mdm/MdmService")
const terminalCommandGenerator_1 = require("../utils/terminalCommandGenerator") // kilocode_change
/**
 * Helper to get the visible ClineProvider instance or log if not found.
 */
function getVisibleProviderOrLog(outputChannel) {
	const visibleProvider = ClineProvider_1.ClineProvider.getVisibleInstance()
	if (!visibleProvider) {
		outputChannel.appendLine("Cannot find any visible Kilo Code instances.")
		return undefined
	}
	return visibleProvider
}
// Store panel references in both modes
let sidebarPanel = undefined
let tabPanel = undefined
/**
 * Get the currently active panel
 * @returns WebviewPanel或WebviewView
 */
function getPanel() {
	return tabPanel || sidebarPanel
}
/**
 * Set panel references
 */
function setPanel(newPanel, type) {
	if (type === "sidebar") {
		sidebarPanel = newPanel
		tabPanel = undefined
	} else {
		tabPanel = newPanel
		sidebarPanel = undefined
	}
}
const registerCommands = (options) => {
	const { context } = options
	for (const [id, callback] of Object.entries(getCommandsMap(options))) {
		const command = (0, commands_1.getCommand)(id)
		context.subscriptions.push(vscode.commands.registerCommand(command, callback))
	}
}
exports.registerCommands = registerCommands
const getCommandsMap = ({ context, outputChannel }) => ({
	activationCompleted: () => {},
	cloudButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		telemetry_1.TelemetryService.instance.captureTitleButtonClicked("cloud")
		visibleProvider.postMessageToWebview({ type: "action", action: "cloudButtonClicked" })
	},
	plusButtonClicked: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		telemetry_1.TelemetryService.instance.captureTitleButtonClicked("plus")
		await visibleProvider.removeClineFromStack()
		await visibleProvider.refreshWorkspace()
		await visibleProvider.postMessageToWebview({ type: "action", action: "chatButtonClicked" })
		// Send focusInput action immediately after chatButtonClicked
		// This ensures the focus happens after the view has switched
		await visibleProvider.postMessageToWebview({ type: "action", action: "focusInput" })
	},
	mcpButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		telemetry_1.TelemetryService.instance.captureTitleButtonClicked("mcp")
		visibleProvider.postMessageToWebview({ type: "action", action: "mcpButtonClicked" })
	},
	promptsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		telemetry_1.TelemetryService.instance.captureTitleButtonClicked("prompts")
		visibleProvider.postMessageToWebview({ type: "action", action: "promptsButtonClicked" })
	},
	popoutButtonClicked: () => {
		telemetry_1.TelemetryService.instance.captureTitleButtonClicked("popout")
		return (0, exports.openClineInNewTab)({ context, outputChannel })
	},
	openInNewTab: () => (0, exports.openClineInNewTab)({ context, outputChannel }),
	settingsButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		telemetry_1.TelemetryService.instance.captureTitleButtonClicked("settings")
		visibleProvider.postMessageToWebview({ type: "action", action: "settingsButtonClicked" })
		// Also explicitly post the visibility message to trigger scroll reliably
		visibleProvider.postMessageToWebview({ type: "action", action: "didBecomeVisible" })
	},
	historyButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		telemetry_1.TelemetryService.instance.captureTitleButtonClicked("history")
		visibleProvider.postMessageToWebview({ type: "action", action: "historyButtonClicked" })
	},
	// kilocode_change begin
	profileButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		visibleProvider.postMessageToWebview({ type: "action", action: "profileButtonClicked" })
	},
	helpButtonClicked: () => {
		vscode.env.openExternal(vscode.Uri.parse("https://kilocode.ai"))
	},
	// kilocode_change end
	marketplaceButtonClicked: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return
		visibleProvider.postMessageToWebview({ type: "action", action: "marketplaceButtonClicked" })
	},
	showHumanRelayDialog: (params) => {
		const panel = getPanel()
		if (panel) {
			panel?.webview.postMessage({
				type: "showHumanRelayDialog",
				requestId: params.requestId,
				promptText: params.promptText,
			})
		}
	},
	registerHumanRelayCallback: humanRelay_1.registerHumanRelayCallback,
	unregisterHumanRelayCallback: humanRelay_1.unregisterHumanRelayCallback,
	handleHumanRelayResponse: humanRelay_1.handleHumanRelayResponse,
	newTask: handleTask_1.handleNewTask,
	setCustomStoragePath: async () => {
		const { promptForCustomStoragePath } = await Promise.resolve().then(() =>
			__importStar(require("../utils/storage")),
		)
		await promptForCustomStoragePath()
	},
	importSettings: async (filePath) => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		await (0, importExport_2.importSettingsWithFeedback)(
			{
				providerSettingsManager: visibleProvider.providerSettingsManager,
				contextProxy: visibleProvider.contextProxy,
				customModesManager: visibleProvider.customModesManager,
				provider: visibleProvider,
			},
			filePath,
		)
	},
	focusPanel: async () => {
		try {
			await (0, focusPanel_1.focusPanel)(tabPanel, sidebarPanel)
		} catch (error) {
			outputChannel.appendLine(`Error focusing panel: ${error}`)
		}
	},
	acceptInput: () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		visibleProvider.postMessageToWebview({ type: "acceptInput" })
	}, // kilocode_change begin
	focusChatInput: async () => {
		try {
			await vscode.commands.executeCommand("kilo-code.SidebarProvider.focus")
			await (0, delay_1.default)(100)
			let visibleProvider = getVisibleProviderOrLog(outputChannel)
			if (!visibleProvider) {
				// If still no visible provider, try opening in a new tab
				const tabProvider = await (0, exports.openClineInNewTab)({ context, outputChannel })
				await (0, delay_1.default)(100)
				visibleProvider = tabProvider
			}
			visibleProvider?.postMessageToWebview({
				type: "action",
				action: "focusChatInput",
			})
		} catch (error) {
			outputChannel.appendLine(`Error in focusChatInput: ${error}`)
		}
	},
	generateTerminalCommand: async () =>
		await (0, terminalCommandGenerator_1.generateTerminalCommand)({ outputChannel, context }), // kilocode_change
	exportSettings: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) return
		await (0, importExport_1.exportSettings)({
			providerSettingsManager: visibleProvider.providerSettingsManager,
			contextProxy: visibleProvider.contextProxy,
		})
	},
	// Handle external URI - used by JetBrains plugin to forward auth tokens
	handleExternalUri: async (uriString) => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		try {
			// Parse the URI string and create a VSCode URI object
			const uri = vscode.Uri.parse(uriString)
			// Import and use the existing handleUri function
			const { handleUri } = await Promise.resolve().then(() => __importStar(require("./handleUri")))
			await handleUri(uri)
			outputChannel.appendLine(`Successfully handled external URI: ${uriString}`)
		} catch (error) {
			outputChannel.appendLine(`Error handling external URI: ${uriString}, error: ${error}`)
		}
	},
	// kilocode_change end
	toggleAutoApprove: async () => {
		const visibleProvider = getVisibleProviderOrLog(outputChannel)
		if (!visibleProvider) {
			return
		}
		visibleProvider.postMessageToWebview({
			type: "action",
			action: "toggleAutoApprove",
		})
	},
})
const openClineInNewTab = async ({ context, outputChannel }) => {
	// (This example uses webviewProvider activation event which is necessary to
	// deserialize cached webview, but since we use retainContextWhenHidden, we
	// don't need to use that event).
	// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
	const contextProxy = await ContextProxy_1.ContextProxy.getInstance(context)
	const codeIndexManager = manager_1.CodeIndexManager.getInstance(context)
	// Get the existing MDM service instance to ensure consistent policy enforcement
	let mdmService
	try {
		mdmService = MdmService_1.MdmService.getInstance()
	} catch (error) {
		// MDM service not initialized, which is fine - extension can work without it
		mdmService = undefined
	}
	const tabProvider = new ClineProvider_1.ClineProvider(context, outputChannel, "editor", contextProxy, mdmService)
	const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))
	// Check if there are any visible text editors, otherwise open a new group
	// to the right.
	const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0
	if (!hasVisibleEditors) {
		await vscode.commands.executeCommand("workbench.action.newGroupRight")
	}
	const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two
	const newPanel = vscode.window.createWebviewPanel(
		ClineProvider_1.ClineProvider.tabPanelId,
		"Kilo Code",
		targetCol,
		{
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [context.extensionUri],
		},
	)
	// Save as tab type panel.
	setPanel(newPanel, "tab")
	newPanel.iconPath = {
		light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "kilo.png"),
		dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "kilo-dark.png"),
	}
	await tabProvider.resolveWebviewView(newPanel)
	// Add listener for visibility changes to notify webview
	newPanel.onDidChangeViewState(
		(e) => {
			const panel = e.webviewPanel
			if (panel.visible) {
				panel.webview.postMessage({ type: "action", action: "didBecomeVisible" }) // Use the same message type as in SettingsView.tsx
			}
		},
		null, // First null is for `thisArgs`
		context.subscriptions,
	)
	// Handle panel closing events.
	newPanel.onDidDispose(
		() => {
			setPanel(undefined, "tab")
		},
		null,
		context.subscriptions,
	)
	// Lock the editor group so clicking on files doesn't open them over the panel.
	await (0, delay_1.default)(100)
	await vscode.commands.executeCommand("workbench.action.lockEditorGroup")
	return tabProvider
}
exports.openClineInNewTab = openClineInNewTab
//# sourceMappingURL=registerCommands.js.map
