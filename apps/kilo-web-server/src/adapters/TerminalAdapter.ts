import { spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import * as os from 'os'

export interface TerminalAdapter {
	executeCommand(command: string, cwd?: string): Promise<{
		stdout: string
		stderr: string
		exitCode: number
	}>
}

export class NodeTerminalAdapter implements TerminalAdapter {
	private defaultCwd: string

	constructor(defaultCwd: string = os.homedir()) {
		this.defaultCwd = defaultCwd
	}

	async executeCommand(command: string, cwd?: string): Promise<{
		stdout: string
		stderr: string
		exitCode: number
	}> {
		return new Promise((resolve, reject) => {
			const workingDir = cwd ? path.resolve(this.defaultCwd, cwd) : this.defaultCwd
			
			console.log(`[TerminalAdapter] Executing command: ${command} in ${workingDir}`)

			// Parse command and arguments
			const [cmd, ...args] = command.split(' ')
			
			const childProcess: ChildProcess = spawn(cmd, args, {
				cwd: workingDir,
				shell: true,
				stdio: ['pipe', 'pipe', 'pipe'],
				env: {
					...process.env,
					WORKSPACE_ROOT: workingDir,
				}
			})

			let stdout = ''
			let stderr = ''

			childProcess.stdout?.on('data', (data) => {
				stdout += data.toString()
			})

			childProcess.stderr?.on('data', (data) => {
				stderr += data.toString()
			})

			childProcess.on('close', (code) => {
				console.log(`[TerminalAdapter] Command completed with exit code: ${code}`)
				resolve({
					stdout: stdout.trim(),
					stderr: stderr.trim(),
					exitCode: code || 0
				})
			})

			childProcess.on('error', (error) => {
				console.error(`[TerminalAdapter] Command failed:`, error)
				reject(error)
			})

			// Set a timeout for long-running commands (30 seconds)
			setTimeout(() => {
				if (!childProcess.killed) {
					childProcess.kill('SIGTERM')
					reject(new Error(`Command timed out after 30 seconds: ${command}`))
				}
			}, 30000)
		})
	}
}