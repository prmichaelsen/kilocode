import { type ModelInfo, type ProviderSettings, type DynamicProvider, type LocalProvider } from "@roo-code/types";
export type ApiHandlerOptions = Omit<ProviderSettings, "apiProvider"> & {
    /**
     * When true and using GPT‑5 Responses API, include reasoning.summary: "auto"
     * so the API returns reasoning summaries (we already parse and surface them).
     * Defaults to true; set to false to disable summaries.
     */
    enableGpt5ReasoningSummary?: boolean;
    /**
     * Optional override for Ollama's num_ctx parameter.
     * When set, this value will be used in Ollama chat requests.
     * When undefined, Ollama will use the model's default num_ctx from the Modelfile.
     */
    ollamaNumCtx?: number;
};
export type RouterName = DynamicProvider | LocalProvider;
export declare const isRouterName: (value: string) => value is RouterName;
export declare function toRouterName(value?: string): RouterName;
export type ModelRecord = Record<string, ModelInfo>;
export type RouterModels = Record<RouterName, ModelRecord>;
export declare const shouldUseReasoningBudget: ({ model, settings, }: {
    model: ModelInfo;
    settings?: ProviderSettings;
}) => boolean;
export declare const shouldUseReasoningEffort: ({ model, settings, }: {
    model: ModelInfo;
    settings?: ProviderSettings;
}) => boolean;
export declare const DEFAULT_HYBRID_REASONING_MODEL_MAX_TOKENS = 16384;
export declare const DEFAULT_HYBRID_REASONING_MODEL_THINKING_TOKENS = 8192;
export declare const GEMINI_25_PRO_MIN_THINKING_TOKENS = 128;
export declare const getModelMaxOutputTokens: ({ modelId, model, settings, format, }: {
    modelId: string;
    model: ModelInfo;
    settings?: ProviderSettings;
    format?: "anthropic" | "openai" | "gemini" | "openrouter";
}) => number | undefined;
type CommonFetchParams = {
    apiKey?: string;
    baseUrl?: string;
};
declare const dynamicProviderExtras: {
    readonly openrouter: {};
    readonly "vercel-ai-gateway": {};
    readonly huggingface: {};
    readonly litellm: {
        apiKey: string;
        baseUrl: string;
    };
    readonly "kilocode-openrouter": {
        kilocodeToken?: string;
        kilocodeOrganizationId?: string;
    };
    readonly deepinfra: {
        apiKey?: string;
        baseUrl?: string;
    };
    readonly "io-intelligence": {
        apiKey: string;
    };
    readonly requesty: {
        apiKey?: string;
        baseUrl?: string;
    };
    readonly unbound: {
        apiKey?: string;
    };
    readonly glama: {};
    readonly ollama: {
        numCtx?: number;
    };
    readonly lmstudio: {};
};
export type GetModelsOptions = {
    [P in keyof typeof dynamicProviderExtras]: ({
        provider: P;
    } & (typeof dynamicProviderExtras)[P]) & CommonFetchParams;
}[RouterName];
export {};
//# sourceMappingURL=api.d.ts.map