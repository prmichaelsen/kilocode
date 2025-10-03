export interface ToolArgs {
	cwd: string
	supportsComputerUse: boolean
	partialReadsEnabled?: boolean
	settings?: {
		maxConcurrentFileReads?: number
	}
}