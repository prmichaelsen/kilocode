"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.registerMainThreadForwardingLogger = registerMainThreadForwardingLogger
// Store original console methods
const originalConsole = {
	log: console.log,
	info: console.info,
	warn: console.warn,
	error: console.error,
	debug: console.debug,
}
async function forwardToMainThread(level, args) {
	try {
		// Try to access global RPC bridge if available (JetBrains environment)
		const globalThis = global
		if (globalThis.rpcProtocol && globalThis.rpcProtocol.getProxy) {
			const mainThreadConsole = globalThis.rpcProtocol.getProxy("MainThreadConsole")
			if (mainThreadConsole && mainThreadConsole.logExtensionHostMessage) {
				await mainThreadConsole.logExtensionHostMessage({
					type: level,
					severity: level,
					arguments: args,
					timestamp: Date.now(),
				})
			}
		}
	} catch (e) {
		// Silently fail if RPC not available - we're probably in VSCode mode
	}
}
function createForwardingLogger(level) {
	return (...args) => {
		// Always call original console method first
		originalConsole[level](...args)
		// Forward to JetBrains if available
		forwardToMainThread(level, args)
	}
}
function restoreConsole() {
	// Restore original console methods
	console.log = originalConsole.log
	console.info = originalConsole.info
	console.warn = originalConsole.warn
	console.error = originalConsole.error
	console.debug = originalConsole.debug
}
/**
 * Register MainThread forwarding for console logs to JetBrains
 * Automatically monkey patches console methods and registers cleanup
 */
function registerMainThreadForwardingLogger(context) {
	// Replace global console methods with our forwarding versions
	console.log = createForwardingLogger("log")
	console.info = createForwardingLogger("info")
	console.warn = createForwardingLogger("warn")
	console.error = createForwardingLogger("error")
	console.debug = createForwardingLogger("debug")
	// Register cleanup with context
	context.subscriptions.push({ dispose: restoreConsole })
}
//# sourceMappingURL=fowardingLogger.js.map
