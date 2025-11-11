# Architecture Decision: REST API Design for Custom GPT Integration

**Date**: 2025-11-11  
**Status**: DECISION REQUIRED  
**Impact**: Critical - affects entire API design and Custom GPT integration

## Current Situation

### What We Have
- **MCP Repo** (`robinsonai-mcp-servers`): 241 GitHub tools defined in broker pattern
- **API Repo** (`robinsons-toolkit-api`): 
  - 130 individual REST endpoints in `api/github/` (e.g., `/api/github/repos/[owner]/[repo]`)
  - Broker handler in `api/handlers/github.js` with 236 GitHub tools (complete implementation)
  - Similar handlers for other integrations (Vercel, Google, etc.)
  - Individual endpoints NOT wired to handlers

### The Problem
- **Custom GPT OpenAPI Limit**: Maximum 30 operations per schema
- **Current Design**: 130 endpoints × 5 HTTP methods (GET, POST, PUT, PATCH, DELETE) = 720 operations
- **Result**: Schema cannot be imported into Custom GPT (exceeds 30 operation limit)

### Root Cause
We created individual REST endpoints for each resource/action, which is RESTful but incompatible with Custom GPT's constraints. The broker handlers exist but aren't being used.

---

## Viable Paths Forward

### Path 1: Unified Broker Endpoints (RECOMMENDED)

**Design**: One POST endpoint per integration category
```
POST /api/github    { "tool": "github_list_repos", "params": {...} }
POST /api/vercel    { "tool": "vercel_list_projects", "params": {...} }
POST /api/neon      { "tool": "neon_create_database", "params": {...} }
... (30 total integrations)
```

**OpenAPI Schema**: 30 operations (one POST per integration)

**Pros**:
- ✅ Fits Custom GPT 30-operation limit perfectly
- ✅ Leverages existing broker handlers (236 GitHub tools already implemented)
- ✅ Scales to all 1,655 tools across 17 integrations
- ✅ Simple, predictable API contract
- ✅ Easy to document and maintain
- ✅ Server-side routing is trivial (switch on tool name)
- ✅ Minimal OpenAPI schema (clean, readable)

**Cons**:
- ❌ Not strictly RESTful (POST for read operations)
- ❌ Requires rewriting/deleting 130 individual endpoints
- ❌ Clients must know tool names (not discoverable via REST conventions)

**Implementation Effort**: 
- Delete `api/github/`, `api/vercel/`, etc. directories
- Create 30 unified endpoints: `api/github.js`, `api/vercel.js`, etc.
- Wire each to corresponding handler
- Generate OpenAPI schema with 30 operations
- **Estimated**: 2-3 hours

---

### Path 2: Hybrid Approach (RESTful + Broker)

**Design**: Keep individual endpoints AND add broker endpoints
```
GET  /api/github/repos                    (RESTful)
POST /api/github                          (Broker - all tools)
```

**OpenAPI Schema**: Only expose broker endpoints (30 operations)

**Pros**:
- ✅ Keeps RESTful endpoints for direct use
- ✅ Broker endpoints for Custom GPT
- ✅ Flexibility for different clients

**Cons**:
- ❌ Massive code duplication (130 endpoints + 30 brokers)
- ❌ Maintenance nightmare (fix a bug in 2 places)
- ❌ Confusing API surface (which endpoint should I use?)
- ❌ Wastes Vercel resources (more functions = higher cost)
- ❌ Still requires deleting/rewriting individual endpoints

**Implementation Effort**: 
- Keep existing endpoints
- Add 30 broker endpoints
- **Estimated**: 3-4 hours (more complex)

---

### Path 3: Single Universal Endpoint

**Design**: One endpoint for everything
```
POST /api/execute
{
  "integration": "github",
  "tool": "github_list_repos",
  "params": {...}
}
```

**OpenAPI Schema**: 1 operation

**Pros**:
- ✅ Absolute minimum OpenAPI footprint
- ✅ Maximum flexibility
- ✅ Easiest to implement

**Cons**:
- ❌ Loses all integration-level organization
- ❌ Harder to document per-integration
- ❌ Less discoverable for API users
- ❌ Doesn't leverage integration-specific context

**Implementation Effort**: 
- Create single `api/execute.js` endpoint
- **Estimated**: 1 hour

---

## Recommendation: Path 1 (Unified Broker Endpoints)

**Why Path 1 is best**:

1. **Perfect fit for Custom GPT**: 30 integrations = 30 operations. Clean, intentional, no waste.

2. **Leverages existing work**: Broker handlers are already complete (236 GitHub tools). We're not throwing away code.

3. **Scales elegantly**: As we add more integrations (Anthropic, Voyage AI, Ollama), we just add more endpoints. No architectural changes needed.

4. **Maintainability**: Single source of truth per integration (one handler, one endpoint). Bug fixes happen once.

5. **Clear semantics**: `/api/github` clearly means "GitHub operations". `/api/vercel` means "Vercel operations". Self-documenting.

6. **Honest about constraints**: We're not pretending to be RESTful when Custom GPT forces us into a broker pattern. Better to be intentional.

7. **Minimal waste**: 30 operations in OpenAPI schema, 30 Vercel functions. No bloat.

**Why NOT Path 2 or 3**:
- Path 2 creates technical debt (duplication, confusion)
- Path 3 loses valuable organization and context

---

## Implementation Plan (Path 1)

1. **Delete individual endpoints**: Remove `api/github/`, `api/vercel/`, etc.
2. **Create unified endpoints**: `api/github.js`, `api/vercel.js`, etc. (30 files)
3. **Wire to handlers**: Each endpoint routes to corresponding handler
4. **Generate OpenAPI schema**: 30 operations, one per integration
5. **Test**: Verify all tools work through unified endpoints
6. **Deploy**: Push to Vercel
7. **Update Custom GPT**: Import new schema

**Estimated Total Time**: 4-6 hours

---

## Decision Required

Proceed with **Path 1: Unified Broker Endpoints**?

If yes, I will:
1. Delete all individual REST endpoints
2. Create 30 unified broker endpoints
3. Wire to existing handlers
4. Generate proper OpenAPI schema
5. Test and deploy
6. Complete GitHub implementation verification

