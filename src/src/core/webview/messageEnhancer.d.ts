import { ProviderSettings, ClineMessage } from "@roo-code/types";
import { ProviderSettingsManager } from "../config/ProviderSettingsManager";
export interface MessageEnhancerOptions {
    text: string;
    apiConfiguration: ProviderSettings;
    customSupportPrompts?: Record<string, any>;
    listApiConfigMeta: Array<{
        id: string;
        name?: string;
    }>;
    enhancementApiConfigId?: string;
    includeTaskHistoryInEnhance?: boolean;
    currentClineMessages?: ClineMessage[];
    providerSettingsManager: ProviderSettingsManager;
}
export interface MessageEnhancerResult {
    success: boolean;
    enhancedText?: string;
    error?: string;
}
/**
 * Enhances a message prompt using AI, optionally including task history for context
 */
export declare class MessageEnhancer {
    /**
     * Enhances a message prompt using the configured AI provider
     * @param options Configuration options for message enhancement
     * @returns Enhanced message result with success status
     */
    static enhanceMessage(options: MessageEnhancerOptions): Promise<MessageEnhancerResult>;
    /**
     * Extracts relevant task history from Cline messages for context
     * @param messages Array of Cline messages
     * @returns Formatted task history string
     */
    private static extractTaskHistory;
    /**
     * Captures telemetry for prompt enhancement
     * @param taskId Optional task ID for telemetry tracking
     * @param includeTaskHistory Whether task history was included in the enhancement
     */
    static captureTelemetry(taskId?: string, includeTaskHistory?: boolean): void;
}
//# sourceMappingURL=messageEnhancer.d.ts.map