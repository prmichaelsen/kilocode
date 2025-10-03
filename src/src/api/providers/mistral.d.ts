import { Anthropic } from "@anthropic-ai/sdk";
import { ApiHandlerOptions } from "../../shared/api";
import { ApiStream } from "../transform/stream";
import { BaseProvider } from "./base-provider";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
export declare class MistralHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private client;
    constructor(options: ApiHandlerOptions);
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    getModel(): {
        id: string;
        info: {
            readonly maxTokens: 41000;
            readonly contextWindow: 41000;
            readonly supportsImages: false;
            readonly supportsPromptCache: false;
            readonly inputPrice: 2;
            readonly outputPrice: 5;
        } | {
            readonly maxTokens: 131000;
            readonly contextWindow: 131000;
            readonly supportsImages: true;
            readonly supportsPromptCache: false;
            readonly inputPrice: 0.4;
            readonly outputPrice: 2;
        } | {
            readonly maxTokens: 256000;
            readonly contextWindow: 256000;
            readonly supportsImages: false;
            readonly supportsPromptCache: false;
            readonly inputPrice: 0.3;
            readonly outputPrice: 0.9;
        } | {
            readonly maxTokens: 131000;
            readonly contextWindow: 131000;
            readonly supportsImages: false;
            readonly supportsPromptCache: false;
            readonly inputPrice: 2;
            readonly outputPrice: 6;
        } | {
            readonly maxTokens: 131000;
            readonly contextWindow: 131000;
            readonly supportsImages: false;
            readonly supportsPromptCache: false;
            readonly inputPrice: 0.1;
            readonly outputPrice: 0.1;
        } | {
            readonly maxTokens: 131000;
            readonly contextWindow: 131000;
            readonly supportsImages: false;
            readonly supportsPromptCache: false;
            readonly inputPrice: 0.04;
            readonly outputPrice: 0.04;
        } | {
            readonly maxTokens: 32000;
            readonly contextWindow: 32000;
            readonly supportsImages: false;
            readonly supportsPromptCache: false;
            readonly inputPrice: 0.2;
            readonly outputPrice: 0.6;
        } | {
            readonly maxTokens: 40960;
            readonly contextWindow: 40960;
            readonly supportsImages: false;
            readonly supportsPromptCache: false;
            readonly inputPrice: 0.5;
            readonly outputPrice: 1.5;
        } | {
            readonly maxTokens: 131000;
            readonly contextWindow: 131000;
            readonly supportsImages: false;
            readonly supportsPromptCache: false;
            readonly inputPrice: 0.1;
            readonly outputPrice: 0.3;
        } | {
            readonly maxTokens: 131000;
            readonly contextWindow: 131000;
            readonly supportsImages: true;
            readonly supportsPromptCache: false;
            readonly inputPrice: 2;
            readonly outputPrice: 6;
        };
        maxTokens: 32000 | 256000 | 40960 | 41000 | 131000;
        temperature: number;
    };
    completePrompt(prompt: string): Promise<string>;
}
//# sourceMappingURL=mistral.d.ts.map