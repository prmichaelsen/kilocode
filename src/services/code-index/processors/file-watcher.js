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
exports.FileWatcher = void 0
const vscode = __importStar(require("vscode"))
const constants_1 = require("../constants")
const crypto_1 = require("crypto")
const RooIgnoreController_1 = require("../../../core/ignore/RooIgnoreController")
const uuid_1 = require("uuid")
const supported_extensions_1 = require("../shared/supported-extensions")
const parser_1 = require("./parser")
const get_relative_path_1 = require("../shared/get-relative-path")
const ignore_utils_1 = require("../../glob/ignore-utils")
const telemetry_1 = require("@roo-code/telemetry")
const types_1 = require("@roo-code/types")
const validation_helpers_1 = require("../shared/validation-helpers")
const package_1 = require("../../../shared/package")
/**
 * Implementation of the file watcher interface
 */
class FileWatcher {
	/**
	 * Creates a new file watcher
	 * @param workspacePath Path to the workspace
	 * @param context VS Code extension context
	 * @param embedder Optional embedder
	 * @param vectorStore Optional vector store
	 * @param cacheManager Cache manager
	 */
	constructor(
		workspacePath,
		context,
		cacheManager,
		embedder,
		vectorStore,
		ignoreInstance,
		ignoreController,
		batchSegmentThreshold,
	) {
		Object.defineProperty(this, "workspacePath", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: workspacePath,
		})
		Object.defineProperty(this, "context", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: context,
		})
		Object.defineProperty(this, "cacheManager", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: cacheManager,
		})
		Object.defineProperty(this, "embedder", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: embedder,
		})
		Object.defineProperty(this, "vectorStore", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: vectorStore,
		})
		Object.defineProperty(this, "ignoreInstance", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "fileWatcher", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "ignoreController", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "accumulatedEvents", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: new Map(),
		})
		Object.defineProperty(this, "batchProcessDebounceTimer", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "BATCH_DEBOUNCE_DELAY_MS", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: 500,
		})
		Object.defineProperty(this, "FILE_PROCESSING_CONCURRENCY_LIMIT", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: 10,
		})
		Object.defineProperty(this, "batchSegmentThreshold", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "_onDidStartBatchProcessing", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: new vscode.EventEmitter(),
		})
		Object.defineProperty(this, "_onBatchProgressUpdate", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: new vscode.EventEmitter(),
		})
		Object.defineProperty(this, "_onDidFinishBatchProcessing", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: new vscode.EventEmitter(),
		})
		/**
		 * Event emitted when a batch of files begins processing
		 */
		Object.defineProperty(this, "onDidStartBatchProcessing", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: this._onDidStartBatchProcessing.event,
		})
		/**
		 * Event emitted to report progress during batch processing
		 */
		Object.defineProperty(this, "onBatchProgressUpdate", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: this._onBatchProgressUpdate.event,
		})
		/**
		 * Event emitted when a batch of files has finished processing
		 */
		Object.defineProperty(this, "onDidFinishBatchProcessing", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: this._onDidFinishBatchProcessing.event,
		})
		this.ignoreController = ignoreController || new RooIgnoreController_1.RooIgnoreController(workspacePath)
		if (ignoreInstance) {
			this.ignoreInstance = ignoreInstance
		}
		// Get the configurable batch size from VSCode settings, fallback to default
		// If not provided in constructor, try to get from VSCode settings
		if (batchSegmentThreshold !== undefined) {
			this.batchSegmentThreshold = batchSegmentThreshold
		} else {
			try {
				this.batchSegmentThreshold = vscode.workspace
					.getConfiguration(package_1.Package.name)
					.get("codeIndex.embeddingBatchSize", constants_1.BATCH_SEGMENT_THRESHOLD)
			} catch {
				// In test environment, vscode.workspace might not be available
				this.batchSegmentThreshold = constants_1.BATCH_SEGMENT_THRESHOLD
			}
		}
	}
	/**
	 * Initializes the file watcher
	 */
	async initialize() {
		// Create file watcher
		const filePattern = new vscode.RelativePattern(
			this.workspacePath,
			`**/*{${supported_extensions_1.scannerExtensions.map((e) => e.substring(1)).join(",")}}`,
		)
		this.fileWatcher = vscode.workspace.createFileSystemWatcher(filePattern)
		// Register event handlers
		this.fileWatcher.onDidCreate(this.handleFileCreated.bind(this))
		this.fileWatcher.onDidChange(this.handleFileChanged.bind(this))
		this.fileWatcher.onDidDelete(this.handleFileDeleted.bind(this))
	}
	/**
	 * Disposes the file watcher
	 */
	dispose() {
		this.fileWatcher?.dispose()
		if (this.batchProcessDebounceTimer) {
			clearTimeout(this.batchProcessDebounceTimer)
		}
		this._onDidStartBatchProcessing.dispose()
		this._onBatchProgressUpdate.dispose()
		this._onDidFinishBatchProcessing.dispose()
		this.accumulatedEvents.clear()
	}
	/**
	 * Handles file creation events
	 * @param uri URI of the created file
	 */
	async handleFileCreated(uri) {
		this.accumulatedEvents.set(uri.fsPath, { uri, type: "create" })
		this.scheduleBatchProcessing()
	}
	/**
	 * Handles file change events
	 * @param uri URI of the changed file
	 */
	async handleFileChanged(uri) {
		this.accumulatedEvents.set(uri.fsPath, { uri, type: "change" })
		this.scheduleBatchProcessing()
	}
	/**
	 * Handles file deletion events
	 * @param uri URI of the deleted file
	 */
	async handleFileDeleted(uri) {
		this.accumulatedEvents.set(uri.fsPath, { uri, type: "delete" })
		this.scheduleBatchProcessing()
	}
	/**
	 * Schedules batch processing with debounce
	 */
	scheduleBatchProcessing() {
		if (this.batchProcessDebounceTimer) {
			clearTimeout(this.batchProcessDebounceTimer)
		}
		this.batchProcessDebounceTimer = setTimeout(() => this.triggerBatchProcessing(), this.BATCH_DEBOUNCE_DELAY_MS)
	}
	/**
	 * Triggers processing of accumulated events
	 */
	async triggerBatchProcessing() {
		if (this.accumulatedEvents.size === 0) {
			return
		}
		const eventsToProcess = new Map(this.accumulatedEvents)
		this.accumulatedEvents.clear()
		const filePathsInBatch = Array.from(eventsToProcess.keys())
		this._onDidStartBatchProcessing.fire(filePathsInBatch)
		await this.processBatch(eventsToProcess)
	}
	/**
	 * Processes a batch of accumulated events
	 * @param eventsToProcess Map of events to process
	 */
	async _handleBatchDeletions(
		batchResults,
		processedCountInBatch,
		totalFilesInBatch,
		pathsToExplicitlyDelete,
		filesToUpsertDetails,
	) {
		let overallBatchError
		const allPathsToClearFromDB = new Set(pathsToExplicitlyDelete)
		for (const fileDetail of filesToUpsertDetails) {
			if (fileDetail.originalType === "change") {
				allPathsToClearFromDB.add(fileDetail.path)
			}
		}
		if (allPathsToClearFromDB.size > 0 && this.vectorStore) {
			try {
				await this.vectorStore.deletePointsByMultipleFilePaths(Array.from(allPathsToClearFromDB))
				for (const path of pathsToExplicitlyDelete) {
					this.cacheManager.deleteHash(path)
					batchResults.push({ path, status: "success" })
					processedCountInBatch++
					this._onBatchProgressUpdate.fire({
						processedInBatch: processedCountInBatch,
						totalInBatch: totalFilesInBatch,
						currentFile: path,
					})
				}
			} catch (error) {
				const errorStatus = error?.status || error?.response?.status || error?.statusCode
				const errorMessage = error instanceof Error ? error.message : String(error)
				// Log telemetry for deletion error
				telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CODE_INDEX_ERROR, {
					error: (0, validation_helpers_1.sanitizeErrorMessage)(errorMessage),
					location: "deletePointsByMultipleFilePaths",
					errorType: "deletion_error",
					errorStatus: errorStatus,
				})
				// Mark all paths as error
				overallBatchError = error
				for (const path of pathsToExplicitlyDelete) {
					batchResults.push({ path, status: "error", error: error })
					processedCountInBatch++
					this._onBatchProgressUpdate.fire({
						processedInBatch: processedCountInBatch,
						totalInBatch: totalFilesInBatch,
						currentFile: path,
					})
				}
			}
		}
		return { overallBatchError, clearedPaths: allPathsToClearFromDB, processedCount: processedCountInBatch }
	}
	async _processFilesAndPrepareUpserts(
		filesToUpsertDetails,
		batchResults,
		processedCountInBatch,
		totalFilesInBatch,
		pathsToExplicitlyDelete,
	) {
		const pointsForBatchUpsert = []
		const successfullyProcessedForUpsert = []
		const filesToProcessConcurrently = [...filesToUpsertDetails]
		for (let i = 0; i < filesToProcessConcurrently.length; i += this.FILE_PROCESSING_CONCURRENCY_LIMIT) {
			const chunkToProcess = filesToProcessConcurrently.slice(i, i + this.FILE_PROCESSING_CONCURRENCY_LIMIT)
			const chunkProcessingPromises = chunkToProcess.map(async (fileDetail) => {
				this._onBatchProgressUpdate.fire({
					processedInBatch: processedCountInBatch,
					totalInBatch: totalFilesInBatch,
					currentFile: fileDetail.path,
				})
				try {
					const result = await this.processFile(fileDetail.path)
					return { path: fileDetail.path, result: result, error: undefined }
				} catch (e) {
					const error = e
					console.error(`[FileWatcher] Unhandled exception processing file ${fileDetail.path}:`, e)
					return { path: fileDetail.path, result: undefined, error: error }
				}
			})
			const settledChunkResults = await Promise.allSettled(chunkProcessingPromises)
			for (const settledResult of settledChunkResults) {
				let resultPath
				if (settledResult.status === "fulfilled") {
					const { path, result, error: directError } = settledResult.value
					resultPath = path
					if (directError) {
						batchResults.push({ path, status: "error", error: directError })
					} else if (result) {
						if (result.status === "skipped" || result.status === "local_error") {
							batchResults.push(result)
						} else if (result.status === "processed_for_batching" && result.pointsToUpsert) {
							pointsForBatchUpsert.push(...result.pointsToUpsert)
							if (result.path && result.newHash) {
								successfullyProcessedForUpsert.push({ path: result.path, newHash: result.newHash })
							} else if (result.path && !result.newHash) {
								successfullyProcessedForUpsert.push({ path: result.path })
							}
						} else {
							batchResults.push({
								path,
								status: "error",
								error: new Error(
									`Unexpected result status from processFile: ${result.status} for file ${path}`,
								),
							})
						}
					} else {
						batchResults.push({
							path,
							status: "error",
							error: new Error(`Fulfilled promise with no result or error for file ${path}`),
						})
					}
				} else {
					const error = settledResult.reason
					const rejectedPath = settledResult.reason?.path || "unknown"
					console.error("[FileWatcher] A file processing promise was rejected:", settledResult.reason)
					batchResults.push({
						path: rejectedPath,
						status: "error",
						error: error,
					})
				}
				if (!pathsToExplicitlyDelete.includes(resultPath || "")) {
					processedCountInBatch++
				}
				this._onBatchProgressUpdate.fire({
					processedInBatch: processedCountInBatch,
					totalInBatch: totalFilesInBatch,
					currentFile: resultPath,
				})
			}
		}
		return {
			pointsForBatchUpsert,
			successfullyProcessedForUpsert,
			processedCount: processedCountInBatch,
		}
	}
	async _executeBatchUpsertOperations(
		pointsForBatchUpsert,
		successfullyProcessedForUpsert,
		batchResults,
		overallBatchError,
	) {
		if (pointsForBatchUpsert.length > 0 && this.vectorStore && !overallBatchError) {
			try {
				for (let i = 0; i < pointsForBatchUpsert.length; i += this.batchSegmentThreshold) {
					const batch = pointsForBatchUpsert.slice(i, i + this.batchSegmentThreshold)
					let retryCount = 0
					let upsertError
					while (retryCount < constants_1.MAX_BATCH_RETRIES) {
						try {
							await this.vectorStore.upsertPoints(batch)
							break
						} catch (error) {
							upsertError = error
							retryCount++
							if (retryCount === constants_1.MAX_BATCH_RETRIES) {
								// Log telemetry for upsert failure
								telemetry_1.TelemetryService.instance.captureEvent(
									types_1.TelemetryEventName.CODE_INDEX_ERROR,
									{
										error: (0, validation_helpers_1.sanitizeErrorMessage)(upsertError.message),
										location: "upsertPoints",
										errorType: "upsert_retry_exhausted",
										retryCount: constants_1.MAX_BATCH_RETRIES,
									},
								)
								throw new Error(
									`Failed to upsert batch after ${constants_1.MAX_BATCH_RETRIES} retries: ${upsertError.message}`,
								)
							}
							await new Promise((resolve) =>
								setTimeout(resolve, constants_1.INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount - 1)),
							)
						}
					}
				}
				for (const { path, newHash } of successfullyProcessedForUpsert) {
					if (newHash) {
						this.cacheManager.updateHash(path, newHash)
					}
					batchResults.push({ path, status: "success" })
				}
			} catch (error) {
				const err = error
				overallBatchError = overallBatchError || err
				// Log telemetry for batch upsert error
				telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CODE_INDEX_ERROR, {
					error: (0, validation_helpers_1.sanitizeErrorMessage)(err.message),
					location: "executeBatchUpsertOperations",
					errorType: "batch_upsert_error",
					affectedFiles: successfullyProcessedForUpsert.length,
				})
				for (const { path } of successfullyProcessedForUpsert) {
					batchResults.push({ path, status: "error", error: err })
				}
			}
		} else if (overallBatchError && pointsForBatchUpsert.length > 0) {
			for (const { path } of successfullyProcessedForUpsert) {
				batchResults.push({ path, status: "error", error: overallBatchError })
			}
		}
		return overallBatchError
	}
	async processBatch(eventsToProcess) {
		const batchResults = []
		let processedCountInBatch = 0
		const totalFilesInBatch = eventsToProcess.size
		let overallBatchError
		// Initial progress update
		this._onBatchProgressUpdate.fire({
			processedInBatch: 0,
			totalInBatch: totalFilesInBatch,
			currentFile: undefined,
		})
		// Categorize events
		const pathsToExplicitlyDelete = []
		const filesToUpsertDetails = []
		for (const event of eventsToProcess.values()) {
			if (event.type === "delete") {
				pathsToExplicitlyDelete.push(event.uri.fsPath)
			} else {
				filesToUpsertDetails.push({
					path: event.uri.fsPath,
					uri: event.uri,
					originalType: event.type,
				})
			}
		}
		// Phase 1: Handle deletions
		const { overallBatchError: deletionError, processedCount: deletionCount } = await this._handleBatchDeletions(
			batchResults,
			processedCountInBatch,
			totalFilesInBatch,
			pathsToExplicitlyDelete,
			filesToUpsertDetails,
		)
		overallBatchError = deletionError
		processedCountInBatch = deletionCount
		// Phase 2: Process files and prepare upserts
		const {
			pointsForBatchUpsert,
			successfullyProcessedForUpsert,
			processedCount: upsertCount,
		} = await this._processFilesAndPrepareUpserts(
			filesToUpsertDetails,
			batchResults,
			processedCountInBatch,
			totalFilesInBatch,
			pathsToExplicitlyDelete,
		)
		processedCountInBatch = upsertCount
		// Phase 3: Execute batch upsert
		overallBatchError = await this._executeBatchUpsertOperations(
			pointsForBatchUpsert,
			successfullyProcessedForUpsert,
			batchResults,
			overallBatchError,
		)
		// Finalize
		this._onDidFinishBatchProcessing.fire({
			processedFiles: batchResults,
			batchError: overallBatchError,
		})
		this._onBatchProgressUpdate.fire({
			processedInBatch: totalFilesInBatch,
			totalInBatch: totalFilesInBatch,
		})
		if (this.accumulatedEvents.size === 0) {
			this._onBatchProgressUpdate.fire({
				processedInBatch: 0,
				totalInBatch: 0,
				currentFile: undefined,
			})
		}
	}
	/**
	 * Processes a file
	 * @param filePath Path to the file to process
	 * @returns Promise resolving to processing result
	 */
	async processFile(filePath) {
		try {
			// Check if file is in an ignored directory
			if ((0, ignore_utils_1.isPathInIgnoredDirectory)(filePath)) {
				return {
					path: filePath,
					status: "skipped",
					reason: "File is in an ignored directory",
				}
			}
			// Check if file should be ignored
			const relativeFilePath = (0, get_relative_path_1.generateRelativeFilePath)(filePath, this.workspacePath)
			if (
				!this.ignoreController.validateAccess(filePath) ||
				(this.ignoreInstance && this.ignoreInstance.ignores(relativeFilePath))
			) {
				return {
					path: filePath,
					status: "skipped",
					reason: "File is ignored by .kilocodeignore or .gitignore",
				}
			}
			// Check file size
			const fileStat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath))
			if (fileStat.size > constants_1.MAX_FILE_SIZE_BYTES) {
				return {
					path: filePath,
					status: "skipped",
					reason: "File is too large",
				}
			}
			// Read file content
			const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath))
			const content = fileContent.toString()
			// Calculate hash
			const newHash = (0, crypto_1.createHash)("sha256").update(content).digest("hex")
			// Check if file has changed
			if (this.cacheManager.getHash(filePath) === newHash) {
				return {
					path: filePath,
					status: "skipped",
					reason: "File has not changed",
				}
			}
			// Parse file
			const blocks = await parser_1.codeParser.parseFile(filePath, { content, fileHash: newHash })
			// Prepare points for batch processing
			let pointsToUpsert = []
			if (this.embedder && blocks.length > 0) {
				const texts = blocks.map((block) => block.content)
				const { embeddings } = await this.embedder.createEmbeddings(texts)
				pointsToUpsert = blocks.map((block, index) => {
					const normalizedAbsolutePath = (0, get_relative_path_1.generateNormalizedAbsolutePath)(
						block.file_path,
						this.workspacePath,
					)
					const stableName = `${normalizedAbsolutePath}:${block.start_line}`
					const pointId = (0, uuid_1.v5)(stableName, constants_1.QDRANT_CODE_BLOCK_NAMESPACE)
					return {
						id: pointId,
						vector: embeddings[index],
						payload: {
							filePath: (0, get_relative_path_1.generateRelativeFilePath)(
								normalizedAbsolutePath,
								this.workspacePath,
							),
							codeChunk: block.content,
							startLine: block.start_line,
							endLine: block.end_line,
						},
					}
				})
			}
			return {
				path: filePath,
				status: "processed_for_batching",
				newHash,
				pointsToUpsert,
			}
		} catch (error) {
			return {
				path: filePath,
				status: "local_error",
				error: error,
			}
		}
	}
}
exports.FileWatcher = FileWatcher
//# sourceMappingURL=file-watcher.js.map
