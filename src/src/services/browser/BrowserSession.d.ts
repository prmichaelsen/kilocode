import * as vscode from "vscode";
import { Page } from "puppeteer-core";
import { BrowserActionResult } from "../../shared/ExtensionMessage";
export declare class BrowserSession {
    private context;
    private browser?;
    private page?;
    private currentMousePosition?;
    private lastConnectionAttempt?;
    private isUsingRemoteBrowser;
    constructor(context: vscode.ExtensionContext);
    private ensureChromiumExists;
    /**
     * Gets the viewport size from global state or returns default
     */
    private getViewport;
    /**
     * Launches a local browser instance
     */
    private launchLocalBrowser;
    /**
     * Connects to a browser using a WebSocket URL
     */
    private connectWithChromeHostUrl;
    /**
     * Attempts to connect to a remote browser using various methods
     * Returns true if connection was successful, false otherwise
     */
    private connectToRemoteBrowser;
    launchBrowser(): Promise<void>;
    /**
     * Closes the browser and resets browser state
     */
    closeBrowser(): Promise<BrowserActionResult>;
    /**
     * Resets all browser state variables
     */
    private resetBrowserState;
    doAction(action: (page: Page) => Promise<void>): Promise<BrowserActionResult>;
    /**
     * Extract the root domain from a URL
     * e.g., http://localhost:3000/path -> localhost:3000
     * e.g., https://example.com/path -> example.com
     */
    private getRootDomain;
    /**
     * Navigate to a URL with standard loading options
     */
    private navigatePageToUrl;
    /**
     * Creates a new tab and navigates to the specified URL
     */
    private createNewTab;
    navigateToUrl(url: string): Promise<BrowserActionResult>;
    private waitTillHTMLStable;
    /**
     * Handles mouse interaction with network activity monitoring
     */
    private handleMouseInteraction;
    click(coordinate: string): Promise<BrowserActionResult>;
    type(text: string): Promise<BrowserActionResult>;
    /**
     * Scrolls the page by the specified amount
     */
    private scrollPage;
    scrollDown(): Promise<BrowserActionResult>;
    scrollUp(): Promise<BrowserActionResult>;
    hover(coordinate: string): Promise<BrowserActionResult>;
    resize(size: string): Promise<BrowserActionResult>;
}
//# sourceMappingURL=BrowserSession.d.ts.map