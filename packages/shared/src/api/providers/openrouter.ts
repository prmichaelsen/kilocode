import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import type { ApiHandlerCreateMessageMetadata } from "../index.js"
import type { ApiStream, ApiStreamChunk } from "../stream.js"
import { BaseProvider, type ApiHandlerOptions } from "./base-provider.js"

// OpenRouter usage interface
export interface CompletionUsage {
	completion_tokens?: number
	completion_tokens_details?: {
		reasoning_tokens?: number
	}
	prompt_tokens?: number
	prompt_tokens_details?: {
		cached_tokens?: number
	}
	total_tokens?: number
	cost?: number
	is_byok?: boolean
	cost_details?: {
		upstream_inference_cost?: number
	}
}

export class OpenRouterHandler extends BaseProvider {
	protected options: ApiHandlerOptions
	private client: OpenAI
	protected models: Record<string, any> = {}
	protected endpoints: Record<string, any> = {}

	protected get providerName() {
		return "OpenRouter"
	}

	constructor(options: ApiHandlerOptions) {
		super()
		this.options = options

		const baseURL = this.options.openRouterBaseUrl || "https://openrouter.ai/api/v1"
		const apiKey = this.options.openRouterApiKey ?? "not-provided"

		this.client = new OpenAI({
			baseURL,
			apiKey,
			defaultHeaders: {
				"HTTP-Referer": "https://kilocode.ai",
				"X-Title": "Kilo Code",
				"User-Agent": "Kilo Code/4.99.1"
			}
		})
	}

	customRequestOptions(_metadata?: ApiHandlerCreateMessageMetadata): { headers: Record<string, string> } | undefined {
		return undefined
	}

	getTotalCost(lastUsage: CompletionUsage): number {
		return (lastUsage.cost_details?.upstream_inference_cost || 0) + (lastUsage.cost || 0)
	}

	async *createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): ApiStream {
		const model = this.getModel()

		// Convert Anthropic messages to OpenAI format
		const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...this.convertToOpenAiMessages(messages),
		]

		const completionParams: OpenAI.Chat.ChatCompletionCreateParams = {
			model: model.id,
			max_tokens: model.info.maxTokens || 4096,
			temperature: 0,
			messages: openAiMessages,
			stream: true,
			stream_options: { include_usage: true },
		}

		let stream
		try {
			stream = await this.client.chat.completions.create(
				completionParams,
				this.customRequestOptions(metadata),
			)
		} catch (error) {
			throw new Error(`OpenRouter API Error: ${error instanceof Error ? error.message : String(error)}`)
		}

		let lastUsage: CompletionUsage | undefined = undefined

		try {
			for await (const chunk of stream) {
				// OpenRouter returns an error object instead of throwing
				if ("error" in chunk) {
					const error = chunk.error as { message?: string; code?: number }
					throw new Error(`OpenRouter API Error ${error?.code}: ${error?.message}`)
				}

				const delta = chunk.choices[0]?.delta

				if (delta?.content) {
					yield { type: "text", text: delta.content }
				}

				if (chunk.usage) {
					lastUsage = chunk.usage
				}
			}
		} catch (error) {
			throw new Error(`OpenRouter streaming error: ${error instanceof Error ? error.message : String(error)}`)
		}

		if (lastUsage) {
			yield {
				type: "usage",
				inputTokens: lastUsage.prompt_tokens || 0,
				outputTokens: lastUsage.completion_tokens || 0,
				cacheReadTokens: lastUsage.prompt_tokens_details?.cached_tokens,
				reasoningTokens: lastUsage.completion_tokens_details?.reasoning_tokens,
				totalCost: this.getTotalCost(lastUsage),
			}
		}
	}

	getModel() {
		const id = this.options.openRouterModelId || "anthropic/claude-3.5-sonnet:beta"
		return {
			id,
			info: {
				maxTokens: 4096,
				contextWindow: 200000,
				supportsImages: true,
				supportsPromptCache: true,
				inputPrice: 0.003,
				outputPrice: 0.015
			}
		}
	}

	private convertToOpenAiMessages(messages: Anthropic.Messages.MessageParam[]): OpenAI.Chat.ChatCompletionMessageParam[] {
		return messages.map(msg => ({
			role: msg.role,
			content: Array.isArray(msg.content) 
				? msg.content.map(block => 
					block.type === "text" ? block.text : "[Image]"
				).join("\n")
				: msg.content
		}))
	}
}