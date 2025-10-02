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
exports.writeToFileTool = writeToFileTool
const path_1 = __importDefault(require("path"))
const delay_1 = __importDefault(require("delay"))
const vscode = __importStar(require("vscode"))
const promises_1 = __importDefault(require("fs/promises"))
const responses_1 = require("../prompts/responses")
const fs_1 = require("../../utils/fs")
const extract_text_1 = require("../../integrations/misc/extract-text")
const path_2 = require("../../utils/path")
const pathUtils_1 = require("../../utils/pathUtils")
const detect_omission_1 = require("../../integrations/editor/detect-omission")
const text_normalization_1 = require("../../utils/text-normalization")
const types_1 = require("@roo-code/types")
const experiments_1 = require("../../shared/experiments")
async function writeToFileTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const relPath = block.params.path
	let newContent = block.params.content
	let predictedLineCount = parseInt(block.params.line_count ?? "0")
	if (block.partial && (!relPath || newContent === undefined)) {
		// checking for newContent ensure relPath is complete
		// wait so we can determine if it's a new file or editing an existing file
		return
	}
	if (!relPath) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("write_to_file")
		pushToolResult(await cline.sayAndCreateMissingParamError("write_to_file", "path"))
		await cline.diffViewProvider.reset()
		return
	}
	if (newContent === undefined) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("write_to_file")
		pushToolResult(await cline.sayAndCreateMissingParamError("write_to_file", "content"))
		await cline.diffViewProvider.reset()
		return
	}
	const accessAllowed = cline.rooIgnoreController?.validateAccess(relPath)
	if (!accessAllowed) {
		await cline.say("rooignore_error", relPath)
		pushToolResult(responses_1.formatResponse.toolError(responses_1.formatResponse.rooIgnoreError(relPath)))
		return
	}
	// Check if file is write-protected
	const isWriteProtected = cline.rooProtectedController?.isWriteProtected(relPath) || false
	// Check if file exists using cached map or fs.access
	let fileExists
	if (cline.diffViewProvider.editType !== undefined) {
		fileExists = cline.diffViewProvider.editType === "modify"
	} else {
		const absolutePath = path_1.default.resolve(cline.cwd, relPath)
		fileExists = await (0, fs_1.fileExistsAtPath)(absolutePath)
		cline.diffViewProvider.editType = fileExists ? "modify" : "create"
	}
	// pre-processing newContent for cases where weaker models might add artifacts like markdown codeblock markers (deepseek/llama) or extra escape characters (gemini)
	if (newContent.startsWith("```")) {
		// cline handles cases where it includes language specifiers like ```python ```js
		newContent = newContent.split("\n").slice(1).join("\n")
	}
	if (newContent.endsWith("```")) {
		newContent = newContent.split("\n").slice(0, -1).join("\n")
	}
	if (!cline.api.getModel().id.includes("claude")) {
		newContent = (0, text_normalization_1.unescapeHtmlEntities)(newContent)
	}
	// Determine if the path is outside the workspace
	const fullPath = relPath ? path_1.default.resolve(cline.cwd, removeClosingTag("path", relPath)) : ""
	const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(fullPath)
	const sharedMessageProps = {
		tool: fileExists ? "editedExistingFile" : "newFileCreated",
		path: (0, path_2.getReadablePath)(cline.cwd, removeClosingTag("path", relPath)),
		content: newContent,
		isOutsideWorkspace,
		isProtected: isWriteProtected,
	}
	try {
		if (block.partial) {
			// Check if preventFocusDisruption experiment is enabled
			const provider = cline.providerRef.deref()
			const state = await provider?.getState()
			const isPreventFocusDisruptionEnabled = experiments_1.experiments.isEnabled(
				state?.experiments ?? {},
				experiments_1.EXPERIMENT_IDS.PREVENT_FOCUS_DISRUPTION,
			)
			if (!isPreventFocusDisruptionEnabled) {
				// update gui message
				const partialMessage = JSON.stringify(sharedMessageProps)
				await cline.ask("tool", partialMessage, block.partial).catch(() => {})
				// update editor
				if (!cline.diffViewProvider.isEditing) {
					// open the editor and prepare to stream content in
					await cline.diffViewProvider.open(relPath)
				}
				// editor is open, stream content in
				await cline.diffViewProvider.update(
					(0, extract_text_1.everyLineHasLineNumbers)(newContent)
						? (0, extract_text_1.stripLineNumbers)(newContent)
						: newContent,
					false,
				)
			}
			return
		} else {
			if (predictedLineCount === undefined) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("write_to_file")
				// Calculate the actual number of lines in the content
				const actualLineCount = newContent.split("\n").length
				// Check if this is a new file or existing file
				const isNewFile = !fileExists
				// Check if diffStrategy is enabled
				const diffStrategyEnabled = !!cline.diffStrategy
				// Use more specific error message for line_count that provides guidance based on the situation
				await cline.say(
					"error",
					`Kilo Code tried to use write_to_file${relPath ? ` for '${relPath.toPosix()}'` : ""} but the required parameter 'line_count' was missing or truncated after ${actualLineCount} lines of content were written. Retrying...`,
				)
				pushToolResult(
					responses_1.formatResponse.toolError(
						responses_1.formatResponse.lineCountTruncationError(
							actualLineCount,
							isNewFile,
							diffStrategyEnabled,
						),
					),
				)
				await cline.diffViewProvider.revertChanges()
				return
			}
			cline.consecutiveMistakeCount = 0
			// Check if preventFocusDisruption experiment is enabled
			const provider = cline.providerRef.deref()
			const state = await provider?.getState()
			const diagnosticsEnabled = state?.diagnosticsEnabled ?? true
			const writeDelayMs = state?.writeDelayMs ?? types_1.DEFAULT_WRITE_DELAY_MS
			const isPreventFocusDisruptionEnabled = experiments_1.experiments.isEnabled(
				state?.experiments ?? {},
				experiments_1.EXPERIMENT_IDS.PREVENT_FOCUS_DISRUPTION,
			)
			if (isPreventFocusDisruptionEnabled) {
				// Direct file write without diff view
				// Check for code omissions before proceeding
				if (
					(0, detect_omission_1.detectCodeOmission)(
						cline.diffViewProvider.originalContent || "",
						newContent,
						predictedLineCount,
					)
				) {
					if (cline.diffStrategy) {
						pushToolResult(
							responses_1.formatResponse.toolError(
								`Content appears to be truncated (file has ${newContent.split("\n").length} lines but was predicted to have ${predictedLineCount} lines), and found comments indicating omitted code (e.g., '// rest of code unchanged', '/* previous code */'). Please provide the complete file content without any omissions if possible, or otherwise use the 'apply_diff' tool to apply the diff to the original file.`,
							),
						)
						return
					} else {
						vscode.window
							.showWarningMessage(
								"Potential code truncation detected. cline happens when the AI reaches its max output limit.",
								"Follow cline guide to fix the issue",
							)
							.then((selection) => {
								if (selection === "Follow cline guide to fix the issue") {
									vscode.env.openExternal(
										vscode.Uri.parse(
											"https://github.com/cline/cline/wiki/Troubleshooting-%E2%80%90-Cline-Deleting-Code-with-%22Rest-of-Code-Here%22-Comments",
										),
									)
								}
							})
					}
				}
				const completeMessage = JSON.stringify({
					...sharedMessageProps,
					content: newContent,
				})
				const didApprove = await askApproval("tool", completeMessage, undefined, isWriteProtected)
				if (!didApprove) {
					return
				}
				// Set up diffViewProvider properties needed for saveDirectly
				cline.diffViewProvider.editType = fileExists ? "modify" : "create"
				if (fileExists) {
					const absolutePath = path_1.default.resolve(cline.cwd, relPath)
					cline.diffViewProvider.originalContent = await promises_1.default.readFile(absolutePath, "utf-8")
				} else {
					cline.diffViewProvider.originalContent = ""
				}
				// Save directly without showing diff view or opening the file
				await cline.diffViewProvider.saveDirectly(relPath, newContent, false, diagnosticsEnabled, writeDelayMs)
			} else {
				// Original behavior with diff view
				// if isEditingFile false, that means we have the full contents of the file already.
				// it's important to note how cline function works, you can't make the assumption that the block.partial conditional will always be called since it may immediately get complete, non-partial data. So cline part of the logic will always be called.
				// in other words, you must always repeat the block.partial logic here
				if (!cline.diffViewProvider.isEditing) {
					// show gui message before showing edit animation
					const partialMessage = JSON.stringify(sharedMessageProps)
					await cline.ask("tool", partialMessage, true).catch(() => {}) // sending true for partial even though it's not a partial, cline shows the edit row before the content is streamed into the editor
					await cline.diffViewProvider.open(relPath)
				}
				await cline.diffViewProvider.update(
					(0, extract_text_1.everyLineHasLineNumbers)(newContent)
						? (0, extract_text_1.stripLineNumbers)(newContent)
						: newContent,
					true,
				)
				await (0, delay_1.default)(300) // wait for diff view to update
				cline.diffViewProvider.scrollToFirstDiff()
				// Check for code omissions before proceeding
				if (
					(0, detect_omission_1.detectCodeOmission)(
						cline.diffViewProvider.originalContent || "",
						newContent,
						predictedLineCount,
					)
				) {
					if (cline.diffStrategy) {
						await cline.diffViewProvider.revertChanges()
						pushToolResult(
							responses_1.formatResponse.toolError(
								`Content appears to be truncated (file has ${newContent.split("\n").length} lines but was predicted to have ${predictedLineCount} lines), and found comments indicating omitted code (e.g., '// rest of code unchanged', '/* previous code */'). Please provide the complete file content without any omissions if possible, or otherwise use the 'apply_diff' tool to apply the diff to the original file.`,
							),
						)
						return
					} else {
						vscode.window
							.showWarningMessage(
								"Potential code truncation detected. cline happens when the AI reaches its max output limit.",
								"Follow cline guide to fix the issue",
							)
							.then((selection) => {
								if (selection === "Follow cline guide to fix the issue") {
									vscode.env.openExternal(
										vscode.Uri.parse(
											"https://github.com/cline/cline/wiki/Troubleshooting-%E2%80%90-Cline-Deleting-Code-with-%22Rest-of-Code-Here%22-Comments",
										),
									)
								}
							})
					}
				}
				const completeMessage = JSON.stringify({
					...sharedMessageProps,
					content: fileExists ? undefined : newContent,
					diff: fileExists
						? responses_1.formatResponse.createPrettyPatch(
								relPath,
								cline.diffViewProvider.originalContent,
								newContent,
							)
						: undefined,
				})
				const didApprove = await askApproval("tool", completeMessage, undefined, isWriteProtected)
				if (!didApprove) {
					await cline.diffViewProvider.revertChanges()
					return
				}
				// Call saveChanges to update the DiffViewProvider properties
				await cline.diffViewProvider.saveChanges(diagnosticsEnabled, writeDelayMs)
			}
			// Track file edit operation
			if (relPath) {
				await cline.fileContextTracker.trackFileContext(relPath, "roo_edited")
			}
			cline.didEditFile = true // used to determine if we should wait for busy terminal to update before sending api request
			// Get the formatted response message
			const message = await cline.diffViewProvider.pushToolWriteResult(cline, cline.cwd, !fileExists)
			pushToolResult(message)
			await cline.diffViewProvider.reset()
			// Process any queued messages after file edit completes
			cline.processQueuedMessages()
			return
		}
	} catch (error) {
		await handleError("writing file", error)
		await cline.diffViewProvider.reset()
		return
	}
}
//# sourceMappingURL=writeToFileTool.js.map
