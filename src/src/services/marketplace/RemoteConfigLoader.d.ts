import { type MarketplaceItem, type MarketplaceItemType } from "@roo-code/types";
export declare class RemoteConfigLoader {
    private apiBaseUrl;
    private cache;
    private cacheDuration;
    constructor();
    loadAllItems(hideMarketplaceMcps?: boolean): Promise<MarketplaceItem[]>;
    private fetchModes;
    private fetchMcps;
    private fetchWithRetry;
    getItem(id: string, type: MarketplaceItemType): Promise<MarketplaceItem | null>;
    private getFromCache;
    private setCache;
    clearCache(): void;
}
//# sourceMappingURL=RemoteConfigLoader.d.ts.map