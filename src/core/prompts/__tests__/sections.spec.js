"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
const custom_instructions_1 = require("../sections/custom-instructions")
const capabilities_1 = require("../sections/capabilities")
describe("addCustomInstructions", () => {
	it("adds vscode language to custom instructions", async () => {
		const result = await (0, custom_instructions_1.addCustomInstructions)(
			"mode instructions",
			"global instructions",
			"/test/path",
			"test-mode",
			{ language: "fr" },
		)
		expect(result).toContain("Language Preference:")
		expect(result).toContain('You should always speak and think in the "Français" (fr) language')
	})
	it("works without vscode language", async () => {
		const result = await (0, custom_instructions_1.addCustomInstructions)(
			"mode instructions",
			"global instructions",
			"/test/path",
			"test-mode",
		)
		expect(result).not.toContain("Language Preference:")
		expect(result).not.toContain("You should always speak and think in")
	})
})
describe("getCapabilitiesSection", () => {
	const cwd = "/test/path"
	const mcpHub = undefined
	const mockDiffStrategy = {
		getName: () => "MockStrategy",
		getToolDescription: () => "apply_diff tool description",
		async applyDiff(_originalContent, _diffContents) {
			return { success: true, content: "mock result" }
		},
	}
	it("includes apply_diff in capabilities when diffStrategy is provided", () => {
		const result = (0, capabilities_1.getCapabilitiesSection)(cwd, false, mcpHub, mockDiffStrategy)
		expect(result).toContain("apply_diff or")
		expect(result).toContain("then use the apply_diff or write_to_file tool")
	})
	it("excludes apply_diff from capabilities when diffStrategy is undefined", () => {
		const result = (0, capabilities_1.getCapabilitiesSection)(cwd, false, mcpHub, undefined)
		expect(result).not.toContain("apply_diff or")
		expect(result).toContain("then use the write_to_file tool")
		expect(result).not.toContain("apply_diff or write_to_file")
	})
})
//# sourceMappingURL=sections.spec.js.map
