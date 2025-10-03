import { Task } from "../task/Task";
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools";
/**
 * Implements the list_files tool.
 *
 * @param cline - The instance of Cline that is executing this tool.
 * @param block - The block of assistant message content that specifies the
 *   parameters for this tool.
 * @param askApproval - A function that asks the user for approval to show a
 *   message.
 * @param handleError - A function that handles an error that occurred while
 *   executing this tool.
 * @param pushToolResult - A function that pushes the result of this tool to the
 *   conversation.
 * @param removeClosingTag - A function that removes a closing tag from a string.
 */
export declare function listFilesTool(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, removeClosingTag: RemoveClosingTag): Promise<void>;
//# sourceMappingURL=listFilesTool.d.ts.map