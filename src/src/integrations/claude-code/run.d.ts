import type Anthropic from "@anthropic-ai/sdk";
import { ClaudeCodeMessage } from "./types";
export declare const MAX_SYSTEM_PROMPT_LENGTH = 65536;
type ClaudeCodeOptions = {
    systemPrompt: string;
    systemPromptFile?: string;
    messages: Anthropic.Messages.MessageParam[];
    path?: string;
    modelId?: string;
};
export declare function runClaudeCode(options: ClaudeCodeOptions & {
    maxOutputTokens?: number;
}): AsyncGenerator<ClaudeCodeMessage | string>;
export {};
//# sourceMappingURL=run.d.ts.map