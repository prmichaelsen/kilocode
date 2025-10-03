import { Task } from "../task/Task";
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools";
import { type ClineProviderState } from "../webview/ClineProvider";
export declare function editFileTool(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, removeClosingTag: RemoveClosingTag): Promise<void>;
export declare function isFastApplyAvailable(state?: ClineProviderState): boolean;
export declare function getFastApplyModelType(state?: ClineProviderState): "Morph" | "Relace";
//# sourceMappingURL=editFileTool.d.ts.map