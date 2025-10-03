import type { Anthropic } from "@anthropic-ai/sdk";
import type { ApiHandlerOptions } from "../../shared/api";
import type { ApiStream } from "../transform/stream";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
import { BaseProvider } from "./base-provider";
export declare class GeminiCliHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private authClient;
    private projectId;
    private credentials;
    private oauthClientId;
    private oauthClientSecret;
    constructor(options: ApiHandlerOptions);
    private fetchOAuthConfig;
    private loadOAuthCredentials;
    private ensureAuthenticated;
    /**
     * Call a Code Assist API endpoint
     */
    private callEndpoint;
    /**
     * Discover or retrieve the project ID
     */
    private discoverProjectId;
    /**
     * Parse Server-Sent Events from a stream
     */
    private parseSSEStream;
    createMessage(systemInstruction: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    getModel(): {
        format: "gemini";
        reasoning: import("../transform/reasoning").GeminiReasoningParams | undefined;
        maxTokens: number | undefined;
        temperature: number | undefined;
        reasoningEffort: import("@roo-code/types").ReasoningEffortWithMinimal | undefined;
        reasoningBudget: number | undefined;
        verbosity: import("@roo-code/types").VerbosityLevel | undefined;
        id: "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-2.0-flash-001" | "gemini-2.0-flash-thinking-exp-01-21" | "gemini-2.0-flash-thinking-exp-1219" | "gemini-2.0-flash-exp" | "gemini-1.5-flash-002" | "gemini-1.5-flash-exp-0827" | "gemini-1.5-flash-8b-exp-0827" | "gemini-1.5-pro-002" | "gemini-1.5-pro-exp-0827" | "gemini-exp-1206";
        info: {
            maxTokens?: number;
            maxThinkingTokens?: number;
            contextWindow?: number;
            supportsImages?: boolean;
            supportsComputerUse?: boolean;
            supportsPromptCache?: boolean;
            supportsVerbosity?: boolean;
            supportsReasoningBudget?: boolean;
            supportsTemperature?: boolean;
            requiredReasoningBudget?: boolean;
            supportsReasoningEffort?: boolean;
            supportedParameters?: ("reasoning" | "max_tokens" | "temperature" | "include_reasoning")[];
            inputPrice?: number;
            outputPrice?: number;
            cacheWritesPrice?: number;
            cacheReadsPrice?: number;
            description?: string;
            reasoningEffort?: "low" | "medium" | "high";
            minTokensPerCachePoint?: number;
            maxCachePoints?: number;
            cachableFields?: string[];
            displayName?: string;
            preferredIndex?: number;
            tiers?: {
                name?: "default" | "flex" | "priority";
                contextWindow?: number;
                inputPrice?: number;
                outputPrice?: number;
                cacheWritesPrice?: number;
                cacheReadsPrice?: number;
            }[];
        };
    };
    completePrompt(prompt: string): Promise<string>;
    countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number>;
}
//# sourceMappingURL=gemini-cli.d.ts.map