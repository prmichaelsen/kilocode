import { Task } from "../task/Task";
import { ToolUse, RemoveClosingTag, AskApproval, HandleError, PushToolResult } from "../../shared/tools";
export declare function applyDiffToolLegacy(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, removeClosingTag: RemoveClosingTag): Promise<void>;
//# sourceMappingURL=applyDiffTool.d.ts.map