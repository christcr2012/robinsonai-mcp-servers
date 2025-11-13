# Neon Database Listing Fix - 400 Bad Request

## Problem
The `neon_list_projects` tool in Robinson's Toolkit was returning a 400 Bad Request error when called without parameters.

## Root Cause
The Neon API **requires** an `org_id` parameter when listing projects. The error message from Neon API:

```json
{
  "request_id": "ce4d6481-18a4-4c01-919e-f5e65e9bd254",
  "code": "",
  "message": "org_id is required, you can find it on your organization settings page"
}
```

## Investigation Process

### 1. Added Debug Logging
Added comprehensive error logging to capture the exact API response:

```typescript
console.error('[NEON ERROR] Status:', error.response?.status);
console.error('[NEON ERROR] Message:', error.response?.data?.message || error.message);
```

### 2. Direct API Testing
Created `test-neon-api.mjs` to test the Neon API directly:

**Test 1: Without org_id** → ❌ 400 Bad Request
```
GET https://console.neon.tech/api/v2/projects
Result: "org_id is required"
```

**Test 2: Get organizations** → ✅ Success
```
GET https://console.neon.tech/api/v2/users/me/organizations
Result: { "organizations": [{ "id": "org-gentle-sky-39351997", ... }] }
```

**Test 3: With org_id** → ✅ Success
```
GET https://console.neon.tech/api/v2/projects?org_id=org-gentle-sky-39351997
Result: { "projects": [{ "id": "jolly-glitter-79450377", "name": "Cortiware", ... }] }
```

## The Fix

Updated `neonListProjects` in `packages/robinsons-toolkit-mcp/src/categories/neon/handlers.ts`:

```typescript
export async function neonListProjects(args: any) {
  const neonClient = getNeonClient();
  try {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.cursor) params.append('cursor', args.cursor);
    
    // If org_id not provided, fetch user's default organization
    let orgId = args.org_id;
    if (!orgId) {
      console.error('[NEON] org_id not provided, fetching user organizations...');
      const orgsResponse = await neonClient.get('/users/me/organizations');
      const organizations = orgsResponse.data.organizations || [];
      
      if (organizations.length === 0) {
        throw new Error('No organizations found for this user. Please create an organization first.');
      }
      
      // Use the first organization
      orgId = organizations[0].id;
      console.error('[NEON] Using default organization:', orgId);
    }
    
    params.append('org_id', orgId);

    const url = `/projects?${params.toString()}`;
    console.error('[NEON] Fetching projects with URL:', url);
    
    const response = await neonClient.get(url);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error('[NEON ERROR] Failed to list projects:');
    console.error('[NEON ERROR] Status:', error.response?.status);
    console.error('[NEON ERROR] Message:', error.response?.data?.message || error.message);
    
    // Return user-friendly error message
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(`Failed to list Neon projects: ${errorMessage}`);
  }
}
```

## Key Changes

1. **Auto-fetch organization**: If `org_id` is not provided in args, automatically fetch the user's organizations
2. **Use default org**: Use the first organization from the list as the default
3. **Always include org_id**: Append org_id to the request parameters
4. **Better error handling**: Provide clear error messages if no organizations exist

## Testing

After the fix, the tool should work without requiring manual org_id parameter:

```javascript
// Before (failed):
toolkit_call("neon", "neon_list_projects", {})
// Error: 400 Bad Request - org_id is required

// After (success):
toolkit_call("neon", "neon_list_projects", {})
// Returns: { "projects": [...] }
```

## Files Modified

- `packages/robinsons-toolkit-mcp/src/categories/neon/handlers.ts` - Fixed neonListProjects function
- Tool name unchanged: `neon_list_projects`

## Next Steps

1. Reload MCP configuration in Augment
2. Test the fixed tool
3. Verify it returns Neon projects successfully

