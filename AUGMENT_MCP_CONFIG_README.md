# Augment MCP Configuration Guide

## 📋 Overview

This repository uses a **5-server MCP architecture** designed to reduce Augment Code credit usage by 96-100%.

**Configuration File:** `augment-mcp-config.json` (git-ignored, contains secrets)  
**Template File:** `augment-mcp-config.TEMPLATE.json` (committed, safe to share)  
**Generator Script:** `generate-mcp-config.mjs` (interactive setup)

---

## 🏗️ 5-Server Architecture

### 1. **FREE Agent MCP** (0 credits)
- **Package:** `@robinson_ai_systems/free-agent-mcp`
- **Purpose:** Code generation, analysis, refactoring, testing with local Ollama
- **Models:** qwen2.5:3b (fast), qwen2.5-coder:7b (medium), deepseek-coder:33b (complex)
- **Concurrency:** 15 workers
- **Cost:** $0.00 (runs locally)

### 2. **PAID Agent MCP** (use sparingly)
- **Package:** `@robinson_ai_systems/paid-agent-mcp`
- **Purpose:** Complex tasks requiring OpenAI/Claude when FREE agent fails
- **Models:** gpt-4o-mini, gpt-4o, o1-mini
- **Budget:** $25/month (configurable)
- **Cost:** 500-2,000 credits per task

