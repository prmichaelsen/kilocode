import type { RooTerminalCallbacks, RooTerminalProcessResultPromise } from "./types";
import { BaseTerminal } from "./BaseTerminal";
export declare class ExecaTerminal extends BaseTerminal {
    constructor(id: number, cwd: string);
    /**
     * Unlike the VSCode terminal, this is never closed.
     */
    isClosed(): boolean;
    runCommand(command: string, callbacks: RooTerminalCallbacks): RooTerminalProcessResultPromise;
}
//# sourceMappingURL=ExecaTerminal.d.ts.map