"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.getGeminiReasoning =
	exports.getOpenAiReasoning =
	exports.getAnthropicReasoning =
	exports.getOpenRouterReasoning =
		void 0
const api_1 = require("../../shared/api")
const getOpenRouterReasoning = ({ model, reasoningBudget, reasoningEffort, settings }) =>
	(0, api_1.shouldUseReasoningBudget)({ model, settings })
		? { max_tokens: reasoningBudget }
		: (0, api_1.shouldUseReasoningEffort)({ model, settings })
			? reasoningEffort
				? { effort: reasoningEffort }
				: undefined
			: undefined
exports.getOpenRouterReasoning = getOpenRouterReasoning
const getAnthropicReasoning = ({ model, reasoningBudget, settings }) =>
	(0, api_1.shouldUseReasoningBudget)({ model, settings })
		? { type: "enabled", budget_tokens: reasoningBudget }
		: undefined
exports.getAnthropicReasoning = getAnthropicReasoning
const getOpenAiReasoning = ({ model, reasoningEffort, settings }) => {
	if (!(0, api_1.shouldUseReasoningEffort)({ model, settings })) {
		return undefined
	}
	// If model has reasoning effort capability, return object even if effort is undefined
	// This preserves the reasoning_effort field in the API call
	if (reasoningEffort === "minimal") {
		return undefined
	}
	return { reasoning_effort: reasoningEffort }
}
exports.getOpenAiReasoning = getOpenAiReasoning
const getGeminiReasoning = ({ model, reasoningBudget, settings }) =>
	(0, api_1.shouldUseReasoningBudget)({ model, settings })
		? { thinkingBudget: reasoningBudget, includeThoughts: true }
		: undefined
exports.getGeminiReasoning = getGeminiReasoning
//# sourceMappingURL=reasoning.js.map
