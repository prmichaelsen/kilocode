import { TextContent, ToolUse } from "../../shared/tools";
export type AssistantMessageContent = TextContent | ToolUse;
export declare function parseAssistantMessage(assistantMessage: string): AssistantMessageContent[];
//# sourceMappingURL=parseAssistantMessage.d.ts.map