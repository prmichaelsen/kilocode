import { Anthropic } from "@anthropic-ai/sdk";
export type ApiMessage = Anthropic.MessageParam & {
    ts?: number;
    isSummary?: boolean;
};
export declare function readApiMessages({ taskId, globalStoragePath, }: {
    taskId: string;
    globalStoragePath: string;
}): Promise<ApiMessage[]>;
export declare function saveApiMessages({ messages, taskId, globalStoragePath, }: {
    messages: ApiMessage[];
    taskId: string;
    globalStoragePath: string;
}): Promise<void>;
//# sourceMappingURL=apiMessages.d.ts.map