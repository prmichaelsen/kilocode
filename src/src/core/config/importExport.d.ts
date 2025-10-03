import * as vscode from "vscode";
import { ProviderSettingsManager } from "./ProviderSettingsManager";
import { ContextProxy } from "./ContextProxy";
import { CustomModesManager } from "./CustomModesManager";
export type ImportOptions = {
    providerSettingsManager: ProviderSettingsManager;
    contextProxy: ContextProxy;
    customModesManager: CustomModesManager;
};
type ExportOptions = {
    providerSettingsManager: ProviderSettingsManager;
    contextProxy: ContextProxy;
};
type ImportWithProviderOptions = ImportOptions & {
    provider: {
        settingsImportedAt?: number;
        postStateToWebview: () => Promise<void>;
    };
};
/**
 * Imports configuration from a specific file path
 * Shares base functionality for import settings for both the manual
 * and automatic settings importing
 */
export declare function importSettingsFromPath(filePath: string, { providerSettingsManager, contextProxy, customModesManager }: ImportOptions): Promise<{
    providerProfiles: {
        currentApiConfigName: any;
        apiConfigs: any;
        modeApiConfigs: any;
    };
    globalSettings: any;
    success: boolean;
    readonly error?: undefined;
} | {
    success: boolean;
    error: string;
    providerProfiles?: undefined;
    globalSettings?: undefined;
}>;
/**
 * Import settings from a file using a file dialog
 * @param options - Import options containing managers and proxy
 * @returns Promise resolving to import result
 */
export declare const importSettings: ({ providerSettingsManager, contextProxy, customModesManager }: ImportOptions) => Promise<{
    providerProfiles: {
        currentApiConfigName: any;
        apiConfigs: any;
        modeApiConfigs: any;
    };
    globalSettings: any;
    success: boolean;
    readonly error?: undefined;
} | {
    success: boolean;
    error: string;
    providerProfiles?: undefined;
    globalSettings?: undefined;
}>;
/**
 * Import settings from a specific file
 * @param options - Import options containing managers and proxy
 * @param fileUri - URI of the file to import from
 * @returns Promise resolving to import result
 */
export declare const importSettingsFromFile: ({ providerSettingsManager, contextProxy, customModesManager }: ImportOptions, fileUri: vscode.Uri) => Promise<{
    providerProfiles: {
        currentApiConfigName: any;
        apiConfigs: any;
        modeApiConfigs: any;
    };
    globalSettings: any;
    success: boolean;
    readonly error?: undefined;
} | {
    success: boolean;
    error: string;
    providerProfiles?: undefined;
    globalSettings?: undefined;
}>;
export declare const exportSettings: ({ providerSettingsManager, contextProxy }: ExportOptions) => Promise<void>;
/**
 * Import settings with complete UI feedback and provider state updates
 * @param options - Import options with provider instance
 * @param filePath - Optional file path to import from. If not provided, a file dialog will be shown.
 * @returns Promise that resolves when import is complete
 */
export declare const importSettingsWithFeedback: ({ providerSettingsManager, contextProxy, customModesManager, provider }: ImportWithProviderOptions, filePath?: string) => Promise<void>;
export {};
//# sourceMappingURL=importExport.d.ts.map