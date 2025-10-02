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
exports.ensureLocalKilorulesDirExists = ensureLocalKilorulesDirExists
const fs_1 = require("../../../utils/fs")
const path = __importStar(require("path"))
const promises_1 = __importDefault(require("fs/promises"))
/**
 * Converts .kilocode/rules file to directory and places old .kilocode/rules file inside directory, renaming it
 * Doesn't do anything if .kilocode/rules dir already exists or doesn't exist
 * Returns whether there are any uncaught errors
 */
async function ensureLocalKilorulesDirExists(kilorulePath, defaultRuleFilename) {
	try {
		const exists = await (0, fs_1.fileExistsAtPath)(kilorulePath)
		if (exists && !(await (0, fs_1.isDirectory)(kilorulePath))) {
			// logic to convert file into directory, and rename the rules file to {defaultRuleFilename}
			const content = await promises_1.default.readFile(kilorulePath, "utf8")
			const tempPath = kilorulePath + ".bak"
			await promises_1.default.rename(kilorulePath, tempPath) // create backup
			try {
				await promises_1.default.mkdir(kilorulePath, { recursive: true })
				await promises_1.default.writeFile(path.join(kilorulePath, defaultRuleFilename), content, "utf8")
				await promises_1.default.unlink(tempPath).catch(() => {}) // delete backup
				return false // conversion successful with no errors
			} catch (conversionError) {
				// attempt to restore backup on conversion failure
				try {
					await promises_1.default.rm(kilorulePath, { recursive: true, force: true }).catch(() => {})
					await promises_1.default.rename(tempPath, kilorulePath) // restore backup
				} catch (restoreError) {}
				return true // in either case here we consider this an error
			}
		}
		// exists and is a dir or doesn't exist, either of these cases we dont need to handle here
		return false
	} catch (error) {
		return true
	}
}
//# sourceMappingURL=kilo-rules.js.map
