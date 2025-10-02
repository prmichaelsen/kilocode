"use strict"
Object.defineProperty(exports, "__esModule", { value: true })
exports.DEFAULT_HEADERS = void 0
const headers_1 = require("../../shared/kilocode/headers")
const package_1 = require("../../shared/package")
exports.DEFAULT_HEADERS = {
	"HTTP-Referer": "https://kilocode.ai",
	"X-Title": "Kilo Code",
	[headers_1.X_KILOCODE_VERSION]: package_1.Package.version,
	"User-Agent": `Kilo-Code/${package_1.Package.version}`,
}
//# sourceMappingURL=constants.js.map
