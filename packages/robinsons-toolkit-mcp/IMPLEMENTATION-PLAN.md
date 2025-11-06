# Robinson's Toolkit MCP - Implementation Plan

**Created:** 2025-01-06  
**Goal:** Build out all 7 planned integrations (610-617 tools) systematically  
**Strategy:** Fix problems first, then build out category by category with verification

---

## 🎯 OVERALL STRATEGY

### Principles
1. **Fix First, Build Second** - Repair existing issues before adding new functionality
2. **Category by Category** - Complete one integration fully before moving to next
3. **Verify Everything** - Test, version bump, publish, restart, verify after each category
4. **No Placeholders** - Complete implementation with no stubs, TODOs, or missing code
5. **Manageable Phases** - Break large categories into phases (scaffold → implement → test)

### Workflow Per Category
```
1. FIX PROBLEMS (if any exist)
   ├─ Identify issues
   ├─ Fix and test
   └─ Verify fixes work

2. BUILD OUT (in phases)
   ├─ Phase 1: Install dependencies
   ├─ Phase 2: Design tool schemas
   ├─ Phase 3: Implement handlers
   ├─ Phase 4: Add case statements
   ├─ Phase 5: Register tools
   └─ Phase 6: Test all tools

3. VERIFY & PUBLISH
   ├─ Run comprehensive tests
   ├─ Version bump (patch/minor)
   ├─ Build and publish to npm
   ├─ Update Augment config
   ├─ Restart MCP server
   └─ Verify all tools work
```

---

## 📋 IMPLEMENTATION ORDER

Based on FREE agent's validation report and priority:

| # | Category | Tools | Priority | Dependencies | Reason |
|---|----------|-------|----------|--------------|--------|
| 1 | **Stripe** | 150 | HIGH | ✅ Installed | Most requested, payment critical |
| 2 | **Supabase** | 120 | HIGH | ✅ Installed | Backend-as-a-service, high value |
| 3 | **Playwright** | 50 | MEDIUM | ✅ Installed | Browser automation, unique capability |
| 4 | **Twilio** | 85 | MEDIUM | ❌ Missing | Communications, widely used |
| 5 | **Cloudflare** | 160 | MEDIUM | ❌ Missing | Large API surface, complex |
| 6 | **Resend** | 35-40 | LOW | ❌ Missing | Email, simpler API |
| 7 | **Context7** | 10-12 | LOW | ❌ Missing | Documentation search, niche |

**Total:** 610-617 tools across 7 categories

---

## 🔧 CATEGORY 1: STRIPE (150 tools)

### Current Status
- Dependencies: ✅ `stripe@17.5.0` installed
- Environment: ✅ `STRIPE_SECRET_KEY` defined
- Implementation: ❌ NO tools, NO handlers, NO case statements

### Problems to Fix
**NONE** - No existing problems, ready to build

### Build Phases

#### Phase 1: Dependencies & Setup (DONE)
- ✅ Dependencies already installed
- ✅ Environment variables already defined
- ✅ Client property already declared

#### Phase 2: Design Tool Schemas (Estimated: 150 tools)
**Core Resources (30 tools):**
- Customers: create, retrieve, update, delete, list, search
- Payment Intents: create, retrieve, update, confirm, cancel, list
- Charges: create, retrieve, update, capture, list
- Refunds: create, retrieve, update, cancel, list
- Payouts: create, retrieve, update, cancel, list

**Billing (40 tools):**
- Subscriptions: create, retrieve, update, cancel, list, search
- Invoices: create, retrieve, update, finalize, pay, void, list
- Invoice Items: create, retrieve, update, delete, list
- Plans: create, retrieve, update, delete, list (deprecated but still used)
- Prices: create, retrieve, update, list

**Products (20 tools):**
- Products: create, retrieve, update, delete, list, search
- Coupons: create, retrieve, update, delete, list
- Promotion Codes: create, retrieve, update, list
- Tax Rates: create, retrieve, update, list

**Payment Methods (20 tools):**
- Payment Methods: create, retrieve, update, attach, detach, list
- Cards: create, retrieve, update, delete, list
- Bank Accounts: create, retrieve, update, verify, delete, list
- Sources: create, retrieve, update, detach, list

