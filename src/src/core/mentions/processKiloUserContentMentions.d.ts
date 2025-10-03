import { Anthropic } from "@anthropic-ai/sdk";
import { UrlContentFetcher } from "../../services/browser/UrlContentFetcher";
import { FileContextTracker } from "../context-tracking/FileContextTracker";
import * as vscode from "vscode";
export declare function processKiloUserContentMentions({ context, // kilocode_change
userContent, cwd, urlContentFetcher, fileContextTracker, rooIgnoreController, showRooIgnoredFiles, includeDiagnosticMessages, maxDiagnosticMessages, maxReadFileLine, }: {
    context: vscode.ExtensionContext;
    userContent: Anthropic.Messages.ContentBlockParam[];
    cwd: string;
    urlContentFetcher: UrlContentFetcher;
    fileContextTracker: FileContextTracker;
    rooIgnoreController?: any;
    showRooIgnoredFiles: boolean;
    includeDiagnosticMessages?: boolean;
    maxDiagnosticMessages?: number;
    maxReadFileLine?: number;
}): Promise<[Anthropic.Messages.ContentBlockParam[], boolean]>;
//# sourceMappingURL=processKiloUserContentMentions.d.ts.map