# Decision Table: When to Use Toolkit vs Code

This document defines the policy for when Free Agent should use Robinson's Toolkit MCP tools versus generating custom code.

## General Principle

**Always prefer Toolkit tools over custom code** when:
1. A tool exists that matches the intent
2. The tool's schema is current and documented
3. The tool provides better reliability/security than custom code

**Fall back to code** only when:
1. No suitable tool found after discovery + fuzzy search
2. Tool is deprecated or moved
3. Tool fails twice with schema errors
4. Custom implementation is required by repo architecture

---

## Decision Matrix

| Intent/Need | Preferred Action | Discovery Tags | Fallback Strategy |
|-------------|------------------|----------------|-------------------|
| **Deployment** | | | |
| Deploy to Vercel | `toolkit.vercel_deploy_project` | `deploy`, `vercel` | Use Vercel CLI with docs from Thinking Tools |
| Deploy to Railway | `toolkit.railway_deploy` | `deploy`, `railway` | Use Railway CLI |
| Deploy to Cloudflare | `toolkit.cloudflare_deploy` | `deploy`, `cloudflare` | Use Wrangler CLI |
| **Database** | | | |
| Create schema | `toolkit.neon_create_branch` or Prisma | `db`, `schema`, `neon` | Generate Prisma schema + migration |
| Run migration | `toolkit.neon_run_migration` | `db`, `migrate` | Generate SQL migration files |
| Query database | Use repo's existing DB client | - | Don't generate raw SQL |
| **Secrets/Config** | | | |
| Store secret | `toolkit.upstash_redis_set` or env vars | `secrets`, `config`, `redis` | Never hardcode - fail task |
| Retrieve secret | `toolkit.upstash_redis_get` or env vars | `secrets`, `config` | Use process.env with validation |
| **File Operations** | | | |
| Upload to S3 | `toolkit.s3_upload` | `file`, `blob`, `s3` | Use AWS SDK with docs |
| Read/write local | Use Node fs/promises | - | Standard file operations |
| **HTTP/API Calls** | | | |
| Call Stripe API | `toolkit.stripe_*` tools | `stripe`, `payment` | Use @stripe/stripe-js with docs |
| Call OpenAI API | `toolkit.openai_*` tools | `openai`, `ai` | Use openai SDK with docs |
| Call GitHub API | `toolkit.github_*` tools | `github`, `git` | Use @octokit/rest with docs |
| Call Supabase | `toolkit.supabase_*` tools | `supabase`, `db` | Use @supabase/supabase-js |
| Generic HTTP | Generate fetch/axios code | - | Use repo's HTTP client pattern |
| **Email/SMS** | | | |
| Send email | `toolkit.resend_send_email` | `email`, `mail`, `resend` | Use nodemailer with SMTP |
| Send SMS | `toolkit.twilio_send_sms` | `sms`, `twilio` | Use Twilio SDK |
| **Authentication** | | | |
| OAuth flow | Use repo's auth library | - | Don't reinvent auth |
| JWT signing | Use repo's auth library | - | Use existing patterns |
| **Search/Cache** | | | |
| Cache data | `toolkit.upstash_redis_*` | `cache`, `redis` | Use in-memory cache |
| Search index | `toolkit.context_query` | `search`, `index` | Use repo's search solution |
| **Cron/Jobs** | | | |
| Schedule task | `toolkit.vercel_cron` or repo pattern | `cron`, `schedule` | Use repo's job queue |
| **Context/Analysis** | | | |
| Audit codebase | `thinking_tools.context_audit` | `audit`, `context` | Don't generate - use tool |
| Find docs | `thinking_tools.docs_find` | `docs`, `documentation` | Don't generate - use tool |
| Design check | `thinking_tools.framework_premortem` | `design`, `validation` | Don't generate - use tool |
| Fetch API docs | `thinking_tools.context7_get_library_docs` | `docs`, `api` | Don't guess - use tool |

---

## Discovery Process

When Free Agent needs to perform an action:

### 1. Intent Classification
```typescript
const intent = classifyIntent(task.description);
// Examples: "deploy", "email", "db", "cache", "auth"
```

