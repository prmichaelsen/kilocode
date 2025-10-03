import { ClineRulesToggles } from "../../../shared/cline-rules";
type DirectoryExistsFunction = (dirPath: string) => Promise<boolean>;
type ReadTextFilesFromDirectoryFunction = (dirPath: string) => Promise<Array<{
    filename: string;
    content: string;
}>>;
export declare function loadEnabledRules(cwd: string, localRulesToggleState: ClineRulesToggles, globalRulesToggleState: ClineRulesToggles, directoryExists: DirectoryExistsFunction, readTextFilesFromDirectory: ReadTextFilesFromDirectoryFunction): Promise<string>;
export declare function hasAnyToggles(toggles?: ClineRulesToggles): boolean;
export {};
//# sourceMappingURL=kilo.d.ts.map