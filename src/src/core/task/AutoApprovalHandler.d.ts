import { GlobalState, ClineMessage, ClineAsk } from "@roo-code/types";
import { ClineAskResponse } from "../../shared/WebviewMessage";
export interface AutoApprovalResult {
    shouldProceed: boolean;
    requiresApproval: boolean;
    approvalType?: "requests" | "cost";
    approvalCount?: number | string;
}
export declare class AutoApprovalHandler {
    private consecutiveAutoApprovedRequestsCount;
    private consecutiveAutoApprovedCost;
    /**
     * Check if auto-approval limits have been reached and handle user approval if needed
     */
    checkAutoApprovalLimits(state: GlobalState | undefined, messages: ClineMessage[], askForApproval: (type: ClineAsk, data: string) => Promise<{
        response: ClineAskResponse;
        text?: string;
        images?: string[];
    }>): Promise<AutoApprovalResult>;
    /**
     * Increment the request counter and check if limit is exceeded
     */
    private checkRequestLimit;
    /**
     * Calculate current cost and check if limit is exceeded
     */
    private checkCostLimit;
    /**
     * Reset the request counter (typically called when starting a new task)
     */
    resetRequestCount(): void;
    /**
     * Get current approval state for debugging/testing
     */
    getApprovalState(): {
        requestCount: number;
        currentCost: number;
    };
}
//# sourceMappingURL=AutoApprovalHandler.d.ts.map