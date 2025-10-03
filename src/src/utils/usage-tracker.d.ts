import type { ExtensionContext } from "vscode";
import { UsageResultByDuration, UsageResult, UsageType, UsageWindow } from "@roo-code/types";
export declare class UsageTracker {
    private static _instance;
    private memento;
    private constructor();
    static initialize(context: ExtensionContext): UsageTracker;
    static getInstance(): UsageTracker;
    consume(providerId: string, type: UsageType, count: number): Promise<void>;
    getUsage(providerId: string, window: UsageWindow): UsageResult;
    getAllUsage(providerId: string): UsageResultByDuration;
    private getPrunedEvents;
    clearAllUsageData(): Promise<void>;
    setCooldown(providerId: string, durationMs: number): Promise<void>;
    isUnderCooldown(providerId: string): Promise<boolean>;
    private getPrunedCooldowns;
}
//# sourceMappingURL=usage-tracker.d.ts.map