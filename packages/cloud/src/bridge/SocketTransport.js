"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.SocketTransport = void 0
const socket_io_client_1 = require("socket.io-client")
const types_1 = require("@roo-code/types")
/**
 * Manages the WebSocket transport layer for the bridge system.
 * Handles connection lifecycle, retries, and reconnection logic.
 */
class SocketTransport {
	constructor(options, retryConfig) {
		Object.defineProperty(this, "socket", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "connectionState", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: types_1.ConnectionState.DISCONNECTED,
		})
		Object.defineProperty(this, "retryTimeout", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "isPreviouslyConnected", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: false,
		})
		Object.defineProperty(this, "retryConfig", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: {
				maxInitialAttempts: Infinity,
				initialDelay: 1000,
				maxDelay: 15000,
				backoffMultiplier: 2,
			},
		})
		Object.defineProperty(this, "CONNECTION_TIMEOUT", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: 2000,
		})
		Object.defineProperty(this, "options", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.options = options
		if (retryConfig) {
			this.retryConfig = { ...this.retryConfig, ...retryConfig }
		}
	}
	// This is the initial connnect attempt. We need to implement our own
	// infinite retry mechanism since Socket.io's automatic reconnection only
	// kicks in after a successful initial connection.
	async connect() {
		if (this.connectionState === types_1.ConnectionState.CONNECTED) {
			console.log(`[SocketTransport#connect] Already connected`)
			return
		}
		if (
			this.connectionState === types_1.ConnectionState.CONNECTING ||
			this.connectionState === types_1.ConnectionState.RETRYING
		) {
			console.log(`[SocketTransport#connect] Already in progress`)
			return
		}
		let attempt = 0
		let delay = this.retryConfig.initialDelay
		while (attempt < this.retryConfig.maxInitialAttempts) {
			console.log(`[SocketTransport#connect] attempt = ${attempt + 1}, delay = ${delay}ms`)
			this.connectionState = attempt === 0 ? types_1.ConnectionState.CONNECTING : types_1.ConnectionState.RETRYING
			try {
				await this._connect()
				break
			} catch (_error) {
				attempt++
				if (this.socket) {
					this.socket.disconnect()
					this.socket = null
				}
				const promise = new Promise((resolve) => {
					this.retryTimeout = setTimeout(resolve, delay)
				})
				await promise
				delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelay)
			}
		}
		if (this.retryTimeout) {
			clearTimeout(this.retryTimeout)
			this.retryTimeout = null
		}
		if (this.socket?.connected) {
			console.log(`[SocketTransport#connect] connected - ${this.options.url}`)
		} else {
			// Since we have infinite retries this should never happen.
			this.connectionState = types_1.ConnectionState.FAILED
			console.error(`[SocketTransport#connect] Giving up`)
		}
	}
	async _connect() {
		return new Promise((resolve, reject) => {
			this.socket = (0, socket_io_client_1.io)(this.options.url, this.options.socketOptions)
			let connectionTimeout = setTimeout(() => {
				console.error(`[SocketTransport#_connect] failed to connect after ${this.CONNECTION_TIMEOUT}ms`)
				if (this.connectionState !== types_1.ConnectionState.CONNECTED) {
					this.socket?.disconnect()
					reject(new Error("Connection timeout"))
				}
			}, this.CONNECTION_TIMEOUT)
			// https://socket.io/docs/v4/client-api/#event-connect
			this.socket.on("connect", async () => {
				console.log(
					`[SocketTransport#_connect] on(connect): isPreviouslyConnected = ${this.isPreviouslyConnected}`,
				)
				if (connectionTimeout) {
					clearTimeout(connectionTimeout)
					connectionTimeout = null
				}
				this.connectionState = types_1.ConnectionState.CONNECTED
				if (this.isPreviouslyConnected) {
					if (this.options.onReconnect) {
						await this.options.onReconnect()
					}
				} else {
					if (this.options.onConnect) {
						await this.options.onConnect()
					}
				}
				this.isPreviouslyConnected = true
				resolve()
			})
			// https://socket.io/docs/v4/client-api/#event-connect_error
			this.socket.on("connect_error", (error) => {
				if (connectionTimeout && this.connectionState !== types_1.ConnectionState.CONNECTED) {
					console.error(`[SocketTransport] on(connect_error): ${error.message}`)
					clearTimeout(connectionTimeout)
					connectionTimeout = null
					reject(error)
				}
			})
			// https://socket.io/docs/v4/client-api/#event-disconnect
			this.socket.on("disconnect", (reason, details) => {
				console.log(
					`[SocketTransport#_connect] on(disconnect) (reason: ${reason}, details: ${JSON.stringify(details)})`,
				)
				this.connectionState = types_1.ConnectionState.DISCONNECTED
				if (this.options.onDisconnect) {
					this.options.onDisconnect(reason)
				}
				// Don't attempt to reconnect if we're manually disconnecting.
				const isManualDisconnect = reason === "io client disconnect"
				if (!isManualDisconnect && this.isPreviouslyConnected) {
					// After successful initial connection, rely entirely on
					// Socket.IO's reconnection logic.
					console.log("[SocketTransport#_connect] will attempt to reconnect")
				} else {
					console.log("[SocketTransport#_connect] will *NOT* attempt to reconnect")
				}
			})
			// https://socket.io/docs/v4/client-api/#event-error
			// Fired upon a connection error.
			this.socket.io.on("error", (error) => {
				// Connection error.
				if (connectionTimeout && this.connectionState !== types_1.ConnectionState.CONNECTED) {
					console.error(`[SocketTransport#_connect] on(error): ${error.message}`)
					clearTimeout(connectionTimeout)
					connectionTimeout = null
					reject(error)
				}
				// Post-connection error.
				if (this.connectionState === types_1.ConnectionState.CONNECTED) {
					console.error(`[SocketTransport#_connect] on(error): ${error.message}`)
				}
			})
			// https://socket.io/docs/v4/client-api/#event-reconnect
			// Fired upon a successful reconnection.
			this.socket.io.on("reconnect", (attempt) => {
				console.log(`[SocketTransport#_connect] on(reconnect) - ${attempt}`)
				this.connectionState = types_1.ConnectionState.CONNECTED
				if (this.options.onReconnect) {
					this.options.onReconnect()
				}
			})
			// https://socket.io/docs/v4/client-api/#event-reconnect_attempt
			// Fired upon an attempt to reconnect.
			this.socket.io.on("reconnect_attempt", (attempt) => {
				console.log(`[SocketTransport#_connect] on(reconnect_attempt) - ${attempt}`)
			})
			// https://socket.io/docs/v4/client-api/#event-reconnect_error
			// Fired upon a reconnection attempt error.
			this.socket.io.on("reconnect_error", (error) => {
				console.error(`[SocketTransport#_connect] on(reconnect_error): ${error.message}`)
			})
			// https://socket.io/docs/v4/client-api/#event-reconnect_failed
			// Fired when couldn't reconnect within `reconnectionAttempts`.
			// Since we use infinite retries, this should never fire.
			this.socket.io.on("reconnect_failed", () => {
				console.error(`[SocketTransport#_connect] on(reconnect_failed) - giving up`)
				this.connectionState = types_1.ConnectionState.FAILED
			})
			// This is a custom event fired by the server.
			this.socket.on("auth_error", (error) => {
				console.error(
					`[SocketTransport#_connect] on(auth_error): ${error instanceof Error ? error.message : String(error)}`,
				)
				if (connectionTimeout && this.connectionState !== types_1.ConnectionState.CONNECTED) {
					clearTimeout(connectionTimeout)
					connectionTimeout = null
					reject(new Error(error.message || "Authentication failed"))
				}
			})
		})
	}
	async disconnect() {
		console.log(`[SocketTransport#disconnect] Disconnecting...`)
		if (this.retryTimeout) {
			clearTimeout(this.retryTimeout)
			this.retryTimeout = null
		}
		if (this.socket) {
			this.socket.removeAllListeners()
			this.socket.io.removeAllListeners()
			this.socket.disconnect()
			this.socket = null
		}
		this.connectionState = types_1.ConnectionState.DISCONNECTED
		console.log(`[SocketTransport#disconnect] Disconnected`)
	}
	getSocket() {
		return this.socket
	}
	getConnectionState() {
		return this.connectionState
	}
	isConnected() {
		return this.connectionState === types_1.ConnectionState.CONNECTED && this.socket?.connected === true
	}
	async reconnect() {
		console.log(`[SocketTransport#reconnect] Manually reconnecting...`)
		if (this.connectionState === types_1.ConnectionState.CONNECTED) {
			console.log(`[SocketTransport#reconnect] Already connected`)
			return
		}
		this.isPreviouslyConnected = false
		await this.disconnect()
		await this.connect()
	}
}
exports.SocketTransport = SocketTransport
//# sourceMappingURL=SocketTransport.js.map
