# Autonomous Implementation Instructions

**Date:** 2025-11-02  
**Current Status:** 90% Complete  
**Remaining Work:** 10% (validation tests, LoRA training, n8n workflows)

---

## ✅ WHAT'S PUBLISHED

### Published Packages (Latest Versions)
- ✅ `@robinson_ai_systems/free-agent-mcp@0.1.13` - Published
- ✅ `@robinson_ai_systems/paid-agent-mcp@0.2.11` - Published
- ✅ `@robinson_ai_systems/thinking-tools-mcp@1.4.8` - Published
- ✅ `@robinson_ai_systems/credit-optimizer-mcp@0.1.8` - Published
- ✅ `@robinson_ai_systems/robinsons-toolkit-mcp@1.0.7` - Published

### Updated Config
- ✅ `augment-mcp-config.json` - Updated to use latest versions

---

## 🎯 REMAINING WORK (10%)

### 1. Update End-to-End Validation Tests (HIGH PRIORITY)
**Status:** 30% complete  
**File:** `validate-6-servers.md` → needs rename to `validate-5-servers.md`  
**What's needed:**
- Remove architect-mcp tests (server no longer exists)
- Update multi-agent workflow to use Augment for planning
- Add examples of Augment-led planning with task management tools
- Test all 5 servers end-to-end

**Estimated Time:** 1-2 hours

---

### 2. Create LoRA Training Script (MEDIUM PRIORITY)
**Status:** 0% complete  
**What exists:**
- ✅ SFT export works (`packages/free-agent-mcp/src/learning/make-sft.ts`)
- ✅ Experience DB stores training pairs

**What's missing:**
- ❌ `train_lora.py` - Python script using Unsloth/Axolotl
- ❌ Modelfile generator with ADAPTER
- ❌ Model swap logic

**Estimated Time:** 1 day

---

### 3. Create n8n Workflows (LOW PRIORITY)
**Status:** 0% complete  
**What's needed:**
- ❌ Workflow A: PR labeled trigger → run agent → update PR
- ❌ Workflow B: Weekly LoRA training (cron)
- ❌ Workflow C: Docs fetch → cache → summarize
- ❌ Workflow D: Slack approve/reject → replay fix

**Estimated Time:** 1 day (optional)

---

## 🚀 WHAT YOU NEED TO DO FOR ME TO IMPLEMENT AUTONOMOUSLY

### Step 1: Restart VS Code ✅ REQUIRED
**Why:** Load the latest published packages (0.1.13 and 0.2.11)

**How:**
1. Close ALL VS Code windows
2. Wait 5 seconds
3. Reopen VS Code
4. Wait for MCP servers to initialize (~30 seconds)

---

### Step 2: Grant Permissions 🔑 REQUIRED

I need explicit permission to:

#### A. File Operations
- ✅ **Create files:**
  - `validate-5-servers.md` (rename from validate-6-servers.md)
  - `train_lora.py` (Python LoRA training script)
  - `generate_modelfile.py` (Ollama Modelfile generator)
  - `n8n-workflows/*.json` (4 workflow files)

- ✅ **Modify files:**
  - Update validation test suite
  - Update documentation references

- ✅ **Delete files:**
  - `validate-6-servers.md` (after renaming)

#### B. Package Management
- ✅ **Install Python dependencies:**
  ```bash
  pip install unsloth transformers datasets peft accelerate bitsandbytes
  ```

#### C. Testing & Validation
- ✅ **Run validation tests:**
  - Test all 5 MCP servers
  - Verify tool availability
  - Test multi-server workflows

#### D. Source Control
- ✅ **Git operations:**
  - Commit changes with descriptive messages
  - Push to GitHub

---

### Step 3: Provide Required Information 📋 OPTIONAL

For LoRA training (if you want me to implement it):

#### A. Training Configuration
- **Base model:** Which Ollama model to fine-tune? (default: `qwen2.5-coder:7b`)
- **Training data:** Use existing SFT exports from `.agent/sft/`?
- **LoRA rank:** Default 16 or custom?
- **Training epochs:** Default 3 or custom?

#### B. n8n Configuration (if you want workflows)
- **n8n URL:** Where is your n8n instance? (e.g., `http://localhost:5678`)
- **Webhook URLs:** Should I use default paths or custom?
- **Slack webhook:** Do you have a Slack webhook URL?

---

## 🤖 HOW I WILL IMPLEMENT AUTONOMOUSLY

### Phase 1: Validation Tests (1-2 hours)

**What I'll do:**
1. Use `view` to read `validate-6-servers.md`
2. Use `codebase-retrieval` to find all 5-server references
3. Use `save-file` to create `validate-5-servers.md` with:
   - Updated server list (5 servers, not 6)
   - Removed architect-mcp tests
   - Added Augment-led planning examples
   - Updated multi-agent workflow
