import { Anthropic } from "@anthropic-ai/sdk";
import { type ReasoningEffortWithMinimal } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../shared/api";
import { ApiStream } from "../transform/stream";
import { BaseProvider } from "./base-provider";
import type { SingleCompletionHandler, ApiHandlerCreateMessageMetadata } from "../index";
export type OpenAiNativeModel = ReturnType<OpenAiNativeHandler["getModel"]>;
export declare class OpenAiNativeHandler extends BaseProvider implements SingleCompletionHandler {
    protected options: ApiHandlerOptions;
    private client;
    private lastResponseId;
    private responseIdPromise;
    private responseIdResolver;
    private lastServiceTier;
    private readonly coreHandledEventTypes;
    constructor(options: ApiHandlerOptions);
    private normalizeUsage;
    private resolveResponseId;
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    private handleResponsesApiMessage;
    private buildRequestBody;
    private executeRequest;
    private formatFullConversation;
    private formatSingleStructuredMessage;
    private makeGpt5ResponsesAPIRequest;
    /**
     * Prepares the input and conversation continuity parameters for a Responses API call.
     * Decides whether to send full conversation or just the latest message based on previousResponseId.
     *
     * - If a `previousResponseId` is available (either from metadata or the handler's state),
     *   it formats only the most recent user message for the input and returns the response ID
     *   to maintain conversation context.
     * - Otherwise, it formats the entire conversation history (system prompt + messages) for the input.
     *
     * @returns An object containing the formatted input and the previous response ID (if used).
     */
    private prepareStructuredInput;
    /**
     * Handles the streaming response from the Responses API.
     *
     * This function iterates through the Server-Sent Events (SSE) stream, parses each event,
     * and yields structured data chunks (`ApiStream`). It handles a wide variety of event types,
     * including text deltas, reasoning, usage data, and various status/tool events.
     */
    private handleStreamResponse;
    /**
     * Shared processor for Responses API events.
     */
    private processEvent;
    private getReasoningEffort;
    /**
     * Returns a shallow-cloned ModelInfo with pricing overridden for the given tier, if available.
     * If no tier or no overrides exist, the original ModelInfo is returned.
     */
    private applyServiceTierPricing;
    getModel(): {
        verbosity: "low" | "medium" | "high";
        format: "openai";
        reasoning: import("../transform/reasoning").OpenAiReasoningParams | undefined;
        maxTokens: number | undefined;
        temperature: number | undefined;
        reasoningEffort: ReasoningEffortWithMinimal | undefined;
        reasoningBudget: number | undefined;
        id: "gpt-5-chat-latest" | "gpt-5-2025-08-07" | "gpt-5-mini-2025-08-07" | "gpt-5-nano-2025-08-07" | "gpt-5-codex" | "gpt-4.1" | "gpt-4.1-mini" | "gpt-4.1-nano" | "o3" | "o3-high" | "o3-low" | "o4-mini" | "o4-mini-high" | "o4-mini-low" | "o3-mini" | "o3-mini-high" | "o3-mini-low" | "o1" | "o1-preview" | "o1-mini" | "gpt-4o" | "gpt-4o-mini" | "codex-mini-latest";
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
    /**
     * Gets the last response ID captured from the Responses API stream.
     * Used for maintaining conversation continuity across requests.
     * @returns The response ID, or undefined if not available yet
     */
    getLastResponseId(): string | undefined;
    /**
     * Sets the last response ID for conversation continuity.
     * Typically only used in tests or special flows.
     * @param responseId The response ID to store
     */
    setResponseId(responseId: string): void;
    completePrompt(prompt: string): Promise<string>;
}
//# sourceMappingURL=openai-native.d.ts.map