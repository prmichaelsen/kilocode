"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.getRooCodeApiUrl =
	exports.getClerkBaseUrl =
	exports.PRODUCTION_ROO_CODE_API_URL =
	exports.PRODUCTION_CLERK_BASE_URL =
		void 0
exports.PRODUCTION_CLERK_BASE_URL = "https://clerk.roocode.com"
exports.PRODUCTION_ROO_CODE_API_URL = "https://app.roocode.com"
const getClerkBaseUrl = () => process.env.CLERK_BASE_URL || exports.PRODUCTION_CLERK_BASE_URL
exports.getClerkBaseUrl = getClerkBaseUrl
const getRooCodeApiUrl = () => process.env.ROO_CODE_API_URL || exports.PRODUCTION_ROO_CODE_API_URL
exports.getRooCodeApiUrl = getRooCodeApiUrl
//# sourceMappingURL=config.js.map
