import { RooIgnoreController } from "../../core/ignore/RooIgnoreController";
/**
 * Get the current minimum number of lines for a component to be included
 */
export declare function getMinComponentLines(): number;
/**
 * Set the minimum number of lines for a component (for testing)
 */
export declare function setMinComponentLines(value: number): void;
declare const extensions: string[];
export { extensions };
export declare function parseSourceCodeDefinitionsForFile(filePath: string, rooIgnoreController?: RooIgnoreController): Promise<string | undefined>;
export declare function parseSourceCodeForDefinitionsTopLevel(dirPath: string, rooIgnoreController?: RooIgnoreController): Promise<string>;
//# sourceMappingURL=index.d.ts.map