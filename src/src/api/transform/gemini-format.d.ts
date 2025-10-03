import { Anthropic } from "@anthropic-ai/sdk";
import { Content, Part } from "@google/genai";
export declare function convertAnthropicContentToGemini(content: string | Anthropic.ContentBlockParam[]): Part[];
export declare function convertAnthropicMessageToGemini(message: Anthropic.Messages.MessageParam): Content;
//# sourceMappingURL=gemini-format.d.ts.map