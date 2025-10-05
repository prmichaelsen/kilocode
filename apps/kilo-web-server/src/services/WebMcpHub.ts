import { McpHub } from "@roo-code/shared"
import * as fs from "fs/promises"
import * as path from "path"

// Web-compatible adapters for McpHub
class WebVSCodeAdapter {
	constructor(private workspacePath: string) {}

	workspace = {
		get workspaceFolders() {
			return [{ uri: { fsPath: this.workspacePath } }]
		},
		createFileSystemWatcher: () => ({
			onDidChange: () => ({ dispose: () => {} }),
			onDidCreate: () => ({ dispose: () => {} }),
			onDidDelete: () => ({ dispose: () => {} }),
			dispose: () => {}
		}),
		onDidChangeWorkspaceFolders: () => ({ dispose: () => {} })
	}

	window = {
		showErrorMessage: (message: string) => console.error(`[WebMcpHub] Error: ${message}`),
		showWarningMessage: (message: string) => console.warn(`[WebMcpHub] Warning: ${message}`),
		showInformationMessage: (message: string) => console.log(`[WebMcpHub] Info: ${message}`)
	}

	createRelativePattern(base: string, pattern: string) {
		return path.join(base, pattern)
	}

	createDisposable(disposables: any[]) {
		return {
			dispose: () => disposables.forEach(d => d?.dispose?.())
		}
	}
}

class WebProviderAdapter {
	context = {
		extension: {
			packageJSON: { version: "1.0.0" }
		}
	}

	constructor(public cwd: string) {}

	async ensureMcpServersDirectoryExists(): Promise<string> {
		const mcpDir = path.join(this.cwd, ".kilocode", "mcp-servers")
		await fs.mkdir(mcpDir, { recursive: true })
		return mcpDir
	}

	async ensureSettingsDirectoryExists(): Promise<string> {
		// Always use $HOME/notebin/config for MCP settings
		const homeDir = process.env.HOME || "/home/user"
		const settingsDir = path.join(homeDir, "notebin", "config")
		await fs.mkdir(settingsDir, { recursive: true })
		return settingsDir
	}

	async getState() {
		return {
			mcpEnabled: true
		}
	}

	async postMessageToWebview(message: any) {
		console.log(`[WebMcpHub] Would send to webview:`, message.type)
	}
}

export class WebMcpHub {
	public mcpHub: McpHub
	private static instances = new Map<string, WebMcpHub>()
	private providerAdapter: WebProviderAdapter // Keep strong reference to prevent GC
	private vscodeAdapter: WebVSCodeAdapter // Keep strong reference to prevent GC

	private constructor(workspacePath: string) {
		this.vscodeAdapter = new WebVSCodeAdapter(workspacePath)
		this.providerAdapter = new WebProviderAdapter(workspacePath)
		const t = (key: string, params?: any) => key // Simple translation function

		this.mcpHub = new McpHub(
			this.providerAdapter as any,
			this.vscodeAdapter as any,
			t
		)
	}

	static getInstance(workspacePath: string): WebMcpHub {
		if (!WebMcpHub.instances.has(workspacePath)) {
			WebMcpHub.instances.set(workspacePath, new WebMcpHub(workspacePath))
		}
		return WebMcpHub.instances.get(workspacePath)!
	}

	getServers() {
		return this.mcpHub.getServers()
	}

	getAllServers() {
		return this.mcpHub.getAllServers()
	}

	async callTool(serverName: string, toolName: string, toolArguments?: Record<string, unknown>) {
		return this.mcpHub.callTool(serverName, toolName, toolArguments)
	}

	async readResource(serverName: string, uri: string) {
		return this.mcpHub.readResource(serverName, uri)
	}

	async refreshAllConnections() {
		return this.mcpHub.refreshAllConnections()
	}

	async dispose() {
		return this.mcpHub.dispose()
	}
}