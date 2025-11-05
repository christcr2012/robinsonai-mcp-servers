# Intelligent Model Selection - Auto-Switch Based on Task

**Date:** 2025-11-05  
**Principle:** Automatically select the BEST model for each specific task type

---

## 🎯 Task-Based Model Selection

### Voyage AI Models (Embeddings)

Based on Voyage AI documentation, here are the best models for each task:

| Task Type | Best Model | Dimensions | Context | Cost | Why |
|-----------|-----------|------------|---------|------|-----|
| **Code Embeddings** | `voyage-code-3` | 1024 | 32K | $0.12/1M | Optimized for code retrieval (best) |
| **General Text** | `voyage-3-large` | 1024 | 32K | $0.12/1M | Best general-purpose quality |
| **Multilingual** | `voyage-3.5` | 1024 | 32K | $0.12/1M | Optimized for multilingual |
| **Fast/Cheap** | `voyage-3.5-lite` | 1024 | 32K | $0.06/1M | Optimized for latency/cost |
| **Finance Docs** | `voyage-finance-2` | 1024 | 32K | $0.12/1M | Optimized for finance |
| **Legal Docs** | `voyage-law-2` | 1024 | 16K | $0.12/1M | Optimized for legal |

**Fallback Chain:**
1. Voyage AI (best for task)
2. OpenAI `text-embedding-3-large` (1536 dims, $0.13/1M)
3. Ollama `nomic-embed-text` (768 dims, FREE)

---

## 📊 Auto-Detection Logic

### 1. Code vs Documentation Detection

```typescript
function detectContentType(filePath: string, content: string): 'code' | 'docs' | 'finance' | 'legal' | 'general' {
  const ext = path.extname(filePath).toLowerCase();
  
  // Code files
  const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs', '.cpp', '.c', '.h'];
  if (codeExts.includes(ext)) return 'code';
  
  // Documentation files
  const docExts = ['.md', '.mdx', '.txt', '.rst'];
  if (docExts.includes(ext)) {
    // Check for finance/legal keywords
    const lowerContent = content.toLowerCase();
    if (/\b(gdpr|hipaa|pci|sox|compliance|regulation|legal|contract|terms)\b/i.test(lowerContent)) {
      return 'legal';
    }
    if (/\b(revenue|profit|earnings|financial|fiscal|quarter|balance sheet|income statement)\b/i.test(lowerContent)) {
      return 'finance';
    }
    return 'docs';
  }
  
  // Config files
  const configExts = ['.json', '.yml', '.yaml', '.toml', '.ini'];
  if (configExts.includes(ext)) return 'code';
  
  return 'general';
}
```

### 2. Model Selection Based on Content Type

```typescript
function selectEmbeddingModel(contentType: 'code' | 'docs' | 'finance' | 'legal' | 'general'): string {
  const modelMap = {
    code: 'voyage-code-3',
    finance: 'voyage-finance-2',
    legal: 'voyage-law-2',
    docs: 'voyage-3-large',
    general: 'voyage-3.5'
  };
  
  return modelMap[contentType] || 'voyage-3.5';
}
```

### 3. Input Type Detection (Query vs Document)

```typescript
function detectInputType(text: string, context: 'indexing' | 'searching'): 'query' | 'document' {
  if (context === 'indexing') {
    // Indexing repository files → always 'document'
    return 'document';
  }
  
  if (context === 'searching') {
    // User search query → always 'query'
    return 'query';
  }
  
  return 'document'; // Default
}
```

---

## 🔧 Implementation

### Updated Embedding Function

```typescript
import voyageai from 'voyageai';
import { request } from 'undici';

interface EmbedOptions {
  contentType?: 'code' | 'docs' | 'finance' | 'legal' | 'general';
  inputType?: 'query' | 'document';
  filePath?: string;
  provider?: 'voyage' | 'openai' | 'ollama' | 'auto';
}

async function embedBatch(
  texts: string[], 
  options: EmbedOptions = {}
): Promise<number[][]> {
  const {
    contentType = 'general',
    inputType = 'document',
    provider = 'auto'
  } = options;
  
  // Auto-detect content type if file path provided
  let detectedType = contentType;
  if (options.filePath && contentType === 'general') {
    detectedType = detectContentType(options.filePath, texts[0] || '');
  }
  
  // Select best model for content type
  const voyageModel = selectEmbeddingModel(detectedType);
  
  console.log(`[embedBatch] Content type: ${detectedType}, Model: ${voyageModel}, Input type: ${inputType}`);
  
  // Try providers in order
  const providers = provider === 'auto' 
    ? ['voyage', 'openai', 'ollama']
    : [provider];
  
  for (const prov of providers) {
    try {
      if (prov === 'voyage') {
        return await voyageEmbed(texts, voyageModel, inputType);
      }
      if (prov === 'openai') {
        return await openaiEmbed(texts);
      }
      if (prov === 'ollama') {
        return await ollamaEmbed(texts);
      }
    } catch (error: any) {
      console.warn(`[embedBatch] ${prov} failed: ${error.message}`);
      // Continue to next provider
    }
  }
  
  throw new Error('All embedding providers failed');
}

async function voyageEmbed(
  texts: string[], 
  model: string = 'voyage-code-3',
  inputType: 'query' | 'document' = 'document'
): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error('VOYAGE_API_KEY missing');
  
  const vo = new voyageai.Client({ apiKey: key });
  
  const result = await vo.embed({
    input: texts,
    model,
    inputType,
    outputDimension: 1024, // Default for all voyage-3 models
    outputDtype: 'float'
  });
  
  return result.embeddings;
}
```

