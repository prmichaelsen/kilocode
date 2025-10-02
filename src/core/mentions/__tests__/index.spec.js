"use strict"
// npx vitest core/mentions/__tests__/index.spec.ts
var __createBinding =
	(this && this.__createBinding) ||
	(Object.create
		? function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				var desc = Object.getOwnPropertyDescriptor(m, k)
				if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
					desc = {
						enumerable: true,
						get: function () {
							return m[k]
						},
					}
				}
				Object.defineProperty(o, k2, desc)
			}
		: function (o, m, k, k2) {
				if (k2 === undefined) k2 = k
				o[k2] = m[k]
			})
var __setModuleDefault =
	(this && this.__setModuleDefault) ||
	(Object.create
		? function (o, v) {
				Object.defineProperty(o, "default", { enumerable: true, value: v })
			}
		: function (o, v) {
				o["default"] = v
			})
var __importStar =
	(this && this.__importStar) ||
	(function () {
		var ownKeys = function (o) {
			ownKeys =
				Object.getOwnPropertyNames ||
				function (o) {
					var ar = []
					for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k
					return ar
				}
			return ownKeys(o)
		}
		return function (mod) {
			if (mod && mod.__esModule) return mod
			var result = {}
			if (mod != null)
				for (var k = ownKeys(mod), i = 0; i < k.length; i++)
					if (k[i] !== "default") __createBinding(result, mod, k[i])
			__setModuleDefault(result, mod)
			return result
		}
	})()
