import { UrlContentFetcher } from "../../services/browser/UrlContentFetcher";
import { FileContextTracker } from "../context-tracking/FileContextTracker";
import { RooIgnoreController } from "../ignore/RooIgnoreController";
export declare function openMention(cwd: string, mention?: string): Promise<void>;
export declare function parseMentions(text: string, cwd: string, urlContentFetcher: UrlContentFetcher, fileContextTracker?: FileContextTracker, rooIgnoreController?: RooIgnoreController, showRooIgnoredFiles?: boolean, includeDiagnosticMessages?: boolean, maxDiagnosticMessages?: number, maxReadFileLine?: number): Promise<string>;
/**
 * Gets the contents of the active terminal
 * @returns The terminal contents as a string
 */
export declare function getLatestTerminalOutput(): Promise<string>;
export { processUserContentMentions } from "./processUserContentMentions";
//# sourceMappingURL=index.d.ts.map