"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.ALWAYS_AVAILABLE_TOOLS = exports.TOOL_GROUPS = exports.TOOL_DISPLAY_NAMES = exports.toolParamNames = void 0
exports.toolParamNames = [
	"command",
	"path",
	"content",
	"line_count",
	"regex",
	"file_pattern",
	"recursive",
	"action",
	"url",
	"coordinate",
	"text",
	"server_name",
	"tool_name",
	"arguments",
	"uri",
	"question",
	"result",
	"diff",
	"mode_slug",
	"reason",
	"line",
	"mode",
	"message",
	"cwd",
	"follow_up",
	"task",
	"size",
	"search",
	"replace",
	"use_regex",
	"ignore_case",
	// kilocode_change start
	"title",
	"description",
	"target_file",
	"instructions",
	"code_edit",
	// kilocode_change end
	"args",
	"start_line",
	"end_line",
	"query",
	"args",
	"todos",
	"prompt",
	"image",
]
exports.TOOL_DISPLAY_NAMES = {
	execute_command: "run commands",
	read_file: "read files",
	fetch_instructions: "fetch instructions",
	write_to_file: "write files",
	apply_diff: "apply changes",
	edit_file: "edit file", // kilocode_change: Morph fast apply
	search_files: "search files",
	list_files: "list files",
	list_code_definition_names: "list definitions",
	browser_action: "use a browser",
	use_mcp_tool: "use mcp tools",
	access_mcp_resource: "access mcp resources",
	ask_followup_question: "ask questions",
	attempt_completion: "complete tasks",
	switch_mode: "switch modes",
	new_task: "create new task",
	insert_content: "insert content",
	search_and_replace: "search and replace",
	new_rule: "create new rule",
	report_bug: "report bug", // kilocode_change
	condense: "condense the current context window", // kilocode_change
	codebase_search: "codebase search",
	update_todo_list: "update todo list",
	run_slash_command: "run slash command",
	generate_image: "generate images",
}
// Define available tool groups.
exports.TOOL_GROUPS = {
	read: {
		tools: [
			"read_file",
			"fetch_instructions",
			"search_files",
			"list_files",
			"list_code_definition_names",
			"codebase_search",
		],
	},
	edit: {
		tools: [
			"apply_diff",
			"edit_file", // kilocode_change: Morph fast apply
			"write_to_file",
			"insert_content",
			"search_and_replace",
			"new_rule", // kilocode_change
			"generate_image",
		],
	},
	browser: {
		tools: ["browser_action"],
	},
	command: {
		tools: ["execute_command"],
	},
	mcp: {
		tools: ["use_mcp_tool", "access_mcp_resource"],
	},
	modes: {
		tools: ["switch_mode", "new_task"],
		alwaysAvailable: true,
	},
}
// Tools that are always available to all modes.
exports.ALWAYS_AVAILABLE_TOOLS = [
	"ask_followup_question",
	"attempt_completion",
	"switch_mode",
	"new_task",
	"report_bug",
	"condense", // kilocode_Change
	"update_todo_list",
	"run_slash_command",
]
//# sourceMappingURL=tools.js.map
