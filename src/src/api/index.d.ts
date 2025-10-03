import { Anthropic } from "@anthropic-ai/sdk";
import type { ProviderSettings, ModelInfo } from "@roo-code/types";
import { ApiStream } from "./transform/stream";
export interface SingleCompletionHandler {
    completePrompt(prompt: string): Promise<string>;
}
export interface ApiHandlerCreateMessageMetadata {
    mode?: string;
    taskId: string;
    previousResponseId?: string;
    /**
     * When true, the provider must NOT fall back to internal continuity state
     * (e.g., lastResponseId) if previousResponseId is absent.
     * Used to enforce "skip once" after a condense operation.
     */
    suppressPreviousResponseId?: boolean;
    /**
     * Controls whether the response should be stored for 30 days in OpenAI's Responses API.
     * When true (default), responses are stored and can be referenced in future requests
     * using the previous_response_id for efficient conversation continuity.
     * Set to false to opt out of response storage for privacy or compliance reasons.
     * @default true
     */
    store?: boolean;
}
export interface ApiHandler {
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    getModel(): {
        id: string;
        info: ModelInfo;
    };
    /**
     * Counts tokens for content blocks
     * All providers extend BaseProvider which provides a default tiktoken implementation,
     * but they can override this to use their native token counting endpoints
     *
     * @param content The content to count tokens for
     * @returns A promise resolving to the token count
     */
    countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number>;
}
export declare function buildApiHandler(configuration: ProviderSettings): ApiHandler;
//# sourceMappingURL=index.d.ts.map