**Connect (20 tools):**
- Accounts: create, retrieve, update, delete, list
- Transfers: create, retrieve, update, reverse, list
- Application Fees: retrieve, list, refund
- Capabilities: retrieve, update, list

**Other (20 tools):**
- Events: retrieve, list
- Files: create, retrieve, list
- Disputes: retrieve, update, close, list
- Balance: retrieve, retrieve_transaction, list_transactions
- Webhooks: construct_event, verify_signature

#### Phase 3: Implement Handlers
- Create handler methods in RobinsonsToolkit class
- Follow naming convention: `stripe{Operation}{Resource}` (e.g., `stripeCreateCustomer`)
- Implement error handling and validation
- Use Stripe SDK properly

#### Phase 4: Add Case Statements
- Add 150 case statements to main switch
- Follow pattern: `case 'stripe_create_customer': return await this.stripeCreateCustomer(args);`
- Group by resource type for organization

#### Phase 5: Register Tools
- Add all 150 tools to ToolRegistry
- Provide proper schemas with descriptions and parameters
- Follow existing patterns from GitHub/Vercel/etc.

#### Phase 6: Test All Tools
- Test each tool individually
- Verify error handling
- Check authentication
- Validate responses

### Version Bump
- Current: 1.5.2
- After Stripe: **1.6.0** (minor bump - new feature category)

### Success Criteria
- ✅ All 150 Stripe tools implemented
- ✅ All tools tested and working
- ✅ No placeholders or stubs
- ✅ Published to npm as v1.6.0
- ✅ Verified in Augment after restart

---

## 🔧 CATEGORY 2: SUPABASE (120 tools)

### Current Status
- Dependencies: ✅ `@supabase/supabase-js@2.47.10` installed
- Environment: ✅ `SUPABASE_URL`, `SUPABASE_KEY` defined
- Implementation: ❌ NO tools, NO handlers, NO case statements

### Problems to Fix
**NONE** - No existing problems, ready to build

### Build Phases

#### Phase 1: Dependencies & Setup (DONE)
- ✅ Dependencies already installed
- ✅ Environment variables already defined
- ✅ Client properties already declared

#### Phase 2: Design Tool Schemas (Estimated: 120 tools)
**Database/PostgREST (30 tools):**
- Select: from, select, eq, neq, gt, gte, lt, lte, like, ilike, is, in, contains, range, order, limit
- Insert: insert, upsert
- Update: update, eq (filter)
- Delete: delete, eq (filter)
- RPC: call database functions

**Auth (25 tools):**
- Sign Up: signUp, signUpWithPassword, signUpWithOAuth
- Sign In: signIn, signInWithPassword, signInWithOAuth, signInWithOtp
- Sign Out: signOut
- Session: getSession, refreshSession, setSession
- User: getUser, updateUser, deleteUser
- Admin: listUsers, getUserById, createUser, deleteUser, updateUserById

**Storage (25 tools):**
- Buckets: createBucket, getBucket, listBuckets, emptyBucket, deleteBucket, updateBucket
- Objects: upload, download, list, move, copy, remove, createSignedUrl, getPublicUrl
- Policies: create, update, delete, list

**Realtime (15 tools):**
- Channels: subscribe, unsubscribe, on, off
- Presence: track, untrack, get
- Broadcast: send, receive

**Edge Functions (15 tools):**
- Functions: invoke, list, create, update, delete, getLogs

**Management API (10 tools):**
- Projects: create, list, get, update, delete
- Organizations: create, list, get, update, delete

#### Phase 3-6: Same as Stripe
- Implement handlers
- Add case statements
- Register tools
- Test all tools

### Version Bump
- After Supabase: **1.7.0** (minor bump - new feature category)

### Success Criteria
- ✅ All 120 Supabase tools implemented
- ✅ All tools tested and working
- ✅ No placeholders or stubs
- ✅ Published to npm as v1.7.0
- ✅ Verified in Augment after restart

---

## 🔧 CATEGORY 3: PLAYWRIGHT (50 tools)

### Current Status
- Dependencies: ✅ `playwright@1.49.1` installed
- Environment: ❌ No env vars needed
- Implementation: ❌ NO tools, NO handlers, NO case statements

