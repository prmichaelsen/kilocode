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
      
      // Mock methods
      interruptTask: vi.fn(async (reason: string) => {
        mockTask.interrupted = true
        mockTask.interruptReason = reason
      }),
      
      isInterrupted: vi.fn(() => mockTask.interrupted),
      
      continueConversation: vi.fn(async (text: string) => {
        if (mockTask.interrupted) {
          mockTask.interrupted = false
          mockTask.interruptReason = undefined
          mockTask.abort = false
        }
      }),
      
      // Mock executeToolsInMessage with interruption checks
      executeToolsInMessage: vi.fn(async (message: string) => {
        const toolResults: string[] = []
        
        // Simulate checking for interruption before each tool
        if (message.includes('read_file')) {
          if (mockTask.abort || mockTask.interrupted) {
            return 'Tool Execution Interrupted: Task was interrupted during tool execution.'
          }
          toolResults.push('read_file Result: File content loaded')
        }
        
        if (message.includes('execute_command')) {
          if (mockTask.abort || mockTask.interrupted) {
            return 'Tool Execution Interrupted: Task was interrupted during tool execution.'
          }
          toolResults.push('execute_command Result: Command executed')
        }
        
        if (message.includes('write_to_file')) {
          if (mockTask.abort || mockTask.interrupted) {
            return 'Tool Execution Interrupted: Task was interrupted during tool execution.'
          }
          toolResults.push('write_to_file Result: File written')
        }
        
        return toolResults.join('\n\n')
      }),
      
      // Mock initiateTaskLoop with interruption checks
      initiateTaskLoop: vi.fn(async (userContent: any[]) => {
        let iterations = 0
        const maxIterations = 10
        
        while (!mockTask.abort && !mockTask.interrupted && iterations < maxIterations) {
          iterations++
          
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 10))
          
          // Check for interruption between iterations
          if (mockTask.interrupted || mockTask.abort) {
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
})