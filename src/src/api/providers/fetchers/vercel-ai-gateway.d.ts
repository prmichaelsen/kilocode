import { z } from "zod";
import type { ModelInfo } from "@roo-code/types";
import type { ApiHandlerOptions } from "../../../shared/api";
/**
 * VercelAiGatewayModel
 */
declare const vercelAiGatewayModelSchema: any;
export type VercelAiGatewayModel = z.infer<typeof vercelAiGatewayModelSchema>;
/**
 * getVercelAiGatewayModels
 */
export declare function getVercelAiGatewayModels(options?: ApiHandlerOptions): Promise<Record<string, ModelInfo>>;
/**
 * parseVercelAiGatewayModel
 */
export declare const parseVercelAiGatewayModel: ({ id, model }: {
    id: string;
    model: VercelAiGatewayModel;
}) => ModelInfo;
export {};
//# sourceMappingURL=vercel-ai-gateway.d.ts.map