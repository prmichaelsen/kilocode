import { Anthropic } from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ModelInfo, ProviderSettings } from "@roo-code/types";
import { ApiStream } from "../transform/stream";
import type { ApiHandler, ApiHandlerCreateMessageMetadata } from "../index";
import { virtualQuotaFallbackProfileDataSchema } from "../../../packages/types/src/provider-settings";
type VirtualQuotaFallbackProfile = z.infer<typeof virtualQuotaFallbackProfileDataSchema>;
/**
 * Virtual Quota Fallback Provider API processor.
 * This handler is designed to call other API handlers with automatic fallback when quota limits are reached.
 */
export declare class VirtualQuotaFallbackHandler implements ApiHandler {
    private settingsManager;
    private settings;
    private handlerConfigs;
    private activeHandler;
    private activeProfileId;
    private usage;
    private isInitialized;
    constructor(options: ProviderSettings);
    initialize(): Promise<void>;
    countTokens(content: Array<Anthropic.Messages.ContentBlockParam>): Promise<number>;
    createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[], metadata?: ApiHandlerCreateMessageMetadata): ApiStream;
    getModel(): {
        id: string;
        info: ModelInfo;
    };
    private loadConfiguredProfiles;
    adjustActiveHandler(reason?: string): Promise<void>;
    private notifyHandlerSwitch;
    private isRateLimitError;
    private isOverloadError;
    underLimit(profileData: VirtualQuotaFallbackProfile): boolean;
}
export {};
//# sourceMappingURL=virtual-quota-fallback.d.ts.map