"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.rooCodeTelemetryEventSchema =
	exports.telemetryPropertiesSchema =
	exports.gitPropertiesSchema =
	exports.taskPropertiesSchema =
	exports.appPropertiesSchema =
	exports.cloudAppPropertiesSchema =
	exports.dynamicAppPropertiesSchema =
	exports.staticAppPropertiesSchema =
	exports.TelemetryEventName =
	exports.telemetrySettingsSchema =
	exports.telemetrySettings =
		void 0
const zod_1 = require("zod")
const provider_settings_js_1 = require("./provider-settings.js")
const message_js_1 = require("./message.js")
/**
 * TelemetrySetting
 */
exports.telemetrySettings = ["unset", "enabled", "disabled"]
exports.telemetrySettingsSchema = zod_1.z.enum(exports.telemetrySettings)
/**
 * TelemetryEventName
 */
var TelemetryEventName
;(function (TelemetryEventName) {
	// kilocode_change start
	TelemetryEventName["COMMIT_MSG_GENERATED"] = "Commit Message Generated"
	TelemetryEventName["INLINE_ASSIST_QUICK_TASK"] = "Inline Assist Quick Task"
	TelemetryEventName["INLINE_ASSIST_AUTO_TASK"] = "Inline Assist Auto Task"
	TelemetryEventName["INLINE_ASSIST_ACCEPT_SUGGESTION"] = "Inline Assist Accept Suggestion"
	TelemetryEventName["INLINE_ASSIST_REJECT_SUGGESTION"] = "Inline Assist Reject Suggestion"
	TelemetryEventName["CHECKPOINT_FAILURE"] = "Checkpoint Failure"
	TelemetryEventName["TOOL_ERROR"] = "Tool Error"
	TelemetryEventName["MAX_COMPLETION_TOKENS_REACHED_ERROR"] = "Max Completion Tokens Reached Error"
	TelemetryEventName["NOTIFICATION_CLICKED"] = "Notification Clicked"
	TelemetryEventName["WEBVIEW_MEMORY_USAGE"] = "Webview Memory Usage"
	TelemetryEventName["FREE_MODELS_LINK_CLICKED"] = "Free Models Link Clicked"
	TelemetryEventName["SWITCH_TO_KILO_CODE_CLICKED"] = "Switch To Kilo Code Clicked"
	TelemetryEventName["SUGGESTION_BUTTON_CLICKED"] = "Suggestion Button Clicked"
	TelemetryEventName["NO_ASSISTANT_MESSAGES"] = "No Assistant Messages"
	// kilocode_change end
	TelemetryEventName["TASK_CREATED"] = "Task Created"
	TelemetryEventName["TASK_RESTARTED"] = "Task Reopened"
	TelemetryEventName["TASK_COMPLETED"] = "Task Completed"
	TelemetryEventName["TASK_MESSAGE"] = "Task Message"
	TelemetryEventName["TASK_CONVERSATION_MESSAGE"] = "Conversation Message"
	TelemetryEventName["LLM_COMPLETION"] = "LLM Completion"
	TelemetryEventName["MODE_SWITCH"] = "Mode Switched"
	TelemetryEventName["MODE_SELECTOR_OPENED"] = "Mode Selector Opened"
	TelemetryEventName["TOOL_USED"] = "Tool Used"
	TelemetryEventName["CHECKPOINT_CREATED"] = "Checkpoint Created"
	TelemetryEventName["CHECKPOINT_RESTORED"] = "Checkpoint Restored"
	TelemetryEventName["CHECKPOINT_DIFFED"] = "Checkpoint Diffed"
	TelemetryEventName["TAB_SHOWN"] = "Tab Shown"
	TelemetryEventName["MODE_SETTINGS_CHANGED"] = "Mode Setting Changed"
	TelemetryEventName["CUSTOM_MODE_CREATED"] = "Custom Mode Created"
	TelemetryEventName["CONTEXT_CONDENSED"] = "Context Condensed"
	TelemetryEventName["SLIDING_WINDOW_TRUNCATION"] = "Sliding Window Truncation"
	TelemetryEventName["CODE_ACTION_USED"] = "Code Action Used"
	TelemetryEventName["PROMPT_ENHANCED"] = "Prompt Enhanced"
	TelemetryEventName["TITLE_BUTTON_CLICKED"] = "Title Button Clicked"
	TelemetryEventName["AUTHENTICATION_INITIATED"] = "Authentication Initiated"
	TelemetryEventName["MARKETPLACE_ITEM_INSTALLED"] = "Marketplace Item Installed"
	TelemetryEventName["MARKETPLACE_ITEM_REMOVED"] = "Marketplace Item Removed"
	TelemetryEventName["MARKETPLACE_TAB_VIEWED"] = "Marketplace Tab Viewed"
	TelemetryEventName["MARKETPLACE_INSTALL_BUTTON_CLICKED"] = "Marketplace Install Button Clicked"
	TelemetryEventName["SHARE_BUTTON_CLICKED"] = "Share Button Clicked"
	TelemetryEventName["SHARE_ORGANIZATION_CLICKED"] = "Share Organization Clicked"
	TelemetryEventName["SHARE_PUBLIC_CLICKED"] = "Share Public Clicked"
	TelemetryEventName["SHARE_CONNECT_TO_CLOUD_CLICKED"] = "Share Connect To Cloud Clicked"
	TelemetryEventName["ACCOUNT_CONNECT_CLICKED"] = "Account Connect Clicked"
	TelemetryEventName["ACCOUNT_CONNECT_SUCCESS"] = "Account Connect Success"
	TelemetryEventName["ACCOUNT_LOGOUT_CLICKED"] = "Account Logout Clicked"
	TelemetryEventName["ACCOUNT_LOGOUT_SUCCESS"] = "Account Logout Success"
	TelemetryEventName["FEATURED_PROVIDER_CLICKED"] = "Featured Provider Clicked"
	TelemetryEventName["UPSELL_DISMISSED"] = "Upsell Dismissed"
	TelemetryEventName["UPSELL_CLICKED"] = "Upsell Clicked"
	TelemetryEventName["SCHEMA_VALIDATION_ERROR"] = "Schema Validation Error"
	TelemetryEventName["DIFF_APPLICATION_ERROR"] = "Diff Application Error"
	TelemetryEventName["SHELL_INTEGRATION_ERROR"] = "Shell Integration Error"
	TelemetryEventName["CONSECUTIVE_MISTAKE_ERROR"] = "Consecutive Mistake Error"
	TelemetryEventName["CODE_INDEX_ERROR"] = "Code Index Error"
	TelemetryEventName["TELEMETRY_SETTINGS_CHANGED"] = "Telemetry Settings Changed"
})(TelemetryEventName || (exports.TelemetryEventName = TelemetryEventName = {}))
/**
 * TelemetryProperties
 */
