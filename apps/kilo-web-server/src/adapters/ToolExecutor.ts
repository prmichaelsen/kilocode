import type { ToolName } from "@roo-code/types"
import WebSocket from "ws"
import * as path from "path"
import * as fs from "fs/promises"

export class WebToolExecutor {
	private virtualFS = new Map<string, string>()
	private workspaceRoot: string

	constructor(workspaceRoot: string = "/project") {
		this.workspaceRoot = workspaceRoot
		this.initializeMockFiles()
	}

	async executeReadOnlyTool(toolName: ToolName, params: any, ws: WebSocket): Promise<string> {
		console.log(`[WebToolExecutor] Executing ${toolName} with params:`, params)

		switch (toolName) {
			case "list_files":
				return this.listFiles(params.path || this.workspaceRoot, params.recursive || false)
			case "read_file":
				return this.readFile(params.path)
			case "search_files":
				return this.searchFiles(params.path || this.workspaceRoot, params.regex, params.file_pattern)
			case "list_code_definition_names":
				return this.listCodeDefinitionNames(params.path)
			default:
				throw new Error(`Read-only tool ${toolName} not implemented`)
		}
	}

	private listFiles(dirPath: string, recursive: boolean): string {
		try {
			// Normalize path
			const normalizedPath = this.normalizePath(dirPath)

			// Get all files that start with this path
			const files = Array.from(this.virtualFS.keys())
				.filter((filePath) => {
					const relativePath = filePath.replace(normalizedPath, "").replace(/^\//, "")
					if (!relativePath) return false

					if (recursive) {
						return true
					} else {
						// Only immediate children (no subdirectories)
						return !relativePath.includes("/")
					}
				})
				.map((filePath) => {
					const relativePath = filePath.replace(normalizedPath, "").replace(/^\//, "")
					return relativePath
				})
				.sort()

			if (files.length === 0) {
				return `No files found in ${dirPath}`
			}

			return files.join("\n")
		} catch (error) {
			throw new Error(
				`Failed to list files in ${dirPath}: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	private readFile(filePath: string): string {
		const normalizedPath = this.normalizePath(filePath)
		const content = this.virtualFS.get(normalizedPath)

		if (content === undefined) {
			throw new Error(`File not found: ${filePath}`)
		}

		return content
	}

	private searchFiles(dirPath: string, regex: string, filePattern?: string): string {
		try {
			const normalizedPath = this.normalizePath(dirPath)
			const searchRegex = new RegExp(regex, "gi")
			const results: string[] = []

			// Filter files by pattern if provided
			let filesToSearch = Array.from(this.virtualFS.keys()).filter((filePath) =>
				filePath.startsWith(normalizedPath),
			)

			if (filePattern) {
				const patternRegex = new RegExp(filePattern.replace(/\*/g, ".*"))
				filesToSearch = filesToSearch.filter((filePath) => patternRegex.test(path.basename(filePath)))
			}

			// Search in each file
			filesToSearch.forEach((filePath) => {
				const content = this.virtualFS.get(filePath)
				if (content) {
					const lines = content.split("\n")
					lines.forEach((line, lineNum) => {
						if (searchRegex.test(line)) {
							const relativePath = filePath.replace(normalizedPath, "").replace(/^\//, "")
							results.push(`${relativePath}:${lineNum + 1}: ${line.trim()}`)
						}
					})
				}
			})

			return results.length > 0 ? results.join("\n") : `No matches found for "${regex}"`
		} catch (error) {
			throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`)
		}
	}

	private listCodeDefinitionNames(filePath: string): string {
		try {
			const content = this.readFile(filePath)
			const definitions: string[] = []

			// Simple regex patterns for common code definitions
			const patterns = [
				/^(export\s+)?(class|interface|type|enum)\s+(\w+)/gm,
				/^(export\s+)?(function|const|let|var)\s+(\w+)/gm,
				/^(\s*)(public|private|protected)?\s*(static)?\s*(\w+)\s*\(/gm,
			]

			patterns.forEach((pattern) => {
				let match
				while ((match = pattern.exec(content)) !== null) {
					const name = match[3] || match[4]
					if (name && !definitions.includes(name)) {
						definitions.push(name)
					}
				}
			})

			return definitions.length > 0 ? definitions.join("\n") : "No code definitions found"
		} catch (error) {
			throw new Error(
				`Failed to list code definitions: ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	private normalizePath(filePath: string): string {
		// Ensure path starts with workspace root
		if (!filePath.startsWith(this.workspaceRoot)) {
			return path.join(this.workspaceRoot, filePath).replace(/\\/g, "/")
		}
		return filePath.replace(/\\/g, "/")
	}

	// Initialize with some mock files for POC testing
	private initializeMockFiles() {
		this.virtualFS.set(
			"/project/README.md",
			`# My Project

This is a test project for the Kilo Code web POC.

## Features
- Basic file operations
- Tool execution
- Agent conversation

## Getting Started
Run the agent and ask it to explore the project structure.
`,
		)

		this.virtualFS.set(
			"/project/src/index.js",
			`console.log("Hello World")

function greet(name) {
  return \`Hello, \${name}!\`
}

class Calculator {
  add(a, b) {
    return a + b
  }
  
  multiply(a, b) {
    return a * b
  }
}

export { greet, Calculator }
`,
		)

		this.virtualFS.set(
			"/project/src/utils.js",
			`export function formatDate(date) {
  return date.toISOString().split('T')[0]
}

export const API_BASE_URL = 'https://api.example.com'

export class Logger {
  static log(message) {
    console.log(\`[\${new Date().toISOString()}] \${message}\`)
  }
}
`,
		)

		this.virtualFS.set(
			"/project/package.json",
			`{
  "name": "test-project",
  "version": "1.0.0",
  "description": "A test project for Kilo Code web POC",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "echo \\"No tests yet\\""
  },
  "dependencies": {},
  "devDependencies": {}
}`,
		)

		this.virtualFS.set(
			"/project/.gitignore",
			`node_modules/
dist/
.env
*.log
.DS_Store
`,
		)

		console.log(`[WebToolExecutor] Initialized with ${this.virtualFS.size} mock files`)
	}

	// Add a file to the virtual file system
	addFile(filePath: string, content: string): void {
		const normalizedPath = this.normalizePath(filePath)
		this.virtualFS.set(normalizedPath, content)
	}

	// Get all files (for debugging)
	getAllFiles(): Record<string, string> {
		return Object.fromEntries(this.virtualFS)
	}

	// Get file count
	getFileCount(): number {
		return this.virtualFS.size
	}
}
