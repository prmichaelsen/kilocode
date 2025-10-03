import { type GroqModelId } from "@roo-code/types";
import { Anthropic } from "@anthropic-ai/sdk";
import type { ApiHandlerOptions } from "../../shared/api";
import type { ApiHandlerCreateMessageMetadata } from "../index";
import { ApiStream } from "../transform/stream";
import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider";
export declare class GroqHandler extends BaseOpenAiCompatibleProvider<GroqModelId> {
    constructor(options: ApiHandlerOptions);
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    private yieldUsage;
}
//# sourceMappingURL=groq.d.ts.map