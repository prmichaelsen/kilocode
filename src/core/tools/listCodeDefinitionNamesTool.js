"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.listCodeDefinitionNamesTool = listCodeDefinitionNamesTool
const path_1 = __importDefault(require("path"))
const promises_1 = __importDefault(require("fs/promises"))
const path_2 = require("../../utils/path")
const pathUtils_1 = require("../../utils/pathUtils")
const tree_sitter_1 = require("../../services/tree-sitter")
async function listCodeDefinitionNamesTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const relPath = block.params.path
	// Calculate if the path is outside workspace
	const absolutePath = relPath ? path_1.default.resolve(cline.cwd, relPath) : cline.cwd
	const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(absolutePath)
	const sharedMessageProps = {
		tool: "listCodeDefinitionNames",
		path: (0, path_2.getReadablePath)(cline.cwd, removeClosingTag("path", relPath)),
		isOutsideWorkspace,
	}
	try {
		if (block.partial) {
			const partialMessage = JSON.stringify({ ...sharedMessageProps, content: "" })
			await cline.ask("tool", partialMessage, block.partial).catch(() => {})
			return
		} else {
			if (!relPath) {
				cline.consecutiveMistakeCount++
				cline.recordToolError("list_code_definition_names")
				pushToolResult(await cline.sayAndCreateMissingParamError("list_code_definition_names", "path"))
				return
			}
			cline.consecutiveMistakeCount = 0
			let result
			try {
				const stats = await promises_1.default.stat(absolutePath)
				if (stats.isFile()) {
					const fileResult = await (0, tree_sitter_1.parseSourceCodeDefinitionsForFile)(
						absolutePath,
						cline.rooIgnoreController,
					)
					result = fileResult ?? "No source code definitions found in cline file."
				} else if (stats.isDirectory()) {
					result = await (0, tree_sitter_1.parseSourceCodeForDefinitionsTopLevel)(
						absolutePath,
						cline.rooIgnoreController,
					)
				} else {
					result = "The specified path is neither a file nor a directory."
				}
			} catch {
				result = `${absolutePath}: does not exist or cannot be accessed.`
			}
			const completeMessage = JSON.stringify({ ...sharedMessageProps, content: result })
			const didApprove = await askApproval("tool", completeMessage)
			if (!didApprove) {
				return
			}
			if (relPath) {
				await cline.fileContextTracker.trackFileContext(relPath, "read_tool")
			}
			pushToolResult(result)
			return
		}
	} catch (error) {
		await handleError("parsing source code definitions", error)
		return
	}
}
//# sourceMappingURL=listCodeDefinitionNamesTool.js.map
