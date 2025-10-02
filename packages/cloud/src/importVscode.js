"use strict"
/**
 * Utility for lazy-loading the VS Code module in environments where it's available.
 * This allows the SDK to be used in both VS Code extension and Node.js environments.
 * Compatible with both VSCode and Cursor extension hosts.
 */
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
exports.importVscode = importVscode
let vscodeModule
/**
 * Attempts to dynamically import the `vscode` module.
 * Returns undefined if not running in a VSCode extension context.
 */
async function importVscode() {
	if (vscodeModule) {
		return vscodeModule
	}
	try {
		if (typeof require !== "undefined") {
			try {
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				vscodeModule = require("vscode")
				if (vscodeModule) {
					console.log("VS Code module loaded from require")
					return vscodeModule
				}
			} catch (error) {
				console.error(`Error loading VS Code module: ${error instanceof Error ? error.message : String(error)}`)
				// Fall through to dynamic import.
			}
		}
		vscodeModule = await Promise.resolve().then(() => __importStar(require("vscode")))
		console.log("VS Code module loaded from dynamic import")
		return vscodeModule
	} catch (error) {
		console.warn(
			`VS Code module not available in this environment: ${error instanceof Error ? error.message : String(error)}`,
		)
		return undefined
	}
}
//# sourceMappingURL=importVscode.js.map
