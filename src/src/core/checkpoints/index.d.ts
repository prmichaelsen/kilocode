import { Task } from "../task/Task";
import { RepoPerTaskCheckpointService } from "../../services/checkpoints";
export declare function getCheckpointService(task: Task, { interval, timeout }?: {
    interval?: number;
    timeout?: number;
}): Promise<RepoPerTaskCheckpointService>;
export declare function checkpointSave(task: Task, force?: boolean, suppressMessage?: boolean): Promise<any>;
export type CheckpointRestoreOptions = {
    ts: number;
    commitHash: string;
    mode: "preview" | "restore";
    operation?: "delete" | "edit";
};
export declare function checkpointRestore(task: Task, { ts, commitHash, mode, operation }: CheckpointRestoreOptions): Promise<void>;
export type CheckpointDiffOptions = {
    ts: number;
    previousCommitHash?: string;
    commitHash: string;
    mode: "full" | "checkpoint";
};
export declare function checkpointDiff(task: Task, { ts, previousCommitHash, commitHash, mode }: CheckpointDiffOptions): Promise<void>;
//# sourceMappingURL=index.d.ts.map