### Problems to Fix
**NONE** - No existing problems, ready to build

### Build Phases

#### Phase 1: Dependencies & Setup (DONE)
- ✅ Dependencies already installed
- ✅ No environment variables needed

#### Phase 2: Design Tool Schemas (Estimated: 50 tools)
**Browser Management (10 tools):**
- launch, close, newContext, newPage, contexts, pages, version, isConnected

**Page Operations (20 tools):**
- goto, reload, goBack, goForward, click, fill, type, press, screenshot, pdf, content, title, url, evaluate, waitForSelector, waitForNavigation

**Locator Operations (10 tools):**
- locator, click, fill, textContent, innerHTML, getAttribute, isVisible, isEnabled, count

**Other (10 tools):**
- Keyboard: press, type, down, up
- Mouse: click, dblclick, move
- Dialog: accept, dismiss, message
- Download: save, path

#### Phase 3-6: Same as Stripe

### Version Bump
- After Playwright: **1.8.0** (minor bump - new feature category)

---

## 🔧 CATEGORIES 4-7: TWILIO, CLOUDFLARE, RESEND, CONTEXT7

### Twilio (85 tools) → v1.9.0
### Cloudflare (160 tools) → v1.10.0
### Resend (35-40 tools) → v1.11.0
### Context7 (10-12 tools) → v1.12.0

**Same pattern for each:**
1. Install dependencies (if missing)
2. Design tool schemas
3. Implement handlers
4. Add case statements
5. Register tools
6. Test all tools
7. Version bump, publish, verify

---

## 📊 PROGRESS TRACKING

### Overall Progress
- [ ] Category 1: Stripe (150 tools) → v1.6.0
- [ ] Category 2: Supabase (120 tools) → v1.7.0
- [ ] Category 3: Playwright (50 tools) → v1.8.0
- [ ] Category 4: Twilio (85 tools) → v1.9.0
- [ ] Category 5: Cloudflare (160 tools) → v1.10.0
- [ ] Category 6: Resend (35-40 tools) → v1.11.0
- [ ] Category 7: Context7 (10-12 tools) → v1.12.0

### Final Target
**Version:** 1.12.0  
**Total Tools:** 1,586-1,593 tools (976 existing + 610-617 new)  
**Status:** Ready to begin implementation

---

## 🎯 NEXT STEPS

1. **Start with Stripe** (Category 1)
2. **Use FREE agent** for tool schema design and handler scaffolding
3. **Implement in phases** to maintain context and avoid mistakes
4. **Test thoroughly** before moving to next phase
5. **Version bump and publish** after each category is complete
6. **Update STATUS.md** as we progress

**Ready to begin when you are!** 🚀

---

## 🔮 FUTURE: DYNAMIC TOOL SYSTEM (Post v1.12.0)

### The Problem with Current Architecture

**Current System (Manual):**
```typescript
// 1. Define handler method
private async stripeCreateCustomer(args: any) { ... }

// 2. Add case statement (MANUAL - easy to forget!)
case 'stripe_create_customer': return await this.stripeCreateCustomer(args);

// 3. Register tool in ListToolsRequestSchema (MANUAL - easy to forget!)
{ name: 'stripe_create_customer', description: '...', inputSchema: {...} }
```

**Problems:**
- ❌ **3 places to update** for every tool (handler, case, registry)
- ❌ **Easy to forget** case statements (like Neon bug we fixed)
- ❌ **Manual synchronization** between handler names and tool names
- ❌ **Doesn't scale** - we're adding 610+ tools!
- ❌ **Error-prone** - typos break everything

### The Dynamic Solution

**Inspired by thinking-tools-mcp pattern:**

