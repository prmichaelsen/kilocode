import { Mode } from "../../../shared/modes";
export type PromptVariables = {
    workspace?: string;
    mode?: string;
    language?: string;
    shell?: string;
    operatingSystem?: string;
};
/**
 * Get the path to a system prompt file for a specific mode
 */
export declare function getSystemPromptFilePath(cwd: string, mode: Mode): string;
/**
 * Loads custom system prompt from a file at .kilocode/system-prompt-[mode slug]
 * If the file doesn't exist, returns an empty string
 */
export declare function loadSystemPromptFile(cwd: string, mode: Mode, variables: PromptVariables): Promise<string>;
/**
 * Ensures the .kilocode directory exists, creating it if necessary
 */
export declare function ensureRooDirectory(cwd: string): Promise<void>;
//# sourceMappingURL=custom-system-prompt.d.ts.map