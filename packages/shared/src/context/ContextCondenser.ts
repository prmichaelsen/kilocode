import { ApiHandler } from "../api/index.js"

export interface CondensedContext {
	id: string
	summary: string
	originalMessageCount: number
	tokenEstimate: number
	timestamp: number
	messageRange: { start: number; end: number }
}

export interface ContextCondensationOptions {
	maxContextTokens: number
	summaryTokenRatio: number
	minMessagesBeforeCondensation: number
	preserveRecentMessages: number
	enableAutoCondensation: boolean
	condensationThreshold: number
}

export interface ContextCondensationResult {
	condensed: boolean
	originalTokens: number
	condensedTokens: number
	compressionRatio: number
	condensedHistory?: any[]
}

export class ContextCondenser {
	private options: ContextCondensationOptions
	private apiHandler: ApiHandler

	constructor(apiHandler: ApiHandler, options: Partial<ContextCondensationOptions> = {}) {
		this.apiHandler = apiHandler
		this.options = {
			maxContextTokens: 3 * 100000, // ~100k tokens context window
			summaryTokenRatio: 0.3, // Summaries should be 30% of original size
			minMessagesBeforeCondensation: 20,
			preserveRecentMessages: 10,
			enableAutoCondensation: true,
			condensationThreshold: 0.8, // Condense when 80% of max context reached
			...options
		}
	}

	/**
	 * Analyzes conversation history and determines if condensation is needed
	 */
	shouldCondenseContext(
		apiConversationHistory: any[],
		currentTokens: number
	): boolean {
		if (!this.options.enableAutoCondensation) {
			return false
		}

		const messageCount = apiConversationHistory.length
		const tokenUtilization = currentTokens / this.options.maxContextTokens

		return (
			messageCount >= this.options.minMessagesBeforeCondensation &&
			tokenUtilization >= this.options.condensationThreshold
		)
	}

	/**
	 * Condenses older conversation history using LLM summarization
	 */
	async condenseContext(
		apiConversationHistory: any[]
	): Promise<ContextCondensationResult> {
		const currentTokens = this.estimateTokenCount(apiConversationHistory)

		if (!this.shouldCondenseContext(apiConversationHistory, currentTokens)) {
			return {
				condensed: false,
				originalTokens: currentTokens,
				condensedTokens: currentTokens,
				compressionRatio: 1.0
			}
		}

		// Preserve recent messages
		const recentMessages = apiConversationHistory.slice(-this.options.preserveRecentMessages)
		const messagesToCondense = apiConversationHistory.slice(0, -this.options.preserveRecentMessages)

		if (messagesToCondense.length < 5) {
			return {
				condensed: false,
				originalTokens: currentTokens,
				condensedTokens: currentTokens,
				compressionRatio: 1.0
			}
		}

		// Use LLM to generate summary
		const summary = await this.generateLLMSummary(messagesToCondense)

		// Create condensed history with summary as system message
		const condensedHistory = [
			{
				role: 'system',
				content: summary.summary,
				ts: Date.now(),
				_condensed: true,
				_originalMessageCount: messagesToCondense.length,
				_messageRange: { start: 0, end: messagesToCondense.length - 1 }
			},
			...recentMessages
		]

		// Calculate compression metrics
		const originalTokens = this.estimateTokenCount(messagesToCondense)
		const condensedTokens = this.estimateTokenCount(condensedHistory)
		const compressionRatio = condensedTokens / currentTokens

		return {
			condensed: true,
			originalTokens: currentTokens,
			condensedTokens,
			compressionRatio,
			condensedHistory
		}
	}

