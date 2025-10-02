"use strict"
// npx vitest run src/__tests__/index.test.ts
Object.defineProperty(exports, "__esModule", { value: true })
const index_js_1 = require("../index.js")
describe("GLOBAL_STATE_KEYS", () => {
	it("should contain provider settings keys", () => {
		expect(index_js_1.GLOBAL_STATE_KEYS).toContain("autoApprovalEnabled")
	})
	it("should contain provider settings keys", () => {
		expect(index_js_1.GLOBAL_STATE_KEYS).toContain("anthropicBaseUrl")
	})
	it("should not contain secret state keys", () => {
		expect(index_js_1.GLOBAL_STATE_KEYS).not.toContain("openRouterApiKey")
	})
	it("should contain OpenAI Compatible base URL setting", () => {
		expect(index_js_1.GLOBAL_STATE_KEYS).toContain("codebaseIndexOpenAiCompatibleBaseUrl")
	})
	it("should not contain OpenAI Compatible API key (secret)", () => {
		expect(index_js_1.GLOBAL_STATE_KEYS).not.toContain("codebaseIndexOpenAiCompatibleApiKey")
	})
})
//# sourceMappingURL=index.test.js.map