exports.staticAppPropertiesSchema = zod_1.z.object({
	appName: zod_1.z.string(),
	appVersion: zod_1.z.string(),
	vscodeVersion: zod_1.z.string(),
	platform: zod_1.z.string(),
	editorName: zod_1.z.string(),
	wrapped: zod_1.z.boolean(), // kilocode_change
	wrapper: zod_1.z.string().nullable(), // kilocode_change
	wrapperTitle: zod_1.z.string().nullable(), // kilocode_change
	wrapperCode: zod_1.z.string().nullable(), // kilocode_change
	wrapperVersion: zod_1.z.string().nullable(), // kilocode_change
	hostname: zod_1.z.string().optional(),
})
exports.dynamicAppPropertiesSchema = zod_1.z.object({
	language: zod_1.z.string(),
	mode: zod_1.z.string(),
})
exports.cloudAppPropertiesSchema = zod_1.z.object({
	cloudIsAuthenticated: zod_1.z.boolean().optional(),
})
exports.appPropertiesSchema = zod_1.z.object({
	...exports.staticAppPropertiesSchema.shape,
	...exports.dynamicAppPropertiesSchema.shape,
	...exports.cloudAppPropertiesSchema.shape,
})
exports.taskPropertiesSchema = zod_1.z.object({
	taskId: zod_1.z.string().optional(),
	apiProvider: zod_1.z.enum(provider_settings_js_1.providerNames).optional(),
	modelId: zod_1.z.string().optional(),
	diffStrategy: zod_1.z.string().optional(),
	isSubtask: zod_1.z.boolean().optional(),
	todos: zod_1.z
		.object({
			total: zod_1.z.number(),
			completed: zod_1.z.number(),
			inProgress: zod_1.z.number(),
			pending: zod_1.z.number(),
		})
		.optional(),
	// kilocode_change start
	currentTaskSize: zod_1.z.number().optional(),
	taskHistorySize: zod_1.z.number().optional(),
	// kilocode_change end
})
exports.gitPropertiesSchema = zod_1.z.object({
	repositoryUrl: zod_1.z.string().optional(),
	repositoryName: zod_1.z.string().optional(),
	defaultBranch: zod_1.z.string().optional(),
})
exports.telemetryPropertiesSchema = zod_1.z.object({
	...exports.appPropertiesSchema.shape,
	...exports.taskPropertiesSchema.shape,
	...exports.gitPropertiesSchema.shape,
})
/**
 * RooCodeTelemetryEvent
 */
