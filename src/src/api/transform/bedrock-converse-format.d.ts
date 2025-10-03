import { Anthropic } from "@anthropic-ai/sdk";
import { Message } from "@aws-sdk/client-bedrock-runtime";
/**
 * Convert Anthropic messages to Bedrock Converse format
 */
export declare function convertToBedrockConverseMessages(anthropicMessages: Anthropic.Messages.MessageParam[]): Message[];
//# sourceMappingURL=bedrock-converse-format.d.ts.map