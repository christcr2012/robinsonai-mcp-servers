# Robinson AI MCP Servers - Setup Instructions

## 🧪 STEP 1: Test Installation

First, install and test one of the servers:

```powershell
# Install the free-agent-mcp server globally
npm install -g @robinson_ai_systems/free-agent-mcp

# Test that it's installed
free-agent-mcp --help

# Or test by running it directly
node "C:\Users\chris\AppData\Roaming\npm\node_modules\@robinson_ai_systems\free-agent-mcp\dist\index.js"
```

## 🚀 STEP 2: Install All Servers

```powershell
npm install -g @robinson_ai_systems/free-agent-mcp
npm install -g @robinson_ai_systems/paid-agent-mcp
npm install -g @robinson_ai_systems/thinking-tools-mcp
npm install -g @robinson_ai_systems/credit-optimizer-mcp
npm install -g @robinson_ai_systems/github-mcp
npm install -g @robinson_ai_systems/vercel-mcp
npm install -g @robinson_ai_systems/neon-mcp
npm install -g @robinson_ai_systems/openai-mcp
```

## ⚙️ STEP 3: Configure Augment Code

### Option A: Use the config file I created
Copy `robinson-ai-mcp-config.json` to your Augment Code configuration directory.

### Option B: Manual configuration
Add this to your Augment Code MCP configuration:

```json
{
  "mcpServers": {
    "free-agent": {
      "command": "free-agent-mcp",
      "args": [],
      "env": {
        "OLLAMA_HOST": "http://localhost:11434"
      }
    },
    "paid-agent": {
      "command": "paid-agent-mcp",
      "args": [],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}"
      }
    },
    "thinking-tools": {
      "command": "thinking-tools-mcp"
    },
    "github": {
      "command": "github-mcp",
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

## 🔧 STEP 4: Set Environment Variables

Make sure you have these environment variables set:

```powershell
# Required for paid-agent and openai servers
$env:OPENAI_API_KEY = "your-openai-api-key"
$env:ANTHROPIC_API_KEY = "your-anthropic-api-key"

# Required for github server
$env:GITHUB_TOKEN = "your-github-token"

# Required for vercel server
$env:VERCEL_TOKEN = "your-vercel-token"

# Required for neon server
$env:NEON_API_KEY = "your-neon-api-key"

# Optional: Ollama host (defaults to localhost:11434)
$env:OLLAMA_HOST = "http://localhost:11434"
```

## 🎯 STEP 5: Test the Setup

Create a simple test script:

```javascript
// test-mcp.js
const { spawn } = require('child_process');

const server = spawn('free-agent-mcp', [], {
    stdio: ['pipe', 'pipe', 'pipe']
});

server.stdout.on('data', (data) => {
    console.log('Server output:', data.toString());
});

server.stderr.on('data', (data) => {
    console.log('Server error:', data.toString());
});

// Send a test message
const testMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
};

server.stdin.write(JSON.stringify(testMessage) + '\n');

setTimeout(() => server.kill(), 5000);
```

Run with: `node test-mcp.js`

## 🏆 SUCCESS!

Once configured, you'll have access to:
- **free-agent-mcp**: 0 credits, does most work
- **paid-agent-mcp**: For complex tasks
- **thinking-tools-mcp**: 24 cognitive frameworks
- **github-mcp**: 241 GitHub tools
- And 4 more specialized servers!

The system will automatically delegate work to save 96% in credits!
