# 🧠 Cognitive Operators - Thinking Tools MCP v1.3.0

**Date:** 2025-11-02  
**Package:** `@robinson_ai_systems/thinking-tools-mcp@1.3.0`  
**Status:** ✅ Published to npm  

---

## 📋 WHAT'S NEW

### **6 New Cognitive Operators**

Transforms Thinking Tools from simple sequential reasoning into a **comprehensive cognitive toolkit** with structured, artifact-based outputs.

**New Tools:**
1. **`think_swot`** - Structured SWOT analysis with confidence and evidence mapping
2. **`think_devils_advocate`** - Generate counter-arguments, failure tests, disconfirming evidence
3. **`think_premortem`** - Imagine project failure; enumerate failure modes and mitigations
4. **`think_decision_matrix`** - Weighted scoring (Pugh/WSM) with CSV export
5. **`think_critique_checklist`** - Quality checklist against draft files
6. **`think_review_change`** - **Composition tool** - Creates review packet (SWOT + Premortem + Checklist)

**Total Tools:** 42 (was 36)
- 15 cognitive frameworks
- 3 reasoning modes
- 6 Context7 API tools
- 8 Context Engine tools
- 4 Web Context tools
- **6 Cognitive Operators** ← NEW

---

## 🎯 KEY FEATURES

### **1. Artifact-Based Outputs**
Every tool writes **both JSON and Markdown** to `.robctx/thinking/`:
- **JSON** - Machine-readable, structured data for chaining
- **Markdown** - Human-readable, editable templates

**Example:**
```
.robctx/thinking/
├── swot--unify-mcp-servers--2025-11-02T06-30-00-000Z.json
├── swot--unify-mcp-servers--2025-11-02T06-30-00-000Z.md
├── premortem--enable-autonomous-crawling--2025-11-02T06-31-00-000Z.json
├── premortem--enable-autonomous-crawling--2025-11-02T06-31-00-000Z.md
└── ...
```

### **2. Evidence-Based Reasoning**
All tools accept `evidence_paths` parameter to reference:
- Repo maps (`.robctx/context/repo_map.json`)
- Web crawl results (`.robctx/web/crawl--*.json`)
- Design docs, diffs, prior decisions
- Any JSON/MD file in the repo

**Example:**
```javascript
think_swot_Thinking_Tools_MCP({
  subject: "Unify MCP servers into single Toolkit",
  context_notes: "goal: one-connection power server",
  evidence_paths: [
    ".robctx/context/repo_map.json",
    ".robctx/web/search--mcp-best-practices.json"
  ]
})
```

### **3. Chainable Operations**
Tools return compact JSON results that can be piped into later steps:

```javascript
// Step 1: SWOT analysis
const swot = think_swot({ subject: "Feature X", evidence_paths: [...] })
// Returns: { ok: true, jsonPath: "...", mdPath: "..." }

// Step 2: Premortem based on SWOT findings
const pre = think_premortem({ 
  project: "Feature X", 
  evidence_paths: [swot.jsonPath, ...] 
})

// Step 3: Critique the design doc
const critique = think_critique_checklist({
  draft_path: "DESIGN.md",
  checklist: ["Scope explicit", "Test plan present", ...]
})
```

### **4. Composition Tool**
**`think_review_change`** creates a complete review packet in one call:

```javascript
think_review_change_Thinking_Tools_MCP({
  title: "Migrate to unified Toolkit server",
  evidence_paths: [
    ".robctx/context/repo_map.json",
    "docs/TOOLKIT_ARCH.md"
  ]
})

// Creates 3 artifacts:
// 1. SWOT analysis
// 2. Premortem (14-day horizon)
// 3. Checklist critique
```

---

## 🔧 TOOL REFERENCE

### **1. think_swot**
**Purpose:** Structured SWOT analysis with confidence scoring

**Input:**
```javascript
{
  subject: "System, change, or decision to evaluate",
  context_notes: "Optional notes",
  evidence_paths: ["file1.json", "file2.md"]
}
```

**Output:**
```javascript
{
  ok: true,
  jsonPath: ".robctx/thinking/swot--subject--timestamp.json",
  mdPath: ".robctx/thinking/swot--subject--timestamp.md"
}
```

**JSON Structure:**
```json
{
  "subject": "...",
  "strengths": [
    { "text": "...", "evidence": "file.json", "confidence": 0.8 }
  ],
  "weaknesses": [...],
  "opportunities": [...],
  "threats": [...],
  "summary": "...",
  "evidence": ["file1.json", "file2.md"],
  "created_at": "2025-11-02T06:30:00.000Z",
  "notes": "..."
}
```

---

### **2. think_devils_advocate**
**Purpose:** Generate strongest counter-arguments and failure tests

