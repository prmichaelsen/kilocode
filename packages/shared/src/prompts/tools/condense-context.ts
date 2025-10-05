export function getCondenseContextDescription(args: { cwd: string }): string {
	return `## condense_context
Description: Request to manually condense the conversation context to reduce token usage. This tool uses an LLM to summarize older messages in the conversation history while preserving recent messages and essential context. Use this when you notice the conversation is getting long or when you want to optimize token usage before continuing with complex tasks.

The condensation process:
1. Preserves the most recent messages (default: 10) for immediate context
2. Summarizes older messages using an LLM to extract key information
3. Replaces the older messages with a concise summary
4. Maintains conversation continuity and essential context

When to use:
- When the conversation has many messages (20+) and you want to optimize token usage
- Before starting a complex multi-step task that will require many more messages
- When you notice context is getting cluttered with old information
- To improve response times by reducing the context window size

Parameters:
- preserve_recent: (optional) Number of recent messages to preserve without condensing (default: 10, min: 5, max: 20)
- force: (optional) Force condensation even if automatic thresholds aren't met (default: false)

Usage:
<condense_context>
<preserve_recent>10</preserve_recent>
<force>false</force>
</condense_context>

Example: Requesting to condense context while preserving last 15 messages
<condense_context>
<preserve_recent>15</preserve_recent>
<force>false</force>
</condense_context>

Example: Forcing condensation immediately
<condense_context>
<preserve_recent>10</preserve_recent>
<force>true</force>
</condense_context>`
}