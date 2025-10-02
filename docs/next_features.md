# Kilo Code Web Fork - Next Features

## Project Overview

This project is designed as a **fork of Kilo Code** that maintains compatibility with upstream updates while adapting the VSCode-based functionality to work as a web application. The core strategy is to create **adapter layers** that translate VSCode APIs to web-compatible equivalents.

## Architecture Strategy

### Fork Approach
- **Upstream Compatibility**: Maintain ability to merge Kilo Code updates
- **Adapter Pattern**: Create adapters that translate VSCode functionality to web APIs
- **Minimal Core Changes**: Keep core logic intact, only modify integration points

### Core Components

#### 1. **WebSocket Server** (Backend)
- **Purpose**: Replace VSCode extension host with WebSocket-based server
- **Responsibilities**:
  - Stream LLM responses to web client
  - Handle tool execution requests
  - Manage file system operations (in-memory)
  - Coordinate MCP server communications
  - Handle git operations via GitHub API

#### 2. **VSCode API Adapters**
- **File System Adapter**: Translate `vscode.workspace.fs` to in-memory file operations
- **State Adapter**: Replace `ExtensionContext` with web-based state management
- **Terminal Adapter**: Proxy terminal commands to remote execution or web-based emulation
- **Webview Adapter**: Replace VSCode webview with direct React component communication

#### 3. **React SPA** (Frontend)
- **Simple Interface**: Lightweight React application
- **WebSocket Client**: Real-time communication with backend server
- **File Editor**: In-browser code editing capabilities
- **Task Management**: UI for managing agent tasks and conversations

#### 4. **Git Integration**
- **GitHub API**: Direct integration for repository operations
- **In-Memory Operations**: All file changes happen in memory first
- **Batch Commits**: Commit multiple file changes as atomic operations
- **Branch Management**: Support for feature branches and pull requests

## Technical Implementation

### Adapter Layer Design

```typescript
// VSCode API Adapter Interface
interface VSCodeAdapter {
  workspace: WorkspaceAdapter
  window: WindowAdapter
  commands: CommandsAdapter
  secrets: SecretsAdapter
}

// File System Adapter
class WebWorkspaceAdapter implements vscode.Workspace {
  private virtualFS: VirtualFileSystem
  private gitClient: GitHubAPIClient
  
  // Implement all vscode.workspace methods
  // Route to virtual FS or GitHub API as needed
}
```

### WebSocket Protocol

```typescript
// Base message interface
interface BaseWebSocketMessage {
  requestId?: string
}

// Individual message types with discriminated unions
interface TaskCreatedMessage extends BaseWebSocketMessage {
  type: 'task_created'
  payload: {
    taskId: string
    mode: string
    workspace: string
  }
}

interface ToolExecutionMessage extends BaseWebSocketMessage {
  type: 'tool_execution'
  payload: {
    toolName: string
    parameters: Record<string, any>
    approved: boolean
  }
}

interface FileOperationMessage extends BaseWebSocketMessage {
  type: 'file_operation'
  payload: {
    operation: 'read' | 'write' | 'delete' | 'list'
    path: string
    content?: string
    recursive?: boolean
  }
}

interface StateUpdateMessage extends BaseWebSocketMessage {
  type: 'state_update'
  payload: {
    key: string
    value: any
  }
}

interface StreamChunkMessage extends BaseWebSocketMessage {
  type: 'stream_chunk'
  payload: {
    content: string
    partial: boolean
    toolUse?: ToolUseBlock
  }
}

interface McpToolCallMessage extends BaseWebSocketMessage {
  type: 'mcp_tool_call'
  payload: {
    serverName: string
    toolName: string
    arguments: Record<string, any>
  }
}

interface GitOperationMessage extends BaseWebSocketMessage {
  type: 'git_operation'
  payload: {
    operation: 'commit' | 'branch' | 'pull_request'
    message?: string
    branchName?: string
    files?: string[]
  }
}

// Union type for all WebSocket messages
export type WebSocketMessage =
  | TaskCreatedMessage
  | ToolExecutionMessage
  | FileOperationMessage
  | StateUpdateMessage
  | StreamChunkMessage
  | McpToolCallMessage
  | GitOperationMessage
```

### Virtual File System

```typescript
class VirtualFileSystem {
  private files = new Map<string, VirtualFile>()
  private gitClient: GitHubAPIClient
  
  async readFile(path: string): Promise<string>
  async writeFile(path: string, content: string): Promise<void>
  async commitChanges(message: string, files: string[]): Promise<void>
  async createBranch(name: string): Promise<void>
  async createPullRequest(title: string, body: string): Promise<void>
}
```

## Authentication Strategy

### GitHub OAuth Integration
- **OAuth Flow**: Standard GitHub OAuth for repository access
- **Permissions**: Request appropriate repository permissions
- **Token Management**: Secure token storage and refresh handling
- **Organization Support**: Handle organization-owned repositories

