import { ExtensionContext } from "vscode";
import { z } from "zod";
import { type ProviderSettingsWithId, ProviderSettingsEntry } from "@roo-code/types";
import { Mode } from "../../shared/modes";
export interface SyncCloudProfilesResult {
    hasChanges: boolean;
    activeProfileChanged: boolean;
    activeProfileId: string;
}
export declare const providerProfilesSchema: any;
export type ProviderProfiles = z.infer<typeof providerProfilesSchema>;
export declare class ProviderSettingsManager {
    private static readonly SCOPE_PREFIX;
    private readonly defaultConfigId;
    private readonly defaultModeApiConfigs;
    private readonly defaultProviderProfiles;
    private readonly context;
    constructor(context: ExtensionContext);
    generateId(): string;
    private _lock;
    private lock;
    /**
     * Initialize config if it doesn't exist and run migrations.
     */
    initialize(): Promise<void>;
    private migrateRateLimitSeconds;
    private migrateDiffSettings;
    private migrateOpenAiHeaders;
    private migrateConsecutiveMistakeLimit;
    private migrateTodoListEnabled;
    /**
     * Apply model migrations for all providers
     * Returns true if any migrations were applied
     */
    private applyModelMigrations;
    /**
     * Clean model ID by removing prefix before "/"
     */
    private cleanModelId;
    /**
     * List all available configs with metadata.
     */
    listConfig(): Promise<ProviderSettingsEntry[]>;
    /**
     * Save a config with the given name.
     * Preserves the ID from the input 'config' object if it exists,
     * otherwise generates a new one (for creation scenarios).
     */
    saveConfig(name: string, config: ProviderSettingsWithId): Promise<string>;
    getProfile(params: {
        name: string;
    } | {
        id: string;
    }): Promise<ProviderSettingsWithId & {
        name: string;
    }>;
    /**
     * Activate a profile by name or ID.
     */
    activateProfile(params: {
        name: string;
    } | {
        id: string;
    }): Promise<ProviderSettingsWithId & {
        name: string;
    }>;
    /**
     * Delete a config by name.
     */
    deleteConfig(name: string): Promise<void>;
    /**
     * Check if a config exists by name.
     */
    hasConfig(name: string): Promise<boolean>;
    /**
     * Set the API config for a specific mode.
     */
    setModeConfig(mode: Mode, configId: string): Promise<void>;
    /**
     * Get the API config ID for a specific mode.
     */
    getModeConfigId(mode: Mode): Promise<z.infer<any>>;
    export(): Promise<any>;
    import(providerProfiles: ProviderProfiles): Promise<void>;
    /**
     * Reset provider profiles by deleting them from secrets.
     */
    resetAllConfigs(): Promise<void>;
    private get secretsKey();
    private load;
    private store;
    private findUniqueProfileName;
    syncCloudProfiles(cloudProfiles: Record<string, ProviderSettingsWithId>, currentActiveProfileName?: string): Promise<SyncCloudProfilesResult>;
}
//# sourceMappingURL=ProviderSettingsManager.d.ts.map