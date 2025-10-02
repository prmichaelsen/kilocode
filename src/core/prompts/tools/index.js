"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.getGenerateImageDescription =
	exports.getRunSlashCommandDescription =
	exports.getCodebaseSearchDescription =
	exports.getEditFileDescription =
	exports.getSearchAndReplaceDescription =
	exports.getInsertContentDescription =
	exports.getSwitchModeDescription =
	exports.getAccessMcpResourceDescription =
	exports.getUseMcpToolDescription =
	exports.getAttemptCompletionDescription =
	exports.getAskFollowupQuestionDescription =
	exports.getBrowserActionDescription =
	exports.getListCodeDefinitionNamesDescription =
	exports.getListFilesDescription =
	exports.getSearchFilesDescription =
	exports.getWriteToFileDescription =
	exports.getFetchInstructionsDescription =
	exports.getSimpleReadFileDescription =
	exports.getReadFileDescription =
	exports.getExecuteCommandDescription =
		void 0
exports.getToolDescriptionsForMode = getToolDescriptionsForMode
const tools_1 = require("../../../shared/tools")
const modes_1 = require("../../../shared/modes")
const execute_command_1 = require("./execute-command")
Object.defineProperty(exports, "getExecuteCommandDescription", {
	enumerable: true,
	get: function () {
		return execute_command_1.getExecuteCommandDescription
	},
})
const read_file_1 = require("./read-file")
Object.defineProperty(exports, "getReadFileDescription", {
	enumerable: true,
	get: function () {
		return read_file_1.getReadFileDescription
	},
})
const simple_read_file_1 = require("./simple-read-file")
Object.defineProperty(exports, "getSimpleReadFileDescription", {
	enumerable: true,
	get: function () {
		return simple_read_file_1.getSimpleReadFileDescription
	},
})
const fetch_instructions_1 = require("./fetch-instructions")
Object.defineProperty(exports, "getFetchInstructionsDescription", {
	enumerable: true,
	get: function () {
		return fetch_instructions_1.getFetchInstructionsDescription
	},
})
const types_1 = require("@roo-code/types")
const write_to_file_1 = require("./write-to-file")
Object.defineProperty(exports, "getWriteToFileDescription", {
	enumerable: true,
	get: function () {
		return write_to_file_1.getWriteToFileDescription
	},
})
const search_files_1 = require("./search-files")
Object.defineProperty(exports, "getSearchFilesDescription", {
	enumerable: true,
	get: function () {
		return search_files_1.getSearchFilesDescription
	},
})
const list_files_1 = require("./list-files")
Object.defineProperty(exports, "getListFilesDescription", {
	enumerable: true,
	get: function () {
		return list_files_1.getListFilesDescription
	},
})
const insert_content_1 = require("./insert-content")
Object.defineProperty(exports, "getInsertContentDescription", {
	enumerable: true,
	get: function () {
		return insert_content_1.getInsertContentDescription
	},
})
const search_and_replace_1 = require("./search-and-replace")
Object.defineProperty(exports, "getSearchAndReplaceDescription", {
	enumerable: true,
	get: function () {
		return search_and_replace_1.getSearchAndReplaceDescription
	},
})
const list_code_definition_names_1 = require("./list-code-definition-names")
Object.defineProperty(exports, "getListCodeDefinitionNamesDescription", {
	enumerable: true,
	get: function () {
		return list_code_definition_names_1.getListCodeDefinitionNamesDescription
	},
})
const browser_action_1 = require("./browser-action")
Object.defineProperty(exports, "getBrowserActionDescription", {
	enumerable: true,
	get: function () {
		return browser_action_1.getBrowserActionDescription
	},
})
const ask_followup_question_1 = require("./ask-followup-question")
Object.defineProperty(exports, "getAskFollowupQuestionDescription", {
	enumerable: true,
	get: function () {
		return ask_followup_question_1.getAskFollowupQuestionDescription
	},
})
const attempt_completion_1 = require("./attempt-completion")
Object.defineProperty(exports, "getAttemptCompletionDescription", {
	enumerable: true,
	get: function () {
		return attempt_completion_1.getAttemptCompletionDescription
	},
})
const use_mcp_tool_1 = require("./use-mcp-tool")
Object.defineProperty(exports, "getUseMcpToolDescription", {
	enumerable: true,
	get: function () {
		return use_mcp_tool_1.getUseMcpToolDescription
	},
})
const access_mcp_resource_1 = require("./access-mcp-resource")
Object.defineProperty(exports, "getAccessMcpResourceDescription", {
	enumerable: true,
	get: function () {
		return access_mcp_resource_1.getAccessMcpResourceDescription
	},
})
const switch_mode_1 = require("./switch-mode")
Object.defineProperty(exports, "getSwitchModeDescription", {
	enumerable: true,
	get: function () {
		return switch_mode_1.getSwitchModeDescription
	},
})
const new_task_1 = require("./new-task")
const codebase_search_1 = require("./codebase-search")
Object.defineProperty(exports, "getCodebaseSearchDescription", {
	enumerable: true,
	get: function () {
		return codebase_search_1.getCodebaseSearchDescription
	},
})
const update_todo_list_1 = require("./update-todo-list")
const run_slash_command_1 = require("./run-slash-command")
Object.defineProperty(exports, "getRunSlashCommandDescription", {
	enumerable: true,
	get: function () {
		return run_slash_command_1.getRunSlashCommandDescription
	},
})
const generate_image_1 = require("./generate-image")
Object.defineProperty(exports, "getGenerateImageDescription", {
	enumerable: true,
	get: function () {
		return generate_image_1.getGenerateImageDescription
	},
})
// kilocode_change start: Morph fast apply
const editFileTool_1 = require("../../tools/editFileTool")
const edit_file_1 = require("./edit-file")
Object.defineProperty(exports, "getEditFileDescription", {
	enumerable: true,
	get: function () {
		return edit_file_1.getEditFileDescription
	},
})
// kilocode_change end
// Map of tool names to their description functions
const toolDescriptionMap = {
	execute_command: (args) => (0, execute_command_1.getExecuteCommandDescription)(args),
	read_file: (args) => {
		// Check if the current model should use the simplified read_file tool
		const modelId = args.settings?.modelId
		if (modelId && (0, types_1.shouldUseSingleFileRead)(modelId)) {
			return (0, simple_read_file_1.getSimpleReadFileDescription)(args)
		}
		return (0, read_file_1.getReadFileDescription)(args)
	},
	fetch_instructions: (args) =>
		(0, fetch_instructions_1.getFetchInstructionsDescription)(args.settings?.enableMcpServerCreation),
	write_to_file: (args) => (0, write_to_file_1.getWriteToFileDescription)(args),
	search_files: (args) => (0, search_files_1.getSearchFilesDescription)(args),
	list_files: (args) => (0, list_files_1.getListFilesDescription)(args),
	list_code_definition_names: (args) => (0, list_code_definition_names_1.getListCodeDefinitionNamesDescription)(args),
	browser_action: (args) => (0, browser_action_1.getBrowserActionDescription)(args),
	ask_followup_question: () => (0, ask_followup_question_1.getAskFollowupQuestionDescription)(),
	attempt_completion: (args) => (0, attempt_completion_1.getAttemptCompletionDescription)(args),
	use_mcp_tool: (args) => (0, use_mcp_tool_1.getUseMcpToolDescription)(args),
	access_mcp_resource: (args) => (0, access_mcp_resource_1.getAccessMcpResourceDescription)(args),
	codebase_search: (args) => (0, codebase_search_1.getCodebaseSearchDescription)(args),
	switch_mode: () => (0, switch_mode_1.getSwitchModeDescription)(),
	new_task: (args) => (0, new_task_1.getNewTaskDescription)(args),
	insert_content: (args) => (0, insert_content_1.getInsertContentDescription)(args),
	search_and_replace: (args) => (0, search_and_replace_1.getSearchAndReplaceDescription)(args),
	edit_file: () => (0, edit_file_1.getEditFileDescription)(), // kilocode_change: Morph fast apply
	apply_diff: (args) =>
		args.diffStrategy ? args.diffStrategy.getToolDescription({ cwd: args.cwd, toolOptions: args.toolOptions }) : "",
	update_todo_list: (args) => (0, update_todo_list_1.getUpdateTodoListDescription)(args),
	run_slash_command: () => (0, run_slash_command_1.getRunSlashCommandDescription)(),
	generate_image: (args) => (0, generate_image_1.getGenerateImageDescription)(args),
}
function getToolDescriptionsForMode(
	mode,
	cwd,
	supportsComputerUse,
	codeIndexManager,
	diffStrategy,
	browserViewportSize,
	mcpHub,
	customModes,
	experiments,
	partialReadsEnabled,
	settings,
	enableMcpServerCreation,
	modelId,
	clineProviderState,
) {
	const config = (0, modes_1.getModeConfig)(mode, customModes)
	const args = {
		cwd,
		supportsComputerUse,
		diffStrategy,
		browserViewportSize,
		mcpHub,
		partialReadsEnabled,
		settings: {
			...settings,
			enableMcpServerCreation,
			modelId,
		},
		experiments,
	}
	const tools = new Set()
	// Add tools from mode's groups
	config.groups.forEach((groupEntry) => {
		const groupName = (0, modes_1.getGroupName)(groupEntry)
		const toolGroup = tools_1.TOOL_GROUPS[groupName]
		if (toolGroup) {
			toolGroup.tools.forEach((tool) => {
				if (
					(0, modes_1.isToolAllowedForMode)(
						tool,
						mode,
						customModes ?? [],
						undefined,
						undefined,
						experiments ?? {},
					)
				) {
					tools.add(tool)
				}
			})
		}
	})
	// Add always available tools
	tools_1.ALWAYS_AVAILABLE_TOOLS.forEach((tool) => tools.add(tool))
	// Conditionally exclude codebase_search if feature is disabled or not configured
	if (
		!codeIndexManager ||
		!(codeIndexManager.isFeatureEnabled && codeIndexManager.isFeatureConfigured && codeIndexManager.isInitialized)
	) {
		tools.delete("codebase_search")
	}
	// kilocode_change start: Morph fast apply
	if ((0, editFileTool_1.isFastApplyAvailable)(clineProviderState)) {
		// When Morph is enabled, disable traditional editing tools
		const traditionalEditingTools = ["apply_diff", "write_to_file", "insert_content", "search_and_replace"]
		traditionalEditingTools.forEach((tool) => tools.delete(tool))
	} else {
		tools.delete("edit_file")
	}
	// kilocode_change end
	// Conditionally exclude update_todo_list if disabled in settings
	if (settings?.todoListEnabled === false) {
		tools.delete("update_todo_list")
	}
	// Conditionally exclude generate_image if experiment is not enabled
	if (!experiments?.imageGeneration) {
		tools.delete("generate_image")
	}
	// Conditionally exclude run_slash_command if experiment is not enabled
	if (!experiments?.runSlashCommand) {
		tools.delete("run_slash_command")
	}
	// Map tool descriptions for allowed tools
	const descriptions = Array.from(tools).map((toolName) => {
		const descriptionFn = toolDescriptionMap[toolName]
		if (!descriptionFn) {
			return undefined
		}
		return descriptionFn({
			...args,
			toolOptions: undefined, // No tool options in group-based approach
		})
	})
	return `# Tools\n\n${descriptions.filter(Boolean).join("\n\n")}`
}
//# sourceMappingURL=index.js.map
