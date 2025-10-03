import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ClineProvider } from "../../core/webview/ClineProvider";
import { McpResourceResponse, McpServer, McpToolCallResponse } from "../../shared/mcp";
import { NotificationService } from "./kilocode/NotificationService";
export type ConnectedMcpConnection = {
    type: "connected";
    server: McpServer;
    client: Client;
    transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport;
};
export type DisconnectedMcpConnection = {
    type: "disconnected";
    server: McpServer;
    client: null;
    transport: null;
};
export type McpConnection = ConnectedMcpConnection | DisconnectedMcpConnection;
export declare enum DisableReason {
    MCP_DISABLED = "mcpDisabled",
    SERVER_DISABLED = "serverDisabled"
}
export declare const ServerConfigSchema: any;
export declare class McpHub {
    private providerRef;
    private disposables;
    private settingsWatcher?;
    private fileWatchers;
    private projectMcpWatcher?;
    private isDisposed;
    connections: McpConnection[];
    isConnecting: boolean;
    readonly kiloNotificationService: NotificationService;
    private refCount;
    private configChangeDebounceTimers;
    constructor(provider: ClineProvider);
    /**
     * Registers a client (e.g., ClineProvider) using this hub.
     * Increments the reference count.
     */
    registerClient(): void;
    /**
     * Unregisters a client. Decrements the reference count.
     * If the count reaches zero, disposes the hub.
     */
    unregisterClient(): Promise<void>;
    /**
     * Validates and normalizes server configuration
     * @param config The server configuration to validate
     * @param serverName Optional server name for error messages
     * @returns The validated configuration
     * @throws Error if the configuration is invalid
     */
    private validateServerConfig;
    /**
     * Formats and displays error messages to the user
     * @param message The error message prefix
     * @param error The error object
     */
    private showErrorMessage;
    setupWorkspaceFoldersWatcher(): void;
    /**
     * Debounced wrapper for handling config file changes
     */
    private debounceConfigChange;
    private handleConfigFileChange;
    private watchProjectMcpFile;
    private updateProjectMcpServers;
    private cleanupProjectMcpServers;
    getServers(): McpServer[];
    getAllServers(): McpServer[];
    getMcpServersPath(): Promise<string>;
    getMcpSettingsFilePath(): Promise<string>;
    private watchMcpSettingsFile;
    private initializeMcpServers;
    private initializeGlobalMcpServers;
    private getProjectMcpPath;
    private initializeProjectMcpServers;
    /**
     * Creates a placeholder connection for disabled servers or when MCP is globally disabled
     * @param name The server name
     * @param config The server configuration
     * @param source The source of the server (global or project)
     * @param reason The reason for creating a placeholder (mcpDisabled or serverDisabled)
     * @returns A placeholder DisconnectedMcpConnection object
     */
    private createPlaceholderConnection;
    /**
     * Checks if MCP is globally enabled
     * @returns Promise<boolean> indicating if MCP is enabled
     */
    private isMcpEnabled;
    private connectToServer;
    private appendErrorMessage;
    /**
     * Helper method to find a connection by server name and source
     * @param serverName The name of the server to find
     * @param source Optional source to filter by (global or project)
     * @returns The matching connection or undefined if not found
     */
    private findConnection;
    private fetchToolsList;
    private fetchResourcesList;
    private fetchResourceTemplatesList;
    deleteConnection(name: string, source?: "global" | "project"): Promise<void>;
    updateServerConnections(newServers: Record<string, any>, source?: "global" | "project", manageConnectingState?: boolean): Promise<void>;
    private setupFileWatcher;
    private removeAllFileWatchers;
    private removeFileWatchersForServer;
    restartConnection(serverName: string, source?: "global" | "project"): Promise<void>;
    refreshAllConnections(): Promise<void>;
    private notifyWebviewOfServerChanges;
    toggleServerDisabled(serverName: string, disabled: boolean, source?: "global" | "project"): Promise<void>;
    /**
     * Helper method to update a server's configuration in the appropriate settings file
     * @param serverName The name of the server to update
     * @param configUpdate The configuration updates to apply
     * @param source Whether to update the global or project config
     */
    private updateServerConfig;
    updateServerTimeout(serverName: string, timeout: number, source?: "global" | "project"): Promise<void>;
    deleteServer(serverName: string, source?: "global" | "project"): Promise<void>;
    readResource(serverName: string, uri: string, source?: "global" | "project"): Promise<McpResourceResponse>;
    callTool(serverName: string, toolName: string, toolArguments?: Record<string, unknown>, source?: "global" | "project"): Promise<McpToolCallResponse>;
    /**
     * Helper method to update a specific tool list (alwaysAllow or disabledTools)
     * in the appropriate settings file.
     * @param serverName The name of the server to update
     * @param source Whether to update the global or project config
     * @param toolName The name of the tool to add or remove
     * @param listName The name of the list to modify ("alwaysAllow" or "disabledTools")
     * @param addTool Whether to add (true) or remove (false) the tool from the list
     */
    private updateServerToolList;
    toggleToolAlwaysAllow(serverName: string, source: "global" | "project", toolName: string, shouldAllow: boolean): Promise<void>;
    toggleToolEnabledForPrompt(serverName: string, source: "global" | "project", toolName: string, isEnabled: boolean): Promise<void>;
    /**
     * Handles enabling/disabling MCP globally
     * @param enabled Whether MCP should be enabled or disabled
     * @returns Promise<void>
     */
    handleMcpEnabledChange(enabled: boolean): Promise<void>;
    dispose(): Promise<void>;
}
//# sourceMappingURL=McpHub.d.ts.map