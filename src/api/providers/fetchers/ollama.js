"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.parseOllamaModel = void 0
exports.getOllamaModels = getOllamaModels
const axios_1 = __importDefault(require("axios"))
const types_1 = require("@roo-code/types")
const zod_1 = require("zod")
const OllamaModelDetailsSchema = zod_1.z.object({
	family: zod_1.z.string(),
	families: zod_1.z.array(zod_1.z.string()).nullable().optional(),
	format: zod_1.z.string().optional(),
	parameter_size: zod_1.z.string(),
	parent_model: zod_1.z.string().optional(),
	quantization_level: zod_1.z.string().optional(),
})
const OllamaModelSchema = zod_1.z.object({
	details: OllamaModelDetailsSchema,
	digest: zod_1.z.string().optional(),
	model: zod_1.z.string(),
	modified_at: zod_1.z.string().optional(),
	name: zod_1.z.string(),
	size: zod_1.z.number().optional(),
})
const OllamaModelInfoResponseSchema = zod_1.z.object({
	modelfile: zod_1.z.string().optional(),
	parameters: zod_1.z.string().optional(),
	template: zod_1.z.string().optional(),
	details: OllamaModelDetailsSchema,
	model_info: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
	capabilities: zod_1.z.array(zod_1.z.string()).optional(),
})
const OllamaModelsResponseSchema = zod_1.z.object({
	models: zod_1.z.array(OllamaModelSchema),
})
const parseOllamaModel = (
	rawModel,
	// kilocode_change start
	baseUrl,
	numCtx,
) => {
	// kilocode_change start
	const contextKey = Object.keys(rawModel.model_info).find((k) => k.includes("context_length"))
	const contextLengthFromModelInfo =
		contextKey && typeof rawModel.model_info[contextKey] === "number" ? rawModel.model_info[contextKey] : undefined
	const contextLengthFromModelParameters =
		typeof rawModel.parameters === "string"
			? parseInt(rawModel.parameters.match(/^num_ctx\s+(\d+)/m)?.[1] ?? "", 10) || undefined
			: undefined
	const contextLengthFromEnvironment = parseInt(process.env.OLLAMA_CONTEXT_LENGTH ?? "", 10) || undefined
	const contextWindow =
		numCtx ??
		(baseUrl?.toLowerCase().startsWith("https://ollama.com") ? contextLengthFromModelInfo : undefined) ??
		contextLengthFromEnvironment ??
		(contextLengthFromModelParameters !== 40960 ? contextLengthFromModelParameters : undefined) ?? // Alledgedly Ollama sometimes returns an undefind context as 40960
		4096 // This is usually the default: https://github.com/ollama/ollama/blob/4383a3ab7a075eff78b31f7dc84c747e2fcd22b8/docs/faq.md#how-can-i-specify-the-context-window-size
	// kilocode_change end
	const modelInfo = Object.assign({}, types_1.ollamaDefaultModelInfo, {
		description: `Family: ${rawModel.details.family}, Context: ${contextWindow}, Size: ${rawModel.details.parameter_size}`,
		contextWindow: contextWindow || types_1.ollamaDefaultModelInfo.contextWindow,
		supportsPromptCache: true,
		supportsImages: rawModel.capabilities?.includes("vision"),
		supportsComputerUse: false,
		maxTokens: contextWindow || types_1.ollamaDefaultModelInfo.contextWindow,
	})
	return modelInfo
}
exports.parseOllamaModel = parseOllamaModel
async function getOllamaModels(baseUrl = "http://localhost:11434", apiKey, numCtx) {
	const models = {}
	// clearing the input can leave an empty string; use the default in that case
	baseUrl = baseUrl === "" ? "http://localhost:11434" : baseUrl
	try {
		if (!URL.canParse(baseUrl)) {
			return models
		}
		// Prepare headers with optional API key
		const headers = {}
		if (apiKey) {
			headers["Authorization"] = `Bearer ${apiKey}`
		}
		const response = await axios_1.default.get(`${baseUrl}/api/tags`, { headers })
		const parsedResponse = OllamaModelsResponseSchema.safeParse(response.data)
		let modelInfoPromises = []
		if (parsedResponse.success) {
			for (const ollamaModel of parsedResponse.data.models) {
				modelInfoPromises.push(
					axios_1.default
						.post(
							`${baseUrl}/api/show`,
							{
								model: ollamaModel.model,
							},
							{ headers },
						)
						.then((ollamaModelInfo) => {
							models[ollamaModel.name] = (0, exports.parseOllamaModel)(
								ollamaModelInfo.data,
								// kilocode_change start
								baseUrl,
								numCtx,
							)
						}),
				)
			}
			await Promise.all(modelInfoPromises)
		} else {
			console.error(`Error parsing Ollama models response: ${JSON.stringify(parsedResponse.error, null, 2)}`)
		}
	} catch (error) {
		if (error.code === "ECONNREFUSED") {
			console.warn(`Failed connecting to Ollama at ${baseUrl}`)
		} else {
			console.error(
				`Error fetching Ollama models: ${JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}`,
			)
		}
	}
	return models
}
//# sourceMappingURL=ollama.js.map
