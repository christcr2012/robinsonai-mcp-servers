# 🛠️ Robinson's Toolkit MCP Server

**556 tools across 3 integrations (GitHub, Vercel, Neon) - Augment Code's HANDS to DO things!**

Robinson's Toolkit is a unified MCP server that consolidates all your development tools into one place, giving Augment Code the ability to actually DO things instead of just explaining them.

**Status:** ✅ Currently working with GitHub (240 tools), Vercel (150 tools), and Neon (166 tools). More integrations coming soon!

---

## 🎯 What It Does

Robinson's Toolkit gives Augment Code direct access to:

### **Currently Integrated (556 tools):**
- **GitHub** (240 tools) ✅ - Repos, branches, PRs, issues, workflows, releases, actions
- **Vercel** (150 tools) ✅ - Projects, deployments, domains, env vars, logs, analytics, edge config
- **Neon** (166 tools) ✅ - Databases, branches, SQL, roles, endpoints, monitoring, backups

### **Coming Soon:**
- **Stripe** (~100 tools) - Customers, subscriptions, payments, products, webhooks
- **Supabase** (~80 tools) - Auth, database, storage, realtime, functions
- **Resend** (~60 tools) - Emails, templates, domains, API keys
- **Twilio** (~70 tools) - SMS, voice, verify, lookup
- **Cloudflare** (~50 tools) - DNS, domains, zones, workers
- **Redis** (~40 tools) - Cache, pub/sub, streams, keys
- **OpenAI** (~30 tools) - Completions, chat, embeddings, models
- **Google Workspace** (~80 tools) - Gmail, Drive, Calendar, Sheets, Docs, Admin
- **Context7** (3 tools) - Documentation retrieval

**Current Total: 556 tools | Target: ~900+ tools**

---

## 💡 Why Robinson's Toolkit?

### **Before (Without Toolkit):**
```
You: "Deploy the latest changes to production"
Augment: "Here's how to deploy:
1. Run 'git push'
2. Go to Vercel dashboard
3. Click 'Deploy'
4. Wait for build
5. Check logs
..."

You: *manually does all the steps*
```

### **After (With Toolkit):**
```
You: "Deploy the latest changes to production"
Augment: *uses github_push*
Augment: *uses vercel_create_deployment*
Augment: *uses vercel_get_deployment_logs*
Augment: "Done! Deployed to production. Build successful. Logs show no errors."

You: *nothing - Augment did it all!*
```

---

## 🚀 Quick Start

### **1. Install**

```bash
cd packages/robinsons-toolkit-mcp
npm install
npm run build
```

### **2. Configure API Keys**

Create a `.env` file:

```bash
# GitHub
GITHUB_TOKEN=ghp_...

# Vercel
VERCEL_TOKEN=...

# Neon
NEON_API_KEY=...

# Stripe
STRIPE_SECRET_KEY=sk_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...

# Resend
RESEND_API_KEY=re_...

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...

# Cloudflare
CLOUDFLARE_API_TOKEN=...

# Redis
REDIS_URL=redis://...

# OpenAI
OPENAI_API_KEY=sk-...
```

### **3. Configure Augment Code**

Add to your Augment Code MCP settings:

```json
{
  "mcpServers": {
    "robinsons-toolkit": {
      "command": "node",
      "args": ["c:/Users/chris/Git Local/robinsonai-mcp-servers/packages/robinsons-toolkit-mcp/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_...",
        "VERCEL_TOKEN": "...",
        "NEON_API_KEY": "...",
        "STRIPE_SECRET_KEY": "sk_...",
        "SUPABASE_URL": "https://...",
        "SUPABASE_ANON_KEY": "...",
        "RESEND_API_KEY": "re_...",
        "TWILIO_ACCOUNT_SID": "...",
        "TWILIO_AUTH_TOKEN": "...",
        "CLOUDFLARE_API_TOKEN": "...",
        "REDIS_URL": "redis://...",
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

### **4. Start Using!**

```
You: "Create a new GitHub repo called 'my-project' and deploy it to Vercel"

