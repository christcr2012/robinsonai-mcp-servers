# ROBINSON'S TOOLKIT - TOOL NAMING STANDARD

**Purpose:** Make tool names intuitive and predictable for AI agents (Custom GPTs, Cursor, Copilot, Augment, Claude, etc.)

---

## 🎯 CORE PRINCIPLES

### 1. **Natural Language Pattern**
Tool names should read like natural English commands:
- ✅ `github_create_repo` → "GitHub, create repo"
- ✅ `stripe_list_customers` → "Stripe, list customers"
- ❌ `github_repo_create` → Awkward word order
- ❌ `stripe_customers_list` → Awkward word order

### 2. **Consistent Verb-First Pattern**
After the category prefix, always use: `{category}_{verb}_{noun}`
- ✅ `vercel_create_project`
- ✅ `neon_delete_database`
- ❌ `vercel_project_create`
- ❌ `neon_database_delete`

### 3. **Predictable Verb Set**
Use standard CRUD + common operations:

**Core CRUD:**
- `create_*` - Create new resource
- `get_*` - Retrieve single resource by ID
- `list_*` - Retrieve multiple resources (with optional filters)
- `update_*` - Modify existing resource
- `delete_*` - Remove resource

**Common Operations:**
- `search_*` - Find resources by query
- `send_*` - Send/transmit (emails, messages)
- `upload_*` - Upload files/data
- `download_*` - Download files/data
- `execute_*` - Run/execute (queries, commands)
- `deploy_*` - Deploy applications
- `cancel_*` - Cancel operations
- `archive_*` - Archive (soft delete)
- `restore_*` - Restore archived items

### 4. **Singular Nouns for Resources**
Use singular form for the resource being acted upon:
- ✅ `github_create_repo` (creating ONE repo)
- ✅ `stripe_get_customer` (getting ONE customer)
- ✅ `list_*` is the exception (returns multiple)
- ❌ `github_create_repos`
- ❌ `stripe_get_customers`

---

## 📋 STANDARD PATTERNS BY OPERATION

### **CREATE Operations**
```
{category}_create_{resource}
```
**Examples:**
- `github_create_repo`
- `stripe_create_customer`
- `vercel_create_project`
- `neon_create_database`

**When to use:**
- Creating new resources
- Initializing new entities
- Setting up new configurations

---

### **GET Operations** (Single Item)
```
{category}_get_{resource}
```
**Examples:**
- `github_get_repo`
- `stripe_get_customer`
- `vercel_get_project`
- `neon_get_database`

**When to use:**
- Retrieving a specific resource by ID/name
- Fetching details of a single entity
- Getting current state of a resource

**Alternative:** `retrieve_*` (Stripe uses this)
- `stripe_customer_retrieve` → Should be `stripe_get_customer`

---

### **LIST Operations** (Multiple Items)
```
{category}_list_{resources}
```
**Examples:**
- `github_list_repos`
- `stripe_list_customers`
- `vercel_list_projects`
- `neon_list_databases`

**When to use:**
- Retrieving multiple resources
- Getting collections with optional filters
- Paginated results

**Note:** Use plural form for list operations!

---

### **UPDATE Operations**
```
{category}_update_{resource}
```
**Examples:**
- `github_update_repo`
- `stripe_update_customer`
- `vercel_update_project`
- `neon_update_database`

**When to use:**
- Modifying existing resources
- Changing settings/configuration
- Partial updates (PATCH-like)

---

### **DELETE Operations**
```
{category}_delete_{resource}
```
**Examples:**
- `github_delete_repo`
- `stripe_delete_customer`
- `vercel_delete_project`
- `neon_delete_database`

**When to use:**
- Permanently removing resources
- Hard deletes

**Alternative:** `archive_*` for soft deletes
- `github_archive_repo` (soft delete, can restore)
- `github_delete_repo` (hard delete, permanent)

---

### **SEARCH Operations**
```
{category}_search_{resources}
```
**Examples:**
- `github_search_repos`
- `stripe_search_customers`
- `vercel_search_projects`

**When to use:**
- Full-text search
- Complex queries
- When `list_*` with filters isn't sufficient

---

### **SEND Operations**
```
{category}_send_{item}
```
**Examples:**
- `gmail_send_message`
- `twilio_send_sms`
- `resend_send_email`

**When to use:**
- Sending emails, messages, notifications
- Transmitting data

---

### **EXECUTE Operations**
```
{category}_execute_{action}
```
**Examples:**
- `neon_execute_query`
- `postgres_execute_sql`
- `cloudflare_execute_purge`

**When to use:**
- Running queries
- Executing commands
- Performing actions

---

## 🔍 CURRENT ISSUES & FIXES NEEDED

### Issue 1: Inconsistent Verb Placement
**Current (WRONG):**
- `stripe_customer_create` ❌
- `stripe_customer_retrieve` ❌
- `stripe_customer_update` ❌
- `stripe_customer_delete` ❌
- `stripe_customer_list` ❌

**Should be:**
- `stripe_create_customer` ✅
- `stripe_get_customer` ✅
- `stripe_update_customer` ✅
- `stripe_delete_customer` ✅
- `stripe_list_customers` ✅

**Impact:** 150 Stripe tools need renaming

---

### Issue 2: Supabase Database Operations
**Current (UNCLEAR):**
- `supabase_db_select` ❌
- `supabase_db_select_eq` ❌
- `supabase_db_select_gt` ❌

**Should be:**
- `supabase_query_table` ✅
- `supabase_query_where_equals` ✅
- `supabase_query_where_greater_than` ✅

**OR (more specific):**
- `supabase_select_from_table` ✅
- `supabase_select_where_equals` ✅
- `supabase_select_where_greater_than` ✅

