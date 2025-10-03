import type { VSCodeAPI } from "../vscode-interfaces.js"
import type { ApiHandler } from "../api/index.js"
import type { ClineMessage, ProviderSettings, TokenUsage, ToolUsage, ToolName } from "@roo-code/types"

export interface TaskDependencies {
	vscode?: VSCodeAPI
	fileSystem?: FileSystemAdapter
	terminalAdapter?: TerminalAdapter
	workspacePath: string
	globalStoragePath: string
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
}

export interface TaskEvents {
	message: [message: ClineMessage]
	completed: [result: string]
	error: [error: string]
	toolUsed: [toolName: ToolName]
}