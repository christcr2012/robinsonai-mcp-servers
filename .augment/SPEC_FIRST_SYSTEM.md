# Spec-First Registry System

## Overview

A task-agnostic, build-time validation system that prevents API hallucinations and ensures complete endpoint coverage. All external HTTP calls are auto-generated from a single source of truth: `packages/free-agent-mcp/spec/tools.registry.json`.

## Architecture

### 1. **Single Source of Truth: tools.registry.json**

Defines all services and endpoints with:
- Base URLs (with env var overrides)
- HTTP method and path
- Input/output schemas (mini format)
- Path parameters
- Descriptions

**Example:**
```json
{
  "services": {
    "apiRoot": {
      "baseEnv": "FREE_AGENT_API_ROOT",
      "defaultBase": "https://chris.srv823383.hstgr.cloud",
      "endpoints": {
        "postgres_query": {
          "path": "/postgres/query",
          "method": "POST",
          "input": {
            "type": "object",
            "props": {
              "query": "string:min1",
              "params": "array:any:opt"
            }
          }
        }
      }
    }
  }
}
```

### 2. **Mini Schema Format**

Simple string-based type definitions:
- `string`, `string:min1`, `string:opt`
- `number`, `number:int`, `number:int:1-100:opt`
- `array:any`, `array:any:opt`
- `record:any`, `record:any:opt`
- `enum:GET,POST,PUT,PATCH,DELETE`
- `url`

### 3. **Zod Schema Generator (zod-from-mini.ts)**

Converts mini schemas to Zod validators at build time:
```typescript
toZod("string:min1") → z.string().min(1)
toZod("number:int:1-100:opt") → z.number().int().min(1).max(100).optional()
```

### 4. **Handler Codegen (gen-tools.ts)**

Generates typed, validated handlers from registry:
```typescript
export const postgres_query_handler = withValidation(
  zod.object({ $body: Z.toZod({...}) }),
  async (i: any) => {
    return http(HOSTS.apiRoot, "/postgres/query", {
      method: "POST",
      body: i.$body
    });
  }
);
```

**Key features:**
- Path parameter interpolation with `encodeURIComponent`
- Query parameter handling
- Request body validation
- Automatic error handling

### 5. **Trusted URL Validation (hosts.ts, client.ts)**

Prevents hallucinated URLs:
```typescript
const HOSTS = {
  apiRoot: process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud",
  qdrant: process.env.QDRANT_URL || "http://localhost:6333",
  // ...
};

// All URLs must match a trusted host
assertTrustedUrl(url); // throws if untrusted
```

### 6. **Spec Coverage Gate (check-spec-coverage.ts)**

Fails build if any required handler is missing:
```bash
[spec-first] ✅ Spec coverage OK (30 handlers)
```

### 7. **LLM Guardrails (guardrails.ts)**

Enforces spec-first prompting:
```typescript
export const SPEC_FIRST_GUARDS = [
  "Spec-first: all external calls MUST use a generated handler",
  "Do NOT invent endpoints; update the spec registry instead",
  "If a needed endpoint is missing, output a minimal spec patch",
  // ...
];
```

### 8. **Smoke Tests (spec.smoke.ts)**

Runtime contract validation:
```bash
pnpm run spec:smoke
[spec-smoke] ✅ Found 30 handlers
[spec-smoke] ✅ Spec smoke tests passed
```

## Workflow

### Adding a New Endpoint

1. **Update registry:**
   ```json
   {
     "my_new_endpoint": {
       "path": "/my/endpoint",
       "method": "POST",
       "input": { "type": "object", "props": { "param": "string:min1" } }
     }
   }
   ```

2. **Run prebuild:**
   ```bash
   pnpm run prebuild
   ```
   - Generates handler with Zod validation
   - Checks coverage (fails if incomplete)

3. **Use generated handler:**
   ```typescript
   import { my_new_endpoint_handler } from "@robinson_ai_systems/free-agent-mcp/handlers";
   
   const result = await my_new_endpoint_handler({ param: "value" });
   ```

### Build Process

```bash
pnpm build
  → npm run prebuild
    → tsx scripts/gen-tools.ts (generates handlers)
    → tsx scripts/check-spec-coverage.ts (validates coverage)
  → tsup (builds TypeScript)
```

## Files

| File | Purpose |
|------|---------|
| `spec/tools.registry.json` | Single source of truth for all endpoints |
| `src/spec/zod-from-mini.ts` | Mini schema → Zod converter |
| `src/http/hosts.ts` | Trusted hosts configuration |
| `src/http/client.ts` | HTTP client with URL validation |
| `scripts/gen-tools.ts` | Handler codegen script |
| `scripts/check-spec-coverage.ts` | Coverage gate |
| `src/handlers/handlers.generated.ts` | Auto-generated handlers (DO NOT EDIT) |
| `src/handlers/index.ts` | Handler exports |
| `src/evals/spec.smoke.ts` | Runtime smoke tests |
| `src/prompt/guardrails.ts` | LLM guardrails |

## Benefits

✅ **No hallucinations** - URLs are whitelisted, endpoints are registered  
✅ **Complete coverage** - Build fails if spec incomplete  
✅ **Type safe** - All inputs validated with Zod  
✅ **Task-agnostic** - Any future task just updates the registry  
✅ **Minimal code** - Handlers are auto-generated  
✅ **Testable** - Smoke tests validate contracts  
✅ **Maintainable** - Single source of truth  

## Environment Variables

```bash
export FREE_AGENT_API_ROOT="https://chris.srv823383.hstgr.cloud"
export QDRANT_URL="http://localhost:6333"
export NEO4J_HTTP_URL="http://localhost:7474"
export LANGCHAIN_API="http://localhost:8080"
```

## Current Coverage

**30 handlers** across 6 services:
- Health & User (2)
- PostgreSQL (8)
- Neo4j (6)
- Qdrant (7)
- LangChain (4)
- Gateway (3)

