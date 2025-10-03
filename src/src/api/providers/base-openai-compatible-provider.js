import OpenAI from "openai";
import { convertToOpenAiMessages } from "../transform/openai-format";
import { DEFAULT_HEADERS } from "./constants";
import { BaseProvider } from "./base-provider";
import { verifyFinishReason } from "./kilocode/verifyFinishReason";
import { handleOpenAIError } from "./utils/openai-error-handler";
import { fetchWithTimeout } from "./kilocode/fetchWithTimeout";
const OPENAI_COMPATIBLE_TIMEOUT_MS = 3_600_000;
export class BaseOpenAiCompatibleProvider extends BaseProvider {
    providerName;
    baseURL;
    defaultTemperature;
    defaultProviderModelId;
    providerModels;
    options;
    client;
    constructor({ providerName, baseURL, defaultProviderModelId, providerModels, defaultTemperature, ...options }) {
        super();
        this.providerName = providerName;
        this.baseURL = baseURL;
        this.defaultProviderModelId = defaultProviderModelId;
        this.providerModels = providerModels;
        this.defaultTemperature = defaultTemperature ?? 0;
        this.options = options;
        if (!this.options.apiKey) {
            throw new Error("API key is required");
        }
        this.client = new OpenAI({
            baseURL,
            apiKey: this.options.apiKey,
            defaultHeaders: DEFAULT_HEADERS,
            // kilocode_change start
            timeout: OPENAI_COMPATIBLE_TIMEOUT_MS,
            fetch: fetchWithTimeout(OPENAI_COMPATIBLE_TIMEOUT_MS),
            // kilocode_change end
        });
    }
    createStream(systemPrompt, messages, metadata, requestOptions) {
        const { id: model, info: { maxTokens: max_tokens }, } = this.getModel();
        const temperature = this.options.modelTemperature ?? this.defaultTemperature;
        const params = {
            model,
            max_tokens,
            temperature,
            messages: [{ role: "system", content: systemPrompt }, ...convertToOpenAiMessages(messages)],
            stream: true,
            stream_options: { include_usage: true },
        };
        try {
            return this.client.chat.completions.create(params, requestOptions);
        }
        catch (error) {
            throw handleOpenAIError(error, this.providerName);
        }
    }
    async *createMessage(systemPrompt, messages, metadata) {
        const stream = await this.createStream(systemPrompt, messages, metadata);
        for await (const chunk of stream) {
            verifyFinishReason(chunk.choices[0]); // kilocode_change
            const delta = chunk.choices[0]?.delta;
            if (delta?.content) {
                yield {
                    type: "text",
                    text: delta.content,
                };
            }
            if (chunk.usage) {
                yield {
                    type: "usage",
                    inputTokens: chunk.usage.prompt_tokens || 0,
                    outputTokens: chunk.usage.completion_tokens || 0,
                };
            }
        }
    }
    async completePrompt(prompt) {
        const { id: modelId } = this.getModel();
        try {
            const response = await this.client.chat.completions.create({
                model: modelId,
                messages: [{ role: "user", content: prompt }],
            });
            return response.choices[0]?.message.content || "";
        }
        catch (error) {
            throw handleOpenAIError(error, this.providerName);
        }
    }
    getModel() {
        const id = this.options.apiModelId && this.options.apiModelId in this.providerModels
            ? this.options.apiModelId
            : this.defaultProviderModelId;
        return { id, info: this.providerModels[id] };
    }
}
//# sourceMappingURL=base-openai-compatible-provider.js.map