### 2. Tool Discovery
```typescript
// Try exact match
const tools = await toolkit.discover({ query: intent, limit: 10 });

// Try with fallback tags
if (tools.length === 0) {
  const fallbackTags = getFallbackTags(intent);
  tools = await toolkit.discover({ query: fallbackTags.join(' '), limit: 10 });
}
```

### 3. Tool Selection
```typescript
// Pick best tool based on:
// - Name similarity to intent
// - Description match
// - Past success rate (from session cache)
const selectedTool = selectBestTool(tools, intent);
```

### 4. Schema Validation
```typescript
// Get current schema
const schema = await toolkit.getToolSchema({
  category: selectedTool.category,
  tool_name: selectedTool.name
});

// Validate args match schema
const args = generateArgsFromSchema(schema, task.params);
```

### 5. Execution with Fallback
```typescript
try {
  const result = await toolkit.call({
    category: selectedTool.category,
    tool_name: selectedTool.name,
    arguments: args
  });
  
  // Cache successful binding
  cacheBinding(intent, selectedTool.name, args);
  
  return result;
} catch (error) {
  if (error.message.includes('deprecated') || error.message.includes('moved')) {
    // Re-discover and retry
    return await rediscoverAndRetry(intent, task);
  }
  
  if (error.message.includes('schema') || error.message.includes('invalid')) {
    // Try next best tool
    const nextTool = selectNextBestTool(tools, intent);
    if (nextTool) {
      return await executeWithTool(nextTool, task);
    }
  }
  
  // Fall back to code generation
  return await generateCode(task);
}
```

---

## Code Generation Fallback Rules

When falling back to code generation:

### 1. Fetch Official Documentation
```typescript
// Always get docs before generating code
const docs = await thinkingTools.context7GetLibraryDocs({
  library: task.service // e.g., "stripe", "vercel", "supabase"
});
```

### 2. Search for Existing Patterns
```typescript
// Find similar code in repo
const similar = await thinkingTools.contextQuery({
  query: `${task.service} integration`,
  top_k: 6
});
```

### 3. Generate with Constraints
```typescript
// Generate code that:
// - Uses official SDK (not raw HTTP)
// - Follows repo patterns from similar code
// - Includes error handling
// - Includes tests
// - Never hardcodes secrets
```

### 4. Validate Generated Code
```typescript
// Ensure:
// - All imports resolve
// - No placeholders/TODOs
// - Secrets from env vars
// - Tests included
```

---

## Examples

### Example 1: Deploy to Vercel (Use Toolkit)

**Task**: "Deploy the app to Vercel production"

**Process**:
1. Discover: `toolkit.discover({ query: "deploy vercel" })`
2. Find: `vercel_deploy_project`
3. Get schema: `toolkit.getToolSchema({ category: "vercel", tool_name: "vercel_deploy_project" })`
4. Execute: `toolkit.call({ category: "vercel", tool_name: "vercel_deploy_project", arguments: { production: true } })`

**Result**: ✅ Deployed via Toolkit tool

---

### Example 2: Send Email (Use Toolkit with Fallback)

**Task**: "Send welcome email to new user"

**Process**:
1. Discover: `toolkit.discover({ query: "email send" })`
2. Find: `resend_send_email`
3. Try execute: `toolkit.call({ category: "resend", tool_name: "resend_send_email", ... })`
4. If fails: Fall back to nodemailer with SMTP

**Result**: ✅ Sent via Toolkit, or ✅ Generated nodemailer code

---

### Example 3: Custom Business Logic (Generate Code)

**Task**: "Calculate shipping cost based on weight and distance"

**Process**:
1. Discover: `toolkit.discover({ query: "shipping calculate" })`
2. Find: No relevant tools
3. Search repo: `thinkingTools.contextQuery({ query: "shipping cost calculation" })`
4. Generate: Custom function following repo patterns

**Result**: ✅ Generated custom code (no suitable tool exists)

---

## Metrics to Track

For each task, log:
- Intent classification
- Tools discovered (count)
- Tool selected (name)
- Execution result (success/failure)
- Fallback triggered (yes/no)
- Code generated (yes/no)
- Final outcome (success/failure)

This helps improve discovery and selection over time.

