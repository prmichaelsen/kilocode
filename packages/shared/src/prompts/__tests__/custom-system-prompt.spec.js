"use strict"
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
// Mocks must come first, before imports
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
vi.mock("fs/promises", () => {
	const mockReadFile = vi.fn()
	const mockMkdir = vi.fn().mockResolvedValue(undefined)
	const mockAccess = vi.fn().mockResolvedValue(undefined)
	return {
		default: {
			readFile: mockReadFile,
			mkdir: mockMkdir,
			access: mockAccess,
		},
		readFile: mockReadFile,
		mkdir: mockMkdir,
		access: mockAccess,
	}
})
vi.mock("../../../utils/fs", () => ({
	fileExistsAtPath: vi.fn().mockResolvedValue(true),
	createDirectoriesForFile: vi.fn().mockResolvedValue([]),
}))
const system_1 = require("../system")
const modes_1 = require("../../../shared/modes")
const fs = __importStar(require("fs/promises"))
const utils_1 = require("./utils")
// Get the mocked fs module
const mockedFs = vi.mocked(fs)
// Create a mock ExtensionContext with relative paths instead of absolute paths
const mockContext = {
	extensionPath: "mock/extension/path",
	globalStoragePath: "mock/storage/path",
	storagePath: "mock/storage/path",
	logPath: "mock/log/path",
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
	extensionUri: { fsPath: "mock/extension/path" },
	globalStorageUri: { fsPath: "mock/settings/path" },
	asAbsolutePath: (relativePath) => `mock/extension/path/${relativePath}`,
	extension: {
		packageJSON: {
			version: "1.0.0",
		},
	},
}
describe("File-Based Custom System Prompt", () => {
	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks()
		// Default behavior: file doesn't exist
		mockedFs.readFile.mockRejectedValue({ code: "ENOENT" })
	})
	// Skipped on Windows due to timeout/flake issues
	it.skipIf(process.platform === "win32")(
		"should use default generation when no file-based system prompt is found",
		async () => {
			const customModePrompts = {
				[modes_1.defaultModeSlug]: {
					roleDefinition: "Test role definition",
				},
			}
			const prompt = await (0, system_1.SYSTEM_PROMPT)(
				mockContext,
				"test/path", // Using a relative path without leading slash
				false, // supportsComputerUse
				undefined, // mcpHub
				undefined, // diffStrategy
				undefined, // browserViewportSize
				modes_1.defaultModeSlug, // mode
				customModePrompts, // customModePrompts
				undefined, // customModes
				undefined, // globalCustomInstructions
				undefined, // diffEnabled
				undefined, // experiments
				true, // enableMcpServerCreation
				undefined, // language
				undefined, // rooIgnoreInstructions
				undefined,
			)
			// Should contain default sections
			expect(prompt).toContain("TOOL USE")
			expect(prompt).toContain("CAPABILITIES")
			expect(prompt).toContain("MODES")
			expect(prompt).toContain("Test role definition")
		},
	)
	it("should use file-based custom system prompt when available", async () => {
		// Mock the readFile to return content from a file
		const fileCustomSystemPrompt = "Custom system prompt from file"
		// When called with utf-8 encoding, return a string
		mockedFs.readFile.mockImplementation((filePath, options) => {
			// kilocode_change
			if (
				(0, utils_1.toPosix)(filePath).includes(`.kilocode/system-prompt-${modes_1.defaultModeSlug}`) &&
				options === "utf-8"
			) {
				return Promise.resolve(fileCustomSystemPrompt)
			}
			return Promise.reject({ code: "ENOENT" })
		})
		const prompt = await (0, system_1.SYSTEM_PROMPT)(
			mockContext,
			"test/path", // Using a relative path without leading slash
			false, // supportsComputerUse
			undefined, // mcpHub
			undefined, // diffStrategy
			undefined, // browserViewportSize
			modes_1.defaultModeSlug, // mode
			undefined, // customModePrompts
			undefined, // customModes
			undefined, // globalCustomInstructions
			undefined, // diffEnabled
			undefined, // experiments
			true, // enableMcpServerCreation
			undefined, // language
			undefined, // rooIgnoreInstructions
			undefined,
		)
		// Should contain role definition and file-based system prompt
		const expectedMode = (0, modes_1.getModeBySlug)(modes_1.defaultModeSlug) || modes_1.modes[0]
		expect(prompt).toContain(expectedMode.roleDefinition)
		expect(prompt).toContain(fileCustomSystemPrompt)
		// Should not contain any of the default sections
		expect(prompt).not.toContain("CAPABILITIES")
		expect(prompt).not.toContain("MODES")
	})
	it("should combine file-based system prompt with role definition and custom instructions", async () => {
		// Mock the readFile to return content from a file
		const fileCustomSystemPrompt = "Custom system prompt from file"
		mockedFs.readFile.mockImplementation((filePath, options) => {
			// kilocode_change
			if (
				(0, utils_1.toPosix)(filePath).includes(`.kilocode/system-prompt-${modes_1.defaultModeSlug}`) &&
				options === "utf-8"
			) {
				return Promise.resolve(fileCustomSystemPrompt)
			}
			return Promise.reject({ code: "ENOENT" })
		})
		// Define custom role definition
		const customRoleDefinition = "Custom role definition"
		const customModePrompts = {
			[modes_1.defaultModeSlug]: {
				roleDefinition: customRoleDefinition,
			},
		}
		const prompt = await (0, system_1.SYSTEM_PROMPT)(
			mockContext,
			"test/path", // Using a relative path without leading slash
			false, // supportsComputerUse
			undefined, // mcpHub
			undefined, // diffStrategy
			undefined, // browserViewportSize
			modes_1.defaultModeSlug, // mode
			customModePrompts, // customModePrompts
			undefined, // customModes
			undefined, // globalCustomInstructions
			undefined, // diffEnabled
			undefined, // experiments
			true, // enableMcpServerCreation
			undefined, // language
			undefined, // rooIgnoreInstructions
			undefined,
		)
		// Should contain custom role definition and file-based system prompt
		expect(prompt).toContain(customRoleDefinition)
		expect(prompt).toContain(fileCustomSystemPrompt)
		// Should not contain any of the default sections
		expect(prompt).not.toContain("CAPABILITIES")
		expect(prompt).not.toContain("MODES")
	})
})
//# sourceMappingURL=custom-system-prompt.spec.js.map
