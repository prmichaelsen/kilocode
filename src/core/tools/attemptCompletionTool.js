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
exports.attemptCompletionTool = attemptCompletionTool
const vscode = __importStar(require("vscode"))
const types_1 = require("@roo-code/types")
const telemetry_1 = require("@roo-code/telemetry")
const responses_1 = require("../prompts/responses")
const package_1 = require("../../shared/package")
const seeNewChanges_1 = require("../checkpoints/kilocode/seeNewChanges")
// kilocode_change start
async function getClineMessageOptions(task) {
	const commitRange = await (0, seeNewChanges_1.getCommitRangeForNewCompletion)(task)
	return (
		commitRange && {
			metadata: {
				kiloCode: { commitRange },
			},
		}
	)
}
// kilocode_change end
async function attemptCompletionTool(
	cline,
	block,
	askApproval,
	handleError,
	pushToolResult,
	removeClosingTag,
	toolDescription,
	askFinishSubTaskApproval,
) {
	const result = block.params.result
	const command = block.params.command
	// Get the setting for preventing completion with open todos from VSCode configuration
	const preventCompletionWithOpenTodos = vscode.workspace
		.getConfiguration(package_1.Package.name)
		.get("preventCompletionWithOpenTodos", false)
	// Check if there are incomplete todos (only if the setting is enabled)
	const hasIncompleteTodos = cline.todoList && cline.todoList.some((todo) => todo.status !== "completed")
	if (preventCompletionWithOpenTodos && hasIncompleteTodos) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("attempt_completion")
		pushToolResult(
			responses_1.formatResponse.toolError(
				"Cannot complete task while there are incomplete todos. Please finish all todos before attempting completion.",
			),
		)
		return
	}
	try {
		const lastMessage = cline.clineMessages.at(-1)
		if (block.partial) {
			if (command) {
				// the attempt_completion text is done, now we're getting command
				// remove the previous partial attempt_completion ask, replace with say, post state to webview, then stream command
				// const secondLastMessage = cline.clineMessages.at(-2)
				if (lastMessage && lastMessage.ask === "command") {
					// update command
					await cline.ask("command", removeClosingTag("command", command), block.partial).catch(() => {})
				} else {
					// last message is completion_result
					// we have command string, which means we have the result as well, so finish it (doesnt have to exist yet)
					await cline.say(
						"completion_result",
						removeClosingTag("result", result),
						undefined,
						false,
						undefined,
						undefined,
						await getClineMessageOptions(cline),
					)
					telemetry_1.TelemetryService.instance.captureTaskCompleted(cline.taskId)
					cline.emit(
						types_1.RooCodeEventName.TaskCompleted,
						cline.taskId,
						cline.getTokenUsage(),
						cline.toolUsage,
					)
					await cline.ask("command", removeClosingTag("command", command), block.partial).catch(() => {})
				}
			} else {
				// No command, still outputting partial result
				await cline.say("completion_result", removeClosingTag("result", result), undefined, block.partial)
			}
			return
		} else {
			if (!result) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("attempt_completion")
				pushToolResult(await cline.sayAndCreateMissingParamError("attempt_completion", "result"))
				return
			}
			cline.consecutiveMistakeCount = 0
			// Command execution is permanently disabled in attempt_completion
			// Users must use execute_command tool separately before attempt_completion
			await cline.say(
				"completion_result",
				result,
				undefined,
				false,
				undefined,
				undefined,
				await getClineMessageOptions(cline),
			)
			telemetry_1.TelemetryService.instance.captureTaskCompleted(cline.taskId)
			cline.emit(types_1.RooCodeEventName.TaskCompleted, cline.taskId, cline.getTokenUsage(), cline.toolUsage)
			if (cline.parentTask) {
				const didApprove = await askFinishSubTaskApproval()
				if (!didApprove) {
					return
				}
				// tell the provider to remove the current subtask and resume the previous task in the stack
				await cline.providerRef.deref()?.finishSubTask(result)
				return
			}
			// We already sent completion_result says, an
			// empty string asks relinquishes control over
			// button and field.
			const { response, text, images } = await cline.ask("completion_result", "", false)
			// Signals to recursive loop to stop (for now
			// cline never happens since yesButtonClicked
			// will trigger a new task).
			if (response === "yesButtonClicked") {
				pushToolResult("")
				return
			}
			await cline.say("user_feedback", text ?? "", images)
			const toolResults = []
			toolResults.push({
				type: "text",
				text: `The user has provided feedback on the results. Consider their input to continue the task, and then attempt completion again.\n<feedback>\n${text}\n</feedback>`,
			})
			toolResults.push(...responses_1.formatResponse.imageBlocks(images))
			cline.userMessageContent.push({ type: "text", text: `${toolDescription()} Result:` })
			cline.userMessageContent.push(...toolResults)
			return
		}
	} catch (error) {
		await handleError("inspecting site", error)
		return
	}
}
//# sourceMappingURL=attemptCompletionTool.js.map
