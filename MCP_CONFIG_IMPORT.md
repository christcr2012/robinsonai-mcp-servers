# MCP Configuration Import Scripts

Two scripts to generate MCP server configuration JSON for Robinson AI's 4-server architecture.

## Quick Start

### Option 1: Non-Interactive (Recommended)

```bash
# 1. Copy the template
cp .env.example .env

# 2. Edit .env with your API keys
# (Use your favorite editor)

# 3. Generate config
node import-mcp-config.mjs
```

### Option 2: Interactive

```bash
# Prompts for each API key
node generate-mcp-config.mjs
```

## Scripts

### `import-mcp-config.mjs` (Non-Interactive)

**Best for:** Automation, CI/CD, quick setup

**Features:**
- Reads from `.env` file or environment variables
- No prompts - fully automated
- Supports custom env files: `--env-file .env.production`
- Supports custom output: `--output claude_desktop_config.json`

**Usage:**
```bash
# Default: reads .env, outputs augment-mcp-config.json
node import-mcp-config.mjs

# Custom env file
node import-mcp-config.mjs --env-file .env.production

# Generate for Claude Desktop
node import-mcp-config.mjs --output claude_desktop_config.json

# Both
node import-mcp-config.mjs --env-file .env.prod --output ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### `generate-mcp-config.mjs` (Interactive)

**Best for:** First-time setup, guided configuration

**Features:**
- Interactive prompts for each setting
- Press Enter to skip optional keys
- Shows summary of configured integrations

**Usage:**
```bash
# Interactive prompts
node generate-mcp-config.mjs

# Custom output location
node generate-mcp-config.mjs --output claude_desktop_config.json
```

## Environment Variables

### Required (for Ollama-based servers)

```bash
OLLAMA_BASE_URL=http://localhost:11434
```

### Optional (Architect MCP models)

```bash
ARCHITECT_FAST_MODEL=qwen2.5:3b          # ~5 seconds
ARCHITECT_STD_MODEL=deepseek-coder:33b   # ~45 seconds
ARCHITECT_BIG_MODEL=qwen2.5-coder:32b    # ~60 seconds
```

### Optional (Robinson's Toolkit integrations)

```bash
# GitHub (240 tools)
GITHUB_TOKEN=ghp_...

# Vercel (2 tools)
VERCEL_TOKEN=...

# Neon Database (160 tools)
NEON_API_KEY=...

# Google Workspace (192 tools)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Redis (3 tools)
REDIS_URL=redis://localhost:6379

# OpenAI (3 tools)
OPENAI_API_KEY=sk-...

# Resend Email
RESEND_API_KEY=re_...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...

# Cloudflare
CLOUDFLARE_API_TOKEN=...
```

## Output Format

Both scripts generate the same JSON format:

```json
{
  "mcpServers": {
    "architect-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/architect-mcp"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_FAST_MODEL": "qwen2.5:3b",
        "ARCHITECT_STD_MODEL": "deepseek-coder:33b",
        "ARCHITECT_BIG_MODEL": "qwen2.5-coder:32b"
      }
    },
    "autonomous-agent-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/autonomous-agent-mcp"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "credit-optimizer-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/credit-optimizer-mcp"],
      "env": {}
    },
    "robinsons-toolkit-mcp": {
      "command": "npx",
      "args": ["-y", "@robinsonai/robinsons-toolkit-mcp"],
      "env": {
        "GITHUB_TOKEN": "ghp_...",
        "VERCEL_TOKEN": "...",
        "NEON_API_KEY": "..."
      }
    }
  }
}
```

## Installation Locations

### Augment Code
```bash
# Already in project root
./augment-mcp-config.json
```

### Claude Desktop

**Mac:**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```bash
~/.config/Claude/claude_desktop_config.json
```

## Quick Copy Commands

### Mac (Claude Desktop)
```bash
node import-mcp-config.mjs --output ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Windows (Claude Desktop)
```powershell
node import-mcp-config.mjs --output $env:APPDATA\Claude\claude_desktop_config.json
```

### Linux (Claude Desktop)
```bash
node import-mcp-config.mjs --output ~/.config/Claude/claude_desktop_config.json
```

## Verification

After generating config, verify with diagnostic tools:

```bash
# In your MCP client (Augment, Claude Desktop, etc.)
diagnose_architect
diagnose_autonomous_agent
diagnose_credit_optimizer
diagnose_environment  # Robinson's Toolkit
```

## Troubleshooting

### "No .env file found"
- This is OK! Script will use system environment variables
- Or create `.env` from `.env.example`

### "No integrations configured"
- Add API keys to `.env` file
- Or set environment variables before running script

### "Command not found: npx"
- Install Node.js 18+ from https://nodejs.org

### Servers not appearing in MCP client
1. Fully quit and restart your MCP client
2. Check config file location is correct
3. Run diagnostic tools to verify

## Examples

### Minimal Setup (Ollama only)
```bash
# .env
OLLAMA_BASE_URL=http://localhost:11434

# Generate
node import-mcp-config.mjs
```

### Full Setup (All integrations)
```bash
# .env
OLLAMA_BASE_URL=http://localhost:11434
GITHUB_TOKEN=ghp_...
VERCEL_TOKEN=...
NEON_API_KEY=...
OPENAI_API_KEY=sk-...

# Generate
node import-mcp-config.mjs
```

### Production Setup
```bash
# .env.production
OLLAMA_BASE_URL=http://production-ollama:11434
GITHUB_TOKEN=ghp_prod_...
# ... other production keys

# Generate
node import-mcp-config.mjs --env-file .env.production --output augment-mcp-config.json
```

## Security Notes

- **Never commit `.env` files** - they contain secrets!
- `.env.example` is safe to commit (no real keys)
- Generated config files contain secrets - add to `.gitignore`
- Use different `.env` files for dev/staging/prod

## Support

For issues or questions:
- GitHub: https://github.com/robinsonai/robinsonai-mcp-servers
- Docs: See individual package READMEs

