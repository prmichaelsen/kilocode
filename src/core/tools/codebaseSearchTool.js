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
exports.codebaseSearchTool = codebaseSearchTool
const vscode = __importStar(require("vscode"))
const manager_1 = require("../../services/code-index/manager")
const path_1 = require("../../utils/path")
const responses_1 = require("../prompts/responses")
const path_2 = __importDefault(require("path"))
async function codebaseSearchTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const toolName = "codebase_search"
	const workspacePath = cline.cwd && cline.cwd.trim() !== "" ? cline.cwd : (0, path_1.getWorkspacePath)()
	if (!workspacePath) {
		// This case should ideally not happen if Cline is initialized correctly
		await handleError(toolName, new Error("Could not determine workspace path."))
		return
	}
	// --- Parameter Extraction and Validation ---
	let query = block.params.query
	let directoryPrefix = block.params.path
	query = removeClosingTag("query", query)
	if (directoryPrefix) {
		directoryPrefix = removeClosingTag("path", directoryPrefix)
		directoryPrefix = path_2.default.normalize(directoryPrefix)
	}
	const sharedMessageProps = {
		tool: "codebaseSearch",
		query: query,
		path: directoryPrefix,
		isOutsideWorkspace: false,
	}
	if (block.partial) {
		await cline.ask("tool", JSON.stringify(sharedMessageProps), block.partial).catch(() => {})
		return
	}
	if (!query) {
		cline.consecutiveMistakeCount++
		pushToolResult(await cline.sayAndCreateMissingParamError(toolName, "query"))
		return
	}
	const didApprove = await askApproval("tool", JSON.stringify(sharedMessageProps))
	if (!didApprove) {
		pushToolResult(responses_1.formatResponse.toolDenied())
		return
	}
	cline.consecutiveMistakeCount = 0
	// --- Core Logic ---
	try {
		const context = cline.providerRef.deref()?.context
		if (!context) {
			throw new Error("Extension context is not available.")
		}
		const manager = manager_1.CodeIndexManager.getInstance(context)
		if (!manager) {
			throw new Error("CodeIndexManager is not available.")
		}
		if (!manager.isFeatureEnabled) {
			throw new Error("Code Indexing is disabled in the settings.")
		}
		if (!manager.isFeatureConfigured) {
			throw new Error("Code Indexing is not configured (Missing OpenAI Key or Qdrant URL).")
		}
		// kilocode_change start
		const status = manager.getCurrentStatus()
		if (status.systemStatus !== "Indexed") {
			const defaultStatusMessage = (() => {
				switch (status.systemStatus) {
					case "Indexing":
						return "Code indexing is still running"
					case "Standby":
						return "Code indexing has not started"
					case "Error":
						return "Code indexing is in an error state"
					default:
						return "Code indexing is not ready"
				}
			})()
			const normalizedMessage =
				status.message && status.message.trim() !== "" ? status.message.trim() : defaultStatusMessage
			const unit =
				status.currentItemUnit && status.currentItemUnit.trim() !== "" ? status.currentItemUnit : "items"
			const progress = status.totalItems > 0 ? `${status.processedItems}/${status.totalItems} ${unit}` : undefined
			const messageWithoutTrailingPeriod = normalizedMessage.endsWith(".")
				? normalizedMessage.slice(0, -1)
				: normalizedMessage
			const friendlyMessage = progress
				? `${messageWithoutTrailingPeriod} (Progress: ${progress}).`
				: `${messageWithoutTrailingPeriod}.`
			const payload = {
				tool: "codebaseSearch",
				content: {
					query,
					results: [],
					status: {
						systemStatus: status.systemStatus,
						message: normalizedMessage,
						processedItems: status.processedItems,
						totalItems: status.totalItems,
						currentItemUnit: status.currentItemUnit,
					},
				},
			}
			await cline.say("codebase_search_result", JSON.stringify(payload))
			pushToolResult(
				responses_1.formatResponse.toolError(
					`${friendlyMessage} Semantic search is unavailable until indexing completes. Please try again later.`,
				),
			)
			return
		}
		// kilocode_change end
		const searchResults = await manager.searchIndex(query, directoryPrefix)
		// 3. Format and push results
		if (!searchResults || searchResults.length === 0) {
			pushToolResult(`No relevant code snippets found for the query: "${query}"`) // Use simple string for no results
			return
		}
		const jsonResult = {
			query,
			results: [],
		}
		searchResults.forEach((result) => {
			if (!result.payload) return
			if (!("filePath" in result.payload)) return
			const relativePath = vscode.workspace.asRelativePath(result.payload.filePath, false)
			jsonResult.results.push({
				filePath: relativePath,
				score: result.score,
				startLine: result.payload.startLine,
				endLine: result.payload.endLine,
				codeChunk: result.payload.codeChunk.trim(),
			})
		})
		// Send results to UI
		const payload = { tool: "codebaseSearch", content: jsonResult }
		await cline.say("codebase_search_result", JSON.stringify(payload))
		// Push results to AI
		const output = `Query: ${query}
Results:

${jsonResult.results
	.map(
		(result) => `File path: ${result.filePath}
Score: ${result.score}
Lines: ${result.startLine}-${result.endLine}
Code Chunk: ${result.codeChunk}
`,
	)
	.join("\n")}`
		pushToolResult(output)
	} catch (error) {
		await handleError(toolName, error) // Use the standard error handler
	}
}
//# sourceMappingURL=codebaseSearchTool.js.map
