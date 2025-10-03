import * as vscode from "vscode";
import EventEmitter from "events";
import { Anthropic } from "@anthropic-ai/sdk";
import { type TaskLike, type TaskMetadata, type TaskEvents, type ProviderSettings, type TokenUsage, type ToolUsage, type ToolName, type ContextCondense, type ClineMessage, type ClineSay, type ClineAsk, type ToolProgressStatus, type HistoryItem, type CreateTaskOptions, TaskStatus, TodoItem, QueuedMessage } from "@roo-code/types";
import { ApiHandler } from "../../api";
import { ApiStream } from "../../api/transform/stream";
import { ClineApiReqCancelReason } from "../../shared/ExtensionMessage";
import { ClineAskResponse } from "../../shared/WebviewMessage";
import { DiffStrategy } from "../../shared/tools";
import { UrlContentFetcher } from "../../services/browser/UrlContentFetcher";
import { BrowserSession } from "../../services/browser/BrowserSession";
import { RepoPerTaskCheckpointService } from "../../services/checkpoints";
import { DiffViewProvider } from "../../integrations/editor/DiffViewProvider";
import { RooTerminalProcess } from "../../integrations/terminal/types";
import { ToolRepetitionDetector } from "../tools/ToolRepetitionDetector";
import { FileContextTracker } from "../context-tracking/FileContextTracker";
import { RooIgnoreController } from "../ignore/RooIgnoreController";
import { RooProtectedController } from "../protect/RooProtectedController";
import { type AssistantMessageContent } from "../assistant-message";
import { AssistantMessageParser } from "../assistant-message/AssistantMessageParser";
import { ClineProvider } from "../webview/ClineProvider";
import { type ApiMessage } from "../task-persistence";
import { type CheckpointDiffOptions, type CheckpointRestoreOptions } from "../checkpoints";
import { MessageQueueService } from "../message-queue/MessageQueueService";
export interface TaskOptions extends CreateTaskOptions {
    context: vscode.ExtensionContext;
    provider: ClineProvider;
    apiConfiguration: ProviderSettings;
    enableDiff?: boolean;
    enableCheckpoints?: boolean;
    enableBridge?: boolean;
    fuzzyMatchThreshold?: number;
    consecutiveMistakeLimit?: number;
    task?: string;
    images?: string[];
    historyItem?: HistoryItem;
    experiments?: Record<string, boolean>;
    startTask?: boolean;
    rootTask?: Task;
    parentTask?: Task;
    taskNumber?: number;
    onCreated?: (task: Task) => void;
    initialTodos?: TodoItem[];
    workspacePath?: string;
}
type UserContent = Array<Anthropic.ContentBlockParam>;
export declare class Task extends EventEmitter<TaskEvents> implements TaskLike {
    private context;
    readonly taskId: string;
    private taskIsFavorited?;
    readonly rootTaskId?: string;
    readonly parentTaskId?: string;
    childTaskId?: string;
    readonly instanceId: string;
    readonly metadata: TaskMetadata;
    todoList?: TodoItem[];
    readonly rootTask: Task | undefined;
    readonly parentTask: Task | undefined;
    readonly taskNumber: number;
    readonly workspacePath: string;
    /**
     * The mode associated with this task. Persisted across sessions
     * to maintain user context when reopening tasks from history.
     *
     * ## Lifecycle
     *
     * ### For new tasks:
     * 1. Initially `undefined` during construction
     * 2. Asynchronously initialized from provider state via `initializeTaskMode()`
     * 3. Falls back to `defaultModeSlug` if provider state is unavailable
     *
     * ### For history items:
     * 1. Immediately set from `historyItem.mode` during construction
     * 2. Falls back to `defaultModeSlug` if mode is not stored in history
     *
     * ## Important
     * This property should NOT be accessed directly until `taskModeReady` promise resolves.
     * Use `getTaskMode()` for async access or `taskMode` getter for sync access after initialization.
     *
     * @private
     * @see {@link getTaskMode} - For safe async access
     * @see {@link taskMode} - For sync access after initialization
     * @see {@link waitForModeInitialization} - To ensure initialization is complete
     */
    private _taskMode;
    /**
     * Promise that resolves when the task mode has been initialized.
     * This ensures async mode initialization completes before the task is used.
     *
     * ## Purpose
     * - Prevents race conditions when accessing task mode
     * - Ensures provider state is properly loaded before mode-dependent operations
     * - Provides a synchronization point for async initialization
     *
     * ## Resolution timing
     * - For history items: Resolves immediately (sync initialization)
     * - For new tasks: Resolves after provider state is fetched (async initialization)
     *
     * @private
     * @see {@link waitForModeInitialization} - Public method to await this promise
     */
    private taskModeReady;
    providerRef: WeakRef<ClineProvider>;
    private readonly globalStoragePath;
    abort: boolean;
    idleAsk?: ClineMessage;
    resumableAsk?: ClineMessage;
    interactiveAsk?: ClineMessage;
    didFinishAbortingStream: boolean;
    abandoned: boolean;
    abortReason?: ClineApiReqCancelReason;
    isInitialized: boolean;
    isPaused: boolean;
    pausedModeSlug: string;
    private pauseInterval;
    readonly apiConfiguration: ProviderSettings;
    api: ApiHandler;
    private static lastGlobalApiRequestTime?;
    private autoApprovalHandler;
    /**
     * Reset the global API request timestamp. This should only be used for testing.
     * @internal
     */
    static resetGlobalApiRequestTime(): void;
    toolRepetitionDetector: ToolRepetitionDetector;
    rooIgnoreController?: RooIgnoreController;
    rooProtectedController?: RooProtectedController;
    fileContextTracker: FileContextTracker;
    urlContentFetcher: UrlContentFetcher;
    terminalProcess?: RooTerminalProcess;
    browserSession: BrowserSession;
    diffViewProvider: DiffViewProvider;
    diffStrategy?: DiffStrategy;
    diffEnabled: boolean;
    fuzzyMatchThreshold: number;
    didEditFile: boolean;
    apiConversationHistory: ApiMessage[];
    clineMessages: ClineMessage[];
    private askResponse?;
    private askResponseText?;
    private askResponseImages?;
    lastMessageTs?: number;
    consecutiveMistakeCount: number;
    consecutiveMistakeLimit: number;
    consecutiveMistakeCountForApplyDiff: Map<string, number>;
    toolUsage: ToolUsage;
    enableCheckpoints: boolean;
    checkpointService?: RepoPerTaskCheckpointService;
    checkpointServiceInitializing: boolean;
    enableBridge: boolean;
    readonly messageQueueService: MessageQueueService;
    private messageQueueStateChangedHandler;
    isWaitingForFirstChunk: boolean;
    isStreaming: boolean;
    currentStreamingContentIndex: number;
    currentStreamingDidCheckpoint: boolean;
    assistantMessageContent: AssistantMessageContent[];
    presentAssistantMessageLocked: boolean;
    presentAssistantMessageHasPendingUpdates: boolean;
    userMessageContent: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam)[];
    userMessageContentReady: boolean;
    didRejectTool: boolean;
    didAlreadyUseTool: boolean;
    didCompleteReadingStream: boolean;
    assistantMessageParser: AssistantMessageParser;
    private lastUsedInstructions?;
    private skipPrevResponseIdOnce;
    private tokenUsageSnapshot?;
    private tokenUsageSnapshotAt?;
    constructor({ context, // kilocode_change
    provider, apiConfiguration, enableDiff, enableCheckpoints, enableBridge, fuzzyMatchThreshold, consecutiveMistakeLimit, task, images, historyItem, startTask, rootTask, parentTask, taskNumber, onCreated, initialTodos, workspacePath, }: TaskOptions);
    private getContext;
    /**
     * Initialize the task mode from the provider state.
     * This method handles async initialization with proper error handling.
     *
     * ## Flow
     * 1. Attempts to fetch the current mode from provider state
     * 2. Sets `_taskMode` to the fetched mode or `defaultModeSlug` if unavailable
     * 3. Handles errors gracefully by falling back to default mode
     * 4. Logs any initialization errors for debugging
     *
     * ## Error handling
     * - Network failures when fetching provider state
     * - Provider not yet initialized
     * - Invalid state structure
     *
     * All errors result in fallback to `defaultModeSlug` to ensure task can proceed.
     *
     * @private
     * @param provider - The ClineProvider instance to fetch state from
     * @returns Promise that resolves when initialization is complete
     */
    private initializeTaskMode;
    /**
     * Wait for the task mode to be initialized before proceeding.
     * This method ensures that any operations depending on the task mode
     * will have access to the correct mode value.
     *
     * ## When to use
     * - Before accessing mode-specific configurations
     * - When switching between tasks with different modes
     * - Before operations that depend on mode-based permissions
     *
     * ## Example usage
     * ```typescript
     * // Wait for mode initialization before mode-dependent operations
     * await task.waitForModeInitialization();
     * const mode = task.taskMode; // Now safe to access synchronously
     *
     * // Or use with getTaskMode() for a one-liner
     * const mode = await task.getTaskMode(); // Internally waits for initialization
     * ```
     *
     * @returns Promise that resolves when the task mode is initialized
     * @public
     */
    waitForModeInitialization(): Promise<void>;
    /**
     * Get the task mode asynchronously, ensuring it's properly initialized.
     * This is the recommended way to access the task mode as it guarantees
     * the mode is available before returning.
     *
     * ## Async behavior
     * - Internally waits for `taskModeReady` promise to resolve
     * - Returns the initialized mode or `defaultModeSlug` as fallback
     * - Safe to call multiple times - subsequent calls return immediately if already initialized
     *
     * ## Example usage
     * ```typescript
     * // Safe async access
     * const mode = await task.getTaskMode();
     * console.log(`Task is running in ${mode} mode`);
     *
     * // Use in conditional logic
     * if (await task.getTaskMode() === 'architect') {
     *   // Perform architect-specific operations
     * }
     * ```
     *
     * @returns Promise resolving to the task mode string
     * @public
     */
    getTaskMode(): Promise<string>;
    /**
     * Get the task mode synchronously. This should only be used when you're certain
     * that the mode has already been initialized (e.g., after waitForModeInitialization).
     *
     * ## When to use
     * - In synchronous contexts where async/await is not available
     * - After explicitly waiting for initialization via `waitForModeInitialization()`
     * - In event handlers or callbacks where mode is guaranteed to be initialized
     *
     * ## Example usage
     * ```typescript
     * // After ensuring initialization
     * await task.waitForModeInitialization();
     * const mode = task.taskMode; // Safe synchronous access
     *
     * // In an event handler after task is started
     * task.on('taskStarted', () => {
     *   console.log(`Task started in ${task.taskMode} mode`); // Safe here
     * });
     * ```
     *
     * @throws {Error} If the mode hasn't been initialized yet
     * @returns The task mode string
     * @public
     */
    get taskMode(): string;
    static create(options: TaskOptions): [Task, Promise<void>];
    private getSavedApiConversationHistory;
    private addToApiConversationHistory;
    overwriteApiConversationHistory(newHistory: ApiMessage[]): Promise<void>;
    private saveApiConversationHistory;
    private getSavedClineMessages;
    private addToClineMessages;
    overwriteClineMessages(newMessages: ClineMessage[]): Promise<void>;
    private updateClineMessage;
    private saveClineMessages;
    private findMessageByTimestamp;
    ask(type: ClineAsk, text?: string, partial?: boolean, progressStatus?: ToolProgressStatus, isProtected?: boolean): Promise<{
        response: ClineAskResponse;
        text?: string;
        images?: string[];
    }>;
    setMessageResponse(text: string, images?: string[]): void;
    handleWebviewAskResponse(askResponse: ClineAskResponse, text?: string, images?: string[]): void;
    approveAsk({ text, images }?: {
        text?: string;
        images?: string[];
    }): void;
    denyAsk({ text, images }?: {
        text?: string;
        images?: string[];
    }): void;
    submitUserMessage(text: string, images?: string[], mode?: string, providerProfile?: string): Promise<void>;
    handleTerminalOperation(terminalOperation: "continue" | "abort"): Promise<void>;
    condenseContext(): Promise<void>;
    say(type: ClineSay, text?: string, images?: string[], partial?: boolean, checkpoint?: Record<string, unknown>, progressStatus?: ToolProgressStatus, options?: {
        isNonInteractive?: boolean;
        metadata?: Record<string, unknown>;
    }, contextCondense?: ContextCondense): Promise<undefined>;
    sayAndCreateMissingParamError(toolName: ToolName, paramName: string, relPath?: string): Promise<string>;
    private startTask;
    private resumeTaskFromHistory;
    abortTask(isAbandoned?: boolean): Promise<void>;
    dispose(): void;
    startSubtask(message: string, initialTodos: TodoItem[], mode: string): Promise<Task>;
    waitForSubtask(): Promise<void>;
    completeSubtask(lastMessage: string): Promise<void>;
    private initiateTaskLoop;
    recursivelyMakeClineRequests(userContent: Anthropic.Messages.ContentBlockParam[], includeFileDetails?: boolean): Promise<boolean>;
    loadContext(userContent: UserContent, includeFileDetails?: boolean): Promise<[UserContent, string, boolean]>;
    getSystemPrompt(): Promise<string>;
    private getCurrentProfileId;
    private handleContextWindowExceededError;
    attemptApiRequest(retryAttempt?: number): ApiStream;
    checkpointSave(force?: boolean, suppressMessage?: boolean): Promise<any>;
    checkpointRestore(options: CheckpointRestoreOptions): Promise<void>;
    checkpointDiff(options: CheckpointDiffOptions): Promise<void>;
    combineMessages(messages: ClineMessage[]): {
        type?: "ask" | "say";
        text?: string;
        reasoning?: string;
        ts?: number;
        ask?: "followup" | "command" | "command_output" | "completion_result" | "tool" | "api_req_failed" | "resume_task" | "resume_completed_task" | "mistake_limit_reached" | "browser_action_launch" | "use_mcp_server" | "auto_approval_max_req_reached" | "payment_required_prompt" | "invalid_model" | "report_bug" | "condense";
        say?: "command_output" | "completion_result" | "error" | "api_req_started" | "api_req_finished" | "api_req_retried" | "api_req_retry_delayed" | "api_req_deleted" | "text" | "image" | "reasoning" | "user_feedback" | "user_feedback_diff" | "shell_integration_warning" | "browser_action" | "browser_action_result" | "mcp_server_request_started" | "mcp_server_response" | "subtask_result" | "checkpoint_saved" | "rooignore_error" | "diff_error" | "condense_context" | "condense_context_error" | "codebase_search_result" | "user_edit_todos";
        images?: string[];
        partial?: boolean;
        conversationHistoryIndex?: number;
        checkpoint?: Record<string, unknown>;
        progressStatus?: {
            text?: string;
            icon?: string;
        };
        contextCondense?: {
            cost?: number;
            prevContextTokens?: number;
            newContextTokens?: number;
            summary?: string;
        };
        isProtected?: boolean;
        apiProtocol?: "openai" | "anthropic";
        isAnswered?: boolean;
        metadata?: {
            gpt5?: {
                previous_response_id?: string;
                instructions?: string;
                reasoning_summary?: string;
            };
            kiloCode?: {
                commitRange?: {
                    from?: string;
                    to?: string;
                };
            };
        };
    }[];
    getTokenUsage(): TokenUsage;
    recordToolUsage(toolName: ToolName): void;
    recordToolError(toolName: ToolName, error?: string): void;
    /**
     * Persist GPT-5 per-turn metadata (previous_response_id, instructions, reasoning_summary)
     * onto the last complete assistant say("text") message.
     */
    private persistGpt5Metadata;
    get taskStatus(): TaskStatus;
    get taskAsk(): ClineMessage | undefined;
    get queuedMessages(): QueuedMessage[];
    get tokenUsage(): TokenUsage | undefined;
    get cwd(): string;
    /**
     * Process any queued messages by dequeuing and submitting them.
     * This ensures that queued user messages are sent when appropriate,
     * preventing them from getting stuck in the queue.
     *
     * @param context - Context string for logging (e.g., the calling tool name)
     */
    processQueuedMessages(): void;
}
export {};
//# sourceMappingURL=Task.d.ts.map