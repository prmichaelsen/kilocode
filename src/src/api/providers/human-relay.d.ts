import { Anthropic } from "@anthropic-ai/sdk";
import type { ModelInfo } from "@roo-code/types";
import { ApiStream } from "../transform/stream";
import type { ApiHandler, SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
/**
 * Human Relay API processor
 * This processor does not directly call the API, but interacts with the model through human operations copy and paste.
 */
export declare class HumanRelayHandler implements ApiHandler, SingleCompletionHandler {
    countTokens(_content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number>;
    /**
     * Create a message processing flow, display a dialog box to request human assistance
     * @param systemPrompt System prompt words
     * @param messages Message list
     * @param metadata Optional metadata
     */
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    /**
     * Get model information
     */
    getModel(): {
        id: string;
        info: ModelInfo;
    };
    /**
     * Implementation of a single prompt
     * @param prompt Prompt content
     */
    completePrompt(prompt: string): Promise<string>;
}
//# sourceMappingURL=human-relay.d.ts.map