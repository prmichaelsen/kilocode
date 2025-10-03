import type { TokenUsage, ClineMessage } from "@roo-code/types";
export type ParsedApiReqStartedTextType = {
    tokensIn: number;
    tokensOut: number;
    cacheWrites: number;
    cacheReads: number;
    cost?: number;
    apiProtocol?: "anthropic" | "openai";
};
/**
 * Calculates API metrics from an array of ClineMessages.
 *
 * This function processes 'condense_context' messages and 'api_req_started' messages that have been
 * combined with their corresponding 'api_req_finished' messages by the combineApiRequests function.
 * It extracts and sums up the tokensIn, tokensOut, cacheWrites, cacheReads, and cost from these messages.
 *
 * @param messages - An array of ClineMessage objects to process.
 * @returns An ApiMetrics object containing totalTokensIn, totalTokensOut, totalCacheWrites, totalCacheReads, totalCost, and contextTokens.
 *
 * @example
 * const messages = [
 *   { type: "say", say: "api_req_started", text: '{"request":"GET /api/data","tokensIn":10,"tokensOut":20,"cost":0.005}', ts: 1000 }
 * ];
 * const { totalTokensIn, totalTokensOut, totalCost } = getApiMetrics(messages);
 * // Result: { totalTokensIn: 10, totalTokensOut: 20, totalCost: 0.005 }
 */
export declare function getApiMetrics(messages: ClineMessage[]): {
    totalTokensIn?: number;
    totalTokensOut?: number;
    totalCacheWrites?: number;
    totalCacheReads?: number;
    totalCost?: number;
    contextTokens?: number;
};
/**
 * Check if token usage has changed by comparing relevant properties.
 * @param current - Current token usage data
 * @param snapshot - Previous snapshot to compare against
 * @returns true if any relevant property has changed or snapshot is undefined
 */
export declare function hasTokenUsageChanged(current: TokenUsage, snapshot?: TokenUsage): boolean;
//# sourceMappingURL=getApiMetrics.d.ts.map