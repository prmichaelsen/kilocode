"use strict"
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod }
	}
Object.defineProperty(exports, "__esModule", { value: true })
exports.ProviderSettingsManager = exports.providerProfilesSchema = void 0
const zod_1 = require("zod")
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"))
const types_1 = require("@roo-code/types")
const telemetry_1 = require("@roo-code/telemetry")
const modes_1 = require("../../shared/modes")
const migrateMorphApiKey_1 = require("./kilocode/migrateMorphApiKey")
const MODEL_MIGRATIONS = {
	roo: {
		"roo/code-supernova": "roo/code-supernova-1-million",
	},
}
exports.providerProfilesSchema = zod_1.z.object({
	currentApiConfigName: zod_1.z.string(),
	apiConfigs: zod_1.z.record(zod_1.z.string(), types_1.providerSettingsWithIdSchema),
	modeApiConfigs: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
	cloudProfileIds: zod_1.z.array(zod_1.z.string()).optional(),
	migrations: zod_1.z
		.object({
			rateLimitSecondsMigrated: zod_1.z.boolean().optional(),
			diffSettingsMigrated: zod_1.z.boolean().optional(),
			openAiHeadersMigrated: zod_1.z.boolean().optional(),
			consecutiveMistakeLimitMigrated: zod_1.z.boolean().optional(),
			todoListEnabledMigrated: zod_1.z.boolean().optional(),
			morphApiKeyMigrated: zod_1.z.boolean().optional(), // kilocode_change: Morph API key migration
		})
		.optional(),
})
class ProviderSettingsManager {
	constructor(context) {
		Object.defineProperty(this, "defaultConfigId", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: this.generateId(),
		})
		Object.defineProperty(this, "defaultModeApiConfigs", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: Object.fromEntries(modes_1.modes.map((mode) => [mode.slug, this.defaultConfigId])),
		})
		Object.defineProperty(this, "defaultProviderProfiles", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: {
				currentApiConfigName: "default",
				apiConfigs: { default: { id: this.defaultConfigId } },
				modeApiConfigs: this.defaultModeApiConfigs,
				migrations: {
					rateLimitSecondsMigrated: true, // Mark as migrated on fresh installs
					diffSettingsMigrated: true, // Mark as migrated on fresh installs
					openAiHeadersMigrated: true, // Mark as migrated on fresh installs
					consecutiveMistakeLimitMigrated: true, // Mark as migrated on fresh installs
					todoListEnabledMigrated: true, // Mark as migrated on fresh installs
				},
			},
		})
		Object.defineProperty(this, "context", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: void 0,
		})
		// Synchronize readConfig/writeConfig operations to avoid data loss.
		Object.defineProperty(this, "_lock", {
			enumerable: true,
			configurable: true,
			writable: true,
			value: Promise.resolve(),
		})
		this.context = context
		// TODO: We really shouldn't have async methods in the constructor.
		this.initialize().catch(console.error)
	}
	generateId() {
		return Math.random().toString(36).substring(2, 15)
	}
	lock(cb) {
		const next = this._lock.then(cb)
		this._lock = next.catch(() => {})
		return next
	}
	/**
	 * Initialize config if it doesn't exist and run migrations.
	 */
	async initialize() {
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				if (!providerProfiles) {
					await this.store(this.defaultProviderProfiles)
					return
				}
				let isDirty = false
				// Migrate existing installs to have per-mode API config map
				if (!providerProfiles.modeApiConfigs) {
					// Use the currently selected config for all modes initially
					const currentName = providerProfiles.currentApiConfigName
					const seedId =
						providerProfiles.apiConfigs[currentName]?.id ??
						Object.values(providerProfiles.apiConfigs)[0]?.id ??
						this.defaultConfigId
					providerProfiles.modeApiConfigs = Object.fromEntries(modes_1.modes.map((m) => [m.slug, seedId]))
					isDirty = true
				}
				// Apply model migrations for all providers
				if (this.applyModelMigrations(providerProfiles)) {
					isDirty = true
				}
				// Ensure all configs have IDs.
				for (const [_name, apiConfig] of Object.entries(providerProfiles.apiConfigs)) {
					if (!apiConfig.id) {
						apiConfig.id = this.generateId()
						isDirty = true
					}
				}
				// Ensure migrations field exists
				if (!providerProfiles.migrations) {
					providerProfiles.migrations = {
						rateLimitSecondsMigrated: false,
						diffSettingsMigrated: false,
						openAiHeadersMigrated: false,
						consecutiveMistakeLimitMigrated: false,
						todoListEnabledMigrated: false,
						morphApiKeyMigrated: false, // kilocode_change: Morph API key migration
					} // Initialize with default values
					isDirty = true
				}
				if (!providerProfiles.migrations.rateLimitSecondsMigrated) {
					await this.migrateRateLimitSeconds(providerProfiles)
					providerProfiles.migrations.rateLimitSecondsMigrated = true
					isDirty = true
				}
				if (!providerProfiles.migrations.diffSettingsMigrated) {
					await this.migrateDiffSettings(providerProfiles)
					providerProfiles.migrations.diffSettingsMigrated = true
					isDirty = true
				}
				if (!providerProfiles.migrations.openAiHeadersMigrated) {
					await this.migrateOpenAiHeaders(providerProfiles)
					providerProfiles.migrations.openAiHeadersMigrated = true
					isDirty = true
				}
				if (!providerProfiles.migrations.consecutiveMistakeLimitMigrated) {
					await this.migrateConsecutiveMistakeLimit(providerProfiles)
					providerProfiles.migrations.consecutiveMistakeLimitMigrated = true
					isDirty = true
				}
				if (!providerProfiles.migrations.todoListEnabledMigrated) {
					await this.migrateTodoListEnabled(providerProfiles)
					providerProfiles.migrations.todoListEnabledMigrated = true
					isDirty = true
				}
				// kilocode_change start
				if (!providerProfiles.migrations.morphApiKeyMigrated) {
					const result = await (0, migrateMorphApiKey_1.migrateMorphApiKey)(this.context, providerProfiles)
					providerProfiles.migrations.morphApiKeyMigrated = true
					isDirty || (isDirty = result)
				}
				// kilocode_change end
				if (isDirty) {
					await this.store(providerProfiles)
				}
			})
		} catch (error) {
			throw new Error(`Failed to initialize config: ${error}`)
		}
	}
	async migrateRateLimitSeconds(providerProfiles) {
		try {
			let rateLimitSeconds
			try {
				rateLimitSeconds = await this.context.globalState.get("rateLimitSeconds")
			} catch (error) {
				console.error("[MigrateRateLimitSeconds] Error getting global rate limit:", error)
			}
			if (rateLimitSeconds === undefined) {
				// Failed to get the existing value, use the default.
				rateLimitSeconds = 0
			}
			for (const [_name, apiConfig] of Object.entries(providerProfiles.apiConfigs)) {
				if (apiConfig.rateLimitSeconds === undefined) {
					apiConfig.rateLimitSeconds = rateLimitSeconds
				}
			}
		} catch (error) {
			console.error(`[MigrateRateLimitSeconds] Failed to migrate rate limit settings:`, error)
		}
	}
	async migrateDiffSettings(providerProfiles) {
		try {
			let diffEnabled
			let fuzzyMatchThreshold
			try {
				diffEnabled = await this.context.globalState.get("diffEnabled")
				fuzzyMatchThreshold = await this.context.globalState.get("fuzzyMatchThreshold")
			} catch (error) {
				console.error("[MigrateDiffSettings] Error getting global diff settings:", error)
			}
			if (diffEnabled === undefined) {
				// Failed to get the existing value, use the default.
				diffEnabled = true
			}
			if (fuzzyMatchThreshold === undefined) {
				// Failed to get the existing value, use the default.
				fuzzyMatchThreshold = 1.0
			}
			for (const [_name, apiConfig] of Object.entries(providerProfiles.apiConfigs)) {
				if (apiConfig.diffEnabled === undefined) {
					apiConfig.diffEnabled = diffEnabled
				}
				if (apiConfig.fuzzyMatchThreshold === undefined) {
					apiConfig.fuzzyMatchThreshold = fuzzyMatchThreshold
				}
			}
		} catch (error) {
			console.error(`[MigrateDiffSettings] Failed to migrate diff settings:`, error)
		}
	}
	async migrateOpenAiHeaders(providerProfiles) {
		try {
			for (const [_name, apiConfig] of Object.entries(providerProfiles.apiConfigs)) {
				// Use type assertion to access the deprecated property safely
				const configAny = apiConfig
				// Check if openAiHostHeader exists but openAiHeaders doesn't
				if (
					configAny.openAiHostHeader &&
					(!apiConfig.openAiHeaders || Object.keys(apiConfig.openAiHeaders || {}).length === 0)
				) {
					// Create the headers object with the Host value
					apiConfig.openAiHeaders = { Host: configAny.openAiHostHeader }
					// Delete the old property to prevent re-migration
					// This prevents the header from reappearing after deletion
					configAny.openAiHostHeader = undefined
				}
			}
		} catch (error) {
			console.error(`[MigrateOpenAiHeaders] Failed to migrate OpenAI headers:`, error)
		}
	}
	async migrateConsecutiveMistakeLimit(providerProfiles) {
		try {
			for (const [name, apiConfig] of Object.entries(providerProfiles.apiConfigs)) {
				if (apiConfig.consecutiveMistakeLimit == null) {
					apiConfig.consecutiveMistakeLimit = types_1.DEFAULT_CONSECUTIVE_MISTAKE_LIMIT
				}
			}
		} catch (error) {
			console.error(`[MigrateConsecutiveMistakeLimit] Failed to migrate consecutive mistake limit:`, error)
		}
	}
	async migrateTodoListEnabled(providerProfiles) {
		try {
			for (const [_name, apiConfig] of Object.entries(providerProfiles.apiConfigs)) {
				if (apiConfig.todoListEnabled === undefined) {
					apiConfig.todoListEnabled = true
				}
			}
		} catch (error) {
			console.error(`[MigrateTodoListEnabled] Failed to migrate todo list enabled setting:`, error)
		}
	}
	/**
	 * Apply model migrations for all providers
	 * Returns true if any migrations were applied
	 */
	applyModelMigrations(providerProfiles) {
		let migrated = false
		try {
			for (const [_name, apiConfig] of Object.entries(providerProfiles.apiConfigs)) {
				// Skip configs without provider or model ID
				if (!apiConfig.apiProvider || !apiConfig.apiModelId) {
					continue
				}
				// Check if this provider has migrations (with type safety)
				const provider = apiConfig.apiProvider
				const providerMigrations = MODEL_MIGRATIONS[provider]
				if (!providerMigrations) {
					continue
				}
				// Check if the current model ID needs migration
				const newModelId = providerMigrations[apiConfig.apiModelId]
				if (newModelId && newModelId !== apiConfig.apiModelId) {
					console.log(
						`[ModelMigration] Migrating ${apiConfig.apiProvider} model from ${apiConfig.apiModelId} to ${newModelId}`,
					)
					apiConfig.apiModelId = newModelId
					migrated = true
				}
			}
		} catch (error) {
			console.error(`[ModelMigration] Failed to apply model migrations:`, error)
		}
		return migrated
	}
	/**
	 * Clean model ID by removing prefix before "/"
	 */
	cleanModelId(modelId) {
		if (!modelId) return undefined
		// Check for "/" and take the part after it
		if (modelId.includes("/")) {
			return modelId.split("/").pop()
		}
		return modelId
	}
	/**
	 * List all available configs with metadata.
	 */
	async listConfig() {
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				return Object.entries(providerProfiles.apiConfigs).map(([name, apiConfig]) => ({
					name,
					id: apiConfig.id || "",
					apiProvider: apiConfig.apiProvider,
					modelId: this.cleanModelId((0, types_1.getModelId)(apiConfig)),
				}))
			})
		} catch (error) {
			throw new Error(`Failed to list configs: ${error}`)
		}
	}
	/**
	 * Save a config with the given name.
	 * Preserves the ID from the input 'config' object if it exists,
	 * otherwise generates a new one (for creation scenarios).
	 */
	async saveConfig(name, config) {
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				// Preserve the existing ID if this is an update to an existing config.
				const existingId = providerProfiles.apiConfigs[name]?.id
				const id = config.id || existingId || this.generateId()
				// Filter out settings from other providers.
				const filteredConfig = types_1.discriminatedProviderSettingsWithIdSchema.parse(config)
				providerProfiles.apiConfigs[name] = { ...filteredConfig, id }
				await this.store(providerProfiles)
				return id
			})
		} catch (error) {
			throw new Error(`Failed to save config: ${error}`)
		}
	}
	async getProfile(params) {
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				let name
				let providerSettings
				if ("name" in params) {
					name = params.name
					if (!providerProfiles.apiConfigs[name]) {
						throw new Error(`Config with name '${name}' not found`)
					}
					providerSettings = providerProfiles.apiConfigs[name]
				} else {
					const id = params.id
					const entry = Object.entries(providerProfiles.apiConfigs).find(
						([_, apiConfig]) => apiConfig.id === id,
					)
					if (!entry) {
						throw new Error(`Config with ID '${id}' not found`)
					}
					name = entry[0]
					providerSettings = entry[1]
				}
				return { name, ...providerSettings }
			})
		} catch (error) {
			throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : error}`)
		}
	}
	/**
	 * Activate a profile by name or ID.
	 */
	async activateProfile(params) {
		const { name, ...providerSettings } = await this.getProfile(params)
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				providerProfiles.currentApiConfigName = name
				await this.store(providerProfiles)
				return { name, ...providerSettings }
			})
		} catch (error) {
			throw new Error(`Failed to activate profile: ${error instanceof Error ? error.message : error}`)
		}
	}
	/**
	 * Delete a config by name.
	 */
	async deleteConfig(name) {
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				if (!providerProfiles.apiConfigs[name]) {
					throw new Error(`Config '${name}' not found`)
				}
				if (Object.keys(providerProfiles.apiConfigs).length === 1) {
					throw new Error(`Cannot delete the last remaining configuration`)
				}
				delete providerProfiles.apiConfigs[name]
				await this.store(providerProfiles)
			})
		} catch (error) {
			throw new Error(`Failed to delete config: ${error}`)
		}
	}
	/**
	 * Check if a config exists by name.
	 */
	async hasConfig(name) {
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				return name in providerProfiles.apiConfigs
			})
		} catch (error) {
			throw new Error(`Failed to check config existence: ${error}`)
		}
	}
	/**
	 * Set the API config for a specific mode.
	 */
	async setModeConfig(mode, configId) {
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				// Ensure the per-mode config map exists
				if (!providerProfiles.modeApiConfigs) {
					providerProfiles.modeApiConfigs = {}
				}
				// Assign the chosen config ID to this mode
				providerProfiles.modeApiConfigs[mode] = configId
				await this.store(providerProfiles)
			})
		} catch (error) {
			throw new Error(`Failed to set mode config: ${error}`)
		}
	}
	/**
	 * Get the API config ID for a specific mode.
	 */
	async getModeConfigId(mode) {
		try {
			return await this.lock(async () => {
				const { modeApiConfigs } = await this.load()
				return modeApiConfigs?.[mode]
			})
		} catch (error) {
			throw new Error(`Failed to get mode config: ${error}`)
		}
	}
	async export() {
		try {
			return await this.lock(async () => {
				const profiles = exports.providerProfilesSchema.parse(await this.load())
				const configs = profiles.apiConfigs
				for (const name in configs) {
					// Avoid leaking properties from other providers.
					configs[name] = types_1.discriminatedProviderSettingsWithIdSchema.parse(configs[name])
				}
				return profiles
			})
		} catch (error) {
			throw new Error(`Failed to export provider profiles: ${error}`)
		}
	}
	async import(providerProfiles) {
		try {
			return await this.lock(() => this.store(providerProfiles))
		} catch (error) {
			throw new Error(`Failed to import provider profiles: ${error}`)
		}
	}
	/**
	 * Reset provider profiles by deleting them from secrets.
	 */
	async resetAllConfigs() {
		return await this.lock(async () => {
			await this.context.secrets.delete(this.secretsKey)
		})
	}
	get secretsKey() {
		return `${ProviderSettingsManager.SCOPE_PREFIX}api_config`
	}
	async load() {
		try {
			const content = await this.context.secrets.get(this.secretsKey)
			if (!content) {
				return this.defaultProviderProfiles
			}
			const providerProfiles = exports.providerProfilesSchema
				.extend({
					apiConfigs: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
				})
				.parse(JSON.parse(content))
			const apiConfigs = Object.entries(providerProfiles.apiConfigs).reduce((acc, [key, apiConfig]) => {
				const result = types_1.providerSettingsWithIdSchema.safeParse(apiConfig)
				return result.success ? { ...acc, [key]: result.data } : acc
			}, {})
			return {
				...providerProfiles,
				apiConfigs: Object.fromEntries(
					Object.entries(apiConfigs).filter(([_, apiConfig]) => apiConfig !== null),
				),
			}
		} catch (error) {
			if (error instanceof zod_1.ZodError) {
				telemetry_1.TelemetryService.instance.captureSchemaValidationError({
					schemaName: "ProviderProfiles",
					error,
				})
			}
			throw new Error(`Failed to read provider profiles from secrets: ${error}`)
		}
	}
	async store(providerProfiles) {
		try {
			await this.context.secrets.store(this.secretsKey, JSON.stringify(providerProfiles, null, 2))
		} catch (error) {
			throw new Error(`Failed to write provider profiles to secrets: ${error}`)
		}
	}
	findUniqueProfileName(baseName, existingNames) {
		if (!existingNames.has(baseName)) {
			return baseName
		}
		// Try _local first
		const localName = `${baseName}_local`
		if (!existingNames.has(localName)) {
			return localName
		}
		// Try _1, _2, etc.
		let counter = 1
		let candidateName
		do {
			candidateName = `${baseName}_${counter}`
			counter++
		} while (existingNames.has(candidateName))
		return candidateName
	}
	async syncCloudProfiles(cloudProfiles, currentActiveProfileName) {
		try {
			return await this.lock(async () => {
				const providerProfiles = await this.load()
				const changedProfiles = []
				const existingNames = new Set(Object.keys(providerProfiles.apiConfigs))
				let activeProfileChanged = false
				let activeProfileId = ""
				if (currentActiveProfileName && providerProfiles.apiConfigs[currentActiveProfileName]) {
					activeProfileId = providerProfiles.apiConfigs[currentActiveProfileName].id || ""
				}
				const currentCloudIds = new Set(providerProfiles.cloudProfileIds || [])
				const newCloudIds = new Set(
					Object.values(cloudProfiles)
						.map((p) => p.id)
						.filter((id) => Boolean(id)),
				)
				// Step 1: Delete profiles that are cloud-managed but not in the new cloud profiles
				for (const [name, profile] of Object.entries(providerProfiles.apiConfigs)) {
					if (profile.id && currentCloudIds.has(profile.id) && !newCloudIds.has(profile.id)) {
						// Check if we're deleting the active profile
						if (name === currentActiveProfileName) {
							activeProfileChanged = true
							activeProfileId = "" // Clear the active profile ID since it's being deleted
						}
						delete providerProfiles.apiConfigs[name]
						changedProfiles.push(name)
						existingNames.delete(name)
					}
				}
				// Step 2: Process each cloud profile
				for (const [cloudName, cloudProfile] of Object.entries(cloudProfiles)) {
					if (!cloudProfile.id) {
						continue // Skip profiles without IDs
					}
					// Find existing profile with matching ID
					const existingEntry = Object.entries(providerProfiles.apiConfigs).find(
						([_, profile]) => profile.id === cloudProfile.id,
					)
					if (existingEntry) {
						// Step 3: Update existing profile
						const [existingName, existingProfile] = existingEntry
						// Check if this is the active profile
						const isActiveProfile = existingName === currentActiveProfileName
						// Merge settings, preserving secret keys
						const updatedProfile = { ...cloudProfile }
						for (const [key, value] of Object.entries(existingProfile)) {
							if ((0, types_1.isSecretStateKey)(key) && value !== undefined) {
								updatedProfile[key] = value
							}
						}
						// Check if the profile actually changed using deepEqual
						const profileChanged = !(0, fast_deep_equal_1.default)(existingProfile, updatedProfile)
						// Handle name change
						if (existingName !== cloudName) {
							// Remove old entry
							delete providerProfiles.apiConfigs[existingName]
							existingNames.delete(existingName)
							// Handle name conflict
							let finalName = cloudName
							if (existingNames.has(cloudName)) {
								// There's a conflict - rename the existing non-cloud profile
								const conflictingProfile = providerProfiles.apiConfigs[cloudName]
								if (conflictingProfile.id !== cloudProfile.id) {
									const newName = this.findUniqueProfileName(cloudName, existingNames)
									providerProfiles.apiConfigs[newName] = conflictingProfile
									existingNames.add(newName)
									changedProfiles.push(newName)
								}
								delete providerProfiles.apiConfigs[cloudName]
								existingNames.delete(cloudName)
							}
							// Add updated profile with new name
							providerProfiles.apiConfigs[finalName] = updatedProfile
							existingNames.add(finalName)
							changedProfiles.push(finalName)
							if (existingName !== finalName) {
								changedProfiles.push(existingName) // Mark old name as changed (deleted)
							}
							// If this was the active profile, mark it as changed
							if (isActiveProfile) {
								activeProfileChanged = true
								activeProfileId = cloudProfile.id || ""
							}
						} else if (profileChanged) {
							// Same name, but profile content changed - update in place
							providerProfiles.apiConfigs[existingName] = updatedProfile
							changedProfiles.push(existingName)
							// If this was the active profile and settings changed, mark it as changed
							if (isActiveProfile) {
								activeProfileChanged = true
								activeProfileId = cloudProfile.id || ""
							}
						}
						// If name is the same and profile hasn't changed, do nothing
					} else {
						// Step 4: Add new cloud profile
						let finalName = cloudName
						// Handle name conflict with existing non-cloud profile
						if (existingNames.has(cloudName)) {
							const existingProfile = providerProfiles.apiConfigs[cloudName]
							if (existingProfile.id !== cloudProfile.id) {
								// Rename the existing profile
								const newName = this.findUniqueProfileName(cloudName, existingNames)
								providerProfiles.apiConfigs[newName] = existingProfile
								existingNames.add(newName)
								changedProfiles.push(newName)
								// Remove the old entry
								delete providerProfiles.apiConfigs[cloudName]
								existingNames.delete(cloudName)
							}
						}
						// Add the new cloud profile (without secret keys)
						const newProfile = { ...cloudProfile }
						// Remove any secret keys from cloud profile
						for (const key of Object.keys(newProfile)) {
							if ((0, types_1.isSecretStateKey)(key)) {
								delete newProfile[key]
							}
						}
						providerProfiles.apiConfigs[finalName] = newProfile
						existingNames.add(finalName)
						changedProfiles.push(finalName)
					}
				}
				// Step 5: Handle case where all profiles might be deleted
				if (Object.keys(providerProfiles.apiConfigs).length === 0 && changedProfiles.length > 0) {
					// Create a default profile only if we have changed profiles
					const defaultProfile = { id: this.generateId() }
					providerProfiles.apiConfigs["default"] = defaultProfile
					activeProfileChanged = true
					activeProfileId = defaultProfile.id || ""
					changedProfiles.push("default")
				}
				// Step 6: If active profile was deleted, find a replacement
				if (activeProfileChanged && !activeProfileId) {
					const firstProfile = Object.values(providerProfiles.apiConfigs)[0]
					if (firstProfile?.id) {
						activeProfileId = firstProfile.id
					}
				}
				// Step 7: Update cloudProfileIds
				providerProfiles.cloudProfileIds = Array.from(newCloudIds)
				// Save the updated profiles
				await this.store(providerProfiles)
				return {
					hasChanges: changedProfiles.length > 0,
					activeProfileChanged,
					activeProfileId,
				}
			})
		} catch (error) {
			throw new Error(`Failed to sync cloud profiles: ${error}`)
		}
	}
}
exports.ProviderSettingsManager = ProviderSettingsManager
Object.defineProperty(ProviderSettingsManager, "SCOPE_PREFIX", {
	enumerable: true,
	configurable: true,
	writable: true,
	value: "roo_cline_config_",
})
//# sourceMappingURL=ProviderSettingsManager.js.map
