import { Anthropic } from "@anthropic-ai/sdk";
/**
 * Convert complex content blocks to simple string content
 */
export declare function convertToSimpleContent(content: Anthropic.Messages.MessageParam["content"]): string;
/**
 * Convert Anthropic messages to simple format with string content
 */
export declare function convertToSimpleMessages(messages: Anthropic.Messages.MessageParam[]): Array<{
    role: "user" | "assistant";
    content: string;
}>;
//# sourceMappingURL=simple-format.d.ts.map