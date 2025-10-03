// Minimal adapter that replaces vscode.OutputChannel
export class WebOutputChannel {
	private name: string
	private logs: string[] = []

	constructor(name: string = "Kilo-Code-Web") {
		this.name = name
	}

	appendLine(value: string): void {
		const timestamp = new Date().toISOString()
		const logEntry = `[${timestamp}] ${value}`
		this.logs.push(logEntry)
		console.log(`[${this.name}] ${value}`)

		// Keep only last 1000 log entries to prevent memory issues
		if (this.logs.length > 1000) {
			this.logs = this.logs.slice(-1000)
		}
	}

	append(value: string): void {
		// For compatibility, just append without newline
		console.log(`[${this.name}] ${value}`)
	}

	clear(): void {
		this.logs = []
		console.log(`[${this.name}] Output cleared`)
	}

	show(): void {
		// In web context, we can't "show" an output channel
		// Just log that it was requested
		console.log(`[${this.name}] Show output channel requested`)
	}

	hide(): void {
		// In web context, we can't "hide" an output channel
		console.log(`[${this.name}] Hide output channel requested`)
	}

	dispose(): void {
		this.logs = []
		console.log(`[${this.name}] Output channel disposed`)
	}

	// Additional methods for web context
	getLogs(): string[] {
		return [...this.logs]
	}

	getRecentLogs(count: number = 100): string[] {
		return this.logs.slice(-count)
	}
}
