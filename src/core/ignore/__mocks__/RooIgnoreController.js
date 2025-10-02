"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.RooIgnoreController = exports.LOCK_TEXT_SYMBOL = void 0
exports.LOCK_TEXT_SYMBOL = "\u{1F512}"
class RooIgnoreController {
	constructor(_cwd) {
		Object.defineProperty(this, "rooIgnoreContent", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: undefined,
		})
		// No-op constructor
	}
	async initialize() {
		// No-op initialization
		return Promise.resolve()
	}
	validateAccess(_filePath) {
		// Default implementation: allow all access
		return true
	}
	validateCommand(_command) {
		// Default implementation: allow all commands
		return undefined
	}
	filterPaths(paths) {
		// Default implementation: allow all paths
		return paths
	}
	dispose() {
		// No-op dispose
	}
	getInstructions() {
		// Default implementation: no instructions
		return undefined
	}
}
exports.RooIgnoreController = RooIgnoreController
//# sourceMappingURL=RooIgnoreController.js.map
