"use strict"
/**
 * Configuration for models that should use simplified single-file read_file tool
 * These models will use the simpler <read_file><path>...</path></read_file> format
 * instead of the more complex multi-file args format
 */
Object.defineProperty(exports, "__esModule", { value: true })
exports.shouldUseSingleFileRead = shouldUseSingleFileRead
/**
 * Check if a model should use single file read format
 * @param modelId The model ID to check
 * @returns true if the model should use single file reads
 */
function shouldUseSingleFileRead(modelId) {
	return false // kilocode_change
	return modelId.includes("grok-code-fast-1") || modelId.includes("code-supernova")
}
//# sourceMappingURL=single-file-read-models.js.map
