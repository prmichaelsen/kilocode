"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.queuedMessageSchema =
	exports.tokenUsageSchema =
	exports.clineMessageSchema =
	exports.contextCondenseSchema =
	exports.toolProgressStatusSchema =
	exports.clineSaySchema =
	exports.clineSays =
	exports.interactiveAsks =
	exports.resumableAsks =
	exports.idleAsks =
	exports.clineAskSchema =
	exports.clineAsks =
		void 0
exports.isIdleAsk = isIdleAsk
exports.isResumableAsk = isResumableAsk
exports.isInteractiveAsk = isInteractiveAsk
const zod_1 = require("zod")
const kilocode_js_1 = require("./kilocode.js")
/**
 * ClineAsk
 */
/**
 * Array of possible ask types that the LLM can use to request user interaction or approval.
 * These represent different scenarios where the assistant needs user input to proceed.
 *
 * @constant
 * @readonly
 *
 * Ask type descriptions:
 * - `followup`: LLM asks a clarifying question to gather more information needed to complete the task
 * - `command`: Permission to execute a terminal/shell command
 * - `command_output`: Permission to read the output from a previously executed command
 * - `completion_result`: Task has been completed, awaiting user feedback or a new task
 * - `tool`: Permission to use a tool for file operations (read, write, search, etc.)
 * - `api_req_failed`: API request failed, asking user whether to retry
 * - `resume_task`: Confirmation needed to resume a previously paused task
 * - `resume_completed_task`: Confirmation needed to resume a task that was already marked as completed
 * - `mistake_limit_reached`: Too many errors encountered, needs user guidance on how to proceed
 * - `browser_action_launch`: Permission to open or interact with a browser
 * - `use_mcp_server`: Permission to use Model Context Protocol (MCP) server functionality
 * - `auto_approval_max_req_reached`: Auto-approval limit has been reached, manual approval required
 */
exports.clineAsks = [
	"followup",
	"command",
	"command_output",
	"completion_result",
	"tool",
	"api_req_failed",
	"resume_task",
	"resume_completed_task",
	"mistake_limit_reached",
	"browser_action_launch",
	"use_mcp_server",
	"auto_approval_max_req_reached",
	// kilocode_change start
	"payment_required_prompt", // Added for the low credits dialog
	"invalid_model",
	"report_bug",
	"condense",
	// kilocode_change end
]
exports.clineAskSchema = zod_1.z.enum(exports.clineAsks)
// Needs classification:
// - `followup`
// - `command_output
/**
 * IdleAsk
 *
 * Asks that put the task into an "idle" state.
 */
exports.idleAsks = [
	"completion_result",
	"api_req_failed",
	"resume_completed_task",
	"mistake_limit_reached",
	"auto_approval_max_req_reached",
]
function isIdleAsk(ask) {
	return exports.idleAsks.includes(ask)
}
/**
 * ResumableAsk
 *
 * Asks that put the task into an "resumable" state.
 */
exports.resumableAsks = ["resume_task"]
function isResumableAsk(ask) {
	return exports.resumableAsks.includes(ask)
}
/**
 * InteractiveAsk
 *
 * Asks that put the task into an "user interaction required" state.
 */
exports.interactiveAsks = ["followup", "command", "tool", "browser_action_launch", "use_mcp_server"]
function isInteractiveAsk(ask) {
	return exports.interactiveAsks.includes(ask)
}
/**
 * ClineSay
 */
