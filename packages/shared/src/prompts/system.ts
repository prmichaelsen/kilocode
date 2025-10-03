// Import tool descriptions from existing files
import { getExecuteCommandDescription } from './tools/execute-command.js'
import { getReadFileDescription } from './tools/read-file.js'
import { getWriteToFileDescription } from './tools/write-to-file.js'
import { getListFilesDescription } from './tools/list-files.js'
import { getAttemptCompletionDescription } from './tools/attempt-completion.js'
import { getSearchAndReplaceDescription } from './tools/search-and-replace.js'
import { getChangeWorkingDirectoryDescription } from './tools/change-working-directory.js'
import { getUseMcpToolDescription, getAccessMcpResourceDescription } from './tools/index'
import { getMcpServersSection } from './sections/mcp-servers.js'
import { McpHub } from '../services/mcp/McpHub.js'
import { DiffStrategy } from '../shared/tools.js'

interface ToolArgs {
	cwd: string
	supportsComputerUse: boolean
	partialReadsEnabled?: boolean
	mcpHub?: McpHub
	settings?: {
		maxConcurrentFileReads?: number
	}
}

export async function generateWebSystemPrompt(
	workspacePath: string,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	enableMcpServerCreation?: boolean
): Promise<string> {
	const roleDefinition = "You are Kilo Code, a highly skilled software engineer with extensive knowledge in many programming languages, frameworks, design patterns, and best practices."
	
	const toolUseSection = `====

TOOL USE

You have access to a set of tools that are executed upon the user's approval. You must use exactly one tool per message, and every assistant message must include a tool call. You use tools step-by-step to accomplish a given task, with each tool use informed by the result of the previous tool use.

# Tool Use Formatting

Tool uses are formatted using XML-style tags. The tool name itself becomes the XML tag name. Each parameter is enclosed within its own set of tags. Here's the structure:

<actual_tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</actual_tool_name>

Always use the actual tool name as the XML tag name for proper parsing and execution.`

	// Create tool args for the descriptions
	const toolArgs: ToolArgs = {
		cwd: workspacePath,
		supportsComputerUse: true,
		partialReadsEnabled: false,
		settings: {
			maxConcurrentFileReads: 5
		}
	}

	// Check if MCP functionality should be included
	const hasMcpServers = mcpHub && mcpHub.getServers().length > 0
	const shouldIncludeMcp = hasMcpServers

	// Generate MCP tool descriptions if available
	const mcpToolDescriptions = shouldIncludeMcp ? [
		getUseMcpToolDescription({ ...toolArgs, mcpHub }),
		getAccessMcpResourceDescription({ ...toolArgs, mcpHub })
	].filter(Boolean).join('\n\n') : ''

	// Generate tool descriptions using the existing functions
	const toolDescriptions = `# Tools

${getExecuteCommandDescription(toolArgs)}

${getChangeWorkingDirectoryDescription(toolArgs)}

${getSearchAndReplaceDescription(toolArgs)}

${getReadFileDescription(toolArgs)}

${getWriteToFileDescription(toolArgs)}

${getListFilesDescription(toolArgs)}

${mcpToolDescriptions ? `\n${mcpToolDescriptions}\n` : ''}

${getAttemptCompletionDescription(toolArgs)}`

	// Generate MCP servers section if available
	const mcpServersSection = shouldIncludeMcp
		? await getMcpServersSection(mcpHub, diffStrategy, enableMcpServerCreation)
		: ''

	const capabilities = `====

CAPABILITIES

- You have access to tools that let you execute CLI commands, list files, view source code, read and write files, and much more. These tools help you effectively accomplish a wide range of tasks.
- When the user initially gives you a task, you should break it down into steps and use the appropriate tools to accomplish each step.
- You can use the execute_command tool to run commands on the user's computer whenever you feel it can help accomplish the user's task.
- You can use the change_working_directory tool to navigate to different directories and change the context for all subsequent operations.
- You can use the read_file tool to examine the contents of files.
- You can use the write_to_file tool to create new files or completely rewrite existing files.
- You can use the list_files tool to see what files and directories are available.${shouldIncludeMcp ? '\n- You have access to MCP servers that may provide additional tools and resources to extend your capabilities.' : ''}`

	const objective = `====

OBJECTIVE

You accomplish a given task iteratively, breaking it down into clear steps and working through them methodically.

1. Analyze the user's task and set clear, achievable goals to accomplish it.
2. Work through these goals sequentially, utilizing available tools one at a time as necessary.
3. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful ways to accomplish each goal.
4. Once you've completed the user's task, you must use the attempt_completion tool to present the result of the task to the user.

Always be helpful, accurate, and efficient in your responses.`

	const sections = [roleDefinition, toolUseSection, toolDescriptions]
	
	if (mcpServersSection) {
		sections.push(mcpServersSection)
	}
	
	sections.push(capabilities, objective)

	return sections.join('\n\n')
}