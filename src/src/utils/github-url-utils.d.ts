/**
 * github-url-utils.ts
 *
 * Portable utility functions for creating and opening GitHub issue URLs
 * with proper URL encoding that bypasses VS Code's URI handling issues.
 *
 * This utility addresses a longstanding issue in VS Code's URI handling:
 * https://github.com/microsoft/vscode/issues/85930
 *
 * The issue causes URLs with special characters in query parameters to be incorrectly
 * encoded when opened through VS Code's standard APIs (vscode.Uri.parse followed by
 * vscode.env.openExternal). This particularly affects GitHub issue URLs with pre-filled
 * fields containing special characters.
 */
/**
 * Creates a properly encoded GitHub issue URL.
 *
 * This function manually encodes each parameter value using encodeURIComponent()
 * to ensure consistent and correct encoding of all special characters. This is
 * necessary because VS Code's URI handling (vscode.Uri.parse) has issues with
 * encoding/decoding URL parameters, as documented in:
 * https://github.com/microsoft/vscode/issues/85930
 *
 * Specifically, VS Code's URI handling:
 * - Double-encodes some characters like # (hash) becoming %2523 instead of %23
 * - Inconsistently handles other characters like & (ampersand) and + (plus)
 * - Can corrupt query parameters containing special characters
 *
 * @param baseUrl The base GitHub repository URL (e.g., 'https://github.com/owner/repo/issues/new')
 * @param params Map of parameter names to values for the issue form
 * @returns The properly encoded full URL
 */
export declare function createGitHubIssueUrl(baseUrl: string, params: Map<string, string>): string;
/**
 * Opens a URL using platform-specific commands to bypass VS Code's URI handling issues.
 *
 * IMPORTANT: This function intentionally avoids using VS Code's built-in URI handling
 * (vscode.Uri.parse() and vscode.env.openExternal()) due to known encoding issues with URLs
 * that contain special characters in query parameters. See:
 * https://github.com/microsoft/vscode/issues/85930
 *
 * The specific issues with VS Code's URI handling include:
 * 1. Double-encoding of certain characters (e.g., # becomes %23 then %2523)
 * 2. Inconsistent handling where some characters are encoded and others are decoded
 * 3. Issues with parameters in the query string being incorrectly processed
 *
 * Instead, this function:
 * - Uses direct OS commands to open the browser with the URL
 * - Preserves the exact encoding of the URL as provided
 * - Provides multiple fallback approaches if the primary method fails
 *
 * @param url The URL to open
 * @returns A promise that resolves when an attempt to open the URL has completed
 */
export declare function openUrlInBrowser(url: string): Promise<void>;
/**
 * Utility function to create and open a GitHub issue with the specified parameters.
 *
 * This is a high-level function that combines URL creation and opening while
 * working around VS Code's URI handling limitations (issue #85930). It provides
 * a simple API for the common use case of opening GitHub issue templates with
 * pre-filled fields.
 *
 * The function:
 * 1. Constructs a correctly formatted GitHub issue URL
 * 2. Properly encodes all special characters in parameters
 * 3. Opens the URL directly using OS commands to avoid VS Code's problematic URI handling
 * 4. Provides fallback options if opening fails
 *
 * Reference for the VS Code URI handling issue:
 * https://github.com/microsoft/vscode/issues/85930
 *
 * @param repoOwner GitHub repository owner/organization
 * @param repoName GitHub repository name
 * @param issueTemplate Template name to use (e.g., 'bug_report.yml')
 * @param params Map of parameter names to values for the issue form
 */
export declare function createAndOpenGitHubIssue(repoOwner: string, repoName: string, issueTemplate: string | null, params: Map<string, string>): Promise<void>;
//# sourceMappingURL=github-url-utils.d.ts.map