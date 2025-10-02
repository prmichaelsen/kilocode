# POC Implementation Plan - Kilo Code Web Fork

## Overview

This document outlines the specific implementation approach for building a Proof of Concept (POC) that demonstrates basic agent conversation functionality using a Node.js WebSocket server and React SPA architecture.

## Architecture Summary

```
┌─────────────────┐    WebSocket     ┌──────────────────┐
│   React SPA     │◄─────────────────►│  Node.js Server  │
│   (Dumb UI)     │    Messages      │  (All Logic)     │
└─────────────────┘                  └──────────────────┘
         │                                     │
         │                                     ▼
         │                           ┌──────────────────┐
         │                           │   LLM APIs       │
         │                           │   (Anthropic,    │
         │                           │    OpenAI, etc.) │
         └───────────────────────────┴──────────────────┘
```

## Core Work Required for POC

### 1. WebSocket Server Setup

**File**: `web-server/src/server.ts`
```typescript
import WebSocket from 'ws'
import { createServer } from 'http'
import express from 'express'
import { WebSocketMessage } from './types/messages'
import { WebTaskManager } from './adapters/TaskManager'

const app = express()
const server = createServer(app)
const wss = new WebSocket.Server({ server })

class WebSocketServer {
  private taskManager: WebTaskManager
  
  constructor() {
    this.taskManager = new WebTaskManager()
    this.setupWebSocket()
  }
  
  private setupWebSocket() {
    wss.on('connection', (ws) => {
      console.log('Client connected')
      
      ws.on('message', async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString())
          await this.handleMessage(ws, message)
        } catch (error) {
          this.sendError(ws, 'Invalid message format')
        }
      })
      
      ws.on('close', () => {
        console.log('Client disconnected')
      })
    })
  }
  
  private async handleMessage(ws: WebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'task_created':
        await this.taskManager.createTask(message.payload.text, ws)
        break
      case 'tool_execution':
        await this.taskManager.executeToolApproval(message.payload, ws)
        break
      // Handle other message types...
    }
  }
  
  private sendError(ws: WebSocket, error: string) {
    ws.send(JSON.stringify({
      type: 'error',
      payload: { message: error }
    }))
  }
}

server.listen(3001, () => {
  console.log('WebSocket server running on port 3001')
})
```

**Commands to set up**:
```bash
mkdir web-server
cd web-server
npm init -y
npm install ws express @types/ws @types/express typescript ts-node
npm install --save-dev @types/node
```

### 2. VSCode Extension Context Adapter

**File**: `src/web/adapters/ExtensionContextAdapter.ts`
```typescript
import { EventEmitter } from 'events'

// Minimal adapter that replaces vscode.ExtensionContext
export class WebExtensionContext {
  private globalState = new Map<string, any>()
  private secrets = new Map<string, string>()
  private subscriptions: Array<{ dispose(): void }> = []
  
  // Mock vscode.ExtensionContext interface
  get globalStorageUri() {
    return { fsPath: './storage' }
  }
  
  get extension() {
    return {
      packageJSON: {
        name: 'kilo-code-web',
        version: '1.0.0'
      }
    }
  }
  
  // Global state management
  globalState = {
    get: <T>(key: string): T | undefined => {
      return this.globalState.get(key)
    },
    update: async (key: string, value: any): Promise<void> => {
      this.globalState.set(key, value)
    }
  }
  
  // Secrets management
  secrets = {
    get: async (key: string): Promise<string | undefined> => {
      return this.secrets.get(key)
    },
    store: async (key: string, value: string): Promise<void> => {
      this.secrets.set(key, value)
    },
    delete: async (key: string): Promise<void> => {
      this.secrets.delete(key)
    }
  }
  
  // Subscription management
  subscriptions = this.subscriptions
}
```

### 3. Task Creation Adapter

