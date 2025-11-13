# Phase 5: Core Tools & Agent-Friendly UX

## Overview

**Core tools** are a curated subset of the most essential and commonly used tools for each integration in Robinson's Toolkit. Instead of exposing all 1,717 tools, core tools provide a focused set of 5-12 tools per category that cover the most common use cases.

### Why Core Tools?

1. **For AI Agents**: Reduces cognitive load by presenting only the most relevant tools for getting started
2. **For Humans**: Provides a quick reference guide to the most important capabilities
3. **For Discovery**: Makes it easier to find the right tool without searching through hundreds of options
4. **For Learning**: New users can learn the toolkit incrementally, starting with core tools

## How Core Tools Work

### Configuration-Based Approach

Core tools are defined in `scripts/core-tools-config.json`, which maps each category to its core tools:

```json
{
  "github": [
    { "name": "github_list_repos", "tags": ["core", "github", "list", "repos", "read"] },
    { "name": "github_get_repo", "tags": ["core", "github", "get", "repo", "read"] },
    ...
  ],
  "vercel": [
    { "name": "vercel_list_projects", "tags": ["core", "vercel", "list", "projects", "read"] },
    ...
  ]
}
```

### Runtime Loading

The MCP server loads this configuration at startup and uses it to:
- Filter tools for `toolkit_list_core_tools`
- Restrict search results for `toolkit_discover_core`
- Provide tag metadata for core tools

### No Tool File Modifications

Unlike Phase 3B (which added `tags` and `dangerLevel` to tool definitions), Phase 5 does NOT modify the 1,717 tool definitions. This approach:
- Avoids complex parsing of multi-line tool definitions
- Centralizes core tool management in one config file
- Makes it easy to update the core tool list without touching tool files

## New Broker Tools

### `toolkit_list_core_tools`

List all core tools, optionally filtered by category.

**Parameters:**
- `category` (optional): Filter by category (e.g., "github", "vercel")
- `includeNonCore` (optional, default: false): Also return some related non-core tools

**Example:**
```typescript
// List all core tools
toolkit_list_core_tools({})

// List GitHub core tools only
toolkit_list_core_tools({ category: "github" })

// List GitHub core tools + 5 related non-core tools
toolkit_list_core_tools({ category: "github", includeNonCore: true })
```

**Response:**
```json
{
  "category": "github",
  "coreToolsCount": 9,
  "totalResults": 9,
  "tools": [
    {
      "name": "github_list_repos",
      "description": "List repositories for authenticated user or organization",
      "category": "github",
      "subcategory": null,
      "tags": ["core", "github", "list", "repos", "read"]
    },
    ...
  ]
}
```

### `toolkit_discover_core`

Natural language search restricted to core tools only.

**Parameters:**
- `query` (required): Natural language description of what you want to do
- `category` (optional): Hint to narrow search to a specific category
- `max_results` (optional, default: 10): Maximum number of results

**Example:**
```typescript
// Find core tools for listing GitHub repositories
toolkit_discover_core({ query: "list github repositories" })

// Find core tools for creating Stripe checkout sessions
toolkit_discover_core({ query: "create stripe checkout session" })

// Find Vercel deployment tools (narrow to vercel category)
toolkit_discover_core({ query: "deploy", category: "vercel", max_results: 5 })
```

**Response:**
```json
{
  "query": "list github repositories",
  "category": "all",
  "totalCoreMatches": 3,
  "showing": 3,
  "results": [
    {
      "name": "github_list_repos",
      "description": "List repositories for authenticated user or organization",
      "category": "github",
      "subcategory": null,
      "tags": ["core", "github", "list", "repos", "read"],
      "whyMatches": "Tool name matches query, Description matches query, Tags match query"
    },
    ...
  ]
}
```

## Core Tools by Category

See `scripts/core-tools-config.json` for the complete list. Here's a summary:

| Category | Core Tools Count | Examples |
|----------|------------------|----------|
| GitHub | 9 | list_repos, get_repo, search_code, create_issue, create_pull_request |
| Vercel | 5 | list_projects, get_project, list_deployments, create_deployment, get_deployment_logs |
| Neon | 5 | list_projects, list_branches, list_databases, run_sql, get_connection_string |
| Upstash/Redis | 6 | set, get, list_keys, lpush, lpop, publish |
| OpenAI | 7 | chat_completion, create_embedding, generate_image, speech_to_text, upload_file, list_files |
| Stripe | 8 | customer_create, payment_intent_create, subscription_create, checkout_session_create |
| Supabase | 5 | db_select, db_insert, db_update, db_delete, auth_sign_up |
| Twilio | 4 | send_sms, list_messages, make_call, get_call |
| Cloudflare | 8 | list_zones, list_dns_records, create_dns_record, read_kv_value, write_kv_value, list_workers |
| Google Workspace | 14 | drive_list_files, docs_create_document, sheets_create_spreadsheet, gmail_send_message, calendar_create_event |
| Postgres | 2 | execute, query |
| Neo4j | 2 | execute, query |
| Qdrant | 3 | vector_search, upsert_points, collections |
| n8n | 3 | workflow_trigger, workflow_list, execution_get_status |
| Playwright | 3 | goto, screenshot, click |
| Resend | 2 | send_email, get_email |
| Context7 | 2 | search_libraries, get_library_docs |

**Total: 75+ core tools across 16 categories**

## Usage Examples

### For AI Agents

```typescript
// 1. Discover what's available
const coreTools = await toolkit_list_core_tools({});
// Returns 75+ core tools across all categories

// 2. Find tools for a specific task
const results = await toolkit_discover_core({ 
  query: "create a new GitHub repository" 
});
// Returns: github_create_repo with explanation of why it matches

// 3. Call the tool
const result = await toolkit_call({
  category: "github",
  tool_name: "github_create_repo",
  arguments: { name: "my-new-repo", private: true }
});
```

### For Humans

```bash
# List all core tools
toolkit_list_core_tools({})

# See what GitHub can do
toolkit_list_core_tools({ category: "github" })

# Find deployment tools
toolkit_discover_core({ query: "deploy" })
```

## Implementation Notes

- Core tools are loaded from `scripts/core-tools-config.json` at server startup
- The config file is the single source of truth for core tool definitions
- Tags are stored in the config and returned by the broker tools
- No modifications to the 1,717 tool definitions in `src/categories/*/tools.ts`
- The registry generator does NOT need to be updated (it already propagates all metadata)

## Next Steps

- Phase 5.5: Testing and validation
- Publish updated package to npm
- Update augment-mcp-config.json with new version