exports.rooCodeTelemetryEventSchema = zod_1.z.discriminatedUnion("type", [
	zod_1.z.object({
		type: zod_1.z.enum([
			// kilocode_change start
			TelemetryEventName.COMMIT_MSG_GENERATED, // kilocode_change
			TelemetryEventName.INLINE_ASSIST_QUICK_TASK, // kilocode_change
			TelemetryEventName.INLINE_ASSIST_AUTO_TASK, // kilocode_change
			TelemetryEventName.INLINE_ASSIST_ACCEPT_SUGGESTION, // kilocode_change
			TelemetryEventName.INLINE_ASSIST_REJECT_SUGGESTION, // kilocode_change
			TelemetryEventName.WEBVIEW_MEMORY_USAGE, // kilocode_change
			// kilocode_change end
			TelemetryEventName.TASK_CREATED,
			TelemetryEventName.TASK_RESTARTED,
			TelemetryEventName.TASK_COMPLETED,
			TelemetryEventName.TASK_CONVERSATION_MESSAGE,
			TelemetryEventName.MODE_SWITCH,
			TelemetryEventName.MODE_SELECTOR_OPENED,
			TelemetryEventName.TOOL_USED,
			TelemetryEventName.CHECKPOINT_CREATED,
			TelemetryEventName.CHECKPOINT_RESTORED,
			TelemetryEventName.CHECKPOINT_DIFFED,
			TelemetryEventName.CODE_ACTION_USED,
			TelemetryEventName.PROMPT_ENHANCED,
			TelemetryEventName.TITLE_BUTTON_CLICKED,
			TelemetryEventName.AUTHENTICATION_INITIATED,
			TelemetryEventName.MARKETPLACE_ITEM_INSTALLED,
			TelemetryEventName.MARKETPLACE_ITEM_REMOVED,
			TelemetryEventName.MARKETPLACE_TAB_VIEWED,
			TelemetryEventName.MARKETPLACE_INSTALL_BUTTON_CLICKED,
			TelemetryEventName.SHARE_BUTTON_CLICKED,
			TelemetryEventName.SHARE_ORGANIZATION_CLICKED,
			TelemetryEventName.SHARE_PUBLIC_CLICKED,
			TelemetryEventName.SHARE_CONNECT_TO_CLOUD_CLICKED,
			TelemetryEventName.ACCOUNT_CONNECT_CLICKED,
			TelemetryEventName.ACCOUNT_CONNECT_SUCCESS,
			TelemetryEventName.ACCOUNT_LOGOUT_CLICKED,
			TelemetryEventName.ACCOUNT_LOGOUT_SUCCESS,
			TelemetryEventName.FEATURED_PROVIDER_CLICKED,
			TelemetryEventName.UPSELL_DISMISSED,
			TelemetryEventName.UPSELL_CLICKED,
			TelemetryEventName.SCHEMA_VALIDATION_ERROR,
			TelemetryEventName.DIFF_APPLICATION_ERROR,
			TelemetryEventName.SHELL_INTEGRATION_ERROR,
			TelemetryEventName.CONSECUTIVE_MISTAKE_ERROR,
			TelemetryEventName.CODE_INDEX_ERROR,
			TelemetryEventName.CONTEXT_CONDENSED,
			TelemetryEventName.SLIDING_WINDOW_TRUNCATION,
			TelemetryEventName.TAB_SHOWN,
			TelemetryEventName.MODE_SETTINGS_CHANGED,
			TelemetryEventName.CUSTOM_MODE_CREATED,
		]),
		properties: exports.telemetryPropertiesSchema,
	}),
	zod_1.z.object({
		type: zod_1.z.literal(TelemetryEventName.TELEMETRY_SETTINGS_CHANGED),
		properties: zod_1.z.object({
			...exports.telemetryPropertiesSchema.shape,
			previousSetting: exports.telemetrySettingsSchema,
			newSetting: exports.telemetrySettingsSchema,
		}),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(TelemetryEventName.TASK_MESSAGE),
		properties: zod_1.z.object({
			...exports.telemetryPropertiesSchema.shape,
			taskId: zod_1.z.string(),
			message: message_js_1.clineMessageSchema,
		}),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(TelemetryEventName.LLM_COMPLETION),
		properties: zod_1.z.object({
			...exports.telemetryPropertiesSchema.shape,
			inputTokens: zod_1.z.number(),
			outputTokens: zod_1.z.number(),
			cacheReadTokens: zod_1.z.number().optional(),
			cacheWriteTokens: zod_1.z.number().optional(),
			cost: zod_1.z.number().optional(),
		}),
	}),
])
//# sourceMappingURL=telemetry.js.map
