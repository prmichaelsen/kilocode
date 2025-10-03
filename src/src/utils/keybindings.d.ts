export type KeybindingEntry = {
    key?: string;
    command?: string;
    when?: string;
    args?: unknown;
    mac?: string;
};
/**
 * Gets the current keybinding for a list of commands, reading from user's keybindings.json
 * and falling back to the extension's default keybinding from package.json
 */
export declare function getKeybindingsForCommands(commandIds: string[]): Promise<Record<string, string>>;
export declare function getKeybindingForCommand(commandId: string): Promise<string | undefined>;
/**
 * Gets the default keybinding for a command from package.json
 * @param commandId The command ID to look up
 * @returns The platform-specific keybinding string (guaranteed to exist for valid commands)
 * @throws Error if the command is not found in package.json keybindings
 */
export declare function getDefaultKeybindingForCommand(commandId: string): string;
//# sourceMappingURL=keybindings.d.ts.map