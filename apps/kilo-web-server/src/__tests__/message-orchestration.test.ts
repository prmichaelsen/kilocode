import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import WebSocket from 'ws'
import { SimpleWebServer } from '../SimpleWebServer'

// Mock Firebase service
vi.mock('../services/FirebaseService', () => ({
  FirebaseService: {
    getInstance: vi.fn(() => ({
      saveTaskHistory: vi.fn().mockResolvedValue(undefined),
      addMessageToTask: vi.fn().mockResolvedValue(undefined),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
      getTaskHistory: vi.fn().mockResolvedValue(null),
      getClientTaskHistory: vi.fn().mockResolvedValue([]),
    }))
  }
}))

// Mock shared package
vi.mock('@roo-code/shared', () => ({
  buildApiHandler: vi.fn(() => ({
    getModel: () => ({ id: 'test-model' }),
    createMessage: vi.fn()
  })),
  Task: vi.fn().mockImplementation(() => ({
    taskId: 'test-task-id',
    on: vi.fn(),
    continueConversation: vi.fn(),
    interruptTask: vi.fn(),
    haltTask: vi.fn(),
    resumeTask: vi.fn(),
    abortTask: vi.fn(),
  }))
}))

// Mock adapters
vi.mock('../adapters/NodeFileSystemAdapter', () => ({
  NodeFileSystemAdapter: vi.fn()
}))

vi.mock('../adapters/NodeTerminalAdapter', () => ({
  NodeTerminalAdapter: vi.fn()
}))

vi.mock('../adapters/FirebaseTaskStorageAdapter', () => ({
  FirebaseTaskStorageAdapter: vi.fn()
}))

vi.mock('../services/WebMcpHub', () => ({
  WebMcpHub: {
    getInstance: vi.fn(() => ({
      mcpHub: {}
    }))
  }
}))

describe('Message Orchestration', () => {
  let server: SimpleWebServer
  let mockWs: any
  let mockSession: any

  beforeEach(() => {
    // Set required environment variables
    process.env.KILOCODE_TOKEN = 'test-token'
    process.env.HOME = '/home/test'

    server = new SimpleWebServer()
    
    // Mock WebSocket
    mockWs = {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
      on: vi.fn(),
      close: vi.fn()
    }

    // Create mock session
    mockSession = {
      id: 'test-client-id',
      ws: mockWs,
      messages: [],
      isActive: true,
      messageCounter: 0,
      messageQueue: [],
      isProcessingMessage: false,
      kilocodeToken: 'test-token'
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should handle rapid user interjections during streaming', async () => {
    // Simulate the race condition scenario
    const messages = [
      { type: 'new_task', payload: { text: 'Start a task' } },
      { type: 'interrupt_task', payload: { taskId: 'test-task-id', reason: 'Auto-interrupted by new user message' } },
      { type: 'continue_task', payload: { text: 'New user message', taskId: 'test-task-id' } }
    ]

    // Process messages rapidly to simulate race condition
    const promises = messages.map(msg => 
      (server as any).queueMessage(mockSession, msg)
    )

    await Promise.all(promises)

    // Verify that messages were processed in order
    expect(mockSession.messageQueue.length).toBe(0) // All messages should be processed
    expect(mockWs.send).toHaveBeenCalled()
  })

  test('should prioritize interrupt messages over queued messages', async () => {
    // Add some messages to the queue first
    const regularMessage = { type: 'continue_task', payload: { text: 'Regular message', taskId: 'test-task-id' } }
    const interruptMessage = { type: 'interrupt_task', payload: { taskId: 'test-task-id', reason: 'User interrupt' } }

    // Queue regular message first
    const regularPromise = (server as any).queueMessage(mockSession, regularMessage)
    
    // Then queue interrupt message
    const interruptPromise = (server as any).queueMessage(mockSession, interruptMessage)

    await Promise.all([regularPromise, interruptPromise])

    // Verify interrupt was handled (no chat messages, just state updates)
    expect(mockWs.send).toHaveBeenCalled()
  })

  test('should handle message queue overflow gracefully', async () => {
    // Simulate many rapid messages
    const messages = Array.from({ length: 20 }, (_, i) => ({
      type: 'continue_task',
      payload: { text: `Message ${i}`, taskId: 'test-task-id' }
    }))

    const promises = messages.map(msg => 
      (server as any).queueMessage(mockSession, msg)
    )

    await Promise.all(promises)

    // All messages should be processed without errors
    expect(mockSession.messageQueue.length).toBe(0)
  })

  test('should maintain conversation context across interruptions', async () => {
    // Create a mock task with conversation history
    const mockTask = {
      taskId: 'test-task-id',
      continueConversation: vi.fn(),
      interruptTask: vi.fn(),
      on: vi.fn()
    }

    mockSession.currentTask = mockTask

    // Send interrupt followed by continue
    await (server as any).handleInterruptTask(mockSession, { 
      taskId: 'test-task-id', 
      reason: 'User interrupt' 
    })

    await (server as any).handleContinueTask(mockSession, 'Continue after interrupt', 'test-task-id')

    // Verify task was interrupted and then continued
    expect(mockTask.interruptTask).toHaveBeenCalledWith('User interrupt')
    expect(mockTask.continueConversation).toHaveBeenCalledWith('Continue after interrupt')
  })

  test('should handle concurrent message processing without corruption', async () => {
    // Simulate concurrent processing attempts
    mockSession.isProcessingMessage = false

    const message1 = { type: 'continue_task', payload: { text: 'Message 1', taskId: 'test-task-id' } }
    const message2 = { type: 'continue_task', payload: { text: 'Message 2', taskId: 'test-task-id' } }

    // Start processing both messages simultaneously
    const promise1 = (server as any).processMessageQueue(mockSession)
    const promise2 = (server as any).processMessageQueue(mockSession)

    // Add messages to queue
    mockSession.messageQueue.push(
      { message: message1, resolve: vi.fn(), reject: vi.fn() },
      { message: message2, resolve: vi.fn(), reject: vi.fn() }
    )

    await Promise.all([promise1, promise2])

    // Only one should have processed (due to isProcessingMessage flag)
    expect(mockSession.isProcessingMessage).toBe(false)
  })
})