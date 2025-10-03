# Kilo Code Web Architecture - CRITICAL UNDERSTANDING

## Architecture Pattern: Thin Client, Heavy Server

### ✅ CORRECT ARCHITECTURE
```
┌─────────────────────┐    WebSocket     ┌─────────────────────────────┐
│   React Web Client │ ◄──────────────► │   Node.js WebSocket Server │
│                     │                  │                             │
│ - UI rendering only │                  │ - Full Kilo Code logic      │
│ - WebSocket comms   │                  │ - LLM API calls             │
│ - GitHub OAuth only │                  │ - Tool execution            │
│                     │                  │ - File system operations    │
└─────────────────────┘                  │ - State persistence         │
                                         │ - MCP integration           │
                                         └─────────────────────────────┘
```

### 🚫 WRONG THINKING
- ❌ "Web-compatible API handlers" - NO! Server uses existing handlers
- ❌ "Browser-specific adaptations" - NO! Server encapsulates everything  
- ❌ "Client-side LLM calls" - NO! Only server makes API calls

### ✅ CORRECT IMPLEMENTATION STRATEGY

**WebSocket Server** (`apps/kilo-web-server`):
- Uses existing `buildApiHandler()` from `src/api/index.ts`
- Uses existing `Task` class from `src/core/task/Task.ts`  
- Uses existing `ClineProvider` adapters
- Handles ALL LLM communication, tool execution, file operations
- Streams responses via WebSocket to thin client

**React Client** (`apps/kilo-web-client`):
- Pure UI layer - chat interface only
- WebSocket communication for real-time updates
- GitHub OAuth for repository access (only client-side API call)
- NO direct LLM calls, NO tool execution, NO file operations

### Phase 2 Implementation Plan

1. **Replace Mock with Real LLM**: Update WebSocket server to use `buildApiHandler()` and `Task` class
2. **Tool Execution**: Integrate existing tool system from `src/core/tools/`
3. **Virtual File System**: In-memory file operations with GitHub API persistence
4. **MCP Integration**: Use existing `McpHub` from `src/services/mcp/`

This is a **server-side fork** of Kilo Code, not a client-side adaptation.