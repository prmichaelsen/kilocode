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
exports.executeCommandTool = executeCommandTool
exports.executeCommand = executeCommand
const promises_1 = __importDefault(require("fs/promises"))
const path = __importStar(require("path"))
const vscode = __importStar(require("vscode"))
const delay_1 = __importDefault(require("delay"))
const types_1 = require("@roo-code/types")
const telemetry_1 = require("@roo-code/telemetry")
const responses_1 = require("../prompts/responses")
const text_normalization_1 = require("../../utils/text-normalization")
const TerminalRegistry_1 = require("../../integrations/terminal/TerminalRegistry")
const Terminal_1 = require("../../integrations/terminal/Terminal")
const package_1 = require("../../shared/package")
const i18n_1 = require("../../i18n")
class ShellIntegrationError extends Error {}
async function executeCommandTool(task, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	let command = block.params.command
	const customCwd = block.params.cwd
	try {
		if (block.partial) {
			await task.ask("command", removeClosingTag("command", command), block.partial).catch(() => {})
			return
		} else {
			if (!command) {
				task.consecutiveMistakeCount++
				task.recordToolError("execute_command")
				pushToolResult(await task.sayAndCreateMissingParamError("execute_command", "command"))
				return
			}
			const ignoredFileAttemptedToAccess = task.rooIgnoreController?.validateCommand(command)
			if (ignoredFileAttemptedToAccess) {
				await task.say("rooignore_error", ignoredFileAttemptedToAccess)
				pushToolResult(
					responses_1.formatResponse.toolError(
						responses_1.formatResponse.rooIgnoreError(ignoredFileAttemptedToAccess),
					),
				)
				return
			}
			task.consecutiveMistakeCount = 0
			command = (0, text_normalization_1.unescapeHtmlEntities)(command) // Unescape HTML entities.
			const didApprove = await askApproval("command", command)
			if (!didApprove) {
				return
			}
			const executionId = task.lastMessageTs?.toString() ?? Date.now().toString()
			const provider = await task.providerRef.deref()
			const providerState = await provider?.getState()
			const {
				terminalOutputLineLimit = 500,
				terminalOutputCharacterLimit = types_1.DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT,
				terminalShellIntegrationDisabled = false,
			} = providerState ?? {}
			// Get command execution timeout from VSCode configuration (in seconds)
			const commandExecutionTimeoutSeconds = vscode.workspace
				.getConfiguration(package_1.Package.name)
				.get("commandExecutionTimeout", 0)
			// Get command timeout allowlist from VSCode configuration
			const commandTimeoutAllowlist = vscode.workspace
				.getConfiguration(package_1.Package.name)
				.get("commandTimeoutAllowlist", [])
			// Check if command matches any prefix in the allowlist
			const isCommandAllowlisted = commandTimeoutAllowlist.some((prefix) => command.startsWith(prefix.trim()))
			// Convert seconds to milliseconds for internal use, but skip timeout if command is allowlisted
			const commandExecutionTimeout = isCommandAllowlisted ? 0 : commandExecutionTimeoutSeconds * 1000
			const options = {
				executionId,
				command,
				customCwd,
				terminalShellIntegrationDisabled,
				terminalOutputLineLimit,
				terminalOutputCharacterLimit,
				commandExecutionTimeout,
			}
			try {
				const [rejected, result] = await executeCommand(task, options)
				if (rejected) {
					task.didRejectTool = true
				}
				pushToolResult(result)
			} catch (error) {
				const status = { executionId, status: "fallback" }
				provider?.postMessageToWebview({ type: "commandExecutionStatus", text: JSON.stringify(status) })
				await task.say("shell_integration_warning")
				if (error instanceof ShellIntegrationError) {
					const [rejected, result] = await executeCommand(task, {
						...options,
						terminalShellIntegrationDisabled: true,
					})
					if (rejected) {
						task.didRejectTool = true
					}
					pushToolResult(result)
				} else {
					pushToolResult(`Command failed to execute in terminal due to a shell integration error.`)
				}
			}
			return
		}
	} catch (error) {
		await handleError("executing command", error)
		return
	}
}
async function executeCommand(
	task,
	{
		executionId,
		command,
		customCwd,
		terminalShellIntegrationDisabled = true, // kilocode_change: default
		terminalOutputLineLimit = 500,
		terminalOutputCharacterLimit = types_1.DEFAULT_TERMINAL_OUTPUT_CHARACTER_LIMIT,
		commandExecutionTimeout = 0,
	},
) {
	// Convert milliseconds back to seconds for display purposes.
	const commandExecutionTimeoutSeconds = commandExecutionTimeout / 1000
	let workingDir
	if (!customCwd) {
		workingDir = task.cwd
	} else if (path.isAbsolute(customCwd)) {
		workingDir = customCwd
	} else {
		workingDir = path.resolve(task.cwd, customCwd)
	}
	try {
		await promises_1.default.access(workingDir)
	} catch (error) {
		return [false, `Working directory '${workingDir}' does not exist.`]
	}
	let message
	let runInBackground = false
	let completed = false
	let result = ""
	let exitDetails
	let shellIntegrationError
	const terminalProvider = terminalShellIntegrationDisabled ? "execa" : "vscode"
	const provider = await task.providerRef.deref()
	let accumulatedOutput = ""
	const callbacks = {
		onLine: async (lines, process) => {
			accumulatedOutput += lines
			const compressedOutput = Terminal_1.Terminal.compressTerminalOutput(
				accumulatedOutput,
				terminalOutputLineLimit,
				terminalOutputCharacterLimit,
			)
			const status = { executionId, status: "output", output: compressedOutput }
			provider?.postMessageToWebview({ type: "commandExecutionStatus", text: JSON.stringify(status) })
			if (runInBackground) {
				return
			}
			try {
				const { response, text, images } = await task.ask("command_output", "")
				runInBackground = true
				if (response === "messageResponse") {
					message = { text, images }
					process.continue()
				}
			} catch (_error) {}
		},
		onCompleted: (output) => {
			result = Terminal_1.Terminal.compressTerminalOutput(
				output ?? "",
				terminalOutputLineLimit,
				terminalOutputCharacterLimit,
			)
			task.say("command_output", result)
			completed = true
		},
		onShellExecutionStarted: (pid) => {
			console.log(`[executeCommand] onShellExecutionStarted: ${pid}`)
			const status = { executionId, status: "started", pid, command }
			provider?.postMessageToWebview({ type: "commandExecutionStatus", text: JSON.stringify(status) })
		},
		onShellExecutionComplete: (details) => {
			const status = { executionId, status: "exited", exitCode: details.exitCode }
			provider?.postMessageToWebview({ type: "commandExecutionStatus", text: JSON.stringify(status) })
			exitDetails = details
		},
	}
	if (terminalProvider === "vscode") {
		callbacks.onNoShellIntegration = async (error) => {
			telemetry_1.TelemetryService.instance.captureShellIntegrationError(task.taskId)
			shellIntegrationError = error
		}
	}
	const terminal = await TerminalRegistry_1.TerminalRegistry.getOrCreateTerminal(
		workingDir,
		task.taskId,
		terminalProvider,
	)
	if (terminal instanceof Terminal_1.Terminal) {
		terminal.terminal.show(true)
		// Update the working directory in case the terminal we asked for has
		// a different working directory so that the model will know where the
		// command actually executed.
		workingDir = terminal.getCurrentWorkingDirectory()
	}
	const process = terminal.runCommand(command, callbacks)
	task.terminalProcess = process
	// Implement command execution timeout (skip if timeout is 0).
	if (commandExecutionTimeout > 0) {
		let timeoutId
		let isTimedOut = false
		const timeoutPromise = new Promise((_, reject) => {
			timeoutId = setTimeout(() => {
				isTimedOut = true
				task.terminalProcess?.abort()
				reject(new Error(`Command execution timed out after ${commandExecutionTimeout}ms`))
			}, commandExecutionTimeout)
		})
		try {
			await Promise.race([process, timeoutPromise])
		} catch (error) {
			if (isTimedOut) {
				const status = { executionId, status: "timeout" }
				provider?.postMessageToWebview({ type: "commandExecutionStatus", text: JSON.stringify(status) })
				await task.say(
					"error",
					(0, i18n_1.t)("common:errors:command_timeout", { seconds: commandExecutionTimeoutSeconds }),
				)
				task.terminalProcess = undefined
				return [
					false,
					`The command was terminated after exceeding a user-configured ${commandExecutionTimeoutSeconds}s timeout. Do not try to re-run the command.`,
				]
			}
			throw error
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId)
			}
			task.terminalProcess = undefined
		}
	} else {
		// No timeout - just wait for the process to complete.
		try {
			await process
		} finally {
			task.terminalProcess = undefined
		}
	}
	if (shellIntegrationError) {
		throw new ShellIntegrationError(shellIntegrationError)
	}
	// Wait for a short delay to ensure all messages are sent to the webview.
	// This delay allows time for non-awaited promises to be created and
	// for their associated messages to be sent to the webview, maintaining
	// the correct order of messages (although the webview is smart about
	// grouping command_output messages despite any gaps anyways).
	await (0, delay_1.default)(50)
	if (message) {
		const { text, images } = message
		await task.say("user_feedback", text, images)
		return [
			true,
			responses_1.formatResponse.toolResult(
				[
					`Command is still running in terminal from '${terminal.getCurrentWorkingDirectory().toPosix()}'.`,
					result.length > 0 ? `Here's the output so far:\n${result}\n` : "\n",
					`The user provided the following feedback:`,
					`<feedback>\n${text}\n</feedback>`,
				].join("\n"),
				images,
			),
		]
	} else if (completed || exitDetails) {
		let exitStatus = ""
		if (exitDetails !== undefined) {
			if (exitDetails.signalName) {
				exitStatus = `Process terminated by signal ${exitDetails.signalName}`
				if (exitDetails.coreDumpPossible) {
					exitStatus += " - core dump possible"
				}
			} else if (exitDetails.exitCode === undefined) {
				result += "<VSCE exit code is undefined: terminal output and command execution status is unknown.>"
				exitStatus = `Exit code: <undefined, notify user>`
			} else {
				if (exitDetails.exitCode !== 0) {
					exitStatus += "Command execution was not successful, inspect the cause and adjust as needed.\n"
				}
				exitStatus += `Exit code: ${exitDetails.exitCode}`
			}
		} else {
			result += "<VSCE exitDetails == undefined: terminal output and command execution status is unknown.>"
			exitStatus = `Exit code: <undefined, notify user>`
		}
		let workingDirInfo = ` within working directory '${terminal.getCurrentWorkingDirectory().toPosix()}'`
		return [false, `Command executed in terminal ${workingDirInfo}. ${exitStatus}\nOutput:\n${result}`]
	} else {
		return [
			false,
			[
				`Command is still running in terminal ${workingDir ? ` from '${workingDir.toPosix()}'` : ""}.`,
				result.length > 0 ? `Here's the output so far:\n${result}\n` : "\n",
				"You will be updated on the terminal status and new output in the future.",
			].join("\n"),
		]
	}
}
//# sourceMappingURL=executeCommandTool.js.map
