import { ToolArgs } from "./types.js"

export function getChangeWorkingDirectoryDescription(args: ToolArgs): string {
	return `## change_working_directory
Description: IMPORTANT: You may only run this tool if the user explicitly tells you to. Request to change the current working directory for all subsequent file operations and command executions. This tool allows you to navigate to different directories within the workspace, and all relative paths in future operations will be resolved relative to the new working directory.
Parameters:
- path: (required) The path of the directory to change to (relative to the current working directory ${args.cwd} or absolute path)
Usage:
<change_working_directory>
<path>Directory path here</path>
</change_working_directory>

Examples:

1. Change to a subdirectory:
<change_working_directory>
<path>src/components</path>
</change_working_directory>

2. Change to parent directory:
<change_working_directory>
<path>..</path>
</change_working_directory>

3. Change to absolute path:
<change_working_directory>
<path>/home/user/projects</path>
</change_working_directory>

IMPORTANT: After changing the working directory, all subsequent file operations (read_file, write_to_file, search_and_replace) and command executions will be relative to the new directory. The working directory persists across the entire task session and is saved for task resumption.`
}