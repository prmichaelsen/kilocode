"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.tiktoken = tiktoken
const lite_1 = require("tiktoken/lite")
const o200k_base_1 = __importDefault(require("tiktoken/encoders/o200k_base"))
const TOKEN_FUDGE_FACTOR = 1.5
let encoder = null
async function tiktoken(content) {
	if (content.length === 0) {
		return 0
	}
	let totalTokens = 0
	// Lazily create and cache the encoder if it doesn't exist.
	if (!encoder) {
		encoder = new lite_1.Tiktoken(
			o200k_base_1.default.bpe_ranks,
			o200k_base_1.default.special_tokens,
			o200k_base_1.default.pat_str,
		)
	}
	// Process each content block using the cached encoder.
	for (const block of content) {
		if (block.type === "text") {
			const text = block.text || ""
			if (text.length > 0) {
				const tokens = encoder.encode(text, undefined, [])
				totalTokens += tokens.length
			}
		} else if (block.type === "image") {
			// For images, calculate based on data size.
			const imageSource = block.source
			if (imageSource && typeof imageSource === "object" && "data" in imageSource) {
				const base64Data = imageSource.data
				totalTokens += Math.ceil(Math.sqrt(base64Data.length))
			} else {
				totalTokens += 300 // Conservative estimate for unknown images
			}
		}
	}
	// Add a fudge factor to account for the fact that tiktoken is not always
	// accurate.
	return Math.ceil(totalTokens * TOKEN_FUDGE_FACTOR)
}
//# sourceMappingURL=tiktoken.js.map