Augment: *uses github_create_repo*
Augment: *uses vercel_create_project*
Augment: *uses vercel_create_deployment*
Augment: "Done! Repo created and deployed to Vercel."
```

---

## 🛠️ Available Integrations

### **GitHub (199 tools)**
- Repositories (create, update, delete, list)
- Branches (create, merge, protect, delete)
- Commits (list, compare, status)
- Issues (create, update, label, assign)
- Pull Requests (create, review, merge, approve)
- Workflows (list, run, cancel, logs)
- Releases (create, update, delete, assets)
- And more...

### **Vercel (150 tools)**
- Projects (create, update, delete, settings)
- Deployments (create, promote, cancel, logs)
- Domains (add, verify, remove, DNS)
- Environment Variables (create, update, delete)
- Analytics (metrics, performance, web vitals)
- Storage (blob, KV, Postgres)
- Security (firewall, WAF, IP blocking)
- And more...

### **Neon (145 tools)**
- Projects (create, update, delete, settings)
- Branches (create, merge, reset, clone)
- SQL (execute, query, transaction)
- Databases (create, delete, backup, restore)
- Roles (create, grant, revoke, permissions)
- Endpoints (create, scale, autoscale, suspend)
- Monitoring (metrics, performance, stats)
- And more...

### **Stripe (100 tools)**
- Customers (create, update, delete, list)
- Subscriptions (create, update, cancel, pause)
- Payments (charge, refund, invoice)
- Products (create, update, delete, prices)
- Webhooks (create, test, logs)
- Disputes (list, respond, evidence)
- Payouts (create, list, balance)
- And more...

### **Supabase (80 tools)**
- Auth (signup, login, logout, session)
- Database (query, insert, update, delete)
- Storage (upload, download, delete, list)
- Realtime (subscribe, broadcast, presence)
- Functions (invoke, deploy, logs)
- And more...

---

## 📊 Real-World Examples

### **Example 1: Full Deployment Pipeline**

```
You: "Deploy the latest changes to production with full CI/CD"

Augment:
1. *github_list_commits* - Check latest commits
2. *github_create_pull_request* - Create PR
3. *github_list_workflow_runs* - Check CI status
4. *github_merge_pull_request* - Merge PR
5. *vercel_create_deployment* - Deploy to Vercel
6. *vercel_get_deployment_logs* - Check logs
7. *vercel_promote_deployment* - Promote to production

"Done! Deployed to production. All checks passed."
```

### **Example 2: Database Migration**

```
You: "Create a new database branch, run migration, and merge to main"

Augment:
1. *neon_create_branch* - Create migration branch
2. *neon_run_sql* - Execute migration SQL
3. *neon_get_branch_schema_diff* - Compare schemas
4. *neon_merge_branches* - Merge to main

"Done! Migration complete and merged."
```

### **Example 3: Customer Onboarding**

```
You: "Set up a new customer with subscription and send welcome email"

Augment:
1. *stripe_create_customer* - Create Stripe customer
2. *stripe_create_subscription* - Create subscription
3. *supabase_auth_signup* - Create Supabase account
4. *resend_send_email* - Send welcome email

"Done! Customer onboarded successfully."
```

---

## 🎯 Why NOT Sellable?

Robinson's Toolkit requires **10+ API keys** to function:
- GitHub token
- Vercel token
- Neon API key
- Stripe secret key
- Supabase credentials
- Resend API key
- Twilio credentials
- Cloudflare token
- Redis URL
- OpenAI API key

**This makes it:**
- ❌ Too complex for users to set up
- ❌ High support costs (helping users configure)
- ❌ Security concerns (managing multiple API keys)
- ❌ Not a good product to sell

**But perfect for personal use!** ✅

---

## 💡 Pro Tips

### **1. Use with Credit Optimizer**
```
You: "Use discover_tools to find GitHub deployment tools"
Credit Optimizer: *searches instantly*
You: "Use github_create_deployment"
Robinson's Toolkit: *executes deployment*
```

### **2. Use with Autonomous Agent**
```
You: "Use autonomous agent to generate migration SQL, then use Neon to execute it"
Autonomous Agent: *generates SQL*
Robinson's Toolkit: *executes on Neon*
```

### **3. Chain Operations**
```
You: "Create repo, deploy to Vercel, set up database, configure Stripe"
Augment: *uses 4 integrations seamlessly*
```

---

## 🚀 What's Next?

Once Robinson's Toolkit is set up:

1. **Build Cortiware faster** - Let Augment do the work!
2. **Automate everything** - Deployments, migrations, customer setup
3. **Focus on features** - Not infrastructure
4. **Ship faster** - 4x development speed

---

## 📝 Current Status

### **Available Integrations:**
- ✅ GitHub (199 tools)
- ✅ Vercel (150 tools)
- ✅ Neon (145 tools)
- ✅ Resend (60 tools)
- ✅ Twilio (70 tools)
- ✅ Cloudflare (50 tools)
- ✅ OpenAI (30 tools)
- ✅ Playwright (78 tools)
- ✅ Context7 (3 tools)

### **To Be Built:**
- ⏳ Stripe (100 tools)
- ⏳ Supabase (80 tools)
- ⏳ Redis (40 tools)

---

**Robinson's Toolkit: Augment Code's HANDS to DO things!** 🛠️

**For personal use only - NOT for sale**

