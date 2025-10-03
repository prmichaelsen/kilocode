import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

export interface FileSystemAdapter {
	readFile(path: string): Promise<string>
	writeFile(path: string, content: string): Promise<void>
	readDirectory(path: string): Promise<string[]>
	exists(path: string): Promise<boolean>
	createDirectory(path: string): Promise<void>
	deleteFile(path: string): Promise<void>
}

export class NodeFileSystemAdapter implements FileSystemAdapter {
	private basePath: string

	constructor(basePath: string = os.homedir()) {
		this.basePath = basePath
	}

	private resolvePath(filePath: string): string {
		// If path is absolute, use it as-is, otherwise resolve relative to basePath
		return path.isAbsolute(filePath) ? filePath : path.resolve(this.basePath, filePath)
	}

	async readFile(filePath: string): Promise<string> {
		try {
			const fullPath = this.resolvePath(filePath)
			console.log(`[FileSystemAdapter] Reading file: ${fullPath}`)
			return await fs.readFile(fullPath, 'utf-8')
		} catch (error) {
			console.error(`[FileSystemAdapter] Error reading file ${filePath}:`, error)
			throw new Error(`Failed to read file: ${filePath}`)
		}
	}

	async writeFile(filePath: string, content: string): Promise<void> {
		try {
			const fullPath = this.resolvePath(filePath)
			console.log(`[FileSystemAdapter] Writing file: ${fullPath}`)
			
			// Ensure directory exists
			const dir = path.dirname(fullPath)
			await fs.mkdir(dir, { recursive: true })
			
			await fs.writeFile(fullPath, content, 'utf-8')
		} catch (error) {
			console.error(`[FileSystemAdapter] Error writing file ${filePath}:`, error)
			throw new Error(`Failed to write file: ${filePath}`)
		}
	}

	async readDirectory(dirPath: string): Promise<string[]> {
		try {
			const fullPath = this.resolvePath(dirPath)
			console.log(`[FileSystemAdapter] Reading directory: ${fullPath}`)
			
			const entries = await fs.readdir(fullPath, { withFileTypes: true })
			return entries.map(entry => {
				const name = entry.name
				return entry.isDirectory() ? `${name}/` : name
			})
		} catch (error) {
			console.error(`[FileSystemAdapter] Error reading directory ${dirPath}:`, error)
			throw new Error(`Failed to read directory: ${dirPath}`)
		}
	}

	async exists(filePath: string): Promise<boolean> {
		try {
			const fullPath = this.resolvePath(filePath)
			await fs.access(fullPath)
			return true
		} catch {
			return false
		}
	}

	async createDirectory(dirPath: string): Promise<void> {
		try {
			const fullPath = this.resolvePath(dirPath)
			console.log(`[FileSystemAdapter] Creating directory: ${fullPath}`)
			await fs.mkdir(fullPath, { recursive: true })
		} catch (error) {
			console.error(`[FileSystemAdapter] Error creating directory ${dirPath}:`, error)
			throw new Error(`Failed to create directory: ${dirPath}`)
		}
	}

	async deleteFile(filePath: string): Promise<void> {
		try {
			const fullPath = this.resolvePath(filePath)
			console.log(`[FileSystemAdapter] Deleting file: ${fullPath}`)
			await fs.unlink(fullPath)
		} catch (error) {
			console.error(`[FileSystemAdapter] Error deleting file ${filePath}:`, error)
			throw new Error(`Failed to delete file: ${filePath}`)
		}
	}

	// Additional utility methods for web environment
	async getFileStats(filePath: string): Promise<{ size: number; isDirectory: boolean; modified: Date }> {
		try {
			const fullPath = this.resolvePath(filePath)
			const stats = await fs.stat(fullPath)
			return {
				size: stats.size,
				isDirectory: stats.isDirectory(),
				modified: stats.mtime
			}
		} catch (error) {
			console.error(`[FileSystemAdapter] Error getting file stats ${filePath}:`, error)
			throw new Error(`Failed to get file stats: ${filePath}`)
		}
	}

	async listFilesRecursive(dirPath: string, maxDepth: number = 3): Promise<string[]> {
		const results: string[] = []
		
		const traverse = async (currentPath: string, depth: number) => {
			if (depth > maxDepth) return
			
			try {
				const entries = await this.readDirectory(currentPath)
				
				for (const entry of entries) {
					const entryPath = path.join(currentPath, entry)
					results.push(entryPath)
					
					if (entry.endsWith('/') && depth < maxDepth) {
						await traverse(entryPath, depth + 1)
					}
				}
			} catch (error) {
				console.warn(`[FileSystemAdapter] Could not traverse ${currentPath}:`, error)
			}
		}

		await traverse(dirPath, 0)
		return results
	}
}