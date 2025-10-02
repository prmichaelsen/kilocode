"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.newRuleTool = newRuleTool
const path_1 = __importDefault(require("path"))
const delay_1 = __importDefault(require("delay"))
const responses_1 = require("../prompts/responses")
const fs_1 = require("../../utils/fs")
const extract_text_1 = require("../../integrations/misc/extract-text")
const path_2 = require("../../utils/path")
const pathUtils_1 = require("../../utils/pathUtils")
const text_normalization_1 = require("../../utils/text-normalization")
async function newRuleTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const relPath = block.params.path
	let newContent = block.params.content
	if (!relPath || !newContent) {
		// checking for newContent ensure relPath is complete
		// wait so we can determine if it's a new file or editing an existing file
		return
	}
	const accessAllowed = cline.rooIgnoreController?.validateAccess(relPath)
	if (!accessAllowed) {
		await cline.say("rooignore_error", relPath)
		pushToolResult(responses_1.formatResponse.toolError(responses_1.formatResponse.rooIgnoreError(relPath)))
		return
	}
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
		newContent = newContent.split("\n").slice(1).join("\n").trim()
	}
	if (newContent.endsWith("```")) {
		newContent = newContent.split("\n").slice(0, -1).join("\n").trim()
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
		isOutsideWorkspace,
	}
	try {
		if (block.partial) {
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
			return
		} else {
			if (!relPath) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("new_rule")
				pushToolResult(await cline.sayAndCreateMissingParamError("new_rule", "path"))
				await cline.diffViewProvider.reset()
				return
			}
			if (!newContent) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("new_rule")
				pushToolResult(await cline.sayAndCreateMissingParamError("new_rule", "content"))
				await cline.diffViewProvider.reset()
				return
			}
			cline.consecutiveMistakeCount = 0
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
			const didApprove = await askApproval("tool", completeMessage)
			if (!didApprove) {
				await cline.diffViewProvider.revertChanges()
				return
			}
			const { newProblemsMessage, userEdits, finalContent } = await cline.diffViewProvider.saveChanges()
			cline.didEditFile = true // used to determine if we should wait for busy terminal to update before sending api request
			if (userEdits) {
				await cline.say(
					"user_feedback_diff",
					JSON.stringify({
						tool: fileExists ? "editedExistingFile" : "newFileCreated",
						path: (0, path_2.getReadablePath)(cline.cwd, relPath),
						diff: userEdits,
					}),
				)
				pushToolResult(
					`The user made the following updates to your content:\n\n${userEdits}\n\n` +
						`The updated content, which includes both your original modifications and the user's edits, has been successfully saved to ${relPath.toPosix()}. Here is the full, updated content of the file, including line numbers:\n\n` +
						`<final_file_content path="${relPath.toPosix()}">\n${(0, extract_text_1.addLineNumbers)(finalContent || "")}\n</final_file_content>\n\n` +
						`Please note:\n` +
						`1. You do not need to re-write the file with these changes, as they have already been applied.\n` +
						`2. Proceed with the task using this updated file content as the new baseline.\n` +
						`3. If the user's edits have addressed part of the task or changed the requirements, adjust your approach accordingly.` +
						`${newProblemsMessage}`,
				)
			} else {
				pushToolResult(`The content was successfully saved to ${relPath.toPosix()}.${newProblemsMessage}`)
			}
			await cline.diffViewProvider.reset()
			return
		}
	} catch (error) {
		await handleError("writing file", error)
		await cline.diffViewProvider.reset()
		return
	}
}
//# sourceMappingURL=newRuleTool.js.map
