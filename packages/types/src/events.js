"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.taskEventSchema = exports.rooCodeEventsSchema = exports.RooCodeEventName = void 0
const zod_1 = require("zod")
const message_js_1 = require("./message.js")
const tool_js_1 = require("./tool.js")
/**
 * RooCodeEventName
 */
var RooCodeEventName
;(function (RooCodeEventName) {
	// Task Provider Lifecycle
	RooCodeEventName["TaskCreated"] = "taskCreated"
	// Task Lifecycle
	RooCodeEventName["TaskStarted"] = "taskStarted"
	RooCodeEventName["TaskCompleted"] = "taskCompleted"
	RooCodeEventName["TaskAborted"] = "taskAborted"
	RooCodeEventName["TaskFocused"] = "taskFocused"
	RooCodeEventName["TaskUnfocused"] = "taskUnfocused"
	RooCodeEventName["TaskActive"] = "taskActive"
	RooCodeEventName["TaskInteractive"] = "taskInteractive"
	RooCodeEventName["TaskResumable"] = "taskResumable"
	RooCodeEventName["TaskIdle"] = "taskIdle"
	// Subtask Lifecycle
	RooCodeEventName["TaskPaused"] = "taskPaused"
	RooCodeEventName["TaskUnpaused"] = "taskUnpaused"
	RooCodeEventName["TaskSpawned"] = "taskSpawned"
	// Task Execution
	RooCodeEventName["Message"] = "message"
	RooCodeEventName["TaskModeSwitched"] = "taskModeSwitched"
	RooCodeEventName["TaskAskResponded"] = "taskAskResponded"
	RooCodeEventName["TaskUserMessage"] = "taskUserMessage"
	// Task Analytics
	RooCodeEventName["TaskTokenUsageUpdated"] = "taskTokenUsageUpdated"
	RooCodeEventName["TaskToolFailed"] = "taskToolFailed"
	// Configuration Changes
	RooCodeEventName["ModeChanged"] = "modeChanged"
	RooCodeEventName["ProviderProfileChanged"] = "providerProfileChanged"
	// Evals
	RooCodeEventName["EvalPass"] = "evalPass"
	RooCodeEventName["EvalFail"] = "evalFail"
})(RooCodeEventName || (exports.RooCodeEventName = RooCodeEventName = {}))
/**
 * RooCodeEvents
 */
exports.rooCodeEventsSchema = zod_1.z.object({
	[RooCodeEventName.TaskCreated]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskStarted]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskCompleted]: zod_1.z.tuple([
		zod_1.z.string(),
		message_js_1.tokenUsageSchema,
		tool_js_1.toolUsageSchema,
		zod_1.z.object({
			isSubtask: zod_1.z.boolean(),
		}),
	]),
	[RooCodeEventName.TaskAborted]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskFocused]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskUnfocused]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskActive]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskInteractive]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskResumable]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskIdle]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskPaused]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskUnpaused]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskSpawned]: zod_1.z.tuple([zod_1.z.string(), zod_1.z.string()]),
	[RooCodeEventName.Message]: zod_1.z.tuple([
		zod_1.z.object({
			taskId: zod_1.z.string(),
			action: zod_1.z.union([zod_1.z.literal("created"), zod_1.z.literal("updated")]),
			message: message_js_1.clineMessageSchema,
		}),
	]),
	[RooCodeEventName.TaskModeSwitched]: zod_1.z.tuple([zod_1.z.string(), zod_1.z.string()]),
	[RooCodeEventName.TaskAskResponded]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskUserMessage]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.TaskToolFailed]: zod_1.z.tuple([zod_1.z.string(), tool_js_1.toolNamesSchema, zod_1.z.string()]),
	[RooCodeEventName.TaskTokenUsageUpdated]: zod_1.z.tuple([zod_1.z.string(), message_js_1.tokenUsageSchema]),
	[RooCodeEventName.ModeChanged]: zod_1.z.tuple([zod_1.z.string()]),
	[RooCodeEventName.ProviderProfileChanged]: zod_1.z.tuple([
		zod_1.z.object({ name: zod_1.z.string(), provider: zod_1.z.string() }),
	]),
})
/**
 * TaskEvent
 */
exports.taskEventSchema = zod_1.z.discriminatedUnion("eventName", [
	// Task Provider Lifecycle
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskCreated),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskCreated],
		taskId: zod_1.z.number().optional(),
	}),
	// Task Lifecycle
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskStarted),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskStarted],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskCompleted),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskCompleted],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskAborted),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskAborted],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskFocused),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskFocused],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskUnfocused),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskUnfocused],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskActive),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskActive],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskInteractive),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskInteractive],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskResumable),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskResumable],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskIdle),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskIdle],
		taskId: zod_1.z.number().optional(),
	}),
	// Subtask Lifecycle
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskPaused),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskPaused],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskUnpaused),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskUnpaused],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskSpawned),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskSpawned],
		taskId: zod_1.z.number().optional(),
	}),
	// Task Execution
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.Message),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.Message],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskModeSwitched),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskModeSwitched],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskAskResponded),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskAskResponded],
		taskId: zod_1.z.number().optional(),
	}),
	// Task Analytics
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskToolFailed),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskToolFailed],
		taskId: zod_1.z.number().optional(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.TaskTokenUsageUpdated),
		payload: exports.rooCodeEventsSchema.shape[RooCodeEventName.TaskTokenUsageUpdated],
		taskId: zod_1.z.number().optional(),
	}),
	// Evals
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.EvalPass),
		payload: zod_1.z.undefined(),
		taskId: zod_1.z.number(),
	}),
	zod_1.z.object({
		eventName: zod_1.z.literal(RooCodeEventName.EvalFail),
		payload: zod_1.z.undefined(),
		taskId: zod_1.z.number(),
	}),
])
//# sourceMappingURL=events.js.map
