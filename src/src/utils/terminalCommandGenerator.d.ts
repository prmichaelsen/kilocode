import * as vscode from "vscode";
export interface TerminalCommandGeneratorOptions {
    outputChannel: vscode.OutputChannel;
    context: vscode.ExtensionContext;
}
export declare function generateTerminalCommand(options: TerminalCommandGeneratorOptions): Promise<void>;
//# sourceMappingURL=terminalCommandGenerator.d.ts.map