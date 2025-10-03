import type { RooTerminal } from "./types";
import { BaseTerminalProcess } from "./BaseTerminalProcess";
export declare class ExecaTerminalProcess extends BaseTerminalProcess {
    private terminalRef;
    private aborted;
    private pid?;
    private subprocess?;
    private pidUpdatePromise?;
    constructor(terminal: RooTerminal);
    get terminal(): RooTerminal;
    run(command: string): Promise<void>;
    continue(): void;
    abort(): void;
    hasUnretrievedOutput(): boolean;
    getUnretrievedOutput(): string;
    private emitRemainingBufferIfListening;
}
//# sourceMappingURL=ExecaTerminalProcess.d.ts.map