// packages/thinking-tools-mcp/src/tools/health_check.ts

export const healthDescriptor = {
  name: "thinking_tools_health_check",
  description: "Report MCP server health and tool count.",
  inputSchema: { type: "object", properties: {} }
};

export async function healthTool(_: {}, __: any, allTools: string[] = []) {
  return { content: [{ type:"text", text: JSON.stringify({ ok: true, tools: allTools.length, names: allTools }, null, 2) }] };
}

