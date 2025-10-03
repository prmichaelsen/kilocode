import { z } from "zod";
import type { ModelRecord } from "../../../shared/api";
declare const ioIntelligenceModelSchema: any;
export type IOIntelligenceModel = z.infer<typeof ioIntelligenceModelSchema>;
/**
 * Fetches available models from IO Intelligence
 * <mcreference link="https://docs.io.net/reference/get-started-with-io-intelligence-api" index="1">1</mcreference>
 */
export declare function getIOIntelligenceModels(apiKey?: string): Promise<ModelRecord>;
export declare function getCachedIOIntelligenceModels(): ModelRecord | null;
export declare function clearIOIntelligenceCache(): void;
export {};
//# sourceMappingURL=io-intelligence.d.ts.map