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
exports.listFilesTool = listFilesTool
const path = __importStar(require("path"))
const responses_1 = require("../prompts/responses")
const list_files_1 = require("../../services/glob/list-files")
const path_1 = require("../../utils/path")
const pathUtils_1 = require("../../utils/pathUtils")
/**
 * Implements the list_files tool.
 *
 * @param cline - The instance of Cline that is executing this tool.
 * @param block - The block of assistant message content that specifies the
 *   parameters for this tool.
 * @param askApproval - A function that asks the user for approval to show a
 *   message.
 * @param handleError - A function that handles an error that occurred while
 *   executing this tool.
 * @param pushToolResult - A function that pushes the result of this tool to the
 *   conversation.
 * @param removeClosingTag - A function that removes a closing tag from a string.
 */
async function listFilesTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const relDirPath = block.params.path
	const recursiveRaw = block.params.recursive
	const recursive = recursiveRaw?.toLowerCase() === "true"
	// Calculate if the path is outside workspace
	const absolutePath = relDirPath ? path.resolve(cline.cwd, relDirPath) : cline.cwd
	const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(absolutePath)
	const sharedMessageProps = {
		tool: !recursive ? "listFilesTopLevel" : "listFilesRecursive",
		path: (0, path_1.getReadablePath)(cline.cwd, removeClosingTag("path", relDirPath)),
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
				cline.recordToolError("list_files")
				pushToolResult(await cline.sayAndCreateMissingParamError("list_files", "path"))
				return
			}
			cline.consecutiveMistakeCount = 0
			const [files, didHitLimit] = await (0, list_files_1.listFiles)(absolutePath, recursive, 200)
			const { showRooIgnoredFiles = false } = (await cline.providerRef.deref()?.getState()) ?? {}
			const result = responses_1.formatResponse.formatFilesList(
				absolutePath,
				files,
				didHitLimit,
				cline.rooIgnoreController,
				showRooIgnoredFiles,
				cline.rooProtectedController,
			)
			const completeMessage = JSON.stringify({ ...sharedMessageProps, content: result })
			const didApprove = await askApproval("tool", completeMessage)
			if (!didApprove) {
				return
			}
			pushToolResult(result)
		}
	} catch (error) {
		await handleError("listing files", error)
	}
}
//# sourceMappingURL=listFilesTool.js.map
