# 6-Server References Update Plan

## 📋 Overview

This document lists all files that mention "6-server" or "6 server" system and provides update instructions.

**Key Clarification:** The 6-agent PLAN still applies! We have:
- 5 MCP Servers (automated agents)
- 1 Human + Primary Coding Agent (User + Augment)

**See:** `ARCHITECTURE_CLARIFICATION.md` for full explanation.

---

## 📝 Files to Update

### 1. **docs/6-SERVER-SETUP-GUIDE.md** ⚠️ MAJOR UPDATE NEEDED

**Current State:**
- Title: "7-Server MCP System with Orchestration"
- References architect-mcp and agent-orchestrator-mcp
- Outdated tool counts (1,197 tools vs 1,165)

**Action Required:**
1. Rename file to `5-SERVER-SETUP-GUIDE.md`
2. Update title to "5-Server MCP System with Human-in-the-Loop Planning"
3. Remove all architect-mcp references
4. Remove all agent-orchestrator-mcp references
5. Add section explaining User + Augment planning workflow
6. Update tool counts to 1,165
7. Update Thinking Tools count to 42
8. Add reference to `ARCHITECTURE_CLARIFICATION.md`

**Priority:** HIGH

---

### 2. **CHATGPT_REQUIREMENTS_ANALYSIS.md** ✅ ALREADY UPDATED

**Current State:**
- Already clarified that 6-agent PLAN still applies
- Explains replacement of architect-mcp and orchestrator-mcp
- References `ARCHITECTURE_CLARIFICATION.md`

**Action Required:** None (already done)

**Priority:** N/A

---

### 3. **validate-5-servers.md** ✅ ALREADY UPDATED

**Current State:**
- Already adapted to 5-server system
- Removed architect-mcp tests
- Added Augment planning workflow tests

**Action Required:** None (already done)

**Priority:** N/A

---

### 4. **COMPREHENSIVE_DOCUMENTATION_AUDIT_RESULTS.md** ⚠️ NEEDS CLARIFICATION

**Current State:**
- Line 49: "ROBINSON_AI_6_SERVER_ARCHITECTURE.md: '6-server system' ❌ WRONG"
- Line 177: "ROBINSON_AI_6_SERVER_ARCHITECTURE.md: '6-server system'"

**Action Required:**
1. Add note explaining that "6-agent system" is correct (5 MCP + User + Augment)
2. Clarify that "6 MCP servers" never existed
3. Reference `ARCHITECTURE_CLARIFICATION.md`

**Priority:** MEDIUM

---

### 5. **READY_FOR_RESTART.md** ⚠️ NEEDS UPDATE

**Current State:**
- Line 26: "Contains: All 6 MCP servers with proper paths"

**Action Required:**
1. Change "6 MCP servers" to "5 MCP servers"
2. Add note about User + Augment = 6-agent system
3. Reference `ARCHITECTURE_CLARIFICATION.md`

**Priority:** MEDIUM

---

### 6. **OPENAI_INTEGRATION_SUMMARY.md** ⚠️ NEEDS CLARIFICATION

**Current State:**
- Line 49: "Before: 6 servers (OpenAI MCP server not connecting)"
- Line 50: "After: 5 servers (OpenAI integrated into Robinson's Toolkit)"

**Action Required:**
1. Add note explaining this was about MCP servers, not agents
2. Clarify current 6-agent system (5 MCP + User + Augment)
3. Reference `ARCHITECTURE_CLARIFICATION.md`

**Priority:** LOW

---

### 7. **CURRENT_STATE.md** ⚠️ NEEDS CLARIFICATION

**Current State:**
- Line 27: "NOT 6 servers (ROBINSON_AI_6_SERVER_ARCHITECTURE.md is wrong)"
- Line 197: "ROBINSON_AI_6_SERVER_ARCHITECTURE.md - Says '6-server system' (never existed)"

**Action Required:**
1. Add note: "6 MCP servers never existed, but 6-agent system is correct"
2. Explain: 5 MCP servers + User + Augment = 6-agent system
3. Reference `ARCHITECTURE_CLARIFICATION.md`

**Priority:** HIGH

---

### 8. **tests/comprehensive-agent-test-results.md** ⚠️ NEEDS CLARIFICATION

**Current State:**
- Line 611: "The 6-server MCP system successfully demonstrated:"
- Line 612: "Multi-agent orchestration across 6 servers"

**Action Required:**
1. Add note: "This test was run with 6 agents (5 MCP + User + Augment)"
2. Clarify that "6 servers" should be "6 agents"
3. Reference `ARCHITECTURE_CLARIFICATION.md`

**Priority:** LOW (historical test results)

---

