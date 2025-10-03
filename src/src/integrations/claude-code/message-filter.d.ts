import type { Anthropic } from "@anthropic-ai/sdk";
/**
 * Filters out image blocks from messages since Claude Code doesn't support images.
 * Replaces image blocks with text placeholders similar to how VSCode LM provider handles it.
 */
export declare function filterMessagesForClaudeCode(messages: Anthropic.Messages.MessageParam[]): Anthropic.Messages.MessageParam[];
//# sourceMappingURL=message-filter.d.ts.map