import * as vscode from "vscode";
import type { ContextProxy } from "../config/ContextProxy";
import type { ClineRulesToggles } from "../../shared/cline-rules";
export interface RulesData {
    globalRules: ClineRulesToggles;
    localRules: ClineRulesToggles;
    globalWorkflows: ClineRulesToggles;
    localWorkflows: ClineRulesToggles;
}
export declare function getEnabledRules(workspacePath: string, contextProxy: ContextProxy, context: vscode.ExtensionContext): Promise<RulesData>;
export declare function toggleWorkflow(workflowPath: string, enabled: boolean, isGlobal: boolean, contextProxy: ContextProxy, context: vscode.ExtensionContext): Promise<void>;
export declare function toggleRule(rulePath: string, enabled: boolean, isGlobal: boolean, contextProxy: ContextProxy, context: vscode.ExtensionContext): Promise<void>;
export declare function createRuleFile(filename: string, isGlobal: boolean, ruleType: "rule" | "workflow"): Promise<void>;
export declare function deleteRuleFile(rulePath: string): Promise<void>;
//# sourceMappingURL=kilorules.d.ts.map