# Robinson's Toolkit Expansion - Complete Guide

**Everything you need in one place. Delete all other planning docs after reading this.**

---

## 🎯 THE GOAL

Expand `packages/robinsons-toolkit-mcp/src/index.ts` from **556 tools** to **1,594+ tools** by integrating 10 standalone MCP servers.

**Current:** 7,278 lines, 556 tools (GitHub 240 + Vercel 150 + Neon 166)  
**Target:** ~17,000 lines, 1,594+ tools  
**Time:** ~19 hours

---

## 🚨 CRITICAL: FIX GITHUB CLIENT FIRST (30 min)

**THE PROBLEM:** Lines 23-29 define a fake `GitHubClient` interface. Line 106 creates an `Octokit` instance. They're incompatible. All 240 GitHub tools are BROKEN.

**THE FIX:**
1. Delete lines 23-29 (the `GitHubClient` interface)
2. Change line 61: `private client: any;` → `private client: Octokit;`
3. Fix all GitHub methods (lines 2800-4500) to use proper Octokit API

**Example:**
```typescript
// BEFORE (BROKEN):
private async createIssue(args: any) {
  const response = await this.client.post(`/repos/${args.owner}/${args.repo}/issues`, body);
  return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
}

// AFTER (WORKING):
private async createIssue(args: any) {
  const response = await this.client.rest.issues.create({
    owner: args.owner,
    repo: args.repo,
    title: args.title,
    body: args.body,
    assignees: args.assignees,
    milestone: args.milestone,
    labels: args.labels,
  });
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}
```

**DO THIS FIRST. Test it works. Then proceed.**

---

## 📋 THE 10 INTEGRATIONS (in order)

| # | Service | Source | Tools | Time | Priority |
|---|---------|--------|-------|------|----------|
| 1 | Redis | `packages/redis-mcp/src/index.ts` | 80 | 2h | HIGH |
| 2 | Context7 | `packages/context7-mcp/src/index.ts` | 8 | 30m | LOW |
| 3 | Playwright | `packages/playwright-mcp/src/index.ts` | 33 | 1h | LOW |
| 4 | OpenAI | `packages/openai-mcp/src/index.ts` | 240 | 3h | HIGH |
| 5 | Google Workspace | `packages/google-workspace-mcp/src/index.ts` | 192 | 3h | MED |
| 6 | Resend | `packages/resend-mcp/src/index.ts` | 60 | 1.5h | MED |
| 7 | Twilio | `packages/twilio-mcp/src/index.ts` | 70 | 2h | MED |
| 8 | Stripe | `packages/stripe-mcp/src/tools/*.ts` | 105 | 2h | HIGH |
| 9 | Supabase | `packages/supabase-mcp/src/tools/*.ts` | 80 | 2h | MED |
| 10 | Cloudflare | `packages/cloudflare-mcp/src/index.ts` | 90 | 2h | LOW |

---

## 🔧 THE INTEGRATION PATTERN (repeat for each service)

### Step 1: Extract Tool Definitions
**Open source file** → Find `tools: [` → Copy all tool objects

**Example from Redis:**
```typescript
{
  name: "redis_get",
  description: "Get value by key from Redis",
  inputSchema: {
    type: "object",
    properties: {
      key: { type: "string", description: "Redis key to retrieve" },
    },
    required: ["key"],
  },
},
```

**Paste location:** Line ~460 in toolkit (after last Neon tool)  
**Remember:** Add comma after previous tool!

---

### Step 2: Extract Case Handlers
**Open source file** → Find `switch (name) {` → Copy all `case` statements

**Example from Redis:**
```typescript
case "redis_get":
  return await this.redisGet(args);
case "redis_set":
  return await this.redisSet(args);
```

**Paste location:** Line ~2627 in toolkit (before `default:` case)

---

### Step 3: Extract Methods
**Open source file** → Find all `private async` methods → Copy all

