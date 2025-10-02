"use strict"
// kilocode_change: Fast Apply -- file added
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.editFileTool = editFileTool
exports.isFastApplyAvailable = isFastApplyAvailable
exports.getFastApplyModelType = getFastApplyModelType
const path_1 = __importDefault(require("path"))
const fs_1 = require("fs")
const openai_1 = __importDefault(require("openai"))
const responses_1 = require("../prompts/responses")
const fs_2 = require("../../utils/fs")
const path_2 = require("../../utils/path")
const token_1 = require("../../shared/kilocode/token")
const constants_1 = require("../../api/providers/constants")
const telemetry_1 = require("@roo-code/telemetry")
const headers_1 = require("../../shared/kilocode/headers")
const FAST_APPLY_MODEL_PRICING = {
	"morph-v3-fast": {
		inputPrice: 0.8, // $0.8 per 1M tokens
		outputPrice: 1.2, // $1.2 per 1M tokens
	},
	"morph-v3-large": {
		inputPrice: 0.9, // $0.9 per 1M tokens
		outputPrice: 1.9, // $1.9 per 1M tokens
	},
	"relace-apply-3": {
		inputPrice: 0.85, // $0.85 per 1M tokens
		outputPrice: 1.25, // $1.25 per 1M tokens
	},
	auto: {
		inputPrice: 0.9, // Default to morph-v3-large pricing
		outputPrice: 1.9,
	},
}
function calculateFastApplyCost(inputTokens, outputTokens, model) {
	const normalizedModel = model.replace(/^(morph|relace)\//, "") // Remove provider prefix if present
	const pricing = FAST_APPLY_MODEL_PRICING[normalizedModel] || FAST_APPLY_MODEL_PRICING["auto"]
	const inputCost = (pricing.inputPrice / 1000000) * inputTokens
	const outputCost = (pricing.outputPrice / 1000000) * outputTokens
	return inputCost + outputCost
}
async function validateParams(cline, targetFile, instructions, codeEdit, pushToolResult) {
	if (!targetFile) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("edit_file")
		pushToolResult(await cline.sayAndCreateMissingParamError("edit_file", "target_file"))
		return false
	}
	if (!instructions) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("edit_file")
		pushToolResult(await cline.sayAndCreateMissingParamError("edit_file", "instructions"))
		return false
	}
	if (codeEdit === undefined) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("edit_file")
		pushToolResult(await cline.sayAndCreateMissingParamError("edit_file", "code_edit"))
		return false
	}
	return true
}
async function editFileTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const target_file = block.params.target_file
	const instructions = block.params.instructions
	const code_edit = block.params.code_edit
	let fileExists = true
	try {
		if (block.partial && (!target_file || instructions === undefined)) {
			// wait so we can determine if it's a new file or editing an existing file
			return
		}
		fileExists = await (0, fs_2.fileExistsAtPath)(path_1.default.resolve(cline.cwd, target_file ?? ""))
		// Handle partial tool use
		if (block.partial) {
			const partialMessageProps = {
				tool: fileExists ? "editedExistingFile" : "newFileCreated",
				path: (0, path_2.getReadablePath)(cline.cwd, removeClosingTag("target_file", target_file)),
				content: removeClosingTag("code_edit", code_edit),
			}
			await cline.ask("tool", JSON.stringify(partialMessageProps), block.partial).catch(() => {
				// Roo tools ignore exceptions as well here
			})
			return
		}
		// Validate required parameters
		if (!(await validateParams(cline, target_file, instructions, code_edit, pushToolResult))) {
			return
		}
		// At this point we know all parameters are defined, so we can safely cast them
		const targetFile = target_file
		const editInstructions = instructions
		const editCode = code_edit
		// Validate and resolve the file path
		const absolutePath = path_1.default.resolve(cline.cwd, targetFile)
		const relPath = (0, path_2.getReadablePath)(cline.cwd, absolutePath)
		// Check if file access is allowed
		const accessAllowed = cline.rooIgnoreController?.validateAccess(relPath)
		if (!accessAllowed) {
			await cline.say("rooignore_error", relPath)
			pushToolResult(responses_1.formatResponse.rooIgnoreError(relPath))
			return
		}
		// Read the original file content
		const originalContent = fileExists ? await fs_1.promises.readFile(absolutePath, "utf-8") : ""
		// Check if Fast Apply is available
		const morphApplyResult = fileExists
			? await applyFastApplyEdit(originalContent, editInstructions, editCode, cline, relPath)
			: undefined
		if (morphApplyResult && !morphApplyResult.success) {
			cline.consecutiveMistakeCount++
			cline.recordToolError("edit_file")
			pushToolResult(
				responses_1.formatResponse.toolError(`Failed to apply edit using Morph: ${morphApplyResult.error}`),
			)
			return
		}
		const newContent = morphApplyResult?.result ?? code_edit ?? ""
		// Show the diff and ask for approval
		cline.diffViewProvider.editType = fileExists ? "modify" : "create"
		await cline.diffViewProvider.open(relPath)
		// Stream the content to show the diff
		await cline.diffViewProvider.update(newContent, true)
		cline.diffViewProvider.scrollToFirstDiff()
		// Ask for user approval
		const approved = await askApproval(
			"tool",
			JSON.stringify({
				tool: fileExists ? "editedExistingFile" : "newFileCreated",
				path: relPath,
				isProtected: cline.rooProtectedController?.isWriteProtected(relPath) || false,
				content: editCode,
				fastApplyResult: morphApplyResult
					? {
							description: morphApplyResult.description,
							tokensIn: morphApplyResult.tokensIn,
							tokensOut: morphApplyResult.tokensOut,
							cost: morphApplyResult.cost,
						}
					: undefined,
			}),
			undefined,
			cline.rooProtectedController?.isWriteProtected(relPath) || false,
		)
		if (!approved) {
			await cline.diffViewProvider.revertChanges()
			return
		}
		// Apply the changes
		await cline.diffViewProvider.saveChanges()
		// Track file context
		await cline.fileContextTracker.trackFileContext(relPath, "roo_edited")
		cline.didEditFile = true
		cline.consecutiveMistakeCount = 0
		// Get the formatted response message
		const message = await cline.diffViewProvider.pushToolWriteResult(cline, cline.cwd, false)
		pushToolResult(message)
		await cline.diffViewProvider.reset()
		// Process any queued messages after file edit completes
		cline.processQueuedMessages()
	} catch (error) {
		telemetry_1.TelemetryService.instance.captureException(error, { context: "editFileTool" })
		await handleError("editing file with Fast Apply", error)
		await cline.diffViewProvider.reset()
	}
}
async function applyFastApplyEdit(originalContent, instructions, codeEdit, cline, filePath) {
	try {
		// Get the current API configuration
		const provider = cline.providerRef.deref()
		if (!provider) {
			return { success: false, error: "No API provider available for Fast Apply" }
		}
		const state = await provider.getState()
		// Check if user has Fast Apply enabled via OpenRouter or direct API
		const morphConfig = await getFastApplyConfiguration(state)
		if (!morphConfig.available) {
			return { success: false, error: morphConfig.error || "Fast Apply is not available" }
		}
		// Create a verbose request description similar to regular API requests
		const fileName = filePath ? path_1.default.basename(filePath) : "unknown file"
		const truncatedCodeEdit = codeEdit.length > 500 ? codeEdit.substring(0, 500) + "\n...(truncated)" : codeEdit
		const description = [
			`Fast Apply Edit (${morphConfig.model})`,
			``,
			`File: ${fileName}`,
			`Instructions: ${instructions}`,
			``,
			`Code Edit:`,
			"```",
			truncatedCodeEdit,
			"```",
			``,
			`Original Content: ${originalContent.length} characters`,
		].join("\n")
		const kiloTesterSuppressUntil = state.apiConfiguration.kilocodeTesterWarningsDisabledUntil
		const kiloTesterSuppress =
			kiloTesterSuppressUntil && kiloTesterSuppressUntil > Date.now()
				? { [headers_1.X_KILOCODE_TESTER]: "SUPPRESS" }
				: {}
		// Create OpenAI client for Morph API
		const client = new openai_1.default({
			apiKey: morphConfig.apiKey,
			baseURL: morphConfig.baseUrl,
			defaultHeaders: {
				...constants_1.DEFAULT_HEADERS,
				...(morphConfig.kiloCodeOrganizationId
					? { [headers_1.X_KILOCODE_ORGANIZATIONID]: morphConfig.kiloCodeOrganizationId }
					: {}),
				...kiloTesterSuppress,
				[headers_1.X_KILOCODE_TASKID]: cline.taskId,
			},
		})
		// Apply the edit using Morph's format
		const prompt = `<instructions>${instructions}</instructions>\n<code>${originalContent}</code>\n<update>${codeEdit}</update>`
		const response = await client.chat.completions.create(
			{
				model: morphConfig.model,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
			},
			{
				timeout: 30000, // 30 second timeout
			},
		)
		const mergedCode = response.choices[0]?.message?.content
		if (!mergedCode) {
			return { success: false, error: "Morph API returned empty response" }
		}
		// Extract usage information from response
		const usage = response.usage
		const tokensIn = usage?.prompt_tokens || 0
		const tokensOut = usage?.completion_tokens || 0
		const cost = calculateFastApplyCost(tokensIn, tokensOut, morphConfig.model)
		return {
			success: true,
			result: mergedCode,
			description,
			tokensIn,
			tokensOut,
			cost,
		}
	} catch (error) {
		telemetry_1.TelemetryService.instance.captureException(error, { context: "applyFastApplyEdit" })
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		}
	}
}
function getFastApplyConfiguration(state) {
	// Check if Fast Apply is enabled in API configuration
	if (state.experiments.morphFastApply !== true) {
		return {
			available: false,
			error: "Fast Apply is disabled. Enable it in API Options > Enable Editing with Fast Apply",
		}
	}
	// Read the selected model from state
	const selectedModel = state.fastApplyModel || "auto"
	// Priority 1: Use direct Morph API key if available
	// Allow human-relay for debugging
	if (state.morphApiKey || state.apiConfiguration?.apiProvider === "human-relay") {
		const [org, model] = selectedModel.split("/")
		return {
			available: true,
			apiKey: state.morphApiKey,
			baseUrl: "https://api.morphllm.com/v1",
			model: org === "morph" ? model : "auto", // Use selected model instead of hardcoded "auto"
		}
	}
	// Priority 2: Use KiloCode provider
	if (state.apiConfiguration?.apiProvider === "kilocode") {
		const token = state.apiConfiguration.kilocodeToken
		if (!token) {
			return { available: false, error: "No KiloCode token available to use Fast Apply" }
		}
		return {
			available: true,
			apiKey: token,
			baseUrl: `${(0, token_1.getKiloBaseUriFromToken)(token)}/api/openrouter/`,
			model: selectedModel === "auto" ? "morph/morph-v3-large" : selectedModel, // Use selected model
			kiloCodeOrganizationId: state.apiConfiguration.kilocodeOrganizationId,
		}
	}
	// Priority 3: Use OpenRouter provider
	if (state.apiConfiguration?.apiProvider === "openrouter") {
		const token = state.apiConfiguration.openRouterApiKey
		if (!token) {
			return { available: false, error: "No OpenRouter API token available to use Fast Apply" }
		}
		return {
			available: true,
			apiKey: token,
			baseUrl: state.apiConfiguration.openRouterBaseUrl || "https://openrouter.ai/api/v1",
			model: selectedModel === "auto" ? "morph/morph-v3-large" : selectedModel, // Use selected model
		}
	}
	return {
		available: false,
		error: "Fast Apply configuration error. Please check your settings.",
	}
}
function isFastApplyAvailable(state) {
	return (state && getFastApplyConfiguration(state).available) || false
}
function getFastApplyModelType(state) {
	return state && getFastApplyConfiguration(state).model?.startsWith("relace/") ? "Relace" : "Morph"
}
//# sourceMappingURL=editFileTool.js.map
