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
exports.generateImageTool = generateImageTool
const path_1 = __importDefault(require("path"))
const promises_1 = __importDefault(require("fs/promises"))
const vscode = __importStar(require("vscode"))
const responses_1 = require("../prompts/responses")
const fs_1 = require("../../utils/fs")
const path_2 = require("../../utils/path")
const pathUtils_1 = require("../../utils/pathUtils")
const experiments_1 = require("../../shared/experiments")
const openrouter_1 = require("../../api/providers/openrouter")
const kilocode_openrouter_1 = require("../../api/providers/kilocode-openrouter")
// Hardcoded list of image generation models for now
const IMAGE_GENERATION_MODELS = ["google/gemini-2.5-flash-image-preview", "google/gemini-2.5-flash-image-preview:free"]
async function generateImageTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const prompt = block.params.prompt
	const relPath = block.params.path
	const inputImagePath = block.params.image
	// Check if the experiment is enabled
	const provider = cline.providerRef.deref()
	const state = await provider?.getState()
	const isImageGenerationEnabled = experiments_1.experiments.isEnabled(
		state?.experiments ?? {},
		experiments_1.EXPERIMENT_IDS.IMAGE_GENERATION,
	)
	if (!isImageGenerationEnabled) {
		pushToolResult(
			responses_1.formatResponse.toolError(
				"Image generation is an experimental feature that must be enabled in settings. Please enable 'Image Generation' in the Experimental Settings section.",
			),
		)
		return
	}
	if (block.partial) {
		return
	}
	if (!prompt) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("generate_image")
		pushToolResult(await cline.sayAndCreateMissingParamError("generate_image", "prompt"))
		return
	}
	if (!relPath) {
		cline.consecutiveMistakeCount++
		cline.recordToolError("generate_image")
		pushToolResult(await cline.sayAndCreateMissingParamError("generate_image", "path"))
		return
	}
	// Validate access permissions
	const accessAllowed = cline.rooIgnoreController?.validateAccess(relPath)
	if (!accessAllowed) {
		await cline.say("rooignore_error", relPath)
		pushToolResult(responses_1.formatResponse.toolError(responses_1.formatResponse.rooIgnoreError(relPath)))
		return
	}
	// If input image is provided, validate it exists and can be read
	let inputImageData
	if (inputImagePath) {
		const inputImageFullPath = path_1.default.resolve(cline.cwd, inputImagePath)
		// Check if input image exists
		const inputImageExists = await (0, fs_1.fileExistsAtPath)(inputImageFullPath)
		if (!inputImageExists) {
			await cline.say("error", `Input image not found: ${(0, path_2.getReadablePath)(cline.cwd, inputImagePath)}`)
			pushToolResult(
				responses_1.formatResponse.toolError(
					`Input image not found: ${(0, path_2.getReadablePath)(cline.cwd, inputImagePath)}`,
				),
			)
			return
		}
		// Validate input image access permissions
		const inputImageAccessAllowed = cline.rooIgnoreController?.validateAccess(inputImagePath)
		if (!inputImageAccessAllowed) {
			await cline.say("rooignore_error", inputImagePath)
			pushToolResult(
				responses_1.formatResponse.toolError(responses_1.formatResponse.rooIgnoreError(inputImagePath)),
			)
			return
		}
		// Read the input image file
		try {
			const imageBuffer = await promises_1.default.readFile(inputImageFullPath)
			const imageExtension = path_1.default.extname(inputImageFullPath).toLowerCase().replace(".", "")
			// Validate image format
			const supportedFormats = ["png", "jpg", "jpeg", "gif", "webp"]
			if (!supportedFormats.includes(imageExtension)) {
				await cline.say(
					"error",
					`Unsupported image format: ${imageExtension}. Supported formats: ${supportedFormats.join(", ")}`,
				)
				pushToolResult(
					responses_1.formatResponse.toolError(
						`Unsupported image format: ${imageExtension}. Supported formats: ${supportedFormats.join(", ")}`,
					),
				)
				return
			}
			// Convert to base64 data URL
			const mimeType = imageExtension === "jpg" ? "jpeg" : imageExtension
			inputImageData = `data:image/${mimeType};base64,${imageBuffer.toString("base64")}`
		} catch (error) {
			await cline.say(
				"error",
				`Failed to read input image: ${error instanceof Error ? error.message : "Unknown error"}`,
			)
			pushToolResult(
				responses_1.formatResponse.toolError(
					`Failed to read input image: ${error instanceof Error ? error.message : "Unknown error"}`,
				),
			)
			return
		}
	}
	// Check if file is write-protected
	const isWriteProtected = cline.rooProtectedController?.isWriteProtected(relPath) || false
	// Get OpenRouter API key from global settings (experimental image generation)
	const openRouterApiKey = state?.openRouterImageApiKey
	const kiloCodeApiKey = state?.kiloCodeImageApiKey
	if (!openRouterApiKey && !kiloCodeApiKey) {
		await cline.say(
			"error",
			"OpenRouter API key is required for image generation. Please configure it in the Image Generation experimental settings.",
		)
		pushToolResult(
			responses_1.formatResponse.toolError(
				"OpenRouter API key is required for image generation. Please configure it in the Image Generation experimental settings.",
			),
		)
		return
	}
	// Get selected model from settings or use default
	const selectedModel = state?.openRouterImageGenerationSelectedModel || IMAGE_GENERATION_MODELS[0]
	// Determine if the path is outside the workspace
	const fullPath = path_1.default.resolve(cline.cwd, removeClosingTag("path", relPath))
	const isOutsideWorkspace = (0, pathUtils_1.isPathOutsideWorkspace)(fullPath)
	const sharedMessageProps = {
		tool: "generateImage",
		path: (0, path_2.getReadablePath)(cline.cwd, removeClosingTag("path", relPath)),
		content: prompt,
		isOutsideWorkspace,
		isProtected: isWriteProtected,
	}
	try {
		if (!block.partial) {
			cline.consecutiveMistakeCount = 0
			// Ask for approval before generating the image
			const approvalMessage = JSON.stringify({
				...sharedMessageProps,
				content: prompt,
				...(inputImagePath && { inputImage: (0, path_2.getReadablePath)(cline.cwd, inputImagePath) }),
			})
			const didApprove = await askApproval("tool", approvalMessage, undefined, isWriteProtected)
			if (!didApprove) {
				return
			}
			// Create a temporary OpenRouter handler with minimal options
			// kilocode_change start
			const openRouterHandler = openRouterApiKey
				? new openrouter_1.OpenRouterHandler({})
				: new kilocode_openrouter_1.KilocodeOpenrouterHandler({
						kilocodeToken: kiloCodeApiKey,
						kilocodeOrganizationId:
							cline.apiConfiguration.apiProvider === "kilocode" &&
							cline.apiConfiguration.kilocodeToken === kiloCodeApiKey
								? cline.apiConfiguration.kilocodeOrganizationId
								: undefined,
					})
			// kilocode_change end
			// Call the generateImage method with the explicit API key and optional input image
			const result = await openRouterHandler.generateImage(
				prompt,
				selectedModel,
				// kilocode_change start
				openRouterApiKey ||
					kiloCodeApiKey ||
					(() => {
						throw new Error("Unreachable because of earlier check.")
					})(),
				// kilocode_change end
				inputImageData,
				cline.taskId,
			)
			if (!result.success) {
				await cline.say("error", result.error || "Failed to generate image")
				pushToolResult(responses_1.formatResponse.toolError(result.error || "Failed to generate image"))
				return
			}
			if (!result.imageData) {
				const errorMessage = "No image data received"
				await cline.say("error", errorMessage)
				pushToolResult(responses_1.formatResponse.toolError(errorMessage))
				return
			}
			// Extract base64 data from data URL
			const base64Match = result.imageData.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
			if (!base64Match) {
				const errorMessage = "Invalid image format received"
				await cline.say("error", errorMessage)
				pushToolResult(responses_1.formatResponse.toolError(errorMessage))
				return
			}
			const imageFormat = base64Match[1]
			const base64Data = base64Match[2]
			// Ensure the file has the correct extension
			let finalPath = relPath
			if (!finalPath.match(/\.(png|jpg|jpeg)$/i)) {
				finalPath = `${finalPath}.${imageFormat === "jpeg" ? "jpg" : imageFormat}`
			}
			// Convert base64 to buffer
			const imageBuffer = Buffer.from(base64Data, "base64")
			// Create directory if it doesn't exist
			const absolutePath = path_1.default.resolve(cline.cwd, finalPath)
			const directory = path_1.default.dirname(absolutePath)
			await promises_1.default.mkdir(directory, { recursive: true })
			// Write the image file
			await promises_1.default.writeFile(absolutePath, imageBuffer)
			// Track file creation
			if (finalPath) {
				await cline.fileContextTracker.trackFileContext(finalPath, "roo_edited")
			}
			cline.didEditFile = true
			// Record successful tool usage
			cline.recordToolUsage("generate_image")
			// Get the webview URI for the image
			const provider = cline.providerRef.deref()
			const fullImagePath = path_1.default.join(cline.cwd, finalPath)
			// Convert to webview URI if provider is available
			let imageUri = provider?.convertToWebviewUri?.(fullImagePath) ?? vscode.Uri.file(fullImagePath).toString()
			// Add cache-busting parameter to prevent browser caching issues
			const cacheBuster = Date.now()
			imageUri = imageUri.includes("?") ? `${imageUri}&t=${cacheBuster}` : `${imageUri}?t=${cacheBuster}`
			// Send the image with the webview URI
			await cline.say("image", JSON.stringify({ imageUri, imagePath: fullImagePath }))
			pushToolResult(responses_1.formatResponse.toolResult((0, path_2.getReadablePath)(cline.cwd, finalPath)))
			return
		}
	} catch (error) {
		await handleError("generating image", error)
		return
	}
}
//# sourceMappingURL=generateImageTool.js.map
