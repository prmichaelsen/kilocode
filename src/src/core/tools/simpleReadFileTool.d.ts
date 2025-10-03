import { Task } from "../task/Task";
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools";
/**
 * Simplified read file tool for models that only support single file reads
 * Uses the format: <read_file><path>file/path.ext</path></read_file>
 *
 * This is a streamlined version of readFileTool that:
 * - Only accepts a single path parameter
 * - Does not support multiple files
 * - Does not support line ranges
 * - Has simpler XML parsing
 */
export declare function simpleReadFileTool(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, _removeClosingTag: RemoveClosingTag): Promise<void>;
/**
 * Get description for the simple read file tool
 * @param blockName The name of the tool block
 * @param blockParams The parameters passed to the tool
 * @returns A description string for the tool use
 */
export declare function getSimpleReadFileToolDescription(blockName: string, blockParams: any): string;
//# sourceMappingURL=simpleReadFileTool.d.ts.map