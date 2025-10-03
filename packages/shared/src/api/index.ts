import { Anthropic } from "@anthropic-ai/sdk"
import type { ProviderSettings, ModelInfo } from "@roo-code/types"
import { ApiStream } from "./stream.js"

export interface ApiHandlerCreateMessageMetadata {
	mode?: string
	taskId: string
	previousResponseId?: string
	suppressPreviousResponseId?: boolean
	store?: boolean
}

export interface ApiHandler {
	createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): ApiStream

	getModel(): { id: string; info: ModelInfo }

	countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number>
}

export interface SingleCompletionHandler {
	completePrompt(prompt: string): Promise<string>
}

import { KilocodeOpenrouterHandler } from "./providers/kilocode-openrouter.js"

// Real buildApiHandler implementation
export function buildApiHandler(configuration: ProviderSettings): ApiHandler {
	const { apiProvider } = configuration
	
	switch (apiProvider) {
		case "kilocode":
		case "kilocode-openrouter":
			return new KilocodeOpenrouterHandler(configuration)
		default:
			throw new Error(`Provider ${apiProvider} not yet supported in shared package`)
	}
}

// Re-export stream types
export * from "./stream.js"