"use strict"
// npx vitest run src/core/tools/__tests__/validateToolUse.spec.ts
Object.defineProperty(exports, "__esModule", { value: true })
const modes_1 = require("../../../shared/modes")
const tools_1 = require("../../../shared/tools")
const validateToolUse_1 = require("../validateToolUse")
const codeMode = modes_1.modes.find((m) => m.slug === "code")?.slug || "code"
const architectMode = modes_1.modes.find((m) => m.slug === "architect")?.slug || "architect"
const askMode = modes_1.modes.find((m) => m.slug === "ask")?.slug || "ask"
describe("mode-validator", () => {
	describe("isToolAllowedForMode", () => {
		describe("code mode", () => {
			it("allows all code mode tools", () => {
				// Code mode has all groups
				Object.entries(tools_1.TOOL_GROUPS).forEach(([_, config]) => {
					config.tools.forEach((tool) => {
						expect((0, modes_1.isToolAllowedForMode)(tool, codeMode, [])).toBe(true)
					})
				})
			})
			it("disallows unknown tools", () => {
				expect((0, modes_1.isToolAllowedForMode)("unknown_tool", codeMode, [])).toBe(false)
			})
		})
		describe("architect mode", () => {
			it("allows configured tools", () => {
				// Architect mode has read, browser, and mcp groups
				const architectTools = [
					...tools_1.TOOL_GROUPS.read.tools,
					...tools_1.TOOL_GROUPS.browser.tools,
					...tools_1.TOOL_GROUPS.mcp.tools,
				]
				architectTools.forEach((tool) => {
					expect((0, modes_1.isToolAllowedForMode)(tool, architectMode, [])).toBe(true)
				})
			})
		})
		describe("ask mode", () => {
			it("allows configured tools", () => {
				// Ask mode has read, browser, and mcp groups
				const askTools = [
					...tools_1.TOOL_GROUPS.read.tools,
					...tools_1.TOOL_GROUPS.browser.tools,
					...tools_1.TOOL_GROUPS.mcp.tools,
				]
				askTools.forEach((tool) => {
					expect((0, modes_1.isToolAllowedForMode)(tool, askMode, [])).toBe(true)
				})
			})
		})
		describe("custom modes", () => {
			it("allows tools from custom mode configuration", () => {
				const customModes = [
					{
						slug: "custom-mode",
						name: "Custom Mode",
						roleDefinition: "Custom role",
						groups: ["read", "edit"],
					},
				]
				// Should allow tools from read and edit groups
				expect((0, modes_1.isToolAllowedForMode)("read_file", "custom-mode", customModes)).toBe(true)
				expect((0, modes_1.isToolAllowedForMode)("write_to_file", "custom-mode", customModes)).toBe(true)
				// Should not allow tools from other groups
				expect((0, modes_1.isToolAllowedForMode)("execute_command", "custom-mode", customModes)).toBe(false)
			})
			it("allows custom mode to override built-in mode", () => {
				const customModes = [
					{
						slug: codeMode,
						name: "Custom Code Mode",
						roleDefinition: "Custom role",
						groups: ["read"],
					},
				]
				// Should allow tools from read group
				expect((0, modes_1.isToolAllowedForMode)("read_file", codeMode, customModes)).toBe(true)
				// Should not allow tools from other groups
				expect((0, modes_1.isToolAllowedForMode)("write_to_file", codeMode, customModes)).toBe(false)
			})
			it("respects tool requirements in custom modes", () => {
				const customModes = [
					{
						slug: "custom-mode",
						name: "Custom Mode",
						roleDefinition: "Custom role",
						groups: ["edit"],
					},
				]
				const requirements = { apply_diff: false }
				// Should respect disabled requirement even if tool group is allowed
				expect((0, modes_1.isToolAllowedForMode)("apply_diff", "custom-mode", customModes, requirements)).toBe(
					false,
				)
				// Should allow other edit tools
				expect(
					(0, modes_1.isToolAllowedForMode)("write_to_file", "custom-mode", customModes, requirements),
				).toBe(true)
			})
		})
		describe("tool requirements", () => {
			it("respects tool requirements when provided", () => {
				const requirements = { apply_diff: false }
				expect((0, modes_1.isToolAllowedForMode)("apply_diff", codeMode, [], requirements)).toBe(false)
				const enabledRequirements = { apply_diff: true }
				expect((0, modes_1.isToolAllowedForMode)("apply_diff", codeMode, [], enabledRequirements)).toBe(true)
			})
			it("allows tools when their requirements are not specified", () => {
				const requirements = { some_other_tool: true }
				expect((0, modes_1.isToolAllowedForMode)("apply_diff", codeMode, [], requirements)).toBe(true)
			})
			it("handles undefined and empty requirements", () => {
				expect((0, modes_1.isToolAllowedForMode)("apply_diff", codeMode, [], undefined)).toBe(true)
				expect((0, modes_1.isToolAllowedForMode)("apply_diff", codeMode, [], {})).toBe(true)
			})
			it("prioritizes requirements over mode configuration", () => {
				const requirements = { apply_diff: false }
				// Even in code mode which allows all tools, disabled requirement should take precedence
				expect((0, modes_1.isToolAllowedForMode)("apply_diff", codeMode, [], requirements)).toBe(false)
			})
		})
	})
	describe("validateToolUse", () => {
		it("throws error for disallowed tools in architect mode", () => {
			expect(() => (0, validateToolUse_1.validateToolUse)("unknown_tool", "architect", [])).toThrow(
				'Tool "unknown_tool" is not allowed in architect mode.',
			)
		})
		it("does not throw for allowed tools in architect mode", () => {
			expect(() => (0, validateToolUse_1.validateToolUse)("read_file", "architect", [])).not.toThrow()
		})
		it("throws error when tool requirement is not met", () => {
			const requirements = { apply_diff: false }
			expect(() => (0, validateToolUse_1.validateToolUse)("apply_diff", codeMode, [], requirements)).toThrow(
				'Tool "apply_diff" is not allowed in code mode.',
			)
		})
		it("does not throw when tool requirement is met", () => {
			const requirements = { apply_diff: true }
			expect(() => (0, validateToolUse_1.validateToolUse)("apply_diff", codeMode, [], requirements)).not.toThrow()
		})
		it("handles undefined requirements gracefully", () => {
			expect(() => (0, validateToolUse_1.validateToolUse)("apply_diff", codeMode, [], undefined)).not.toThrow()
		})
	})
})
//# sourceMappingURL=validateToolUse.spec.js.map
