import { Task } from "../task/Task";
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools";
export declare function getReadFileToolDescription(blockName: string, blockParams: any): string;
export declare function readFileTool(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, _removeClosingTag: RemoveClosingTag): Promise<void>;
//# sourceMappingURL=readFileTool.d.ts.map