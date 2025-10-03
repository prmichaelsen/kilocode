/**
 * Asynchronously creates all non-existing subdirectories for a given file path
 * and collects them in an array for later deletion.
 *
 * @param filePath - The full path to a file.
 * @returns A promise that resolves to an array of newly created directories.
 */
export declare function createDirectoriesForFile(filePath: string): Promise<string[]>;
/**
 * Helper function to check if a path exists.
 *
 * @param path - The path to check.
 * @returns A promise that resolves to true if the path exists, false otherwise.
 */
export declare function fileExistsAtPath(filePath: string): Promise<boolean>;
/**
 * Checks if the path is a directory
 * @param filePath - The path to check.
 * @returns A promise that resolves to true if the path is a directory, false otherwise.
 */
export declare function isDirectory(filePath: string): Promise<boolean>;
/**
 * Recursively reads a directory and returns an array of absolute file paths.
 *
 * @param directoryPath - The path to the directory to read.
 * @param excludedPaths - Nested array of paths to ignore.
 * @returns A promise that resolves to an array of absolute file paths.
 * @throws Error if the directory cannot be read.
 */
export declare const readDirectory: (directoryPath: string, excludedPaths?: string[][]) => Promise<string[]>;
//# sourceMappingURL=fs.d.ts.map