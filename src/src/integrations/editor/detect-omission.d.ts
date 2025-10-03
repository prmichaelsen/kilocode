/**
 * Detects potential AI-generated code omissions in the given file content.
 * @param originalFileContent The original content of the file.
 * @param newFileContent The new content of the file to check.
 * @param predictedLineCount The predicted number of lines in the new content.
 * @returns True if a potential omission is detected, false otherwise.
 */
export declare function detectCodeOmission(originalFileContent: string, newFileContent: string, predictedLineCount: number): boolean;
//# sourceMappingURL=detect-omission.d.ts.map