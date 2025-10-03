// Interface abstractions to remove direct VSCode API dependencies

export interface INotificationService {
	showErrorMessage(message: string): void
	showWarningMessage(message: string): void
	showInformationMessage(message: string): void
}

export interface IFileSystemWatcher {
	onDidChange(listener: (uri: { fsPath: string }) => void): { dispose(): void }
	onDidCreate(listener: (uri: { fsPath: string }) => void): { dispose(): void }
	onDidDelete(listener: () => void): { dispose(): void }
	dispose(): void
}

export interface IWorkspaceFolder {
	uri: {
		fsPath: string
	}
}

export interface IWorkspace {
	workspaceFolders?: IWorkspaceFolder[]
	createFileSystemWatcher(pattern: string | { pattern: string; baseUri: string }): IFileSystemWatcher
	onDidChangeWorkspaceFolders(listener: () => void): { dispose(): void }
}

export interface IDisposable {
	dispose(): void
}

export interface IExtensionContext {
	extension?: {
		packageJSON?: {
			version?: string
		}
	}
}

export interface IVSCodeAdapter {
	workspace: IWorkspace
	window: INotificationService
	createDisposable(disposables: { dispose(): void }[]): IDisposable
	createRelativePattern(base: string, pattern: string): { pattern: string; baseUri: string }
	createUri(path: string): { fsPath: string }
}

export interface IProviderAdapter {
	cwd?: string
	context: IExtensionContext
	ensureMcpServersDirectoryExists(): Promise<string>
	ensureSettingsDirectoryExists(): Promise<string>
	getState(): Promise<{ mcpEnabled?: boolean }>
	postMessageToWebview(message: any): Promise<void>
}

export type LogLevel = "debug" | "info" | "notice" | "warning" | "error" | "critical" | "alert" | "emergency"