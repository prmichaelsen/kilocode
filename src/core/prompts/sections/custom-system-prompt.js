"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.getSystemPromptFilePath = getSystemPromptFilePath
exports.loadSystemPromptFile = loadSystemPromptFile
exports.ensureRooDirectory = ensureRooDirectory
const promises_1 = __importDefault(require("fs/promises"))
const path_1 = __importDefault(require("path"))
const fs_1 = require("../../../utils/fs")
function interpolatePromptContent(content, variables) {
	let interpolatedContent = content
	for (const key in variables) {
		if (Object.prototype.hasOwnProperty.call(variables, key) && variables[key] !== undefined) {
			const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g")
			interpolatedContent = interpolatedContent.replace(placeholder, variables[key])
		}
	}
	return interpolatedContent
}
/**
 * Safely reads a file, returning an empty string if the file doesn't exist
 */
async function safeReadFile(filePath) {
	try {
		const content = await promises_1.default.readFile(filePath, "utf-8")
		// When reading with "utf-8" encoding, content should be a string
		return content.trim()
	} catch (err) {
		const errorCode = err.code
		if (!errorCode || !["ENOENT", "EISDIR"].includes(errorCode)) {
			throw err
		}
		return ""
	}
}
/**
 * Get the path to a system prompt file for a specific mode
 */
function getSystemPromptFilePath(cwd, mode) {
	// kilocode_change
	return path_1.default.join(cwd, ".kilocode", `system-prompt-${mode}`)
}
/**
 * Loads custom system prompt from a file at .kilocode/system-prompt-[mode slug]
 * If the file doesn't exist, returns an empty string
 */
async function loadSystemPromptFile(cwd, mode, variables) {
	const filePath = getSystemPromptFilePath(cwd, mode)
	const rawContent = await safeReadFile(filePath)
	if (!rawContent) {
		return ""
	}
	const interpolatedContent = interpolatePromptContent(rawContent, variables)
	return interpolatedContent
}
/**
 * Ensures the .kilocode directory exists, creating it if necessary
 */
async function ensureRooDirectory(cwd) {
	// kilocode_change
	const rooDir = path_1.default.join(cwd, ".kilocode")
	// Check if directory already exists
	if (await (0, fs_1.fileExistsAtPath)(rooDir)) {
		return
	}
	// Create the directory
	try {
		await promises_1.default.mkdir(rooDir, { recursive: true })
	} catch (err) {
		// If directory already exists (race condition), ignore the error
		const errorCode = err.code
		if (errorCode !== "EEXIST") {
			throw err
		}
	}
}
//# sourceMappingURL=custom-system-prompt.js.map
