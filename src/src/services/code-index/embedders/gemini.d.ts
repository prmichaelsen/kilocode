import { IEmbedder, EmbeddingResponse, EmbedderInfo } from "../interfaces/embedder";
/**
 * Gemini embedder implementation that wraps the OpenAI Compatible embedder
 * with configuration for Google's Gemini embedding API.
 *
 * Supported models:
 * - text-embedding-004 (dimension: 768)
 * - gemini-embedding-001 (dimension: 2048)
 */
export declare class GeminiEmbedder implements IEmbedder {
    private readonly openAICompatibleEmbedder;
    private static readonly GEMINI_BASE_URL;
    private static readonly DEFAULT_MODEL;
    private readonly modelId;
    /**
     * Creates a new Gemini embedder
     * @param apiKey The Gemini API key for authentication
     * @param modelId The model ID to use (defaults to gemini-embedding-001)
     */
    constructor(apiKey: string, modelId?: string);
    /**
     * Creates embeddings for the given texts using Gemini's embedding API
     * @param texts Array of text strings to embed
     * @param model Optional model identifier (uses constructor model if not provided)
     * @returns Promise resolving to embedding response
     */
    createEmbeddings(texts: string[], model?: string): Promise<EmbeddingResponse>;
    /**
     * Validates the Gemini embedder configuration by delegating to the underlying OpenAI-compatible embedder
     * @returns Promise resolving to validation result with success status and optional error message
     */
    validateConfiguration(): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Returns information about this embedder
     */
    get embedderInfo(): EmbedderInfo;
}
//# sourceMappingURL=gemini.d.ts.map