Object.defineProperty(exports, "__esModule", { value: true })
const vscode = __importStar(require("vscode"))
const index_1 = require("../index")
// Mock vscode
vi.mock("vscode", () => ({
	window: {
		showErrorMessage: vi.fn(),
	},
}))
// Mock i18n
vi.mock("../../../i18n", () => ({
	t: vi.fn((key) => key),
}))
describe("parseMentions - URL error handling", () => {
	let mockUrlContentFetcher
	let consoleErrorSpy
	beforeEach(() => {
		vi.clearAllMocks()
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
		mockUrlContentFetcher = {
			launchBrowser: vi.fn(),
			urlToMarkdown: vi.fn(),
			closeBrowser: vi.fn(),
		}
	})
	it("should handle timeout errors with appropriate message", async () => {
		const timeoutError = new Error("Navigation timeout of 30000 ms exceeded")
		vi.mocked(mockUrlContentFetcher.urlToMarkdown).mockRejectedValue(timeoutError)
		const result = await (0, index_1.parseMentions)("Check @https://example.com", "/test", mockUrlContentFetcher)
		expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching URL https://example.com:", timeoutError)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("common:errors.url_fetch_error_with_url")
		expect(result).toContain("Error fetching content: Navigation timeout of 30000 ms exceeded")
	})
	it("should handle DNS resolution errors", async () => {
		const dnsError = new Error("net::ERR_NAME_NOT_RESOLVED")
		vi.mocked(mockUrlContentFetcher.urlToMarkdown).mockRejectedValue(dnsError)
		const result = await (0, index_1.parseMentions)(
			"Check @https://nonexistent.example",
			"/test",
			mockUrlContentFetcher,
		)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("common:errors.url_fetch_error_with_url")
		expect(result).toContain("Error fetching content: net::ERR_NAME_NOT_RESOLVED")
	})
	it("should handle network disconnection errors", async () => {
		const networkError = new Error("net::ERR_INTERNET_DISCONNECTED")
		vi.mocked(mockUrlContentFetcher.urlToMarkdown).mockRejectedValue(networkError)
		const result = await (0, index_1.parseMentions)("Check @https://example.com", "/test", mockUrlContentFetcher)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("common:errors.url_fetch_error_with_url")
		expect(result).toContain("Error fetching content: net::ERR_INTERNET_DISCONNECTED")
	})
	it("should handle 403 Forbidden errors", async () => {
		const forbiddenError = new Error("403 Forbidden")
		vi.mocked(mockUrlContentFetcher.urlToMarkdown).mockRejectedValue(forbiddenError)
		const result = await (0, index_1.parseMentions)("Check @https://example.com", "/test", mockUrlContentFetcher)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("common:errors.url_fetch_error_with_url")
		expect(result).toContain("Error fetching content: 403 Forbidden")
	})
	it("should handle 404 Not Found errors", async () => {
		const notFoundError = new Error("404 Not Found")
		vi.mocked(mockUrlContentFetcher.urlToMarkdown).mockRejectedValue(notFoundError)
		const result = await (0, index_1.parseMentions)(
			"Check @https://example.com/missing",
			"/test",
			mockUrlContentFetcher,
		)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("common:errors.url_fetch_error_with_url")
		expect(result).toContain("Error fetching content: 404 Not Found")
	})
	it("should handle generic errors with fallback message", async () => {
		const genericError = new Error("Some unexpected error")
		vi.mocked(mockUrlContentFetcher.urlToMarkdown).mockRejectedValue(genericError)
		const result = await (0, index_1.parseMentions)("Check @https://example.com", "/test", mockUrlContentFetcher)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("common:errors.url_fetch_error_with_url")
		expect(result).toContain("Error fetching content: Some unexpected error")
	})
	it("should handle non-Error objects thrown", async () => {
		const nonErrorObject = { code: "UNKNOWN", details: "Something went wrong" }
		vi.mocked(mockUrlContentFetcher.urlToMarkdown).mockRejectedValue(nonErrorObject)
		const result = await (0, index_1.parseMentions)("Check @https://example.com", "/test", mockUrlContentFetcher)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith("common:errors.url_fetch_error_with_url")
		expect(result).toContain("Error fetching content:")
	})
	it("should handle browser launch errors correctly", async () => {
		const launchError = new Error("Failed to launch browser")
		vi.mocked(mockUrlContentFetcher.launchBrowser).mockRejectedValue(launchError)
		const result = await (0, index_1.parseMentions)("Check @https://example.com", "/test", mockUrlContentFetcher)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			"Error fetching content for https://example.com: Failed to launch browser",
		)
		expect(result).toContain("Error fetching content: Failed to launch browser")
		// Should not attempt to fetch URL if browser launch failed
		expect(mockUrlContentFetcher.urlToMarkdown).not.toHaveBeenCalled()
	})
	it("should handle browser launch errors without message property", async () => {
		const launchError = "String error"
		vi.mocked(mockUrlContentFetcher.launchBrowser).mockRejectedValue(launchError)
		const result = await (0, index_1.parseMentions)("Check @https://example.com", "/test", mockUrlContentFetcher)
		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			"Error fetching content for https://example.com: String error",
		)
		expect(result).toContain("Error fetching content: String error")
	})
	it("should successfully fetch URL content when no errors occur", async () => {
		vi.mocked(mockUrlContentFetcher.urlToMarkdown).mockResolvedValue("# Example Content\n\nThis is the content.")
		const result = await (0, index_1.parseMentions)("Check @https://example.com", "/test", mockUrlContentFetcher)
		expect(vscode.window.showErrorMessage).not.toHaveBeenCalled()
		expect(result).toContain('<url_content url="https://example.com">')
		expect(result).toContain("# Example Content\n\nThis is the content.")
		expect(result).toContain("</url_content>")
	})
	it("should handle multiple URLs with mixed success and failure", async () => {
		vi.mocked(mockUrlContentFetcher.urlToMarkdown)
			.mockResolvedValueOnce("# First Site")
			.mockRejectedValueOnce(new Error("timeout"))
		const result = await (0, index_1.parseMentions)(
			"Check @https://example1.com and @https://example2.com",
			"/test",
			mockUrlContentFetcher,
		)
		expect(result).toContain('<url_content url="https://example1.com">')
		expect(result).toContain("# First Site")
		expect(result).toContain('<url_content url="https://example2.com">')
		expect(result).toContain("Error fetching content: timeout")
	})
})
//# sourceMappingURL=index.spec.js.map
