export function getDiagnosticsSection(
  tokenUsage?: { input: number; output: number; total: number },
  messageCount?: number,
  toolExecutionCount?: number,
  sessionDuration?: number,
  currentCost?: number,
  taskId?: string,
  workingDirectory?: string,
  modelId?: string,
  mcpServerCount?: number,
  errorCount?: number,
  interruptionCount?: number,
  lastToolUsed?: string,
  contextUtilization?: number,
  condensationCount?: number,
  lastCondensationRatio?: number
): string {
  const diagnostics = `====

DIAGNOSTICS

Current conversation metrics and system state for observability:

## Context & Performance
- **Tokens Used**: ${tokenUsage ? `${tokenUsage.input.toLocaleString()} input + ${tokenUsage.output.toLocaleString()} output = ${tokenUsage.total.toLocaleString()} total` : 'Not available'}
- **Context Utilization**: ${contextUtilization ? `${(contextUtilization * 100).toFixed(1)}% of 1M context window` : 'Not available'}
- **Message Count**: ${messageCount || 'Not available'}
- **Session Duration**: ${sessionDuration ? `${Math.round(sessionDuration / 60000)} minutes` : 'Not available'}
- **Estimated Cost**: ${currentCost ? `$${currentCost.toFixed(4)}` : 'Not available'}

## System State
- **Task ID**: ${taskId || 'main'}
- **Model**: ${modelId || 'Claude Sonnet 4 (1M context)'}
- **Working Directory**: ${workingDirectory || 'Not available'}
- **MCP Servers**: ${mcpServerCount || 0} connected
- **Last Tool Used**: ${lastToolUsed || 'None'}

## Performance Metrics
- **Tool Executions**: ${toolExecutionCount || 0}
- **Error Count**: ${errorCount || 0}
- **Interruption Count**: ${interruptionCount || 0}

## Context Management
- **Auto-Condensation**: Enabled (triggers at 80% context utilization)
- **Condensation Count**: ${condensationCount || 0}
- **Last Compression Ratio**: ${lastCondensationRatio ? `${Math.round(lastCondensationRatio * 100)}%` : 'N/A'}
- **Manual Condensation**: Available via condense_context tool

This information helps you understand the current conversation context and system performance.`

  return diagnostics
}