**File**: `src/web/adapters/TaskManager.ts`
```typescript
import WebSocket from 'ws'
import { Task } from '../../core/task/Task'
import { WebClineProvider } from './ClineProviderAdapter'
import { WebExtensionContext } from './ExtensionContextAdapter'

export class WebTaskManager {
  private provider: WebClineProvider
  private context: WebExtensionContext
  
  constructor() {
    this.context = new WebExtensionContext()
    this.provider = new WebClineProvider(this.context)
  }
  
  async createTask(text: string, ws: WebSocket): Promise<void> {
    try {
      // Adapt ClineProvider.createTask() to work without VSCode
      const task = await this.provider.createTask(text)
      
      // Send task created message to client
      this.sendMessage(ws, {
        type: 'task_created',
        payload: {
          taskId: task.taskId,
          mode: await task.getTaskMode(),
          workspace: task.cwd
        }
      })
      
      // Set up streaming for this task
      this.setupTaskStreaming(task, ws)
      
    } catch (error) {
      this.sendMessage(ws, {
        type: 'error',
        payload: { message: error.message }
      })
    }
  }
  
  private setupTaskStreaming(task: Task, ws: WebSocket) {
    // Listen for task events and stream to client
    task.on('message', (message) => {
      this.sendMessage(ws, {
        type: 'stream_chunk',
        payload: {
          content: message.text || '',
          partial: message.partial || false,
          messageType: message.type,
          ask: message.ask,
          say: message.say
        }
      })
    })
  }
  
  private sendMessage(ws: WebSocket, message: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }
}
```

### 4. ClineProvider Adapter

**File**: `src/web/adapters/ClineProviderAdapter.ts`
```typescript
import { ClineProvider } from '../../core/webview/ClineProvider'
import { WebExtensionContext } from './ExtensionContextAdapter'
import { WebOutputChannel } from './OutputChannelAdapter'
import { WebContextProxy } from './ContextProxyAdapter'

export class WebClineProvider extends ClineProvider {
  constructor(context: WebExtensionContext) {
    const outputChannel = new WebOutputChannel()
    const contextProxy = new WebContextProxy(context)
    
    // Call parent constructor with web adapters
    super(
      context as any, // Type assertion for compatibility
      outputChannel as any,
      "sidebar", // renderContext
      contextProxy as any
    )
  }
  
  // Override postMessageToWebview to use WebSocket instead
  async postMessageToWebview(message: any) {
    // This will be handled by WebTaskManager
    console.log('Message to webview:', message)
  }
  
  // Override other VSCode-specific methods as needed
  log(message: string) {
    console.log(`[WebClineProvider] ${message}`)
  }
}
```

### 5. Message Streaming Implementation

**File**: `src/web/types/web-messages.ts`
```typescript
// Discriminated union types for WebSocket messages

interface BaseWebSocketMessage {
  requestId?: string
}

interface TaskCreatedMessage extends BaseWebSocketMessage {
  type: 'task_created'
  payload: {
    taskId: string
    mode: string
    workspace: string
  }
}

interface StreamChunkMessage extends BaseWebSocketMessage {
  type: 'stream_chunk'
  payload: {
    content: string
    partial: boolean
    messageType: 'ask' | 'say'
    ask?: string
    say?: string
    toolUse?: {
      name: string
      params: Record<string, any>
    }
  }
}

interface ToolApprovalMessage extends BaseWebSocketMessage {
  type: 'tool_approval'
  payload: {
    approved: boolean
    feedback?: string
  }
}

interface ErrorMessage extends BaseWebSocketMessage {
  type: 'error'
  payload: {
    message: string
    code?: string
  }
}

export type WebSocketMessage = 
  | TaskCreatedMessage
  | StreamChunkMessage
  | ToolApprovalMessage
  | ErrorMessage
```


### Updated File Structure with Integrated React Client:
```
src/
├── extension.ts              # VSCode entry point
├── web/                      # Web-specific code
│   ├── server/
│   │   ├── index.ts         # Web server entry point
│   │   └── WebSocketServer.ts
│   ├── client/               # React web client (integrated)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── types/       # Can import from ../../types/
│   │   ├── package.json
│   │   ├── tsconfig.json    # Configured to access shared types
│   │   └── public/
│   ├── adapters/
│   │   ├── ExtensionContextAdapter.ts
│   │   ├── ClineProviderAdapter.ts
│   │   └── OutputChannelAdapter.ts
│   └── types/
│       └── web-messages.ts   # Web-specific message types
├── core/                     # Shared core logic (unchanged)
├── shared/                   # Shared types (unchanged)
├── api/                      # API handlers (unchanged)
└── utils/                    # Utilities (unchanged)
```

