import { NodeFileSystemAdapter } from './FileSystemAdapter'
import { NodeTerminalAdapter } from './TerminalAdapter'

interface ToolUse {
	name: string
	params: Record<string, string>
}

export class WebToolExecutor {
	private fileSystem: NodeFileSystemAdapter
	private terminal: NodeTerminalAdapter

	constructor(fileSystem: NodeFileSystemAdapter, terminal: NodeTerminalAdapter) {
		this.fileSystem = fileSystem
		this.terminal = terminal
	}

	async executeTools(message: string): Promise<string> {
		const tools = this.parseToolsFromMessage(message)
		let results: string[] = []

		for (const tool of tools) {
			try {
				const result = await this.executeTool(tool)
				results.push(result)
			} catch (error) {
				const errorMsg = `Error executing ${tool.name}: ${error instanceof Error ? error.message : String(error)}`
				console.error('[ToolExecutor]', errorMsg)
				results.push(errorMsg)
			}
		}

		return results.join('\n\n')
	}

	private parseToolsFromMessage(message: string): ToolUse[] {
		const tools: ToolUse[] = []
		
		// Parse XML tool tags from the message
		const toolPatterns = [
			{ name: 'read_file', regex: /<read_file>(.*?)<\/read_file>/gs },
			{ name: 'write_to_file', regex: /<write_to_file>(.*?)<\/write_to_file>/gs },
			{ name: 'list_files', regex: /<list_files>(.*?)<\/list_files>/gs },
			{ name: 'execute_command', regex: /<execute_command>(.*?)<\/execute_command>/gs },
			{ name: 'attempt_completion', regex: /<attempt_completion>(.*?)<\/attempt_completion>/gs },
		]

		for (const pattern of toolPatterns) {
			const matches = [...message.matchAll(pattern.regex)]
			for (const match of matches) {
				const params = this.parseToolParams(match[1])
				tools.push({
					name: pattern.name,
					params
				})
			}
		}

		return tools
	}

	private parseToolParams(content: string): Record<string, string> {
		const params: Record<string, string> = {}
		
		// Parse XML parameters like <path>...</path>, <command>...</command>, etc.
		const paramRegex = /<(\w+)>(.*?)<\/\1>/gs
		const matches = [...content.matchAll(paramRegex)]
		
		for (const match of matches) {
			const [, paramName, paramValue] = match
			params[paramName] = paramValue.trim()
		}

		return params
	}

	private async executeTool(tool: ToolUse): Promise<string> {
		console.log(`[ToolExecutor] Executing tool: ${tool.name}`, tool.params)

		switch (tool.name) {
			case 'read_file':
				return await this.executeReadFile(tool.params)
			
			case 'write_to_file':
				return await this.executeWriteToFile(tool.params)
			
			case 'list_files':
				return await this.executeListFiles(tool.params)
			
			case 'execute_command':
				return await this.executeCommand(tool.params)
			
			case 'attempt_completion':
				return await this.executeAttemptCompletion(tool.params)
			
			default:
				return `Unknown tool: ${tool.name}`
		}
	}

	private async executeReadFile(params: Record<string, string>): Promise<string> {
		const { path } = params
		if (!path) {
			return 'Error: path parameter is required for read_file'
		}

		try {
			const content = await this.fileSystem.readFile(path)
			return `File: ${path}\n\`\`\`\n${content}\n\`\`\``
		} catch (error) {
			return `Error reading file ${path}: ${error instanceof Error ? error.message : String(error)}`
		}
	}

	private async executeWriteToFile(params: Record<string, string>): Promise<string> {
		const { path, content } = params
		if (!path || content === undefined) {
			return 'Error: path and content parameters are required for write_to_file'
		}

		try {
			await this.fileSystem.writeFile(path, content)
			return `Successfully wrote to file: ${path}`
		} catch (error) {
			return `Error writing file ${path}: ${error instanceof Error ? error.message : String(error)}`
		}
	}

	private async executeListFiles(params: Record<string, string>): Promise<string> {
		const { path = '.', recursive = 'false' } = params
		
		try {
			if (recursive.toLowerCase() === 'true') {
				const files = await this.fileSystem.listFilesRecursive(path, 3)
				return `Files in ${path} (recursive):\n${files.join('\n')}`
			} else {
				const files = await this.fileSystem.readDirectory(path)
				return `Files in ${path}:\n${files.join('\n')}`
			}
		} catch (error) {
			return `Error listing files in ${path}: ${error instanceof Error ? error.message : String(error)}`
		}
	}

	private async executeCommand(params: Record<string, string>): Promise<string> {
		const { command, cwd } = params
		if (!command) {
			return 'Error: command parameter is required for execute_command'
		}

		try {
			const result = await this.terminal.executeCommand(command, cwd)
			let output = `Command: ${command}\n`
			
			if (result.stdout) {
				output += `\nOutput:\n${result.stdout}`
			}
			
			if (result.stderr) {
				output += `\nError Output:\n${result.stderr}`
			}
			
			output += `\nExit Code: ${result.exitCode}`
			
			return output
		} catch (error) {
			return `Error executing command "${command}": ${error instanceof Error ? error.message : String(error)}`
		}
	}

	private async executeAttemptCompletion(params: Record<string, string>): Promise<string> {
		const { result = 'Task completed successfully' } = params
		return `Task Completion: ${result}`
	}
}