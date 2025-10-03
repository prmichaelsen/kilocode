import * as vscode from "vscode";
import { type ProviderSettings, type GlobalSettings, type SecretState, type GlobalState, type RooCodeSettings } from "@roo-code/types";
type GlobalStateKey = keyof GlobalState;
type SecretStateKey = keyof SecretState;
type RooCodeSettingsKey = keyof RooCodeSettings;
export declare const isPassThroughStateKey: (key: string) => boolean;
export declare class ContextProxy {
    private readonly originalContext;
    private stateCache;
    private secretCache;
    private _isInitialized;
    constructor(context: vscode.ExtensionContext);
    get isInitialized(): boolean;
    get rawContext(): vscode.ExtensionContext;
    initialize(): Promise<void>;
    /**
     * Migrates old nested openRouterImageGenerationSettings to the new flattened structure
     */
    private migrateImageGenerationSettings;
    get extensionUri(): vscode.Uri;
    get extensionPath(): string;
    get globalStorageUri(): vscode.Uri;
    get logUri(): vscode.Uri;
    get extension(): vscode.Extension<any>;
    get extensionMode(): vscode.ExtensionMode;
    /**
     * ExtensionContext.globalState
     * https://code.visualstudio.com/api/references/vscode-api#ExtensionContext.globalState
     */
    getGlobalState<K extends GlobalStateKey>(key: K): GlobalState[K];
    getGlobalState<K extends GlobalStateKey>(key: K, defaultValue: GlobalState[K]): GlobalState[K];
    updateGlobalState<K extends GlobalStateKey>(key: K, value: GlobalState[K]): Thenable<void>;
    private getAllGlobalState;
    /**
     * ExtensionContext.secrets
     * https://code.visualstudio.com/api/references/vscode-api#ExtensionContext.secrets
     */
    getSecret(key: SecretStateKey): string;
    storeSecret(key: SecretStateKey, value?: string): Thenable<void>;
    /**
     * Refresh secrets from storage and update cache
     * This is useful when you need to ensure the cache has the latest values
     */
    refreshSecrets(): Promise<void>;
    private getAllSecretState;
    /**
     * WorkspaceState
     */
    updateWorkspaceState(context: vscode.ExtensionContext, key: string, value: any): Promise<void>;
    getWorkspaceState(context: vscode.ExtensionContext, key: string): Promise<unknown>;
    /**
     * GlobalSettings
     */
    getGlobalSettings(): GlobalSettings;
    /**
     * ProviderSettings
     */
    getProviderSettings(): ProviderSettings;
    setProviderSettings(values: ProviderSettings): Promise<void>;
    /**
     * RooCodeSettings
     */
    setValue<K extends RooCodeSettingsKey>(key: K, value: RooCodeSettings[K]): Promise<void>;
    getValue<K extends RooCodeSettingsKey>(key: K): RooCodeSettings[K];
    getValues(): RooCodeSettings;
    setValues(values: RooCodeSettings): Promise<void>;
    /**
     * Import / Export
     */
    export(): Promise<GlobalSettings | undefined>;
    /**
     * Resets all global state, secrets, and in-memory caches.
     * This clears all data from both the in-memory caches and the VSCode storage.
     * @returns A promise that resolves when all reset operations are complete
     */
    resetAllState(): Promise<void>;
    private static _instance;
    static get instance(): ContextProxy;
    static getInstance(context: vscode.ExtensionContext): Promise<ContextProxy>;
}
export {};
//# sourceMappingURL=ContextProxy.d.ts.map