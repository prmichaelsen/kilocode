import { Task } from "../task/Task";
import { ToolUse, RemoveClosingTag, AskApproval, HandleError, PushToolResult } from "../../shared/tools";
export declare function applyDiffTool(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, removeClosingTag: RemoveClosingTag): Promise<void>;
//# sourceMappingURL=multiApplyDiffTool.d.ts.map