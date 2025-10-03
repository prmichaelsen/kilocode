/**
 * Check if a port is open on a given host
 */
export declare function isPortOpen(host: string, port: number, timeout?: number): Promise<boolean>;
/**
 * Try to connect to Chrome at a specific IP address
 */
export declare function tryChromeHostUrl(chromeHostUrl: string): Promise<boolean>;
/**
 * Get Docker host IP
 */
export declare function getDockerHostIP(): Promise<string | null>;
/**
 * Scan a network range for Chrome debugging port
 */
export declare function scanNetworkForChrome(baseIP: string, port: number): Promise<string | null>;
/**
 * Test connection to a remote browser debugging websocket.
 * First tries specific hosts, then attempts auto-discovery if needed.
 * @param browserHostUrl Optional specific host URL to check first
 * @param port Browser debugging port (default: 9222)
 * @returns WebSocket debugger URL if connection is successful, null otherwise
 */
export declare function discoverChromeHostUrl(port?: number): Promise<string | null>;
//# sourceMappingURL=browserDiscovery.d.ts.map