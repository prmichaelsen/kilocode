import * as vscode from "vscode";
import * as os from "os";
import { modes, defaultModeSlug, getModeBySlug, getGroupName, getModeSelection } from "../../shared/modes";
import { formatLanguage } from "../../shared/language";
import { isEmpty } from "../../utils/object";
import { CodeIndexManager } from "../../services/code-index/manager";
import { loadSystemPromptFile } from "./sections/custom-system-prompt";
import { getToolDescriptionsForMode } from "./tools";
import { getRulesSection, getSystemInfoSection, getObjectiveSection, getSharedToolUseSection, getMcpServersSection, getToolUseGuidelinesSection, getCapabilitiesSection, getModesSection, addCustomInstructions, markdownFormattingSection, } from "./sections";
// Helper function to get prompt component, filtering out empty objects
export function getPromptComponent(customModePrompts, mode) {
    const component = customModePrompts?.[mode];
    // Return undefined if component is empty
    if (isEmpty(component)) {
        return undefined;
    }
    return component;
}
async function generatePrompt(context, cwd, supportsComputerUse, mode, mcpHub, diffStrategy, browserViewportSize, promptComponent, customModeConfigs, globalCustomInstructions, diffEnabled, experiments, enableMcpServerCreation, language, rooIgnoreInstructions, partialReadsEnabled, settings, todoList, modelId, clineProviderState) {
    if (!context) {
        throw new Error("Extension context is required for generating system prompt");
    }
    // If diff is disabled, don't pass the diffStrategy
    const effectiveDiffStrategy = diffEnabled ? diffStrategy : undefined;
    // Get the full mode config to ensure we have the role definition (used for groups, etc.)
    const modeConfig = getModeBySlug(mode, customModeConfigs) || modes.find((m) => m.slug === mode) || modes[0];
    const { roleDefinition, baseInstructions } = getModeSelection(mode, promptComponent, customModeConfigs);
    // Check if MCP functionality should be included
    const hasMcpGroup = modeConfig.groups.some((groupEntry) => getGroupName(groupEntry) === "mcp");
    const hasMcpServers = mcpHub && mcpHub.getServers().length > 0;
    const shouldIncludeMcp = hasMcpGroup && hasMcpServers;
    const [modesSection, mcpServersSection] = await Promise.all([
        getModesSection(context),
        shouldIncludeMcp
            ? getMcpServersSection(mcpHub, effectiveDiffStrategy, enableMcpServerCreation)
            : Promise.resolve(""),
    ]);
    const codeIndexManager = CodeIndexManager.getInstance(context, cwd);
    const basePrompt = `${roleDefinition}

${markdownFormattingSection()}

${getSharedToolUseSection()}

${getToolDescriptionsForMode(mode, cwd, supportsComputerUse, codeIndexManager, effectiveDiffStrategy, browserViewportSize, shouldIncludeMcp ? mcpHub : undefined, customModeConfigs, experiments, partialReadsEnabled, settings, enableMcpServerCreation, modelId, clineProviderState)}

${getToolUseGuidelinesSection(codeIndexManager)}

${mcpServersSection}

${getCapabilitiesSection(cwd, supportsComputerUse, shouldIncludeMcp ? mcpHub : undefined, effectiveDiffStrategy, codeIndexManager, clineProviderState /* kilocode_change */)}

${modesSection}

${getRulesSection(cwd, supportsComputerUse, effectiveDiffStrategy, codeIndexManager, clineProviderState /* kilocode_change */)}

${getSystemInfoSection(cwd)}

${getObjectiveSection(codeIndexManager, experiments)}

${await addCustomInstructions(baseInstructions, globalCustomInstructions || "", cwd, mode, {
        language: language ?? formatLanguage(vscode.env.language),
        rooIgnoreInstructions,
        localRulesToggleState: context.workspaceState.get("localRulesToggles"), // kilocode_change
        globalRulesToggleState: context.globalState.get("globalRulesToggles"), // kilocode_change
        settings,
    })}`;
    return basePrompt;
}
export const SYSTEM_PROMPT = async (context, cwd, supportsComputerUse, mcpHub, diffStrategy, browserViewportSize, inputMode = defaultModeSlug, // kilocode_change: name changed to inputMode
customModePrompts, customModes, globalCustomInstructions, diffEnabled, experiments, // kilocode_change: type
enableMcpServerCreation, language, rooIgnoreInstructions, partialReadsEnabled, settings, todoList, modelId, clineProviderState) => {
    if (!context) {
        throw new Error("Extension context is required for generating system prompt");
    }
    const mode = getModeBySlug(inputMode, customModes)?.slug || modes.find((m) => m.slug === inputMode)?.slug || defaultModeSlug; // kilocode_change: don't try to use non-existent modes
    // Try to load custom system prompt from file
    const variablesForPrompt = {
        workspace: cwd,
        mode: mode,
        language: language ?? formatLanguage(vscode.env.language),
        shell: vscode.env.shell,
        operatingSystem: os.type(),
    };
    const fileCustomSystemPrompt = await loadSystemPromptFile(cwd, mode, variablesForPrompt);
    // Check if it's a custom mode
    const promptComponent = getPromptComponent(customModePrompts, mode);
    // Get full mode config from custom modes or fall back to built-in modes
    const currentMode = getModeBySlug(mode, customModes) || modes.find((m) => m.slug === mode) || modes[0];
    // If a file-based custom system prompt exists, use it
    if (fileCustomSystemPrompt) {
        const { roleDefinition, baseInstructions: baseInstructionsForFile } = getModeSelection(mode, promptComponent, customModes);
        const customInstructions = await addCustomInstructions(baseInstructionsForFile, globalCustomInstructions || "", cwd, mode, {
            language: language ?? formatLanguage(vscode.env.language),
            rooIgnoreInstructions,
            settings,
        });
        // For file-based prompts, don't include the tool sections
        return `${roleDefinition}

${fileCustomSystemPrompt}

${customInstructions}`;
    }
    // If diff is disabled, don't pass the diffStrategy
    const effectiveDiffStrategy = diffEnabled ? diffStrategy : undefined;
    return generatePrompt(context, cwd, supportsComputerUse, currentMode.slug, mcpHub, effectiveDiffStrategy, browserViewportSize, promptComponent, customModes, globalCustomInstructions, diffEnabled, experiments, enableMcpServerCreation, language, rooIgnoreInstructions, partialReadsEnabled, settings, todoList, modelId, clineProviderState);
};
//# sourceMappingURL=system.js.map