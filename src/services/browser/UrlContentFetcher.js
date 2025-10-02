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
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.UrlContentFetcher = void 0
const fs = __importStar(require("fs/promises"))
const path = __importStar(require("path"))
const cheerio = __importStar(require("cheerio"))
const turndown_1 = __importDefault(require("turndown"))
// @ts-ignore
const puppeteer_chromium_resolver_1 = __importDefault(require("puppeteer-chromium-resolver"))
const fs_1 = require("../../utils/fs")
const serialize_error_1 = require("serialize-error")
// Timeout constants
const URL_FETCH_TIMEOUT = 30000 // 30 seconds
const URL_FETCH_FALLBACK_TIMEOUT = 20000 // 20 seconds for fallback
class UrlContentFetcher {
	constructor(context) {
		Object.defineProperty(this, "context", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "browser", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "page", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.context = context
	}
	async ensureChromiumExists() {
		const globalStoragePath = this.context?.globalStorageUri?.fsPath
		if (!globalStoragePath) {
			throw new Error("Global storage uri is invalid")
		}
		const puppeteerDir = path.join(globalStoragePath, "puppeteer")
		const dirExists = await (0, fs_1.fileExistsAtPath)(puppeteerDir)
		if (!dirExists) {
			await fs.mkdir(puppeteerDir, { recursive: true })
		}
		// if chromium doesn't exist, this will download it to path.join(puppeteerDir, ".chromium-browser-snapshots")
		// if it does exist it will return the path to existing chromium
		const stats = await (0, puppeteer_chromium_resolver_1.default)({
			downloadPath: puppeteerDir,
		})
		return stats
	}
	async launchBrowser() {
		if (this.browser) {
			return
		}
		const stats = await this.ensureChromiumExists()
		const args = [
			"--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
			"--disable-dev-shm-usage",
			"--disable-accelerated-2d-canvas",
			"--no-first-run",
			"--disable-gpu",
			"--disable-features=VizDisplayCompositor",
		]
		if (process.platform === "linux") {
			// Fixes network errors on Linux hosts (see https://github.com/puppeteer/puppeteer/issues/8246)
			args.push("--no-sandbox")
		}
		this.browser = await stats.puppeteer.launch({
			args,
			executablePath: stats.executablePath,
		})
		// (latest version of puppeteer does not add headless to user agent)
		this.page = await this.browser?.newPage()
		// Set additional page configurations to improve loading success
		if (this.page) {
			await this.page.setViewport({ width: 1280, height: 720 })
			await this.page.setExtraHTTPHeaders({
				"Accept-Language": "en-US,en;q=0.9",
			})
		}
	}
	async closeBrowser() {
		await this.browser?.close()
		this.browser = undefined
		this.page = undefined
	}
	// must make sure to call launchBrowser before and closeBrowser after using this
	async urlToMarkdown(url) {
		if (!this.browser || !this.page) {
			throw new Error("Browser not initialized")
		}
		/*
        - networkidle2 is equivalent to playwright's networkidle where it waits until there are no more than 2 network connections for at least 500 ms.
        - domcontentloaded is when the basic DOM is loaded
        this should be sufficient for most doc sites
        */
		try {
			await this.page.goto(url, {
				timeout: URL_FETCH_TIMEOUT,
				waitUntil: ["domcontentloaded", "networkidle2"],
			})
		} catch (error) {
			// Use serialize-error to safely extract error information
			const serializedError = (0, serialize_error_1.serializeError)(error)
			const errorMessage = serializedError.message || String(error)
			const errorName = serializedError.name
			// Only retry for timeout or network-related errors
			const shouldRetry =
				errorMessage.includes("timeout") ||
				errorMessage.includes("net::") ||
				errorMessage.includes("NetworkError") ||
				errorMessage.includes("ERR_") ||
				errorName === "TimeoutError"
			if (shouldRetry) {
				// If networkidle2 fails due to timeout/network issues, try with just domcontentloaded as fallback
				console.warn(
					`Failed to load ${url} with networkidle2, retrying with domcontentloaded only: ${errorMessage}`,
				)
				await this.page.goto(url, {
					timeout: URL_FETCH_FALLBACK_TIMEOUT,
					waitUntil: ["domcontentloaded"],
				})
			} else {
				// For other errors, throw them as-is
				throw error
			}
		}
		const content = await this.page.content()
		// use cheerio to parse and clean up the HTML
		const $ = cheerio.load(content)
		$("script, style, nav, footer, header").remove()
		// convert cleaned HTML to markdown
		const turndownService = new turndown_1.default()
		const markdown = turndownService.turndown($.html())
		return markdown
	}
}
exports.UrlContentFetcher = UrlContentFetcher
//# sourceMappingURL=UrlContentFetcher.js.map
