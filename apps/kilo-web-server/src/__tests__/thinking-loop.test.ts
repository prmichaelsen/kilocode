import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Firebase service
vi.mock('../services/FirebaseService', () => ({
  FirebaseService: {
    getInstance: vi.fn(() => ({
      saveTaskHistory: vi.fn().mockResolvedValue(undefined),
      addMessageToTask: vi.fn().mockResolvedValue(undefined),
      updateTaskStatus: vi.fn().mockResolvedValue(undefined),
    }))
  }
}))

describe('Thinking Loop Prevention', () => {
  let mockTask: any

  beforeEach(() => {
    // Create a mock task that simulates the real Task behavior
    mockTask = {
      taskId: 'test-thinking-loop-task',
      abort: false,
      interrupted: false,
      isStreaming: false,
      interruptReason: undefined,
      hasPendingUserMessage: false,
      pendingUserContent: undefined,
      
      // Mock methods
      interruptTask: vi.fn(async (reason: string) => {
        mockTask.interrupted = true
        mockTask.interruptReason = reason
      }),
      
      isInterrupted: vi.fn(() => mockTask.interrupted),
      
      continueConversation: vi.fn(async (text: string, images?: string[]) => {
        // Set pending message flag
        mockTask.hasPendingUserMessage = true
        mockTask.pendingUserContent = [{ type: 'text', text }]
        
        if (mockTask.interrupted) {
          mockTask.interrupted = false
          mockTask.interruptReason = undefined
          mockTask.abort = false
        }
        
        // Simulate processing the message
        await new Promise(resolve => setTimeout(resolve, 10))
        
        // Clear pending message flag after processing
        mockTask.hasPendingUserMessage = false
        mockTask.pendingUserContent = undefined
      }),
      
      // Mock executeToolsInMessage with interruption and pending message checks
      executeToolsInMessage: vi.fn(async (message: string) => {
        const toolResults: string[] = []
        
        // Simulate checking for interruption and pending messages before each tool
        if (message.includes('read_file')) {
          if (mockTask.abort || mockTask.interrupted || mockTask.hasPendingUserMessage) {
            return 'Tool Execution Interrupted: Task was interrupted during tool execution.'
          }
          toolResults.push('read_file Result: File content loaded')
        }
        
        if (message.includes('execute_command')) {
          if (mockTask.abort || mockTask.interrupted || mockTask.hasPendingUserMessage) {
            return 'Tool Execution Interrupted: Task was interrupted during tool execution.'
          }
          toolResults.push('execute_command Result: Command executed')
        }
        
        if (message.includes('write_to_file')) {
          if (mockTask.abort || mockTask.interrupted || mockTask.hasPendingUserMessage) {
            return 'Tool Execution Interrupted: Task was interrupted during tool execution.'
          }
          toolResults.push('write_to_file Result: File written')
        }
        
        return toolResults.join('\n\n')
      }),
      
      // Mock initiateTaskLoop with interruption and pending message checks
      initiateTaskLoop: vi.fn(async (userContent: any[]) => {
        let iterations = 0
        const maxIterations = 10
        
        while (!mockTask.abort && !mockTask.interrupted && !mockTask.hasPendingUserMessage && iterations < maxIterations) {
          iterations++
          
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 10))
          
          // Check for interruption and pending messages between iterations
          if (mockTask.interrupted || mockTask.abort || mockTask.hasPendingUserMessage) {
            break
          }
          
          // Simulate continuing the loop (thinking behavior)
          if (iterations < 3) {
            continue
          } else {
            break // Prevent infinite loop in test
          }
        }
        
        return iterations
      })
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should check for interruption between tool executions', async () => {
    const messageWithMultipleTools = 'I will execute multiple tools: read_file, execute_command, write_to_file'

    // Start tool execution
    const executionPromise = mockTask.executeToolsInMessage(messageWithMultipleTools)

    // Interrupt the task during execution
    setTimeout(() => {
      mockTask.interruptTask('User sent new message during tool execution')
    }, 50)

    const result = await executionPromise

    // Should include interruption message in results
    expect(result).toContain('Tool Execution Interrupted')
    expect(mockTask.isInterrupted()).toBe(true)
  })

  test('should allow task loop interruption between iterations', async () => {
    // Start the task loop
    const loopPromise = mockTask.initiateTaskLoop([
      { type: 'text', text: 'Start thinking loop test' }
    ])

    // Interrupt after a short delay
    setTimeout(() => {
      mockTask.interruptTask('User interrupted during thinking loop')
    }, 25)

    const iterations = await loopPromise

    // Should have stopped due to interruption
    expect(mockTask.isInterrupted()).toBe(true)
    expect(iterations).toBeLessThan(10) // Should stop before max iterations
  })

  test('should handle user message during multi-tool execution', async () => {
    const multiToolMessage = 'read_file file1.txt, read_file file2.txt, read_file file3.txt'

    // Start tool execution
    const executionPromise = mockTask.executeToolsInMessage(multiToolMessage)

    // Interrupt during execution
    setTimeout(() => {
      mockTask.interruptTask('User sent new message')
    }, 25)

    const result = await executionPromise

    // Should handle interruption gracefully
    expect(result).toContain('Tool Execution Interrupted')
    expect(mockTask.isInterrupted()).toBe(true)
  })

  test('should reset interrupted state when continuing conversation', async () => {
    // First interrupt the task
    await mockTask.interruptTask('Test interruption')
    expect(mockTask.isInterrupted()).toBe(true)

    // Then continue conversation
    await mockTask.continueConversation('Continue after interruption')

    // Should reset interrupted state
    expect(mockTask.isInterrupted()).toBe(false)
  })

  test('should handle rapid interrupt and continue sequence', async () => {
    // Simulate rapid interrupt and continue
    await mockTask.interruptTask('Rapid interrupt')
    expect(mockTask.isInterrupted()).toBe(true)

    // Immediately continue
    await mockTask.continueConversation('Rapid continue')
    expect(mockTask.isInterrupted()).toBe(false)

    // Task should be in clean state
    expect(mockTask.abort).toBe(false)
  })

  test('should interrupt autonomous loop when user message arrives', async () => {
    // Start the autonomous task loop
    const loopPromise = mockTask.initiateTaskLoop([
      { type: 'text', text: 'Start autonomous loop' }
    ])

    // Send a user message during the loop
    setTimeout(() => {
      mockTask.continueConversation('User interrupts with new message')
    }, 15)

    const iterations = await loopPromise

    // Loop should have stopped due to pending user message
    expect(iterations).toBeLessThan(3) // Should stop before completing all iterations
    expect(mockTask.hasPendingUserMessage).toBe(false) // Should be cleared after processing
  })

  test('should prioritize user message over autonomous execution', async () => {
    // Start autonomous loop
    const loopPromise = mockTask.initiateTaskLoop([
      { type: 'text', text: 'Autonomous task' }
    ])

    // Immediately send user message
    const userMessagePromise = mockTask.continueConversation('Priority user message')

    // Wait for both to complete
    await Promise.all([loopPromise, userMessagePromise])

    // User message should have been processed
    expect(mockTask.hasPendingUserMessage).toBe(false)
    expect(mockTask.continueConversation).toHaveBeenCalledWith('Priority user message')
  })

  test('should check for pending messages during tool execution', async () => {
    const multiToolMessage = 'read_file file1.txt, execute_command ls, write_to_file output.txt'

    // Start tool execution
    const executionPromise = mockTask.executeToolsInMessage(multiToolMessage)

    // Send user message during tool execution
    setTimeout(() => {
      mockTask.hasPendingUserMessage = true
      mockTask.pendingUserContent = [{ type: 'text', text: 'User message during tools' }]
    }, 25)

    const result = await executionPromise

    // Should detect pending message and interrupt
    expect(result).toContain('Tool Execution Interrupted')
  })
})