```typescript
// 1. Tool definitions with handlers in one place
const stripeTools = [
  {
    name: 'stripe_create_customer',
    description: 'Create a new Stripe customer',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        name: { type: 'string' }
      },
      required: ['email']
    },
    handler: async (args: any) => {
      // Implementation here
      const stripe = new Stripe(this.stripeSecretKey);
      return await stripe.customers.create(args);
    }
  },
  // ... more tools
];

// 2. Central registry (auto-registers all tools)
const registry: Record<string, ToolEntry> = {};

for (const tool of stripeTools) {
  registry[tool.name] = {
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: tool.handler
  };
}

// 3. Dynamic ListTools handler (no manual registration!)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(registry).map(([name, entry]) => ({
    name,
    description: entry.description,
    inputSchema: entry.inputSchema
  }))
}));

// 4. Dynamic CallTool handler (no case statements!)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const entry = registry[name];
  if (!entry) {
    throw new Error(`Unknown tool: ${name}`);
  }

  return await entry.handler(args);
});
```

### Benefits of Dynamic System

1. ✅ **Single Source of Truth** - Tool definition includes handler
2. ✅ **No Manual Sync** - Can't forget case statements or registry
3. ✅ **Auto-Discovery** - New tools automatically exposed
4. ✅ **Type-Safe** - TypeScript can validate tool definitions
5. ✅ **Scalable** - Adding 1,000 tools is same effort as adding 1
6. ✅ **Maintainable** - All tool logic in one place
7. ✅ **Testable** - Easy to test individual tools

### Migration Plan (After v1.12.0)

**Phase 1: Create Dynamic Infrastructure**
1. Create `src/tools/` directory structure:
   ```
   src/tools/
   ├── stripe/
   │   ├── customers.ts
   │   ├── payments.ts
   │   └── index.ts
   ├── supabase/
   │   ├── database.ts
   │   ├── auth.ts
   │   └── index.ts
   └── index.ts (exports all tools)
   ```

2. Create tool definition type:
   ```typescript
   interface ToolDefinition {
     name: string;
     description: string;
     inputSchema: any;
     handler: (args: any, context?: any) => Promise<any>;
   }
   ```

3. Create registry builder:
   ```typescript
   function buildRegistry(toolCollections: ToolDefinition[][]): Record<string, ToolEntry> {
     const registry: Record<string, ToolEntry> = {};
     for (const collection of toolCollections) {
       for (const tool of collection) {
         registry[tool.name] = {
           description: tool.description,
           inputSchema: tool.inputSchema,
           handler: tool.handler
         };
       }
     }
     return registry;
   }
   ```

**Phase 2: Migrate One Category at a Time**
1. Start with smallest category (Context7 - 10 tools)
2. Convert to dynamic pattern
3. Test thoroughly
4. Verify no regressions
5. Move to next category

**Phase 3: Remove Old Infrastructure**
1. Delete massive switch statement
2. Delete manual tool registrations
3. Simplify index.ts to just registry + handlers
4. Update documentation

**Phase 4: Add Code Generation**
1. Create script to generate tool definitions from API specs
2. Auto-generate TypeScript types from schemas
3. Reduce manual work even further

### Expected Outcome

**Before (Current):**
- `index.ts`: 16,289 lines (mostly case statements)
- Adding 1 tool: 3 manual edits
- Risk: High (easy to forget steps)

**After (Dynamic):**
- `index.ts`: ~500 lines (just registry setup)
- `src/tools/`: Organized by category
- Adding 1 tool: 1 file edit
- Risk: Low (automatic registration)

### Timeline

**When to Migrate:**
- ✅ After v1.12.0 (all 7 categories implemented)
- ✅ After comprehensive testing of current system
- ✅ When we have time for major refactor
- ✅ Before adding more categories (to avoid more manual work)

**Estimated Effort:**
- Phase 1 (Infrastructure): 1-2 days
- Phase 2 (Migration): 1 week (7 categories)
- Phase 3 (Cleanup): 1 day
- Phase 4 (Code Gen): 2-3 days
- **Total: ~2 weeks**

**ROI:**
- Saves 100+ hours on future tool additions
- Eliminates entire class of bugs (missing case statements)
- Makes codebase 10x more maintainable
- Enables AI-assisted tool generation

---

## 📝 NOTES

**Don't forget this plan!** After we complete v1.12.0 with all 7 categories implemented using the current manual system, we should migrate to the dynamic system to make future additions effortless and bug-free.

The thinking-tools-mcp server already uses this pattern successfully - we just need to apply it to Robinson's Toolkit MCP.

