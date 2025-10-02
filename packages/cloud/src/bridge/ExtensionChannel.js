"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.ExtensionChannel = void 0
const types_1 = require("@roo-code/types")
const BaseChannel_js_1 = require("./BaseChannel.js")
/**
 * Manages the extension-level communication channel.
 * Handles extension registration, heartbeat, and extension-specific commands.
 */
class ExtensionChannel extends BaseChannel_js_1.BaseChannel {
	constructor(options) {
		super({
			instanceId: options.instanceId,
			appProperties: options.appProperties,
			gitProperties: options.gitProperties,
		})
		Object.defineProperty(this, "userId", {
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
		Object.defineProperty(this, "extensionInstance", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "heartbeatInterval", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, "eventListeners", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: new Map(),
		})
		this.userId = options.userId
		this.provider = options.provider
		this.extensionInstance = {
			instanceId: this.instanceId,
			userId: this.userId,
			workspacePath: this.provider.cwd,
			appProperties: this.appProperties,
			gitProperties: this.gitProperties,
			lastHeartbeat: Date.now(),
			task: { taskId: "", taskStatus: types_1.TaskStatus.None },
			taskHistory: [],
		}
		this.setupListeners()
	}
	async handleCommandImplementation(command) {
		if (command.instanceId !== this.instanceId) {
			console.log(`[ExtensionChannel] command -> instance id mismatch | ${this.instanceId}`, {
				messageInstanceId: command.instanceId,
			})
			return
		}
		switch (command.type) {
			case types_1.ExtensionBridgeCommandName.StartTask: {
				console.log(`[ExtensionChannel] command -> createTask() | ${command.instanceId}`, {
					text: command.payload.text?.substring(0, 100) + "...",
					hasImages: !!command.payload.images,
					mode: command.payload.mode,
					providerProfile: command.payload.providerProfile,
				})
				this.provider.createTask(
					command.payload.text,
					command.payload.images,
					undefined, // parentTask
					undefined, // options
					{ mode: command.payload.mode, currentApiConfigName: command.payload.providerProfile },
				)
				break
			}
			case types_1.ExtensionBridgeCommandName.StopTask: {
				const instance = await this.updateInstance()
				if (instance.task.taskStatus === types_1.TaskStatus.Running) {
					console.log(`[ExtensionChannel] command -> cancelTask() | ${command.instanceId}`)
					this.provider.cancelTask()
					this.provider.postStateToWebview()
				} else if (instance.task.taskId) {
					console.log(`[ExtensionChannel] command -> clearTask() | ${command.instanceId}`)
					this.provider.clearTask()
					this.provider.postStateToWebview()
				}
				break
			}
			case types_1.ExtensionBridgeCommandName.ResumeTask: {
				console.log(`[ExtensionChannel] command -> resumeTask() | ${command.instanceId}`, {
					taskId: command.payload.taskId,
				})
				this.provider.resumeTask(command.payload.taskId)
				this.provider.postStateToWebview()
				break
			}
		}
	}
	async handleConnect(socket) {
		await this.registerInstance(socket)
		this.startHeartbeat(socket)
	}
	async handleReconnect(socket) {
		await this.registerInstance(socket)
		this.startHeartbeat(socket)
	}
	handleDisconnect() {
		this.stopHeartbeat()
	}
	async handleCleanup(socket) {
		this.stopHeartbeat()
		this.cleanupListeners()
		await this.unregisterInstance(socket)
	}
	async registerInstance(_socket) {
		const instance = await this.updateInstance()
		await this.publish(types_1.ExtensionSocketEvents.REGISTER, instance)
	}
	async unregisterInstance(_socket) {
		const instance = await this.updateInstance()
		await this.publish(types_1.ExtensionSocketEvents.UNREGISTER, instance)
	}
	startHeartbeat(socket) {
		this.stopHeartbeat()
		this.heartbeatInterval = setInterval(async () => {
			const instance = await this.updateInstance()
			try {
				socket.emit(types_1.ExtensionSocketEvents.HEARTBEAT, instance)
				// Heartbeat is too frequent to log
			} catch (error) {
				console.error(
					`[ExtensionChannel] emit() failed -> ${types_1.ExtensionSocketEvents.HEARTBEAT}: ${error instanceof Error ? error.message : String(error)}`,
				)
			}
		}, types_1.HEARTBEAT_INTERVAL_MS)
	}
	stopHeartbeat() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval)
			this.heartbeatInterval = null
		}
	}
	setupListeners() {
		const eventMapping = [
			{ from: types_1.RooCodeEventName.TaskCreated, to: types_1.ExtensionBridgeEventName.TaskCreated },
			{ from: types_1.RooCodeEventName.TaskStarted, to: types_1.ExtensionBridgeEventName.TaskStarted },
			{ from: types_1.RooCodeEventName.TaskCompleted, to: types_1.ExtensionBridgeEventName.TaskCompleted },
			{ from: types_1.RooCodeEventName.TaskAborted, to: types_1.ExtensionBridgeEventName.TaskAborted },
			{ from: types_1.RooCodeEventName.TaskFocused, to: types_1.ExtensionBridgeEventName.TaskFocused },
			{ from: types_1.RooCodeEventName.TaskUnfocused, to: types_1.ExtensionBridgeEventName.TaskUnfocused },
			{ from: types_1.RooCodeEventName.TaskActive, to: types_1.ExtensionBridgeEventName.TaskActive },
			{ from: types_1.RooCodeEventName.TaskInteractive, to: types_1.ExtensionBridgeEventName.TaskInteractive },
			{ from: types_1.RooCodeEventName.TaskResumable, to: types_1.ExtensionBridgeEventName.TaskResumable },
			{ from: types_1.RooCodeEventName.TaskIdle, to: types_1.ExtensionBridgeEventName.TaskIdle },
			{ from: types_1.RooCodeEventName.TaskPaused, to: types_1.ExtensionBridgeEventName.TaskPaused },
			{ from: types_1.RooCodeEventName.TaskUnpaused, to: types_1.ExtensionBridgeEventName.TaskUnpaused },
			{ from: types_1.RooCodeEventName.TaskSpawned, to: types_1.ExtensionBridgeEventName.TaskSpawned },
			{ from: types_1.RooCodeEventName.TaskUserMessage, to: types_1.ExtensionBridgeEventName.TaskUserMessage },
			{
				from: types_1.RooCodeEventName.TaskTokenUsageUpdated,
				to: types_1.ExtensionBridgeEventName.TaskTokenUsageUpdated,
			},
		]
		eventMapping.forEach(({ from, to }) => {
			// Create and store the listener function for cleanup.
			const listener = async (..._args) => {
				this.publish(types_1.ExtensionSocketEvents.EVENT, {
					type: to,
					instance: await this.updateInstance(),
					timestamp: Date.now(),
				})
			}
			this.eventListeners.set(from, listener)
			this.provider.on(from, listener)
		})
	}
	cleanupListeners() {
		this.eventListeners.forEach((listener, eventName) => {
			// Cast is safe because we only store valid event names from eventMapping.
			this.provider.off(eventName, listener)
		})
		this.eventListeners.clear()
	}
	async updateInstance() {
		const task = this.provider?.getCurrentTask()
		const taskHistory = this.provider?.getRecentTasks() ?? []
		const mode = await this.provider?.getMode()
		const modes = (await this.provider?.getModes()) ?? []
		const providerProfile = await this.provider?.getProviderProfile()
		const providerProfiles = (await this.provider?.getProviderProfiles()) ?? []
		this.extensionInstance = {
			...this.extensionInstance,
			lastHeartbeat: Date.now(),
			task: task
				? {
						taskId: task.taskId,
						parentTaskId: task.parentTaskId,
						childTaskId: task.childTaskId,
						taskStatus: task.taskStatus,
						taskAsk: task?.taskAsk,
						queuedMessages: task.queuedMessages,
						tokenUsage: task.tokenUsage,
						...task.metadata,
					}
				: { taskId: "", taskStatus: types_1.TaskStatus.None },
			taskAsk: task?.taskAsk,
			taskHistory,
			mode,
			providerProfile,
			modes,
			providerProfiles,
		}
		return this.extensionInstance
	}
}
exports.ExtensionChannel = ExtensionChannel
//# sourceMappingURL=ExtensionChannel.js.map
