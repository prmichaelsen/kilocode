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
exports.HumanRelayHandler = void 0
const vscode = __importStar(require("vscode"))
const commands_1 = require("../../utils/commands")
/**
 * Human Relay API processor
 * This processor does not directly call the API, but interacts with the model through human operations copy and paste.
 */
class HumanRelayHandler {
	countTokens(_content) {
		return Promise.resolve(0)
	}
	/**
	 * Create a message processing flow, display a dialog box to request human assistance
	 * @param systemPrompt System prompt words
	 * @param messages Message list
	 * @param metadata Optional metadata
	 */
	async *createMessage(systemPrompt, messages, metadata) {
		// Get the most recent user message
		const latestMessage = messages[messages.length - 1]
		if (!latestMessage) {
			throw new Error("No message to relay")
		}
		// If it is the first message, splice the system prompt word with the user message
		let promptText = ""
		if (messages.length === 1) {
			promptText = `${systemPrompt}\n\n${getMessageContent(latestMessage)}`
		} else {
			promptText = getMessageContent(latestMessage)
		}
		// Copy to clipboard
		await vscode.env.clipboard.writeText(promptText)
		// A dialog box pops up to request user action
		const response = await showHumanRelayDialog(promptText)
		if (!response) {
			// The user canceled the operation
			throw new Error("Human relay operation cancelled")
		}
		// Return to the user input reply
		yield { type: "text", text: response }
	}
	/**
	 * Get model information
	 */
	getModel() {
		// Human relay does not depend on a specific model, here is a default configuration
		return {
			id: "human-relay",
			info: {
				maxTokens: 16384,
				contextWindow: 100000,
				supportsImages: true,
				supportsPromptCache: false,
				supportsComputerUse: true,
				inputPrice: 0,
				outputPrice: 0,
				description: "Calling web-side AI model through human relay",
			},
		}
	}
	/**
	 * Implementation of a single prompt
	 * @param prompt Prompt content
	 */
	async completePrompt(prompt) {
		// Copy to clipboard
		await vscode.env.clipboard.writeText(prompt)
		// A dialog box pops up to request user action
		const response = await showHumanRelayDialog(prompt)
		if (!response) {
			throw new Error("Human relay operation cancelled")
		}
		return response
	}
}
exports.HumanRelayHandler = HumanRelayHandler
/**
 * Extract text content from message object
 * @param message
 */
function getMessageContent(message) {
	if (typeof message.content === "string") {
		return message.content
	} else if (Array.isArray(message.content)) {
		return message.content
			.filter((item) => item.type === "text")
			.map((item) => (item.type === "text" ? item.text : ""))
			.join("\n")
	}
	return ""
}
/**
 * Displays the human relay dialog and waits for user response.
 * @param promptText The prompt text that needs to be copied.
 * @returns The user's input response or undefined (if canceled).
 */
async function showHumanRelayDialog(promptText) {
	return new Promise((resolve) => {
		// Create a unique request ID.
		const requestId = Date.now().toString()
		// Register a global callback function.
		vscode.commands.executeCommand(
			(0, commands_1.getCommand)("registerHumanRelayCallback"),
			requestId,
			(response) => resolve(response),
		)
		// Open the dialog box directly using the current panel.
		vscode.commands.executeCommand((0, commands_1.getCommand)("showHumanRelayDialog"), { requestId, promptText })
	})
}
//# sourceMappingURL=human-relay.js.map
