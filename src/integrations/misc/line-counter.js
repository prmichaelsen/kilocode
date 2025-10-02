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
exports.countFileLines = countFileLines
const fs_1 = __importStar(require("fs"))
const readline_1 = require("readline")
/**
 * Efficiently counts lines in a file using streams without loading the entire file into memory
 *
 * @param filePath - Path to the file to count lines in
 * @returns A promise that resolves to the number of lines in the file
 */
async function countFileLines(filePath) {
	// Check if file exists
	try {
		await fs_1.default.promises.access(filePath, fs_1.default.constants.F_OK)
	} catch (error) {
		throw new Error(`File not found: ${filePath}`)
	}
	return new Promise((resolve, reject) => {
		let lineCount = 0
		const readStream = (0, fs_1.createReadStream)(filePath)
		const rl = (0, readline_1.createInterface)({
			input: readStream,
			crlfDelay: Infinity,
		})
		rl.on("line", () => {
			lineCount++
		})
		rl.on("close", () => {
			resolve(lineCount)
		})
		rl.on("error", (err) => {
			reject(err)
		})
		readStream.on("error", (err) => {
			reject(err)
		})
	})
}
//# sourceMappingURL=line-counter.js.map
