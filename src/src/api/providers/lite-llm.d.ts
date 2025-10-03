import { Anthropic } from "@anthropic-ai/sdk";
import { ApiHandlerOptions } from "../../shared/api";
import { ApiStream } from "../transform/stream";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
import { RouterProvider } from "./router-provider";
/**
 * LiteLLM provider handler
 *
 * This handler uses the LiteLLM API to proxy requests to various LLM providers.
 * It follows the OpenAI API format for compatibility.
 */
export declare class LiteLLMHandler extends RouterProvider implements SingleCompletionHandler {
    constructor(options: ApiHandlerOptions);
    private isGpt5;
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    completePrompt(prompt: string): Promise<string>;
}
//# sourceMappingURL=lite-llm.d.ts.map