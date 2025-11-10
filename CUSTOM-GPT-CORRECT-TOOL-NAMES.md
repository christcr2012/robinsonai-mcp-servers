# ✅ CORRECT TOOL NAMES FOR CUSTOM GPT

## The Real Issue

Your Custom GPT was trying to use `github_list_repos` with `owner` parameter, but that's **not the right tool**!

## GitHub Repository Tools

### ❌ WRONG (What Custom GPT tried)
```json
{
  "tool": "github_list_repos",
  "args": { "owner": "christcr2012" }
}
```
**Error**: `UnrecognizedKwargsError: owner` - because `github_list_repos` doesn't accept `owner`!

### ✅ CORRECT Tool Names

#### 1. List a Specific User's Repositories
**Tool**: `github_list_user_repos`  
**Parameters**: `username` (required), `type`, `sort`, `direction`, `per_page`, `page`

```json
{
  "tool": "github_list_user_repos",
  "args": {
    "username": "christcr2012",
    "per_page": 10
  }
}
```

#### 2. List Authenticated User's Repositories
**Tool**: `github_list_repos`  
**Parameters**: `type`, `sort`, `per_page`, `page` (all optional)

```json
{
  "tool": "github_list_repos",
  "args": {
    "type": "owner",
    "per_page": 10
  }
}
```

#### 3. List Organization's Repositories
**Tool**: `github_list_repos`  
**Parameters**: `org` (optional), `type`, `sort`, `per_page`, `page`

```json
{
  "tool": "github_list_repos",
  "args": {
    "org": "my-organization",
    "per_page": 10
  }
}
```

## Common GitHub Tools Reference

### Repository Operations
- `github_list_user_repos` - List a specific user's repos (requires `username`)
- `github_list_repos` - List authenticated user's or org's repos (optional `org`)
- `github_get_repo` - Get repo details (requires `owner`, `repo`)
- `github_create_repo` - Create repository (requires `name`)
- `github_update_repo` - Update repository (requires `owner`, `repo`)
- `github_delete_repo` - Delete repository (requires `owner`, `repo`)

### Content Operations
- `github_get_content` - Get file/directory contents (requires `owner`, `repo`, `path`)
- `github_create_or_update_file` - Create/update file (requires `owner`, `repo`, `path`, `message`, `content`)
- `github_delete_file` - Delete file (requires `owner`, `repo`, `path`, `message`, `sha`)

### Branch Operations
- `github_list_branches` - List branches (requires `owner`, `repo`)
- `github_get_branch` - Get branch details (requires `owner`, `repo`, `branch`)
- `github_create_branch` - Create branch (requires `owner`, `repo`, `branch`, `sha`)

### Issue Operations
- `github_list_issues` - List issues (requires `owner`, `repo`)
- `github_get_issue` - Get issue details (requires `owner`, `repo`, `issue_number`)
- `github_create_issue` - Create issue (requires `owner`, `repo`, `title`)
- `github_update_issue` - Update issue (requires `owner`, `repo`, `issue_number`)

### Pull Request Operations
- `github_list_pulls` - List pull requests (requires `owner`, `repo`)
- `github_get_pull` - Get PR details (requires `owner`, `repo`, `pull_number`)
- `github_create_pull` - Create PR (requires `owner`, `repo`, `title`, `head`, `base`)
- `github_merge_pull` - Merge PR (requires `owner`, `repo`, `pull_number`)

## How to Use in Custom GPT

### Example 1: List User's Repositories
**User asks**: "Show me christcr2012's repositories"

**Custom GPT should call**:
```json
{
  "tool": "github_list_user_repos",
  "args": {
    "username": "christcr2012",
    "per_page": 10
  }
}
```

### Example 2: Get Repository Details
**User asks**: "Show me details of the robinsonai-mcp-servers repo"

**Custom GPT should call**:
```json
{
  "tool": "github_get_repo",
  "args": {
    "owner": "christcr2012",
    "repo": "robinsonai-mcp-servers"
  }
}
```

### Example 3: List Repository Files
**User asks**: "What files are in the packages directory?"

**Custom GPT should call**:
```json
{
  "tool": "github_get_content",
  "args": {
    "owner": "christcr2012",
    "repo": "robinsonai-mcp-servers",
    "path": "packages"
  }
}
```

## Tool Discovery

To find the right tool, Custom GPT should:

1. **Search by keyword**:
   ```
   GET /api/tools/list?q=github+user+repos
   ```

2. **Browse by category**:
   ```
   GET /api/tools/list?category=github&limit=50
   ```

3. **Get tool schema**:
   ```
   GET /api/tools/schema?tool=github_list_user_repos
   ```

## Summary

✅ **Use `github_list_user_repos`** with `username` parameter to list a specific user's repositories  
✅ **Use `github_list_repos`** with optional `org` parameter for authenticated user or organization repos  
✅ **Always check tool schemas** before calling to ensure correct parameters  

---

*Last updated: 2025-11-10*  
*API Status: ✅ Working - Tool schemas are correct*

