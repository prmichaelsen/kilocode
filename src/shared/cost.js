"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.parseApiPrice = void 0
exports.calculateApiCostAnthropic = calculateApiCostAnthropic
exports.calculateApiCostOpenAI = calculateApiCostOpenAI
function calculateApiCostInternal(
	modelInfo,
	inputTokens,
	outputTokens,
	cacheCreationInputTokens,
	cacheReadInputTokens,
) {
	const cacheWritesCost = ((modelInfo.cacheWritesPrice || 0) / 1000000) * cacheCreationInputTokens
	const cacheReadsCost = ((modelInfo.cacheReadsPrice || 0) / 1000000) * cacheReadInputTokens
	const baseInputCost = ((modelInfo.inputPrice || 0) / 1000000) * inputTokens
	const outputCost = ((modelInfo.outputPrice || 0) / 1000000) * outputTokens
	const totalCost = cacheWritesCost + cacheReadsCost + baseInputCost + outputCost
	return totalCost
}
// For Anthropic compliant usage, the input tokens count does NOT include the
// cached tokens.
function calculateApiCostAnthropic(
	modelInfo,
	inputTokens,
	outputTokens,
	cacheCreationInputTokens,
	cacheReadInputTokens,
) {
	return calculateApiCostInternal(
		modelInfo,
		inputTokens,
		outputTokens,
		cacheCreationInputTokens || 0,
		cacheReadInputTokens || 0,
	)
}
// For OpenAI compliant usage, the input tokens count INCLUDES the cached tokens.
function calculateApiCostOpenAI(modelInfo, inputTokens, outputTokens, cacheCreationInputTokens, cacheReadInputTokens) {
	const cacheCreationInputTokensNum = cacheCreationInputTokens || 0
	const cacheReadInputTokensNum = cacheReadInputTokens || 0
	const nonCachedInputTokens = Math.max(0, inputTokens - cacheCreationInputTokensNum - cacheReadInputTokensNum)
	return calculateApiCostInternal(
		modelInfo,
		nonCachedInputTokens,
		outputTokens,
		cacheCreationInputTokensNum,
		cacheReadInputTokensNum,
	)
}
const parseApiPrice = (price) => (price ? parseFloat(price) * 1000000 : undefined)
exports.parseApiPrice = parseApiPrice
//# sourceMappingURL=cost.js.map
