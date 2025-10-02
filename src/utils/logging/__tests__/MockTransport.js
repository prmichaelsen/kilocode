"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.MockTransport = void 0
// __tests__/MockTransport.ts
const CompactTransport_1 = require("../CompactTransport")
const TEST_CONFIG = {
	level: "fatal",
	fileOutput: {
		enabled: false,
		path: "",
	},
}
class MockTransport extends CompactTransport_1.CompactTransport {
	constructor() {
		super(TEST_CONFIG)
		Object.defineProperty(this, "entries", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: [],
		})
		Object.defineProperty(this, "closed", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: false,
		})
	}
	async write(entry) {
		this.entries.push(entry)
	}
	async close() {
		this.closed = true
		await super.close()
	}
	clear() {
		this.entries = []
		this.closed = false
	}
}
exports.MockTransport = MockTransport
//# sourceMappingURL=MockTransport.js.map
