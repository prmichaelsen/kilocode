"use strict"
/**
 * HuggingFace provider constants
 */
Object.defineProperty(exports, "__esModule", { value: true })
exports.HUGGINGFACE_CACHE_DURATION =
	exports.HUGGINGFACE_API_URL =
	exports.HUGGINGFACE_TEMPERATURE_MAX_VALUE =
	exports.HUGGINGFACE_SLIDER_MIN =
	exports.HUGGINGFACE_SLIDER_STEP =
	exports.HUGGINGFACE_DEFAULT_CONTEXT_WINDOW =
	exports.HUGGINGFACE_MAX_TOKENS_FALLBACK =
	exports.HUGGINGFACE_DEFAULT_MAX_TOKENS =
		void 0
// Default values for HuggingFace models
exports.HUGGINGFACE_DEFAULT_MAX_TOKENS = 2048
exports.HUGGINGFACE_MAX_TOKENS_FALLBACK = 8192
exports.HUGGINGFACE_DEFAULT_CONTEXT_WINDOW = 128000
// UI constants
exports.HUGGINGFACE_SLIDER_STEP = 256
exports.HUGGINGFACE_SLIDER_MIN = 1
exports.HUGGINGFACE_TEMPERATURE_MAX_VALUE = 2
// API constants
exports.HUGGINGFACE_API_URL = "https://router.huggingface.co/v1/models?collection=roocode"
exports.HUGGINGFACE_CACHE_DURATION = 1000 * 60 * 60 // 1 hour
//# sourceMappingURL=huggingface.js.map
