"use strict"
/**
 * General error handler for OpenAI client errors
 * Transforms technical errors into user-friendly messages
 */
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.handleOpenAIError = handleOpenAIError
const setup_1 = __importDefault(require("../../../i18n/setup"))
const errorUtils_1 = require("../../../shared/kilocode/errorUtils")
/**
 * Handles OpenAI client errors and transforms them into user-friendly messages
 * @param error - The error to handle
 * @param providerName - The name of the provider for context in error messages
 * @returns The original error or a transformed user-friendly error
 */
function handleOpenAIError(error, providerName) {
	// kilocode_change start
	if (providerName === "KiloCode" && (0, errorUtils_1.isAnyRecognizedKiloCodeError)(error)) {
		throw error
	}
	// kilocode_change end
	if (error instanceof Error) {
		const msg = error.message || ""
		// Invalid character/ByteString conversion error in API key
		if (msg.includes("Cannot convert argument to a ByteString")) {
			return new Error(setup_1.default.t("common:errors.api.invalidKeyInvalidChars"))
		}
		// For other Error instances, wrap with provider-specific prefix
		return new Error(`${providerName} completion error: ${msg}`)
	}
	// Non-Error: wrap with provider-specific prefix
	return new Error(`${providerName} completion error: ${String(error)}`)
}
//# sourceMappingURL=openai-error-handler.js.map
