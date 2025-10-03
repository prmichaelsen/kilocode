import * as vscode from "vscode";
export declare class UrlContentFetcher {
    private context;
    private browser?;
    private page?;
    constructor(context: vscode.ExtensionContext);
    private ensureChromiumExists;
    launchBrowser(): Promise<void>;
    closeBrowser(): Promise<void>;
    urlToMarkdown(url: string): Promise<string>;
}
//# sourceMappingURL=UrlContentFetcher.d.ts.map