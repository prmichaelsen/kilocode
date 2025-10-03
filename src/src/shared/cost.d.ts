import type { ModelInfo } from "@roo-code/types";
export declare function calculateApiCostAnthropic(modelInfo: ModelInfo, inputTokens: number, outputTokens: number, cacheCreationInputTokens?: number, cacheReadInputTokens?: number): number;
export declare function calculateApiCostOpenAI(modelInfo: ModelInfo, inputTokens: number, outputTokens: number, cacheCreationInputTokens?: number, cacheReadInputTokens?: number): number;
export declare const parseApiPrice: (price: any) => number;
//# sourceMappingURL=cost.d.ts.map