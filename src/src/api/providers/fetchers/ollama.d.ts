import { ModelInfo } from "@roo-code/types";
import { z } from "zod";
declare const OllamaModelInfoResponseSchema: any;
type OllamaModelInfoResponse = z.infer<typeof OllamaModelInfoResponseSchema>;
export declare const parseOllamaModel: (rawModel: OllamaModelInfoResponse, baseUrl?: string, numCtx?: number) => ModelInfo;
export declare function getOllamaModels(baseUrl?: string, apiKey?: string, numCtx?: number): Promise<Record<string, ModelInfo>>;
export {};
//# sourceMappingURL=ollama.d.ts.map