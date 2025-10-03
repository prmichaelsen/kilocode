import * as vscode from "vscode";
import { type GroupEntry, type ModeConfig, type CustomModePrompts, type ToolGroup, type PromptComponent } from "@roo-code/types";
export type Mode = string;
export declare function getGroupName(group: GroupEntry): ToolGroup;
export declare function doesFileMatchRegex(filePath: string, pattern: string): boolean;
export declare function getToolsForMode(groups: readonly GroupEntry[]): string[];
export declare const modes: readonly {
    name?: string;
    description?: string;
    slug?: string;
    roleDefinition?: string;
    whenToUse?: string;
    customInstructions?: string;
    groups?: ("command" | "read" | "edit" | "browser" | "mcp" | "modes" | ["command" | "read" | "edit" | "browser" | "mcp" | "modes", {
        description?: string;
        fileRegex?: string;
    }, ...unknown[]])[];
    source?: "global" | "project";
    iconName?: string;
}[];
export declare const defaultModeSlug = "code";
export declare function getModeBySlug(slug: string, customModes?: ModeConfig[]): ModeConfig | undefined;
export declare function getModeConfig(slug: string, customModes?: ModeConfig[]): ModeConfig;
export declare function getAllModes(customModes?: ModeConfig[]): ModeConfig[];
export declare function isCustomMode(slug: string, customModes?: ModeConfig[]): boolean;
/**
 * Find a mode by its slug, don't fall back to built-in modes
 */
export declare function findModeBySlug(slug: string, modes: readonly ModeConfig[] | undefined): ModeConfig | undefined;
/**
 * Get the mode selection based on the provided mode slug, prompt component, and custom modes.
 * If a custom mode is found, it takes precedence over the built-in modes.
 * If no custom mode is found, the built-in mode is used with partial merging from promptComponent.
 * If neither is found, the default mode is used.
 */
export declare function getModeSelection(mode: string, promptComponent?: PromptComponent, customModes?: ModeConfig[]): {
    roleDefinition: string;
    baseInstructions: string;
    description: string;
};
export declare class FileRestrictionError extends Error {
    constructor(mode: string, pattern: string, description: string | undefined, filePath: string, tool?: string);
}
export declare function isToolAllowedForMode(tool: string, modeSlug: string, customModes: ModeConfig[], toolRequirements?: Record<string, boolean>, toolParams?: Record<string, any>, // All tool parameters
experiments?: Record<string, boolean>): boolean;
export declare const defaultPrompts: Readonly<CustomModePrompts>;
export declare function getAllModesWithPrompts(context: vscode.ExtensionContext): Promise<ModeConfig[]>;
export declare function getFullModeDetails(modeSlug: string, customModes?: ModeConfig[], customModePrompts?: CustomModePrompts, options?: {
    cwd?: string;
    globalCustomInstructions?: string;
    language?: string;
}): Promise<ModeConfig>;
export declare function getRoleDefinition(modeSlug: string, customModes?: ModeConfig[]): string;
export declare function getDescription(modeSlug: string, customModes?: ModeConfig[]): string;
export declare function getWhenToUse(modeSlug: string, customModes?: ModeConfig[]): string;
export declare function getCustomInstructions(modeSlug: string, customModes?: ModeConfig[]): string;
//# sourceMappingURL=modes.d.ts.map