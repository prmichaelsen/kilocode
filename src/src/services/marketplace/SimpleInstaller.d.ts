import * as vscode from "vscode";
import type { MarketplaceItem, InstallMarketplaceItemOptions } from "@roo-code/types";
import type { CustomModesManager } from "../../core/config/CustomModesManager";
export interface InstallOptions extends InstallMarketplaceItemOptions {
    target: "project" | "global";
    selectedIndex?: number;
}
export declare class SimpleInstaller {
    private readonly context;
    private readonly customModesManager?;
    constructor(context: vscode.ExtensionContext, customModesManager?: CustomModesManager);
    installItem(item: MarketplaceItem, options: InstallOptions): Promise<{
        filePath: string;
        line?: number;
    }>;
    private installMode;
    private installMcp;
    removeItem(item: MarketplaceItem, options: InstallOptions): Promise<void>;
    private removeMode;
    private removeMcp;
    private getModeFilePath;
    private getMcpFilePath;
}
//# sourceMappingURL=SimpleInstaller.d.ts.map