"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.searchFilesTool = searchFilesTool
const path_1 = __importDefault(require("path"))
const path_2 = require("../../utils/path")
const pathUtils_1 = require("../../utils/pathUtils")
const ripgrep_1 = require("../../services/ripgrep")
async function searchFilesTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const relDirPath = block.params.path
	const regex = block.params.regex
	const filePattern = block.params.file_pattern
	const absolutePath = relDirPath ? path_1.default.resolve(cline.cwd, relDirPath) : cline.cwd
	const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(absolutePath)
	const sharedMessageProps = {
		tool: "searchFiles",
		path: (0, path_2.getReadablePath)(cline.cwd, removeClosingTag("path", relDirPath)),
		regex: removeClosingTag("regex", regex),
		filePattern: removeClosingTag("file_pattern", filePattern),
		isOutsideWorkspace,
	}
	try {
		if (block.partial) {
			const partialMessage = JSON.stringify({ ...sharedMessageProps, content: "" })
			await cline.ask("tool", partialMessage, block.partial).catch(() => {})
			return
		} else {
			if (!relDirPath) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("search_files")
				pushToolResult(await cline.sayAndCreateMissingParamError("search_files", "path"))
				return
			}
			if (!regex) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("search_files")
				pushToolResult(await cline.sayAndCreateMissingParamError("search_files", "regex"))
				return
			}
			cline.consecutiveMistakeCount = 0
			const results = await (0, ripgrep_1.regexSearchFiles)(
				cline.cwd,
				absolutePath,
				regex,
				filePattern,
				cline.rooIgnoreController,
			)
			const completeMessage = JSON.stringify({ ...sharedMessageProps, content: results })
			const didApprove = await askApproval("tool", completeMessage)
			if (!didApprove) {
				return
			}
			pushToolResult(results)
			return
		}
	} catch (error) {
		await handleError("searching files", error)
		return
	}
}
//# sourceMappingURL=searchFilesTool.js.map
