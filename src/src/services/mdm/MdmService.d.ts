import { z } from "zod";
declare const mdmConfigSchema: any;
export type MdmConfig = z.infer<typeof mdmConfigSchema>;
export type ComplianceResult = {
    compliant: true;
} | {
    compliant: false;
    reason: string;
};
export declare class MdmService {
    private static _instance;
    private mdmConfig;
    private log;
    private constructor();
    /**
     * Initialize the MDM service by loading configuration
     */
    initialize(): Promise<void>;
    /**
     * Check if cloud authentication is required by MDM policy
     */
    requiresCloudAuth(): boolean;
    /**
     * Get the required organization ID from MDM policy
     */
    getRequiredOrganizationId(): string | undefined;
    /**
     * Check if the current state is compliant with MDM policy
     */
    isCompliant(): ComplianceResult;
    /**
     * Load MDM configuration from system location
     */
    private loadMdmConfig;
    /**
     * Get the platform-specific MDM configuration file path
     */
    private getMdmConfigPath;
    /**
     * Get the singleton instance
     */
    static getInstance(): MdmService;
    /**
     * Create and initialize the singleton instance
     */
    static createInstance(log?: (...args: unknown[]) => void): Promise<MdmService>;
    /**
     * Check if instance exists
     */
    static hasInstance(): boolean;
    /**
     * Reset the instance (for testing)
     */
    static resetInstance(): void;
}
export {};
//# sourceMappingURL=MdmService.d.ts.map