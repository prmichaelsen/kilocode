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
exports.MarketplaceManager = void 0
const fs = __importStar(require("fs/promises"))
const path = __importStar(require("path"))
const vscode = __importStar(require("vscode"))
const yaml = __importStar(require("yaml"))
const telemetry_1 = require("@roo-code/telemetry")
const cloud_1 = require("@roo-code/cloud")
const globalFileNames_1 = require("../../shared/globalFileNames")
const globalContext_1 = require("../../utils/globalContext")
const i18n_1 = require("../../i18n")
const RemoteConfigLoader_1 = require("./RemoteConfigLoader")
const SimpleInstaller_1 = require("./SimpleInstaller")
class MarketplaceManager {
	constructor(context, customModesManager) {
		Object.defineProperty(this, "context", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: context,
		})
		Object.defineProperty(this, "customModesManager", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: customModesManager,
		})
		Object.defineProperty(this, "configLoader", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		Object.defineProperty(this, "installer", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		this.configLoader = new RemoteConfigLoader_1.RemoteConfigLoader()
		this.installer = new SimpleInstaller_1.SimpleInstaller(context, customModesManager)
	}
	async getMarketplaceItems() {
		try {
			const errors = []
			let orgSettings
			try {
				if (cloud_1.CloudService.hasInstance() && cloud_1.CloudService.instance.isAuthenticated()) {
					orgSettings = cloud_1.CloudService.instance.getOrganizationSettings()
				}
			} catch (orgError) {
				console.warn("Failed to load organization settings:", orgError)
				const orgErrorMessage = orgError instanceof Error ? orgError.message : String(orgError)
				errors.push(`Organization settings: ${orgErrorMessage}`)
			}
			const allMarketplaceItems = await this.configLoader.loadAllItems(orgSettings?.hideMarketplaceMcps)
			let organizationMcps = []
			let marketplaceItems = allMarketplaceItems
			if (orgSettings) {
				if (orgSettings.mcps && orgSettings.mcps.length > 0) {
					organizationMcps = orgSettings.mcps.map((mcp) => ({
						...mcp,
						type: "mcp",
					}))
				}
				if (orgSettings.hiddenMcps && orgSettings.hiddenMcps.length > 0) {
					const hiddenMcpIds = new Set(orgSettings.hiddenMcps)
					marketplaceItems = allMarketplaceItems.filter(
						(item) => item.type !== "mcp" || !hiddenMcpIds.has(item.id),
					)
				}
			}
			return {
				organizationMcps,
				marketplaceItems,
				errors: errors.length > 0 ? errors : undefined,
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			console.error("Failed to load marketplace items:", error)
			return {
				organizationMcps: [],
				marketplaceItems: [],
				errors: [errorMessage],
			}
		}
	}
	async getCurrentItems() {
		const result = await this.getMarketplaceItems()
		return [...result.organizationMcps, ...result.marketplaceItems]
	}
	filterItems(items, filters) {
		return items.filter((item) => {
			// Type filter
			if (filters.type && item.type !== filters.type) {
				return false
			}
			// Search filter
			if (filters.search) {
				const searchTerm = filters.search.toLowerCase()
				const searchableText = `${item.name} ${item.description}`.toLowerCase()
				if (!searchableText.includes(searchTerm)) {
					return false
				}
			}
			// Tags filter
			if (filters.tags?.length) {
				if (!item.tags?.some((tag) => filters.tags.includes(tag))) {
					return false
				}
			}
			return true
		})
	}
	async updateWithFilteredItems(filters) {
		const allItems = await this.getCurrentItems()
		if (!filters.type && !filters.search && (!filters.tags || filters.tags.length === 0)) {
			return allItems
		}
		return this.filterItems(allItems, filters)
	}
	async installMarketplaceItem(item, options) {
		const { target = "project", parameters } = options || {}
		vscode.window.showInformationMessage(
			(0, i18n_1.t)("marketplace:installation.installing", { itemName: item.name }),
		)
		try {
			const result = await this.installer.installItem(item, { target, parameters })
			vscode.window.showInformationMessage(
				(0, i18n_1.t)("marketplace:installation.installSuccess", { itemName: item.name }),
			)
			// Capture telemetry for successful installation
			const telemetryProperties = {}
			if (parameters && Object.keys(parameters).length > 0) {
				telemetryProperties.hasParameters = true
				// For MCP items with multiple installation methods, track which one was used
				if (item.type === "mcp" && parameters._selectedIndex !== undefined && Array.isArray(item.content)) {
					const selectedMethod = item.content[parameters._selectedIndex]
					if (selectedMethod && selectedMethod.name) {
						telemetryProperties.installationMethodName = selectedMethod.name
					}
				}
			}
			telemetry_1.TelemetryService.instance.captureMarketplaceItemInstalled(
				item.id,
				item.type,
				item.name,
				target,
				telemetryProperties,
			)
			// Open the config file that was modified, optionally at the specific line
			const document = await vscode.workspace.openTextDocument(result.filePath)
			const options = {}
			if (result.line !== undefined) {
				// Position cursor at the line where content was added
				options.selection = new vscode.Range(result.line - 1, 0, result.line - 1, 0)
			}
			await vscode.window.showTextDocument(document, options)
			return result.filePath
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			vscode.window.showErrorMessage(
				(0, i18n_1.t)("marketplace:installation.installError", { itemName: item.name, errorMessage }),
			)
			throw error
		}
	}
	async removeInstalledMarketplaceItem(item, options) {
		const { target = "project" } = options || {}
		vscode.window.showInformationMessage(
			(0, i18n_1.t)("marketplace:installation.removing", { itemName: item.name }),
		)
		try {
			await this.installer.removeItem(item, { target })
			vscode.window.showInformationMessage(
				(0, i18n_1.t)("marketplace:installation.removeSuccess", { itemName: item.name }),
			)
			// Capture telemetry for successful removal
			telemetry_1.TelemetryService.instance.captureMarketplaceItemRemoved(item.id, item.type, item.name, target)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error)
			vscode.window.showErrorMessage(
				(0, i18n_1.t)("marketplace:installation.removeError", { itemName: item.name, errorMessage }),
			)
			throw error
		}
	}
	async cleanup() {
		// Clear API cache if needed
		this.configLoader.clearCache()
	}
	/**
	 * Get installation metadata by checking config files for installed items
	 */
	async getInstallationMetadata() {
		const metadata = {
			project: {},
			global: {},
		}
		// Check project-level installations
		await this.checkProjectInstallations(metadata.project)
		// Check global-level installations
		await this.checkGlobalInstallations(metadata.global)
		return metadata
	}
	/**
	 * Check for project-level installed items
	 */
	async checkProjectInstallations(metadata) {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
			if (!workspaceFolder) {
				return // No workspace, no project installations
			}
			// Check modes in .roomodes
			const projectModesPath = path.join(workspaceFolder.uri.fsPath, ".kilocodemodes")
			try {
				const content = await fs.readFile(projectModesPath, "utf-8")
				const data = yaml.parse(content)
				if (data?.customModes && Array.isArray(data.customModes)) {
					for (const mode of data.customModes) {
						if (mode.slug) {
							metadata[mode.slug] = {
								type: "mode",
							}
						}
					}
				}
			} catch (error) {
				// File doesn't exist or can't be read, skip
			}
			// Check MCPs in .roo/mcp.json
			const projectMcpPath = path.join(workspaceFolder.uri.fsPath, ".kilocode", "mcp.json")
			try {
				const content = await fs.readFile(projectMcpPath, "utf-8")
				const data = JSON.parse(content)
				if (data?.mcpServers && typeof data.mcpServers === "object") {
					for (const serverName of Object.keys(data.mcpServers)) {
						metadata[serverName] = {
							type: "mcp",
						}
					}
				}
			} catch (error) {
				// File doesn't exist or can't be read, skip
			}
		} catch (error) {
			console.error("Error checking project installations:", error)
		}
	}
	/**
	 * Check for global-level installed items
	 */
	async checkGlobalInstallations(metadata) {
		try {
			const globalSettingsPath = await (0, globalContext_1.ensureSettingsDirectoryExists)(this.context)
			// Check global modes
			const globalModesPath = path.join(globalSettingsPath, globalFileNames_1.GlobalFileNames.customModes)
			try {
				const content = await fs.readFile(globalModesPath, "utf-8")
				const data = yaml.parse(content)
				if (data?.customModes && Array.isArray(data.customModes)) {
					for (const mode of data.customModes) {
						if (mode.slug) {
							metadata[mode.slug] = {
								type: "mode",
							}
						}
					}
				}
			} catch (error) {
				// File doesn't exist or can't be read, skip
			}
			// Check global MCPs
			const globalMcpPath = path.join(globalSettingsPath, globalFileNames_1.GlobalFileNames.mcpSettings)
			try {
				const content = await fs.readFile(globalMcpPath, "utf-8")
				const data = JSON.parse(content)
				if (data?.mcpServers && typeof data.mcpServers === "object") {
					for (const serverName of Object.keys(data.mcpServers)) {
						metadata[serverName] = {
							type: "mcp",
						}
					}
				}
			} catch (error) {
				// File doesn't exist or can't be read, skip
			}
		} catch (error) {
			console.error("Error checking global installations:", error)
		}
	}
}
exports.MarketplaceManager = MarketplaceManager
//# sourceMappingURL=MarketplaceManager.js.map
