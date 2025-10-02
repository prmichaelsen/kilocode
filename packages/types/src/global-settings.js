"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.EVALS_TIMEOUT =
	exports.EVALS_SETTINGS =
	exports.isGlobalStateKey =
	exports.GLOBAL_STATE_KEYS =
	exports.isSecretStateKey =
	exports.GLOBAL_SECRET_KEYS =
	exports.SECRET_STATE_KEYS =
	exports.rooCodeSettingsSchema =
	exports.GLOBAL_SETTINGS_KEYS =
	exports.globalSettingsSchema =
	exports.DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT =
	exports.DEFAULT_WRITE_DELAY_MS =
		void 0
const zod_1 = require("zod")
const provider_settings_js_1 = require("./provider-settings.js")
const history_js_1 = require("./history.js")
const codebase_index_js_1 = require("./codebase-index.js")
const experiment_js_1 = require("./experiment.js")
const telemetry_js_1 = require("./telemetry.js")
const mode_js_1 = require("./mode.js")
const mode_js_2 = require("./mode.js")
const vscode_js_1 = require("./vscode.js")
const kilocode_js_1 = require("./kilocode.js") // kilocode_change
/**
 * Default delay in milliseconds after writes to allow diagnostics to detect potential problems.
 * This delay is particularly important for Go and other languages where tools like goimports
 * need time to automatically clean up unused imports.
 */
exports.DEFAULT_WRITE_DELAY_MS = 1000
/**
 * Default terminal output character limit constant.
 * This provides a reasonable default that aligns with typical terminal usage
 * while preventing context window explosions from extremely long lines.
 */
exports.DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT = 50000
/**
 * GlobalSettings
 */
