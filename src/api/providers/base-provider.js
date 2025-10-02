"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.BaseProvider = void 0
const countTokens_1 = require("../../utils/countTokens")
/**
 * Base class for API providers that implements common functionality.
 */
class BaseProvider {
	/**
	 * Default token counting implementation using tiktoken.
	 * Providers can override this to use their native token counting endpoints.
	 *
	 * @param content The content to count tokens for
	 * @returns A promise resolving to the token count
	 */
	async countTokens(content) {
		if (content.length === 0) {
			return 0
		}
		return (0, countTokens_1.countTokens)(content, { useWorker: true })
	}
}
exports.BaseProvider = BaseProvider
//# sourceMappingURL=base-provider.js.map
