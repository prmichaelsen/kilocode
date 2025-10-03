import { ContextProxy } from "../config/ContextProxy";
import type { RecordSource, TaskMetadata } from "./FileContextTrackerTypes";
import { ClineProvider } from "../webview/ClineProvider";
export declare class FileContextTracker {
    readonly taskId: string;
    private providerRef;
    private fileWatchers;
    private recentlyModifiedFiles;
    private recentlyEditedByRoo;
    private checkpointPossibleFiles;
    constructor(provider: ClineProvider, taskId: string);
    private getCwd;
    setupFileWatcher(filePath: string): Promise<void>;
    trackFileContext(filePath: string, operation: RecordSource): Promise<void>;
    getContextProxy(): ContextProxy | undefined;
    getTaskMetadata(taskId: string): Promise<TaskMetadata>;
    saveTaskMetadata(taskId: string, metadata: TaskMetadata): Promise<void>;
    addFileToFileContextTracker(taskId: string, filePath: string, source: RecordSource): Promise<void>;
    getAndClearRecentlyModifiedFiles(): string[];
    getAndClearCheckpointPossibleFile(): string[];
    markFileAsEditedByRoo(filePath: string): void;
    dispose(): void;
}
//# sourceMappingURL=FileContextTracker.d.ts.map