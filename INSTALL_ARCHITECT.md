# 🚀 Install Architect MCP - Quick Guide

## ✅ Prerequisites (Already Done!)

- ✅ Ollama running on http://localhost:11434
- ✅ Models downloaded:
  - `deepseek-coder:33b` (recommended for Architect)
  - `qwen2.5-coder:32b` (fast alternative)
  - `codellama:34b` (balanced)
- ✅ Architect MCP built successfully

## 📋 Installation Steps

### 1. Import MCP Configuration

**For Augment Code VS Code Extension:**

1. Open Augment Code settings
2. Find "MCP Servers" configuration
3. Import the configuration from `augment-mcp-config.json`

**Or manually add:**

```json
{
  "mcpServers": {
    "architect-agent": {
      "command": "node",
      "args": ["c:/Users/chris/Git Local/robinsonai-mcp-servers/packages/architect-mcp/dist/index.js"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "ARCHITECT_MODEL": "deepseek-coder:33b"
      }
    }
  }
}
```

### 2. Restart Augment Code

Restart VS Code or reload the Augment Code extension to load the new MCP server.

### 3. Verify Installation

You should now see **Architect Agent** in your MCP servers list with 12 tools:

**Discovery & Context:**
- index_repo
- get_repo_map

**Planning:**
- plan_work
- export_workplan_to_optimizer

**Reviews & Insights:**
- revise_plan
- architecture_review
- generate_adr
- risk_register
- smell_scan
- security_review
- performance_review
- propose_patches

## 🎯 First Steps with Architect

### 1. Index Your Repository

```
Use tool: index_repo
Arguments: { "path": "c:/Users/chris/Git Local/robinsonai-mcp-servers" }
```

This will:
- Scan the codebase
- Detect framework (monorepo with TypeScript)
- Identify patterns (testing, package manager, etc.)
- Store insights in SQLite database

### 2. Create a WorkPlan

```
Use tool: plan_work
Arguments: {
  "intent": "Add Resend integration to Robinson's Toolkit with 15 tools for email management"
}
```

This will:
- Generate a detailed step-by-step plan
- Identify dependencies
- Suggest rollback strategies
- Estimate duration and credits (FREE!)

### 3. Review Architecture

```
Use tool: architecture_review
Arguments: { "repoMap": <from index_repo> }
```

This will:
- Analyze the 4-server architecture
- Identify strengths and weaknesses
- Provide prioritized recommendations
- Suggest improvements

### 4. Assess Risks

```
Use tool: risk_register
Arguments: {
  "repoMap": <from index_repo>,
  "plan": <from plan_work>
}
```

This will:
- Identify technical risks
- Assess severity (low/medium/high/critical)
- Suggest mitigation strategies

## 💡 Use Cases for Remaining Work

### Planning Tier 1 Integrations

```
plan_work: "Add Resend integration with 15 tools: send_email, templates, audiences, analytics"
plan_work: "Add Cloudflare R2 integration with 12 tools: upload, download, presigned URLs, buckets"
plan_work: "Add Sentry integration with 18 tools: issues, releases, alerts, performance"
```

### Architecture Review

```
architecture_review: Review the 4-server architecture and suggest improvements
```

### Risk Assessment

```
risk_register: Identify risks in adding 3 new integrations
security_review: Check for security vulnerabilities in new integrations
```

### Generate ADRs

```
generate_adr: Document decision to use 4-server architecture instead of unified server
generate_adr: Document decision to use Ollama for local LLMs
generate_adr: Document decision to use SQLite for caching
```

## 🔥 Power Workflow

**Use Architect to plan the remaining 73 tasks:**

1. **Index repo** → Get codebase context
2. **Plan work** → Create WorkPlan for each phase
3. **Review plan** → Critique and improve
4. **Risk assessment** → Identify potential issues
5. **Export to Credit Optimizer** → Execute the plan
6. **Deploy with Robinson's Toolkit** → Ship it!

## 📊 Expected Performance

- **Planning**: ~30-60 seconds per WorkPlan
- **Review**: ~20-40 seconds per review
- **Risk Assessment**: ~30-50 seconds
- **Code Smell Scan**: ~40-60 seconds

**All 100% FREE** - No API costs!

## 🎉 You're Ready!

Architect MCP is now installed and ready to help you:
- Plan the remaining 73 tasks
- Review architecture decisions
- Assess risks
- Generate documentation
- Propose patches

**Let's use Architect to plan the rest of the work!** 🚀

