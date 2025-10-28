# Robinson's Toolkit - Quick Reference Guide

**Fast lookup for common tasks**

---

## File Locations

| What | Where |
|------|-------|
| Main source file | `src/index.ts` (7,108 lines) |
| Compiled output | `dist/index.js` |
| Configuration | `package.json`, `tsconfig.json` |
| Augment config | `%APPDATA%\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServers.json` |
| Environment vars | `.env` or Augment config `env` section |

---

## Key Line Numbers in src/index.ts

| Section | Lines | Description |
|---------|-------|-------------|
| Imports | 1-10 | MCP SDK, axios, types |
| Class declaration | 27-59 | UnifiedToolkit class & constructor |
| GitHub client | 61-97 | Custom GitHub fetch & client |
| Error handling | 99-108 | Error handlers & SIGINT |
| Tool registration | 110-2528 | All 563 tool definitions |
| Tool execution | 2530-3420 | Switch statement routing |
| Helper methods | 3420-3463 | formatResponse, fetch helpers |
| GitHub methods | 3466-4825 | 240 GitHub tool implementations |
| Vercel methods | 4826-6245 | 150 Vercel tool implementations |
| Neon methods | 6246-7090 | 173 Neon tool implementations |
| Server startup | 7098-7107 | Run method & server start |

---

## Current Status

| Metric | Value |
|--------|-------|
| **Total tools** | 563 (target) |
| **Showing in VS Code** | 556 |
| **Missing** | 7 (needs investigation) |
| **GitHub tools** | 240 ✅ |
| **Vercel tools** | 150 ✅ |
| **Neon tools** | 173 ✅ |

---

## Common Commands

### **Build**
```bash
cd packages/robinsons-toolkit-mcp
npm run build
```

### **Watch mode (auto-rebuild)**
```bash
npm run dev
```

### **Run directly**
```bash
node dist/index.js
```

### **Link globally**
```bash
npm link
robinsons-toolkit-mcp
```

---

## Environment Variables

### **Required**

```bash
GITHUB_TOKEN=ghp_...        # GitHub personal access token (starts with ghp_ or gho_)
VERCEL_TOKEN=...            # Vercel API token
NEON_API_KEY=napi_...       # Neon API key (starts with napi_)
```

### **Proven Working Configuration**

This is the actual tested configuration from the development environment (with secrets replaced):

**File:** `%APPDATA%\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServers.json`

```json
{
  "type": "stdio",
  "name": "robinsons-toolkit",
  "command": "node",
  "arguments": [
    "C:\\Users\\YOUR_USERNAME\\Git Local\\robinsonai-mcp-servers\\packages\\robinsons-toolkit-mcp\\dist\\index.js"
  ],
  "env": {
    "GITHUB_TOKEN": "ghp_YOUR_GITHUB_TOKEN_HERE",
    "VERCEL_TOKEN": "YOUR_VERCEL_TOKEN_HERE",
    "NEON_API_KEY": "napi_YOUR_NEON_API_KEY_HERE"
  }
}
```

**Setup Steps:**
1. Replace `YOUR_USERNAME` with your Windows username
2. Replace placeholder tokens with your actual API keys
3. Ensure the path to `dist/index.js` is correct
4. Save the file
5. Reload VS Code window
6. Verify 556 tools appear in VS Code status bar

### **Optional (for future integrations)**

```bash
STRIPE_SECRET_KEY=sk_...    # Stripe secret key
SUPABASE_URL=https://...    # Supabase project URL
SUPABASE_ANON_KEY=...       # Supabase anon key
RESEND_API_KEY=re_...       # Resend API key
TWILIO_ACCOUNT_SID=...      # Twilio account SID
TWILIO_AUTH_TOKEN=...       # Twilio auth token
CLOUDFLARE_API_TOKEN=...    # Cloudflare API token
REDIS_URL=redis://...       # Redis connection URL
OPENAI_API_KEY=sk-...       # OpenAI API key
```

---

## API Endpoints

| Service | Base URL | Auth Header |
|---------|----------|-------------|
| GitHub | `https://api.github.com` | `Authorization: token ${GITHUB_TOKEN}` |
| Vercel | `https://api.vercel.com` | `Authorization: Bearer ${VERCEL_TOKEN}` |
| Neon | `https://console.neon.tech/api/v2` | `Authorization: Bearer ${NEON_API_KEY}` |
| Stripe | `https://api.stripe.com/v1` | `Authorization: Bearer ${STRIPE_SECRET_KEY}` |

---

## Code Patterns

### **Add Environment Variable**

```typescript
// 1. Add property (line ~30)
class UnifiedToolkit {
  private newServiceToken: string;

// 2. Load in constructor (line ~40)
constructor() {
  this.newServiceToken = process.env.NEW_SERVICE_TOKEN || '';
```

### **Create Fetch Method**

