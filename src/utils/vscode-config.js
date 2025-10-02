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
exports.getUserDataBaseDir = getUserDataBaseDir
exports.readJSON5File = readJSON5File
exports.canReadLocalFiles = canReadLocalFiles
exports.readUserConfigFile = readUserConfigFile
// kilocode_change - new file
const vscode = __importStar(require("vscode"))
const path = __importStar(require("path"))
const os = __importStar(require("os"))
const json5_1 = __importDefault(require("json5"))
const fs_1 = require("fs")
function productDirName() {
	const name = vscode.env.appName || ""
	const n = name.toLowerCase()
	if (n.includes("insiders")) return "Code - Insiders"
	if (n.includes("visual studio code")) return "Code"
	if (n.includes("vscodium")) return "VSCodium"
	if (n.includes("cursor")) return "Cursor"
	if (n.includes("windsurf")) return "Windsurf"
	if (n.includes("oss")) return "Code - OSS"
	return "Code"
}
function getUserDataBaseDir() {
	const portable = process.env.VSCODE_PORTABLE
	if (portable) return path.join(portable, "user-data")
	const home = os.homedir()
	const product = productDirName()
	if (process.platform === "win32") {
		const appdata = process.env.APPDATA || path.join(home, "AppData", "Roaming")
		return path.join(appdata, product)
	}
	if (process.platform === "darwin") {
		return path.join(home, "Library", "Application Support", product)
	}
	const xdg = process.env.XDG_CONFIG_HOME || path.join(home, ".config")
	return path.join(xdg, product)
}
async function readJSON5File(filePath) {
	try {
		const buf = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))
		return json5_1.default.parse(Buffer.from(buf).toString("utf8"))
	} catch {
		return null
	}
}
function canReadLocalFiles() {
	return !vscode.env.remoteName && vscode.env.uiKind === vscode.UIKind.Desktop
}
async function readUserConfigFile(filename) {
	if (!canReadLocalFiles()) return []
	const candidates = await getConfigFileCandidates(filename)
	for (const filePath of candidates) {
		const rules = await readJSON5File(filePath)
		if (Array.isArray(rules)) return rules
	}
	return []
}
async function getConfigFileCandidates(filename) {
	if (!vscode.env.remoteName && (process.env.CODE_SERVER === "true" || process.env.VSCODE_PROXY_URI)) {
		const base = path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share"), "code-server")
		const user = path.join(base, "User")
		return await enumerateProfileFiles(user, filename)
	}
	const baseDir = getUserDataBaseDir()
	const userDir = path.join(baseDir, "User")
	return await enumerateProfileFiles(userDir, filename)
}
async function enumerateProfileFiles(userDir, filename) {
	const candidates = []
	candidates.push(path.join(userDir, filename))
	try {
		const profilesDir = path.join(userDir, "profiles")
		const entries = await fs_1.promises.readdir(profilesDir, { withFileTypes: true })
		for (const e of entries) {
			if (e.isDirectory()) {
				candidates.push(path.join(profilesDir, e.name, filename))
			}
		}
	} catch {
		// No profiles directory
	}
	const existing = []
	for (const p of candidates) {
		try {
			const st = await fs_1.promises.stat(p)
			if (st.isFile()) existing.push(p)
		} catch {
			/* ignore */
		}
	}
	if (existing.length > 1) {
		const stats = await Promise.all(existing.map(async (p) => ({ path: p, stat: await fs_1.promises.stat(p) })))
		stats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
		return stats.map((s) => s.path)
	}
	return existing
}
//# sourceMappingURL=vscode-config.js.map
