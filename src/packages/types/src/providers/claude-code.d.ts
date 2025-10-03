/**
 * Converts Claude model names from hyphen-date format to Vertex AI's @-date format.
 *
 * @param modelName - The original model name (e.g., "claude-sonnet-4-20250514")
 * @returns The converted model name for Vertex AI (e.g., "claude-sonnet-4@20250514")
 *
 * @example
 * convertModelNameForVertex("claude-sonnet-4-20250514") // returns "claude-sonnet-4@20250514"
 * convertModelNameForVertex("claude-model") // returns "claude-model" (no change)
 */
export declare function convertModelNameForVertex(modelName: string): string;
export type ClaudeCodeModelId = keyof typeof claudeCodeModels;
export declare const claudeCodeDefaultModelId: ClaudeCodeModelId;
export declare const CLAUDE_CODE_DEFAULT_MAX_OUTPUT_TOKENS = 16000;
/**
 * Gets the appropriate model ID based on whether Vertex AI is being used.
 *
 * @param baseModelId - The base Claude Code model ID
 * @param useVertex - Whether to format the model ID for Vertex AI (default: false)
 * @returns The model ID, potentially formatted for Vertex AI
 *
 * @example
 * getClaudeCodeModelId("claude-sonnet-4-20250514", true) // returns "claude-sonnet-4@20250514"
 * getClaudeCodeModelId("claude-sonnet-4-20250514", false) // returns "claude-sonnet-4-20250514"
 */
export declare function getClaudeCodeModelId(baseModelId: ClaudeCodeModelId, useVertex?: boolean): string;
export declare const claudeCodeModels: {
    readonly "claude-sonnet-4-5": {
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly supportsReasoningEffort: false;
        readonly supportsReasoningBudget: false;
        readonly requiredReasoningBudget: false;
        readonly maxTokens: 64000;
        readonly contextWindow: 200000;
        readonly supportsComputerUse: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
        readonly tiers: [{
            readonly contextWindow: 1000000;
            readonly inputPrice: 6;
            readonly outputPrice: 22.5;
            readonly cacheWritesPrice: 7.5;
            readonly cacheReadsPrice: 0.6;
        }];
    };
    readonly "claude-sonnet-4-20250514": {
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly supportsReasoningEffort: false;
        readonly supportsReasoningBudget: false;
        readonly requiredReasoningBudget: false;
        readonly maxTokens: 64000;
        readonly contextWindow: 200000;
        readonly supportsComputerUse: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
        readonly tiers: [{
            readonly contextWindow: 1000000;
            readonly inputPrice: 6;
            readonly outputPrice: 22.5;
            readonly cacheWritesPrice: 7.5;
            readonly cacheReadsPrice: 0.6;
        }];
    };
    readonly "claude-opus-4-1-20250805": {
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly supportsReasoningEffort: false;
        readonly supportsReasoningBudget: false;
        readonly requiredReasoningBudget: false;
        readonly maxTokens: 32000;
        readonly contextWindow: 200000;
        readonly supportsComputerUse: true;
        readonly inputPrice: 15;
        readonly outputPrice: 75;
        readonly cacheWritesPrice: 18.75;
        readonly cacheReadsPrice: 1.5;
    };
    readonly "claude-opus-4-20250514": {
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly supportsReasoningEffort: false;
        readonly supportsReasoningBudget: false;
        readonly requiredReasoningBudget: false;
        readonly maxTokens: 32000;
        readonly contextWindow: 200000;
        readonly supportsComputerUse: true;
        readonly inputPrice: 15;
        readonly outputPrice: 75;
        readonly cacheWritesPrice: 18.75;
        readonly cacheReadsPrice: 1.5;
    };
    readonly "claude-3-7-sonnet-20250219": {
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly supportsReasoningEffort: false;
        readonly supportsReasoningBudget: false;
        readonly requiredReasoningBudget: false;
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsComputerUse: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
    };
    readonly "claude-3-5-sonnet-20241022": {
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly supportsReasoningEffort: false;
        readonly supportsReasoningBudget: false;
        readonly requiredReasoningBudget: false;
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly supportsComputerUse: true;
        readonly inputPrice: 3;
        readonly outputPrice: 15;
        readonly cacheWritesPrice: 3.75;
        readonly cacheReadsPrice: 0.3;
    };
    readonly "claude-3-5-haiku-20241022": {
        readonly supportsImages: false;
        readonly supportsPromptCache: true;
        readonly supportsReasoningEffort: false;
        readonly supportsReasoningBudget: false;
        readonly requiredReasoningBudget: false;
        readonly maxTokens: 8192;
        readonly contextWindow: 200000;
        readonly inputPrice: 1;
        readonly outputPrice: 5;
        readonly cacheWritesPrice: 1.25;
        readonly cacheReadsPrice: 0.1;
    };
};
//# sourceMappingURL=claude-code.d.ts.map