---

## 📋 Updated Indexer Logic

### Batch Files by Content Type

```typescript
async function indexRepo(): Promise<{ files: number; chunks: number }> {
  const root = resolveWorkspaceRoot();
  const files = await fg(INCLUDE, { cwd: root, ignore: EXCLUDE, absolute: true });
  
  // Group files by content type
  const filesByType: Record<string, string[]> = {
    code: [],
    docs: [],
    finance: [],
    legal: [],
    general: []
  };
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const type = detectContentType(file, content);
    filesByType[type].push(file);
  }
  
  console.log('[indexRepo] Files by type:', {
    code: filesByType.code.length,
    docs: filesByType.docs.length,
    finance: filesByType.finance.length,
    legal: filesByType.legal.length,
    general: filesByType.general.length
  });
  
  let totalChunks = 0;
  
  // Index each type with appropriate model
  for (const [type, typeFiles] of Object.entries(filesByType)) {
    if (typeFiles.length === 0) continue;
    
    console.log(`[indexRepo] Indexing ${typeFiles.length} ${type} files...`);
    
    const chunks = await indexFilesOfType(typeFiles, type as any);
    totalChunks += chunks;
    
    console.log(`[indexRepo] ✅ Indexed ${chunks} chunks for ${type}`);
  }
  
  return { files: files.length, chunks: totalChunks };
}

async function indexFilesOfType(
  files: string[], 
  contentType: 'code' | 'docs' | 'finance' | 'legal' | 'general'
): Promise<number> {
  const allChunks: Array<{ text: string; file: string }> = [];
  
  // Chunk all files
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const chunks = chunkByHeuristics(file, content);
    
    for (const chunk of chunks) {
      allChunks.push({ text: chunk.text, file });
    }
  }
  
  // Batch embed with appropriate model
  const texts = allChunks.map(c => c.text);
  const embeddings = await embedBatch(texts, {
    contentType,
    inputType: 'document'
  });
  
  // Save chunks and embeddings
  for (let i = 0; i < allChunks.length; i++) {
    await saveChunk({
      text: allChunks[i].text,
      file: allChunks[i].file,
      embedding: embeddings[i]
    });
  }
  
  return allChunks.length;
}
```

---

## 🔍 Updated Search Logic

### Query with Appropriate Model

```typescript
async function search(query: string, topK: number = 12): Promise<Hit[]> {
  // Detect query content type
  const contentType = detectQueryContentType(query);
  
  console.log(`[search] Query type: ${contentType}`);
  
  // Embed query with appropriate model
  const queryEmbedding = await embedBatch([query], {
    contentType,
    inputType: 'query' // Important: queries use 'query' input type!
  });
  
  // Search with vector similarity
  const hits = await vectorSearch(queryEmbedding[0], topK);
  
  return hits;
}

function detectQueryContentType(query: string): 'code' | 'docs' | 'finance' | 'legal' | 'general' {
  const lower = query.toLowerCase();
  
  // Code-related queries
  if (/\b(function|class|method|variable|import|export|async|await|const|let|var)\b/i.test(lower)) {
    return 'code';
  }
  
  // Finance-related queries
  if (/\b(revenue|profit|earnings|financial|fiscal|quarter|balance|income)\b/i.test(lower)) {
    return 'finance';
  }
  
  // Legal-related queries
  if (/\b(gdpr|hipaa|pci|sox|compliance|regulation|legal|contract|terms)\b/i.test(lower)) {
    return 'legal';
  }
  
  // Documentation queries
  if (/\b(how to|what is|explain|guide|tutorial|documentation)\b/i.test(lower)) {
    return 'docs';
  }
  
  return 'general';
}
```

---

## 📊 Cost Optimization

### Dimension Selection Based on Use Case

```typescript
function selectOutputDimension(contentType: string, useCase: 'indexing' | 'searching'): number {
  // voyage-3-large, voyage-3.5, voyage-3.5-lite, voyage-code-3 support:
  // 2048, 1024 (default), 512, 256
  
  if (useCase === 'indexing') {
    // Use 1024 for indexing (good balance)
    return 1024;
  }
  
  if (useCase === 'searching') {
    // Use 1024 for searching (must match indexing)
    return 1024;
  }
  
  return 1024; // Default
}
```

