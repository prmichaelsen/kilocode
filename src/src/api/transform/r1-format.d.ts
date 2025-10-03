import { Anthropic } from "@anthropic-ai/sdk";
import OpenAI from "openai";
type Message = OpenAI.Chat.ChatCompletionMessageParam;
type AnthropicMessage = Anthropic.Messages.MessageParam;
/**
 * Converts Anthropic messages to OpenAI format while merging consecutive messages with the same role.
 * This is required for DeepSeek Reasoner which does not support successive messages with the same role.
 *
 * @param messages Array of Anthropic messages
 * @returns Array of OpenAI messages where consecutive messages with the same role are combined
 */
export declare function convertToR1Format(messages: AnthropicMessage[]): Message[];
export {};
//# sourceMappingURL=r1-format.d.ts.map