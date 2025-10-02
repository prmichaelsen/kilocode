"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.buildApiHandler = buildApiHandler
const providers_1 = require("./providers")
// kilocode_change start
const kilocode_openrouter_1 = require("./providers/kilocode-openrouter")
// kilocode_change end
const native_ollama_1 = require("./providers/native-ollama")
function buildApiHandler(configuration) {
	const { apiProvider, ...options } = configuration
	switch (apiProvider) {
		// kilocode_change start
		case "kilocode":
			return new kilocode_openrouter_1.KilocodeOpenrouterHandler(options)
		case "kilocode-openrouter": // temp typing fix
			return new kilocode_openrouter_1.KilocodeOpenrouterHandler(options)
		case "gemini-cli":
			return new providers_1.GeminiCliHandler(options)
		case "virtual-quota-fallback":
			return new providers_1.VirtualQuotaFallbackHandler(options)
		// kilocode_change end
		case "anthropic":
			return new providers_1.AnthropicHandler(options)
		case "claude-code":
			return new providers_1.ClaudeCodeHandler(options)
		case "glama":
			return new providers_1.GlamaHandler(options)
		case "openrouter":
			return new providers_1.OpenRouterHandler(options)
		case "bedrock":
			return new providers_1.AwsBedrockHandler(options)
		case "vertex":
			return options.apiModelId?.startsWith("claude")
				? new providers_1.AnthropicVertexHandler(options)
				: new providers_1.VertexHandler(options)
		case "openai":
			return new providers_1.OpenAiHandler(options)
		case "ollama":
			return new native_ollama_1.NativeOllamaHandler(options)
		case "lmstudio":
			return new providers_1.LmStudioHandler(options)
		case "gemini":
			return new providers_1.GeminiHandler(options)
		case "openai-native":
			return new providers_1.OpenAiNativeHandler(options)
		case "deepseek":
			return new providers_1.DeepSeekHandler(options)
		case "doubao":
			return new providers_1.DoubaoHandler(options)
		case "qwen-code":
			return new providers_1.QwenCodeHandler(options)
		case "moonshot":
			return new providers_1.MoonshotHandler(options)
		case "vscode-lm":
			return new providers_1.VsCodeLmHandler(options)
		case "mistral":
			return new providers_1.MistralHandler(options)
		case "unbound":
			return new providers_1.UnboundHandler(options)
		case "requesty":
			return new providers_1.RequestyHandler(options)
		case "human-relay":
			return new providers_1.HumanRelayHandler()
		case "fake-ai":
			return new providers_1.FakeAIHandler(options)
		case "xai":
			return new providers_1.XAIHandler(options)
		case "groq":
			return new providers_1.GroqHandler(options)
		case "deepinfra":
			return new providers_1.DeepInfraHandler(options)
		case "huggingface":
			return new providers_1.HuggingFaceHandler(options)
		case "chutes":
			return new providers_1.ChutesHandler(options)
		case "litellm":
			return new providers_1.LiteLLMHandler(options)
		case "cerebras":
			return new providers_1.CerebrasHandler(options)
		case "sambanova":
			return new providers_1.SambaNovaHandler(options)
		case "zai":
			return new providers_1.ZAiHandler(options)
		case "fireworks":
			return new providers_1.FireworksHandler(options)
		case "io-intelligence":
			return new providers_1.IOIntelligenceHandler(options)
		case "roo":
			// Never throw exceptions from provider constructors
			// The provider-proxy server will handle authentication and return appropriate error codes
			return new providers_1.RooHandler(options)
		case "featherless":
			return new providers_1.FeatherlessHandler(options)
		case "vercel-ai-gateway":
			return new providers_1.VercelAiGatewayHandler(options)
		default:
			apiProvider
			return new providers_1.AnthropicHandler(options)
	}
}
//# sourceMappingURL=index.js.map
