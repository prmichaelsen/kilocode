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
exports.ShadowCheckpointService = void 0
const promises_1 = __importDefault(require("fs/promises"))
const os_1 = __importDefault(require("os"))
const path = __importStar(require("path"))
const crypto_1 = __importDefault(require("crypto"))
const events_1 = __importDefault(require("events"))
const simple_git_1 = __importDefault(require("simple-git"))
const p_wait_for_1 = __importDefault(require("p-wait-for"))
const vscode = __importStar(require("vscode"))
const fs_1 = require("../../utils/fs")
const file_search_1 = require("../../services/search/file-search")
const i18n_1 = require("../../i18n")
const excludes_1 = require("./excludes")
// kilocode_change start
const telemetry_1 = require("@roo-code/telemetry")
const types_1 = require("@roo-code/types")
const errorUtils_1 = require("../../shared/kilocode/errorUtils")
function reportError(callsite, error) {
	telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CHECKPOINT_FAILURE, {
		callsite,
		error: (0, errorUtils_1.stringifyError)(error),
	})
}
const warningsShown = new Set()
function showWarning(message) {
	if (warningsShown.size < 5 && !warningsShown.has(message)) {
		vscode.window.showWarningMessage(message, (0, i18n_1.t)("kilocode:checkpoints.dismissWarning"))
		warningsShown.add(message)
	}
}
// kilocode_change end
class ShadowCheckpointService extends events_1.default {
	get baseHash() {
		return this._baseHash
	}
	set baseHash(value) {
		this._baseHash = value
	}
	get isInitialized() {
		return !!this.git
	}
	getCheckpoints() {
		return this._checkpoints.slice()
	}
	constructor(taskId, checkpointsDir, workspaceDir, log) {
		super()
		Object.defineProperty(this, "taskId", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "checkpointsDir", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "workspaceDir", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "_checkpoints", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: [],
		})
		Object.defineProperty(this, "_baseHash", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "dotGitDir", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "git", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "log", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "shadowGitConfigWorktree", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		const homedir = os_1.default.homedir()
		const desktopPath = path.join(homedir, "Desktop")
		const documentsPath = path.join(homedir, "Documents")
		const downloadsPath = path.join(homedir, "Downloads")
		const protectedPaths = [homedir, desktopPath, documentsPath, downloadsPath]
		if (protectedPaths.includes(workspaceDir)) {
			showWarning((0, i18n_1.t)("kilocode:checkpoints.protectedPaths", { workspaceDir })) // kilocode_change
			throw new Error(`Cannot use checkpoints in ${workspaceDir}`)
		}
		this.taskId = taskId
		this.checkpointsDir = checkpointsDir
		this.workspaceDir = workspaceDir
		this.dotGitDir = path.join(this.checkpointsDir, ".git")
		this.log = log
	}
	async initShadowGit(onInit) {
		if (this.git) {
			throw new Error("Shadow git repo already initialized")
		}
		const nestedGitPath = await this.getNestedGitRepository()
		if (nestedGitPath) {
			// Show persistent error message with the offending path
			const relativePath = path.relative(this.workspaceDir, nestedGitPath)
			showWarning((0, i18n_1.t)("kilocode:checkpoints.nestedGitRepos", { path: relativePath })) // kilocode_change
			throw new Error(
				`Checkpoints are disabled because a nested git repository was detected at: ${relativePath}. ` +
					"Please remove or relocate nested git repositories to use the checkpoints feature.",
			)
		}
		await promises_1.default.mkdir(this.checkpointsDir, { recursive: true })
		const git = (0, simple_git_1.default)(this.checkpointsDir)
		const gitVersion = await git.version()
		this.log(`[${this.constructor.name}#create] git = ${gitVersion}`)
		let created = false
		const startTime = Date.now()
		if (await (0, fs_1.fileExistsAtPath)(this.dotGitDir)) {
			this.log(`[${this.constructor.name}#initShadowGit] shadow git repo already exists at ${this.dotGitDir}`)
			const worktree = await this.getShadowGitConfigWorktree(git)
			if (worktree !== this.workspaceDir) {
				throw new Error(
					`Checkpoints can only be used in the original workspace: ${worktree} !== ${this.workspaceDir}`,
				)
			}
			await this.writeExcludeFile()
			this.baseHash = await git.revparse(["HEAD"])
		} else {
			this.log(`[${this.constructor.name}#initShadowGit] creating shadow git repo at ${this.checkpointsDir}`)
			await git.init()
			await git.addConfig("core.worktree", this.workspaceDir) // Sets the working tree to the current workspace.
			await git.addConfig("commit.gpgSign", "false") // Disable commit signing for shadow repo.
			await git.addConfig("user.name", "Kilo Code")
			await git.addConfig("user.email", "noreply@example.com")
			await this.writeExcludeFile()
			await this.stageAll(git)
			const { commit } = await git.commit("initial commit", { "--allow-empty": null })
			this.baseHash = commit
			created = true
		}
		const duration = Date.now() - startTime
		this.log(
			`[${this.constructor.name}#initShadowGit] initialized shadow repo with base commit ${this.baseHash} in ${duration}ms`,
		)
		this.git = git
		await onInit?.()
		this.emit("initialize", {
			type: "initialize",
			workspaceDir: this.workspaceDir,
			baseHash: this.baseHash,
			created,
			duration,
		})
		return { created, duration }
	}
	// Add basic excludes directly in git config, while respecting any
	// .gitignore in the workspace.
	// .git/info/exclude is local to the shadow git repo, so it's not
	// shared with the main repo - and won't conflict with user's
	// .gitignore.
	async writeExcludeFile() {
		await promises_1.default.mkdir(path.join(this.dotGitDir, "info"), { recursive: true })
		const patterns = await (0, excludes_1.getExcludePatterns)(this.workspaceDir)
		await promises_1.default.writeFile(path.join(this.dotGitDir, "info", "exclude"), patterns.join("\n"))
	}
	async stageAll(git) {
		try {
			await git.add(".")
		} catch (error) {
			this.log(
				`[${this.constructor.name}#stageAll] failed to add files to git: ${error instanceof Error ? error.message : String(error)}`,
			)
			reportError(`${this.constructor.name}#stageAll`, error) // kilocode_change
		}
	}
	async getNestedGitRepository() {
		try {
			// Find all .git/HEAD files that are not at the root level.
			const args = ["--files", "--hidden", "--follow", "-g", "**/.git/HEAD", this.workspaceDir]
			const gitPaths = await (0, file_search_1.executeRipgrep)({ args, workspacePath: this.workspaceDir })
			// Filter to only include nested git directories (not the root .git).
			// Since we're searching for HEAD files, we expect type to be "file"
			const nestedGitPaths = gitPaths.filter(({ type, path: filePath }) => {
				// Check if it's a file and is a nested .git/HEAD (not at root)
				if (type !== "file") return false
				// Ensure it's a .git/HEAD file and not the root one
				const normalizedPath = filePath.replace(/\\/g, "/")
				return (
					normalizedPath.includes(".git/HEAD") &&
					!normalizedPath.startsWith(".git/") &&
					normalizedPath !== ".git/HEAD"
				)
			})
			if (nestedGitPaths.length > 0) {
				// Get the first nested git repository path
				// Remove .git/HEAD from the path to get the repository directory
				const headPath = nestedGitPaths[0].path
				// Use path module to properly extract the repository directory
				// The HEAD file is at .git/HEAD, so we need to go up two directories
				const gitDir = path.dirname(headPath) // removes HEAD, gives us .git
				const repoDir = path.dirname(gitDir) // removes .git, gives us the repo directory
				const absolutePath = path.join(this.workspaceDir, repoDir)
				this.log(
					`[${this.constructor.name}#getNestedGitRepository] found ${nestedGitPaths.length} nested git repositories, first at: ${repoDir}`,
				)
				return absolutePath
			}
			return null
		} catch (error) {
			this.log(
				`[${this.constructor.name}#getNestedGitRepository] failed to check for nested git repos: ${error instanceof Error ? error.message : String(error)}`,
			)
			reportError(`${this.constructor.name}#hasNestedGitRepositories`, error) // kilocode_change
			// If we can't check, assume there are no nested repos to avoid blocking the feature.
			return null
		}
	}
	async getShadowGitConfigWorktree(git) {
		if (!this.shadowGitConfigWorktree) {
			try {
				this.shadowGitConfigWorktree = (await git.getConfig("core.worktree")).value || undefined
			} catch (error) {
				this.log(
					`[${this.constructor.name}#getShadowGitConfigWorktree] failed to get core.worktree: ${error instanceof Error ? error.message : String(error)}`,
				)
				reportError(`${this.constructor.name}#getShadowGitConfigWorktree`, error) // kilocode_change
			}
		}
		return this.shadowGitConfigWorktree
	}
	async saveCheckpoint(message, options) {
		try {
			this.log(
				`[${this.constructor.name}#saveCheckpoint] starting checkpoint save (allowEmpty: ${options?.allowEmpty ?? false})`,
			)
			if (!this.git) {
				throw new Error("Shadow git repo not initialized")
			}
			const startTime = Date.now()
			await this.stageAll(this.git)
			const commitArgs = options?.allowEmpty ? { "--allow-empty": null } : undefined
			const result = await this.git.commit(message, commitArgs)
			const fromHash = this._checkpoints[this._checkpoints.length - 1] ?? this.baseHash
			const toHash = result.commit || fromHash
			this._checkpoints.push(toHash)
			const duration = Date.now() - startTime
			if (result.commit) {
				this.emit("checkpoint", {
					type: "checkpoint",
					fromHash,
					toHash,
					duration,
					suppressMessage: options?.suppressMessage ?? false,
				})
			}
			if (result.commit) {
				this.log(
					`[${this.constructor.name}#saveCheckpoint] checkpoint saved in ${duration}ms -> ${result.commit}`,
				)
				return result
			} else {
				this.log(`[${this.constructor.name}#saveCheckpoint] found no changes to commit in ${duration}ms`)
				return undefined
			}
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e))
			this.log(`[${this.constructor.name}#saveCheckpoint] failed to create checkpoint: ${error.message}`)
			this.emit("error", { type: "error", error })
			throw error
		}
	}
	async restoreCheckpoint(commitHash) {
		try {
			this.log(`[${this.constructor.name}#restoreCheckpoint] starting checkpoint restore`)
			if (!this.git) {
				throw new Error("Shadow git repo not initialized")
			}
			const start = Date.now()
			await this.git.clean("f", ["-d", "-f"])
			await this.git.reset(["--hard", commitHash])
			// Remove all checkpoints after the specified commitHash.
			const checkpointIndex = this._checkpoints.indexOf(commitHash)
			if (checkpointIndex !== -1) {
				this._checkpoints = this._checkpoints.slice(0, checkpointIndex + 1)
			}
			const duration = Date.now() - start
			this.emit("restore", { type: "restore", commitHash, duration })
			this.log(`[${this.constructor.name}#restoreCheckpoint] restored checkpoint ${commitHash} in ${duration}ms`)
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e))
			this.log(`[${this.constructor.name}#restoreCheckpoint] failed to restore checkpoint: ${error.message}`)
			this.emit("error", { type: "error", error })
			throw error
		}
	}
	async getDiff({ from, to }) {
		if (!this.git) {
			throw new Error("Shadow git repo not initialized")
		}
		const result = []
		if (!from) {
			from = (await this.git.raw(["rev-list", "--max-parents=0", "HEAD"])).trim()
		}
		// Stage all changes so that untracked files appear in diff summary.
		await this.stageAll(this.git)
		this.log(`[${this.constructor.name}#getDiff] diffing ${to ? `${from}..${to}` : `${from}..HEAD`}`)
		const { files } = to ? await this.git.diffSummary([`${from}..${to}`]) : await this.git.diffSummary([from])
		const cwdPath = (await this.getShadowGitConfigWorktree(this.git)) || this.workspaceDir || ""
		for (const file of files) {
			const relPath = file.file
			const absPath = path.join(cwdPath, relPath)
			const before = await this.git.show([`${from}:${relPath}`]).catch((err) => {
				reportError(`[${this.constructor.name}#getDiff:git.show:before`, err) // kilocode_change
				return ""
			})
			const after = to
				? await this.git.show([`${to}:${relPath}`]).catch((err) => {
						reportError(`[${this.constructor.name}#getDiff:git.show:after`, err) // kilocode_change
						return ""
					})
				: await promises_1.default.readFile(absPath, "utf8").catch((err) => {
						reportError(`[${this.constructor.name}#getDiff:readFile`, err) // kilocode_change
						return ""
					})
			result.push({ paths: { relative: relPath, absolute: absPath }, content: { before, after } })
		}
		return result
	}
	/**
	 * EventEmitter
	 */
	emit(event, data) {
		return super.emit(event, data)
	}
	on(event, listener) {
		return super.on(event, listener)
	}
	off(event, listener) {
		return super.off(event, listener)
	}
	once(event, listener) {
		return super.once(event, listener)
	}
	/**
	 * Storage
	 */
	static hashWorkspaceDir(workspaceDir) {
		return crypto_1.default.createHash("sha256").update(workspaceDir).digest("hex").toString().slice(0, 8)
	}
	static taskRepoDir({ taskId, globalStorageDir }) {
		return path.join(globalStorageDir, "tasks", taskId, "checkpoints")
	}
	static workspaceRepoDir({ globalStorageDir, workspaceDir }) {
		return path.join(globalStorageDir, "checkpoints", this.hashWorkspaceDir(workspaceDir))
	}
	static async deleteTask({ taskId, globalStorageDir, workspaceDir }) {
		const workspaceRepoDir = this.workspaceRepoDir({ globalStorageDir, workspaceDir })
		const branchName = `roo-${taskId}`
		const git = (0, simple_git_1.default)(workspaceRepoDir)
		const success = await this.deleteBranch(git, branchName)
		if (success) {
			console.log(`[${this.name}#deleteTask.${taskId}] deleted branch ${branchName}`)
		} else {
			console.error(`[${this.name}#deleteTask.${taskId}] failed to delete branch ${branchName}`)
		}
	}
	static async deleteBranch(git, branchName) {
		const branches = await git.branchLocal()
		if (!branches.all.includes(branchName)) {
			console.error(`[${this.constructor.name}#deleteBranch] branch ${branchName} does not exist`)
			return false
		}
		const currentBranch = await git.revparse(["--abbrev-ref", "HEAD"])
		if (currentBranch === branchName) {
			const worktree = await git.getConfig("core.worktree")
			try {
				await git.raw(["config", "--unset", "core.worktree"])
				await git.reset(["--hard"])
				await git.clean("f", ["-d"])
				const defaultBranch = branches.all.includes("main") ? "main" : "master"
				await git.checkout([defaultBranch, "--force"])
				await (0, p_wait_for_1.default)(
					async () => {
						const newBranch = await git.revparse(["--abbrev-ref", "HEAD"])
						return newBranch === defaultBranch
					},
					{ interval: 500, timeout: 2000 },
				)
				await git.branch(["-D", branchName])
				return true
			} catch (error) {
				console.error(
					`[${this.constructor.name}#deleteBranch] failed to delete branch ${branchName}: ${error instanceof Error ? error.message : String(error)}`,
				)
				reportError(`${this.constructor.name}#deleteBranch`, error) // kilocode_change
				return false
			} finally {
				if (worktree.value) {
					await git.addConfig("core.worktree", worktree.value)
				}
			}
		} else {
			await git.branch(["-D", branchName])
			return true
		}
	}
}
exports.ShadowCheckpointService = ShadowCheckpointService
//# sourceMappingURL=ShadowCheckpointService.js.map
