import { ToolProgressStatus } from "@roo-code/types";
import { ToolUse, DiffStrategy, DiffResult } from "../../../shared/tools";
export declare class MultiSearchReplaceDiffStrategy implements DiffStrategy {
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
    applyDiff(originalContent: string, diffContent: string, _paramStartLine?: number, _paramEndLine?: number): Promise<DiffResult>;
    getProgressStatus(toolUse: ToolUse, result?: DiffResult): ToolProgressStatus;
}
//# sourceMappingURL=multi-search-replace.d.ts.map