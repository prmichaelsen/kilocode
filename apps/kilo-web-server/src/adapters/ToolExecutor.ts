import { NodeFileSystemAdapter } from './FileSystemAdapter'
import { NodeTerminalAdapter } from './TerminalAdapter'

// Copy the exact types and parsing logic from the main extension
type ToolName = 'execute_command' | 'read_file' | 'write_to_file' | 'list_files' | 'attempt_completion'

type ToolParamName = 'command' | 'path' | 'content' | 'line_count' | 'recursive' | 'result'

const toolNames: ToolName[] = ['execute_command', 'read_file', 'write_to_file', 'list_files', 'attempt_completion']
const toolParamNames: ToolParamName[] = ['command', 'path', 'content', 'line_count', 'recursive', 'result']

interface ToolUse {
	type: "tool_use"
	name: ToolName
	params: Partial<Record<ToolParamName, string>>
	partial: boolean
}

interface TextContent {
	type: "text"
	content: string
	partial: boolean
}

type AssistantMessageContent = TextContent | ToolUse

/**
 * Parser for assistant messages - copied from main extension
 * Maintains state between chunks to avoid reprocessing the entire message on each update.
 */
class AssistantMessageParser {
	private contentBlocks: AssistantMessageContent[] = []
	private currentTextContent: TextContent | undefined = undefined
	private currentTextContentStartIndex = 0
	private currentToolUse: ToolUse | undefined = undefined
	private currentToolUseStartIndex = 0
	private currentParamName: ToolParamName | undefined = undefined
	private currentParamValueStartIndex = 0
	private readonly MAX_ACCUMULATOR_SIZE = 1024 * 1024 // 1MB limit
	private readonly MAX_PARAM_LENGTH = 1024 * 100 // 100KB per parameter limit
	private accumulator = ""

	constructor() {
		this.reset()
	}

	public reset(): void {
		this.contentBlocks = []
		this.currentTextContent = undefined
		this.currentTextContentStartIndex = 0
		this.currentToolUse = undefined
		this.currentToolUseStartIndex = 0
		this.currentParamName = undefined
		this.currentParamValueStartIndex = 0
		this.accumulator = ""
	}

	public getContentBlocks(): AssistantMessageContent[] {
		return this.contentBlocks.slice()
	}

	public processChunk(chunk: string): AssistantMessageContent[] {
		if (this.accumulator.length + chunk.length > this.MAX_ACCUMULATOR_SIZE) {
			throw new Error("Assistant message exceeds maximum allowed size")
		}
		
		const accumulatorStartLength = this.accumulator.length

		for (let i = 0; i < chunk.length; i++) {
			const char = chunk[i]
			this.accumulator += char
			const currentPosition = accumulatorStartLength + i

			// Handle parameter parsing
			if (this.currentToolUse && this.currentParamName) {
				const currentParamValue = this.accumulator.slice(this.currentParamValueStartIndex)
				if (currentParamValue.length > this.MAX_PARAM_LENGTH) {
					this.currentParamName = undefined
					this.currentParamValueStartIndex = 0
					continue
				}
				const paramClosingTag = `</${this.currentParamName}>`
				
				if (currentParamValue.endsWith(paramClosingTag)) {
					// End of param value
					const paramValue = currentParamValue.slice(0, -paramClosingTag.length)
					this.currentToolUse.params[this.currentParamName] =
						this.currentParamName === "content"
							? paramValue.replace(/^\n/, "").replace(/\n$/, "")
							: paramValue.trim()
					this.currentParamName = undefined
					continue
				} else {
					// Partial param value is accumulating
					this.currentToolUse.params[this.currentParamName] = currentParamValue
					continue
				}
			}

			// Handle tool use parsing
			if (this.currentToolUse) {
				const currentToolValue = this.accumulator.slice(this.currentToolUseStartIndex)
				const toolUseClosingTag = `</${this.currentToolUse.name}>`
				if (currentToolValue.endsWith(toolUseClosingTag)) {
					// End of a tool use
					this.currentToolUse.partial = false
					this.currentToolUse = undefined
					continue
				} else {
					const possibleParamOpeningTags = toolParamNames.map((name) => `<${name}>`)
					for (const paramOpeningTag of possibleParamOpeningTags) {
						if (this.accumulator.endsWith(paramOpeningTag)) {
							// Start of a new parameter
							const paramName = paramOpeningTag.slice(1, -1)
							if (!toolParamNames.includes(paramName as ToolParamName)) {
								continue
							}
							this.currentParamName = paramName as ToolParamName
							this.currentParamValueStartIndex = this.accumulator.length
							break
						}
					}

					// Special case for write_to_file content parameter
					const contentParamName: ToolParamName = "content"
					if (
						this.currentToolUse.name === "write_to_file" &&
						this.accumulator.endsWith(`</${contentParamName}>`)
					) {
						const toolContent = this.accumulator.slice(this.currentToolUseStartIndex)
						const contentStartTag = `<${contentParamName}>`
						const contentEndTag = `</${contentParamName}>`
						const contentStartIndex = toolContent.indexOf(contentStartTag) + contentStartTag.length
						const contentEndIndex = toolContent.lastIndexOf(contentEndTag)

						if (contentStartIndex !== -1 && contentEndIndex !== -1 && contentEndIndex > contentStartIndex) {
							this.currentToolUse.params[contentParamName] = toolContent
								.slice(contentStartIndex, contentEndIndex)
								.replace(/^\n/, "")
								.replace(/\n$/, "")
						}
					}
					continue
				}
			}

			// Handle tool use start
			let didStartToolUse = false
			const possibleToolUseOpeningTags = toolNames.map((name) => `<${name}>`)

			for (const toolUseOpeningTag of possibleToolUseOpeningTags) {
				if (this.accumulator.endsWith(toolUseOpeningTag)) {
					const extractedToolName = toolUseOpeningTag.slice(1, -1)

					if (!toolNames.includes(extractedToolName as ToolName)) {
						continue
					}

					// Start of a new tool use
					this.currentToolUse = {
						type: "tool_use",
						name: extractedToolName as ToolName,
						params: {},
						partial: true,
					}

					this.currentToolUseStartIndex = this.accumulator.length

					// End current text content
					if (this.currentTextContent) {
						this.currentTextContent.partial = false
						this.currentTextContent.content = this.currentTextContent.content
							.slice(0, -toolUseOpeningTag.slice(0, -1).length)
							.trim()
						this.currentTextContent = undefined
					}

					// Add new tool_use block as partial
					let idx = this.contentBlocks.findIndex((block) => block === this.currentToolUse)
					if (idx === -1) {
						this.contentBlocks.push(this.currentToolUse)
					}

					didStartToolUse = true
					break
				}
			}

			if (!didStartToolUse) {
				// Handle text content
				if (this.currentTextContent === undefined) {
					this.currentTextContentStartIndex = currentPosition

					this.currentTextContent = {
						type: "text",
						content: this.accumulator.slice(this.currentTextContentStartIndex).trim(),
						partial: true,
					}

					this.contentBlocks.push(this.currentTextContent)
				} else {
					this.currentTextContent.content = this.accumulator.slice(this.currentTextContentStartIndex).trim()
				}
			}
		}
		
		return this.getContentBlocks()
	}

