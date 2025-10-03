import { ApiHandler } from "../../api";
import { ApiMessage } from "../task-persistence/apiMessages";
export declare const N_MESSAGES_TO_KEEP = 3;
export declare const MIN_CONDENSE_THRESHOLD = 5;
export declare const MAX_CONDENSE_THRESHOLD = 100;
export type SummarizeResponse = {
    messages: ApiMessage[];
    summary: string;
    cost: number;
    newContextTokens?: number;
    error?: string;
};
/**
 * Summarizes the conversation messages using an LLM call
 *
 * @param {ApiMessage[]} messages - The conversation messages
 * @param {ApiHandler} apiHandler - The API handler to use for token counting.
 * @param {string} systemPrompt - The system prompt for API requests, which should be considered in the context token count
 * @param {string} taskId - The task ID for the conversation, used for telemetry
 * @param {boolean} isAutomaticTrigger - Whether the summarization is triggered automatically
 * @returns {SummarizeResponse} - The result of the summarization operation (see above)
 */
/**
 * Summarizes the conversation messages using an LLM call
 *
 * @param {ApiMessage[]} messages - The conversation messages
 * @param {ApiHandler} apiHandler - The API handler to use for token counting (fallback if condensingApiHandler not provided)
 * @param {string} systemPrompt - The system prompt for API requests (fallback if customCondensingPrompt not provided)
 * @param {string} taskId - The task ID for the conversation, used for telemetry
 * @param {number} prevContextTokens - The number of tokens currently in the context, used to ensure we don't grow the context
 * @param {boolean} isAutomaticTrigger - Whether the summarization is triggered automatically
 * @param {string} customCondensingPrompt - Optional custom prompt to use for condensing
 * @param {ApiHandler} condensingApiHandler - Optional specific API handler to use for condensing
 * @returns {SummarizeResponse} - The result of the summarization operation (see above)
 */
export declare function summarizeConversation(messages: ApiMessage[], apiHandler: ApiHandler, systemPrompt: string, taskId: string, prevContextTokens: number, isAutomaticTrigger?: boolean, customCondensingPrompt?: string, condensingApiHandler?: ApiHandler): Promise<SummarizeResponse>;
export declare function getMessagesSinceLastSummary(messages: ApiMessage[]): ApiMessage[];
//# sourceMappingURL=index.d.ts.map