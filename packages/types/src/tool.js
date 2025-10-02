"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.toolUsageSchema =
	exports.toolNamesSchema =
	exports.toolNames =
	exports.toolGroupsSchema =
	exports.toolGroups =
		void 0
const zod_1 = require("zod")
/**
 * ToolGroup
 */
exports.toolGroups = ["read", "edit", "browser", "command", "mcp", "modes"]
exports.toolGroupsSchema = zod_1.z.enum(exports.toolGroups)
/**
 * ToolName
 */
exports.toolNames = [
	"execute_command",
	"read_file",
	"write_to_file",
	"apply_diff",
	"insert_content",
	"search_and_replace",
	"search_files",
	"list_files",
	"list_code_definition_names",
	"browser_action",
	"use_mcp_tool",
	"access_mcp_resource",
	"ask_followup_question",
	"attempt_completion",
	"switch_mode",
	"new_task",
	"fetch_instructions",
	"codebase_search",
	// kilocode_change start
	"edit_file",
	"new_rule",
	"report_bug",
	"condense",
	// kilocode_change end
	"update_todo_list",
	"run_slash_command",
	"generate_image",
]
exports.toolNamesSchema = zod_1.z.enum(exports.toolNames)
/**
 * ToolUsage
 */
exports.toolUsageSchema = zod_1.z.record(
	exports.toolNamesSchema,
	zod_1.z.object({
		attempts: zod_1.z.number(),
		failures: zod_1.z.number(),
	}),
)
//# sourceMappingURL=tool.js.map