	public finalizeContentBlocks(): void {
		for (const block of this.contentBlocks) {
			if (block.partial) {
				block.partial = false
			}
			if (block.type === "text" && typeof block.content === "string") {
				block.content = block.content.trim()
			}
		}
	}
}

export class WebToolExecutor {
	private fileSystem: NodeFileSystemAdapter
	private terminal: NodeTerminalAdapter
	private parser: AssistantMessageParser

	constructor(fileSystem: NodeFileSystemAdapter, terminal: NodeTerminalAdapter) {
		this.fileSystem = fileSystem
		this.terminal = terminal
		this.parser = new AssistantMessageParser()
	}

	async executeTools(message: string): Promise<string> {
		console.log('[ToolExecutor] Parsing message for tools:', message.substring(0, 200) + '...')
		
		// Use the exact parser from main extension
		this.parser.reset()
		const contentBlocks = this.parser.processChunk(message)
		this.parser.finalizeContentBlocks()
		
		const toolBlocks = contentBlocks.filter((block): block is ToolUse => 
			block.type === 'tool_use' && !block.partial
		)
		
		console.log('[ToolExecutor] Found tools:', toolBlocks.length, toolBlocks.map(t => ({ name: t.name, params: Object.keys(t.params) })))
		
		let results: string[] = []

		for (const tool of toolBlocks) {
			try {
				console.log(`[ToolExecutor] Executing tool ${tool.name} with params:`, tool.params)
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

	private async executeReadFile(params: Partial<Record<ToolParamName, string>>): Promise<string> {
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

	private async executeWriteToFile(params: Partial<Record<ToolParamName, string>>): Promise<string> {
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

	private async executeListFiles(params: Partial<Record<ToolParamName, string>>): Promise<string> {
		const { path = '.', recursive = 'false' } = params
		
		try {
			if (recursive?.toLowerCase() === 'true') {
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

	private async executeCommand(params: Partial<Record<ToolParamName, string>>): Promise<string> {
		const { command } = params
		if (!command) {
			return 'Error: command parameter is required for execute_command'
		}

		try {
			const result = await this.terminal.executeCommand(command)
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

	private async executeAttemptCompletion(params: Partial<Record<ToolParamName, string>>): Promise<string> {
		const { result = 'Task completed successfully' } = params
		return `Task Completion: ${result}`
	}
}