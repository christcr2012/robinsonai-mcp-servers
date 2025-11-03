# OpenAI MCP Server - Usage Guide

## Quick Start

### 1. Installation

```bash
cd packages/openai-mcp
npm install
npm run build
```

### 2. Configuration

Set your OpenAI API key:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Or pass it as an argument:

```bash
node dist/index.js sk-proj-...
```

### 3. Configure in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "openai": {
      "command": "node",
      "args": [
        "/absolute/path/to/robinsonai-mcp-servers/packages/openai-mcp/dist/index.js"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-proj-...",
        "OPENAI_DAILY_BUDGET": "10.00",
        "OPENAI_MONTHLY_BUDGET": "200.00",
        "OPENAI_APPROVAL_THRESHOLD": "0.50",
        "OPENAI_DOUBLE
