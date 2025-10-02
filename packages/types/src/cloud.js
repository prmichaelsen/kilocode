"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.TaskSocketEvents =
	exports.ExtensionSocketEvents =
	exports.taskBridgeCommandSchema =
	exports.TaskBridgeCommandName =
	exports.taskBridgeEventSchema =
	exports.TaskBridgeEventName =
	exports.extensionBridgeCommandSchema =
	exports.ExtensionBridgeCommandName =
	exports.extensionBridgeEventSchema =
	exports.ExtensionBridgeEventName =
	exports.extensionInstanceSchema =
	exports.INSTANCE_TTL_SECONDS =
	exports.HEARTBEAT_INTERVAL_MS =
	exports.ConnectionState =
	exports.shareResponseSchema =
	exports.ORGANIZATION_DEFAULT =
	exports.ORGANIZATION_ALLOW_ALL =
	exports.userSettingsDataSchema =
	exports.userSettingsConfigSchema =
	exports.userFeaturesSchema =
	exports.organizationSettingsSchema =
	exports.organizationFeaturesSchema =
	exports.organizationCloudSettingsSchema =
	exports.organizationDefaultSettingsSchema =
	exports.organizationAllowListSchema =
		void 0
const zod_1 = require("zod")
const events_js_1 = require("./events.js")
const task_js_1 = require("./task.js")
const global_settings_js_1 = require("./global-settings.js")
const provider_settings_js_1 = require("./provider-settings.js")
const marketplace_js_1 = require("./marketplace.js")
const message_js_1 = require("./message.js")
const telemetry_js_1 = require("./telemetry.js")
/**
 * OrganizationAllowList
 */
exports.organizationAllowListSchema = zod_1.z.object({
	allowAll: zod_1.z.boolean(),
	providers: zod_1.z.record(
		zod_1.z.object({
			allowAll: zod_1.z.boolean(),
			models: zod_1.z.array(zod_1.z.string()).optional(),
		}),
	),
})
/**
 * OrganizationDefaultSettings
 */
exports.organizationDefaultSettingsSchema = global_settings_js_1.globalSettingsSchema
	.pick({
		enableCheckpoints: true,
		fuzzyMatchThreshold: true,
		maxOpenTabsContext: true,
		maxReadFileLine: true,
		maxWorkspaceFiles: true,
		showRooIgnoredFiles: true,
		terminalCommandDelay: true,
		terminalCompressProgressBar: true,
		terminalOutputLineLimit: true,
		terminalShellIntegrationDisabled: true,
		terminalShellIntegrationTimeout: true,
		terminalZshClearEolMark: true,
	})
	// Add stronger validations for some fields.
	.merge(
		zod_1.z.object({
			maxOpenTabsContext: zod_1.z.number().int().nonnegative().optional(),
			maxReadFileLine: zod_1.z.number().int().gte(-1).optional(),
			maxWorkspaceFiles: zod_1.z.number().int().nonnegative().optional(),
			terminalCommandDelay: zod_1.z.number().int().nonnegative().optional(),
			terminalOutputLineLimit: zod_1.z.number().int().nonnegative().optional(),
			terminalShellIntegrationTimeout: zod_1.z.number().int().nonnegative().optional(),
		}),
	)
/**
 * OrganizationCloudSettings
 */
exports.organizationCloudSettingsSchema = zod_1.z.object({
	recordTaskMessages: zod_1.z.boolean().optional(),
	enableTaskSharing: zod_1.z.boolean().optional(),
	taskShareExpirationDays: zod_1.z.number().int().positive().optional(),
	allowMembersViewAllTasks: zod_1.z.boolean().optional(),
})
/**
 * OrganizationFeatures
 */
exports.organizationFeaturesSchema = zod_1.z.object({
	roomoteControlEnabled: zod_1.z.boolean().optional(),
})
/**
 * OrganizationSettings
 */
