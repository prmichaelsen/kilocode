import type { ClineAsk } from "@roo-code/types"
import type { Task } from "../task/Task.js"
import type { FileSystemAdapter } from "../task/interfaces.js"

export interface ToolResult {
	success: boolean
	content?: string
	error?: string
}

export interface ToolHandler {
	name: string
	execute(params: any, task: Task): Promise<ToolResult>
}

export class ToolExecutor {
	private tools = new Map<string, ToolHandler>()
	
	constructor(private fileSystem: FileSystemAdapter) {
		this.registerDefaultTools()
	}
	
	private registerDefaultTools() {
		// Read file tool
		this.tools.set("read_file", {
			name: "read_file",
			execute: async (params: { path: string }, task: Task) => {
				try {
					const content = await this.fileSystem.readFile(params.path)
					return { success: true, content }
				} catch (error) {
					return { 
						success: false, 
						error: `Failed to read file: ${error instanceof Error ? error.message : String(error)}` 
					}
				}
			}
		})
		
		// Write file tool
		this.tools.set("write_to_file", {
			name: "write_to_file",
			execute: async (params: { path: string; content: string }, task: Task) => {
				try {
					await this.fileSystem.writeFile(params.path, params.content)
					return { success: true, content: `Successfully wrote to ${params.path}` }
				} catch (error) {
					return { 
						success: false, 
						error: `Failed to write file: ${error instanceof Error ? error.message : String(error)}` 
					}
				}
			}
		})
		
		// List files tool
		this.tools.set("list_files", {
			name: "list_files",
			execute: async (params: { path: string }, task: Task) => {
				try {
					const files = await this.fileSystem.readDirectory(params.path)
					return { success: true, content: files.join("\n") }
				} catch (error) {
					return { 
						success: false, 
						error: `Failed to list files: ${error instanceof Error ? error.message : String(error)}` 
					}
				}
			}
		})
		
		// Execute command tool (mock for web environment)
		this.tools.set("execute_command", {
			name: "execute_command",
			execute: async (params: { command: string }, task: Task) => {
				// Mock command execution for web environment
				return { 
					success: true, 
					content: `Mock execution of command: ${params.command}\n\nNote: Command execution is simulated in web environment.` 
				}
			}
		})
		
		// Attempt completion tool
		this.tools.set("attempt_completion", {
			name: "attempt_completion",
			execute: async (params: { result: string }, task: Task) => {
				task.emit("completed", params.result)
				return { success: true, content: "Task completed successfully" }
			}
		})
	}
	
	async executeTool(toolName: string, params: any, task: Task): Promise<ToolResult> {
		const tool = this.tools.get(toolName)
		if (!tool) {
			return { success: false, error: `Unknown tool: ${toolName}` }
		}
		
		task.recordToolUsage(toolName as any)
		
		try {
			const result = await tool.execute(params, task)
			if (!result.success) {
				task.recordToolError(toolName as any, result.error)
			}
			return result
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error)
			task.recordToolError(toolName as any, errorMsg)
			return { success: false, error: errorMsg }
		}
	}
	
	getAvailableTools(): string[] {
		return Array.from(this.tools.keys())
	}
}