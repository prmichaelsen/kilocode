"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.ClaudeCodeHandler = void 0
const types_1 = require("@roo-code/types")
const run_1 = require("../../integrations/claude-code/run")
const message_filter_1 = require("../../integrations/claude-code/message-filter")
const base_provider_1 = require("./base-provider")
const i18n_1 = require("../../i18n")
class ClaudeCodeHandler extends base_provider_1.BaseProvider {
	constructor(options) {
		super()
		Object.defineProperty(this, "options", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.options = options
	}
	async *createMessage(systemPrompt, messages) {
		// Filter out image blocks since Claude Code doesn't support them
		const filteredMessages = (0, message_filter_1.filterMessagesForClaudeCode)(messages)
		const useVertex = process.env.CLAUDE_CODE_USE_VERTEX === "1"
		const model = this.getModel()
		// Validate that the model ID is a valid ClaudeCodeModelId
		const modelId = model.id in types_1.claudeCodeModels ? model.id : types_1.claudeCodeDefaultModelId
		const claudeProcess = (0, run_1.runClaudeCode)({
			systemPrompt,
			messages: filteredMessages,
			path: this.options.claudeCodePath,
			modelId: (0, types_1.getClaudeCodeModelId)(modelId, useVertex),
			maxOutputTokens: this.options.claudeCodeMaxOutputTokens,
		})
		// Usage is included with assistant messages,
		// but cost is included in the result chunk
		let usage = {
			type: "usage",
			inputTokens: 0,
			outputTokens: 0,
			cacheReadTokens: 0,
			cacheWriteTokens: 0,
		}
		let isPaidUsage = true
		for await (const chunk of claudeProcess) {
			if (typeof chunk === "string") {
				yield {
					type: "text",
					text: chunk,
				}
				continue
			}
			if (chunk.type === "system" && chunk.subtype === "init") {
				// Based on my tests, subscription usage sets the `apiKeySource` to "none"
				isPaidUsage = chunk.apiKeySource !== "none"
				continue
			}
			if (chunk.type === "assistant" && "message" in chunk) {
				const message = chunk.message
				if (message.stop_reason !== null) {
					const content = "text" in message.content[0] ? message.content[0] : undefined
					const isError = content && content.text.startsWith(`API Error`)
					if (isError) {
						// Error messages are formatted as: `API Error: <<status code>> <<json>>`
						const errorMessageStart = content.text.indexOf("{")
						const errorMessage = content.text.slice(errorMessageStart)
						const error = this.attemptParse(errorMessage)
						if (!error) {
							throw new Error(content.text)
						}
						if (error.error.message.includes("Invalid model name")) {
							throw new Error(
								content.text +
									`\n\n${(0, i18n_1.t)("common:errors.claudeCode.apiKeyModelPlanMismatch")}`,
							)
						}
						throw new Error(errorMessage)
					}
				}
				for (const content of message.content) {
					switch (content.type) {
						case "text":
							yield {
								type: "text",
								text: content.text,
							}
							break
						case "thinking":
							yield {
								type: "reasoning",
								text: content.thinking || "",
							}
							break
						case "redacted_thinking":
							yield {
								type: "reasoning",
								text: "[Redacted thinking block]",
							}
							break
						case "tool_use":
							console.error(`tool_use is not supported yet. Received: ${JSON.stringify(content)}`)
							break
					}
				}
				usage.inputTokens += message.usage.input_tokens
				usage.outputTokens += message.usage.output_tokens
				usage.cacheReadTokens = (usage.cacheReadTokens || 0) + (message.usage.cache_read_input_tokens || 0)
				usage.cacheWriteTokens =
					(usage.cacheWriteTokens || 0) + (message.usage.cache_creation_input_tokens || 0)
				continue
			}
			if (chunk.type === "result" && "result" in chunk) {
				usage.totalCost = isPaidUsage ? chunk.total_cost_usd : 0
				yield usage
			}
		}
	}
	getModel() {
		const modelId = this.options.apiModelId
		if (modelId && modelId in types_1.claudeCodeModels) {
			const id = modelId
			const modelInfo = { ...types_1.claudeCodeModels[id] }
			// Override maxTokens with the configured value if provided
			if (this.options.claudeCodeMaxOutputTokens !== undefined) {
				modelInfo.maxTokens = this.options.claudeCodeMaxOutputTokens
			}
			return { id, info: modelInfo }
		}
		const defaultModelInfo = { ...types_1.claudeCodeModels[types_1.claudeCodeDefaultModelId] }
		// Override maxTokens with the configured value if provided
		if (this.options.claudeCodeMaxOutputTokens !== undefined) {
			defaultModelInfo.maxTokens = this.options.claudeCodeMaxOutputTokens
		}
		return {
			id: types_1.claudeCodeDefaultModelId,
			info: defaultModelInfo,
		}
	}
	attemptParse(str) {
		try {
			return JSON.parse(str)
		} catch (err) {
			return null
		}
	}
}
exports.ClaudeCodeHandler = ClaudeCodeHandler
//# sourceMappingURL=claude-code.js.map