**Input:**
```javascript
{
  claim: "Publishing the Toolkit to NPM is safe and low maintenance",
  assumptions: ["CI protects tokens", "versions are stable"],
  evidence_paths: ["COMPLIANCE_POLICY.md"]
}
```

**Output:**
```javascript
{
  ok: true,
  jsonPath: ".robctx/thinking/devils-advocate--claim--timestamp.json",
  mdPath: ".robctx/thinking/devils-advocate--claim--timestamp.md"
}
```

**JSON Structure:**
```json
{
  "claim": "...",
  "assumptions": ["...", "..."],
  "counters": [
    {
      "argument": "...",
      "test": "...",
      "severity": "low|med|high",
      "evidence": "file.json"
    }
  ],
  "checks": {
    "falsification_tests": ["...", "..."],
    "monitoring_signals": ["...", "..."]
  },
  "evidence_paths": ["..."],
  "created_at": "..."
}
```

---

### **3. think_premortem**
**Purpose:** Imagine project failure; enumerate failure modes and mitigations

**Input:**
```javascript
{
  project: "Enable autonomous crawling from MCP agents",
  horizon_days: 21,
  evidence_paths: ["changes/feature-plan.md"]
}
```

**Output:**
```javascript
{
  ok: true,
  jsonPath: ".robctx/thinking/premortem--project--timestamp.json",
  mdPath: ".robctx/thinking/premortem--project--timestamp.md"
}
```

**JSON Structure:**
```json
{
  "project": "...",
  "horizon_days": 21,
  "failures": [
    {
      "mode": "...",
      "impact": "low|med|high",
      "mitigation": "...",
      "owner": "...",
      "indicator": "..."
    }
  ],
  "evidence_paths": ["..."],
  "created_at": "..."
}
```

---

### **4. think_decision_matrix**
**Purpose:** Weighted scoring (Pugh/WSM) with CSV export

**Input:**
```javascript
{
  title: "Pick web search provider",
  options: ["Tavily", "Bing", "SerpAPI"],
  criteria: ["Cost", "Quality", "Speed", "TOS Risk"],
  weights: [0.25, 0.35, 0.25, 0.15]  // Must sum ~1.0
}
```

**Output:**
```javascript
{
  ok: true,
  jsonPath: ".robctx/thinking/decision--title--timestamp.json",
  mdPath: ".robctx/thinking/decision--title--timestamp.md"
}
```

**JSON Structure:**
```json
{
  "title": "...",
  "criteria": ["Cost", "Quality", "Speed", "TOS Risk"],
  "weights": [0.25, 0.35, 0.25, 0.15],
  "scores": {
    "Tavily": { "Cost": 0, "Quality": 0, "Speed": 0, "TOS Risk": 0 },
    "Bing": { "Cost": 0, "Quality": 0, "Speed": 0, "TOS Risk": 0 },
    "SerpAPI": { "Cost": 0, "Quality": 0, "Speed": 0, "TOS Risk": 0 }
  },
  "totals": {},
  "recommendation": "",
  "created_at": "..."
}
```

**Markdown includes CSV template:**
```csv
option,Cost,Quality,Speed,TOS Risk
Tavily,0,0,0,0
Bing,0,0,0,0
SerpAPI,0,0,0,0
```

---

### **5. think_critique_checklist**
**Purpose:** Quality checklist against draft files

**Input:**
```javascript
{
  draft_path: "DESIGN.md",
  checklist: [
    "Scope explicit",
    "Interfaces defined",
    "Test plan present",
    "Rollout + rollback plan",
    "No TODO/placeholder"
  ]
}
```

**Output:**
```javascript
{
  ok: true,
  jsonPath: ".robctx/thinking/critique--DESIGN-md--timestamp.json",
  mdPath: ".robctx/thinking/critique--DESIGN-md--timestamp.md"
}
```

**Default Checklist (if not provided):**
- Clarity of purpose
- Inputs/Outputs explicit
- Edge-cases covered
- No TODO/placeholder left
- Testability
- Risks & mitigations recorded

---

### **6. think_review_change** (Composition Tool)
**Purpose:** Creates complete review packet (SWOT + Premortem + Checklist)

**Input:**
```javascript
{
  title: "Migrate to unified Toolkit server",
  evidence_paths: [
    ".robctx/context/repo_map.json",
    "docs/TOOLKIT_ARCH.md"
  ]
}
```

**Output:**
```javascript
{
  ok: true,
  packet: {
    swot: { ok: true, jsonPath: "...", mdPath: "..." },
    premortem: { ok: true, jsonPath: "...", mdPath: "..." },
    checklist: { ok: true, jsonPath: "...", mdPath: "..." }
  }
}
```

