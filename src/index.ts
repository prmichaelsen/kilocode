// Export key modules for external consumption
export { buildApiHandler } from './api/index.js'
export type { ApiHandler, ApiHandlerCreateMessageMetadata } from './api/index.js'
export { Task } from './core/task/Task.js'
export type { TaskOptions } from './core/task/Task.js'
export type { ApiStream } from './api/transform/stream.js'

// Re-export types from @roo-code/types for convenience
export type {
  ProviderSettings,
  ClineMessage,
  TaskMetadata,
  TokenUsage,
  ToolUsage,
  ToolName,
  ClineAsk,
  ClineSay
} from '@roo-code/types'

// Define ClineAskResponse locally since it's missing from types package
export type ClineAskResponse =
  | "yesButtonClicked"
  | "noButtonClicked"
  | "messageResponse"
  | "retry_clicked"