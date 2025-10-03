import * as vscode from "vscode";
import { ClineRulesToggles } from "../../../shared/cline-rules";
export declare function refreshWorkflowToggles(context: vscode.ExtensionContext, workingDirectory: string): Promise<{
    globalWorkflowToggles: ClineRulesToggles;
    localWorkflowToggles: ClineRulesToggles;
}>;
//# sourceMappingURL=workflows.d.ts.map