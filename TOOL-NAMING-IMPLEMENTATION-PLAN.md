# Tool Naming Standardization - Implementation Plan

## Overview

Systematic refactoring of all Robinson's Toolkit tools to use intuitive, AI-friendly naming conventions.

---

## 1. Standardize Naming Convention

### Pattern: `verb_object_target`

**Examples**:
- ✅ `list_repos_for_user` (clear target)
- ✅ `list_repos_for_org` (clear target)
- ✅ `list_repos_for_me` (clear target)
- ❌ `github_list_repos` (ambiguous target)
- ❌ `github_list_user_repos` (redundant prefix)

### Target Clarifications
- `for_user` - Specific user (requires `username`)
- `for_org` - Organization (requires `org`)
- `for_me` - Authenticated user (no params needed)
- `by_id` - Lookup by ID
- `by_name` - Lookup by name

### Verb Standardization
- `list` - Get multiple items
- `get` - Get single item
- `create` - Create new item
- `update` - Modify existing item
- `delete` - Remove item
- `search` - Search/query items

---

## 2. Refactor Existing Tools

### GitHub Tools Refactoring

#### Current State (Confusing)
```typescript
// Tool 1: List authenticated user OR org repos
{ 
  name: 'github_list_repos',
  inputSchema: { 
    properties: { 
      org: { type: 'string' } // optional
    }
  }
}

// Tool 2: List specific user's repos
{
  name: 'github_list_user_repos',
  inputSchema: {
    properties: {
      username: { type: 'string' } // required
    },
    required: ['username']
  }
}
```

#### New State (Clear)
```typescript
// Primary wrapper tool (smart routing)
{
  name: 'list_repos',
  description: 'List repositories for a user, organization, or yourself',
  inputSchema: {
    properties: {
      owner: {
        type: 'string',
        description: 'Username or organization name. Omit to list your own repos.'
      },
      type: { type: 'string', enum: ['all', 'owner', 'public', 'private'] },
      sort: { type: 'string' },
      per_page: { type: 'number' },
      page: { type: 'number' }
    }
  },
  metadata: {
    category: 'github',
    subcategory: 'repositories',
    aliases: ['list_repositories', 'get_repos', 'show_repos', 'github_list_repos'],
    tags: ['repository', 'list', 'repos', 'github', 'user', 'org', 'organization'],
    common_use_cases: [
      'list repos for user christcr2012',
      'show all repositories',
      'get repos for organization',
      'list my repositories'
    ],
    examples: [
      { description: 'List repos for user', args: { owner: 'christcr2012' } },
      { description: 'List repos for org', args: { owner: 'github' } },
      { description: 'List my repos', args: {} }
    ]
  }
}

// Specific tools (explicit targets)
{
  name: 'list_repos_for_user',
  description: 'List repositories for a specific user',
  inputSchema: {
    properties: {
      username: { type: 'string' },
      type: { type: 'string' },
      sort: { type: 'string' },
      per_page: { type: 'number' },
      page: { type: 'number' }
    },
    required: ['username']
  },
  metadata: {
    category: 'github',
    subcategory: 'repositories',
    aliases: ['list_user_repos', 'get_user_repositories', 'github_list_user_repos'],
    tags: ['repository', 'user', 'list', 'repos', 'github'],
    common_use_cases: [
      'list repos for user christcr2012',
      'show user repositories',
      'get repos by username'
    ],
    examples: [
      { description: 'List repos for user', args: { username: 'christcr2012' } }
    ]
  }
}

{
  name: 'list_repos_for_org',
  description: 'List repositories for an organization',
  inputSchema: {
    properties: {
      org: { type: 'string' },
      type: { type: 'string' },
      sort: { type: 'string' },
      per_page: { type: 'number' },
      page: { type: 'number' }
    },
    required: ['org']
  },
  metadata: {
    category: 'github',
    subcategory: 'repositories',
    aliases: ['list_org_repos', 'get_org_repositories', 'github_list_org_repos'],
    tags: ['repository', 'organization', 'org', 'list', 'repos', 'github'],
    common_use_cases: [
      'list repos for organization',
      'show org repositories',
      'get repos for company'
    ],
    examples: [
      { description: 'List repos for org', args: { org: 'github' } }
    ]
  }
}

{
  name: 'list_repos_for_me',
  description: 'List your own repositories',
  inputSchema: {
    properties: {
      type: { type: 'string' },
      sort: { type: 'string' },
      per_page: { type: 'number' },
      page: { type: 'number' }
    }
  },
  metadata: {
    category: 'github',
    subcategory: 'repositories',
    aliases: ['list_my_repos', 'get_my_repositories', 'show_my_repos'],
    tags: ['repository', 'authenticated', 'me', 'my', 'list', 'repos', 'github'],
    common_use_cases: [
      'list my repositories',
      'show my repos',
      'get my own repos'
    ],
    examples: [
      { description: 'List my repos', args: {} }
    ]
  }
}

// Aliases (backward compatibility)
{
  name: 'github_list_repos',
  description: 'DEPRECATED: Use list_repos instead',
  alias_for: 'list_repos',
  metadata: {
    deprecated: true,
    replacement: 'list_repos',
    aliases: ['list_repositories', 'get_repos', 'show_repos'],
    tags: ['repository', 'list', 'repos', 'github'],
    common_use_cases: [
      'list repos for user',
      'show repositories',
      'get all repos'
    ]
  }
}

{
  name: 'github_list_user_repos',
  description: 'DEPRECATED: Use list_repos_for_user instead',
  alias_for: 'list_repos_for_user',
  metadata: {
    deprecated: true,
    replacement: 'list_repos_for_user',
    aliases: ['list_user_repositories', 'get_user_repos'],
    tags: ['repository', 'user', 'list', 'repos', 'github'],
    common_use_cases: [
      'list repos for specific user',
      'show user repositories',
      'get repos by username'
    ]
  }
}
```