### 9. **QUICK_START_NEXT_CHAT.md** ⚠️ NEEDS UPDATE

**Current State:**
- Line 144: ".augment/rules/system-architecture.md (5-server architecture)"

**Action Required:**
1. Change to: ".augment/rules/system-architecture.md (5-server + User + Augment = 6-agent architecture)"
2. Reference `ARCHITECTURE_CLARIFICATION.md`

**Priority:** LOW

---

### 10. **MCP_CONFIGURATION_SOLUTION.md** ⚠️ NEEDS UPDATE

**Current State:**
- Line 140: "Auggie CLI: `auggie mcp list` shows 6 servers"

**Action Required:**
1. Change "6 servers" to "5 servers"
2. Add note about 6-agent system
3. Reference `ARCHITECTURE_CLARIFICATION.md`

**Priority:** LOW

---

### 11. **MCP_SERVERS_FIXED.md** ⚠️ NEEDS REVIEW

**Current State:**
- Line 11: "Your `READY_TO_PASTE_CONFIG.json` only had 4 servers:"
- Line 12: "1. ✅ architect-mcp"

**Action Required:**
1. Review if this file is still relevant
2. If relevant, add note about current 5-server system
3. If obsolete, move to `.archive/`

**Priority:** LOW

---

### 12. **DOCUMENTATION_CONSOLIDATION_COMPLETE.md** ⚠️ NEEDS CLARIFICATION

**Current State:**
- Line 115: "Fixed '4-server' to '5-server'"
- Line 201: "Confusion about system state (4 servers? 6 servers? 906 tools? 1165 tools?)"

**Action Required:**
1. Add note explaining final state: 5 MCP servers + User + Augment = 6-agent system
2. Reference `ARCHITECTURE_CLARIFICATION.md`

**Priority:** LOW

---

### 13. **IMMEDIATE_DOCUMENTATION_FIXES.md** ℹ️ NO ACTION NEEDED

**Current State:**
- No "6-server" references (only tool count updates)

**Action Required:** None

**Priority:** N/A

---

## 📊 Summary

### By Priority

**HIGH (2 files):**
1. `docs/6-SERVER-SETUP-GUIDE.md` - Rename and major rewrite
2. `CURRENT_STATE.md` - Add clarification

**MEDIUM (2 files):**
3. `COMPREHENSIVE_DOCUMENTATION_AUDIT_RESULTS.md` - Add clarification
4. `READY_FOR_RESTART.md` - Update server count

**LOW (6 files):**
5. `OPENAI_INTEGRATION_SUMMARY.md` - Add clarification
6. `tests/comprehensive-agent-test-results.md` - Add note
7. `QUICK_START_NEXT_CHAT.md` - Update reference
8. `MCP_CONFIGURATION_SOLUTION.md` - Update server count
9. `MCP_SERVERS_FIXED.md` - Review and update/archive
10. `DOCUMENTATION_CONSOLIDATION_COMPLETE.md` - Add clarification

**ALREADY DONE (2 files):**
11. `CHATGPT_REQUIREMENTS_ANALYSIS.md` ✅
12. `validate-5-servers.md` ✅

---

## 🎯 Recommended Approach

### Phase 1: High Priority (Do Now)
1. Rename and rewrite `docs/6-SERVER-SETUP-GUIDE.md`
2. Update `CURRENT_STATE.md` with clarification

### Phase 2: Medium Priority (Do Soon)
3. Add clarifications to audit results
4. Update `READY_FOR_RESTART.md`

### Phase 3: Low Priority (Do Later)
5. Add notes to historical/reference docs
6. Review and archive obsolete docs

---

## 📝 Standard Clarification Text

Use this text when adding clarifications:

```markdown
## 🎯 Architecture Clarification

**The 6-agent PLAN still applies!**

We have a **6-agent system** consisting of:
- **5 MCP Servers** (automated agents)
- **1 Human + Primary Coding Agent** (User + Augment)

The original 6-server plan was adapted to replace 2 MCP servers (architect-mcp and agent-orchestrator-mcp) with human intelligence (User + Augment Agent).

**See:** `ARCHITECTURE_CLARIFICATION.md` for full explanation.
```

---

## ✅ Verification Checklist

After updates, verify:
- [ ] All "6-server" references clarified or updated
- [ ] All files reference `ARCHITECTURE_CLARIFICATION.md`
- [ ] No confusion between "6 MCP servers" (wrong) and "6-agent system" (correct)
- [ ] Tool counts updated to 1,165 (Robinson's Toolkit) and 42 (Thinking Tools)
- [ ] All obsolete docs moved to `.archive/`

---

**Last Updated:** 2025-11-02  
**Status:** Plan created, ready for implementation

