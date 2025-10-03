import { ClineRulesToggles } from "../../shared/cline-rules";
/**
 * This file is a duplicate of parseSlashCommands, but it adds a check for the newrule command
 * and processes Kilo-specific slash commands. It should be merged with parseSlashCommands in the future.
 */
export declare function parseKiloSlashCommands(text: string, localWorkflowToggles: ClineRulesToggles, globalWorkflowToggles: ClineRulesToggles): Promise<{
    processedText: string;
    needsRulesFileCheck: boolean;
}>;
//# sourceMappingURL=kilo.d.ts.map