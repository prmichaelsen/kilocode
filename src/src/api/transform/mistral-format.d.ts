import { Anthropic } from "@anthropic-ai/sdk";
import { AssistantMessage } from "@mistralai/mistralai/models/components/assistantmessage";
import { SystemMessage } from "@mistralai/mistralai/models/components/systemmessage";
import { ToolMessage } from "@mistralai/mistralai/models/components/toolmessage";
import { UserMessage } from "@mistralai/mistralai/models/components/usermessage";
export type MistralMessage = (SystemMessage & {
    role: "system";
}) | (UserMessage & {
    role: "user";
}) | (AssistantMessage & {
    role: "assistant";
}) | (ToolMessage & {
    role: "tool";
});
export declare function convertToMistralMessages(anthropicMessages: Anthropic.Messages.MessageParam[]): MistralMessage[];
//# sourceMappingURL=mistral-format.d.ts.map