```typescript
// Add after line 3455
private async newServiceFetch(endpoint: string, options: any = {}) {
  const url = `https://api.newservice.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${this.newServiceToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return await response.json();
}
```

### **Add Tool Definition**

```typescript
// Add in ListToolsRequestSchema handler (line ~112)
{ 
  name: 'newservice_action_resource', 
  description: 'Description of what it does', 
  inputSchema: { 
    type: 'object', 
    properties: { 
      param1: { type: 'string', description: 'Param description' }
    },
    required: ['param1']
  } 
},
```

### **Add Case Handler**

```typescript
// Add in CallToolRequestSchema switch (line ~2535)
case 'newservice_action_resource': return await this.newServiceActionResource(args);
```

### **Implement Method**

```typescript
// Add after line 7000
private async newServiceActionResource(args: any) {
  const data = await this.newServiceFetch(`/resource/${args.param1}`);
  return this.formatResponse(data);
}
```

---

## Naming Conventions

### **Tool Names**

```
<service>_<action>_<resource>

Examples:
✅ github_list_repos
✅ vercel_create_deployment
✅ neon_run_sql
✅ stripe_create_customer

❌ list_repos (missing service prefix)
❌ githubListRepos (wrong format)
```

### **Method Names**

```
<service><Action><Resource>

Examples:
✅ githubListRepos
✅ vercelCreateDeployment
✅ neonRunSql
✅ stripeCreateCustomer

❌ listRepos (will collide!)
❌ github_list_repos (wrong format)
```

### **Fetch Method Names**

```
<service>Fetch

Examples:
✅ githubFetch
✅ vercelFetch
✅ neonFetch
✅ stripeFetch

❌ fetchGithub (wrong order)
❌ github_fetch (wrong format)
```

---

## Testing Checklist

After making changes:

- [ ] Run `npm run build` (must succeed with 0 errors)
- [ ] Reload VS Code window
- [ ] Check tool count in VS Code status bar
- [ ] Test new tools individually
- [ ] Test existing tools still work
- [ ] Verify no console errors in VS Code Developer Tools

---

## Debugging

### **Enable VS Code Developer Tools**

1. Press `Ctrl+Shift+P`
2. Type "Developer: Toggle Developer Tools"
3. Check Console tab for errors

### **Check MCP Server Logs**

Look for stderr output in VS Code Developer Tools Console:

```
Robinson's Toolkit MCP server running on stdio
Total tools: 563 (GitHub: 240, Vercel: 150, Neon: 173)
```

### **Test Tool Manually**

In Augment Code chat:

```
Test <tool_name> with <param>=<value>
```

Example:
```
Test github_list_repos with org="robinsonai"
```

---

## Common Errors

### **"Unknown tool: xyz"**

**Cause:** Missing case handler in switch statement.

**Fix:** Add case to `CallToolRequestSchema` handler.

### **"this.client.get is not a function"**

**Cause:** Using wrong client (Octokit instead of custom).

**Fix:** Use `this.createGitHubClient()` in constructor.

### **"Property 'xyz' does not exist"**

**Cause:** Missing property declaration in class.

**Fix:** Add property at top of `UnifiedToolkit` class.

### **Build succeeds but tools don't show**

**Cause:** VS Code hasn't reloaded the server.

**Fix:** Reload VS Code window.

### **"Authorization failed"**

**Cause:** Missing or invalid API token.

**Fix:** Check environment variables in Augment config.

---

## Method Name Collision Examples

### **❌ WRONG (Will Collide)**

```typescript
// GitHub
private async listProjects(args: any) { }

// Vercel
private async listProjects(args: any) { } // ❌ COLLISION!

// Neon
private async listProjects(args: any) { } // ❌ COLLISION!
```

### **✅ CORRECT (No Collision)**

```typescript
// GitHub
private async githubListProjects(args: any) { }

// Vercel
private async vercelListProjects(args: any) { }

// Neon
private async neonListProjects(args: any) { }
```

---

## Response Format

All methods should return this format:

```typescript
return {
  content: [{
    type: 'text',
    text: JSON.stringify(data, null, 2)
  }]
};
```

Or use the helper:

```typescript
return this.formatResponse(data);
```

---

## Integration Checklist

When adding a new service:

1. [ ] Add environment variable property
2. [ ] Load environment variable in constructor
3. [ ] Create `<service>Fetch()` method
4. [ ] Add tool definitions (with service prefix)
5. [ ] Add case handlers (with service prefix)
6. [ ] Implement methods (with service prefix)
7. [ ] Update documentation
8. [ ] Build (`npm run build`)
9. [ ] Update Augment config with API key
10. [ ] Reload VS Code
11. [ ] Test all new tools
12. [ ] Verify existing tools still work

---

## Useful Grep Commands

### **Count tools**

```bash
grep -c "{ name:" src/index.ts
```

### **Count case handlers**

```bash
grep -c "case '" src/index.ts
```

### **Count methods**

```bash
grep -c "private async" src/index.ts
```

### **Find specific tool**

```bash
grep -n "github_list_repos" src/index.ts
```

### **Find method implementation**

```bash
grep -n "private async listRepos" src/index.ts
```

---

## Quick Fixes

### **Rebuild after changes**

```bash
npm run build && echo "Reload VS Code now!"
```

### **Check for TypeScript errors**

```bash
npx tsc --noEmit
```

### **Format code**

```bash
npx prettier --write src/index.ts
```

### **Count lines**

```bash
wc -l src/index.ts
```

---

## Summary

**Robinson's Toolkit is a unified MCP server with 563 tools from GitHub, Vercel, and Neon.**

**Key principles:**
1. Service-specific method names (no collisions)
2. Custom fetch methods for each API
3. Proper tool registration and routing
4. Rebuild and reload after changes

**Use this guide for quick lookups when working with the toolkit!**

