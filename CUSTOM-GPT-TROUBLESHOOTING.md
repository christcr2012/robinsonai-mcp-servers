# Custom GPT Troubleshooting Guide

## Current Status

✅ **FIXED!** - API now supports both nested and flat argument formats
✅ **Tested and working** - `github_list_repos` returns repositories successfully
🎯 **Root cause was**: Custom GPT sends `{ tool, args: {...} }` but API expected `{ tool, param1, param2 }`
🔧 **Solution**: Updated `/api/execute` to handle both formats automatically

---

## What Was Fixed

### Problem
Custom GPT was sending requests in this format:
```json
{
  "tool": "github_list_repos",
  "args": {
    "owner": "christcr2012"
  }
}
```

But the API was only accepting flat format:
```json
{
  "tool": "github_list_repos",
  "owner": "christcr2012"
}
```

This caused `UnrecognizedKwargsError: args` errors.

### Solution
Updated `/api/execute` endpoint to automatically detect and handle **both formats**:
- ✅ Nested: `{ tool, args: {...} }` (Custom GPT format)
- ✅ Flat: `{ tool, param1, param2 }` (Direct format)

**Deployed**: Commit `21ee1b0` - Live on Vercel now!

---

## Your Custom GPT Should Work Now

The API is fixed and deployed. Your Custom GPT should work immediately without any changes needed on your end!

### Step 1: Go to Custom GPT Settings

1. Open ChatGPT
2. Go to your Custom GPT
3. Click **Configure** or **Edit**
4. Navigate to **Actions** section

### Step 2: Update the Schema

**Option A: Reimport from URL (Recommended)**
1. Find the schema URL field
2. Make sure it says: `https://robinsons-toolkit-api.vercel.app/api/openapi`
3. Click **Update** or **Reimport** button
4. Wait for it to fetch the new schema

**Option B: Manual Paste**
1. Copy the schema from: https://robinsons-toolkit-api.vercel.app/api/openapi
2. Paste it into the schema editor
3. Save

### Step 3: Verify Authentication

Make sure the authentication is still configured:
- **Type**: API Key
- **Header name**: `x-api-key`
- **Header value**: `robinson-toolkit-api-secure-key-2025`

### Step 4: Save and Test

1. Click **Save** or **Update**
2. Test by asking: "List my GitHub repositories"
3. It should now work!

---

## What Changed in the New Schema

### Before (OLD - Broken):
```json
{
  "paths": {
    "/api/tools/github-list-repos": {...},  // WRONG - doesn't exist
    "/api/tools/github_repo_contents": {...}  // WRONG - wrong name
  }
}
```

### After (NEW - Fixed):
```json
{
  "paths": {
    "/api/tools/list": {...},  // Discover tools dynamically
    "/api/execute": {...}      // Execute any tool by name
  }
}
```

### How It Works Now:
1. Custom GPT calls `/api/tools/list?q=github` to find tools
2. Discovers `github_list_repos` (correct name)
3. Calls `/api/execute` with `{"tool": "github_list_repos", "args": {...}}`
4. Success!

---

## Verification Tests

### Test 1: Health Check
```bash
curl "https://robinsons-toolkit-api.vercel.app/api/health"
```
**Expected**: `{"ok":true,"status":"healthy",...}`

### Test 2: List GitHub Tools
```bash
curl -H "x-api-key: robinson-toolkit-api-secure-key-2025" \
  "https://robinsons-toolkit-api.vercel.app/api/tools/list?category=github&limit=5"
```
**Expected**: List of 5 GitHub tools including `github_list_repos`

### Test 3: Execute Tool
```bash
curl -X POST "https://robinsons-toolkit-api.vercel.app/api/execute" \
  -H "x-api-key: robinson-toolkit-api-secure-key-2025" \
  -H "Content-Type: application/json" \
  -d '{"tool": "github_list_repos", "args": {"username": "christcr2012", "per_page": 3}}'
```
**Expected**: JSON array with 3 repositories

---

## Common Issues

### Issue: "Error talking to connector"

**Cause**: Custom GPT using old cached schema  
**Fix**: Reimport the OpenAPI schema (see Step 2 above)

### Issue: "Unknown tool: github_repo_contents"

**Cause**: Using wrong tool name  
**Fix**: Correct name is `github_get_content` (not `github_repo_contents`)

### Issue: "Unauthorized"

**Cause**: Missing or wrong API key  
**Fix**: Verify authentication header is `x-api-key: robinson-toolkit-api-secure-key-2025`

### Issue: Custom GPT says "tool doesn't exist"

**Cause**: Tool name typo or using old naming  
**Fix**: Use `/api/tools/list` to discover correct names

---

## Tool Naming Reference

All 1,713 tools follow: **`<category>_<action>`**

### Correct Names:
- ✅ `github_list_repos` - List repositories
- ✅ `github_get_content` - Get file/directory contents
- ✅ `github_get_tree` - Get repository tree
- ✅ `github_create_repo` - Create repository
- ✅ `vercel_list_projects` - List Vercel projects
- ✅ `neon_create_database` - Create Neon database

### Wrong Names (OLD):
- ❌ `github-list-repos` (hyphens instead of underscores)
- ❌ `github_repo_contents` (wrong action name)
- ❌ `github_repo_tree` (wrong action name)

---

## How to Use in Custom GPT

### Example 1: List Repositories
**User**: "List my GitHub repositories"

**Custom GPT should**:
1. Call `/api/tools/list?q=github+list` to find the tool
2. Find `github_list_repos` in results
3. Call `/api/execute` with:
   ```json
   {
     "tool": "github_list_repos",
     "args": {
       "username": "christcr2012"
     }
   }
   ```

### Example 2: Get File Contents
**User**: "Show me the README from my robinsonai-mcp-servers repo"

**Custom GPT should**:
1. Call `/api/tools/list?q=github+content` to find the tool
2. Find `github_get_content` in results
3. Call `/api/execute` with:
   ```json
   {
     "tool": "github_get_content",
     "args": {
       "owner": "christcr2012",
       "repo": "robinsonai-mcp-servers",
       "path": "README.md"
     }
   }
   ```

---

## Next Steps

1. **Reimport the OpenAPI schema** (most important!)
2. **Upload knowledge files** to Custom GPT:
   - `CUSTOM-GPT-KNOWLEDGE.md`
   - `CUSTOM-GPT-SETUP.md`
   - `QUICK-REFERENCE.md`
3. **Test with simple query**: "List my GitHub repositories"
4. **Verify it works** before trying complex operations

---

## Support

If you're still having issues after reimporting:

1. Check the Custom GPT's debug logs (if available)
2. Verify the schema URL is correct
3. Confirm authentication is configured
4. Test the API directly with curl to confirm it's working
5. Try deleting and re-adding the Action entirely

---

*Last updated: 2025-11-10*  
*API Status: ✅ Working*  
*Schema Version: 1.0.0 (Fixed)*

