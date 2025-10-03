import { Task } from "../task/Task";
import { AskApproval, HandleError, PushToolResult, RemoveClosingTag, ToolUse } from "../../shared/tools";
/**
 * Performs search and replace operations on a file
 * @param cline - Cline instance
 * @param block - Tool use parameters
 * @param askApproval - Function to request user approval
 * @param handleError - Function to handle errors
 * @param pushToolResult - Function to push tool results
 * @param removeClosingTag - Function to remove closing tags
 */
export declare function searchAndReplaceTool(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, removeClosingTag: RemoveClosingTag): Promise<void>;
//# sourceMappingURL=searchAndReplaceTool.d.ts.map