exports.globalSettingsSchema = zod_1.z.object({
	currentApiConfigName: zod_1.z.string().optional(),
	listApiConfigMeta: zod_1.z.array(provider_settings_js_1.providerSettingsEntrySchema).optional(),
	pinnedApiConfigs: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).optional(),
	lastShownAnnouncementId: zod_1.z.string().optional(),
	customInstructions: zod_1.z.string().optional(),
	taskHistory: zod_1.z.array(history_js_1.historyItemSchema).optional(),
	dismissedUpsells: zod_1.z.array(zod_1.z.string()).optional(),
	// Image generation settings (experimental) - flattened for simplicity
	openRouterImageApiKey: zod_1.z.string().optional(),
	openRouterImageGenerationSelectedModel: zod_1.z.string().optional(),
	kiloCodeImageApiKey: zod_1.z.string().optional(),
	condensingApiConfigId: zod_1.z.string().optional(),
	customCondensingPrompt: zod_1.z.string().optional(),
	autoApprovalEnabled: zod_1.z.boolean().optional(),
	alwaysAllowReadOnly: zod_1.z.boolean().optional(),
	alwaysAllowReadOnlyOutsideWorkspace: zod_1.z.boolean().optional(),
	alwaysAllowWrite: zod_1.z.boolean().optional(),
	alwaysAllowWriteOutsideWorkspace: zod_1.z.boolean().optional(),
	alwaysAllowWriteProtected: zod_1.z.boolean().optional(),
	writeDelayMs: zod_1.z.number().min(0).optional(),
	alwaysAllowBrowser: zod_1.z.boolean().optional(),
	alwaysApproveResubmit: zod_1.z.boolean().optional(),
	requestDelaySeconds: zod_1.z.number().optional(),
	alwaysAllowMcp: zod_1.z.boolean().optional(),
	alwaysAllowModeSwitch: zod_1.z.boolean().optional(),
	alwaysAllowSubtasks: zod_1.z.boolean().optional(),
	alwaysAllowExecute: zod_1.z.boolean().optional(),
	alwaysAllowFollowupQuestions: zod_1.z.boolean().optional(),
	followupAutoApproveTimeoutMs: zod_1.z.number().optional(),
	alwaysAllowUpdateTodoList: zod_1.z.boolean().optional(),
	allowedCommands: zod_1.z.array(zod_1.z.string()).optional(),
	deniedCommands: zod_1.z.array(zod_1.z.string()).optional(),
	commandExecutionTimeout: zod_1.z.number().optional(),
	commandTimeoutAllowlist: zod_1.z.array(zod_1.z.string()).optional(),
	preventCompletionWithOpenTodos: zod_1.z.boolean().optional(),
	allowedMaxRequests: zod_1.z.number().nullish(),
	allowedMaxCost: zod_1.z.number().nullish(),
	autoCondenseContext: zod_1.z.boolean().optional(),
	autoCondenseContextPercent: zod_1.z.number().optional(),
	maxConcurrentFileReads: zod_1.z.number().optional(),
	allowVeryLargeReads: zod_1.z.boolean().optional(), // kilocode_change
	/**
	 * Whether to include diagnostic messages (errors, warnings) in tool outputs
	 * @default true
	 */
	includeDiagnosticMessages: zod_1.z.boolean().optional(),
	/**
	 * Maximum number of diagnostic messages to include in tool outputs
	 * @default 50
	 */
	maxDiagnosticMessages: zod_1.z.number().optional(),
	browserToolEnabled: zod_1.z.boolean().optional(),
	browserViewportSize: zod_1.z.string().optional(),
	showAutoApproveMenu: zod_1.z.boolean().optional(), // kilocode_change
	showTaskTimeline: zod_1.z.boolean().optional(), // kilocode_change
	localWorkflowToggles: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).optional(), // kilocode_change
	globalWorkflowToggles: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).optional(), // kilocode_change
	localRulesToggles: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).optional(), // kilocode_change
	globalRulesToggles: zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).optional(), // kilocode_change
	screenshotQuality: zod_1.z.number().optional(),
	remoteBrowserEnabled: zod_1.z.boolean().optional(),
	remoteBrowserHost: zod_1.z.string().optional(),
	cachedChromeHostUrl: zod_1.z.string().optional(),
	enableCheckpoints: zod_1.z.boolean().optional(),
	ttsEnabled: zod_1.z.boolean().optional(),
	ttsSpeed: zod_1.z.number().optional(),
	soundEnabled: zod_1.z.boolean().optional(),
	soundVolume: zod_1.z.number().optional(),
	systemNotificationsEnabled: zod_1.z.boolean().optional(), // kilocode_change
	maxOpenTabsContext: zod_1.z.number().optional(),
	maxWorkspaceFiles: zod_1.z.number().optional(),
	showRooIgnoredFiles: zod_1.z.boolean().optional(),
	maxReadFileLine: zod_1.z.number().optional(),
	maxImageFileSize: zod_1.z.number().optional(),
	maxTotalImageSize: zod_1.z.number().optional(),
	terminalOutputLineLimit: zod_1.z.number().optional(),
	terminalOutputCharacterLimit: zod_1.z.number().optional(),
	terminalShellIntegrationTimeout: zod_1.z.number().optional(),
	terminalShellIntegrationDisabled: zod_1.z.boolean().optional(),
	terminalCommandDelay: zod_1.z.number().optional(),
	terminalPowershellCounter: zod_1.z.boolean().optional(),
	terminalZshClearEolMark: zod_1.z.boolean().optional(),
	terminalZshOhMy: zod_1.z.boolean().optional(),
	terminalZshP10k: zod_1.z.boolean().optional(),
	terminalZdotdir: zod_1.z.boolean().optional(),
	terminalCompressProgressBar: zod_1.z.boolean().optional(),
	diagnosticsEnabled: zod_1.z.boolean().optional(),
	rateLimitSeconds: zod_1.z.number().optional(),
	diffEnabled: zod_1.z.boolean().optional(),
	fuzzyMatchThreshold: zod_1.z.number().optional(),
	experiments: experiment_js_1.experimentsSchema.optional(),
	// kilocode_change start: Morph fast apply
	morphApiKey: zod_1.z.string().optional(),
	fastApplyModel: kilocode_js_1.fastApplyModelSchema.optional(),
	// kilocode_change end
	codebaseIndexModels: codebase_index_js_1.codebaseIndexModelsSchema.optional(),
	codebaseIndexConfig: codebase_index_js_1.codebaseIndexConfigSchema.optional(),
	language: vscode_js_1.languagesSchema.optional(),
	telemetrySetting: telemetry_js_1.telemetrySettingsSchema.optional(),
	mcpEnabled: zod_1.z.boolean().optional(),
	enableMcpServerCreation: zod_1.z.boolean().optional(),
	mcpMarketplaceCatalog: zod_1.z.any().optional(), // kilocode_change: MCP marketplace catalog
	mode: zod_1.z.string().optional(),
	modeApiConfigs: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
	customModes: zod_1.z.array(mode_js_1.modeConfigSchema).optional(),
	customModePrompts: mode_js_2.customModePromptsSchema.optional(),
	customSupportPrompts: mode_js_2.customSupportPromptsSchema.optional(),
	enhancementApiConfigId: zod_1.z.string().optional(),
	dismissedNotificationIds: zod_1.z.string().array().optional(), // kilocode_change
	commitMessageApiConfigId: zod_1.z.string().optional(), // kilocode_change
	terminalCommandApiConfigId: zod_1.z.string().optional(), // kilocode_change
	ghostServiceSettings: kilocode_js_1.ghostServiceSettingsSchema, // kilocode_change
	includeTaskHistoryInEnhance: zod_1.z.boolean().optional(),
	historyPreviewCollapsed: zod_1.z.boolean().optional(),
	reasoningBlockCollapsed: zod_1.z.boolean().optional(),
	profileThresholds: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional(),
	hasOpenedModeSelector: zod_1.z.boolean().optional(),
	lastModeExportPath: zod_1.z.string().optional(),
	lastModeImportPath: zod_1.z.string().optional(),
})
exports.GLOBAL_SETTINGS_KEYS = exports.globalSettingsSchema.keyof().options
/**
 * RooCodeSettings
 */
exports.rooCodeSettingsSchema = provider_settings_js_1.providerSettingsSchema.merge(exports.globalSettingsSchema)
/**
 * SecretState
 */