---

## 3. Add Metadata for AI Discovery

### Metadata Structure

Every tool should include rich metadata to help AI agents discover and use tools correctly:

```typescript
interface ToolMetadata {
  // Organization
  category: string;           // e.g., 'github', 'vercel', 'stripe'
  subcategory?: string;       // e.g., 'repositories', 'deployments', 'customers'

  // Discovery
  aliases: string[];          // Alternative names AI might try
  tags: string[];            // Keywords for search

  // Usage guidance
  common_use_cases: string[]; // Natural language descriptions
  examples: Array<{          // Concrete examples
    description: string;
    args: Record<string, any>;
  }>;

  // Deprecation
  deprecated?: boolean;
  replacement?: string;      // Tool to use instead
}
```

### Benefits for AI Agents

1. **Better Search**: AI can search by tags, aliases, and use cases
2. **Intent Matching**: Common use cases help AI understand when to use each tool
3. **Examples**: Concrete examples show AI exactly how to call the tool
4. **Discovery**: Aliases catch variations in how AI might phrase the request
5. **Migration**: Deprecated tools point to replacements

### Example: Custom GPT Search Flow

```
User: "List repos for christcr2012"

Custom GPT searches metadata:
1. Searches tags: ['repository', 'list', 'repos', 'user']
2. Searches common_use_cases: "list repos for user"
3. Finds: list_repos_for_user
4. Checks examples: { username: 'christcr2012' }
5. Calls tool correctly!
```

---

## 4. Add Wrapper Tools

### Smart Routing Implementation

```typescript
// Wrapper tool that routes to correct endpoint
private async listRepos(args: any) {
  const params: any = {};
  if (args.type) params.type = args.type;
  if (args.sort) params.sort = args.sort;
  if (args.per_page) params.per_page = args.per_page;
  if (args.page) params.page = args.page;
  
  let path: string;
  
  if (args.owner) {
    // Smart detection: try user first, then org
    try {
      path = `/users/${args.owner}/repos`;
      const response = await this.client.get(path, params);
      return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
    } catch (err: any) {
      if (err.status === 404) {
        // User not found, try org
        path = `/orgs/${args.owner}/repos`;
        const response = await this.client.get(path, params);
        return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
      }
      throw err;
    }
  } else {
    // No owner → authenticated user
    path = '/user/repos';
    const response = await this.client.get(path, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }
}

// Specific implementations
private async listReposForUser(args: any) {
  const params: any = {};
  if (args.type) params.type = args.type;
  if (args.sort) params.sort = args.sort;
  if (args.per_page) params.per_page = args.per_page;
  if (args.page) params.page = args.page;
  
  const response = await this.client.get(`/users/${args.username}/repos`, params);
  return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
}

private async listReposForOrg(args: any) {
  const params: any = {};
  if (args.type) params.type = args.type;
  if (args.sort) params.sort = args.sort;
  if (args.per_page) params.per_page = args.per_page;
  if (args.page) params.page = args.page;
  
  const response = await this.client.get(`/orgs/${args.org}/repos`, params);
  return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
}

private async listReposForMe(args: any) {
  const params: any = {};
  if (args.type) params.type = args.type;
  if (args.sort) params.sort = args.sort;
  if (args.per_page) params.per_page = args.per_page;
  if (args.page) params.page = args.page;
  
  const response = await this.client.get('/user/repos', params);
  return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
}
```

---

## 4. Automate Schema Validation

### Using Zod for Type Safety