### Quantization for Storage Savings

```typescript
async function voyageEmbedWithQuantization(
  texts: string[], 
  model: string,
  inputType: 'query' | 'document'
): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error('VOYAGE_API_KEY missing');
  
  const vo = new voyageai.Client({ apiKey: key });
  
  // Use int8 quantization for storage savings (8x smaller!)
  const result = await vo.embed({
    input: texts,
    model,
    inputType,
    outputDimension: 1024,
    outputDtype: 'int8' // 8-bit integers instead of 32-bit floats
  });
  
  // Convert int8 back to float for compatibility
  return result.embeddings.map(emb => 
    emb.map(val => val / 127.0) // Normalize to [-1, 1]
  );
}
```

---

## 🎯 Configuration Updates

### augment-mcp-config.json

```json
{
  "mcpServers": {
    "Thinking Tools MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/thinking-tools-mcp@^1.19.0"],
      "env": {
        "WORKSPACE_ROOT": "C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers",
        "AUGMENT_WORKSPACE_ROOT": "C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers",
        
        "CTX_EMBED_PROVIDER": "voyage",
        "VOYAGE_API_KEY": "pa-CI7Pji8N_i0AqoUYG7RLU2ahNE7_60sHABQPmvg_-rg",
        
        "CTX_EMBED_AUTO_DETECT": "1",
        "CTX_EMBED_CODE_MODEL": "voyage-code-3",
        "CTX_EMBED_DOCS_MODEL": "voyage-3-large",
        "CTX_EMBED_FINANCE_MODEL": "voyage-finance-2",
        "CTX_EMBED_LEGAL_MODEL": "voyage-law-2",
        "CTX_EMBED_GENERAL_MODEL": "voyage-3.5",
        
        "CTX_EMBED_FALLBACK_PROVIDER": "openai",
        "OPENAI_API_KEY": "...",
        "OPENAI_EMBED_MODEL": "text-embedding-3-large",
        
        "CTX_EMBED_FREE_PROVIDER": "ollama",
        "OLLAMA_BASE_URL": "http://localhost:11434",
        "OLLAMA_EMBED_MODEL": "nomic-embed-text",
        
        "RCE_MAX_CHANGED_PER_RUN": "2000",
        "CTX_AUTO_INDEX": "1",
        "CTX_RANKING": "blend"
      }
    }
  }
}
```

---

## 📈 Expected Results

### Before (Ollama only)
- **Chunks Indexed:** 68
- **Model:** `nomic-embed-text` (768 dims)
- **Quality:** LOW-MEDIUM
- **Cost:** $0

### After (Voyage AI with auto-detection)
- **Chunks Indexed:** 2000+
- **Models:** 
  - Code files: `voyage-code-3` (1024 dims)
  - Docs: `voyage-3-large` (1024 dims)
  - Finance: `voyage-finance-2` (1024 dims)
  - Legal: `voyage-law-2` (1024 dims)
  - General: `voyage-3.5` (1024 dims)
- **Quality:** HIGH
- **Cost:** ~$5 one-time indexing + ~$1/month incremental

---

## ✅ Implementation Checklist

### Phase 1: Update Embedding Logic
- [ ] Add `detectContentType()` function
- [ ] Add `selectEmbeddingModel()` function
- [ ] Add `detectInputType()` function
- [ ] Update `embedBatch()` with auto-detection
- [ ] Add Voyage AI client integration

### Phase 2: Update Indexer
- [ ] Group files by content type
- [ ] Index each type with appropriate model
- [ ] Use `input_type="document"` for indexing
- [ ] Save content type metadata with chunks

### Phase 3: Update Search
- [ ] Detect query content type
- [ ] Use `input_type="query"` for queries
- [ ] Match model to indexed content type

### Phase 4: Update Configuration
- [ ] Remove `RCE_EMBED_MODEL` (was forcing Ollama)
- [ ] Add `CTX_EMBED_AUTO_DETECT=1`
- [ ] Add model mappings for each content type
- [ ] Add fallback chain configuration

### Phase 5: Force Reindex
- [ ] Delete `.robinson/context` directory
- [ ] Restart Augment
- [ ] Verify 2000+ chunks indexed
- [ ] Test search quality

---

## 🚀 Next Steps

1. **Implement auto-detection logic** in `packages/thinking-tools-mcp/src/context/embedding.ts`
2. **Update indexer** in `packages/thinking-tools-mcp/src/context/indexer.ts`
3. **Update search** in `packages/thinking-tools-mcp/src/context/search.ts`
4. **Update config** in `augment-mcp-config.json`
5. **Test with real queries** and verify quality improvement

**Timeline:** 2-3 hours implementation + testing  
**Impact:** MASSIVE quality improvement for context engine

