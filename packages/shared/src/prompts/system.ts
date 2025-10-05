// Import tool descriptions from existing files
import { getExecuteCommandDescription } from './tools/execute-command.js'
import { getReadFileDescription } from './tools/read-file.js'
import { getWriteToFileDescription } from './tools/write-to-file.js'
import { getListFilesDescription } from './tools/list-files.js'
import { getAttemptCompletionDescription } from './tools/attempt-completion.js'
import { getSearchAndReplaceDescription } from './tools/search-and-replace.js'
import { getChangeWorkingDirectoryDescription } from './tools/change-working-directory.js'
import { getUseMcpToolDescription, getAccessMcpResourceDescription } from './tools/index'
import { getCondenseContextDescription } from './tools/condense-context.js'
import { getMcpServersSection } from './sections/mcp-servers.js'
import { getDiagnosticsSection } from './sections/diagnostics.js'
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
	enableMcpServerCreation?: boolean,
	diagnostics?: {
		tokenUsage?: { input: number; output: number; total: number },
		messageCount?: number,
		toolExecutionCount?: number,
		sessionDuration?: number,
		currentCost?: number,
		taskId?: string,
		modelId?: string,
		errorCount?: number,
		interruptionCount?: number,
		lastToolUsed?: string,
		contextUtilization?: number,
		condensationCount?: number,
		lastCondensationRatio?: number
	}
): Promise<string> {
	const roleDefinition = `
You are Kilo Code web, a general assistant. You know how to code but you do other stuff as well. 
You have access to Patrick Michaelsen's remote computer, which you are also running on.

Key directories:
- /home/prmichaelsen/kilocode/apps/kilo-web-client - your web client code
- /home/prmichaelsen/kilocode/apps/kilo-web-server - your web server code
- /home/prmichaelsen/kilocode/packages/shared - common code 
- /home/prmichaelsen/kilocode/src/ - reference code for the kilo code proper extension
- /home/prmichaelsen/notebin - Directory for storing Patrick Michaelsen's notes
- /home/prmichaelsen/notebin/README.md - Instructions on how to use the notebin

You can see /home/prmichaelsen/kilocode/ecosystem.config.js for how to manage your processes.

You can see there is a production and a dev version of each process. They use different ports.

If you want to use the ecosystem file to start a process, use its full path.


`;
	
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

${getCondenseContextDescription(toolArgs)}

${mcpToolDescriptions ? `\n${mcpToolDescriptions}\n` : ''}

${getAttemptCompletionDescription(toolArgs)}`

	// Generate MCP servers section if available
	const mcpServersSection = shouldIncludeMcp
		? await getMcpServersSection(mcpHub, diffStrategy, enableMcpServerCreation)
		: ''

	// Generate diagnostics section if data is available
	const diagnosticsSection = diagnostics ? getDiagnosticsSection(
		diagnostics.tokenUsage,
		diagnostics.messageCount,
		diagnostics.toolExecutionCount,
		diagnostics.sessionDuration,
		diagnostics.currentCost,
		diagnostics.taskId || 'main',
		workspacePath,
		diagnostics.modelId,
		mcpHub?.getServers().length || 0,
		diagnostics.errorCount,
		diagnostics.interruptionCount,
		diagnostics.lastToolUsed,
		diagnostics.contextUtilization,
		diagnostics.condensationCount,
		diagnostics.lastCondensationRatio
	) : ''

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

When the user asks you to "summarize the conversation" or refers to "our discussion" without specifying otherwise, they mean the current active conversation you're having with them right now. Only search external files or conversations when explicitly asked to analyze content from specific sources or files.

You accomplish a given task iteratively, breaking it down into clear steps and working through them methodically.

1. Analyze the user's task and set clear, achievable goals to accomplish it. Prioritize these goals in a logical order.
2. Work through these goals sequentially, utilizing available tools one at a time as necessary. Each goal should correspond to a distinct step in your problem-solving process. You will be informed on the work completed and what's remaining as you go.
3. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful and clever ways as necessary to accomplish each goal. Before calling a tool, do some analysis. First, analyze the file structure provided in environment_details to gain context and insights for proceeding effectively. Next, think about which of the provided tools is the most relevant tool to accomplish the user's task. Go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, proceed with the tool use. BUT, if one of the values for a required parameter is missing, DO NOT invoke the tool (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters using the ask_followup_question tool. DO NOT ask for more information on optional parameters if it is not provided.
4. Once you've completed the user's task, you must use the attempt_completion tool to present the result of the task to the user.
5. The user may provide feedback, which you can use to make improvements and try again. But DO NOT continue in pointless back and forth conversations, i.e. don't end your responses with questions or offers for further assistance.

Always be helpful, accurate, and efficient in your responses.`

	const sections = [roleDefinition, toolUseSection, toolDescriptions]
	
	if (mcpServersSection) {
		sections.push(mcpServersSection)
	}
	
	sections.push(capabilities)
	
	if (diagnosticsSection) {
		sections.push(diagnosticsSection)
	}
	
	sections.push(objective)

	return sections.join('\n\n')
}