### Implementation Steps
1. **GitHub App Registration**: Create GitHub App with necessary permissions
2. **OAuth Endpoints**: Implement OAuth callback handling
3. **Token Storage**: Secure client-side token management
4. **API Integration**: GitHub REST/GraphQL API for git operations

## Development Phases

### POC Phase: Basic Agent Conversation
**Goal**: Minimal working prototype that demonstrates core agent conversation functionality

#### Core Work Required for POC:
- [ ] **WebSocket Server Setup**: Create basic Node.js WebSocket server that can handle client connections
- [ ] **VSCode Extension Context Adapter**: Create minimal adapter that replaces `vscode.ExtensionContext` with in-memory state
- [ ] **Task Creation Adapter**: Adapt [`ClineProvider.createTask()`](src/core/webview/ClineProvider.ts:632) to work without VSCode dependencies
- [ ] **API Handler Integration**: Keep [`buildApiHandler()`](src/api/index.ts:97) running in Node.js server context (no changes needed)
- [ ] **Message Streaming**: Implement streaming of LLM responses from Node.js server to React client via WebSocket
- [ ] **Basic React Chat UI**: Simple "dumb" chat interface that only handles UI rendering and user input
- [ ] **Server-Side State Management**: In-memory conversation history and task state managed in Node.js server
- [ ] **Tool Execution Framework**: Basic framework for tool execution in Node.js server (start with read-only tools)
- [ ] **WebSocket Message Protocol**: Implement discriminated union message types for type-safe communication

#### POC Success Criteria:
- [ ] User can start a conversation with the agent through web interface
- [ ] Agent can respond using LLM API (Anthropic/OpenAI)
- [ ] Basic tool execution works (e.g., `list_files`, `read_file`)
- [ ] Conversation history is maintained during session
- [ ] WebSocket communication is stable and handles reconnection

### Phase 1: Core Infrastructure
- [ ] Set up fork repository structure
- [ ] Create basic WebSocket server
- [ ] Implement VSCode adapter interfaces
- [ ] Build minimal React SPA
- [ ] Basic file system virtualization

### Phase 2: Task Execution
- [ ] Port task orchestration logic
- [ ] Implement tool execution adapters
- [ ] Add MCP client support (HTTP/WebSocket only)
- [ ] Create conversation persistence layer

### Phase 3: Git Integration
- [ ] GitHub API integration
- [ ] In-memory to git commit pipeline
- [ ] Branch and PR management
- [ ] Conflict resolution strategies

### Phase 4: Advanced Features
- [ ] Real-time collaboration
- [ ] Advanced git workflows
- [ ] Performance optimizations
- [ ] Security hardening

## Key Considerations

### Maintaining Fork Compatibility
- **Minimal Core Changes**: Only modify integration points, not core logic
- **Adapter Pattern**: Isolate web-specific code in adapter layers
- **Configuration Flags**: Use feature flags to enable/disable web mode
- **Regular Merges**: Plan for regular upstream merges

### Performance Optimization
- **Lazy Loading**: Load files from GitHub on-demand
- **Caching Strategy**: Intelligent caching of frequently accessed files
- **Streaming**: Efficient streaming of large file operations
- **Web Workers**: Offload heavy computations to web workers

### Security Considerations
- **Sandboxing**: Isolate tool execution in secure environments
- **Input Validation**: Validate all user inputs and tool parameters
- **Rate Limiting**: Implement rate limiting for API calls
- **CORS/CSP**: Proper security headers and policies

## Technology Stack

### Backend
- **Node.js**: Server runtime
- **WebSocket**: Real-time communication
- **Express**: HTTP server framework
- **GitHub API**: Git operations
- **MCP SDK**: Model Context Protocol integration

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **WebSocket Client**: Real-time communication
- **Monaco Editor**: Code editing capabilities
- **Tailwind CSS**: Styling framework

### Infrastructure
- **Docker**: Containerization
- **GitHub Actions**: CI/CD pipeline
- **Vercel/Netlify**: Frontend deployment
- **Railway/Render**: Backend deployment

## Success Metrics

### Technical Goals
- [ ] Maintain 100% feature parity with VSCode version
- [ ] Support all existing MCP servers (HTTP/WebSocket compatible)
- [ ] Handle repositories up to 10,000 files efficiently
- [ ] Sub-second response times for common operations

### User Experience Goals
- [ ] Seamless transition from VSCode to web interface
- [ ] Reliable git integration with conflict resolution
- [ ] Real-time collaboration capabilities
- [ ] Mobile-responsive design for basic operations

## Next Steps

1. **Repository Setup**: Create fork and establish development environment
2. **Proof of Concept**: Build minimal working version with basic task execution
3. **Adapter Development**: Implement core VSCode API adapters
4. **Integration Testing**: Ensure compatibility with existing Kilo Code features
5. **Performance Testing**: Validate performance with realistic workloads