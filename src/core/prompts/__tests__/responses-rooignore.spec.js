"use strict"
// npx vitest core/prompts/__tests__/responses-rooignore.spec.ts
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
const responses_1 = require("../responses")
const RooIgnoreController_1 = require("../../ignore/RooIgnoreController")
const fs_1 = require("../../../utils/fs")
const fs = __importStar(require("fs/promises"))
const utils_1 = require("./utils")
// Mock dependencies
vi.mock("../../../utils/fs")
vi.mock("fs/promises")
vi.mock("vscode", () => {
	const mockDisposable = { dispose: vi.fn() }
	return {
		workspace: {
			createFileSystemWatcher: vi.fn(() => ({
				onDidCreate: vi.fn(() => mockDisposable),
				onDidChange: vi.fn(() => mockDisposable),
				onDidDelete: vi.fn(() => mockDisposable),
				dispose: vi.fn(),
			})),
		},
		RelativePattern: vi.fn(),
	}
})
describe("RooIgnore Response Formatting", () => {
	const TEST_CWD = "/test/path"
	let mockFileExists
	let mockReadFile
	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks()
		// Setup fs mocks
		mockFileExists = fs_1.fileExistsAtPath
		mockReadFile = fs.readFile
		// Default mock implementations
		mockFileExists.mockResolvedValue(true)
		mockReadFile.mockResolvedValue("node_modules\n.git\nsecrets/**\n*.log")
	})
	describe("formatResponse.rooIgnoreError", () => {
		/**
		 * Tests the error message format for ignored files
		 */
		it("should format error message for ignored files", () => {
			const errorMessage = responses_1.formatResponse.rooIgnoreError("secrets/api-keys.json")
			// Verify error message format
			expect(errorMessage).toContain(
				"Access to secrets/api-keys.json is blocked by the .kilocodeignore file settings",
			)
			expect(errorMessage).toContain("continue in the task without using this file")
			expect(errorMessage).toContain("ask the user to update the .kilocodeignore file")
		})
		/**
		 * Tests with different file paths
		 */
		it("should include the file path in the error message", () => {
			const paths = ["node_modules/package.json", ".git/HEAD", "secrets/credentials.env", "logs/app.log"]
			// Test each path
			for (const testPath of paths) {
				const errorMessage = responses_1.formatResponse.rooIgnoreError(testPath)
				expect(errorMessage).toContain(`Access to ${testPath} is blocked`)
			}
		})
	})
	describe("formatResponse.formatFilesList with RooIgnoreController", () => {
		/**
		 * Tests file listing with rooignore controller
		 */
		it("should format files list with lock symbols for ignored files", async () => {
			// Create controller
			const controller = new RooIgnoreController_1.RooIgnoreController(TEST_CWD)
			await controller.initialize()
			// Mock validateAccess to control which files are ignored
			controller.validateAccess = vi.fn().mockImplementation((filePath) => {
				// Only allow files not matching these patterns
				return (
					!filePath.includes("node_modules") &&
					!filePath.includes(".git") &&
					!(0, utils_1.toPosix)(filePath).includes("secrets/")
				)
			})
			// Files list with mixed allowed/ignored files
			const files = [
				"src/app.ts", // allowed
				"node_modules/package.json", // ignored
				"README.md", // allowed
				".git/HEAD", // ignored
				"secrets/keys.json", // ignored
			]
			// Format with controller
			const result = responses_1.formatResponse.formatFilesList(TEST_CWD, files, false, controller, true)
			// Should contain each file
			expect(result).toContain("src/app.ts")
			expect(result).toContain("README.md")
			// Should contain lock symbols for ignored files - case insensitive check using regex
			expect(result).toMatch(
				new RegExp(`${RooIgnoreController_1.LOCK_TEXT_SYMBOL}.*node_modules/package.json`, "i"),
			)
			expect(result).toMatch(new RegExp(`${RooIgnoreController_1.LOCK_TEXT_SYMBOL}.*\\.git/HEAD`, "i"))
			expect(result).toMatch(new RegExp(`${RooIgnoreController_1.LOCK_TEXT_SYMBOL}.*secrets/keys.json`, "i"))
			// No lock symbols for allowed files
			expect(result).not.toContain(`${RooIgnoreController_1.LOCK_TEXT_SYMBOL} src/app.ts`)
			expect(result).not.toContain(`${RooIgnoreController_1.LOCK_TEXT_SYMBOL} README.md`)
		})
		/**
		 * Tests formatFilesList when showRooIgnoredFiles is set to false
		 */
		it("should hide ignored files when showRooIgnoredFiles is false", async () => {
			// Create controller
			const controller = new RooIgnoreController_1.RooIgnoreController(TEST_CWD)
			await controller.initialize()
			// Mock validateAccess to control which files are ignored
			controller.validateAccess = vi.fn().mockImplementation((filePath) => {
				// Only allow files not matching these patterns
				return (
					!filePath.includes("node_modules") &&
					!filePath.includes(".git") &&
					!(0, utils_1.toPosix)(filePath).includes("secrets/")
				)
			})
			// Files list with mixed allowed/ignored files
			const files = [
				"src/app.ts", // allowed
				"node_modules/package.json", // ignored
				"README.md", // allowed
				".git/HEAD", // ignored
				"secrets/keys.json", // ignored
			]
			// Format with controller and showRooIgnoredFiles = false
			const result = responses_1.formatResponse.formatFilesList(TEST_CWD, files, false, controller, false)
			// Should contain allowed files
			expect(result).toContain("src/app.ts")
			expect(result).toContain("README.md")
			// Should NOT contain ignored files (even with lock symbols)
			expect(result).not.toContain("node_modules/package.json")
			expect(result).not.toContain(".git/HEAD")
			expect(result).not.toContain("secrets/keys.json")
			// Double-check with regex to ensure no form of these filenames appears
			expect(result).not.toMatch(/node_modules\/package\.json/i)
			expect(result).not.toMatch(/\.git\/HEAD/i)
			expect(result).not.toMatch(/secrets\/keys\.json/i)
		})
		/**
		 * Tests formatFilesList handles truncation correctly with RooIgnoreController
		 */
		it("should handle truncation with RooIgnoreController", async () => {
			// Create controller
			const controller = new RooIgnoreController_1.RooIgnoreController(TEST_CWD)
			await controller.initialize()
			// Format with controller and truncation flag
			const result = responses_1.formatResponse.formatFilesList(
				TEST_CWD,
				["file1.txt", "file2.txt"],
				true, // didHitLimit = true
				controller,
				true,
			)
			// Should contain truncation message (case-insensitive check)
			expect(result).toContain("File list truncated")
			expect(result).toMatch(/use list_files on specific subdirectories/i)
		})
		/**
		 * Tests formatFilesList handles empty results
		 */
		it("should handle empty file list with RooIgnoreController", async () => {
			// Create controller
			const controller = new RooIgnoreController_1.RooIgnoreController(TEST_CWD)
			await controller.initialize()
			// Format with empty files array
			const result = responses_1.formatResponse.formatFilesList(TEST_CWD, [], false, controller, true)
			// Should show "No files found"
			expect(result).toBe("No files found.")
		})
	})
	describe("getInstructions", () => {
		/**
		 * Tests the instructions format
		 */
		it("should format .kilocodeignore instructions for the LLM", async () => {
			// Create controller
			const controller = new RooIgnoreController_1.RooIgnoreController(TEST_CWD)
			await controller.initialize()
			// Get instructions
			const instructions = controller.getInstructions()
			// Verify format and content
			expect(instructions).toContain("# .kilocodeignore")
			expect(instructions).toContain(RooIgnoreController_1.LOCK_TEXT_SYMBOL)
			expect(instructions).toContain("node_modules")
			expect(instructions).toContain(".git")
			expect(instructions).toContain("secrets/**")
			expect(instructions).toContain("*.log")
			// Should explain what the lock symbol means
			expect(instructions).toContain("you'll notice a")
			expect(instructions).toContain("next to files that are blocked")
		})
		/**
		 * Tests null/undefined case
		 */
		it("should return undefined when no .kilocodeignore exists", async () => {
			// Set up no .kilocodeignore
			mockFileExists.mockResolvedValue(false)
			// Create controller without .kilocodeignore
			const controller = new RooIgnoreController_1.RooIgnoreController(TEST_CWD)
			await controller.initialize()
			// Should return undefined
			expect(controller.getInstructions()).toBeUndefined()
		})
	})
})
//# sourceMappingURL=responses-rooignore.spec.js.map