/**
 * Array of possible say types that represent different kinds of messages the assistant can send.
 * These are used to categorize and handle various types of communication from the LLM to the user.
 *
 * @constant
 * @readonly
 *
 * Say type descriptions:
 * - `error`: General error message
 * - `api_req_started`: Indicates an API request has been initiated
 * - `api_req_finished`: Indicates an API request has completed successfully
 * - `api_req_retried`: Indicates an API request is being retried after a failure
 * - `api_req_retry_delayed`: Indicates an API request retry has been delayed
 * - `api_req_deleted`: Indicates an API request has been deleted/cancelled
 * - `text`: General text message or assistant response
 * - `reasoning`: Assistant's reasoning or thought process (often hidden from user)
 * - `completion_result`: Final result of task completion
 * - `user_feedback`: Message containing user feedback
 * - `user_feedback_diff`: Diff-formatted feedback from user showing requested changes
 * - `command_output`: Output from an executed command
 * - `shell_integration_warning`: Warning about shell integration issues or limitations
 * - `browser_action`: Action performed in the browser
 * - `browser_action_result`: Result of a browser action
 * - `mcp_server_request_started`: MCP server request has been initiated
 * - `mcp_server_response`: Response received from MCP server
 * - `subtask_result`: Result of a completed subtask
 * - `checkpoint_saved`: Indicates a checkpoint has been saved
 * - `rooignore_error`: Error related to .rooignore file processing
 * - `diff_error`: Error occurred while applying a diff/patch
 * - `condense_context`: Context condensation/summarization has started
 * - `condense_context_error`: Error occurred during context condensation
 * - `codebase_search_result`: Results from searching the codebase
 */
exports.clineSays = [
	"error",
	"api_req_started",
	"api_req_finished",
	"api_req_retried",
	"api_req_retry_delayed",
	"api_req_deleted",
	"text",
	"image",
	"reasoning",
	"completion_result",
	"user_feedback",
	"user_feedback_diff",
	"command_output",
	"shell_integration_warning",
	"browser_action",
	"browser_action_result",
	"mcp_server_request_started",
	"mcp_server_response",
	"subtask_result",
	"checkpoint_saved",
	"rooignore_error",
	"diff_error",
	"condense_context",
	"condense_context_error",
	"codebase_search_result",
	"user_edit_todos",
]
exports.clineSaySchema = zod_1.z.enum(exports.clineSays)
/**
 * ToolProgressStatus
 */
exports.toolProgressStatusSchema = zod_1.z.object({
	icon: zod_1.z.string().optional(),
	text: zod_1.z.string().optional(),
})
/**
 * ContextCondense
 */
exports.contextCondenseSchema = zod_1.z.object({
	cost: zod_1.z.number(),
	prevContextTokens: zod_1.z.number(),
	newContextTokens: zod_1.z.number(),
	summary: zod_1.z.string(),
})
/**
 * ClineMessage
 */
exports.clineMessageSchema = zod_1.z.object({
	ts: zod_1.z.number(),
	type: zod_1.z.union([zod_1.z.literal("ask"), zod_1.z.literal("say")]),
	ask: exports.clineAskSchema.optional(),
	say: exports.clineSaySchema.optional(),
	text: zod_1.z.string().optional(),
	images: zod_1.z.array(zod_1.z.string()).optional(),
	partial: zod_1.z.boolean().optional(),
	reasoning: zod_1.z.string().optional(),
	conversationHistoryIndex: zod_1.z.number().optional(),
	checkpoint: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
	progressStatus: exports.toolProgressStatusSchema.optional(),
	contextCondense: exports.contextCondenseSchema.optional(),
	isProtected: zod_1.z.boolean().optional(),
	apiProtocol: zod_1.z.union([zod_1.z.literal("openai"), zod_1.z.literal("anthropic")]).optional(),
	isAnswered: zod_1.z.boolean().optional(),
	metadata: zod_1.z
		.object({
			gpt5: zod_1.z
				.object({
					previous_response_id: zod_1.z.string().optional(),
					instructions: zod_1.z.string().optional(),
					reasoning_summary: zod_1.z.string().optional(),
				})
				.optional(),
			kiloCode: kilocode_js_1.kiloCodeMetaDataSchema.optional(),
		})
		.optional(),
})
/**
 * TokenUsage
 */
exports.tokenUsageSchema = zod_1.z.object({
	totalTokensIn: zod_1.z.number(),
	totalTokensOut: zod_1.z.number(),
	totalCacheWrites: zod_1.z.number().optional(),
	totalCacheReads: zod_1.z.number().optional(),
	totalCost: zod_1.z.number(),
	contextTokens: zod_1.z.number(),
})
/**
 * QueuedMessage
 */
exports.queuedMessageSchema = zod_1.z.object({
	timestamp: zod_1.z.number(),
	id: zod_1.z.string(),
	text: zod_1.z.string(),
	images: zod_1.z.array(zod_1.z.string()).optional(),
})
//# sourceMappingURL=message.js.map
