import { McpHub } from "../../../services/mcp/McpHub";
import { DiffStrategy } from "../../../shared/tools";
import * as vscode from "vscode";
interface InstructionsDetail {
    mcpHub?: McpHub;
    diffStrategy?: DiffStrategy;
    context?: vscode.ExtensionContext;
}
export declare function fetchInstructions(text: string, detail: InstructionsDetail): Promise<string>;
export {};
//# sourceMappingURL=instructions.d.ts.map