**Creates 3 artifacts automatically:**
1. SWOT analysis with "Change Review Packet" context
2. Premortem with 14-day horizon
3. Checklist critique of first evidence file

---

## 📊 USAGE EXAMPLES

### **Example 1: SWOT Analysis**
```javascript
think_swot_Thinking_Tools_MCP({
  subject: "Unify MCP servers into single Toolkit",
  context_notes: "goal: one-connection power server",
  evidence_paths: [
    ".robctx/context/repo_map.json",
    ".robctx/web/search--mcp-best-practices.json"
  ]
})
```

### **Example 2: Devil's Advocate**
```javascript
think_devils_advocate_Thinking_Tools_MCP({
  claim: "Publishing the Toolkit to NPM is safe and low maintenance",
  assumptions: [
    "CI protects tokens",
    "versions are stable"
  ],
  evidence_paths: [
    "COMPLIANCE_POLICY.md",
    ".robctx/web/crawl--security-guides.json"
  ]
})
```

### **Example 3: Premortem**
```javascript
think_premortem_Thinking_Tools_MCP({
  project: "Enable autonomous crawling from MCP agents",
  horizon_days: 21,
  evidence_paths: ["changes/feature-plan.md"]
})
```

### **Example 4: Decision Matrix**
```javascript
think_decision_matrix_Thinking_Tools_MCP({
  title: "Pick web search provider",
  options: ["Tavily", "Bing", "SerpAPI"],
  criteria: ["Cost", "Quality", "Speed", "TOS Risk"],
  weights: [0.25, 0.35, 0.25, 0.15]
})
```

### **Example 5: Critique Checklist**
```javascript
think_critique_checklist_Thinking_Tools_MCP({
  draft_path: "DESIGN.md",
  checklist: [
    "Scope explicit",
    "Interfaces defined",
    "Test plan present",
    "Rollout + rollback plan",
    "No TODO/placeholder"
  ]
})
```

### **Example 6: Complete Review Packet**
```javascript
think_review_change_Thinking_Tools_MCP({
  title: "Migrate to unified Toolkit server",
  evidence_paths: [
    ".robctx/context/repo_map.json",
    "docs/TOOLKIT_ARCH.md"
  ]
})
```

---

## 💡 BEST PRACTICES

### **1. Always Feed Evidence**
Pipe in repo maps, diffs, crawl summaries, and prior decisions:
```javascript
evidence_paths: [
  ".robctx/context/repo_map.json",
  ".robctx/web/crawl--docs.json",
  "DESIGN.md",
  ".robctx/thinking/swot--prior-analysis.json"
]
```

### **2. Use Composition Tool as Default**
Start with `think_review_change` for reviews - it produces 3 artifacts you can refine:
```javascript
think_review_change({ title: "Feature X", evidence_paths: [...] })
```

### **3. Add a "Refine" Pass**
Have your coding agent open the generated MD and complete the bullet skeletons with specifics from evidence files.

### **4. Wire into CI**
Add a task that fails PRs if new files contain "TODO/PLACEHOLDER" and there's no matching `think_critique_checklist` artifact.

---

## 📦 DEPLOYMENT

### **1. Install Updated Package**
```bash
npm i -g @robinson_ai_systems/thinking-tools-mcp@1.3.0
```

### **2. Update Augment Config**
```json
{
  "mcpServers": {
    "Thinking Tools MCP": {
      "command": "npx",
      "args": ["-y", "@robinson_ai_systems/thinking-tools-mcp@1.3.0"]
    }
  }
}
```

### **3. Restart Augment**
- Ctrl+Shift+P → Developer: Reload Window

### **4. Test New Tools**
```javascript
// Test SWOT
think_swot_Thinking_Tools_MCP({
  subject: "Test subject",
  evidence_paths: []
})

// Test Review Packet
think_review_change_Thinking_Tools_MCP({
  title: "Test change",
  evidence_paths: []
})
```

---

## ✅ SUMMARY

**What Changed:**
- ✅ Added 6 cognitive operators (SWOT, Devil's Advocate, Premortem, Decision Matrix, Critique, Review Change)
- ✅ All tools write artifacts to `.robctx/thinking/` (JSON + MD)
- ✅ Evidence-based reasoning (reference any file in repo)
- ✅ Chainable operations (pipe results between tools)
- ✅ Composition tool for complete review packets
- ✅ Published v1.3.0 to npm
- ✅ Updated setup script and config

**Impact:**
- **Structured, reusable artifacts** (not just one-off text)
- **Chain cleanly with Context Engine** (repo + web artifacts go in, MD/JSON comes out)
- **Professional thinking moves** (SWOT, Devil's Advocate, Premortem, etc.)
- **Production-ready reviews** (complete review packets in one call)

**Ready to use!** 🚀

