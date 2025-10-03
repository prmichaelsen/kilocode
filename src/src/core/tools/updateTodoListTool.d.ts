import { Task } from "../task/Task";
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools";
import { TodoItem, TodoStatus } from "@roo-code/types";
/**
 * Add a todo item to the task's todoList.
 */
export declare function addTodoToTask(cline: Task, content: string, status?: TodoStatus, id?: string): TodoItem;
/**
 * Update the status of a todo item by id.
 */
export declare function updateTodoStatusForTask(cline: Task, id: string, nextStatus: TodoStatus): boolean;
/**
 * Remove a todo item by id.
 */
export declare function removeTodoFromTask(cline: Task, id: string): boolean;
/**
 * Get a copy of the todoList.
 */
export declare function getTodoListForTask(cline: Task): TodoItem[] | undefined;
/**
 * Set the todoList for the task.
 */
export declare function setTodoListForTask(cline?: Task, todos?: TodoItem[]): Promise<void>;
/**
 * Restore the todoList from argument or from clineMessages.
 */
export declare function restoreTodoListForTask(cline: Task, todoList?: TodoItem[]): void;
export declare function parseMarkdownChecklist(md: string): TodoItem[];
export declare function setPendingTodoList(todos: TodoItem[]): void;
/**
 * Update the todo list for a task.
 * @param cline Task instance
 * @param block ToolUse block
 * @param askApproval AskApproval function
 * @param handleError HandleError function
 * @param pushToolResult PushToolResult function
 * @param removeClosingTag RemoveClosingTag function
 * @param userEdited If true, only show "User Edit Succeeded" and do nothing else
 */
export declare function updateTodoListTool(cline: Task, block: ToolUse, askApproval: AskApproval, handleError: HandleError, pushToolResult: PushToolResult, removeClosingTag: RemoveClosingTag, userEdited?: boolean): Promise<void>;
//# sourceMappingURL=updateTodoListTool.d.ts.map