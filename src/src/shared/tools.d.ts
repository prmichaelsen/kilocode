import { Anthropic } from "@anthropic-ai/sdk";
import type { ClineAsk, ToolProgressStatus, ToolGroup, ToolName } from "@roo-code/types";
export type ToolResponse = string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam>;
export type AskApproval = (type: ClineAsk, partialMessage?: string, progressStatus?: ToolProgressStatus, forceApproval?: boolean) => Promise<boolean>;
export type HandleError = (action: string, error: Error) => Promise<void>;
export type PushToolResult = (content: ToolResponse) => void;
export type RemoveClosingTag = (tag: ToolParamName, content?: string) => string;
export type AskFinishSubTaskApproval = () => Promise<boolean>;
export type ToolDescription = () => string;
export interface TextContent {
    type: "text";
    content: string;
    partial: boolean;
}
export declare const toolParamNames: readonly ["command", "path", "content", "line_count", "regex", "file_pattern", "recursive", "action", "url", "coordinate", "text", "server_name", "tool_name", "arguments", "uri", "question", "result", "diff", "mode_slug", "reason", "line", "mode", "message", "cwd", "follow_up", "task", "size", "search", "replace", "use_regex", "ignore_case", "title", "description", "target_file", "instructions", "code_edit", "args", "start_line", "end_line", "query", "args", "todos", "prompt", "image"];
export type ToolParamName = (typeof toolParamNames)[number];
export interface ToolUse {
    type: "tool_use";
    name: ToolName;
    params: Partial<Record<ToolParamName, string>>;
    partial: boolean;
}
export interface ExecuteCommandToolUse extends ToolUse {
    name: "execute_command";
    params: Partial<Pick<Record<ToolParamName, string>, "command" | "cwd">>;
}
export interface ReadFileToolUse extends ToolUse {
    name: "read_file";
    params: Partial<Pick<Record<ToolParamName, string>, "args" | "path" | "start_line" | "end_line">>;
}
export interface FetchInstructionsToolUse extends ToolUse {
    name: "fetch_instructions";
    params: Partial<Pick<Record<ToolParamName, string>, "task">>;
}
export interface WriteToFileToolUse extends ToolUse {
    name: "write_to_file";
    params: Partial<Pick<Record<ToolParamName, string>, "path" | "content" | "line_count">>;
}
export interface InsertCodeBlockToolUse extends ToolUse {
    name: "insert_content";
    params: Partial<Pick<Record<ToolParamName, string>, "path" | "line" | "content">>;
}
export interface CodebaseSearchToolUse extends ToolUse {
    name: "codebase_search";
    params: Partial<Pick<Record<ToolParamName, string>, "query" | "path">>;
}
export interface SearchFilesToolUse extends ToolUse {
    name: "search_files";
    params: Partial<Pick<Record<ToolParamName, string>, "path" | "regex" | "file_pattern">>;
}
export interface ListFilesToolUse extends ToolUse {
    name: "list_files";
    params: Partial<Pick<Record<ToolParamName, string>, "path" | "recursive">>;
}
export interface ListCodeDefinitionNamesToolUse extends ToolUse {
    name: "list_code_definition_names";
    params: Partial<Pick<Record<ToolParamName, string>, "path">>;
}
export interface BrowserActionToolUse extends ToolUse {
    name: "browser_action";
    params: Partial<Pick<Record<ToolParamName, string>, "action" | "url" | "coordinate" | "text" | "size">>;
}
export interface UseMcpToolToolUse extends ToolUse {
    name: "use_mcp_tool";
    params: Partial<Pick<Record<ToolParamName, string>, "server_name" | "tool_name" | "arguments">>;
}
export interface AccessMcpResourceToolUse extends ToolUse {
    name: "access_mcp_resource";
    params: Partial<Pick<Record<ToolParamName, string>, "server_name" | "uri">>;
}
export interface AskFollowupQuestionToolUse extends ToolUse {
    name: "ask_followup_question";
    params: Partial<Pick<Record<ToolParamName, string>, "question" | "follow_up">>;
}
export interface AttemptCompletionToolUse extends ToolUse {
    name: "attempt_completion";
    params: Partial<Pick<Record<ToolParamName, string>, "result">>;
}
export interface SwitchModeToolUse extends ToolUse {
    name: "switch_mode";
    params: Partial<Pick<Record<ToolParamName, string>, "mode_slug" | "reason">>;
}
export interface NewTaskToolUse extends ToolUse {
    name: "new_task";
    params: Partial<Pick<Record<ToolParamName, string>, "mode" | "message" | "todos">>;
}
export interface ReportBugToolUse extends ToolUse {
    name: "report_bug";
    params: Partial<Pick<Record<ToolParamName, string>, "title" | "description">>;
}
export interface RunSlashCommandToolUse extends ToolUse {
    name: "run_slash_command";
    params: Partial<Pick<Record<ToolParamName, string>, "command" | "args">>;
}
export interface SearchAndReplaceToolUse extends ToolUse {
    name: "search_and_replace";
    params: Required<Pick<Record<ToolParamName, string>, "path" | "search" | "replace">> & Partial<Pick<Record<ToolParamName, string>, "use_regex" | "ignore_case" | "start_line" | "end_line">>;
}
export interface EditFileToolUse extends ToolUse {
    name: "edit_file";
    params: Required<Pick<Record<ToolParamName, string>, "target_file" | "instructions" | "code_edit">>;
}
export interface GenerateImageToolUse extends ToolUse {
    name: "generate_image";
    params: Partial<Pick<Record<ToolParamName, string>, "prompt" | "path" | "image">>;
}
export type ToolGroupConfig = {
    tools: readonly string[];
    alwaysAvailable?: boolean;
};
export declare const TOOL_DISPLAY_NAMES: Record<ToolName, string>;
export declare const TOOL_GROUPS: Record<ToolGroup, ToolGroupConfig>;
export declare const ALWAYS_AVAILABLE_TOOLS: ToolName[];
export type DiffResult = {
    success: true;
    content: string;
    failParts?: DiffResult[];
} | ({
    success: false;
    error?: string;
    details?: {
        similarity?: number;
        threshold?: number;
        matchedRange?: {
            start: number;
            end: number;
        };
        searchContent?: string;
        bestMatch?: string;
    };
    failParts?: DiffResult[];
} & ({
    error: string;
} | {
    failParts: DiffResult[];
}));
export interface DiffItem {
    content: string;
    startLine?: number;
}
export interface DiffStrategy {
    /**
     * Get the name of this diff strategy for analytics and debugging
     * @returns The name of the diff strategy
     */
    getName(): string;
    /**
     * Get the tool description for this diff strategy
     * @param args The tool arguments including cwd and toolOptions
     * @returns The complete tool description including format requirements and examples
     */
    getToolDescription(args: {
        cwd: string;
        toolOptions?: {
            [key: string]: string;
        };
    }): string;
    /**
     * Apply a diff to the original content
     * @param originalContent The original file content
     * @param diffContent The diff content in the strategy's format (string for legacy, DiffItem[] for new)
     * @param startLine Optional line number where the search block starts. If not provided, searches the entire file.
     * @param endLine Optional line number where the search block ends. If not provided, searches the entire file.
     * @returns A DiffResult object containing either the successful result or error details
     */
    applyDiff(originalContent: string, diffContent: string | DiffItem[], startLine?: number, endLine?: number): Promise<DiffResult>;
    getProgressStatus?(toolUse: ToolUse, result?: any): ToolProgressStatus;
}
//# sourceMappingURL=tools.d.ts.map