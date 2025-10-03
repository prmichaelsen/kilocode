import type { ClineMessage } from "@roo-code/types";
export type TaskMetadataOptions = {
    taskId: string;
    rootTaskId?: string;
    parentTaskId?: string;
    taskNumber: number;
    messages: ClineMessage[];
    globalStoragePath: string;
    workspace: string;
    mode?: string;
};
export declare function taskMetadata({ taskId: id, rootTaskId, parentTaskId, taskNumber, messages, globalStoragePath, workspace, mode, }: TaskMetadataOptions): Promise<{
    historyItem: {
        number?: number;
        ts?: number;
        totalCost?: number;
        id?: string;
        rootTaskId?: string;
        parentTaskId?: string;
        task?: string;
        tokensIn?: number;
        tokensOut?: number;
        cacheWrites?: number;
        cacheReads?: number;
        size?: number;
        workspace?: string;
        isFavorited?: boolean;
        fileNotfound?: boolean;
        mode?: string;
    };
    tokenUsage: {
        totalTokensIn?: number;
        totalTokensOut?: number;
        totalCacheWrites?: number;
        totalCacheReads?: number;
        totalCost?: number;
        contextTokens?: number;
    };
}>;
//# sourceMappingURL=taskMetadata.d.ts.map