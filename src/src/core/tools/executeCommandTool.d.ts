import { Task } from "../task/Task";
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag, ToolResponse } from "../../shared/tools";
export declare function executeCommandTool(task: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, removeClosingTag: RemoveClosingTag): Promise<void>;
export type ExecuteCommandOptions = {
    executionId: string;
    command: string;
    customCwd?: string;
    terminalShellIntegrationDisabled?: boolean;
    terminalOutputLineLimit?: number;
    terminalOutputCharacterLimit?: number;
    commandExecutionTimeout?: number;
};
export declare function executeCommand(task: Task, { executionId, command, customCwd, terminalShellIntegrationDisabled, // kilocode_change: default
terminalOutputLineLimit, terminalOutputCharacterLimit, commandExecutionTimeout, }: ExecuteCommandOptions): Promise<[boolean, ToolResponse]>;
//# sourceMappingURL=executeCommandTool.d.ts.map