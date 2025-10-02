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
exports.getCommands = getCommands
exports.getCommand = getCommand
exports.getCommandNames = getCommandNames
exports.getCommandNameFromFile = getCommandNameFromFile
exports.isMarkdownFile = isMarkdownFile
const promises_1 = __importDefault(require("fs/promises"))
const path = __importStar(require("path"))
const gray_matter_1 = __importDefault(require("gray-matter"))
const roo_config_1 = require("../roo-config")
const built_in_commands_1 = require("./built-in-commands")
/**
 * Get all available commands from built-in, global, and project directories
 * Priority order: project > global > built-in (later sources override earlier ones)
 */
async function getCommands(cwd) {
	const commands = new Map()
	// Add built-in commands first (lowest priority)
	const builtInCommands = await (0, built_in_commands_1.getBuiltInCommands)()
	for (const command of builtInCommands) {
		commands.set(command.name, command)
	}
	// Scan global commands (override built-in)
	const globalDir = path.join((0, roo_config_1.getGlobalRooDirectory)(), "commands")
	await scanCommandDirectory(globalDir, "global", commands)
	// Scan project commands (highest priority - override both global and built-in)
	const projectDir = path.join((0, roo_config_1.getProjectRooDirectoryForCwd)(cwd), "commands")
	await scanCommandDirectory(projectDir, "project", commands)
	return Array.from(commands.values())
}
/**
 * Get a specific command by name (optimized to avoid scanning all commands)
 * Priority order: project > global > built-in
 */
async function getCommand(cwd, name) {
	// Try to find the command directly without scanning all commands
	const projectDir = path.join((0, roo_config_1.getProjectRooDirectoryForCwd)(cwd), "commands")
	const globalDir = path.join((0, roo_config_1.getGlobalRooDirectory)(), "commands")
	// Check project directory first (highest priority)
	const projectCommand = await tryLoadCommand(projectDir, name, "project")
	if (projectCommand) {
		return projectCommand
	}
	// Check global directory if not found in project
	const globalCommand = await tryLoadCommand(globalDir, name, "global")
	if (globalCommand) {
		return globalCommand
	}
	// Check built-in commands if not found in project or global (lowest priority)
	return await (0, built_in_commands_1.getBuiltInCommand)(name)
}
/**
 * Try to load a specific command from a directory
 */
async function tryLoadCommand(dirPath, name, source) {
	try {
		const stats = await promises_1.default.stat(dirPath)
		if (!stats.isDirectory()) {
			return undefined
		}
		// Try to find the command file directly
		const commandFileName = `${name}.md`
		const filePath = path.join(dirPath, commandFileName)
		try {
			const content = await promises_1.default.readFile(filePath, "utf-8")
			let parsed
			let description
			let argumentHint
			let commandContent
			try {
				// Try to parse frontmatter with gray-matter
				parsed = (0, gray_matter_1.default)(content)
				description =
					typeof parsed.data.description === "string" && parsed.data.description.trim()
						? parsed.data.description.trim()
						: undefined
				argumentHint =
					typeof parsed.data["argument-hint"] === "string" && parsed.data["argument-hint"].trim()
						? parsed.data["argument-hint"].trim()
						: undefined
				commandContent = parsed.content.trim()
			} catch (frontmatterError) {
				// If frontmatter parsing fails, treat the entire content as command content
				description = undefined
				argumentHint = undefined
				commandContent = content.trim()
			}
			return {
				name,
				content: commandContent,
				source,
				filePath,
				description,
				argumentHint,
			}
		} catch (error) {
			// File doesn't exist or can't be read
			return undefined
		}
	} catch (error) {
		// Directory doesn't exist or can't be read
		return undefined
	}
}
/**
 * Get command names for autocomplete
 */
async function getCommandNames(cwd) {
	const commands = await getCommands(cwd)
	return commands.map((cmd) => cmd.name)
}
/**
 * Scan a specific command directory
 */
async function scanCommandDirectory(dirPath, source, commands) {
	try {
		const stats = await promises_1.default.stat(dirPath)
		if (!stats.isDirectory()) {
			return
		}
		const entries = await promises_1.default.readdir(dirPath, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.isFile() && isMarkdownFile(entry.name)) {
				const filePath = path.join(dirPath, entry.name)
				const commandName = getCommandNameFromFile(entry.name)
				try {
					const content = await promises_1.default.readFile(filePath, "utf-8")
					let parsed
					let description
					let argumentHint
					let commandContent
					try {
						// Try to parse frontmatter with gray-matter
						parsed = (0, gray_matter_1.default)(content)
						description =
							typeof parsed.data.description === "string" && parsed.data.description.trim()
								? parsed.data.description.trim()
								: undefined
						argumentHint =
							typeof parsed.data["argument-hint"] === "string" && parsed.data["argument-hint"].trim()
								? parsed.data["argument-hint"].trim()
								: undefined
						commandContent = parsed.content.trim()
					} catch (frontmatterError) {
						// If frontmatter parsing fails, treat the entire content as command content
						description = undefined
						argumentHint = undefined
						commandContent = content.trim()
					}
					// Project commands override global ones
					if (source === "project" || !commands.has(commandName)) {
						commands.set(commandName, {
							name: commandName,
							content: commandContent,
							source,
							filePath,
							description,
							argumentHint,
						})
					}
				} catch (error) {
					console.warn(`Failed to read command file ${filePath}:`, error)
				}
			}
		}
	} catch (error) {
		// Directory doesn't exist or can't be read - this is fine
	}
}
/**
 * Extract command name from filename (strip .md extension only)
 */
function getCommandNameFromFile(filename) {
	if (filename.toLowerCase().endsWith(".md")) {
		return filename.slice(0, -3)
	}
	return filename
}
/**
 * Check if a file is a markdown file
 */
function isMarkdownFile(filename) {
	return filename.toLowerCase().endsWith(".md")
}
//# sourceMappingURL=commands.js.map