4. Use `remove-files` to delete old `validate-6-servers.md`
5. Use `launch-process` to test all 5 servers
6. Use `launch-process` to commit and push changes

**Tools I'll use:**
- `view` - Read existing files
- `codebase-retrieval` - Find related code
- `save-file` - Create new validation test file
- `remove-files` - Delete old file
- `launch-process` - Run tests, git operations
- `delegate_code_generation_free-agent-mcp` - Generate test examples (0 credits!)

**Cost:** $0 (using FREE agent)

---

### Phase 2: LoRA Training Script (1 day)

**What I'll do:**
1. Use `codebase-retrieval` to understand existing SFT export
2. Use `web-search` to find latest Unsloth/Axolotl examples
3. Use `delegate_code_generation_free-agent-mcp` to generate:
   - `train_lora.py` - Training script
   - `generate_modelfile.py` - Modelfile generator
   - `swap_model.sh` - Model swap script
4. Use `save-file` to create all 3 files
5. Use `launch-process` to test training (dry run)
6. Use `launch-process` to commit and push

**Tools I'll use:**
- `codebase-retrieval` - Understand existing code
- `web-search` - Find latest Unsloth examples
- `delegate_code_generation_free-agent-mcp` - Generate Python scripts (0 credits!)
- `save-file` - Create files
- `launch-process` - Test and commit

**Cost:** $0 (using FREE agent + web search)

---

### Phase 3: n8n Workflows (1 day, optional)

**What I'll do:**
1. Use `web-search` to find n8n workflow examples
2. Use `delegate_code_generation_free-agent-mcp` to generate 4 workflow JSONs
3. Use `save-file` to create workflow files
4. Use `str-replace-editor` to update documentation
5. Use `launch-process` to commit and push

**Tools I'll use:**
- `web-search` - Find n8n examples
- `delegate_code_generation_free-agent-mcp` - Generate workflows (0 credits!)
- `save-file` - Create workflow files
- `launch-process` - Commit and push

**Cost:** $0 (using FREE agent)

---

## 📊 TOTAL COST & TIME

### Cost Breakdown
- **Validation Tests:** $0 (FREE agent)
- **LoRA Training:** $0 (FREE agent + web search)
- **n8n Workflows:** $0 (FREE agent)
- **Total:** $0 (100% FREE!)

### Time Breakdown
- **Validation Tests:** 1-2 hours
- **LoRA Training:** 1 day
- **n8n Workflows:** 1 day (optional)
- **Total:** 1-2 days

---

## ✅ WHAT YOU NEED TO SAY

### Minimal Permission (Validation Tests Only)
```
Yes, implement the validation tests. You have permission to:
- Create validate-5-servers.md
- Delete validate-6-servers.md
- Run tests
- Commit and push changes
```

### Full Permission (All Remaining Work)
```
Yes, implement all remaining work. You have permission to:
- Create/modify/delete files as needed
- Install Python dependencies (pip install unsloth transformers datasets peft accelerate bitsandbytes)
- Run tests and training scripts
- Commit and push all changes

For LoRA training, use:
- Base model: qwen2.5-coder:7b
- Training data: .agent/sft/*.jsonl
- Default settings (rank=16, epochs=3)

For n8n workflows (optional):
- n8n URL: http://localhost:5678
- Use default webhook paths
- Skip Slack integration for now
```

---

## 🎯 EXPECTED OUTCOME

After I complete the work, you'll have:

1. ✅ **Updated validation tests** (`validate-5-servers.md`)
   - All 5 servers tested
   - Augment-led planning examples
   - Multi-server workflow examples

2. ✅ **LoRA training pipeline** (if requested)
   - `train_lora.py` - Training script
   - `generate_modelfile.py` - Modelfile generator
   - `swap_model.sh` - Model swap script
   - Documentation on how to use

3. ✅ **n8n workflows** (if requested)
   - 4 workflow JSON files
   - Documentation on how to import
   - Integration with experience DB

4. ✅ **100% completion** of instructions.txt requirements

---

## 🚨 IMPORTANT NOTES

1. **I will NOT:**
   - Make changes without your permission
   - Install dependencies without asking
   - Deploy or run production code
   - Modify API keys or credentials

2. **I WILL:**
   - Ask for clarification if needed
   - Show you what I'm doing at each step
   - Test everything before committing
   - Document all changes

3. **You can STOP me at any time** by saying:
   - "Stop"
   - "Wait"
   - "Let me review first"

---

## 📝 READY TO START?

**Just say:**
- "Yes, implement validation tests" (minimal, 1-2 hours)
- "Yes, implement all remaining work" (full, 1-2 days)
- "Yes, but let me review the plan first" (I'll wait)

**I'm ready when you are!** 🚀

