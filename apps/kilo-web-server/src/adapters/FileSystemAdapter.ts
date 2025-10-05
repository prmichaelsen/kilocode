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
			
			// Check if path exists and get stats
			const stats = await fs.stat(fullPath)
			
			if (stats.isDirectory()) {
				throw new Error(`EISDIR: Cannot read '${filePath}' - it's a directory, not a file. Use readDirectory() or list_files tool instead.`)
			}
			
			return await fs.readFile(fullPath, 'utf-8')
		} catch (error: any) {
			console.error(`[FileSystemAdapter] Error reading file ${filePath}:`, error)
			
			// Provide specific, actionable error messages
			if (error.code === 'ENOENT') {
				throw new Error(`File not found: '${filePath}' does not exist. Check the file path and try again.`)
			} else if (error.code === 'EISDIR') {
				throw new Error(`Cannot read '${filePath}' - it's a directory, not a file. Use readDirectory() or list_files tool instead.`)
			} else if (error.code === 'EACCES') {
				throw new Error(`Permission denied: Cannot read '${filePath}'. Check file permissions.`)
			} else if (error.message.includes('EISDIR')) {
				throw new Error(`Cannot read '${filePath}' - it's a directory, not a file. Use readDirectory() or list_files tool instead.`)
			} else {
				throw new Error(`Failed to read file '${filePath}': ${error.message || error}`)
			}
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
		} catch (error: any) {
			console.error(`[FileSystemAdapter] Error writing file ${filePath}:`, error)
			
			// Provide specific, actionable error messages
			if (error.code === 'EACCES') {
				throw new Error(`Permission denied: Cannot write to '${filePath}'. Check file permissions and directory access.`)
			} else if (error.code === 'ENOSPC') {
				throw new Error(`No space left on device: Cannot write to '${filePath}'. Free up disk space and try again.`)
			} else if (error.code === 'EISDIR') {
				throw new Error(`Cannot write to '${filePath}' - it's a directory, not a file. Specify a file path instead.`)
			} else {
				throw new Error(`Failed to write file '${filePath}': ${error.message || error}`)
			}
		}
	}

	async readDirectory(dirPath: string): Promise<string[]> {
		try {
			const fullPath = this.resolvePath(dirPath)
			console.log(`[FileSystemAdapter] Reading directory: ${fullPath}`)
			
			// Check if path exists and is actually a directory
			const stats = await fs.stat(fullPath)
			
			if (!stats.isDirectory()) {
				throw new Error(`ENOTDIR: Cannot list '${dirPath}' - it's a file, not a directory. Use readFile() or read_file tool instead.`)
			}
			
			const entries = await fs.readdir(fullPath, { withFileTypes: true })
			return entries.map(entry => {
				const name = entry.name
				return entry.isDirectory() ? `${name}/` : name
			})
		} catch (error: any) {
			console.error(`[FileSystemAdapter] Error reading directory ${dirPath}:`, error)
			
			// Provide specific, actionable error messages
			if (error.code === 'ENOENT') {
				throw new Error(`Directory not found: '${dirPath}' does not exist. Check the directory path and try again.`)
			} else if (error.code === 'ENOTDIR') {
				throw new Error(`Cannot list '${dirPath}' - it's a file, not a directory. Use readFile() or read_file tool instead.`)
			} else if (error.code === 'EACCES') {
				throw new Error(`Permission denied: Cannot access directory '${dirPath}'. Check directory permissions.`)
			} else if (error.message.includes('ENOTDIR')) {
				throw new Error(`Cannot list '${dirPath}' - it's a file, not a directory. Use readFile() or read_file tool instead.`)
			} else {
				throw new Error(`Failed to read directory '${dirPath}': ${error.message || error}`)
			}
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