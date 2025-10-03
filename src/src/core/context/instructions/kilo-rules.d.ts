/**
 * Converts .kilocode/rules file to directory and places old .kilocode/rules file inside directory, renaming it
 * Doesn't do anything if .kilocode/rules dir already exists or doesn't exist
 * Returns whether there are any uncaught errors
 */
export declare function ensureLocalKilorulesDirExists(kilorulePath: string, defaultRuleFilename: string): Promise<boolean>;
//# sourceMappingURL=kilo-rules.d.ts.map