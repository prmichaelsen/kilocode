import { ToolProgressStatus } from "@roo-code/types";
import { ToolUse, DiffStrategy, DiffResult } from "../../../shared/tools";
export declare class MultiFileSearchReplaceDiffStrategy implements DiffStrategy {
    private fuzzyThreshold;
    private bufferLines;
    getName(): string;
    constructor(fuzzyThreshold?: number, bufferLines?: number);
    getToolDescription(args: {
        cwd: string;
        toolOptions?: {
            [key: string]: string;
        };
    }): string;
    private unescapeMarkers;
    private validateMarkerSequencing;
    applyDiff(originalContent: string, diffContent: string | Array<{
        content: string;
        startLine?: number;
    }>, _paramStartLine?: number, _paramEndLine?: number): Promise<DiffResult>;
    private applySingleDiff;
    getProgressStatus(toolUse: ToolUse, result?: DiffResult): ToolProgressStatus;
}
//# sourceMappingURL=multi-file-search-replace.d.ts.map