**Impact:** 97 Supabase tools need renaming

---

### Issue 3: Upstash Redis Operations
**Current (TOO VERBOSE):**
- `upstash_list_redis_databases` ❌
- `upstash_get_redis_database` ❌
- `upstash_create_redis_database` ❌

**Should be:**
- `upstash_list_databases` ✅
- `upstash_get_database` ✅
- `upstash_create_database` ✅

**Rationale:** "Upstash" already implies Redis, no need to repeat

**Impact:** 157 Upstash tools need renaming

---

### Issue 4: OpenAI Inconsistencies
**Current (MIXED):**
- `openai_chat_completion` ❌ (missing verb)
- `openai_create_embedding` ✅ (correct)
- `openai_batch_embeddings` ❌ (verb-last)

**Should be:**
- `openai_create_chat_completion` ✅
- `openai_create_embedding` ✅ (already correct)
- `openai_create_batch_embeddings` ✅

**Impact:** 73 OpenAI tools need review

---

## 📊 STANDARDIZATION PRIORITY

### Phase 1: Fix Critical Inconsistencies (HIGH PRIORITY)
1. **Stripe** - 150 tools with `{noun}_{verb}` pattern → `{verb}_{noun}`
2. **Supabase** - 97 tools with unclear `db_select_*` → `query_*` or `select_*`
3. **Upstash** - 157 tools with redundant `redis_` → remove redundancy

### Phase 2: Review and Fix Minor Issues (MEDIUM PRIORITY)
4. **OpenAI** - 73 tools with missing verbs
5. **Cloudflare** - 160 tools (check consistency)
6. **Twilio** - 83 tools (check consistency)

### Phase 3: Verify Consistency (LOW PRIORITY)
7. **GitHub** - 241 tools (mostly correct, verify)
8. **Vercel** - 150 tools (mostly correct, verify)
9. **Neon** - 167 tools (mostly correct, verify)
10. **Google Workspace** - 192 tools (verify across subcategories)

---

## 🎯 AI AGENT DISCOVERABILITY

### How AI Agents Find Tools

**1. By Description (Most Important)**
- Agents read tool descriptions to understand what they do
- Descriptions should be clear, concise, and action-oriented
- ✅ "Create a new GitHub repository"
- ❌ "Repository creation endpoint"

**2. By Name Pattern Matching**
- Agents look for familiar patterns: `create_`, `list_`, `get_`, `delete_`
- Consistent naming helps agents predict tool names
- If agent knows `github_create_repo`, it can guess `vercel_create_project`

**3. By Category Prefix**
- Agents group tools by category prefix
- Clear prefixes help agents understand scope
- `github_*` = GitHub operations
- `stripe_*` = Stripe operations

### Best Practices for AI Discoverability

**1. Descriptive Tool Names**
```typescript
// ✅ GOOD - Agent can guess what this does
{ name: 'github_create_pull_request', description: 'Create a new pull request' }

// ❌ BAD - Agent has to read description
{ name: 'github_pr_new', description: 'Create a new pull request' }
```

**2. Consistent Verb Usage**
```typescript
// ✅ GOOD - Agent learns pattern
github_create_repo
github_create_issue
github_create_pull_request

// ❌ BAD - Agent can't predict
github_create_repo
github_new_issue
github_open_pull_request
```

**3. Natural Language Descriptions**
```typescript
// ✅ GOOD - Reads like a command
{ 
  name: 'stripe_create_customer',
  description: 'Create a new Stripe customer with email, name, and optional metadata'
}

// ❌ BAD - Too technical
{
  name: 'stripe_customer_create',
  description: 'POST /v1/customers endpoint for customer resource creation'
}
```

---

## 🚀 IMPLEMENTATION PLAN

### Step 1: Create Mapping File
Create `tool-name-migrations.json` with old → new mappings:
```json
{
  "stripe_customer_create": "stripe_create_customer",
  "stripe_customer_retrieve": "stripe_get_customer",
  "supabase_db_select": "supabase_select_from_table",
  "upstash_list_redis_databases": "upstash_list_databases"
}
```

### Step 2: Support Both Old and New Names (Transition Period)
```typescript
// In handler switch statement
case 'stripe_create_customer':  // New name
case 'stripe_customer_create':  // Old name (deprecated)
  return StripeHandlers.createCustomer(args);
```

### Step 3: Update Documentation
- Mark old names as deprecated
- Update all examples to use new names
- Add migration guide

### Step 4: Remove Old Names (After Transition)
- Remove deprecated aliases
- Keep only new standardized names

---

## ✅ SUCCESS CRITERIA

Tool naming is successful when:

1. **AI agents can predict tool names** without reading docs
2. **Tool names read like natural English** commands
3. **Consistent patterns** across all categories
4. **No redundancy** in naming (e.g., `upstash_redis_*`)
5. **Clear verb-noun structure** for all operations

---

## 📝 EXAMPLES OF PERFECT NAMING

### GitHub (Mostly Correct Already)
```
github_list_repos
github_get_repo
github_create_repo
github_update_repo
github_delete_repo
github_create_issue
github_list_issues
github_create_pull_request
```

### Vercel (Mostly Correct Already)
```
vercel_list_projects
vercel_get_project
vercel_create_project
vercel_update_project
vercel_delete_project
vercel_list_deployments
vercel_create_deployment
```

### What Stripe SHOULD Look Like
```
stripe_list_customers
stripe_get_customer
stripe_create_customer
stripe_update_customer
stripe_delete_customer
stripe_search_customers
stripe_list_subscriptions
stripe_create_subscription
stripe_cancel_subscription
```

---

**Next Steps:**
1. Review this standard with team
2. Create migration mapping file
3. Implement dual-name support
4. Update documentation
5. Gradually deprecate old names
