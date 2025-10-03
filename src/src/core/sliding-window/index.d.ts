import { Anthropic } from "@anthropic-ai/sdk";
import { ApiHandler } from "../../api";
import { SummarizeResponse } from "../condense";
import { ApiMessage } from "../task-persistence/apiMessages";
/**
 * Default percentage of the context window to use as a buffer when deciding when to truncate
 */
export declare const TOKEN_BUFFER_PERCENTAGE = 0.1;
/**
 * Counts tokens for user content using the provider's token counting implementation.
 *
 * @param {Array<Anthropic.Messages.ContentBlockParam>} content - The content to count tokens for
 * @param {ApiHandler} apiHandler - The API handler to use for token counting
 * @returns {Promise<number>} A promise resolving to the token count
 */
export declare function estimateTokenCount(content: Array<Anthropic.Messages.ContentBlockParam>, apiHandler: ApiHandler): Promise<number>;
/**
 * Truncates a conversation by removing a fraction of the messages.
 *
 * The first message is always retained, and a specified fraction (rounded to an even number)
 * of messages from the beginning (excluding the first) is removed.
 *
 * @param {ApiMessage[]} messages - The conversation messages.
 * @param {number} fracToRemove - The fraction (between 0 and 1) of messages (excluding the first) to remove.
 * @param {string} taskId - The task ID for the conversation, used for telemetry
 * @returns {ApiMessage[]} The truncated conversation messages.
 */
export declare function truncateConversation(messages: ApiMessage[], fracToRemove: number, taskId: string): ApiMessage[];
/**
 * Conditionally truncates the conversation messages if the total token count
 * exceeds the model's limit, considering the size of incoming content.
 *
 * @param {ApiMessage[]} messages - The conversation messages.
 * @param {number} totalTokens - The total number of tokens in the conversation (excluding the last user message).
 * @param {number} contextWindow - The context window size.
 * @param {number} maxTokens - The maximum number of tokens allowed.
 * @param {ApiHandler} apiHandler - The API handler to use for token counting.
 * @param {boolean} autoCondenseContext - Whether to use LLM summarization or sliding window implementation
 * @param {string} systemPrompt - The system prompt, used for estimating the new context size after summarizing.
 * @returns {ApiMessage[]} The original or truncated conversation messages.
 */
type TruncateOptions = {
    messages: ApiMessage[];
    totalTokens: number;
    contextWindow: number;
    maxTokens?: number | null;
    apiHandler: ApiHandler;
    autoCondenseContext: boolean;
    autoCondenseContextPercent: number;
    systemPrompt: string;
    taskId: string;
    customCondensingPrompt?: string;
    condensingApiHandler?: ApiHandler;
    profileThresholds: Record<string, number>;
    currentProfileId: string;
};
type TruncateResponse = SummarizeResponse & {
    prevContextTokens: number;
};
/**
 * Conditionally truncates the conversation messages if the total token count
 * exceeds the model's limit, considering the size of incoming content.
 *
 * @param {TruncateOptions} options - The options for truncation
 * @returns {Promise<ApiMessage[]>} The original or truncated conversation messages.
 */
export declare function truncateConversationIfNeeded({ messages, totalTokens, contextWindow, maxTokens, apiHandler, autoCondenseContext, autoCondenseContextPercent, systemPrompt, taskId, customCondensingPrompt, condensingApiHandler, profileThresholds, currentProfileId, }: TruncateOptions): Promise<TruncateResponse>;
export {};
//# sourceMappingURL=index.d.ts.map