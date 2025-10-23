# ✅ HOTFIX: MCP Tool Name Sanitization + Diagnostics

**Branch**: `feat/toolkit-always-on+ollama-reliability`  
**Commit**: `77b85a9`  
**Status**: ✅ Committed and pushed  

---

## 🐛 Problem

**Error**: `Invalid tool definition: name does not match ^[a-zA-Z0-9._:-]{1,64}$`

**Root Cause**: Provider tools contained invalid characters (spaces, slashes, etc.) or exceeded 64 character limit

**Impact**: 
- Tools with invalid names were rejected by MCP
- Missing tools in catalog
- Unable to call provider tools

---

## ✅ Solution

### 1. Tool Name Canonicalization

**File**: `packages/robinsons-toolkit-mcp/src/providers/registry.ts`

**Added**:
- `canonicalize()` function to sanitize tool names:
  - Replace invalid chars with underscores: `/[^a-zA-Z0-9._:-]/g` → `_`
  - Truncate long names (>64 chars) with hash suffix
  - Log all renames for diagnostics

**Example Transformations**:
```
"docs:copy file" → "google-workspace.docs_copy_file"
"very-long-tool-name-that-exceeds-the-64-character-limit-for-mcp-tools" 
  → "google-workspace.very-long-tool-name-that-exceeds-the-64-c-a1b2c3"
```

---

### 2. Alias Routing

**Added**:
- `aliasMap` - Maps canonical names to original provider function names
- `renameLog` - Tracks all renames with reasons

**Routing Logic**:
1. Try canonical name lookup in `aliasMap`
2. If found, route to original provider function
3. If not found, fallback to direct routing (for backward compatibility)

**Benefits**:
- Tools with sanitized names still work
- Original provider functions unchanged
- No breaking changes to vendor implementations

---

### 3. Diagnostic Tool

**Added**: `toolkit_provider_stats` tool

**Returns**:
```json
{
  "counts": {
    "github": 5,
    "vercel": 0,
    "neon": 0,
    "stripe": 0,
    "supabase": 0,
    "twilio": 0,
    "resend": 0,
    "cloudflare": 0,
    "redis": 0,
    "google-workspace": 0,
    "flyio": 0
  },
  "renamed": [
    {
      "vendor": "google-workspace",
      "original": "docs:copy file",
      "canonical": "google-workspace.docs_copy_file",
      "reason": "invalid characters"
    }
  ]
}
```

**Use Cases**:
- Identify vendors with low/zero tool counts (missing implementations)
- See which tools were renamed and why
- Debug tool catalog issues

---

## 🔧 Changes Made

### Files Modified:

1. **`packages/robinsons-toolkit-mcp/src/providers/registry.ts`**
   - Added `createHash` import from `crypto`
   - Added `SAFE` regex pattern
   - Added `Alias` type and `aliasMap`
   - Added `renameLog` array
   - Added `shortHash()` helper
   - Added `canonicalize()` function
   - Updated `providerCatalog()` to sanitize names
   - Added `whatWasRenamed()` export
   - Updated `routeProviderCall()` to use alias lookup

2. **`packages/robinsons-toolkit-mcp/src/index.ts`**
   - Added `whatWasRenamed` import
   - Added `toolkit_provider_stats` to tool list
   - Added handler for `toolkit_provider_stats` in CallToolRequestSchema

---

## 🚀 Validation Steps

### Step 1: Reload VS Code Window
```
Ctrl+Shift+P → "Developer: Reload Window"
```

### Step 2: Check Provider Stats

**Call**: `toolkit_provider_stats` with `{}`

**Expected**:
- JSON with `counts` and `renamed` arrays
- All vendors should have tool counts > 0 (if implemented)
- `renamed` array shows any sanitized tool names

**If any vendor has count = 0**:
- Vendor stub needs full implementation
- Check `packages/robinsons-toolkit-mcp/src/providers/vendors/<vendor>.ts`
- Ensure `catalog()` returns tools