exports.organizationSettingsSchema = zod_1.z.object({
	version: zod_1.z.number(),
	cloudSettings: exports.organizationCloudSettingsSchema.optional(),
	defaultSettings: exports.organizationDefaultSettingsSchema,
	allowList: exports.organizationAllowListSchema,
	features: exports.organizationFeaturesSchema.optional(),
	hiddenMcps: zod_1.z.array(zod_1.z.string()).optional(),
	hideMarketplaceMcps: zod_1.z.boolean().optional(),
	mcps: zod_1.z.array(marketplace_js_1.mcpMarketplaceItemSchema).optional(),
	providerProfiles: zod_1.z.record(zod_1.z.string(), provider_settings_js_1.providerSettingsWithIdSchema).optional(),
})
/**
 * User Settings Schemas
 */
exports.userFeaturesSchema = zod_1.z.object({
	roomoteControlEnabled: zod_1.z.boolean().optional(),
})
exports.userSettingsConfigSchema = zod_1.z.object({
	extensionBridgeEnabled: zod_1.z.boolean().optional(),
	taskSyncEnabled: zod_1.z.boolean().optional(),
})
exports.userSettingsDataSchema = zod_1.z.object({
	features: exports.userFeaturesSchema,
	settings: exports.userSettingsConfigSchema,
	version: zod_1.z.number(),
})
/**
 * Constants
 */
exports.ORGANIZATION_ALLOW_ALL = {
	allowAll: true,
	providers: {},
}
exports.ORGANIZATION_DEFAULT = {
	version: 0,
	cloudSettings: {
		recordTaskMessages: true,
		enableTaskSharing: true,
		taskShareExpirationDays: 30,
		allowMembersViewAllTasks: true,
	},
	defaultSettings: {},
	allowList: exports.ORGANIZATION_ALLOW_ALL,
}
/**
 * ShareResponse
 */
exports.shareResponseSchema = zod_1.z.object({
	success: zod_1.z.boolean(),
	shareUrl: zod_1.z.string().optional(),
	error: zod_1.z.string().optional(),
	isNewShare: zod_1.z.boolean().optional(),
	manageUrl: zod_1.z.string().optional(),
})
/**
 * ConnectionState
 */
var ConnectionState
;(function (ConnectionState) {
	ConnectionState["DISCONNECTED"] = "disconnected"
	ConnectionState["CONNECTING"] = "connecting"
	ConnectionState["CONNECTED"] = "connected"
	ConnectionState["RETRYING"] = "retrying"
	ConnectionState["FAILED"] = "failed"
})(ConnectionState || (exports.ConnectionState = ConnectionState = {}))
/**
 * Constants
 */
exports.HEARTBEAT_INTERVAL_MS = 20000
exports.INSTANCE_TTL_SECONDS = 60
/**
 * ExtensionTask
 */
const extensionTaskSchema = zod_1.z.object({
	taskId: zod_1.z.string(),
	taskStatus: zod_1.z.nativeEnum(task_js_1.TaskStatus),
	taskAsk: message_js_1.clineMessageSchema.optional(),
	queuedMessages: zod_1.z.array(message_js_1.queuedMessageSchema).optional(),
	parentTaskId: zod_1.z.string().optional(),
	childTaskId: zod_1.z.string().optional(),
	tokenUsage: message_js_1.tokenUsageSchema.optional(),
	...task_js_1.taskMetadataSchema.shape,
})
/**
 * ExtensionInstance
 */
exports.extensionInstanceSchema = zod_1.z.object({
	instanceId: zod_1.z.string(),
	userId: zod_1.z.string(),
	workspacePath: zod_1.z.string(),
	appProperties: telemetry_js_1.staticAppPropertiesSchema,
	gitProperties: telemetry_js_1.gitPropertiesSchema.optional(),
	lastHeartbeat: zod_1.z.coerce.number(),
	task: extensionTaskSchema,
	taskAsk: message_js_1.clineMessageSchema.optional(),
	taskHistory: zod_1.z.array(zod_1.z.string()),
	mode: zod_1.z.string().optional(),
	modes: zod_1.z.array(zod_1.z.object({ slug: zod_1.z.string(), name: zod_1.z.string() })).optional(),
	providerProfile: zod_1.z.string().optional(),
	providerProfiles: zod_1.z
		.array(zod_1.z.object({ name: zod_1.z.string(), provider: zod_1.z.string().optional() }))
		.optional(),
})
/**
 * ExtensionBridgeEvent
 */
