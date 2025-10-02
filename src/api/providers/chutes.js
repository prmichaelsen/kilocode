"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.ChutesHandler = void 0
const types_1 = require("@roo-code/types")
const xml_matcher_1 = require("../../utils/xml-matcher")
const r1_format_1 = require("../transform/r1-format")
const openai_format_1 = require("../transform/openai-format")
const base_openai_compatible_provider_1 = require("./base-openai-compatible-provider")
class ChutesHandler extends base_openai_compatible_provider_1.BaseOpenAiCompatibleProvider {
	constructor(options) {
		super({
			...options,
			providerName: "Chutes",
			baseURL: "https://llm.chutes.ai/v1",
			apiKey: options.chutesApiKey,
			defaultProviderModelId: types_1.chutesDefaultModelId,
			providerModels: types_1.chutesModels,
			defaultTemperature: 0.5,
		})
	}
	getCompletionParams(systemPrompt, messages) {
		const {
			id: model,
			info: { maxTokens: max_tokens },
		} = this.getModel()
		const temperature = this.options.modelTemperature ?? this.getModel().info.temperature
		return {
			model,
			max_tokens,
			temperature,
			messages: [
				{ role: "system", content: systemPrompt },
				...(0, openai_format_1.convertToOpenAiMessages)(messages),
			],
			stream: true,
			stream_options: { include_usage: true },
		}
	}
	async *createMessage(systemPrompt, messages) {
		const model = this.getModel()
		if (model.id.includes("DeepSeek-R1")) {
			const stream = await this.client.chat.completions.create({
				...this.getCompletionParams(systemPrompt, messages),
				messages: (0, r1_format_1.convertToR1Format)([{ role: "user", content: systemPrompt }, ...messages]),
			})
			const matcher = new xml_matcher_1.XmlMatcher("think", (chunk) => ({
				type: chunk.matched ? "reasoning" : "text",
				text: chunk.data,
			}))
			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta
				if (delta?.content) {
					for (const processedChunk of matcher.update(delta.content)) {
						yield processedChunk
					}
				}
				if (chunk.usage) {
					yield {
						type: "usage",
						inputTokens: chunk.usage.prompt_tokens || 0,
						outputTokens: chunk.usage.completion_tokens || 0,
					}
				}
			}
			// Process any remaining content
			for (const processedChunk of matcher.final()) {
				yield processedChunk
			}
		} else {
			yield* super.createMessage(systemPrompt, messages)
		}
	}
	getModel() {
		const model = super.getModel()
		const isDeepSeekR1 = model.id.includes("DeepSeek-R1")
		return {
			...model,
			info: {
				...model.info,
				temperature: isDeepSeekR1 ? types_1.DEEP_SEEK_DEFAULT_TEMPERATURE : this.defaultTemperature,
			},
		}
	}
}
exports.ChutesHandler = ChutesHandler
//# sourceMappingURL=chutes.js.map
