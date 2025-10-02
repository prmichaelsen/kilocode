"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.getGlobalFsPath = getGlobalFsPath
exports.ensureSettingsDirectoryExists = ensureSettingsDirectoryExists
const promises_1 = require("fs/promises")
const path_1 = require("path")
async function getGlobalFsPath(context) {
	return context.globalStorageUri.fsPath
}
async function ensureSettingsDirectoryExists(context) {
	const settingsDir = (0, path_1.join)(context.globalStorageUri.fsPath, "settings")
	await (0, promises_1.mkdir)(settingsDir, { recursive: true })
	return settingsDir
}
//# sourceMappingURL=globalContext.js.map
