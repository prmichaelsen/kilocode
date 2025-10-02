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
exports.editMessageHandler = exports.fetchKilocodeNotificationsHandler = void 0
const vscode = __importStar(require("vscode"))
const p_wait_for_1 = __importDefault(require("p-wait-for"))
const i18n_1 = require("../../../i18n")
const axios_1 = __importDefault(require("axios"))
const token_1 = require("../../../shared/kilocode/token")
// Helper function to delete messages for resending
const deleteMessagesForResend = async (cline, originalMessageIndex, originalMessageTs) => {
	// Delete UI messages after the edited message
	const newClineMessages = cline.clineMessages.slice(0, originalMessageIndex)
	await cline.overwriteClineMessages(newClineMessages)
	// Delete API messages after the edited message
	const apiHistory = [...cline.apiConversationHistory]
	const timeCutoff = originalMessageTs - 1000
	const apiHistoryIndex = apiHistory.findIndex((entry) => entry.ts && entry.ts >= timeCutoff)
	if (apiHistoryIndex !== -1) {
		const newApiHistory = apiHistory.slice(0, apiHistoryIndex)
		await cline.overwriteApiConversationHistory(newApiHistory)
	}
}
// Helper function to encapsulate the common sequence of actions for resending a message
const resendMessageSequence = async (
	provider,
	taskId,
	originalMessageIndex,
	originalMessageTimestamp,
	editedText,
	images,
) => {
	// 1. Get the current cline instance before deletion
	const currentCline = provider.getCurrentTask()
	if (!currentCline || currentCline.taskId !== taskId) {
		provider.log(`[Edit Message] Error: Could not get current cline instance before deletion for task ${taskId}.`)
		vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:userFeedback.message_update_failed"))
		return false
	}
	// 2. Delete messages using the helper
	await deleteMessagesForResend(currentCline, originalMessageIndex, originalMessageTimestamp)
	await provider.postStateToWebview()
	// 3. Re-initialize Cline with the history item (which now reflects the deleted messages)
	const { historyItem } = await provider.getTaskWithId(taskId)
	if (!historyItem) {
		provider.log(`[Edit Message] Error: Failed to retrieve history item for task ${taskId}.`)
		vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:userFeedback.message_update_failed"))
		return false
	}
	const newCline = await provider.createTaskWithHistoryItem(historyItem)
	if (!newCline) {
		provider.log(
			`[Edit Message] Error: Failed to re-initialize Cline with updated history item for task ${taskId}.`,
		)
		vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:userFeedback.message_update_failed"))
		return false
	}
	// 4. Send the edited message using the newly initialized Cline instance
	await new Promise((resolve) => setTimeout(resolve, 100)) // Add delay to mitigate race condition
	await newCline.handleWebviewAskResponse("messageResponse", editedText, images)
	return true
}
const fetchKilocodeNotificationsHandler = async (provider) => {
	try {
		const { apiConfiguration } = await provider.getState()
		const kilocodeToken = apiConfiguration?.kilocodeToken
		if (!kilocodeToken || apiConfiguration?.apiProvider !== "kilocode") {
			provider.postMessageToWebview({
				type: "kilocodeNotificationsResponse",
				notifications: [],
			})
			return
		}
		const headers = {
			Authorization: `Bearer ${kilocodeToken}`,
			"Content-Type": "application/json",
		}
		// Add X-KILOCODE-TESTER: SUPPRESS header if the setting is enabled
		if (
			apiConfiguration.kilocodeTesterWarningsDisabledUntil &&
			apiConfiguration.kilocodeTesterWarningsDisabledUntil > Date.now()
		) {
			headers["X-KILOCODE-TESTER"] = "SUPPRESS"
		}
		const response = await axios_1.default.get(
			`${(0, token_1.getKiloBaseUriFromToken)(kilocodeToken)}/api/users/notifications`,
			{
				headers,
				timeout: 5000,
			},
		)
		provider.postMessageToWebview({
			type: "kilocodeNotificationsResponse",
			notifications: response.data?.notifications || [],
		})
	} catch (error) {
		provider.log(`Error fetching Kilocode notifications: ${error.message}`)
		provider.postMessageToWebview({
			type: "kilocodeNotificationsResponse",
			notifications: [],
		})
	}
}
exports.fetchKilocodeNotificationsHandler = fetchKilocodeNotificationsHandler
const editMessageHandler = async (provider, message) => {
	if (!message.values?.ts || !message.values?.text) {
		return
	}
	const timestamp = message.values.ts
	const newText = message.values.text
	const revert = message.values.revert || false
	const images = message.values.images
	const currentCline = provider.getCurrentTask()
	if (!currentCline) {
		provider.log("[Edit Message] Error: No active Cline instance found.")
		return
	}
	try {
		// Find message by timestamp
		const messageIndex = currentCline.clineMessages.findIndex((msg) => msg.ts && msg.ts === timestamp)
		if (messageIndex === -1) {
			provider.log(`[Edit Message] Error: Message with timestamp ${timestamp} not found.`)
			return
		}
		if (revert) {
			// Find the most recent checkpoint before this message
			const checkpointMessage = currentCline.clineMessages
				.filter((msg) => msg.say === "checkpoint_saved")
				.filter((msg) => msg.ts && msg.ts <= timestamp)
				.sort((a, b) => (b.ts || 0) - (a.ts || 0))[0]
			if (checkpointMessage && checkpointMessage.text) {
				// Restore git shadow
				await provider.cancelTask()
				try {
					await (0, p_wait_for_1.default)(() => currentCline.isInitialized === true, { timeout: 3000 })
				} catch (error) {
					vscode.window.showErrorMessage((0, i18n_1.t)("common:errors.checkpoint_timeout"))
				}
				try {
					await currentCline.checkpointRestore({
						commitHash: checkpointMessage.text,
						ts: checkpointMessage.ts,
						mode: "preview",
					})
				} catch (error) {
					vscode.window.showErrorMessage((0, i18n_1.t)("common:errors.checkpoint_failed"))
				}
				// Add delay to mitigate race condition
				await new Promise((resolve) => setTimeout(resolve, 500))
			} else {
				// No checkpoint found before this message
				provider.log(`[Edit Message] No checkpoint found before message timestamp ${timestamp}.`)
				vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:userFeedback.no_checkpoint_found"))
			}
		}
		// Update the message text in the UI
		const updatedMessages = [...currentCline.clineMessages]
		updatedMessages[messageIndex] = {
			...updatedMessages[messageIndex],
			text: newText,
		}
		await currentCline.overwriteClineMessages(updatedMessages)
		// Regular edit without revert - use the resend sequence
		provider.log(`[Edit Message] Performing regular edit without revert for message at timestamp ${timestamp}.`)
		const success = await resendMessageSequence(
			provider,
			currentCline.taskId,
			messageIndex,
			timestamp,
			newText,
			images,
		)
		if (success) {
			vscode.window.showInformationMessage((0, i18n_1.t)("kilocode:userFeedback.message_updated"))
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error)
		provider.log(`[Edit Message] Error handling editMessage: ${errorMessage}`)
		vscode.window.showErrorMessage((0, i18n_1.t)("kilocode:userFeedback.message_update_failed"))
	}
	return
}
exports.editMessageHandler = editMessageHandler
//# sourceMappingURL=webviewMessageHandlerUtils.js.map