var ExtensionBridgeEventName
;(function (ExtensionBridgeEventName) {
	ExtensionBridgeEventName["TaskCreated"] = "taskCreated"
	ExtensionBridgeEventName["TaskStarted"] = "taskStarted"
	ExtensionBridgeEventName["TaskCompleted"] = "taskCompleted"
	ExtensionBridgeEventName["TaskAborted"] = "taskAborted"
	ExtensionBridgeEventName["TaskFocused"] = "taskFocused"
	ExtensionBridgeEventName["TaskUnfocused"] = "taskUnfocused"
	ExtensionBridgeEventName["TaskActive"] = "taskActive"
	ExtensionBridgeEventName["TaskInteractive"] = "taskInteractive"
	ExtensionBridgeEventName["TaskResumable"] = "taskResumable"
	ExtensionBridgeEventName["TaskIdle"] = "taskIdle"
	ExtensionBridgeEventName["TaskPaused"] = "taskPaused"
	ExtensionBridgeEventName["TaskUnpaused"] = "taskUnpaused"
	ExtensionBridgeEventName["TaskSpawned"] = "taskSpawned"
	ExtensionBridgeEventName["TaskUserMessage"] = "taskUserMessage"
	ExtensionBridgeEventName["TaskTokenUsageUpdated"] = "taskTokenUsageUpdated"
	ExtensionBridgeEventName["ModeChanged"] = "modeChanged"
	ExtensionBridgeEventName["ProviderProfileChanged"] = "providerProfileChanged"
	ExtensionBridgeEventName["InstanceRegistered"] = "instance_registered"
	ExtensionBridgeEventName["InstanceUnregistered"] = "instance_unregistered"
	ExtensionBridgeEventName["HeartbeatUpdated"] = "heartbeat_updated"
})(ExtensionBridgeEventName || (exports.ExtensionBridgeEventName = ExtensionBridgeEventName = {}))
exports.extensionBridgeEventSchema = zod_1.z.discriminatedUnion("type", [
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskCreated),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskStarted),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskCompleted),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskAborted),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskFocused),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskUnfocused),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskActive),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskInteractive),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskResumable),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskIdle),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskPaused),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskUnpaused),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskSpawned),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskUserMessage),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.TaskTokenUsageUpdated),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.ModeChanged),
		instance: exports.extensionInstanceSchema,
		mode: zod_1.z.string(),
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.ProviderProfileChanged),
		instance: exports.extensionInstanceSchema,
		providerProfile: zod_1.z.object({ name: zod_1.z.string(), provider: zod_1.z.string().optional() }),
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.InstanceRegistered),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.InstanceUnregistered),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeEventName.HeartbeatUpdated),
		instance: exports.extensionInstanceSchema,
		timestamp: zod_1.z.number(),
	}),
])
/**
 * ExtensionBridgeCommand
 */
var ExtensionBridgeCommandName
;(function (ExtensionBridgeCommandName) {
	ExtensionBridgeCommandName["StartTask"] = "start_task"
	ExtensionBridgeCommandName["StopTask"] = "stop_task"
	ExtensionBridgeCommandName["ResumeTask"] = "resume_task"
})(ExtensionBridgeCommandName || (exports.ExtensionBridgeCommandName = ExtensionBridgeCommandName = {}))
exports.extensionBridgeCommandSchema = zod_1.z.discriminatedUnion("type", [
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeCommandName.StartTask),
		instanceId: zod_1.z.string(),
		payload: zod_1.z.object({
			text: zod_1.z.string(),
			images: zod_1.z.array(zod_1.z.string()).optional(),
			mode: zod_1.z.string().optional(),
			providerProfile: zod_1.z.string().optional(),
		}),
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeCommandName.StopTask),
		instanceId: zod_1.z.string(),
		payload: zod_1.z.object({ taskId: zod_1.z.string() }),
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(ExtensionBridgeCommandName.ResumeTask),
		instanceId: zod_1.z.string(),
		payload: zod_1.z.object({ taskId: zod_1.z.string() }),
		timestamp: zod_1.z.number(),
	}),
])
/**
 * TaskBridgeEvent
 */
