"use strict"
// kilocode_change: file added
// npx vitest core/prompts/__tests__/system-prompt.spec.ts
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
vi.mock("os", () => ({
	default: {
		homedir: () => "/home/user",
		platform: () => "linux",
		arch: () => "x64",
		type: () => "Linux",
		release: () => "5.4.0",
		hostname: () => "test-host",
		tmpdir: () => "/tmp",
		endianness: () => "LE",
		loadavg: () => [0, 0, 0],
		totalmem: () => 8589934592,
		freemem: () => 4294967296,
		cpus: () => [],
		networkInterfaces: () => ({}),
		userInfo: () => ({ username: "test", uid: 1000, gid: 1000, shell: "/bin/bash", homedir: "/home/user" }),
	},
	homedir: () => "/home/user",
	platform: () => "linux",
	arch: () => "x64",
	type: () => "Linux",
	release: () => "5.4.0",
	hostname: () => "test-host",
	tmpdir: () => "/tmp",
	endianness: () => "LE",
	loadavg: () => [0, 0, 0],
	totalmem: () => 8589934592,
	freemem: () => 4294967296,
	cpus: () => [],
	networkInterfaces: () => ({}),
	userInfo: () => ({ username: "test", uid: 1000, gid: 1000, shell: "/bin/bash", homedir: "/home/user" }),
}))
vi.mock("default-shell", () => ({
	default: "/bin/zsh",
}))
vi.mock("os-name", () => ({
	default: () => "Linux",
}))
vi.mock("fs/promises")
const system_1 = require("../../system")
const modes_1 = require("../../../../shared/modes")
require("../../../../utils/path")
const multi_search_replace_1 = require("../../../diff/strategies/multi-search-replace")
// Mock the sections
vi.mock("../../sections/modes", () => ({
	getModesSection: vi.fn().mockImplementation(async () => `====\n\nMODES\n\n- Test modes section`),
}))
// Mock the custom instructions
vi.mock("../../sections/custom-instructions", () => {
	const addCustomInstructions = vi.fn()
	return {
		addCustomInstructions,
	}
})
// Set up default mock implementation
const customInstructionsMock = vi.mocked(
	await Promise.resolve().then(() => __importStar(require("../../sections/custom-instructions"))),
)
customInstructionsMock.addCustomInstructions.mockImplementation(
	async (modeCustomInstructions, globalCustomInstructions, cwd, mode, options) => {
		const sections = []
		// Add language preference if provided
		if (options?.language) {
			sections.push(
				`Language Preference:\nYou should always speak and think in the "${options.language}" language.`,
			)
		}
		// Add global instructions first
		if (globalCustomInstructions?.trim()) {
			sections.push(`Global Instructions:\n${globalCustomInstructions.trim()}`)
		}
		// Add mode-specific instructions after
		if (modeCustomInstructions?.trim()) {
			sections.push(`Mode-specific Instructions:\n${modeCustomInstructions}`)
		}
		// Add rules
		const rules = []
		if (mode) {
			rules.push(`# Rules from .clinerules-${mode}:\nMock mode-specific rules`)
		}
		rules.push(`# Rules from .clinerules:\nMock generic rules`)
		if (rules.length > 0) {
			sections.push(`Rules:\n${rules.join("\n")}`)
		}
		const joinedSections = sections.join("\n\n")
		return joinedSections
			? `\n====\n\nUSER'S CUSTOM INSTRUCTIONS\n\nThe following additional instructions are provided by the user, and should be followed to the best of your ability without interfering with the TOOL USE guidelines.\n\n${joinedSections}`
			: ""
	},
)
// Mock vscode language
vi.mock("vscode", () => ({
	env: {
		language: "en",
	},
	workspace: {
		workspaceFolders: [{ uri: { fsPath: "/test/path" } }],
		getWorkspaceFolder: vi.fn().mockReturnValue({ uri: { fsPath: "/test/path" } }),
	},
	window: {
		activeTextEditor: undefined,
	},
	EventEmitter: vi.fn().mockImplementation(() => ({
		event: vi.fn(),
		fire: vi.fn(),
		dispose: vi.fn(),
	})),
}))
vi.mock("../../../utils/shell", () => ({
	getShell: () => "/bin/zsh",
}))
// Mock the isFastApplyAvailable function
vi.mock("../../../tools/editFileTool", () => ({
	isFastApplyAvailable: vi.fn(),
	getFastApplyModelType: vi.fn(),
}))
// Create a mock ExtensionContext
const mockContext = {
	extensionPath: "/mock/extension/path",
	globalStoragePath: "/mock/storage/path",
	storagePath: "/mock/storage/path",
	logPath: "/mock/log/path",
	subscriptions: [],
	workspaceState: {
		get: () => undefined,
		update: () => Promise.resolve(),
	},
	globalState: {
		get: () => undefined,
		update: () => Promise.resolve(),
		setKeysForSync: () => {},
	},
	extensionUri: { fsPath: "/mock/extension/path" },
	globalStorageUri: { fsPath: "/mock/settings/path" },
	asAbsolutePath: (relativePath) => `/mock/extension/path/${relativePath}`,
	extension: {
		packageJSON: {
			version: "1.0.0",
		},
	},
}
describe("SYSTEM_PROMPT", () => {
	let experiments
	beforeEach(() => {
		// Reset experiments before each test to ensure they're disabled by default.
		experiments = {}
	})
	beforeEach(async () => {
		vi.clearAllMocks()
		// Reset the mock to return false by default
		const { isFastApplyAvailable } = await Promise.resolve().then(() =>
			__importStar(require("../../../tools/editFileTool")),
		)
		vi.mocked(isFastApplyAvailable).mockReturnValue(false)
	})
	it("should exclude traditional editing tools and include Fast Apply instructions when morphFastApply is enabled", async () => {
		// Mock isFastApplyAvailable to return true for this test
		const { isFastApplyAvailable } = await Promise.resolve().then(() =>
			__importStar(require("../../../tools/editFileTool")),
		)
		vi.mocked(isFastApplyAvailable).mockReturnValue(true)
		const experimentsWithMorph = {
			morphFastApply: true,
		}
		const prompt = await (0, system_1.SYSTEM_PROMPT)(
			mockContext,
			"/test/path",
			false, // supportsComputerUse
			undefined, // mcpHub
			undefined, // diffStrategy
			undefined, // browserViewportSize
			modes_1.defaultModeSlug, // mode
			undefined, // customModePrompts
			undefined, // customModes
			undefined, // globalCustomInstructions
			undefined, // diffEnabled
			experimentsWithMorph,
			true, // enableMcpServerCreation
			undefined, // language
			undefined, // rooIgnoreInstructions
			undefined,
		)
		// Should include edit_file tool
		expect(prompt).toContain("## edit_file")
		// Should NOT include traditional editing tools
		expect(prompt).not.toContain("## apply_diff")
		expect(prompt).not.toContain("## write_to_file")
		expect(prompt).not.toContain("## insert_content")
		expect(prompt).not.toContain("## search_and_replace")
		// Should contain Fast Apply-specific instructions
		expect(prompt).toContain("FastApply is enabled")
		expect(prompt).toContain(
			"Traditional editing tools (apply_diff, write_to_file, insert_content, search_and_replace) are disabled",
		)
		expect(prompt).toContain("ONLY use the edit_file tool for file modifications")
	})
	it("should include traditional editing tools and exclude edit_file when morphFastApply is disabled", async () => {
		const experimentsWithoutMorph = {
			morphFastApply: false,
		}
		const prompt = await (0, system_1.SYSTEM_PROMPT)(
			mockContext,
			"/test/path",
			false, // supportsComputerUse
			undefined, // mcpHub
			new multi_search_replace_1.MultiSearchReplaceDiffStrategy(), // diffStrategy - include to test apply_diff
			undefined, // browserViewportSize
			modes_1.defaultModeSlug, // mode
			undefined, // customModePrompts
			undefined, // customModes
			undefined, // globalCustomInstructions
			true, // diffEnabled
			experimentsWithoutMorph,
			true, // enableMcpServerCreation
			undefined, // language
			undefined, // rooIgnoreInstructions
			undefined,
		)
		// Should NOT include edit_file tool
		expect(prompt).not.toContain("## edit_file")
		// Should include traditional editing tools
		expect(prompt).toContain("## apply_diff")
		expect(prompt).toContain("## write_to_file")
		expect(prompt).toContain("## insert_content")
		expect(prompt).toContain("## search_and_replace")
		// Should NOT contain Fast Apply-specific instructions
		expect(prompt).not.toContain("FastApply is enabled")
		expect(prompt).not.toContain(
			"Traditional editing tools (apply_diff, write_to_file, insert_content, search_and_replace) are disabled",
		)
		// Should contain traditional editing instructions
		expect(prompt).toContain("For editing files, you have access to these tools:")
	})
	it("should use Fast Apply editing instructions in rules section when morphFastApply is enabled", async () => {
		// Mock isFastApplyAvailable to return true for this test
		const { isFastApplyAvailable } = await Promise.resolve().then(() =>
			__importStar(require("../../../tools/editFileTool")),
		)
		vi.mocked(isFastApplyAvailable).mockReturnValue(true)
		const experimentsWithMorph = {
			morphFastApply: true,
		}
		const prompt = await (0, system_1.SYSTEM_PROMPT)(
			mockContext,
			"/test/path",
			false, // supportsComputerUse
			undefined, // mcpHub
			undefined, // diffStrategy
			undefined, // browserViewportSize
			modes_1.defaultModeSlug, // mode
			undefined, // customModePrompts
			undefined, // customModes
			undefined, // globalCustomInstructions
			undefined, // diffEnabled
			experimentsWithMorph,
			true, // enableMcpServerCreation
			undefined, // language
			undefined, // rooIgnoreInstructions
			undefined,
		)
		// Should contain Fast Apply-specific editing instructions in rules section
		expect(prompt).toContain("FastApply is enabled")
		expect(prompt).toContain("// ... existing code ...")
	})
	afterAll(() => {
		vi.restoreAllMocks()
	})
})
//# sourceMappingURL=system-prompt-morph.spec.js.map
