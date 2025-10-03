import { Task } from "../task/Task";
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag, ToolDescription, AskFinishSubTaskApproval } from "../../shared/tools";
export declare function attemptCompletionTool(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, removeClosingTag: RemoveClosingTag, toolDescription: ToolDescription, askFinishSubTaskApproval: AskFinishSubTaskApproval): Promise<void>;
//# sourceMappingURL=attemptCompletionTool.d.ts.map