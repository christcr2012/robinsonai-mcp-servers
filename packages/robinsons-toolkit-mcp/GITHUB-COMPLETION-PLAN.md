# GitHub Category Completion Plan

**Status:** IN PROGRESS  
**Current Tools:** 241  
**Target Tools:** ~541 (60% coverage) → ~900 (100% coverage)  
**Started:** 2025-11-12

---

## 🎯 PHASE 1: FIX EXISTING 241 TOOLS

### Step 1.1: Fix Tool Names ✅ COMPLETE
- ✅ Analyzed all 241 tool names
- ✅ Found only 1 tool needs renaming
- ⏳ Rename: `github_delete_workflow_run_logs` → `github_delete_workflow_run_log`
- ⏳ Add "download" to standard verbs

### Step 1.2: Verify All Definitions Exist ⏳ NEXT
**Task:** Ensure all 241 tools have proper tool definitions in index.ts

**Method:**
```bash
# Extract all tool names from definitions
grep -o "name: 'github_[^']*'" src/index.ts | wc -l

# Should equal 241
```

**If mismatch:**
- Find missing definitions
- Create definitions for missing tools

### Step 1.3: Verify All Handlers Exist ⏳ PENDING
**Task:** Ensure all 241 tools have handler case statements

**Method:**
```bash
# Extract all handler cases
grep -o "case 'github_[^']*':" src/index.ts | wc -l

# Should equal 241
```

**If mismatch:**
- Find missing handlers
- Implement missing handlers

### Step 1.4: Verify Definitions Match Handlers ⏳ PENDING
**Task:** Ensure every definition has a handler and vice versa

**Method:**
- Compare definition names vs handler case names
- Find orphaned definitions (no handler)
- Find orphaned handlers (no definition)

### Step 1.5: Test All 241 Tools ⏳ PENDING
**Task:** Verify all tools are callable and return proper responses

**Method:**
- Use toolkit_call to test each tool
- Document any broken tools
- Fix broken tools

---

## 🎯 PHASE 2: ADD MISSING HIGH-PRIORITY TOOLS (~150 tools)

### Category 2.1: Models API (NEW 2025) - ~20 tools
**Priority:** CRITICAL - Brand new GitHub feature

**Subcategories:**
1. Models Catalog (~7 tools)
   - list_models
   - get_model
   - search_models
   
2. Models Embeddings (~7 tools)
   - create_embedding
   - create_batch_embeddings
   - get_embedding_model
   
3. Models Inference (~6 tools)
   - create_completion
   - create_chat_completion
   - create_streaming_completion

**FREE Agent Task:**
```
Analyze GitHub Models API documentation and generate tool definitions for:
- Models catalog endpoints
- Models embeddings endpoints
- Models inference endpoints

Output: JSON file with tool definitions following pattern:
{
  name: 'github_{verb}_{noun}',
  description: '...',
  inputSchema: { ... }
}
```

### Category 2.2: Copilot - ~15 tools
**Priority:** CRITICAL - Major GitHub product

**Subcategories:**
1. Copilot Metrics (~8 tools)
   - get_copilot_usage_metrics
   - get_copilot_seat_usage
   - list_copilot_metrics
   
2. Copilot User Management (~7 tools)
   - Already have: add_copilot_seats, remove_copilot_seats, get_copilot_org_settings
   - Need: update_copilot_org_settings, get_copilot_seat_details, etc.

### Category 2.3: Codespaces - ~30 tools
**Priority:** HIGH - Widely used feature

**Subcategories:**
1. Codespaces (~10 tools)
   - create_codespace
   - get_codespace
   - list_codespaces
   - delete_codespace
   - start_codespace
   - stop_codespace
   
2. Organizations (~5 tools)
   - list_org_codespaces
   - get_org_codespace_settings
   
3. Secrets (~10 tools)
   - create_codespace_secret
   - list_codespace_secrets
   - delete_codespace_secret
   
4. Machines (~5 tools)
   - list_codespace_machines
   - get_codespace_machine

### Category 2.4: Actions (Complete) - ~50 tools
**Priority:** HIGH - Currently only 15/65 tools

**Missing Subcategories:**
1. Artifacts (~8 tools)
   - list_workflow_artifacts
   - get_workflow_artifact
   - download_workflow_artifact
   - delete_workflow_artifact
   
2. Cache (~6 tools)
   - list_actions_cache
   - get_actions_cache
   - delete_actions_cache
   
3. Hosted Runners (~8 tools)
   - list_hosted_runners
   - get_hosted_runner
   
4. OIDC (~5 tools)
   - get_oidc_custom_sub_template
   - set_oidc_custom_sub_template
   
5. Permissions (~6 tools)
   - get_actions_permissions
   - set_actions_permissions
   
6. Secrets (~10 tools)
   - create_org_secret
   - create_repo_secret
   - list_org_secrets
   - list_repo_secrets
   - delete_org_secret
   - delete_repo_secret
   
7. Variables (~7 tools)
   - create_org_variable
   - create_repo_variable
   - list_org_variables
   - list_repo_variables

### Category 2.5: Security - ~35 tools
**Priority:** HIGH - Security is critical

**Subcategories:**
1. Code Scanning (~12 tools)
   - list_code_scanning_alerts
   - get_code_scanning_alert
   - update_code_scanning_alert
   - dismiss_code_scanning_alert
   - list_code_scanning_analyses
   
2. Secret Scanning (~12 tools)
   - list_secret_scanning_alerts
   - get_secret_scanning_alert
   - update_secret_scanning_alert
   - list_secret_scanning_locations
   
3. Dependabot (~11 tools)
   - list_dependabot_alerts
   - get_dependabot_alert
   - update_dependabot_alert
   - create_dependabot_secret
   - list_dependabot_secrets