### 6. Basic React Chat UI

**File**: `src/web/client/src/App.tsx`
```typescript
import React, { useState, useEffect, useRef } from 'react'
import { WebSocketMessage } from '@web/types/web-messages'
import { ClineMessage } from '@roo-code/types'

interface ChatMessage {
  id: string
  content: string
  type: 'user' | 'assistant' | 'tool'
  timestamp: number
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  
  useEffect(() => {
    // Connect to WebSocket server
    const ws = new WebSocket('ws://localhost:3001')
    wsRef.current = ws
    
    ws.onopen = () => {
      setIsConnected(true)
      console.log('Connected to server')
    }
    
    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data)
      handleServerMessage(message)
    }
    
    ws.onclose = () => {
      setIsConnected(false)
      console.log('Disconnected from server')
    }
    
    return () => {
      ws.close()
    }
  }, [])
  
  const handleServerMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'stream_chunk':
        if (message.payload.messageType === 'say') {
          // Add or update assistant message
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1]
            if (lastMessage?.type === 'assistant' && message.payload.partial) {
              // Update existing partial message
              return prev.map((msg, idx) => 
                idx === prev.length - 1 
                  ? { ...msg, content: msg.content + message.payload.content }
                  : msg
              )
            } else {
              // Add new message
              return [...prev, {
                id: Date.now().toString(),
                content: message.payload.content,
                type: 'assistant',
                timestamp: Date.now()
              }]
            }
          })
        }
        break
      case 'task_created':
        console.log('Task created:', message.payload.taskId)
        break
      case 'error':
        console.error('Server error:', message.payload.message)
        break
    }
  }
  
  const sendMessage = () => {
    if (!wsRef.current || !input.trim()) return
    
    // Add user message to UI
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input,
      type: 'user',
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMessage])
    
    // Send to server
    wsRef.current.send(JSON.stringify({
      type: 'task_created',
      payload: { text: input }
    }))
    
    setInput('')
    setIsStreaming(true)
  }
  
  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div key={message.id} className={`p-3 rounded ${
            message.type === 'user' 
              ? 'bg-blue-100 ml-auto max-w-xs' 
              : 'bg-gray-100 mr-auto'
          }`}>
            <div className="text-sm text-gray-600 mb-1">
              {message.type === 'user' ? 'You' : 'Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
      </div>
      
      <div className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded"
            disabled={!isConnected || isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={!isConnected || isStreaming}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Send
          </button>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Status: {isConnected ? 'Connected' : 'Disconnected'}
          {isStreaming && ' • Streaming...'}
        </div>
      </div>
    </div>
  )
}
```

**Commands to set up React client**:
```bash
npx create-react-app web-client --template typescript
cd web-client
npm install ws @types/ws
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 7. Server-Side State Management

**File**: `web-server/src/adapters/StateManager.ts`
```typescript
import { GlobalState } from '@roo-code/types'

export class WebStateManager {
  private state = new Map<string, any>()
  private taskHistory: any[] = []
  private conversations = new Map<string, any[]>()
  
  // Implement GlobalState interface
  getValue<K extends keyof GlobalState>(key: K): GlobalState[K] {
    return this.state.get(key as string)
  }
  
  async setValue<K extends keyof GlobalState>(key: K, value: GlobalState[K]): Promise<void> {
    this.state.set(key as string, value)
    
    // Persist critical state to file system
    if (key === 'taskHistory') {
      await this.persistTaskHistory()
    }
  }
  
  private async persistTaskHistory() {
    // Save to JSON file for now, later can be database
    const fs = await import('fs/promises')
    await fs.writeFile('./storage/taskHistory.json', JSON.stringify(this.taskHistory, null, 2))
  }
  
