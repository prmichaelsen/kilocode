import { Anthropic } from "@anthropic-ai/sdk";
import { UrlContentFetcher } from "../../services/browser/UrlContentFetcher";
import { FileContextTracker } from "../context-tracking/FileContextTracker";
/**
 * Process mentions in user content, specifically within task and feedback tags
 */
export declare function processUserContentMentions({ userContent, cwd, urlContentFetcher, fileContextTracker, rooIgnoreController, showRooIgnoredFiles, includeDiagnosticMessages, maxDiagnosticMessages, maxReadFileLine, }: {
    userContent: Anthropic.Messages.ContentBlockParam[];
    cwd: string;
    urlContentFetcher: UrlContentFetcher;
    fileContextTracker: FileContextTracker;
    rooIgnoreController?: any;
    showRooIgnoredFiles?: boolean;
    includeDiagnosticMessages?: boolean;
    maxDiagnosticMessages?: number;
    maxReadFileLine?: number;
}): Promise<(Anthropic.Messages.TextBlockParam | Anthropic.Messages.ImageBlockParam | Anthropic.Messages.ToolUseBlockParam | Anthropic.Messages.ServerToolUseBlockParam | Anthropic.Messages.WebSearchToolResultBlockParam | Anthropic.Messages.ToolResultBlockParam | Anthropic.Messages.DocumentBlockParam | Anthropic.Messages.ThinkingBlockParam | Anthropic.Messages.RedactedThinkingBlockParam)[]>;
//# sourceMappingURL=processUserContentMentions.d.ts.map