---

## 🎯 PHASE 3: ADD MEDIUM-PRIORITY TOOLS (~100 tools)

### Category 3.1: Organizations (Complete) - ~40 tools
**Current:** ~15 tools  
**Missing:** ~25 tools

**Missing Subcategories:**
- API Insights (NEW)
- Artifact Metadata (NEW)
- Attestations (NEW)
- Blocking
- Custom Properties
- Issue Types (NEW)
- Network Configurations (NEW)
- Organization Roles
- Outside Collaborators
- Personal Access Tokens
- Rule Suites
- Rules
- Security Managers
- Webhooks

### Category 3.2: Deployments - ~20 tools
**Current:** 0 tools

**Subcategories:**
- Branch Policies
- Deployments
- Environments
- Protection Rules
- Statuses

### Category 3.3: Checks - ~15 tools
**Current:** 0 tools

**Subcategories:**
- Check Runs
- Check Suites

### Category 3.4: Packages - ~10 tools
**Current:** 0 tools

### Category 3.5: Pages - ~5 tools
**Current:** 0 tools

### Category 3.6: Dependency Graph - ~10 tools
**Current:** 0 tools

**Subcategories:**
- Dependency Review
- Dependency Submission
- SBOMs

---

## 🎯 PHASE 4: ADD LOW-PRIORITY TOOLS (~50 tools)

### Category 4.1: Billing - ~10 tools
### Category 4.2: Metrics - ~10 tools
### Category 4.3: Activity - ~15 tools
### Category 4.4: Apps - ~10 tools
### Category 4.5: Misc - ~5 tools

---

## 📋 EXECUTION STRATEGY

### For Each Category:

1. **Research** (FREE Agent)
   - Fetch latest GitHub API docs for category
   - Extract all endpoints
   - Generate tool definitions JSON

2. **Define** (Manual/FREE Agent)
   - Create tool definitions in index.ts
   - Follow naming standard: `github_{verb}_{noun}`
   - Include proper inputSchema

3. **Implement** (Manual/FREE Agent)
   - Create handler case statements
   - Implement API calls
   - Handle errors properly

4. **Test** (Manual)
   - Test each tool with toolkit_call
   - Verify responses
   - Fix any issues

5. **Document** (Manual)
   - Update ACTUAL-STATUS.md
   - Update README.md
   - Commit changes

---

## 🚀 FREE AGENT INSTRUCTIONS (Max Concurrency: 15)

### Task Template for FREE Agent:

```
TASK: Generate GitHub {CATEGORY} tool definitions

CONTEXT:
- Category: {CATEGORY_NAME}
- GitHub API Docs: {DOCS_URL}
- Naming Pattern: github_{verb}_{noun}
- Standard Verbs: create, get, list, update, delete, search, send, execute, add, remove, check, cancel, archive, restore, enable, disable, merge, download

STEPS:
1. Fetch GitHub API documentation for {CATEGORY}
2. Extract all endpoints in this category
3. For each endpoint, create a tool definition:
   {
     name: 'github_{verb}_{noun}',
     description: 'Brief description from API docs',
     inputSchema: {
       type: 'object',
       properties: { ... },
       required: [ ... ]
     }
   }
4. Output JSON file: github-{category}-tools.json

OUTPUT FORMAT:
{
  "category": "{CATEGORY}",
  "tools": [
    { name: "...", description: "...", inputSchema: {...} }
  ]
}
```

### Batch Processing (15 concurrent tasks):

**Batch 1: High Priority**
1. Models Catalog
2. Models Embeddings
3. Models Inference
4. Copilot Metrics
5. Copilot User Management
6. Codespaces Core
7. Codespaces Secrets
8. Actions Artifacts
9. Actions Cache
10. Actions Secrets
11. Actions Variables
12. Code Scanning
13. Secret Scanning
14. Dependabot Alerts
15. Dependabot Secrets

---

## 📊 PROGRESS TRACKING

### Phase 1: Fix Existing (241 tools)
- [ ] Step 1.1: Fix tool names (1 rename)
- [ ] Step 1.2: Verify definitions exist
- [ ] Step 1.3: Verify handlers exist
- [ ] Step 1.4: Verify definitions match handlers
- [ ] Step 1.5: Test all tools

### Phase 2: High Priority (150 tools)
- [ ] Models API (20 tools)
- [ ] Copilot (15 tools)
- [ ] Codespaces (30 tools)
- [ ] Actions Complete (50 tools)
- [ ] Security (35 tools)

### Phase 3: Medium Priority (100 tools)
- [ ] Organizations Complete (40 tools)
- [ ] Deployments (20 tools)
- [ ] Checks (15 tools)
- [ ] Packages (10 tools)
- [ ] Pages (5 tools)
- [ ] Dependency Graph (10 tools)

### Phase 4: Low Priority (50 tools)
- [ ] Billing (10 tools)
- [ ] Metrics (10 tools)
- [ ] Activity (15 tools)
- [ ] Apps (10 tools)
- [ ] Misc (5 tools)

**TOTAL TARGET: 541 tools (60% coverage)**

---

## ✅ COMPLETION CRITERIA

GitHub category is COMPLETE when:
1. ✅ All existing 241 tools have correct names
2. ✅ All 241 tools have definitions
3. ✅ All 241 tools have handlers
4. ✅ All 241 tools are tested and working
5. ✅ All Phase 2 tools implemented (150 tools)
6. ✅ All Phase 3 tools implemented (100 tools)
7. ✅ All Phase 4 tools implemented (50 tools)
8. ✅ Total: 541 tools (60% coverage minimum)
9. ✅ Documentation updated
10. ✅ All changes committed and pushed

**DO NOT MOVE TO NEXT CATEGORY UNTIL ALL CRITERIA MET!**