var TaskBridgeEventName
;(function (TaskBridgeEventName) {
	TaskBridgeEventName["Message"] = "message"
	TaskBridgeEventName["TaskModeSwitched"] = "taskModeSwitched"
	TaskBridgeEventName["TaskInteractive"] = "taskInteractive"
})(TaskBridgeEventName || (exports.TaskBridgeEventName = TaskBridgeEventName = {}))
exports.taskBridgeEventSchema = zod_1.z.discriminatedUnion("type", [
	zod_1.z.object({
		type: zod_1.z.literal(TaskBridgeEventName.Message),
		taskId: zod_1.z.string(),
		action: zod_1.z.string(),
		message: message_js_1.clineMessageSchema,
	}),
	zod_1.z.object({
		type: zod_1.z.literal(TaskBridgeEventName.TaskModeSwitched),
		taskId: zod_1.z.string(),
		mode: zod_1.z.string(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(TaskBridgeEventName.TaskInteractive),
		taskId: zod_1.z.string(),
	}),
])
/**
 * TaskBridgeCommand
 */
var TaskBridgeCommandName
;(function (TaskBridgeCommandName) {
	TaskBridgeCommandName["Message"] = "message"
	TaskBridgeCommandName["ApproveAsk"] = "approve_ask"
	TaskBridgeCommandName["DenyAsk"] = "deny_ask"
})(TaskBridgeCommandName || (exports.TaskBridgeCommandName = TaskBridgeCommandName = {}))
exports.taskBridgeCommandSchema = zod_1.z.discriminatedUnion("type", [
	zod_1.z.object({
		type: zod_1.z.literal(TaskBridgeCommandName.Message),
		taskId: zod_1.z.string(),
		payload: zod_1.z.object({
			text: zod_1.z.string(),
			images: zod_1.z.array(zod_1.z.string()).optional(),
			mode: zod_1.z.string().optional(),
			providerProfile: zod_1.z.string().optional(),
		}),
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(TaskBridgeCommandName.ApproveAsk),
		taskId: zod_1.z.string(),
		payload: zod_1.z.object({
			text: zod_1.z.string().optional(),
			images: zod_1.z.array(zod_1.z.string()).optional(),
		}),
		timestamp: zod_1.z.number(),
	}),
	zod_1.z.object({
		type: zod_1.z.literal(TaskBridgeCommandName.DenyAsk),
		taskId: zod_1.z.string(),
		payload: zod_1.z.object({
			text: zod_1.z.string().optional(),
			images: zod_1.z.array(zod_1.z.string()).optional(),
		}),
		timestamp: zod_1.z.number(),
	}),
])
/**
 * ExtensionSocketEvents
 */
var ExtensionSocketEvents
;(function (ExtensionSocketEvents) {
	ExtensionSocketEvents["CONNECTED"] = "extension:connected"
	ExtensionSocketEvents["REGISTER"] = "extension:register"
	ExtensionSocketEvents["UNREGISTER"] = "extension:unregister"
	ExtensionSocketEvents["HEARTBEAT"] = "extension:heartbeat"
	ExtensionSocketEvents["EVENT"] = "extension:event"
	ExtensionSocketEvents["RELAYED_EVENT"] = "extension:relayed_event"
	ExtensionSocketEvents["COMMAND"] = "extension:command"
	ExtensionSocketEvents["RELAYED_COMMAND"] = "extension:relayed_command"
})(ExtensionSocketEvents || (exports.ExtensionSocketEvents = ExtensionSocketEvents = {}))
/**
 * TaskSocketEvents
 */
var TaskSocketEvents
;(function (TaskSocketEvents) {
	TaskSocketEvents["JOIN"] = "task:join"
	TaskSocketEvents["LEAVE"] = "task:leave"
	TaskSocketEvents["EVENT"] = "task:event"
	TaskSocketEvents["RELAYED_EVENT"] = "task:relayed_event"
	TaskSocketEvents["COMMAND"] = "task:command"
	TaskSocketEvents["RELAYED_COMMAND"] = "task:relayed_command"
})(TaskSocketEvents || (exports.TaskSocketEvents = TaskSocketEvents = {}))
//# sourceMappingURL=cloud.js.map