	/**
	 * Uses the LLM to generate a concise summary of conversation history
	 */
	private async generateLLMSummary(
		messagesToCondense: any[]
	): Promise<CondensedContext> {
		const summaryId = `summary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

		// Prepare conversation for summarization
		const conversationText = this.formatConversationForSummarization(messagesToCondense)

		// Create summarization prompt
		const systemPrompt = `You are a conversation summarizer. Your task is to create a concise but comprehensive summary of the conversation history provided. Focus on:

1. Key decisions and actions taken
2. Files that were created, modified, or discussed
3. Tools that were used and their results
4. Important context that would be needed to continue the conversation
5. Any errors or issues encountered and how they were resolved

Format the summary in a clear, structured way that preserves essential context while being much shorter than the original conversation.`

		const userPrompt = `Please summarize the following conversation history concisely while preserving all essential context:

${conversationText}

Provide a structured summary that captures the key points, decisions, and context needed to continue this conversation effectively.`

		try {
			// Use the API handler to generate summary
			const stream = this.apiHandler.createMessage(
				systemPrompt,
				[{ role: 'user', content: userPrompt }],
				{ taskId: 'context-condensation', mode: 'code' }
			)

			let summaryContent = ''
			for await (const chunk of stream) {
				if (chunk.type === 'text') {
					summaryContent += chunk.text
				} else if (chunk.type === 'error') {
					throw new Error(`Summary generation failed: ${chunk.message}`)
				}
			}

			const tokenEstimate = this.estimateTokenCount([{
				role: 'system',
				content: summaryContent
			}])

			return {
				id: summaryId,
				summary: summaryContent,
				originalMessageCount: messagesToCondense.length,
				tokenEstimate,
				timestamp: Date.now(),
				messageRange: { start: 0, end: messagesToCondense.length - 1 }
			}
		} catch (error) {
			console.error('[ContextCondenser] Failed to generate LLM summary:', error)
			// Fallback to simple concatenation if LLM fails
			return {
				id: summaryId,
				summary: `[Context Summary - ${messagesToCondense.length} messages]\n\n${conversationText.slice(0, 2000)}...`,
				originalMessageCount: messagesToCondense.length,
				tokenEstimate: 500,
				timestamp: Date.now(),
				messageRange: { start: 0, end: messagesToCondense.length - 1 }
			}
		}
	}

	/**
	 * Formats conversation history for LLM summarization
	 */
	private formatConversationForSummarization(messages: any[]): string {
		return messages.map((msg, index) => {
			const role = msg.role || 'unknown'
			let content = ''

			if (typeof msg.content === 'string') {
				content = msg.content
			} else if (Array.isArray(msg.content)) {
				content = msg.content
					.map((c: any) => {
						if (typeof c === 'string') return c
						if (c.type === 'text') return c.text
						if (c.type === 'image') return '[Image]'
						return JSON.stringify(c)
					})
					.join('\n')
			}

			// Truncate very long messages
			if (content.length > 2000) {
				content = content.slice(0, 2000) + '...[truncated]'
			}

			return `[Message ${index + 1} - ${role}]\n${content}\n`
		}).join('\n---\n\n')
	}

	/**
	 * Estimates token count for messages (rough approximation)
	 */
	estimateTokenCount(messages: any[]): number {
		let totalTokens = 0

		for (const message of messages) {
			let content = ''

			if (typeof message.content === 'string') {
				content = message.content
			} else if (Array.isArray(message.content)) {
				content = message.content.map((c: any) => {
					if (typeof c === 'string') return c
					if (c.text) return c.text
					return ''
				}).join(' ')
			} else if (message.summary) {
				content = message.summary
			}

			// Rough token estimation: ~4 characters per token
			totalTokens += Math.ceil(content.length / 4)

			// Add tokens for message structure
			totalTokens += 10
		}

		return totalTokens
	}

	/**
	 * Updates condensation options
	 */
	updateOptions(newOptions: Partial<ContextCondensationOptions>): void {
		this.options = { ...this.options, ...newOptions }
	}

	/**
	 * Gets current condensation options
	 */
	getOptions(): ContextCondensationOptions {
		return { ...this.options }
	}
}