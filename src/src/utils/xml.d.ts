/**
 * Options for XML parsing
 */
interface ParseXmlOptions {
    /**
     * Whether to process HTML entities (e.g., &amp; to &).
     * Default: true for general parsing, false for diff operations
     */
    processEntities?: boolean;
}
/**
 * Parses an XML string into a JavaScript object
 * @param xmlString The XML string to parse
 * @param stopNodes Optional array of node names to stop parsing at
 * @param options Optional parsing options
 * @returns Parsed JavaScript object representation of the XML
 * @throws Error if the XML is invalid or parsing fails
 */
export declare function parseXml(xmlString: string, stopNodes?: string[], options?: ParseXmlOptions): unknown;
/**
 * Parses an XML string for diffing purposes, ensuring no HTML entities are decoded.
 * This is a specialized version of parseXml to be used exclusively by diffing tools
 * to prevent mismatches caused by entity processing.
 *
 * Use this instead of parseXml when:
 * - Comparing parsed content against original file content
 * - Performing diff operations where exact character matching is required
 * - Processing XML that will be used in search/replace operations
 *
 * @param xmlString The XML string to parse
 * @param stopNodes Optional array of node names to stop parsing at
 * @returns Parsed JavaScript object representation of the XML
 * @throws Error if the XML is invalid or parsing fails
 */
export declare function parseXmlForDiff(xmlString: string, stopNodes?: string[]): unknown;
export {};
//# sourceMappingURL=xml.d.ts.map