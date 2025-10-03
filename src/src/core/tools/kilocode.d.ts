import { Task } from "../task/Task";
export declare function summarizeSuccessfulMcpOutputWhenTooLong(task: Task, outputText: string): Promise<string>;
export declare function blockFileReadWhenTooLarge(task: Task, relPath: string, content: string): Promise<{
    status: "blocked";
    error: string;
    xmlContent: string;
}>;
//# sourceMappingURL=kilocode.d.ts.map