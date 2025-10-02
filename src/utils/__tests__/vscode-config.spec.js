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
const vitest_1 = require("vitest")
const vscode = __importStar(require("vscode"))
const vscode_config_1 = require("../vscode-config")
const fs_1 = require("fs")
const os = __importStar(require("os"))
vitest_1.vi.mock("vscode", () => ({
	env: {
		appName: "Visual Studio Code",
		remoteName: undefined,
		uiKind: 1,
	},
	UIKind: {
		Desktop: 1,
		Web: 2,
	},
	workspace: {
		fs: {
			readFile: vitest_1.vi.fn(),
		},
	},
	Uri: {
		file: vitest_1.vi.fn((path) => ({ fsPath: path })),
	},
}))
vitest_1.vi.mock("fs", () => ({
	promises: {
		readdir: vitest_1.vi.fn(),
		stat: vitest_1.vi.fn(),
	},
}))
vitest_1.vi.mock("os", () => ({
	homedir: vitest_1.vi.fn(),
}))
const originalPlatform = process.platform
const originalEnv = process.env
;(0, vitest_1.describe)("vscode-config utilities", () => {
	;(0, vitest_1.beforeEach)(() => {
		vitest_1.vi.clearAllMocks()
		Object.defineProperty(process, "platform", {
			value: "darwin",
			configurable: true,
		})
		process.env = { ...originalEnv, HOME: "/mock/home" }
		vitest_1.vi.mocked(vscode.env).appName = "Visual Studio Code"
		vitest_1.vi.mocked(vscode.env).remoteName = undefined
		vitest_1.vi.mocked(vscode.env).uiKind = vscode.UIKind.Desktop
		vitest_1.vi.mocked(os.homedir).mockReturnValue("/mock/home")
	})
	;(0, vitest_1.afterEach)(() => {
		Object.defineProperty(process, "platform", {
			value: originalPlatform,
			configurable: true,
		})
		process.env = originalEnv
	})
	;(0, vitest_1.describe)("canReadLocalFiles", () => {
		;(0, vitest_1.it)("should return true for desktop environment", () => {
			vitest_1.vi.mocked(vscode.env).remoteName = undefined
			vitest_1.vi.mocked(vscode.env).uiKind = vscode.UIKind.Desktop
			const result = (0, vscode_config_1.canReadLocalFiles)()
			;(0, vitest_1.expect)(result).toBe(true)
		})
		;(0, vitest_1.it)("should return false for remote environment", () => {
			vitest_1.vi.mocked(vscode.env).remoteName = "ssh-remote"
			vitest_1.vi.mocked(vscode.env).uiKind = vscode.UIKind.Desktop
			const result = (0, vscode_config_1.canReadLocalFiles)()
			;(0, vitest_1.expect)(result).toBe(false)
		})
		;(0, vitest_1.it)("should return false for web environment", () => {
			vitest_1.vi.mocked(vscode.env).remoteName = undefined
			vitest_1.vi.mocked(vscode.env).uiKind = vscode.UIKind.Web
			const result = (0, vscode_config_1.canReadLocalFiles)()
			;(0, vitest_1.expect)(result).toBe(false)
		})
	})
	;(0, vitest_1.describe)("readUserConfigFile", () => {
		;(0, vitest_1.it)("should return empty array for remote environment", async () => {
			vitest_1.vi.mocked(vscode.env).remoteName = "ssh-remote"
			const result = await (0, vscode_config_1.readUserConfigFile)("keybindings.json")
			;(0, vitest_1.expect)(result).toEqual([])
		})
		;(0, vitest_1.it)("should handle different editor installations", async () => {
			const testCases = [
				{ appName: "Visual Studio Code", expectedCommand: "test.command" },
				{ appName: "VSCodium", expectedCommand: "vscode.command" },
				{ appName: "Cursor", expectedCommand: "cursor.command" },
				{ appName: "Windsurf", expectedCommand: "windsurf.command" },
			]
			for (const { appName, expectedCommand } of testCases) {
				vitest_1.vi.clearAllMocks()
				vitest_1.vi.mocked(vscode.env).appName = appName
				vitest_1.vi.mocked(fs_1.promises.readdir).mockRejectedValue(new Error("No profiles"))
				vitest_1.vi.mocked(fs_1.promises.stat).mockResolvedValue({ isFile: () => true, mtimeMs: Date.now() })
				vitest_1.vi
					.mocked(vscode.workspace.fs.readFile)
					.mockResolvedValue(
						Buffer.from(JSON.stringify([{ key: "cmd+i", command: expectedCommand }]), "utf8"),
					)
				const result = await (0, vscode_config_1.readUserConfigFile)("keybindings.json")
				;(0, vitest_1.expect)(result).toEqual([{ key: "cmd+i", command: expectedCommand }])
			}
		})
		;(0, vitest_1.it)("should handle portable installation", async () => {
			process.env.VSCODE_PORTABLE = "/portable/vscode"
			vitest_1.vi.mocked(fs_1.promises.readdir).mockRejectedValue(new Error("No profiles"))
			vitest_1.vi.mocked(fs_1.promises.stat).mockResolvedValue({ isFile: () => true, mtimeMs: Date.now() })
			vitest_1.vi
				.mocked(vscode.workspace.fs.readFile)
				.mockResolvedValue(Buffer.from(JSON.stringify([{ key: "f1", command: "portable.command" }]), "utf8"))
			const result = await (0, vscode_config_1.readUserConfigFile)("keybindings.json")
			;(0, vitest_1.expect)(result).toEqual([{ key: "f1", command: "portable.command" }])
		})
		;(0, vitest_1.it)("should handle code-server environment", async () => {
			process.env.CODE_SERVER = "true"
			vitest_1.vi.mocked(fs_1.promises.readdir).mockRejectedValue(new Error("No profiles"))
			vitest_1.vi.mocked(fs_1.promises.stat).mockResolvedValue({ isFile: () => true, mtimeMs: Date.now() })
			vitest_1.vi
				.mocked(vscode.workspace.fs.readFile)
				.mockResolvedValue(Buffer.from(JSON.stringify([{ key: "ctrl+`", command: "terminal.new" }]), "utf8"))
			const result = await (0, vscode_config_1.readUserConfigFile)("keybindings.json")
			;(0, vitest_1.expect)(result).toEqual([{ key: "ctrl+`", command: "terminal.new" }])
		})
		;(0, vitest_1.it)("should handle profiles and prefer most recent", async () => {
			const mockProfiles = [
				{ name: "profile1", isDirectory: () => true },
				{ name: "profile2", isDirectory: () => true },
			]
			vitest_1.vi.mocked(fs_1.promises.readdir).mockResolvedValue(mockProfiles)
			vitest_1.vi
				.mocked(fs_1.promises.stat)
				.mockResolvedValueOnce({ isFile: () => true, mtimeMs: 1000 })
				.mockResolvedValueOnce({ isFile: () => true, mtimeMs: 2000 })
				.mockResolvedValueOnce({ isFile: () => true, mtimeMs: 3000 })
			vitest_1.vi
				.mocked(vscode.workspace.fs.readFile)
				.mockResolvedValueOnce(
					Buffer.from(JSON.stringify([{ key: "cmd+p", command: "profile2.command" }]), "utf8"),
				)
			const result = await (0, vscode_config_1.readUserConfigFile)("keybindings.json")
			;(0, vitest_1.expect)(result).toEqual([{ key: "cmd+p", command: "profile2.command" }])
		})
		;(0, vitest_1.it)("should return empty array when no keybindings files exist", async () => {
			vitest_1.vi.mocked(fs_1.promises.readdir).mockRejectedValue(new Error("No profiles"))
			vitest_1.vi.mocked(fs_1.promises.stat).mockRejectedValue(new Error("File not found"))
			const result = await (0, vscode_config_1.readUserConfigFile)("keybindings.json")
			;(0, vitest_1.expect)(result).toEqual([])
		})
	})
	;(0, vitest_1.describe)("readJSON5File", () => {
		;(0, vitest_1.it)("should parse valid JSON5 with comments", async () => {
			const json5Content = `[
				// This is a comment
				{
					"key": "cmd+i",
					"command": "test.command"
				},
				/* Multi-line comment */
				{
					"key": "f1",
					"command": "another.command",
				}
			]`
			vitest_1.vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(Buffer.from(json5Content, "utf8"))
			const result = await (0, vscode_config_1.readJSON5File)("/test/path")
			;(0, vitest_1.expect)(result).toEqual([
				{ key: "cmd+i", command: "test.command" },
				{ key: "f1", command: "another.command" },
			])
		})
		;(0, vitest_1.it)("should return null for invalid JSON", async () => {
			vitest_1.vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(Buffer.from("invalid json", "utf8"))
			const result = await (0, vscode_config_1.readJSON5File)("/test/path")
			;(0, vitest_1.expect)(result).toBeNull()
		})
		;(0, vitest_1.it)("should return null when file cannot be read", async () => {
			vitest_1.vi.mocked(vscode.workspace.fs.readFile).mockRejectedValue(new Error("File not found"))
			const result = await (0, vscode_config_1.readJSON5File)("/test/path")
			;(0, vitest_1.expect)(result).toBeNull()
		})
	})
})
//# sourceMappingURL=vscode-config.spec.js.map
