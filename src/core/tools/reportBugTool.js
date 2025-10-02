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
exports.reportBugTool = reportBugTool
const checkpoints_1 = require("../checkpoints")
const github_url_utils_1 = require("../../utils/github-url-utils")
const responses_1 = require("../prompts/responses")
const vscode = __importStar(require("vscode"))
const os = __importStar(require("os"))
async function reportBugTool(cline, block, askApproval, handleError, pushToolResult, removeClosingTag) {
	const title = block.params.title
	const description = block.params.description
	try {
		if (block.partial) {
			await cline
				.ask(
					"report_bug",
					JSON.stringify({
						title: removeClosingTag("title", title),
						description: removeClosingTag("description", description),
					}),
					block.partial,
				)
				.catch(() => {})
			return
		} else {
			if (!title) {
				cline.consecutiveMistakeCount++
				pushToolResult(await cline.sayAndCreateMissingParamError("report_bug", "title"))
				await (0, checkpoints_1.checkpointSave)(cline)
				return
			}
			if (!description) {
				cline.consecutiveMistakeCount++
				pushToolResult(await cline.sayAndCreateMissingParamError("report_bug", "description"))
				await (0, checkpoints_1.checkpointSave)(cline)
				return
			}
			cline.consecutiveMistakeCount = 0
			// Derive system information values algorithmically
			const operatingSystem = os.platform() + " " + os.release()
			const kilocodeVersion =
				vscode.extensions.getExtension("kilocode.kilo-code")?.packageJSON.version || "Unknown"
			const systemInfo = `VSCode: ${vscode.version}, Node.js: ${process.version}, Architecture: ${os.arch()}`
			const providerAndModel = `${await cline.providerRef.deref()?.contextProxy.getGlobalState("apiProvider")} / ${cline.api.getModel().id}`
			// Ask user for confirmation
			const bugReportData = JSON.stringify({
				title,
				description,
				// Include derived values in the JSON for display purposes
				provider_and_model: providerAndModel,
				operating_system: operatingSystem,
				system_info: systemInfo,
				kilocode_version: kilocodeVersion,
			})
			const { text, images } = await cline.ask("report_bug", bugReportData, false)
			// If the user provided a response, treat it as feedback
			if (text || images?.length) {
				await cline.say("user_feedback", text ?? "", images)
				pushToolResult(
					responses_1.formatResponse.toolResult(
						`The user provided feedback on the Github issue generated:\n<feedback>\n${text}\n</feedback>`,
						images,
					),
				)
			} else {
				// If no response, the user accepted the condensed version
				pushToolResult(
					responses_1.formatResponse.toolResult(`The user accepted the creation of the Github issue.`),
				)
				try {
					// Create a Map of parameters for the GitHub issue
					const params = new Map()
					params.set("title", title)
					params.set(
						"description",
						`${description}\n\n**System Information:**\n- Provider & Model: ${providerAndModel}\n- Operating System: ${operatingSystem}\n- Kilo Code Version: ${kilocodeVersion}\n- ${systemInfo}`,
					)
					// Use our utility function to create and open the GitHub issue URL
					// This bypasses VS Code's URI handling issues with special characters
					await (0, github_url_utils_1.createAndOpenGitHubIssue)(
						"Kilo-Org",
						"kilocode",
						"bug_report.yml",
						params,
					)
				} catch (error) {
					console.error(`An error occurred while attempting to report the bug: ${error}`)
				}
			}
			await (0, checkpoints_1.checkpointSave)(cline)
			return
		}
	} catch (error) {
		await handleError("reporting bug", error)
		await (0, checkpoints_1.checkpointSave)(cline)
		return
	}
}
//# sourceMappingURL=reportBugTool.js.map
