# Bug Fixes in Robinson's Toolkit MCP v1.13.2

**Published:** 2025-01-09  
**Version:** 1.13.2  
**Previous Version:** 1.13.1

## 🐛 Bugs Fixed

### 1. **Vercel `vercel_list_projects` Calling Wrong API**

**Problem:**
- Duplicate case statement at line 2396 was calling GitHub's `listProjects()` method instead of Vercel's `vercelListProjects()`
- This caused `vercel_list_projects` to return GitHub 404 errors instead of Vercel projects

**Root Cause:**
```typescript
// WRONG - Line 2396 (removed)
case "vercel_list_projects":
  return await this.listProjects(args);  // ❌ GitHub method!

// CORRECT - Line 3712 (kept)
case 'vercel_list_projects':
  return await this.vercelListProjects(args);  // ✅ Vercel method
```

**Fix:**
- Removed duplicate case statement (lines 2396-2405)
- Now only uses the correct `vercelListProjects()` method

---

### 2. **Vercel `vercelListProjects` Missing teamId Parameter**

**Problem:**
- Method didn't accept or use the `teamId` parameter
- Couldn't filter projects by team

**Fix:**
```typescript
// BEFORE
private async vercelListProjects(args: any) {
  const result = await this.vercelFetch(`/v9/projects`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// AFTER
private async vercelListProjects(args: any) {
  const params = new URLSearchParams();
  if (args.teamId) params.append('teamId', args.teamId);
  const endpoint = params.toString() ? `/v9/projects?${params}` : `/v9/projects`;
  const result = await this.vercelFetch(endpoint);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}
```

---

### 3. **Neon `neon_list_organizations` Using Wrong Endpoint**

**Problem:**
- Was calling `/organizations` endpoint which doesn't exist in Neon API
- Returned "Unexpected end of JSON input" error

**Root Cause:**
- Neon API doesn't have a dedicated `/organizations` endpoint
- Organizations are returned as part of `/users/me` endpoint

**Fix:**
```typescript
// BEFORE
private async neonListOrganizations(args: any) {
  const params = new URLSearchParams();
  if (args.search) params.append('search', args.search);
  const result = await this.neonFetch(`/organizations?${params.toString()}`);  // ❌ Wrong endpoint
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// AFTER
private async neonListOrganizations(args: any) {
  // Neon API: organizations are returned as part of /users/me endpoint
  const result = await this.neonFetch(`/users/me`);  // ✅ Correct endpoint
  let orgs = result.organizations || [];
  
  // Apply search filter if provided
  if (args.search) {
    const searchLower = args.search.toLowerCase();
    orgs = orgs.filter((org: any) =>
      org.name?.toLowerCase().includes(searchLower) ||
      org.id?.toLowerCase().includes(searchLower)
    );
  }
  
  return { content: [{ type: 'text', text: JSON.stringify({ organizations: orgs }, null, 2) }] };
}
```

---

### 4. **Neon `neon_list_projects` Requiring org_id**

**Problem:**
- `neon_list_projects` required `org_id` parameter
- No way to get the user's default organization ID

**Fix:**
- Made `org_id` optional
- Auto-fetches current user's default organization if not provided

```typescript
// BEFORE
private async neonListProjects(args: any) {
  const params = new URLSearchParams();
  if (args.limit) params.append('limit', String(args.limit));
  if (args.search) params.append('search', args.search);
  if (args.cursor) params.append('cursor', args.cursor);
  if (args.org_id) params.append('org_id', args.org_id);  // ❌ Required but no way to get it
  const result = await this.neonFetch(`/projects?${params.toString()}`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// AFTER
private async neonListProjects(args: any) {
  const params = new URLSearchParams();
  if (args.limit) params.append('limit', String(args.limit));
  if (args.search) params.append('search', args.search);
  if (args.cursor) params.append('cursor', args.cursor);
  
  // If org_id not provided, get current user's default org
  if (!args.org_id) {
    const userResult = await this.neonFetch(`/users/me`);
    if (userResult.organizations && userResult.organizations.length > 0) {
      params.append('org_id', userResult.organizations[0].id);  // ✅ Auto-use default org
    }
  } else {
    params.append('org_id', args.org_id);
  }
  
  const result = await this.neonFetch(`/projects?${params.toString()}`);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}
```

---

## ✨ New Features

### 5. **Added `neon_get_current_user` Tool**

**Purpose:**
- Get current user information including email, name, and organizations
- Provides access to user's default organization ID

**Tool Definition:**
```typescript
{
  name: 'neon_get_current_user',
  description: 'Get current user information including email, name, and organizations.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {}
  }
}
```

**Implementation:**
```typescript
private async neonGetCurrentUser(args: any) {
  try {
    const result = await this.neonFetch(`/users/me`);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error: any) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }
}
```

**Example Response:**
```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "name": "John Doe",
  "organizations": [
    {
      "id": "org_xyz789",
      "name": "My Organization",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

## 📊 Summary

**Total Bugs Fixed:** 4  
**New Tools Added:** 1  
**Total Tool Count:** 1,783 tools (was 1,782)

**Categories Affected:**
- Vercel (150 tools) - Fixed `vercel_list_projects`
- Neon (167 tools) - Fixed `neon_list_organizations`, `neon_list_projects`, added `neon_get_current_user`

---

## 🧪 Testing

All fixes were discovered and validated through real-world usage:

1. **Vercel:** Attempted to list projects with team ID → Got GitHub 404 error → Fixed
2. **Neon:** Attempted to list organizations → Got JSON parse error → Fixed
3. **Neon:** Attempted to list projects → Required org_id but no way to get it → Fixed

---

## 📝 Migration Notes

**No breaking changes!** All fixes are backward compatible.

**Recommended Actions:**
1. Update to v1.13.2: `npx -y @robinson_ai_systems/robinsons-toolkit-mcp@1.13.2`
2. Restart Augment to load the new version
3. Test Vercel and Neon tools to verify fixes

---

## 🔗 Related Issues

- Vercel projects returning 404 errors
- Neon organizations endpoint failing
- Neon projects requiring unknown org_id parameter

All issues are now resolved in v1.13.2.