```typescript
import { z } from 'zod';

// Define schemas
const ListReposSchema = z.object({
  owner: z.string().optional().describe('Username or organization name'),
  type: z.enum(['all', 'owner', 'public', 'private', 'member']).optional(),
  sort: z.string().optional(),
  per_page: z.number().optional(),
  page: z.number().optional(),
});

const ListReposForUserSchema = z.object({
  username: z.string().describe('GitHub username'),
  type: z.enum(['all', 'owner', 'public', 'private', 'member']).optional(),
  sort: z.string().optional(),
  per_page: z.number().optional(),
  page: z.number().optional(),
});

// Convert Zod schema to JSON Schema for MCP
function zodToJsonSchema(schema: z.ZodType): any {
  // Implementation to convert Zod to JSON Schema
  // This ensures type safety AND correct MCP schemas
}

// Tool definitions with validation
const tools = [
  {
    name: 'list_repos',
    description: 'List repositories for a user, organization, or yourself',
    inputSchema: zodToJsonSchema(ListReposSchema),
    validate: (args: any) => ListReposSchema.parse(args),
  },
  {
    name: 'list_repos_for_user',
    description: 'List repositories for a specific user',
    inputSchema: zodToJsonSchema(ListReposForUserSchema),
    validate: (args: any) => ListReposForUserSchema.parse(args),
  },
];
```

---

## 5. Batch Refactor by Category

### Priority Order

#### ✅ Phase 1: GitHub (IMMEDIATE)
**Impact**: HIGH - Most commonly used, most confusion
**Tools to refactor**: 241 tools
**Key patterns**:
- `list_repos` → `list_repos`, `list_repos_for_user`, `list_repos_for_org`, `list_repos_for_me`
- `get_repo` → `get_repo_by_owner` (keep as-is, already clear)
- `create_issue` → `create_issue_for_repo`
- `list_pulls` → `list_pulls_for_repo`

#### 🚀 Phase 2: Vercel (NEXT)
**Impact**: HIGH - Deployment tools, frequently used
**Tools to refactor**: 150 tools
**Key patterns**:
- `vercel_list_projects` → `list_projects`, `list_projects_for_team`
- `vercel_deploy_project` → `deploy_project`
- `vercel_get_deployment` → `get_deployment_by_id`

#### 📡 Phase 3: Google Workspace (WEEK 2)
**Impact**: MEDIUM - Complex hierarchy
**Tools to refactor**: 192 tools
**Key patterns**:
- `gmail_send_message` → `send_email`, `send_email_to`
- `drive_list_files` → `list_files_in_drive`, `list_files_in_folder`
- `calendar_create_event` → `create_calendar_event`

#### 📬 Phase 4: OpenAI (WEEK 2)
**Impact**: MEDIUM - AI operations
**Tools to refactor**: 259 tools
**Key patterns**:
- `openai_create_completion` → `run_model`, `run_model_with_prompt`
- `openai_create_embedding` → `embed_text`
- `openai_list_models` → `list_models`

#### 💳 Phase 5: Stripe (WEEK 3)
**Impact**: MEDIUM - Payment operations
**Tools to refactor**: 105 tools (planned)
**Key patterns**:
- `stripe_create_customer` → `create_customer`
- `stripe_create_payment_intent` → `create_payment_for_customer`
- `stripe_list_charges` → `list_charges_for_customer`

#### 📂 Phase 6: Supabase/Postgres (WEEK 3)
**Impact**: LOW - Database operations
**Tools to refactor**: 80 tools (planned) + 25 tools (active)
**Key patterns**:
- `supabase_select` → `query_table`, `query_table_by_id`
- `postgres_execute` → `run_query`, `run_query_on_table`

---

## Implementation Checklist

### Per Category

- [ ] **Audit existing tools** - List all tools and their current names
- [ ] **Design new naming** - Apply verb_object_target pattern
- [ ] **Create wrapper tools** - Smart routing for common cases
- [ ] **Add Zod schemas** - Type-safe validation
- [ ] **Implement handlers** - New + wrapper + alias handlers
- [ ] **Update tool registry** - Register all tools (new + aliases)
- [ ] **Add tests** - Verify all tools work correctly
- [ ] **Update documentation** - Document new names and migration path
- [ ] **Publish new version** - Bump version, publish to npm
- [ ] **Test with Custom GPT** - Verify AI agents can use new names

---

## Success Metrics

- ✅ 90%+ reduction in AI tool selection errors
- ✅ Custom GPT successfully uses intuitive names
- ✅ All existing code continues to work (backward compatibility)
- ✅ 100% test coverage for new tools
- ✅ Documentation updated and clear

---

*Created: 2025-11-10*  
*Status: READY TO IMPLEMENT*