**Example from Redis:**
```typescript
private async redisGet(args: any): Promise<ToolResponse> {
  await this.connect();
  const value = await this.client!.get(args.key);
  return {
    content: [{ type: "text", text: value || "Key not found" }],
  };
}
```

**Paste location:** Line ~7200 in toolkit (before `async run()`)

---

### Step 4: Build & Test
```bash
cd packages/robinsons-toolkit-mcp
npm run build
# Should complete with NO errors
```

---

### Step 5: Commit
```bash
git add packages/robinsons-toolkit-mcp
git commit -m "feat(toolkit): integrate [Service] MCP ([N] tools)"
```

---

## 📍 KEY LINE NUMBERS IN TOOLKIT

| What | Lines | Notes |
|------|-------|-------|
| Imports | 1-40 | Add new imports if needed |
| Class Properties | 43-84 | Clients already declared |
| Constructor | 86-196 | Clients already initialized |
| **Tool Definitions** | **209-2627** | **ADD NEW TOOLS HERE** |
| **Switch Statement** | **2630-7200** | **ADD NEW CASES HERE** |
| **Methods** | **2800-7200** | **ADD NEW METHODS HERE** |
| Run Method | 7250-7278 | Don't touch |

---

## ⚠️ SPECIAL CASES

### Stripe & Supabase (Modular)
These have **multiple source files** in `src/tools/*.ts`

**Process:**
1. Open each tool file
2. Extract tools from each file
3. Combine all tools into one array
4. Extract cases from each file
5. Combine all cases
6. Extract methods from each file
7. Add all methods to toolkit

**Stripe files:**
- `customers.ts`, `payment-intents.ts`, `charges.ts`, `refunds.ts`, `payment-methods.ts`, `subscriptions.ts`, `invoices.ts`, `products.ts`, `prices.ts`, `coupons.ts`, `webhooks.ts`

**Supabase files:**
- `database.ts`, `auth.ts`, `storage.ts`, `realtime.ts`, `edge-functions.ts`

---

## ✅ VERIFICATION CHECKLIST (after each integration)

- [ ] Build completes with NO errors
- [ ] Tool count increased by expected amount
- [ ] No duplicate tool names
- [ ] All cases have corresponding methods
- [ ] All methods have corresponding cases
- [ ] Committed with proper message

---

## 🎯 PROGRESS TRACKING

Mark with ✅ as you complete:

- [ ] **GitHub Client Fix** (30 min) - MUST DO FIRST
- [ ] Redis (80 tools, 2h)
- [ ] Context7 (8 tools, 30m)
- [ ] Playwright (33 tools, 1h)
- [ ] OpenAI (240 tools, 3h)
- [ ] Google Workspace (192 tools, 3h)
- [ ] Resend (60 tools, 1.5h)
- [ ] Twilio (70 tools, 2h)
- [ ] Stripe (105 tools, 2h)
- [ ] Supabase (80 tools, 2h)
- [ ] Cloudflare (90 tools, 2h)

**Total:** 1,038 new tools, ~19 hours

---

## 🚀 QUICK COMMANDS

```bash
# Build
cd packages/robinsons-toolkit-mcp && npm run build

# Count tools
grep -c '"name":' packages/robinsons-toolkit-mcp/src/index.ts

# Commit
git add packages/robinsons-toolkit-mcp
git commit -m "feat(toolkit): integrate [Service] MCP ([N] tools)"
```

---

## 💡 PRO TIPS

1. **Do GitHub fix first** - Everything else depends on it
2. **Start with Redis** - Establishes the pattern
3. **Build after each service** - Catch errors early
4. **Commit after each service** - Easy rollback
5. **Copy exact formatting** - Maintain consistency
6. **Don't modify existing code** - Only add new code
7. **Take breaks** - This is 19 hours of work

---

## 🎉 SUCCESS = 1,594+ TOOLS, ZERO ERRORS

When done:
- File will be ~17,000 lines
- All 1,594+ tools accessible
- Build succeeds with no errors
- All existing 556 tools still work

---

**NOW GO FIX THE GITHUB CLIENT AND START WITH REDIS!**

