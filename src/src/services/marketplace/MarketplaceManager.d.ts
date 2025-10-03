import * as vscode from "vscode";
import type { MarketplaceItem, MarketplaceItemType } from "@roo-code/types";
import type { CustomModesManager } from "../../core/config/CustomModesManager";
export interface MarketplaceItemsResponse {
    organizationMcps: MarketplaceItem[];
    marketplaceItems: MarketplaceItem[];
    errors?: string[];
}
export declare class MarketplaceManager {
    private readonly context;
    private readonly customModesManager?;
    private configLoader;
    private installer;
    constructor(context: vscode.ExtensionContext, customModesManager?: CustomModesManager);
    getMarketplaceItems(): Promise<MarketplaceItemsResponse>;
    getCurrentItems(): Promise<MarketplaceItem[]>;
    filterItems(items: MarketplaceItem[], filters: {
        type?: MarketplaceItemType;
        search?: string;
        tags?: string[];
    }): MarketplaceItem[];
    updateWithFilteredItems(filters: {
        type?: MarketplaceItemType;
        search?: string;
        tags?: string[];
    }): Promise<MarketplaceItem[]>;
    installMarketplaceItem(item: MarketplaceItem, options?: {
        target?: "global" | "project";
        parameters?: Record<string, any>;
    }): Promise<string>;
    removeInstalledMarketplaceItem(item: MarketplaceItem, options?: {
        target?: "global" | "project";
    }): Promise<void>;
    cleanup(): Promise<void>;
    /**
     * Get installation metadata by checking config files for installed items
     */
    getInstallationMetadata(): Promise<{
        project: Record<string, {
            type: string;
        }>;
        global: Record<string, {
            type: string;
        }>;
    }>;
    /**
     * Check for project-level installed items
     */
    private checkProjectInstallations;
    /**
     * Check for global-level installed items
     */
    private checkGlobalInstallations;
}
//# sourceMappingURL=MarketplaceManager.d.ts.map