import { getSearchAndReplaceDescription } from "../search-and-replace"
import { ToolArgs } from "../types"

describe("getSearchAndReplaceDescription", () => {
	it("should generate description with correct cwd path", () => {
		const args: ToolArgs = {
			cwd: "/test/workspace",
			supportsComputerUse: false
		}

		const description = getSearchAndReplaceDescription(args)

		expect(description).toContain("relative to the current workspace directory /test/workspace")
		expect(description).toContain("## search_and_replace")
		expect(description).toContain("Required Parameters:")
		expect(description).toContain("- path: The path of the file to modify")
		expect(description).toContain("- search: The text or pattern to search for")
		expect(description).toContain("- replace: The text to replace matches with")
	})

	it("should handle different cwd paths", () => {
		const args: ToolArgs = {
			cwd: "/another/path",
			supportsComputerUse: true
		}

		const description = getSearchAndReplaceDescription(args)

		expect(description).toContain("relative to the current workspace directory /another/path")
	})
})