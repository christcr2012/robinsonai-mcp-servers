# 🧹 Cleanup Plan

## 1. Old Config Files to Delete
## 2. GitHub Repository Cleanup
## 3. Update .gitignore

---

## 📋 PHASE 1: Delete Old Config Files

### **Config Files with Secrets (DELETE)**
- augment-mcp-config-FIXED.json (has secrets)
- AUGMENT_CODE_MCP_CONFIG.json
- AUGMENT_FIX_COMPLETE.json
- CORRECTED_AUGMENT_CONFIG.json
- CORRECT_AUGMENT_CONFIG.json
- WINDOWS_SAFE_MCP_CONFIG.json
- AUGMENT_IMPORT_*.json
- AUGMENT_WORKING_CONFIG.json
- AUGGIE_CLI_CONFIG.json
- FIXED_MCP_CONFIG.json
- LOCAL_AUGMENT_CONFIG.json
- MINIMAL_TEST_CONFIG.json
- MCP_SERVERS_IMPORT.json
- MCP_SERVERS_ONLY.json
- OPENAI_ONLY_MCP_CONFIG.json
- VS_CODE_SETTINGS.json

### **Keep These**
- augment-mcp-config.json (generated from .env.local, safe to commit)
- augment-mcp-config-CLEAN.json (template, no secrets)

---

## 📋 PHASE 2: GitHub Repository Cleanup

### **Issues to Check**
- Exposed secrets in commit history
- Old branches to delete
- Stale pull requests

### **Actions**
1. Check for exposed secrets
2. Clean up old branches
3. Update repository settings
4. Add branch protection rules

---

## 📋 PHASE 3: Update .gitignore

Add patterns to prevent future secret leaks.

