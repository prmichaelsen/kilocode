"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const provider_settings_js_1 = require("../provider-settings.js")
describe("getApiProtocol", () => {
	describe("Anthropic-style providers", () => {
		it("should return 'anthropic' for anthropic provider", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("anthropic")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("anthropic", "gpt-4")).toBe("anthropic")
		})
		it("should return 'anthropic' for claude-code provider", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("claude-code")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("claude-code", "some-model")).toBe("anthropic")
		})
		it("should return 'anthropic' for bedrock provider", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("bedrock")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("bedrock", "gpt-4")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("bedrock", "claude-3-opus")).toBe("anthropic")
		})
	})
	describe("Vertex provider with Claude models", () => {
		it("should return 'anthropic' for vertex provider with claude models", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "claude-3-opus")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "Claude-3-Sonnet")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "CLAUDE-instant")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "anthropic/claude-3-haiku")).toBe("anthropic")
		})
		it("should return 'openai' for vertex provider with non-claude models", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "gpt-4")).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "gemini-pro")).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "llama-2")).toBe("openai")
		})
		it("should return 'openai' for vertex provider without model", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("vertex")).toBe("openai")
		})
	})
	describe("Vercel AI Gateway provider", () => {
		it("should return 'anthropic' for vercel-ai-gateway provider with anthropic models", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway", "anthropic/claude-3-opus")).toBe(
				"anthropic",
			)
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway", "anthropic/claude-3.5-sonnet")).toBe(
				"anthropic",
			)
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway", "ANTHROPIC/claude-sonnet-4")).toBe(
				"anthropic",
			)
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway", "anthropic/claude-opus-4.1")).toBe(
				"anthropic",
			)
		})
		it("should return 'openai' for vercel-ai-gateway provider with non-anthropic models", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway", "openai/gpt-4")).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway", "google/gemini-pro")).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway", "meta/llama-3")).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway", "mistral/mixtral")).toBe("openai")
		})
		it("should return 'openai' for vercel-ai-gateway provider without model", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("vercel-ai-gateway")).toBe("openai")
		})
	})
	describe("Other providers", () => {
		it("should return 'openai' for non-anthropic providers regardless of model", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("openrouter", "claude-3-opus")).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)("openai", "claude-3-sonnet")).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)("litellm", "claude-instant")).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)("ollama", "claude-model")).toBe("openai")
		})
	})
	describe("Edge cases", () => {
		it("should return 'openai' when provider is undefined", () => {
			expect((0, provider_settings_js_1.getApiProtocol)(undefined)).toBe("openai")
			expect((0, provider_settings_js_1.getApiProtocol)(undefined, "claude-3-opus")).toBe("openai")
		})
		it("should handle empty strings", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "")).toBe("openai")
		})
		it("should be case-insensitive for claude detection", () => {
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "CLAUDE-3-OPUS")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "claude-3-opus")).toBe("anthropic")
			expect((0, provider_settings_js_1.getApiProtocol)("vertex", "ClAuDe-InStAnT")).toBe("anthropic")
		})
	})
})
//# sourceMappingURL=provider-settings.test.js.map