  async loadPersistedState() {
    try {
      const fs = await import('fs/promises')
      const data = await fs.readFile('./storage/taskHistory.json', 'utf-8')
      this.taskHistory = JSON.parse(data)
      this.state.set('taskHistory', this.taskHistory)
    } catch (error) {
      // File doesn't exist yet, start with empty state
      console.log('No persisted state found, starting fresh')
    }
  }
}
```

### 8. Tool Execution Framework

**File**: `web-server/src/adapters/ToolExecutor.ts`
```typescript
import { ToolName } from '@roo-code/types'
import { WebSocket } from 'ws'

export class WebToolExecutor {
  private virtualFS = new Map<string, string>()
  
  async executeReadOnlyTool(
    toolName: ToolName, 
    params: any, 
    ws: WebSocket
  ): Promise<string> {
    switch (toolName) {
      case 'list_files':
        return this.listFiles(params.path, params.recursive)
      case 'read_file':
        return this.readFile(params.path)
      default:
        throw new Error(`Tool ${toolName} not implemented`)
    }
  }
  
  private listFiles(path: string, recursive: boolean): string {
    // Mock implementation - list virtual files
    const files = Array.from(this.virtualFS.keys())
      .filter(filePath => filePath.startsWith(path))
      .map(filePath => filePath.replace(path + '/', ''))
    
    return files.join('\n')
  }
  
  private readFile(path: string): string {
    const content = this.virtualFS.get(path)
    if (!content) {
      throw new Error(`File not found: ${path}`)
    }
    return content
  }
  
  // Initialize with some mock files for POC
  initializeMockFiles() {
    this.virtualFS.set('/project/README.md', '# My Project\n\nThis is a test project.')
    this.virtualFS.set('/project/src/index.js', 'console.log("Hello World")')
    this.virtualFS.set('/project/package.json', '{"name": "test-project", "version": "1.0.0"}')
  }
}
```

### 9. WebSocket Message Protocol Implementation

**File**: `web-server/src/types/messages.ts`
```typescript
// Complete discriminated union for all message types
export interface BaseMessage {
  requestId?: string
}

export interface TaskCreatedMessage extends BaseMessage {
  type: 'task_created'
  payload: {
    text: string
  }
}

export interface StreamChunkMessage extends BaseMessage {
  type: 'stream_chunk'
  payload: {
    content: string
    partial: boolean
    messageType: 'ask' | 'say'
    ask?: string
    say?: string
  }
}

export interface ToolExecutionMessage extends BaseMessage {
  type: 'tool_execution'
  payload: {
    approved: boolean
    feedback?: string
  }
}

export interface ErrorMessage extends BaseMessage {
  type: 'error'
  payload: {
    message: string
    code?: string
  }
}

// Union type enables TypeScript discrimination
export type WebSocketMessage = 
  | TaskCreatedMessage
  | StreamChunkMessage
  | ToolExecutionMessage
  | ErrorMessage

// Type guards for message handling
export function isTaskCreatedMessage(msg: WebSocketMessage): msg is TaskCreatedMessage {
  return msg.type === 'task_created'
}

export function isStreamChunkMessage(msg: WebSocketMessage): msg is StreamChunkMessage {
  return msg.type === 'stream_chunk'
}
```

## Implementation Commands

### Initial Setup
```bash
# Create web server directory
mkdir web-server
cd web-server

# Initialize Node.js project
npm init -y

# Install dependencies
npm install ws express cors dotenv
npm install @types/ws @types/express @types/cors @types/node typescript ts-node
npm install --save-dev nodemon

# Create directory structure
mkdir -p src/adapters src/types storage

# Add scripts to package.json
npm pkg set scripts.dev="nodemon --exec ts-node src/server.ts"
npm pkg set scripts.build="tsc"
npm pkg set scripts.start="node dist/server.js"
```

### React Client Setup
```bash
# Create React client
npx create-react-app web-client --template typescript
cd web-client

# Install additional dependencies
npm install ws @types/ws

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Add WebSocket client scripts
npm pkg set scripts.dev="REACT_APP_WS_URL=ws://localhost:3001 npm start"
```

### Development Workflow
```bash
# Terminal 1: Start WebSocket server
cd web-server
npm run dev

# Terminal 2: Start React client
cd web-client
npm run dev

