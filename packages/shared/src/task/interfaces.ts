import type { ApiHandler } from "../api/index.js"
import type { ClineMessage, ProviderSettings, TokenUsage, ToolUsage, ToolName } from "@roo-code/types"
import type { McpHub } from "../services/mcp/McpHub.js"
import type { DiffStrategy } from "../shared/tools.js"

export interface TaskDependencies {
	fileSystem?: FileSystemAdapter
	terminalAdapter?: TerminalAdapter
	workspacePath: string
	globalStoragePath: string
	storage?: TaskStorageAdapter
}

export interface TaskStorageAdapter {
	saveApiMessages(taskId: string, messages: any[]): Promise<void>
	loadApiMessages(taskId: string): Promise<any[]>
	saveClineMessages(taskId: string, messages: ClineMessage[]): Promise<void>
	loadClineMessages(taskId: string): Promise<ClineMessage[]>
	saveWorkingDirectory?(taskId: string, workingDirectory: string): Promise<void>
	loadWorkingDirectory?(taskId: string): Promise<string | null>
}

export interface FileSystemAdapter {
	readFile(path: string): Promise<string>
	writeFile(path: string, content: string): Promise<void>
	readDirectory(path: string): Promise<string[]>
	exists(path: string): Promise<boolean>
	createDirectory(path: string): Promise<void>
	deleteFile(path: string): Promise<void>
}

export interface TerminalAdapter {
	executeCommand(command: string, cwd?: string): Promise<{
		stdout: string
		stderr: string
		exitCode: number
	}>
}

export interface TaskOptions {
	taskId?: string
	apiConfiguration: ProviderSettings
	dependencies: TaskDependencies
	task?: string
	images?: string[]
	mode?: string
	mcpHub?: McpHub
	diffStrategy?: DiffStrategy
	enableMcpServerCreation?: boolean
}

export interface TaskEvents {
	message: [message: ClineMessage]
	completed: [result: string]
	error: [error: string]
	toolUsed: [toolName: ToolName]
}