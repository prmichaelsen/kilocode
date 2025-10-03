import { EventEmitter } from "events";
import type { RooTerminalProcess, RooTerminalProcessEvents, ExitCodeDetails } from "./types";
export declare abstract class BaseTerminalProcess extends EventEmitter<RooTerminalProcessEvents> implements RooTerminalProcess {
    command: string;
    isHot: boolean;
    protected hotTimer: NodeJS.Timeout | null;
    protected isListening: boolean;
    protected lastEmitTime_ms: number;
    protected fullOutput: string;
    protected lastRetrievedIndex: number;
    static interpretExitCode(exitCode: number | undefined): ExitCodeDetails;
    /**
     * Runs a shell command.
     * @param command The command to run
     */
    abstract run(command: string): Promise<void>;
    /**
     * Continues the process in the background.
     */
    abstract continue(): void;
    /**
     * Aborts the process via a SIGINT.
     */
    abstract abort(): void;
    /**
     * Checks if this process has unretrieved output.
     * @returns true if there is output that hasn't been fully retrieved yet
     */
    abstract hasUnretrievedOutput(): boolean;
    /**
     * Returns complete lines with their carriage returns.
     * The final line may lack a carriage return if the program didn't send one.
     * @returns The unretrieved output
     */
    abstract getUnretrievedOutput(): string;
    protected startHotTimer(data: string): void;
    protected stopHotTimer(): void;
    private static compilingMarkers;
    private static compilingMarkerNullifiers;
    private static isCompiling;
}
//# sourceMappingURL=BaseTerminalProcess.d.ts.map