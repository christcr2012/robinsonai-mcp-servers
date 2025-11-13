# Phase 2: Legacy Integration Migration - Status

## ✅ COMPLETED: Neon Integration (Template)

**Status:** FULLY COMPLETE - All 165 tools and handlers migrated

**Files Created:**
- `src/categories/neon/tools.ts` - 165 tool definitions
- `src/categories/neon/handlers.ts` - 165 handler functions
- `scripts/extract-all-neon-handlers.py` - Automated extraction script

**Pattern Established:**
```typescript
// tools.ts - Single-line tool definitions
export const NEON_TOOLS = [
  { name: 'neon_list_projects', description: '...', inputSchema: {...} },
  { name: 'neon_create_project', description: '...', inputSchema: {...} },
  // ... 163 more
];

// handlers.ts - Standalone async functions with module-level client
import axios, { AxiosInstance } from 'axios';

// Client singleton
let clientInstance: AxiosInstance | null = null;

function getNeonClient(): AxiosInstance {
  if (!clientInstance) {
    clientInstance = axios.create({
      baseURL: 'https://console.neon.tech/api/v2',
      headers: {
        'Authorization': `Bearer ${process.env.NEON_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
  }
  return clientInstance;
}

// Handler functions
export async function neonListProjects(args: any) {
  const neonClient = getNeonClient();
  const response = await neonClient.get('/projects');
  return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
}
```

**Key Transformations:**
1. `this.client` → `neonClient` (module-level singleton)
2. `this.isEnabled` → `process.env.NEON_API_KEY`
3. `this.apiKey` → `process.env.NEON_API_KEY`
4. Class methods → Standalone async functions

**Integration Steps:**
1. Extract tools from temp file → `src/categories/neon/tools.ts`
2. Extract handlers from temp file → `src/categories/neon/handlers.ts`
3. Update `src/all-tools.ts` to export `NEON_TOOLS`
4. Update `scripts/generate-registry.mjs` with category mapping
5. Run `npm run build` (tsup now compiles all handler files)
6. Test with broker (category appears, tools list, handlers execute)
7. Git commit

**Test Results:**
- ✅ 165 tools registered
- ✅ Category appears in toolkit_list_categories
- ✅ Tools appear in toolkit_list_tools
- ✅ Handlers execute via toolkit_call
- ✅ All smoke tests passing

---

## 🔄 REMAINING INTEGRATIONS

### 2. Upstash (Redis)
**Source:** `temp-redis-mcp.ts` (2,004 lines)
**Estimated Tools:** ~150+
**Structure:** Inline tool definitions in setupHandlers method (different from Neon)
**Challenge:** Tools and handlers are interleaved, not separate methods
**Status:** NOT STARTED

### 3. Vercel
**Source:** `temp-vercel-mcp.ts` (3,626 lines)
**Estimated Tools:** ~200+
**Status:** NOT STARTED

### 4. GitHub
**Source:** `temp-github-mcp.ts` (2,341 lines) + `standalone/integration-servers/github-mcp/`
**Estimated Tools:** ~240
**Status:** NOT STARTED

### 5. Google Workspace
**Source:** `temp-google-workspace-mcp.ts` (1,603 lines) + `standalone/integration-servers/google-workspace-mcp/`
**Estimated Tools:** ~120+
**Status:** NOT STARTED

### 6. OpenAI
**Source:** `standalone/integration-servers/openai-mcp/src/index.ts`
**Estimated Tools:** TBD
**Status:** NOT STARTED

---

## 📋 NEXT STEPS

For each remaining integration:

1. **Analyze source structure** - Determine if it follows Neon pattern (separate methods) or Redis pattern (inline)
2. **Extract tools** - Create `src/categories/{name}/tools.ts`
3. **Extract/adapt handlers** - Create `src/categories/{name}/handlers.ts`
4. **Wire into toolkit:**
   - Add to `src/all-tools.ts`
   - Add to `scripts/generate-registry.mjs`
   - Add to `CATEGORY_METADATA` in generate-registry.mjs
5. **Build and test:**
   - `npm run build`
   - Verify category appears
   - Verify tools list
   - Test at least one handler execution
6. **Git commit** with clear message

---

## 🛠️ BUILD SYSTEM UPDATES

**tsup.config.ts** - Now compiles all handler files:
```typescript
import fg from 'fast-glob';
const handlerFiles = fg.sync('src/categories/**/handlers.ts');
export default defineConfig({
  entry: ['src/index.ts', 'src/all-tools.ts', ...handlerFiles],
  // ...
});
```

**scripts/generate-registry.mjs** - Maps categories to handlers:
```javascript
const TOOL_FILE_MAPPING = {
  'categories/neon/tools.ts': { 
    category: 'neon', 
    handlerModule: './categories/neon/handlers.js', 
    exportName: 'NEON_TOOLS' 
  },
  // ... add more here
};
```

---

## 📊 CURRENT TOOLKIT STATUS

- **Total Tools:** 796
- **Total Categories:** 10
- **Completed Migrations:** 1 (Neon)
- **Remaining Migrations:** 5 (Upstash, Vercel, GitHub, Google, OpenAI)
- **Estimated Final Tool Count:** ~1,700+

---

## ✅ QUALITY GATES

All integrations must pass:
1. Build succeeds without errors
2. Category appears in `toolkit_list_categories`
3. Tools appear in `toolkit_list_tools`
4. At least one handler executes successfully via `toolkit_call`
5. Smoke tests pass
6. Git commit with clear message