exports.SECRET_STATE_KEYS = [
	"apiKey",
	"glamaApiKey",
	"openRouterApiKey",
	"awsAccessKey",
	"awsApiKey",
	"awsSecretKey",
	"awsSessionToken",
	"openAiApiKey",
	"ollamaApiKey",
	"geminiApiKey",
	"openAiNativeApiKey",
	"cerebrasApiKey",
	"deepSeekApiKey",
	"doubaoApiKey",
	"moonshotApiKey",
	"mistralApiKey",
	"unboundApiKey",
	"requestyApiKey",
	"xaiApiKey",
	"groqApiKey",
	"chutesApiKey",
	"litellmApiKey",
	"deepInfraApiKey",
	"codeIndexOpenAiKey",
	"codeIndexQdrantApiKey",
	// kilocode_change start
	"kilocodeToken",
	// kilocode_change end
	"codebaseIndexOpenAiCompatibleApiKey",
	"codebaseIndexGeminiApiKey",
	"codebaseIndexMistralApiKey",
	"codebaseIndexVercelAiGatewayApiKey",
	"huggingFaceApiKey",
	"sambaNovaApiKey",
	"zaiApiKey",
	"fireworksApiKey",
	"featherlessApiKey",
	"ioIntelligenceApiKey",
	"vercelAiGatewayApiKey",
]
// Global secrets that are part of GlobalSettings (not ProviderSettings)
exports.GLOBAL_SECRET_KEYS = [
	"openRouterImageApiKey", // For image generation
	"kiloCodeImageApiKey",
]
const isSecretStateKey = (key) => exports.SECRET_STATE_KEYS.includes(key) || exports.GLOBAL_SECRET_KEYS.includes(key)
exports.isSecretStateKey = isSecretStateKey
exports.GLOBAL_STATE_KEYS = [...exports.GLOBAL_SETTINGS_KEYS, ...provider_settings_js_1.PROVIDER_SETTINGS_KEYS].filter(
	(key) => !(0, exports.isSecretStateKey)(key),
)
const isGlobalStateKey = (key) => exports.GLOBAL_STATE_KEYS.includes(key)
exports.isGlobalStateKey = isGlobalStateKey
/**
 * Evals
 */
// Default settings when running evals (unless overridden).
exports.EVALS_SETTINGS = {
	apiProvider: "openrouter",
	openRouterUseMiddleOutTransform: false,
	lastShownAnnouncementId: "jul-09-2025-3-23-0",
	pinnedApiConfigs: {},
	autoApprovalEnabled: true,
	alwaysAllowReadOnly: true,
	alwaysAllowReadOnlyOutsideWorkspace: false,
	alwaysAllowWrite: true,
	alwaysAllowWriteOutsideWorkspace: false,
	alwaysAllowWriteProtected: false,
	writeDelayMs: 1000,
	alwaysAllowBrowser: true,
	alwaysApproveResubmit: true,
	requestDelaySeconds: 10,
	alwaysAllowMcp: true,
	alwaysAllowModeSwitch: true,
	alwaysAllowSubtasks: true,
	alwaysAllowExecute: true,
	alwaysAllowFollowupQuestions: true,
	alwaysAllowUpdateTodoList: true,
	followupAutoApproveTimeoutMs: 0,
	allowedCommands: ["*"],
	commandExecutionTimeout: 20,
	commandTimeoutAllowlist: [],
	preventCompletionWithOpenTodos: false,
	browserToolEnabled: false,
	browserViewportSize: "900x600",
	screenshotQuality: 75,
	remoteBrowserEnabled: false,
	ttsEnabled: false,
	ttsSpeed: 1,
	soundEnabled: false,
	soundVolume: 0.5,
	dismissedNotificationIds: [], // kilocode_change
	systemNotificationsEnabled: true, // kilocode_change
	ghostServiceSettings: {}, // kilocode_change
	terminalOutputLineLimit: 500,
	terminalOutputCharacterLimit: exports.DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT,
	terminalShellIntegrationTimeout: 30000,
	terminalCommandDelay: 0,
	terminalPowershellCounter: false,
	terminalZshOhMy: true,
	terminalZshClearEolMark: true,
	terminalZshP10k: false,
	terminalZdotdir: true,
	terminalCompressProgressBar: true,
	terminalShellIntegrationDisabled: true,
	diagnosticsEnabled: true,
	diffEnabled: true,
	fuzzyMatchThreshold: 1,
	enableCheckpoints: false,
	rateLimitSeconds: 0,
	maxOpenTabsContext: 20,
	maxWorkspaceFiles: 200,
	showRooIgnoredFiles: true,
	maxReadFileLine: -1, // -1 to enable full file reading.
	includeDiagnosticMessages: true,
	maxDiagnosticMessages: 50,
	language: "en",
	telemetrySetting: "enabled",
	mcpEnabled: false,
	mode: "code", // "architect",
	customModes: [],
}
exports.EVALS_TIMEOUT = 5 * 60 * 1000
//# sourceMappingURL=global-settings.js.map
