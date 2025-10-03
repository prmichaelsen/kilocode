/**
 * Register a callback function for human relay response.
 * @param requestId
 * @param callback
 */
export declare const registerHumanRelayCallback: (requestId: string, callback: (response: string | undefined) => void) => Map<string, (response: string | undefined) => void>;
export declare const unregisterHumanRelayCallback: (requestId: string) => boolean;
export declare const handleHumanRelayResponse: (response: {
    requestId: string;
    text?: string;
    cancelled?: boolean;
}) => void;
//# sourceMappingURL=humanRelay.d.ts.map