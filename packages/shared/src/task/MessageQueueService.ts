import { EventEmitter } from "events"
import { v4 as uuidv4 } from "uuid"

export interface QueuedMessage {
	timestamp: number
	id: string
	text: string
	images?: string[]
}

export interface MessageQueueState {
	messages: QueuedMessage[]
	isProcessing: boolean
	isPaused: boolean
}

export interface QueueEvents {
	stateChanged: [messages: QueuedMessage[]]
}

/**
 * MessageQueueService manages a queue of user messages that can interrupt
 * autonomous execution loops. When a user sends a new message while the task
 * is processing, it gets queued and processed with priority.
 */
export class MessageQueueService extends EventEmitter<QueueEvents> {
	private _messages: QueuedMessage[]

	constructor() {
		super()
		this._messages = []
	}

	private findMessage(id: string) {
		const index = this._messages.findIndex((msg) => msg.id === id)

		if (index === -1) {
			return { index, message: undefined }
		}

		return { index, message: this._messages[index] }
	}

	/**
	 * Add a new message to the queue
	 */
	public addMessage(text: string, images?: string[]): QueuedMessage | undefined {
		if (!text && !images?.length) {
			return undefined
		}

		const message: QueuedMessage = {
			timestamp: Date.now(),
			id: uuidv4(),
			text,
			images,
		}

		this._messages.push(message)
		this.emit("stateChanged", this._messages)

		return message
	}

	/**
	 * Remove a message from the queue by ID
	 */
	public removeMessage(id: string): boolean {
		const { index, message } = this.findMessage(id)

		if (!message) {
			return false
		}

		this._messages.splice(index, 1)
		this.emit("stateChanged", this._messages)
		return true
	}

	/**
	 * Update an existing message in the queue
	 */
	public updateMessage(id: string, text: string, images?: string[]): boolean {
		const { message } = this.findMessage(id)

		if (!message) {
			return false
		}

		message.timestamp = Date.now()
		message.text = text
		message.images = images
		this.emit("stateChanged", this._messages)
		return true
	}

	/**
	 * Dequeue the next message (FIFO)
	 */
	public dequeueMessage(): QueuedMessage | undefined {
		const message = this._messages.shift()
		this.emit("stateChanged", this._messages)
		return message
	}

	/**
	 * Get all queued messages
	 */
	public get messages(): QueuedMessage[] {
		return this._messages
	}

	/**
	 * Check if the queue is empty
	 */
	public isEmpty(): boolean {
		return this._messages.length === 0
	}

	/**
	 * Clear all messages and listeners
	 */
	public dispose(): void {
		this._messages = []
		this.removeAllListeners()
	}
}