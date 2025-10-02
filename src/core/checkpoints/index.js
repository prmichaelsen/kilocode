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
exports.getCheckpointService = getCheckpointService
exports.checkpointSave = checkpointSave
exports.checkpointRestore = checkpointRestore
exports.checkpointDiff = checkpointDiff
const p_wait_for_1 = __importDefault(require("p-wait-for"))
const vscode = __importStar(require("vscode"))
const telemetry_1 = require("@roo-code/telemetry")
const path_1 = require("../../utils/path")
const git_1 = require("../../utils/git")
const i18n_1 = require("../../i18n")
const getApiMetrics_1 = require("../../shared/getApiMetrics")
const DiffViewProvider_1 = require("../../integrations/editor/DiffViewProvider")
const checkpoints_1 = require("../../services/checkpoints")
// kilocode_change start
const types_1 = require("@roo-code/types")
const errorUtils_1 = require("../../shared/kilocode/errorUtils")
function reportError(callsite, error) {
	telemetry_1.TelemetryService.instance.captureEvent(types_1.TelemetryEventName.CHECKPOINT_FAILURE, {
		callsite,
		error: (0, errorUtils_1.stringifyError)(error),
	})
}
// kilocode_change end
async function getCheckpointService(task, { interval = 250, timeout = 15000 } = {}) {
	if (!task.enableCheckpoints) {
		return undefined
	}
	if (task.checkpointService) {
		return task.checkpointService
	}
	const provider = task.providerRef.deref()
	const log = (message) => {
		console.log(message)
		try {
			provider?.log(message)
		} catch (err) {
			// NO-OP
		}
	}
	console.log("[Task#getCheckpointService] initializing checkpoints service")
	try {
		const workspaceDir = task.cwd || (0, path_1.getWorkspacePath)()
		if (!workspaceDir) {
			log("[Task#getCheckpointService] workspace folder not found, disabling checkpoints")
			task.enableCheckpoints = false
			return undefined
		}
		const globalStorageDir = provider?.context.globalStorageUri.fsPath
		if (!globalStorageDir) {
			log("[Task#getCheckpointService] globalStorageDir not found, disabling checkpoints")
			task.enableCheckpoints = false
			return undefined
		}
		const options = {
			taskId: task.taskId,
			workspaceDir,
			shadowDir: globalStorageDir,
			log,
		}
		if (task.checkpointServiceInitializing) {
			await (0, p_wait_for_1.default)(
				() => {
					console.log("[Task#getCheckpointService] waiting for service to initialize")
					return !!task.checkpointService && !!task?.checkpointService?.isInitialized
				},
				{ interval, timeout },
			)
			if (!task?.checkpointService) {
				task.enableCheckpoints = false
				return undefined
			}
			return task.checkpointService
		}
		if (!task.enableCheckpoints) {
			return undefined
		}
		const service = checkpoints_1.RepoPerTaskCheckpointService.create(options)
		task.checkpointServiceInitializing = true
		await checkGitInstallation(task, service, log, provider)
		task.checkpointService = service
		return service
	} catch (err) {
		log(`[Task#getCheckpointService] ${err.message}`)
		task.enableCheckpoints = false
		reportError("Task#getCheckpointService", err) // kilocode_change
		task.checkpointServiceInitializing = false
		return undefined
	}
}
async function checkGitInstallation(task, service, log, provider) {
	try {
		const gitInstalled = await (0, git_1.checkGitInstalled)()
		if (!gitInstalled) {
			log("[Task#getCheckpointService] Git is not installed, disabling checkpoints")
			task.enableCheckpoints = false
			task.checkpointServiceInitializing = false
			// Show user-friendly notification
			const selection = await vscode.window.showWarningMessage(
				(0, i18n_1.t)("common:errors.git_not_installed"),
				(0, i18n_1.t)("common:buttons.learn_more"),
			)
			if (selection === (0, i18n_1.t)("common:buttons.learn_more")) {
				await vscode.env.openExternal(vscode.Uri.parse("https://git-scm.com/downloads"))
			}
			return
		}
		// Git is installed, proceed with initialization
		service.on("initialize", () => {
			log("[Task#getCheckpointService] service initialized")
			task.checkpointServiceInitializing = false
		})
		service.on("checkpoint", ({ fromHash: from, toHash: to, suppressMessage }) => {
			try {
				// Always update the current checkpoint hash in the webview, including the suppress flag
				provider?.postMessageToWebview({
					type: "currentCheckpointUpdated",
					text: to,
					suppressMessage: !!suppressMessage,
				})
				// Always create the chat message but include the suppress flag in the payload
				// so the chatview can choose not to render it while keeping it in history.
				task.say(
					"checkpoint_saved",
					to,
					undefined,
					undefined,
					{ from, to, suppressMessage: !!suppressMessage },
					undefined,
					{ isNonInteractive: true },
				).catch((err) => {
					log("[Task#getCheckpointService] caught unexpected error in say('checkpoint_saved')")
					console.error(err)
					reportError("getCheckpointService:say('checkpoint_saved')", err) // kilocode_change
				})
			} catch (err) {
				log("[Task#getCheckpointService] caught unexpected error in on('checkpoint'), disabling checkpoints")
				console.error(err)
				task.enableCheckpoints = false
				reportError("getCheckpointService:on('checkpoint')", err) // kilocode_change
			}
		})
		log("[Task#getCheckpointService] initializing shadow git")
		try {
			await service.initShadowGit()
		} catch (err) {
			log(`[Task#getCheckpointService] initShadowGit -> ${err.message}`)
			task.enableCheckpoints = false
			reportError("getCheckpointService:initShadowGit", err) // kilocode_change
		}
	} catch (err) {
		log(`[Task#getCheckpointService] Unexpected error during Git check: ${err.message}`)
		console.error("Git check error:", err)
		task.enableCheckpoints = false
		task.checkpointServiceInitializing = false
		reportError("getCheckpointService", err) // kilocode_change
	}
}
async function checkpointSave(task, force = false, suppressMessage = false) {
	const service = await getCheckpointService(task)
	if (!service) {
		return
	}
	telemetry_1.TelemetryService.instance.captureCheckpointCreated(task.taskId)
	// Start the checkpoint process in the background.
	return service
		.saveCheckpoint(`Task: ${task.taskId}, Time: ${Date.now()}`, { allowEmpty: force, suppressMessage })
		.catch((err) => {
			console.error("[Task#checkpointSave] caught unexpected error, disabling checkpoints", err)
			task.enableCheckpoints = false
			reportError("checkpointSave", err) // kilocode_change
		})
}
async function checkpointRestore(task, { ts, commitHash, mode, operation = "delete" }) {
	const service = await getCheckpointService(task)
	if (!service) {
		return
	}
	const index = task.clineMessages.findIndex((m) => m.ts === ts)
	if (index === -1) {
		return
	}
	const provider = task.providerRef.deref()
	try {
		await service.restoreCheckpoint(commitHash)
		telemetry_1.TelemetryService.instance.captureCheckpointRestored(task.taskId)
		await provider?.postMessageToWebview({ type: "currentCheckpointUpdated", text: commitHash })
		if (mode === "restore") {
			await task.overwriteApiConversationHistory(task.apiConversationHistory.filter((m) => !m.ts || m.ts < ts))
			const deletedMessages = task.clineMessages.slice(index + 1)
			const { totalTokensIn, totalTokensOut, totalCacheWrites, totalCacheReads, totalCost } = (0,
			getApiMetrics_1.getApiMetrics)(task.combineMessages(deletedMessages))
			// For delete operations, exclude the checkpoint message itself
			// For edit operations, include the checkpoint message (to be edited)
			const endIndex = operation === "edit" ? index + 1 : index
			await task.overwriteClineMessages(task.clineMessages.slice(0, endIndex))
			// TODO: Verify that this is working as expected.
			await task.say(
				"api_req_deleted",
				JSON.stringify({
					tokensIn: totalTokensIn,
					tokensOut: totalTokensOut,
					cacheWrites: totalCacheWrites,
					cacheReads: totalCacheReads,
					cost: totalCost,
				}),
			)
		}
		// The task is already cancelled by the provider beforehand, but we
		// need to re-init to get the updated messages.
		//
		// This was taken from Cline's implementation of the checkpoints
		// feature. The task instance will hang if we don't cancel twice,
		// so this is currently necessary, but it seems like a complicated
		// and hacky solution to a problem that I don't fully understand.
		// I'd like to revisit this in the future and try to improve the
		// task flow and the communication between the webview and the
		// `Task` instance.
		provider?.cancelTask()
	} catch (err) {
		provider?.log("[checkpointRestore] disabling checkpoints for this task")
		task.enableCheckpoints = false
		reportError("checkpointRestore", err) // kilocode_change
	}
}
async function checkpointDiff(task, { ts, previousCommitHash, commitHash, mode }) {
	const service = await getCheckpointService(task)
	if (!service) {
		return
	}
	telemetry_1.TelemetryService.instance.captureCheckpointDiffed(task.taskId)
	let prevHash = commitHash
	let nextHash = undefined
	if (mode !== "full") {
		const checkpoints = task.clineMessages.filter(({ say }) => say === "checkpoint_saved").map(({ text }) => text)
		const idx = checkpoints.indexOf(commitHash)
		if (idx !== -1 && idx < checkpoints.length - 1) {
			nextHash = checkpoints[idx + 1]
		} else {
			nextHash = undefined
		}
	}
	try {
		const changes = await service.getDiff({ from: prevHash, to: nextHash })
		if (!changes?.length) {
			vscode.window.showInformationMessage("No changes found.")
			return
		}
		await vscode.commands.executeCommand(
			"vscode.changes",
			mode === "full" ? "Changes since task started" : "Changes compare with next checkpoint",
			changes.map((change) => [
				vscode.Uri.file(change.paths.absolute),
				vscode.Uri.parse(`${DiffViewProvider_1.DIFF_VIEW_URI_SCHEME}:${change.paths.relative}`).with({
					query: Buffer.from(change.content.before ?? "").toString("base64"),
				}),
				vscode.Uri.parse(`${DiffViewProvider_1.DIFF_VIEW_URI_SCHEME}:${change.paths.relative}`).with({
					query: Buffer.from(change.content.after ?? "").toString("base64"),
				}),
			]),
		)
	} catch (err) {
		const provider = task.providerRef.deref()
		provider?.log("[checkpointDiff] disabling checkpoints for this task")
		task.enableCheckpoints = false
		reportError("checkpointDiff", err) // kilocode_change
	}
}
//# sourceMappingURL=index.js.map
