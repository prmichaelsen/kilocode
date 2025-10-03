import { RouterName, ModelRecord } from "../../../shared/api";
export declare const getModelEndpoints: ({ router, modelId, endpoint, }: {
    router: RouterName;
    modelId?: string;
    endpoint?: string;
}) => Promise<ModelRecord>;
export declare const flushModelProviders: (router: RouterName, modelId: string) => Promise<any>;
//# sourceMappingURL=modelEndpointCache.d.ts.map