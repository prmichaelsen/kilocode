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
const keybindings_1 = require("../keybindings")
const vscodeConfig = __importStar(require("../vscode-config"))
vitest_1.vi.mock("../vscode-config")
;(0, vitest_1.describe)("keybindings", () => {
	const originalPlatform = process.platform
	;(0, vitest_1.beforeEach)(() => {
		vitest_1.vi.clearAllMocks()
	})
	;(0, vitest_1.afterEach)(() => {
		Object.defineProperty(process, "platform", { value: originalPlatform })
	})
	;(0, vitest_1.describe)("getKeybindingForCommand", () => {
		;(0, vitest_1.it)("should return user keybinding when available", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: "ctrl+k" }])
			const result = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(result).toBe("Ctrl+K")
		})
		;(0, vitest_1.it)("should return formatted keybinding with multiple modifiers", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: "ctrl+shift+alt+k" }])
			const result = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			// On macOS, alt maps to Option; on other platforms, it stays Alt
			const expected = process.platform === "darwin" ? "Ctrl+Shift+Option+K" : "Ctrl+Shift+Alt+K"
			;(0, vitest_1.expect)(result).toBe(expected)
		})
		;(0, vitest_1.it)("should handle chord keybindings", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: "ctrl+k ctrl+s" }])
			const result = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(result).toBe("Ctrl+K, Ctrl+S")
		})
		;(0, vitest_1.it)("should handle platform differences for cmd key", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: "cmd+k" }])
			Object.defineProperty(process, "platform", { value: "darwin" })
			const macResult = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(macResult).toBe("Cmd+K")
			Object.defineProperty(process, "platform", { value: "win32" })
			const winResult = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(winResult).toBe("Win+K")
		})
		;(0, vitest_1.it)("should throw error when unable to read keybindings file", async () => {
			vitest_1.vi.mocked(vscodeConfig.readUserConfigFile).mockRejectedValue(new Error("File not found"))
			await (0, vitest_1.expect)((0, keybindings_1.getKeybindingForCommand)("test.command")).rejects.toThrow(
				"Unable to read keybindings file: File not found",
			)
		})
	})
	;(0, vitest_1.describe)("explicit unbinding behavior", () => {
		;(0, vitest_1.it)("should return undefined", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: "" }])
			const result = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(result).toBeUndefined()
		})
		;(0, vitest_1.it)("should distinguish between undefined key and empty string key", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: undefined }])
			const result = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(result).toBeUndefined()
		})
	})
	;(0, vitest_1.describe)("getKeybindingsForCommands", () => {
		;(0, vitest_1.it)("should return keybindings for multiple commands", async () => {
			vitest_1.vi.mocked(vscodeConfig.readUserConfigFile).mockResolvedValue([
				{ command: "test.command1", key: "ctrl+k" },
				{ command: "test.command2", key: "ctrl+shift+p" },
			])
			const result = await (0, keybindings_1.getKeybindingsForCommands)(["test.command1", "test.command2"])
			;(0, vitest_1.expect)(result).toEqual({
				"test.command1": "Ctrl+K",
				"test.command2": "Ctrl+Shift+P",
			})
		})
		;(0, vitest_1.it)("should handle empty command list", async () => {
			const result = await (0, keybindings_1.getKeybindingsForCommands)([])
			;(0, vitest_1.expect)(result).toEqual({})
		})
		;(0, vitest_1.it)("should throw error for commands without keybindings", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command1", key: "ctrl+k" }])
			await (0, vitest_1.expect)(
				(0, keybindings_1.getKeybindingsForCommands)(["test.command1", "test.command2"]),
			).rejects.toThrow("Command 'test.command2' not found in package.json keybindings")
		})
	})
	;(0, vitest_1.describe)("key normalization", () => {
		;(0, vitest_1.it)("should normalize special keys", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: "ctrl+left" }])
			const result = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(result).toBe("Ctrl+Left")
		})
		;(0, vitest_1.it)("should handle function keys", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: "f12" }])
			const result = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(result).toBe("F12")
		})
		;(0, vitest_1.it)("should capitalize regular keys", async () => {
			vitest_1.vi
				.mocked(vscodeConfig.readUserConfigFile)
				.mockResolvedValue([{ command: "test.command", key: "ctrl+a" }])
			const result = await (0, keybindings_1.getKeybindingForCommand)("test.command")
			;(0, vitest_1.expect)(result).toBe("Ctrl+A")
		})
	})
})
//# sourceMappingURL=keybindings.spec.js.map
