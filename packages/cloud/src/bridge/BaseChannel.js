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
exports.BaseChannel = void 0
const vscode = __importStar(require("vscode"))
/**
 * Abstract base class for communication channels in the bridge system.
 * Provides common functionality for bidirectional communication between
 * the VSCode extension and web application.
 *
 * @template TCommand - Type of commands this channel can receive.
 * @template TEvent - Type of events this channel can publish.
 */
class BaseChannel {
	constructor(options) {
		Object.defineProperty(this, "socket", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: null,
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
		this.instanceId = options.instanceId
		this.appProperties = options.appProperties
		this.gitProperties = options.gitProperties
	}
	/**
	 * Called when socket connects.
	 */
	async onConnect(socket) {
		this.socket = socket
		await this.handleConnect(socket)
	}
	/**
	 * Called when socket disconnects.
	 */
	onDisconnect() {
		this.socket = null
		this.handleDisconnect()
	}
	/**
	 * Called when socket reconnects.
	 */
	async onReconnect(socket) {
		this.socket = socket
		await this.handleReconnect(socket)
	}
	/**
	 * Cleanup resources.
	 */
	async cleanup(socket) {
		if (socket) {
			await this.handleCleanup(socket)
		}
		this.socket = null
	}
	/**
	 * Emit a socket event with error handling.
	 */
	publish(eventName, data, callback) {
		if (!this.socket) {
			console.error(`[${this.constructor.name}#emit] socket not available for ${eventName}`)
			return false
		}
		try {
			// console.log(`[${this.constructor.name}#emit] emit() -> ${eventName}`, data)
			this.socket.emit(eventName, data, callback)
			return true
		} catch (error) {
			console.error(
				`[${this.constructor.name}#emit] emit() failed -> ${eventName}: ${error instanceof Error ? error.message : String(error)}`,
			)
			return false
		}
	}
	/**
	 * Handle incoming commands - template method that ensures common functionality
	 * is executed before subclass-specific logic.
	 *
	 * This method should be called by subclasses to handle commands.
	 * It will execute common functionality and then delegate to the abstract
	 * handleCommandImplementation method.
	 */
	async handleCommand(command) {
		// Common functionality: focus the sidebar.
		await vscode.commands.executeCommand(`${this.appProperties.appName}.SidebarProvider.focus`)
		// Delegate to subclass-specific implementation.
		await this.handleCommandImplementation(command)
	}
	/**
	 * Handle disconnection-specific logic.
	 */
	handleDisconnect() {
		// Default implementation - can be overridden.
	}
}
exports.BaseChannel = BaseChannel
//# sourceMappingURL=BaseChannel.js.map
