import { z } from "zod";
import { type ProviderSettings, type PromptComponent, type ModeConfig, type InstallMarketplaceItemOptions, type MarketplaceItem, type ShareVisibility, type QueuedMessage, CommitRange, HistoryItem } from "@roo-code/types";
import { Mode } from "./modes";
export type ClineAskResponse = "yesButtonClicked" | "noButtonClicked" | "messageResponse" | "objectResponse" | "retry_clicked";
export type PromptMode = Mode | "enhance";
export type AudioType = "notification" | "celebration" | "progress_loop";
export interface UpdateTodoListPayload {
    todos: any[];
}
export type EditQueuedMessagePayload = Pick<QueuedMessage, "id" | "text" | "images">;
export interface WebviewMessage {
    type: "updateTodoList" | "deleteMultipleTasksWithIds" | "currentApiConfigName" | "saveApiConfiguration" | "upsertApiConfiguration" | "deleteApiConfiguration" | "loadApiConfiguration" | "loadApiConfigurationById" | "renameApiConfiguration" | "getListApiConfiguration" | "customInstructions" | "allowedCommands" | "deniedCommands" | "alwaysAllowReadOnly" | "alwaysAllowReadOnlyOutsideWorkspace" | "alwaysAllowWrite" | "alwaysAllowWriteOutsideWorkspace" | "alwaysAllowWriteProtected" | "alwaysAllowExecute" | "alwaysAllowFollowupQuestions" | "alwaysAllowUpdateTodoList" | "followupAutoApproveTimeoutMs" | "webviewDidLaunch" | "newTask" | "askResponse" | "terminalOperation" | "clearTask" | "didShowAnnouncement" | "selectImages" | "exportCurrentTask" | "shareCurrentTask" | "showTaskWithId" | "deleteTaskWithId" | "exportTaskWithId" | "importSettings" | "toggleToolAutoApprove" | "openExtensionSettings" | "openInBrowser" | "fetchOpenGraphData" | "checkIsImageUrl" | "exportSettings" | "resetState" | "flushRouterModels" | "requestRouterModels" | "requestOpenAiModels" | "requestOllamaModels" | "requestLmStudioModels" | "requestVsCodeLmModels" | "requestHuggingFaceModels" | "openImage" | "saveImage" | "openFile" | "openMention" | "cancelTask" | "updateVSCodeSetting" | "getVSCodeSetting" | "vsCodeSetting" | "alwaysAllowBrowser" | "alwaysAllowMcp" | "alwaysAllowModeSwitch" | "allowedMaxRequests" | "allowedMaxCost" | "alwaysAllowSubtasks" | "alwaysAllowUpdateTodoList" | "autoCondenseContext" | "autoCondenseContextPercent" | "condensingApiConfigId" | "updateCondensingPrompt" | "playSound" | "playTts" | "stopTts" | "soundEnabled" | "ttsEnabled" | "ttsSpeed" | "soundVolume" | "diffEnabled" | "enableCheckpoints" | "browserViewportSize" | "screenshotQuality" | "remoteBrowserHost" | "openKeyboardShortcuts" | "openMcpSettings" | "openProjectMcpSettings" | "restartMcpServer" | "refreshAllMcpServers" | "toggleToolAlwaysAllow" | "toggleToolEnabledForPrompt" | "toggleMcpServer" | "updateMcpTimeout" | "fuzzyMatchThreshold" | "morphApiKey" | "fastApplyModel" | "writeDelayMs" | "diagnosticsEnabled" | "enhancePrompt" | "enhancedPrompt" | "draggedImages" | "deleteMessage" | "deleteMessageConfirm" | "submitEditedMessage" | "editMessageConfirm" | "terminalOutputLineLimit" | "terminalOutputCharacterLimit" | "terminalShellIntegrationTimeout" | "terminalShellIntegrationDisabled" | "terminalCommandDelay" | "terminalPowershellCounter" | "terminalZshClearEolMark" | "terminalZshOhMy" | "terminalZshP10k" | "terminalZdotdir" | "terminalCompressProgressBar" | "mcpEnabled" | "enableMcpServerCreation" | "remoteControlEnabled" | "taskSyncEnabled" | "searchCommits" | "alwaysApproveResubmit" | "requestDelaySeconds" | "setApiConfigPassword" | "mode" | "updatePrompt" | "updateSupportPrompt" | "getSystemPrompt" | "copySystemPrompt" | "systemPrompt" | "enhancementApiConfigId" | "commitMessageApiConfigId" | "terminalCommandApiConfigId" | "ghostServiceSettings" | "includeTaskHistoryInEnhance" | "updateExperimental" | "autoApprovalEnabled" | "updateCustomMode" | "deleteCustomMode" | "setopenAiCustomModelInfo" | "openCustomModesSettings" | "checkpointDiff" | "checkpointRestore" | "seeNewChanges" | "deleteMcpServer" | "maxOpenTabsContext" | "maxWorkspaceFiles" | "humanRelayResponse" | "humanRelayCancel" | "insertTextToChatArea" | "browserToolEnabled" | "codebaseIndexEnabled" | "telemetrySetting" | "showRooIgnoredFiles" | "testBrowserConnection" | "browserConnectionResult" | "remoteBrowserEnabled" | "language" | "maxReadFileLine" | "maxImageFileSize" | "maxTotalImageSize" | "maxConcurrentFileReads" | "allowVeryLargeReads" | "includeDiagnosticMessages" | "maxDiagnosticMessages" | "searchFiles" | "setHistoryPreviewCollapsed" | "showFeedbackOptions" | "toggleApiConfigPin" | "fetchMcpMarketplace" | "silentlyRefreshMcpMarketplace" | "fetchLatestMcpServersFromHub" | "downloadMcp" | "showSystemNotification" | "showAutoApproveMenu" | "reportBug" | "profileButtonClicked" | "fetchProfileDataRequest" | "profileDataResponse" | "fetchBalanceDataRequest" | "shopBuyCredits" | "balanceDataResponse" | "updateProfileData" | "condense" | "toggleWorkflow" | "refreshRules" | "toggleRule" | "createRuleFile" | "deleteRuleFile" | "hasOpenedModeSelector" | "cloudButtonClicked" | "rooCloudSignIn" | "cloudLandingPageSignIn" | "rooCloudSignOut" | "rooCloudManualUrl" | "switchOrganization" | "condenseTaskContextRequest" | "requestIndexingStatus" | "startIndexing" | "cancelIndexing" | "clearIndexData" | "indexingStatusUpdate" | "indexCleared" | "focusPanelRequest" | "profileThresholds" | "setHistoryPreviewCollapsed" | "clearUsageData" | "getUsageData" | "usageDataResponse" | "showTaskTimeline" | "toggleTaskFavorite" | "fixMermaidSyntax" | "mermaidFixResponse" | "openGlobalKeybindings" | "getKeybindings" | "setReasoningBlockCollapsed" | "openExternal" | "filterMarketplaceItems" | "mcpButtonClicked" | "marketplaceButtonClicked" | "installMarketplaceItem" | "installMarketplaceItemWithParameters" | "cancelMarketplaceInstall" | "removeInstalledMarketplaceItem" | "marketplaceInstallResult" | "fetchMarketplaceData" | "switchTab" | "profileThresholds" | "editMessage" | "systemNotificationsEnabled" | "dismissNotificationId" | "tasksByIdRequest" | "taskHistoryRequest" | "shareTaskSuccess" | "exportMode" | "exportModeResult" | "importMode" | "importModeResult" | "checkRulesDirectory" | "checkRulesDirectoryResult" | "saveCodeIndexSettingsAtomic" | "requestCodeIndexSecretStatus" | "fetchKilocodeNotifications" | "requestCommands" | "openCommandFile" | "deleteCommand" | "createCommand" | "insertTextIntoTextarea" | "showMdmAuthRequiredNotification" | "imageGenerationSettings" | "openRouterImageApiKey" | "kiloCodeImageApiKey" | "openRouterImageGenerationSelectedModel" | "queueMessage" | "removeQueuedMessage" | "editQueuedMessage" | "dismissUpsell" | "getDismissedUpsells";
    text?: string;
    editedMessageContent?: string;
    tab?: "settings" | "history" | "mcp" | "modes" | "chat" | "marketplace" | "cloud";
    disabled?: boolean;
    context?: string;
    dataUri?: string;
    askResponse?: ClineAskResponse;
    apiConfiguration?: ProviderSettings;
    images?: string[];
    bool?: boolean;
    value?: number;
    commands?: string[];
    audioType?: AudioType;
    notificationOptions?: {
        title?: string;
        subtitle?: string;
        message: string;
    };
    mcpId?: string;
    toolNames?: string[];
    autoApprove?: boolean;
    workflowPath?: string;
    enabled?: boolean;
    rulePath?: string;
    isGlobal?: boolean;
    filename?: string;
    ruleType?: string;
    notificationId?: string;
    commandIds?: string[];
    serverName?: string;
    toolName?: string;
    alwaysAllow?: boolean;
    isEnabled?: boolean;
    mode?: Mode;
    promptMode?: PromptMode;
    customPrompt?: PromptComponent;
    dataUrls?: string[];
    values?: Record<string, any>;
    query?: string;
    setting?: string;
    slug?: string;
    modeConfig?: ModeConfig;
    timeout?: number;
    payload?: WebViewMessagePayload;
    source?: "global" | "project";
    requestId?: string;
    ids?: string[];
    hasSystemPromptOverride?: boolean;
    terminalOperation?: "continue" | "abort";
    messageTs?: number;
    restoreCheckpoint?: boolean;
    historyPreviewCollapsed?: boolean;
    filters?: {
        type?: string;
        search?: string;
        tags?: string[];
    };
    settings?: any;
    url?: string;
    mpItem?: MarketplaceItem;
    mpInstallOptions?: InstallMarketplaceItemOptions;
    config?: Record<string, any>;
    visibility?: ShareVisibility;
    hasContent?: boolean;
    checkOnly?: boolean;
    upsellId?: string;
    list?: string[];
    organizationId?: string | null;
    codeIndexSettings?: {
        codebaseIndexEnabled: boolean;
        codebaseIndexQdrantUrl: string;
        codebaseIndexEmbedderProvider: "openai" | "ollama" | "openai-compatible" | "gemini" | "mistral" | "vercel-ai-gateway";
        codebaseIndexEmbedderBaseUrl?: string;
        codebaseIndexEmbedderModelId: string;
        codebaseIndexEmbedderModelDimension?: number;
        codebaseIndexOpenAiCompatibleBaseUrl?: string;
        codebaseIndexSearchMaxResults?: number;
        codebaseIndexSearchMinScore?: number;
        codeIndexOpenAiKey?: string;
        codeIndexQdrantApiKey?: string;
        codebaseIndexOpenAiCompatibleApiKey?: string;
        codebaseIndexGeminiApiKey?: string;
        codebaseIndexMistralApiKey?: string;
        codebaseIndexVercelAiGatewayApiKey?: string;
    };
}
export type OrganizationRole = "owner" | "admin" | "member";
export type UserOrganizationWithApiKey = {
    id: string;
    name: string;
    balance: number;
    role: OrganizationRole;
    apiKey: string;
};
export type ProfileData = {
    kilocodeToken: string;
    user: {
        id: string;
        name: string;
        email: string;
        image: string;
    };
    organizations?: UserOrganizationWithApiKey[];
};
export interface ProfileDataResponsePayload {
    success: boolean;
    data?: ProfileData;
    error?: string;
}
export interface BalanceDataResponsePayload {
    success: boolean;
    data?: any;
    error?: string;
}
export interface SeeNewChangesPayload {
    commitRange: CommitRange;
}
export interface TasksByIdRequestPayload {
    requestId: string;
    taskIds: string[];
}
export interface TaskHistoryRequestPayload {
    requestId: string;
    workspace: "current" | "all";
    sort: "newest" | "oldest" | "mostExpensive" | "mostTokens" | "mostRelevant";
    favoritesOnly: boolean;
    pageIndex: number;
    search?: string;
}
export interface TasksByIdResponsePayload {
    requestId: string;
    tasks: HistoryItem[];
}
export interface TaskHistoryResponsePayload {
    requestId: string;
    historyItems: HistoryItem[];
    pageIndex: number;
    pageCount: number;
}
export declare const checkoutDiffPayloadSchema: any;
export type CheckpointDiffPayload = z.infer<typeof checkoutDiffPayloadSchema>;
export declare const checkoutRestorePayloadSchema: any;
export type CheckpointRestorePayload = z.infer<typeof checkoutRestorePayloadSchema>;
export interface IndexingStatusPayload {
    state: "Standby" | "Indexing" | "Indexed" | "Error";
    message: string;
}
export interface IndexClearedPayload {
    success: boolean;
    error?: string;
}
export declare const installMarketplaceItemWithParametersPayloadSchema: any;
export type InstallMarketplaceItemWithParametersPayload = z.infer<typeof installMarketplaceItemWithParametersPayloadSchema>;
export type WebViewMessagePayload = ProfileDataResponsePayload | BalanceDataResponsePayload | SeeNewChangesPayload | TasksByIdRequestPayload | TaskHistoryRequestPayload | CheckpointDiffPayload | CheckpointRestorePayload | IndexingStatusPayload | IndexClearedPayload | InstallMarketplaceItemWithParametersPayload | UpdateTodoListPayload | EditQueuedMessagePayload;
//# sourceMappingURL=WebviewMessage.d.ts.map