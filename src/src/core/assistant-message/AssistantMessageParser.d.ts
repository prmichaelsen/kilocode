import { AssistantMessageContent } from "./parseAssistantMessage";
/**
 * Parser for assistant messages. Maintains state between chunks
 * to avoid reprocessing the entire message on each update.
 */
export declare class AssistantMessageParser {
    private contentBlocks;
    private currentTextContent;
    private currentTextContentStartIndex;
    private currentToolUse;
    private currentToolUseStartIndex;
    private currentParamName;
    private currentParamValueStartIndex;
    private readonly MAX_ACCUMULATOR_SIZE;
    private readonly MAX_PARAM_LENGTH;
    private accumulator;
    /**
     * Initialize a new AssistantMessageParser instance.
     */
    constructor();
    /**
     * Reset the parser state.
     */
    reset(): void;
    /**
     * Returns the current parsed content blocks
     */
    getContentBlocks(): AssistantMessageContent[];
    /**
     * Process a new chunk of text and update the parser state.
     * @param chunk The new chunk of text to process.
     */
    processChunk(chunk: string): AssistantMessageContent[];
    /**
     * Finalize any partial content blocks.
     * Should be called after processing the last chunk.
     */
    finalizeContentBlocks(): void;
}
//# sourceMappingURL=AssistantMessageParser.d.ts.map