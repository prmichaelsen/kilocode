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
exports.checkAndRunAutoLaunchingTask = checkAndRunAutoLaunchingTask
// kilocode_change - new file Support JSON-based launch configurations
const vscode = __importStar(require("vscode"))
/**
 * Checks for launch configuration and runs the task immediately if found.
 * Reads .kilocode/launchConfig.json from the workspace root.
 */
async function checkAndRunAutoLaunchingTask(context) {
	if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
		return
	}
	const workspaceFolderUri = vscode.workspace.workspaceFolders[0].uri
	const configPath = vscode.Uri.joinPath(workspaceFolderUri, ".kilocode", "launchConfig.json")
	try {
		const configContent = await vscode.workspace.fs.readFile(configPath)
		const configText = Buffer.from(configContent).toString("utf8")
		const config = JSON.parse(configText)
		console.log(`🚀 Auto-launching task from '${configPath}' with config:\n${JSON.stringify(config)}`)
		await new Promise((resolve) => setTimeout(resolve, 500))
		await vscode.commands.executeCommand("kilo-code.SidebarProvider.focus")
		vscode.commands.executeCommand("kilo-code.newTask", config) // Pass the full config to newTask
	} catch (error) {
		if (error instanceof vscode.FileSystemError && error.code === "FileNotFound") {
			return // No config file found
		}
		console.error(`Error reading launch config:`, error)
	}
}
//# sourceMappingURL=autoLaunchingTask.js.map
