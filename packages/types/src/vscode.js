"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.isLanguage =
	exports.languagesSchema =
	exports.languages =
	exports.commandIds =
	exports.terminalActionIds =
	exports.codeActionIds =
		void 0
const zod_1 = require("zod")
const kiloLanguages_js_1 = require("./kiloLanguages.js")
/**
 * CodeAction
 */
exports.codeActionIds = ["explainCode", "fixCode", "improveCode", "addToContext", "newTask"]
/**
 * TerminalAction
 */
exports.terminalActionIds = ["terminalAddToContext", "terminalFixCommand", "terminalExplainCommand"]
/**
 * Command
 */
exports.commandIds = [
	"activationCompleted",
	"plusButtonClicked",
	"promptsButtonClicked",
	"mcpButtonClicked",
	"historyButtonClicked",
	"marketplaceButtonClicked",
	"popoutButtonClicked",
	"cloudButtonClicked",
	"settingsButtonClicked",
	"openInNewTab",
	"showHumanRelayDialog",
	"registerHumanRelayCallback",
	"unregisterHumanRelayCallback",
	"handleHumanRelayResponse",
	"newTask",
	"setCustomStoragePath",
	"importSettings",
	// "focusInput", // kilocode_change
	"acceptInput",
	"profileButtonClicked", // kilocode_change
	"helpButtonClicked", // kilocode_change
	"focusChatInput", // kilocode_change
	"importSettings", // kilocode_change
	"exportSettings", // kilocode_change
	"generateTerminalCommand", // kilocode_change
	"handleExternalUri", // kilocode_change - for JetBrains plugin URL forwarding
	"focusPanel",
	"toggleAutoApprove",
]
/**
 * Language
 */
exports.languages = [
	...kiloLanguages_js_1.kiloLanguages,
	"ca",
	"de",
	"en",
	"es",
	"fr",
	"hi",
	"id",
	"it",
	"ja",
	"ko",
	"nl",
	"pl",
	"pt-BR",
	"ru",
	"tr",
	"vi",
	"zh-CN",
	"zh-TW",
]
exports.languagesSchema = zod_1.z.enum(exports.languages)
const isLanguage = (value) => exports.languages.includes(value)
exports.isLanguage = isLanguage
//# sourceMappingURL=vscode.js.map
