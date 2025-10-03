import { Anthropic } from "@anthropic-ai/sdk";
import { RooIgnoreController } from "../ignore/RooIgnoreController";
import { RooProtectedController } from "../protect/RooProtectedController";
export declare const formatResponse: {
    duplicateFileReadNotice: () => string;
    contextTruncationNotice: () => string;
    condense: () => string;
    toolDenied: () => string;
    toolDeniedWithFeedback: (feedback?: string) => string;
    toolApprovedWithFeedback: (feedback?: string) => string;
    toolError: (error?: string) => string;
    rooIgnoreError: (path: string) => string;
    noToolsUsed: () => string;
    tooManyMistakes: (feedback?: string) => string;
    missingToolParameterError: (paramName: string) => string;
    lineCountTruncationError: (actualLineCount: number, isNewFile: boolean, diffStrategyEnabled?: boolean) => string;
    invalidMcpToolArgumentError: (serverName: string, toolName: string) => string;
    unknownMcpToolError: (serverName: string, toolName: string, availableTools: string[]) => string;
    unknownMcpServerError: (serverName: string, availableServers: string[]) => string;
    toolResult: (text: string, images?: string[]) => string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam>;
    imageBlocks: (images?: string[]) => Anthropic.ImageBlockParam[];
    formatFilesList: (absolutePath: string, files: string[], didHitLimit: boolean, rooIgnoreController: RooIgnoreController | undefined, showRooIgnoredFiles: boolean, rooProtectedController?: RooProtectedController) => string;
    createPrettyPatch: (filename?: string, oldStr?: string, newStr?: string) => any;
};
//# sourceMappingURL=responses.d.ts.map