"use strict"
// npx vitest run src/api/transform/__tests__/reasoning.spec.ts
Object.defineProperty(exports, "__esModule", { value: true })
const reasoning_1 = require("../reasoning")
describe("reasoning.ts", () => {
	const baseModel = {
		contextWindow: 16000,
		supportsPromptCache: true,
	}
	const baseSettings = {}
	const baseOptions = {
		model: baseModel,
		reasoningBudget: 1000,
		reasoningEffort: "medium",
		settings: baseSettings,
	}
	describe("getOpenRouterReasoning", () => {
		it("should return reasoning budget params when model has requiredReasoningBudget", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const options = { ...baseOptions, model: modelWithRequired }
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			expect(result).toEqual({ max_tokens: 1000 })
		})
		it("should return reasoning budget params when model supports reasoning budget and setting is enabled", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningBudget: true,
			}
			const settingsWithEnabled = {
				enableReasoningEffort: true,
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithEnabled,
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			expect(result).toEqual({ max_tokens: 1000 })
		})
		it("should return reasoning effort params when model supports reasoning effort and has effort in settings", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningEffort: true,
			}
			const settingsWithEffort = {
				reasoningEffort: "high",
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithEffort,
				reasoningEffort: "high",
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			expect(result).toEqual({ effort: "high" })
		})
		it("should return reasoning effort params when model has reasoningEffort property", () => {
			const modelWithEffort = {
				...baseModel,
				reasoningEffort: "medium",
			}
			const options = { ...baseOptions, model: modelWithEffort }
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			expect(result).toEqual({ effort: "medium" })
		})
		it("should return undefined when model has no reasoning capabilities", () => {
			const result = (0, reasoning_1.getOpenRouterReasoning)(baseOptions)
			expect(result).toBeUndefined()
		})
		it("should prioritize reasoning budget over reasoning effort", () => {
			const hybridModel = {
				...baseModel,
				supportsReasoningBudget: true,
				reasoningEffort: "high",
			}
			const settingsWithBoth = {
				enableReasoningEffort: true,
				reasoningEffort: "low",
			}
			const options = {
				...baseOptions,
				model: hybridModel,
				settings: settingsWithBoth,
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			expect(result).toEqual({ max_tokens: 1000 })
		})
		it("should handle undefined reasoningBudget", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const optionsWithoutBudget = {
				...baseOptions,
				model: modelWithRequired,
				reasoningBudget: undefined,
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(optionsWithoutBudget)
			expect(result).toEqual({ max_tokens: undefined })
		})
		it("should handle undefined reasoningEffort", () => {
			const modelWithEffort = {
				...baseModel,
				reasoningEffort: "medium",
			}
			const optionsWithoutEffort = {
				...baseOptions,
				model: modelWithEffort,
				reasoningEffort: undefined,
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(optionsWithoutEffort)
			// When reasoningEffort is undefined, the function should return undefined
			expect(result).toBeUndefined()
		})
		it("should handle all reasoning effort values including minimal", () => {
			const efforts = ["minimal", "low", "medium", "high"]
			efforts.forEach((effort) => {
				const modelWithEffort = {
					...baseModel,
					supportsReasoningEffort: true,
				}
				const settingsWithEffort = {
					reasoningEffort: effort,
				}
				const options = {
					...baseOptions,
					model: modelWithEffort,
					settings: settingsWithEffort,
					reasoningEffort: effort,
				}
				const result = (0, reasoning_1.getOpenRouterReasoning)(options)
				// All effort values including "minimal" should be passed through
				expect(result).toEqual({ effort })
			})
		})
		it("should handle minimal reasoning effort specifically", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningEffort: true,
			}
			const settingsWithEffort = {
				reasoningEffort: "minimal",
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithEffort,
				reasoningEffort: "minimal",
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			// "minimal" should be passed through to OpenRouter
			expect(result).toEqual({ effort: "minimal" })
		})
		it("should handle minimal reasoning effort from settings", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningEffort: true,
			}
			const settingsWithMinimal = {
				reasoningEffort: "minimal",
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithMinimal,
				reasoningEffort: "minimal",
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			// "minimal" should be passed through to OpenRouter
			expect(result).toEqual({ effort: "minimal" })
		})
		it("should handle zero reasoningBudget", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const optionsWithZeroBudget = {
				...baseOptions,
				model: modelWithRequired,
				reasoningBudget: 0,
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(optionsWithZeroBudget)
			expect(result).toEqual({ max_tokens: 0 })
		})
		it("should not use reasoning budget when supportsReasoningBudget is true but enableReasoningEffort is false", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningBudget: true,
			}
			const settingsWithDisabled = {
				enableReasoningEffort: false,
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithDisabled,
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			expect(result).toBeUndefined()
		})
		it("should not use reasoning effort when supportsReasoningEffort is true but no effort is specified", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningEffort: true,
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: {},
				reasoningEffort: undefined,
			}
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			expect(result).toBeUndefined()
		})
	})
	describe("getAnthropicReasoning", () => {
		it("should return reasoning budget params when model has requiredReasoningBudget", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const options = { ...baseOptions, model: modelWithRequired }
			const result = (0, reasoning_1.getAnthropicReasoning)(options)
			expect(result).toEqual({
				type: "enabled",
				budget_tokens: 1000,
			})
		})
		it("should return reasoning budget params when model supports reasoning budget and setting is enabled", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningBudget: true,
			}
			const settingsWithEnabled = {
				enableReasoningEffort: true,
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithEnabled,
			}
			const result = (0, reasoning_1.getAnthropicReasoning)(options)
			expect(result).toEqual({
				type: "enabled",
				budget_tokens: 1000,
			})
		})
		it("should return undefined when model has no reasoning budget capability", () => {
			const result = (0, reasoning_1.getAnthropicReasoning)(baseOptions)
			expect(result).toBeUndefined()
		})
		it("should return undefined when supportsReasoningBudget is true but enableReasoningEffort is false", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningBudget: true,
			}
			const settingsWithDisabled = {
				enableReasoningEffort: false,
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithDisabled,
			}
			const result = (0, reasoning_1.getAnthropicReasoning)(options)
			expect(result).toBeUndefined()
		})
		it("should handle undefined reasoningBudget with non-null assertion", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const optionsWithoutBudget = {
				...baseOptions,
				model: modelWithRequired,
				reasoningBudget: undefined,
			}
			const result = (0, reasoning_1.getAnthropicReasoning)(optionsWithoutBudget)
			expect(result).toEqual({
				type: "enabled",
				budget_tokens: undefined,
			})
		})
		it("should handle zero reasoningBudget", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const optionsWithZeroBudget = {
				...baseOptions,
				model: modelWithRequired,
				reasoningBudget: 0,
			}
			const result = (0, reasoning_1.getAnthropicReasoning)(optionsWithZeroBudget)
			expect(result).toEqual({
				type: "enabled",
				budget_tokens: 0,
			})
		})
		it("should handle large reasoningBudget values", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const optionsWithLargeBudget = {
				...baseOptions,
				model: modelWithRequired,
				reasoningBudget: 100000,
			}
			const result = (0, reasoning_1.getAnthropicReasoning)(optionsWithLargeBudget)
			expect(result).toEqual({
				type: "enabled",
				budget_tokens: 100000,
			})
		})
		it("should not be affected by reasoningEffort parameter", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const optionsWithEffort = {
				...baseOptions,
				model: modelWithRequired,
				reasoningEffort: "high",
			}
			const result = (0, reasoning_1.getAnthropicReasoning)(optionsWithEffort)
			expect(result).toEqual({
				type: "enabled",
				budget_tokens: 1000,
			})
		})
		it("should ignore reasoning effort capabilities for Anthropic", () => {
			const modelWithEffort = {
				...baseModel,
				supportsReasoningEffort: true,
				reasoningEffort: "high",
			}
			const settingsWithEffort = {
				reasoningEffort: "medium",
			}
			const options = {
				...baseOptions,
				model: modelWithEffort,
				settings: settingsWithEffort,
			}
			const result = (0, reasoning_1.getAnthropicReasoning)(options)
			expect(result).toBeUndefined()
		})
	})
	describe("getOpenAiReasoning", () => {
		it("should return reasoning effort params when model supports reasoning effort and has effort in settings", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningEffort: true,
			}
			const settingsWithEffort = {
				reasoningEffort: "high",
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithEffort,
				reasoningEffort: "high",
			}
			const result = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(result).toEqual({ reasoning_effort: "high" })
		})
		it("should return reasoning effort params when model has reasoningEffort property", () => {
			const modelWithEffort = {
				...baseModel,
				reasoningEffort: "medium",
			}
			const options = { ...baseOptions, model: modelWithEffort }
			const result = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(result).toEqual({ reasoning_effort: "medium" })
		})
		it("should return undefined when model has no reasoning effort capability", () => {
			const result = (0, reasoning_1.getOpenAiReasoning)(baseOptions)
			expect(result).toBeUndefined()
		})
		it("should return undefined when supportsReasoningEffort is true but no effort is specified", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningEffort: true,
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: {},
				reasoningEffort: undefined,
			}
			const result = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(result).toBeUndefined()
		})
		it("should handle undefined reasoningEffort", () => {
			const modelWithEffort = {
				...baseModel,
				reasoningEffort: "medium",
			}
			const optionsWithoutEffort = {
				...baseOptions,
				model: modelWithEffort,
				reasoningEffort: undefined,
			}
			const result = (0, reasoning_1.getOpenAiReasoning)(optionsWithoutEffort)
			expect(result).toEqual({ reasoning_effort: undefined })
		})
		it("should handle all reasoning effort values", () => {
			const efforts = ["low", "medium", "high"]
			efforts.forEach((effort) => {
				const modelWithEffort = {
					...baseModel,
					reasoningEffort: effort,
				}
				const options = { ...baseOptions, model: modelWithEffort, reasoningEffort: effort }
				const result = (0, reasoning_1.getOpenAiReasoning)(options)
				expect(result).toEqual({ reasoning_effort: effort })
			})
		})
		it("should not be affected by reasoningBudget parameter", () => {
			const modelWithEffort = {
				...baseModel,
				reasoningEffort: "medium",
			}
			const optionsWithBudget = {
				...baseOptions,
				model: modelWithEffort,
				reasoningBudget: 5000,
			}
			const result = (0, reasoning_1.getOpenAiReasoning)(optionsWithBudget)
			expect(result).toEqual({ reasoning_effort: "medium" })
		})
		it("should ignore reasoning budget capabilities for OpenAI", () => {
			const modelWithBudget = {
				...baseModel,
				supportsReasoningBudget: true,
				requiredReasoningBudget: true,
			}
			const settingsWithEnabled = {
				enableReasoningEffort: true,
			}
			const options = {
				...baseOptions,
				model: modelWithBudget,
				settings: settingsWithEnabled,
			}
			const result = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(result).toBeUndefined()
		})
	})
	describe("Integration scenarios", () => {
		it("should handle model with requiredReasoningBudget across all providers", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const options = {
				...baseOptions,
				model: modelWithRequired,
			}
			const openRouterResult = (0, reasoning_1.getOpenRouterReasoning)(options)
			const anthropicResult = (0, reasoning_1.getAnthropicReasoning)(options)
			const openAiResult = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(openRouterResult).toEqual({ max_tokens: 1000 })
			expect(anthropicResult).toEqual({ type: "enabled", budget_tokens: 1000 })
			expect(openAiResult).toBeUndefined()
		})
		it("should handle model with supportsReasoningEffort across all providers", () => {
			const modelWithSupported = {
				...baseModel,
				supportsReasoningEffort: true,
			}
			const settingsWithEffort = {
				reasoningEffort: "high",
			}
			const options = {
				...baseOptions,
				model: modelWithSupported,
				settings: settingsWithEffort,
				reasoningEffort: "high",
			}
			const openRouterResult = (0, reasoning_1.getOpenRouterReasoning)(options)
			const anthropicResult = (0, reasoning_1.getAnthropicReasoning)(options)
			const openAiResult = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(openRouterResult).toEqual({ effort: "high" })
			expect(anthropicResult).toBeUndefined()
			expect(openAiResult).toEqual({ reasoning_effort: "high" })
		})
		it("should handle model with both reasoning capabilities - budget takes precedence", () => {
			const hybridModel = {
				...baseModel,
				supportsReasoningBudget: true,
				reasoningEffort: "medium",
			}
			const settingsWithBoth = {
				enableReasoningEffort: true,
				reasoningEffort: "high",
			}
			const options = {
				...baseOptions,
				model: hybridModel,
				settings: settingsWithBoth,
			}
			const openRouterResult = (0, reasoning_1.getOpenRouterReasoning)(options)
			const anthropicResult = (0, reasoning_1.getAnthropicReasoning)(options)
			const openAiResult = (0, reasoning_1.getOpenAiReasoning)(options)
			// Budget should take precedence for OpenRouter and Anthropic
			expect(openRouterResult).toEqual({ max_tokens: 1000 })
			expect(anthropicResult).toEqual({ type: "enabled", budget_tokens: 1000 })
			// OpenAI should still use effort since it doesn't support budget
			expect(openAiResult).toEqual({ reasoning_effort: "medium" })
		})
		it("should handle empty settings", () => {
			const options = {
				...baseOptions,
				settings: {},
			}
			const openRouterResult = (0, reasoning_1.getOpenRouterReasoning)(options)
			const anthropicResult = (0, reasoning_1.getAnthropicReasoning)(options)
			const openAiResult = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(openRouterResult).toBeUndefined()
			expect(anthropicResult).toBeUndefined()
			expect(openAiResult).toBeUndefined()
		})
		it("should handle undefined settings", () => {
			const options = {
				...baseOptions,
				settings: undefined,
			}
			const openRouterResult = (0, reasoning_1.getOpenRouterReasoning)(options)
			const anthropicResult = (0, reasoning_1.getAnthropicReasoning)(options)
			const openAiResult = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(openRouterResult).toBeUndefined()
			expect(anthropicResult).toBeUndefined()
			expect(openAiResult).toBeUndefined()
		})
		it("should handle model with reasoningEffort property", () => {
			const modelWithEffort = {
				...baseModel,
				reasoningEffort: "low",
			}
			const options = {
				...baseOptions,
				model: modelWithEffort,
				reasoningEffort: "low", // Override the baseOptions reasoningEffort
			}
			const openRouterResult = (0, reasoning_1.getOpenRouterReasoning)(options)
			const anthropicResult = (0, reasoning_1.getAnthropicReasoning)(options)
			const openAiResult = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(openRouterResult).toEqual({ effort: "low" })
			expect(anthropicResult).toBeUndefined()
			expect(openAiResult).toEqual({ reasoning_effort: "low" })
		})
	})
	describe("Type safety", () => {
		it("should return correct types for OpenRouter reasoning params", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const options = { ...baseOptions, model: modelWithRequired }
			const result = (0, reasoning_1.getOpenRouterReasoning)(options)
			expect(result).toBeDefined()
			if (result) {
				expect(typeof result).toBe("object")
				expect("max_tokens" in result || "effort" in result || "exclude" in result).toBe(true)
			}
		})
		it("should return correct types for Anthropic reasoning params", () => {
			const modelWithRequired = {
				...baseModel,
				requiredReasoningBudget: true,
			}
			const options = { ...baseOptions, model: modelWithRequired }
			const result = (0, reasoning_1.getAnthropicReasoning)(options)
			expect(result).toBeDefined()
			if (result) {
				expect(result).toHaveProperty("type", "enabled")
				expect(result).toHaveProperty("budget_tokens")
			}
		})
		it("should return correct types for OpenAI reasoning params", () => {
			const modelWithEffort = {
				...baseModel,
				reasoningEffort: "medium",
			}
			const options = { ...baseOptions, model: modelWithEffort }
			const result = (0, reasoning_1.getOpenAiReasoning)(options)
			expect(result).toBeDefined()
			if (result) {
				expect(result).toHaveProperty("reasoning_effort")
			}
		})
	})
})
//# sourceMappingURL=reasoning.spec.js.map
