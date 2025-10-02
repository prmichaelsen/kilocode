"use strict"
// kilocode_change whole file
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
exports.readDirectoryRecursive = readDirectoryRecursive
exports.synchronizeRuleToggles = synchronizeRuleToggles
const path = __importStar(require("path"))
const fs_1 = require("../../../utils/fs")
/**
 * Recursively traverses directory and finds all files, including checking for optional whitelisted file extension
 */
async function readDirectoryRecursive(directoryPath, allowedFileExtension, excludedPaths = []) {
	try {
		const entries = await (0, fs_1.readDirectory)(directoryPath, excludedPaths)
		let results = []
		for (const entry of entries) {
			if (allowedFileExtension !== "") {
				const fileExtension = path.extname(entry)
				if (fileExtension !== allowedFileExtension) {
					continue
				}
			}
			results.push(entry)
		}
		return results
	} catch (error) {
		console.error(`Error reading directory ${directoryPath}: ${error}`)
		return []
	}
}
/**
 * Gets the up to date toggles
 */
async function synchronizeRuleToggles(
	rulesDirectoryPath,
	currentToggles,
	allowedFileExtension = "",
	excludedPaths = [],
) {
	// Create a copy of toggles to modify
	const updatedToggles = { ...currentToggles }
	try {
		const pathExists = await (0, fs_1.fileExistsAtPath)(rulesDirectoryPath)
		if (pathExists) {
			const isDir = await (0, fs_1.isDirectory)(rulesDirectoryPath)
			if (isDir) {
				// DIRECTORY CASE
				const filePaths = await readDirectoryRecursive(rulesDirectoryPath, allowedFileExtension, excludedPaths)
				const existingRulePaths = new Set()
				for (const filePath of filePaths) {
					const ruleFilePath = path.resolve(rulesDirectoryPath, filePath)
					existingRulePaths.add(ruleFilePath)
					const pathHasToggle = ruleFilePath in updatedToggles
					if (!pathHasToggle) {
						updatedToggles[ruleFilePath] = true
					}
				}
				// Clean up toggles for non-existent files
				for (const togglePath in updatedToggles) {
					const pathExists = existingRulePaths.has(togglePath)
					if (!pathExists) {
						delete updatedToggles[togglePath]
					}
				}
			} else {
				// FILE CASE
				// Add toggle for this file
				const pathHasToggle = rulesDirectoryPath in updatedToggles
				if (!pathHasToggle) {
					updatedToggles[rulesDirectoryPath] = true
				}
				// Remove toggles for any other paths
				for (const togglePath in updatedToggles) {
					if (togglePath !== rulesDirectoryPath) {
						delete updatedToggles[togglePath]
					}
				}
			}
		} else {
			// PATH DOESN'T EXIST CASE
			// Clear all toggles since the path doesn't exist
			for (const togglePath in updatedToggles) {
				delete updatedToggles[togglePath]
			}
		}
	} catch (error) {
		console.error(`Failed to synchronize rule toggles for path: ${rulesDirectoryPath}`, error)
	}
	return updatedToggles
}
//# sourceMappingURL=rule-helpers.js.map
