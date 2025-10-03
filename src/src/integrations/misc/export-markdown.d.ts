import { Anthropic } from "@anthropic-ai/sdk";
export declare function downloadTask(dateTs: number, conversationHistory: Anthropic.MessageParam[]): Promise<void>;
export declare function formatContentBlockToMarkdown(block: Anthropic.Messages.ContentBlockParam): string;
export declare function findToolName(toolCallId: string, messages: Anthropic.MessageParam[]): string;
//# sourceMappingURL=export-markdown.d.ts.map