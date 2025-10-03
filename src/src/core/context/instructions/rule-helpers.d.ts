import { ClineRulesToggles } from "../../../shared/cline-rules";
/**
 * Recursively traverses directory and finds all files, including checking for optional whitelisted file extension
 */
export declare function readDirectoryRecursive(directoryPath: string, allowedFileExtension: string, excludedPaths?: string[][]): Promise<string[]>;
/**
 * Gets the up to date toggles
 */
export declare function synchronizeRuleToggles(rulesDirectoryPath: string, currentToggles: ClineRulesToggles, allowedFileExtension?: string, excludedPaths?: string[][]): Promise<ClineRulesToggles>;
//# sourceMappingURL=rule-helpers.d.ts.map