### 3. **Thinking Tools MCP** (52 tools)
- **Package:** `@robinson_ai_systems/thinking-tools-mcp@1.4.0`
- **Purpose:** Cognitive frameworks, context engine, web context
- **Features:**
  - 15 cognitive frameworks (SWOT, Devil's Advocate, Premortem, etc.)
  - Auto-populated cognitive operators (v1.4.0)
  - Evidence collector (TF-ish ranking)
  - LLM rewrite tools (optional quality upgrade)
  - Context7 integration
  - Web context (sitemap crawling, URL filtering)

### 4. **Credit Optimizer MCP**
- **Package:** `@robinson_ai_systems/credit-optimizer-mcp`
- **Purpose:** Tool discovery, templates, autonomous workflows
- **Features:**
  - Instant tool discovery (no AI needed)
  - Scaffolding templates (0 credits)
  - Autonomous multi-step workflows
  - Cost tracking and analytics

### 5. **Robinson's Toolkit MCP** (1,165 tools)
- **Package:** `@robinson_ai_systems/robinsons-toolkit-mcp`
- **Purpose:** Integration with external services
- **Categories:**
  - **GitHub** (241 tools) - Repos, issues, PRs, workflows, releases
  - **Vercel** (150 tools) - Deployments, projects, domains, env vars
  - **Neon** (166 tools) - Serverless Postgres databases
  - **Upstash** (157 tools) - Redis operations
  - **Google** (192 tools) - Gmail, Drive, Calendar, Sheets, Docs
  - **OpenAI** (259 tools) - Built-in, no separate OpenAI MCP needed!
- **Broker Mode:** Loads tools on-demand (saves tokens)

---

## 🚀 Setup Instructions

### Option 1: Use the Generator Script (Recommended)

```bash
node generate-mcp-config.mjs
```

This will:
1. Prompt you for API keys
2. Generate `augment-mcp-config.json` with your secrets
3. Show a summary of configured integrations

### Option 2: Copy from Template

```bash
# Copy template
cp augment-mcp-config.TEMPLATE.json augment-mcp-config.json

# Edit with your API keys
# Replace all "YOUR_*_HERE" placeholders
```

### Option 3: Manual Creation

Create `augment-mcp-config.json` in the project root with the structure from `augment-mcp-config.TEMPLATE.json`.

---

## 🔐 Security

### Git-Ignored Files

The following files are git-ignored to prevent committing secrets:

- `augment-mcp-config.json` (main config with secrets)
- `*-config.json` (all other config files)
- `.env` and `.env.*` (environment files)

### Safe to Commit

- `augment-mcp-config.TEMPLATE.json` (template without secrets)
- `generate-mcp-config.mjs` (generator script)
- `AUGMENT_MCP_CONFIG_README.md` (this file)

---

## 📦 Required API Keys

### Minimum Required (for basic functionality)

1. **OpenAI API Key** (for PAID Agent + Toolkit OpenAI tools)
2. **Anthropic API Key** (for PAID Agent Claude models)

### Optional (for specific integrations)

- **GitHub Token** - For GitHub tools (repos, issues, PRs)
- **Vercel Token** - For Vercel deployments
- **Neon API Key** - For Postgres database management
- **Upstash API Key** - For Redis operations
- **Google Service Account** - For Gmail, Drive, Calendar, Sheets
- **Tavily API Key** - For web search in Thinking Tools
- **SerpAPI Key** - For web search in Thinking Tools
- **Stripe Secret Key** - For payment processing
- **Supabase URL + Key** - For Supabase database
- **Resend API Key** - For email sending
- **Twilio SID + Token** - For SMS/voice
- **Cloudflare Token** - For Cloudflare operations

---

## 🎯 Usage Strategy

### Cost-Effective Workflow

1. **Try FREE Agent first** (0 credits)
   - Simple to medium complexity tasks
   - Standard code patterns
   - Refactoring and cleanup
   - Test generation

2. **Use PAID Agent when needed** (500-2,000 credits)
   - FREE agent fails or produces poor results
   - Complex algorithms or architectures
   - Critical production code
   - Expert-level tasks

3. **Never do it yourself** (13,000 credits)
   - Augment doing the work is 85-96% more expensive
   - Always delegate to FREE or PAID agents

### Example Savings

| Task | Augment Does It | FREE Agent | PAID Agent | Savings |
|------|----------------|------------|------------|---------|
| Generate 1 file | 13,000 credits | 0 credits | 500-2,000 credits | 96-100% |
| Analyze code | 13,000 credits | 0 credits | 500-1,000 credits | 96-100% |
| Refactor code | 13,000 credits | 0 credits | 500-1,500 credits | 96-100% |
| Write tests | 13,000 credits | 0 credits | 500-1,000 credits | 96-100% |

**Example:** Add 10 new tools
- Old way (Augment): 130,000 credits (~$13)
- New way (FREE agent): 0 credits ($0)
- **Savings: $13 (100%)**

---

## 🔧 Importing into Augment

### Method 1: Import from JSON (Recommended)

1. Open Augment Code
2. Go to Settings → MCP Servers
3. Click "Import from JSON"
4. Select `augment-mcp-config.json`
5. Restart Augment

### Method 2: Manual Entry

1. Open Augment Code
2. Go to Settings → MCP Servers
3. Add each server manually using the template as reference

---

## ✅ Verification

After importing, verify all 5 servers are running:

1. Check Augment MCP status indicator
2. Look for 5 connected servers:
   - Free Agent MCP
   - Paid Agent MCP
   - Thinking Tools MCP
   - Credit Optimizer MCP
   - Robinson's Toolkit MCP

3. Test a simple command:
   ```
   "Use FREE agent to analyze this file"
   ```

---

## 🐛 Troubleshooting

### Server Not Connecting

1. Check API keys are correct in `augment-mcp-config.json`
2. Verify Ollama is running (for FREE Agent and Thinking Tools)
3. Check network connectivity
4. Restart Augment

### Ollama Not Found

```bash
# Install Ollama
# Visit: https://ollama.ai

# Pull required models
ollama pull qwen2.5:3b
ollama pull qwen2.5-coder:7b
ollama pull deepseek-coder:33b
```

### GitHub Push Protection

If you accidentally commit secrets:

1. Remove the file from git:
   ```bash
   git rm --cached augment-mcp-config.json
   ```

2. Verify `.gitignore` includes:
   ```
   augment-mcp-config.json
   ```

3. Rotate compromised API keys immediately

---

## 📚 Additional Resources

- **System Architecture:** `.augment/rules/system-architecture.md`
- **MCP Tool Usage:** `.augment/rules/mcp-tool-usage.md`
- **Thinking Tools v1.4.0:** `THINKING_TOOLS_v1.4.0_COMPLETE_SUMMARY.md`
- **Current State:** `CURRENT_STATE.md`
- **Roadmap:** `ROADMAP.md`

---

## 🎉 Why This Matters

**Before:** Augment doing all the work = 13,000 credits per task  
**After:** FREE agent doing most work = 0 credits per task  

**Result:** 96-100% cost savings while maintaining quality! 🚀

---

**Last Updated:** November 2, 2025  
**Config Version:** 5-Server Architecture (OpenAI MCP excluded)

