import { z } from "zod";
import { type ModelInfo } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../../shared/api";
declare const modelRouterBaseModelSchema: any;
export type OpenRouterBaseModel = z.infer<typeof modelRouterBaseModelSchema>;
/**
 * OpenRouterModel
 */
export declare const openRouterModelSchema: any;
export type OpenRouterModel = z.infer<typeof openRouterModelSchema>;
/**
 * OpenRouterModelEndpoint
 */
export declare const openRouterModelEndpointSchema: any;
export type OpenRouterModelEndpoint = z.infer<typeof openRouterModelEndpointSchema>;
/**
 * getOpenRouterModels
 */
export declare function getOpenRouterModels(options?: ApiHandlerOptions & {
    headers?: Record<string, string>;
}): Promise<Record<string, ModelInfo>>;
/**
 * getOpenRouterModelEndpoints
 */
export declare function getOpenRouterModelEndpoints(modelId: string, options?: ApiHandlerOptions): Promise<Record<string, ModelInfo>>;
/**
 * parseOpenRouterModel
 */
export declare const parseOpenRouterModel: ({ id, model, displayName, inputModality, outputModality, maxTokens, supportedParameters, }: {
    id: string;
    model: OpenRouterBaseModel;
    displayName?: string;
    inputModality: string[] | null | undefined;
    outputModality: string[] | null | undefined;
    maxTokens: number | null | undefined;
    supportedParameters?: string[];
}) => ModelInfo;
export {};
//# sourceMappingURL=openrouter.d.ts.map