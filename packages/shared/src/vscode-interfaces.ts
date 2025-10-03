/**
 * VSCode API interfaces for dependency injection
 * These interfaces define the minimal VSCode API surface needed by shared modules
 * without requiring the actual VSCode extension host
 */

export interface VSCodeWorkspace {
	getConfiguration(section?: string): VSCodeConfiguration
	workspaceFolders?: VSCodeWorkspaceFolder[]
	onDidChangeConfiguration?: (listener: (e: any) => void) => VSCodeDisposable
}

export interface VSCodeConfiguration {
	get<T>(section: string, defaultValue?: T): T | undefined
	update(section: string, value: any, configurationTarget?: any): Promise<void>
}

export interface VSCodeWorkspaceFolder {
	uri: VSCodeUri
	name: string
	index: number
}

export interface VSCodeUri {
	fsPath: string
	scheme: string
	authority: string
	path: string
	query: string
	fragment: string
	toString(): string
}

export interface VSCodeExtensionContext {
	globalStorageUri: VSCodeUri
	workspaceState: VSCodeMemento
	globalState: VSCodeMemento
	subscriptions: VSCodeDisposable[]
	extensionPath: string
	extensionUri: VSCodeUri
}

export interface VSCodeMemento {
	get<T>(key: string, defaultValue?: T): T
	update(key: string, value: any): Promise<void>
	keys(): readonly string[]
}

export interface VSCodeDisposable {
	dispose(): void
}

export interface VSCodeWindow {
	showErrorMessage(message: string, ...items: string[]): Promise<string | undefined>
	showInformationMessage(message: string, ...items: string[]): Promise<string | undefined>
	showWarningMessage(message: string, ...items: string[]): Promise<string | undefined>
}

export interface VSCodeCommands {
	executeCommand<T = unknown>(command: string, ...rest: any[]): Promise<T>
}

export interface VSCodeFileSystem {
	readFile(uri: VSCodeUri): Promise<Uint8Array>
	writeFile(uri: VSCodeUri, content: Uint8Array): Promise<void>
	stat(uri: VSCodeUri): Promise<VSCodeFileStat>
	readDirectory(uri: VSCodeUri): Promise<[string, VSCodeFileType][]>
	createDirectory(uri: VSCodeUri): Promise<void>
	delete(uri: VSCodeUri, options?: { recursive?: boolean; useTrash?: boolean }): Promise<void>
}

export interface VSCodeFileStat {
	type: VSCodeFileType
	ctime: number
	mtime: number
	size: number
}

export enum VSCodeFileType {
	Unknown = 0,
	File = 1,
	Directory = 2,
	SymbolicLink = 64
}

/**
 * Aggregated VSCode API interface for dependency injection
 */
export interface VSCodeAPI {
	workspace: VSCodeWorkspace
	window: VSCodeWindow
	commands: VSCodeCommands
	fs: VSCodeFileSystem
	Uri: {
		file(path: string): VSCodeUri
		parse(value: string): VSCodeUri
		joinPath(base: VSCodeUri, ...pathSegments: string[]): VSCodeUri
	}
}

/**
 * Factory function type for creating VSCode URI objects
 */
export type VSCodeUriFactory = {
	file(path: string): VSCodeUri
	parse(value: string): VSCodeUri
	joinPath(base: VSCodeUri, ...pathSegments: string[]): VSCodeUri
}