# Terminal 3: Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: test" -H "Sec-WebSocket-Version: 13" http://localhost:3001
```

## Key Integration Points

### 1. Reuse Existing Kilo Code Logic
- Import and adapt [`Task`](src/core/task/Task.ts:153) class directly
- Reuse [`buildApiHandler()`](src/api/index.ts:97) for LLM API communication
- Adapt [`presentAssistantMessage`](src/core/assistant-message/presentAssistantMessage.ts:63) for streaming

### 2. Minimal VSCode Mocking
- Only mock the essential VSCode APIs that Kilo Code depends on
- Focus on `ExtensionContext`, `OutputChannel`, and basic workspace APIs
- Avoid mocking complex VSCode features not needed for basic conversation

### 3. Progressive Enhancement
- Start with text-only conversation
- Add basic read-only tools (list_files, read_file)
- Gradually add more complex tools as POC evolves

## Testing Strategy

### Unit Tests
```bash
# Test WebSocket message handling
npm test -- --testPathPattern=messages.test.ts

# Test adapter functionality
npm test -- --testPathPattern=adapters.test.ts
```

### Integration Tests
```bash
# Test full conversation flow
npm run test:integration

# Test WebSocket connection stability
npm run test:websocket
```

### Manual Testing
```bash
# Start both server and client
npm run dev:all

# Open browser to http://localhost:3000
# Send test message: "List the files in the current directory"
# Verify agent responds with file listing
```

## Success Metrics for POC

1. **Basic Conversation**: User can send message, agent responds via LLM
2. **Tool Execution**: Agent can execute `list_files` and `read_file` tools
3. **Streaming**: Real-time streaming of agent responses
4. **State Persistence**: Conversation history maintained during session
5. **Error Handling**: Graceful handling of connection issues and errors

This POC will validate the core adapter pattern and demonstrate that the Kilo Code logic can be successfully adapted to run in a web environment.

## Recommended Approach: Integrated within `src/`

**Yes, it absolutely makes sense to put this in the current `src/` directory!** This approach offers several advantages:

### Benefits of Integrated Approach:
1. **Shared Types**: Direct access to all existing types from `@roo-code/types` and `src/shared/`
2. **Code Reuse**: Can import and extend existing classes like [`ClineProvider`](src/core/webview/ClineProvider.ts:130), [`Task`](src/core/task/Task.ts:153)
3. **Consistent Dependencies**: Same package.json, same build tools
4. **Easier Maintenance**: Single codebase with different entry points
5. **Type Safety**: No need to duplicate or sync type definitions

### Updated File Structure:
```
src/
├── extension.ts              # VSCode entry point
├── web/                      # Web-specific code
│   ├── server/
│   │   ├── index.ts         # Web server entry point
│   │   └── WebSocketServer.ts
│   ├── adapters/
│   │   ├── ExtensionContextAdapter.ts
│   │   ├── ClineProviderAdapter.ts
│   │   └── OutputChannelAdapter.ts
│   └── types/
│       └── web-messages.ts   # Web-specific message types
├── core/                     # Shared core logic (unchanged)
├── shared/                   # Shared types (unchanged)
├── api/                      # API handlers (unchanged)
└── utils/                    # Utilities (unchanged)
```


## React Client Integration Strategy

**The React app should live in `src/web/client/` to maximize shared type benefits:**

### Benefits of `src/web/client/` Location:
1. **Direct Type Imports**: Can import from `@roo-code/types`, `../../shared/`, `../types/`
2. **Consistent Build System**: Uses same TypeScript configuration and tooling
3. **Code Sharing**: Can reuse utilities, constants, and helper functions
4. **Monorepo Benefits**: Single dependency management and build pipeline

### TypeScript Configuration for Shared Types:
**File**: `src/web/client/tsconfig.json`
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./build",
    "baseUrl": ".",
    "paths": {
      "@roo-code/types": ["../../../packages/types/src"],
      "@roo/shared": ["../../shared"],
      "@web/types": ["../types"],
      "@src/*": ["../../*"]
    },
    "jsx": "react-jsx",
    "lib": ["dom", "dom.iterable", "es6"]
  },
  "include": [
    "src",
    "../types/**/*",
    "../../shared/**/*",
    "../../../packages/types/src/**/*"
  ]
}
```
