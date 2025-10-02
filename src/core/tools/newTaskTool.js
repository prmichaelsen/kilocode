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
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.newTaskTool = newTaskTool
const delay_1 = __importDefault(require("delay"))
const vscode = __importStar(require("vscode"))
const modes_1 = require("../../shared/modes")
const responses_1 = require("../prompts/responses")
const i18n_1 = require("../../i18n")
const updateTodoListTool_1 = require("./updateTodoListTool")
const package_1 = require("../../shared/package")
async function newTaskTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const mode = block.params.mode
	const message = block.params.message
	const todos = block.params.todos
	try {
		if (block.partial) {
			const partialMessage = JSON.stringify({
				tool: "newTask",
				mode: removeClosingTag("mode", mode),
				content: removeClosingTag("message", message),
				todos: removeClosingTag("todos", todos),
			})
			await task.ask("tool", partialMessage, block.partial).catch(() => {})
			return
		} else {
			// Validate required parameters.
			if (!mode) {
				task.consecutiveMistakeCount++
				task.recordToolError("new_task")
				pushToolResult(await task.sayAndCreateMissingParamError("new_task", "mode"))
				return
			}
			if (!message) {
				task.consecutiveMistakeCount++
				task.recordToolError("new_task")
				pushToolResult(await task.sayAndCreateMissingParamError("new_task", "message"))
				return
			}
			// Get the VSCode setting for requiring todos.
			const provider = task.providerRef.deref()
			if (!provider) {
				pushToolResult(responses_1.formatResponse.toolError("Provider reference lost"))
				return
			}
			const state = await provider.getState()
			// Use Package.name (dynamic at build time) as the VSCode configuration namespace.
			// Supports multiple extension variants (e.g., stable/nightly) without hardcoded strings.
			const requireTodos = vscode.workspace
				.getConfiguration(package_1.Package.name)
				.get("newTaskRequireTodos", false)
			// Check if todos are required based on VSCode setting.
			// Note: `undefined` means not provided, empty string is valid.
			if (requireTodos && todos === undefined) {
				task.consecutiveMistakeCount++
				task.recordToolError("new_task")
				pushToolResult(await task.sayAndCreateMissingParamError("new_task", "todos"))
				return
			}
			// Parse todos if provided, otherwise use empty array
			let todoItems = []
			if (todos) {
				try {
					todoItems = (0, updateTodoListTool_1.parseMarkdownChecklist)(todos)
				} catch (error) {
					task.consecutiveMistakeCount++
					task.recordToolError("new_task")
					pushToolResult(
						responses_1.formatResponse.toolError("Invalid todos format: must be a markdown checklist"),
					)
					return
				}
			}
			task.consecutiveMistakeCount = 0
			// Un-escape one level of backslashes before '@' for hierarchical subtasks
			// Un-escape one level: \\@ -> \@ (removes one backslash for hierarchical subtasks)
			const unescapedMessage = message.replace(/\\\\@/g, "\\@")
			// Verify the mode exists
			const targetMode = (0, modes_1.getModeBySlug)(mode, state?.customModes)
			if (!targetMode) {
				pushToolResult(responses_1.formatResponse.toolError(`Invalid mode: ${mode}`))
				return
			}
			const toolMessage = JSON.stringify({
				tool: "newTask",
				mode: targetMode.name,
				content: message,
				todos: todoItems,
			})
			const didApprove = await askApproval("tool", toolMessage)
			if (!didApprove) {
				return
			}
			// Provider is guaranteed to be defined here due to earlier check.
			if (task.enableCheckpoints) {
				task.checkpointSave(true)
			}
			// Preserve the current mode so we can resume with it later.
			task.pausedModeSlug = (await provider.getState()).mode ?? modes_1.defaultModeSlug
			// kilocode_change start: Switch to the desired mode BEFORE creating the task
			await provider.handleModeSwitch(mode)
			// Small delay to ensure mode switch has propagated
			await (0, delay_1.default)(100)
			// kilocode_change end
			const newTask = await task.startSubtask(unescapedMessage, todoItems, mode)
			if (!newTask) {
				await provider.handleModeSwitch(task.pausedModeSlug) // kilocode_change: if task creation failed, switch back to the parent's mode
				pushToolResult((0, i18n_1.t)("tools:newTask.errors.policy_restriction"))
				return
			}
			pushToolResult(
				`Successfully created new task in ${targetMode.name} mode with message: ${unescapedMessage} and ${todoItems.length} todo items`,
			)
			return
		}
	} catch (error) {
		await handleError("creating new task", error)
		return
	}
}
//# sourceMappingURL=newTaskTool.js.map