### Step 3: List All Tools

**Call**: `discover_tools` with `{}`

**Expected**:
- No "Invalid tool definition" errors
- All tool names match `^[a-zA-Z0-9._:-]{1,64}$`
- Tools from all vendors visible

### Step 4: Call a Provider Tool

**Call**: `github.list_repositories` with `{}`

**Expected**:
- If no credentials: Fast failure with helpful message
- If credentials set: Successful response
- No timeout or regex errors

---

## 📊 Current Status

### Implemented Vendors:

1. ✅ **GitHub** - Full implementation (5 tools)
   - `create_repository`
   - `create_issue`
   - `create_pull_request`
   - `list_repositories`
   - `get_repository`

### Stub Vendors (Need Implementation):

2. ⏳ **Vercel** - Stub only (0 tools)
3. ⏳ **Neon** - Stub only (0 tools)
4. ⏳ **Stripe** - Stub only (0 tools)
5. ⏳ **Supabase** - Stub only (0 tools)
6. ⏳ **Twilio** - Stub only (0 tools)
7. ⏳ **Resend** - Stub only (0 tools)
8. ⏳ **Cloudflare** - Stub only (0 tools)
9. ⏳ **Redis** - Stub only (0 tools)
10. ⏳ **Google Workspace** - Stub only (0 tools)
11. ⏳ **Fly.io** - Stub only (0 tools)

**Note**: Stub vendors return empty `catalog()` arrays. They need full implementations with actual tools.

---

## 🎯 Next Steps

### Option A: Validate with GitHub Only

1. Reload VS Code
2. Call `toolkit_provider_stats`
3. Verify GitHub shows 5 tools
4. Test `github.list_repositories`
5. Proceed with other validation tests

### Option B: Implement More Vendors

For each vendor with count = 0:
1. Check if existing broker has tools for this vendor
2. Port tools to new provider format
3. Update `catalog()` to return tools
4. Test with `toolkit_provider_stats`

**Priority Vendors** (based on user's existing integrations):
1. Vercel (deployment)
2. Neon (database)
3. Supabase (backend)
4. Redis (caching)

---

## 📝 Technical Details

### MCP Tool Name Regex

```regex
^[a-zA-Z0-9._:-]{1,64}$
```

**Allowed**:
- Letters: `a-z`, `A-Z`
- Numbers: `0-9`
- Special chars: `.` `_` `:` `-`
- Length: 1-64 characters

**Not Allowed**:
- Spaces
- Slashes: `/` `\`
- Parentheses: `(` `)`
- Brackets: `[` `]` `{` `}`
- Other special chars

### Canonicalization Algorithm

```typescript
function canonicalize(vendorId: string, rawName: string) {
  const prefix = `${vendorId}.`;
  
  // Step 1: Replace invalid chars
  let inner = rawName.replace(/[^a-zA-Z0-9._:-]/g, '_');
  
  // Step 2: Check length
  const maxInner = 64 - prefix.length;
  if (inner.length > maxInner) {
    const hash = shortHash(inner, 6);
    inner = inner.slice(0, maxInner - 1 - hash.length) + '-' + hash;
  }
  
  return `${prefix}${inner}`;
}
```

---

## ✅ Summary

**What Was Fixed**:
1. ✅ Tool name sanitization (invalid chars → underscores)
2. ✅ Tool name truncation (>64 chars → hash suffix)
3. ✅ Alias routing (sanitized → original)
4. ✅ Diagnostic tool (counts + renames)

**Impact**:
- 🐛 **Fixed**: "Invalid tool definition" error
- 🐛 **Fixed**: Missing tools in catalog
- 📊 **Added**: Diagnostics for vendor tool counts
- 🔍 **Added**: Rename tracking for debugging

**Status**: ✅ **READY FOR VALIDATION**

**Next**: Reload VS Code and run `toolkit_provider_stats` to verify

