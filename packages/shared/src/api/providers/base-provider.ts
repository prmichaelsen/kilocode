import { Anthropic } from "@anthropic-ai/sdk"
import type { ApiHandler, ApiHandlerCreateMessageMetadata } from "../index.js"
import type { ApiStream } from "../stream.js"

export interface ApiHandlerOptions {
	// Common options
	apiModelId?: string
	apiKey?: string
	
	// KiloCode specific
	kilocodeToken?: string
	kilocodeModel?: string
	kilocodeOrganizationId?: string
	kilocodeTesterWarningsDisabledUntil?: number
	
	// OpenRouter specific
	openRouterApiKey?: string
	openRouterBaseUrl?: string
	openRouterModelId?: string
	openRouterSpecificProvider?: string
	openRouterUseMiddleOutTransform?: boolean
	openRouterProviderDataCollection?: "allow" | "deny"
	openRouterProviderSort?: "price" | "throughput" | "latency"
	
	// Model parameters
	maxTokens?: number
	temperature?: number
	topP?: number
}

export abstract class BaseProvider implements ApiHandler {
	abstract createMessage(
		systemPrompt: string,
		messages: Anthropic.Messages.MessageParam[],
		metadata?: ApiHandlerCreateMessageMetadata,
	): ApiStream

	abstract getModel(): { id: string; info: any }

	async countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number> {
		// Simple token estimation - can be overridden by providers
		const text = content.map(block => 
			block.type === "text" ? block.text : ""
		).join(" ")
		return Math.ceil(text.length / 4) // Rough estimate: 4 chars per token
	}
}