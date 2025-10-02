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
exports.getCommitRangeForNewCompletion = getCommitRangeForNewCompletion
exports.seeNewChanges = seeNewChanges
const telemetry_1 = require("@roo-code/telemetry")
const __1 = require("..")
const DiffViewProvider_1 = require("../../../integrations/editor/DiffViewProvider")
const i18n_1 = require("../../../i18n")
const vscode = __importStar(require("vscode"))
function findLast(array, predicate) {
	let index = array.length - 1
	for (; index >= 0; index--) {
		if (predicate(array[index], index, array)) {
			break
		}
	}
	return index
}
async function getCommitRangeForNewCompletion(task) {
	try {
		const service = await (0, __1.getCheckpointService)(task)
		if (!service) {
			console.log("getCommitRangeForNewCompletion: no checkpoint service")
			return
		}
		const messages =
			task.clineMessages.at(-1)?.say === "completion_result"
				? task.clineMessages.slice(0, -1)
				: task.clineMessages
		const firstCompletionIndex = messages.findIndex((msg) => msg.type === "say" && msg.say === "completion_result")
		const firstCommit = messages
			.slice(0, firstCompletionIndex >= 0 ? firstCompletionIndex : messages.length)
			.find((msg) => msg.type === "say" && msg.say === "checkpoint_saved")?.text
		const previousCompletionIndex = findLast(
			messages,
			(msg) => msg.type === "say" && msg.say === "completion_result",
		)
		const lastCheckpointIndex = findLast(messages, (msg) => msg.type === "say" && msg.say === "checkpoint_saved")
		if (lastCheckpointIndex >= 0 && previousCompletionIndex >= 0 && lastCheckpointIndex < previousCompletionIndex) {
			console.log(
				`getCommitRangeForNewCompletion: last checkpoint ${lastCheckpointIndex} is older than previous completion ${previousCompletionIndex}.`,
			)
			return undefined
		}
		const previousCheckpointIndex =
			previousCompletionIndex >= 0
				? findLast(
						messages.slice(0, previousCompletionIndex),
						(msg) => msg.type === "say" && msg.say === "checkpoint_saved",
					)
				: -1
		const toCommit = lastCheckpointIndex >= 0 ? messages[lastCheckpointIndex].text : undefined
		const fromCommit = previousCheckpointIndex >= 0 ? messages[previousCheckpointIndex].text : firstCommit
		if (!toCommit || !fromCommit || fromCommit === toCommit) {
			console.log(`getCommitRangeForNewCompletion: invalid commit range '${fromCommit}' to '${toCommit}'.`)
			return undefined
		}
		const result = { to: toCommit, from: fromCommit }
		if ((await service.getDiff(result)).length === 0) {
			console.log(`getCommitRangeForNewCompletion: no changes in commit range '${fromCommit}' to '${toCommit}'.`)
			return undefined
		}
		return result
	} catch (err) {
		console.error("getCommitRangeForNewCompletion: exception", err)
		telemetry_1.TelemetryService.instance.captureException(err, { context: "getCommitRangeForNewCompletion" })
		return undefined
	}
}
async function seeNewChanges(task, commitRange) {
	try {
		const service = await (0, __1.getCheckpointService)(task)
		if (!service) {
			vscode.window.showWarningMessage((0, i18n_1.t)("kilocode:seeNewChanges.checkpointsUnavailable"))
			return
		}
		const changes = await service.getDiff(commitRange)
		if (changes.length === 0) {
			vscode.window.showWarningMessage((0, i18n_1.t)("kilocode:seeNewChanges.noChanges"))
			return
		}
		await vscode.commands.executeCommand(
			"vscode.changes",
			(0, i18n_1.t)("kilocode:seeNewChanges.title"),
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
		vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:seeNewChanges.error"))
		telemetry_1.TelemetryService.instance.captureException(err, { context: "seeNewChanges" })
		return undefined
	}
}
//# sourceMappingURL=seeNewChanges.js.map
