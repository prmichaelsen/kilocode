"use strict"
// npx vitest run src/api/providers/__tests__/gemini-cli.spec.ts
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
const vitest_1 = require("vitest")
const axios_1 = __importDefault(require("axios"))
const gemini_cli_1 = require("../gemini-cli")
// Mock axios
vitest_1.vi.mock("axios", () => ({
	default: {
		get: vitest_1.vi.fn(),
	},
}))
const mockAxios = vitest_1.vi.mocked(axios_1.default)
// Mock fs/promises
vitest_1.vi.mock("fs/promises", () => ({
	readFile: vitest_1.vi.fn(),
	writeFile: vitest_1.vi.fn(),
}))
// Mock google-auth-library
vitest_1.vi.mock("google-auth-library", () => ({
	OAuth2Client: vitest_1.vi.fn().mockImplementation(() => ({
		setCredentials: vitest_1.vi.fn(),
		refreshAccessToken: vitest_1.vi.fn(),
		request: vitest_1.vi.fn(),
	})),
}))
// Mock dotenvx
vitest_1.vi.mock("@dotenvx/dotenvx", () => ({
	config: vitest_1.vi.fn().mockReturnValue({ parsed: null, error: null }),
}))
;(0, vitest_1.describe)("GeminiCliHandler", () => {
	let handler
	let mockOptions
	;(0, vitest_1.beforeEach)(() => {
		vitest_1.vi.clearAllMocks()
		mockOptions = {
			apiModelId: "gemini-1.5-pro-latest",
			geminiCliOAuthPath: undefined,
			geminiCliProjectId: undefined,
		}
	})
	;(0, vitest_1.afterEach)(() => {
		vitest_1.vi.restoreAllMocks()
	})
	;(0, vitest_1.describe)("OAuth Config Fetching", () => {
		;(0, vitest_1.it)("should initialize without fetching config immediately", () => {
			// Act
			handler = new gemini_cli_1.GeminiCliHandler(mockOptions)
			// Assert - config should not be fetched during construction
			;(0, vitest_1.expect)(mockAxios.get).not.toHaveBeenCalled()
			;(0, vitest_1.expect)(handler["oauthClientId"]).toBeNull()
			;(0, vitest_1.expect)(handler["oauthClientSecret"]).toBeNull()
		})
		;(0, vitest_1.it)("should fetch OAuth config from API endpoint when fetchOAuthConfig is called", async () => {
			// Arrange
			const mockConfig = {
				geminiCli: {
					oauthClientId: "test-client-id",
					oauthClientSecret: "test-client-secret",
				},
			}
			mockAxios.get.mockResolvedValueOnce({ data: mockConfig })
			handler = new gemini_cli_1.GeminiCliHandler(mockOptions)
			// Act
			await handler["fetchOAuthConfig"]()
			// Assert
			;(0, vitest_1.expect)(mockAxios.get).toHaveBeenCalledWith("https://api.kilocode.ai/extension-config.json")
			;(0, vitest_1.expect)(handler["oauthClientId"]).toBe("test-client-id")
			;(0, vitest_1.expect)(handler["oauthClientSecret"]).toBe("test-client-secret")
		})
		;(0, vitest_1.it)("should throw error if OAuth config fetch fails", async () => {
			// Arrange
			const mockError = new Error("Network error")
			mockAxios.get.mockRejectedValueOnce(mockError)
			handler = new gemini_cli_1.GeminiCliHandler(mockOptions)
			// Act & Assert
			await (0, vitest_1.expect)(handler["fetchOAuthConfig"]()).rejects.toThrow()
		})
	})
	// The loadOAuthCredentials integration with fetchOAuthConfig is tested through actual usage
	// Individual components (fetchOAuthConfig) are tested above
})
//# sourceMappingURL=gemini-cli.spec.js.map
