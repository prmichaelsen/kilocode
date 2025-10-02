"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.BridgeOrchestrator = void 0
const crypto_1 = __importDefault(require("crypto"))
const os_1 = __importDefault(require("os"))
const types_1 = require("@roo-code/types")
const SocketTransport_js_1 = require("./SocketTransport.js")
const ExtensionChannel_js_1 = require("./ExtensionChannel.js")
const TaskChannel_js_1 = require("./TaskChannel.js")
/**
 * Central orchestrator for the extension bridge system.
 * Coordinates communication between the VSCode extension and web application
 * through WebSocket connections and manages extension/task channels.
 */
class BridgeOrchestrator {
	static getInstance() {
		return BridgeOrchestrator.instance
	}
	static isEnabled(user, remoteControlEnabled) {
		// Always disabled if signed out.
		if (!user) {
			return false
		}
		// Disabled by the user's organization?
		if (!user.extensionBridgeEnabled) {
			return false
		}
		// Disabled by the user?
		if (!remoteControlEnabled) {
			return false
		}
		return true
	}
	static async connectOrDisconnect(userInfo, remoteControlEnabled, options) {
		if (BridgeOrchestrator.isEnabled(userInfo, remoteControlEnabled)) {
			await BridgeOrchestrator.connect(options)
		} else {
			await BridgeOrchestrator.disconnect()
		}
	}
	static async connect(options) {
		const instance = BridgeOrchestrator.instance
		if (!instance) {
			try {
				console.log(`[BridgeOrchestrator#connectOrDisconnect] Connecting...`)
				// Populate telemetry properties before registering the instance.
				await options.provider.getTelemetryProperties()
				BridgeOrchestrator.instance = new BridgeOrchestrator(options)
				await BridgeOrchestrator.instance.connect()
			} catch (error) {
				console.error(
					`[BridgeOrchestrator#connectOrDisconnect] connect() failed: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		} else {
			if (
				instance.connectionState === types_1.ConnectionState.FAILED ||
				instance.connectionState === types_1.ConnectionState.DISCONNECTED
			) {
				console.log(
					`[BridgeOrchestrator#connectOrDisconnect] Re-connecting... (state: ${instance.connectionState})`,
				)
				instance.reconnect().catch((error) => {
					console.error(
						`[BridgeOrchestrator#connectOrDisconnect] reconnect() failed: ${error instanceof Error ? error.message : String(error)}`,
					)
				})
			} else {
				console.log(
					`[BridgeOrchestrator#connectOrDisconnect] Already connected or connecting (state: ${instance.connectionState})`,
				)
			}
		}
	}
	static async disconnect() {
		const instance = BridgeOrchestrator.instance
		if (instance) {
			try {
				console.log(
					`[BridgeOrchestrator#connectOrDisconnect] Disconnecting... (state: ${instance.connectionState})`,
				)
				await instance.disconnect()
			} catch (error) {
				console.error(
					`[BridgeOrchestrator#connectOrDisconnect] disconnect() failed: ${error instanceof Error ? error.message : String(error)}`,
				)
			} finally {
				BridgeOrchestrator.instance = null
			}
		} else {
			console.log(`[BridgeOrchestrator#connectOrDisconnect] Already disconnected`)
		}
	}
	/**
	 * @TODO: What if subtasks also get spawned? We'd probably want deferred
	 * subscriptions for those too.
	 */
	static async subscribeToTask(task) {
		const instance = BridgeOrchestrator.instance
		if (instance && instance.socketTransport.isConnected()) {
			console.log(`[BridgeOrchestrator#subscribeToTask] Subscribing to task ${task.taskId}`)
			await instance.subscribeToTask(task)
		} else {
			console.log(`[BridgeOrchestrator#subscribeToTask] Deferring subscription for task ${task.taskId}`)
			BridgeOrchestrator.pendingTask = task
		}
	}
	constructor(options) {
		// Core
		Object.defineProperty(this, "userId", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "socketBridgeUrl", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "token", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "provider", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "instanceId", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "appProperties", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "gitProperties", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		// Components
		Object.defineProperty(this, "socketTransport", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "extensionChannel", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "taskChannel", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		// Reconnection
		Object.defineProperty(this, "MAX_RECONNECT_ATTEMPTS", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: Infinity,
		})
		Object.defineProperty(this, "RECONNECT_DELAY", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: 1000,
		})
		Object.defineProperty(this, "RECONNECT_DELAY_MAX", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: 30000,
		})
		this.userId = options.userId
		this.socketBridgeUrl = options.socketBridgeUrl
		this.token = options.token
		this.provider = options.provider
		this.instanceId = options.sessionId || crypto_1.default.randomUUID()
		this.appProperties = { ...options.provider.appProperties, hostname: os_1.default.hostname() }
		this.gitProperties = options.provider.gitProperties
		this.socketTransport = new SocketTransport_js_1.SocketTransport({
			url: this.socketBridgeUrl,
			socketOptions: {
				query: {
					token: this.token,
					clientType: "extension",
					instanceId: this.instanceId,
				},
				transports: ["websocket", "polling"],
				reconnection: true,
				reconnectionAttempts: this.MAX_RECONNECT_ATTEMPTS,
				reconnectionDelay: this.RECONNECT_DELAY,
				reconnectionDelayMax: this.RECONNECT_DELAY_MAX,
			},
			onConnect: () => this.handleConnect(),
			onDisconnect: () => this.handleDisconnect(),
			onReconnect: () => this.handleReconnect(),
		})
		this.extensionChannel = new ExtensionChannel_js_1.ExtensionChannel({
			instanceId: this.instanceId,
			appProperties: this.appProperties,
			gitProperties: this.gitProperties,
			userId: this.userId,
			provider: this.provider,
		})
		this.taskChannel = new TaskChannel_js_1.TaskChannel({
			instanceId: this.instanceId,
			appProperties: this.appProperties,
			gitProperties: this.gitProperties,
		})
	}
	setupSocketListeners() {
		const socket = this.socketTransport.getSocket()
		if (!socket) {
			console.error("[BridgeOrchestrator] Socket not available")
			return
		}
		// Remove any existing listeners first to prevent duplicates.
		socket.off(types_1.ExtensionSocketEvents.RELAYED_COMMAND)
		socket.off(types_1.TaskSocketEvents.RELAYED_COMMAND)
		socket.off("connected")
		socket.on(types_1.ExtensionSocketEvents.RELAYED_COMMAND, (message) => {
			console.log(
				`[BridgeOrchestrator] on(${types_1.ExtensionSocketEvents.RELAYED_COMMAND}) -> ${message.type} for ${message.instanceId}`,
			)
			this.extensionChannel?.handleCommand(message)
		})
		socket.on(types_1.TaskSocketEvents.RELAYED_COMMAND, (message) => {
			console.log(
				`[BridgeOrchestrator] on(${types_1.TaskSocketEvents.RELAYED_COMMAND}) -> ${message.type} for ${message.taskId}`,
			)
			this.taskChannel.handleCommand(message)
		})
	}
	async handleConnect() {
		const socket = this.socketTransport.getSocket()
		if (!socket) {
			console.error("[BridgeOrchestrator#handleConnect] Socket not available")
			return
		}
		await this.extensionChannel.onConnect(socket)
		await this.taskChannel.onConnect(socket)
		if (BridgeOrchestrator.pendingTask) {
			console.log(
				`[BridgeOrchestrator#handleConnect] Subscribing to task ${BridgeOrchestrator.pendingTask.taskId}`,
			)
			try {
				await this.subscribeToTask(BridgeOrchestrator.pendingTask)
				BridgeOrchestrator.pendingTask = null
			} catch (error) {
				console.error(
					`[BridgeOrchestrator#handleConnect] subscribeToTask() failed: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		}
	}
	handleDisconnect() {
		this.extensionChannel.onDisconnect()
		this.taskChannel.onDisconnect()
	}
	async handleReconnect() {
		const socket = this.socketTransport.getSocket()
		if (!socket) {
			console.error("[BridgeOrchestrator] Socket not available after reconnect")
			return
		}
		// Re-setup socket listeners to ensure they're properly configured
		// after automatic reconnection (Socket.IO's built-in reconnection)
		// The socket.off() calls in setupSocketListeners prevent duplicates
		this.setupSocketListeners()
		await this.extensionChannel.onReconnect(socket)
		await this.taskChannel.onReconnect(socket)
	}
	// Task API
	async subscribeToTask(task) {
		const socket = this.socketTransport.getSocket()
		if (!socket || !this.socketTransport.isConnected()) {
			console.warn("[BridgeOrchestrator] Cannot subscribe to task: not connected. Will retry when connected.")
			this.taskChannel.addPendingTask(task)
			if (
				this.connectionState === types_1.ConnectionState.DISCONNECTED ||
				this.connectionState === types_1.ConnectionState.FAILED
			) {
				await this.connect()
			}
			return
		}
		await this.taskChannel.subscribeToTask(task, socket)
	}
	async unsubscribeFromTask(taskId) {
		const socket = this.socketTransport.getSocket()
		if (!socket) {
			return
		}
		await this.taskChannel.unsubscribeFromTask(taskId, socket)
	}
	// Shared API
	get connectionState() {
		return this.socketTransport.getConnectionState()
	}
	async connect() {
		await this.socketTransport.connect()
		this.setupSocketListeners()
	}
	async disconnect() {
		await this.extensionChannel.cleanup(this.socketTransport.getSocket())
		await this.taskChannel.cleanup(this.socketTransport.getSocket())
		await this.socketTransport.disconnect()
		BridgeOrchestrator.instance = null
		BridgeOrchestrator.pendingTask = null
	}
	async reconnect() {
		await this.socketTransport.reconnect()
		// After a manual reconnect, we have a new socket instance
		// so we need to set up listeners again.
		this.setupSocketListeners()
	}
}
exports.BridgeOrchestrator = BridgeOrchestrator
Object.defineProperty(BridgeOrchestrator, "instance", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: null,
})
Object.defineProperty(BridgeOrchestrator, "pendingTask", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: null,
})
//# sourceMappingURL=BridgeOrchestrator.js.map
