import * as vscode from "vscode";
import type { ModeConfig, PromptComponent, CustomModePrompts, TodoItem, Experiments } from "@roo-code/types";
import type { SystemPromptSettings } from "./types";
import { Mode } from "../../shared/modes";
import { DiffStrategy } from "../../shared/tools";
import { McpHub } from "../../services/mcp/McpHub";
import { type ClineProviderState } from "../webview/ClineProvider";
export declare function getPromptComponent(customModePrompts: CustomModePrompts | undefined, mode: string): PromptComponent | undefined;
export declare const SYSTEM_PROMPT: (context: vscode.ExtensionContext, cwd: string, supportsComputerUse: boolean, mcpHub?: McpHub, diffStrategy?: DiffStrategy, browserViewportSize?: string, inputMode?: Mode, // kilocode_change: name changed to inputMode
customModePrompts?: CustomModePrompts, customModes?: ModeConfig[], globalCustomInstructions?: string, diffEnabled?: boolean, experiments?: Experiments, // kilocode_change: type
enableMcpServerCreation?: boolean, language?: string, rooIgnoreInstructions?: string, partialReadsEnabled?: boolean, settings?: SystemPromptSettings, todoList?: TodoItem[], modelId?: string, clineProviderState?: ClineProviderState) => Promise<string>;
//# sourceMappingURL=system.d.ts.map