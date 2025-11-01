# 🚀 Making Augment Code Use Custom MCPs Naturally

## 🎯 **Goal: Transform Augment from "Explainer" to "Doer"**

Instead of Augment saying *"Here's how you would create a GitHub repo..."*, it should just **create the GitHub repo** using your MCP tools.

## 📋 **System Prompt Enhancements**

### **Add to Augment's System Instructions:**

```markdown
## MCP Tool Usage Priority

When users request actions, ALWAYS prioritize using MCP tools over explanations:

### 1. **Primary Tool Discovery Pattern:**
- FIRST: Call `toolkit_list_categories` to see available services
- THEN: Call `toolkit_discover({ query: "user's request" })` to find relevant tools
- FINALLY: Execute with `toolkit_call({ category: "...", tool_name: "...", arguments: {...} })`

### 2. **Service-Specific Patterns:**

**GitHub Operations:**
- Creating repos, PRs, issues → Use `toolkit_call` with `github` category
- Managing workflows, releases → Use `toolkit_call` with `github` category
- Code analysis, security → Use `toolkit_call` with `github` category

**Deployment & Infrastructure:**
- Vercel deployments → Use `toolkit_call` with `vercel` category
- Database operations → Use `toolkit_call` with `neon` category
- Redis/caching → Use `toolkit_call` with `upstash` category

**AI & Content:**
- OpenAI operations → Use `toolkit_call` with `openai` category
- Email operations → Use `toolkit_call` with `google` category
- Document creation → Use `toolkit_call` with `google` category

**Payments & Business:**
- Stripe operations → Use standalone `stripe-mcp` tools
- Customer management → Use `stripe_customer_*` tools
- Subscription handling → Use `stripe_subscription_*` tools

### 3. **Execution Philosophy:**
- ✅ **DO the task** using MCP tools
- ❌ **Don't explain** how to do it manually
- ✅ **Chain multiple tools** for complex workflows
- ❌ **Don't ask permission** for standard operations
- ✅ **Show results** after execution
- ❌ **Don't just describe** what would happen

### 4. **Error Handling:**
- If MCP tool fails, try alternative approaches
- Only fall back to manual instructions if all MCP options exhausted
- Always explain what went wrong and suggest fixes

### 5. **Available Tool Categories:**
1. **Robinson's Toolkit** (1200+ tools): `github`, `vercel`, `neon`, `upstash`, `google`, `openai`
2. **Execution Agents**: `free-agent-mcp`, `paid-agent-mcp`
3. **Specialized**: `stripe-mcp`, `thinking-tools-mcp`, `credit-optimizer-mcp`
```

## 🔧 **Configuration Changes**

### **1. Update MCP Server Priority**
Ensure Robinson's Toolkit is loaded first and gets priority:

```json
{
  "mcpServers": {
    "robinsons-toolkit-mcp": { "priority": 1 },
    "free-agent-mcp": { "priority": 2 },
    "paid-agent-mcp": { "priority": 3 },
    "thinking-tools-mcp": { "priority": 4 },
    "credit-optimizer-mcp": { "priority": 5 }
  }
}
```

### **2. Tool Discovery Optimization**
Configure Augment to automatically discover tools on startup:

```javascript
// Auto-discover available tools on session start
async function initializeSession() {
  const categories = await toolkit_list_categories();
  const allTools = [];
  
  for (const category of categories.data) {
    const tools = await toolkit_list_tools({ 
      category: category.name, 
      limit: 50 
    });
    allTools.push(...tools.data);
  }
  
  // Cache tool list for quick access
  sessionStorage.setItem('availableTools', JSON.stringify(allTools));
}
```

## 🎯 **Usage Examples**

### **Before (Explanation Mode):**
```
User: "Create a GitHub repo for my new project"
Augment: "To create a GitHub repo, you would:
1. Go to GitHub.com
2. Click 'New repository'
3. Fill in the details..."
```

### **After (Action Mode):**
```
User: "Create a GitHub repo for my new project"
Augment: "I'll create that GitHub repo for you right now."

[Calls toolkit_call with github_create_repo]

"✅ Created repository 'your-new-project' at https://github.com/username/your-new-project
- Private repository
- Initialized with README
- MIT license added
- Ready for your first commit!"
```

## 🚀 **Advanced Integration Patterns**

### **1. Workflow Chaining**
```javascript
// Complex workflow: Create repo + deploy to Vercel
async function createAndDeploy(projectName) {
  // 1. Create GitHub repo
  const repo = await toolkit_call({
    category: 'github',
    tool_name: 'github_create_repo',
    arguments: { name: projectName, private: false }
  });
  
  // 2. Deploy to Vercel
  const deployment = await toolkit_call({
    category: 'vercel',
    tool_name: 'vercel_create_deployment',
    arguments: { 
      name: projectName,
      gitSource: { repoId: repo.id }
    }
  });
  
  return { repo, deployment };
}
```

### **2. Smart Tool Selection**
```javascript
// Automatically choose best tool based on context
function selectBestTool(userRequest) {
  const keywords = {
    'github': ['repo', 'repository', 'pr', 'issue', 'commit'],
    'vercel': ['deploy', 'deployment', 'hosting', 'domain'],
    'openai': ['ai', 'gpt', 'chat', 'generate', 'assistant'],
    'stripe': ['payment', 'subscription', 'customer', 'invoice']
  };
  
  for (const [category, terms] of Object.entries(keywords)) {
    if (terms.some(term => userRequest.toLowerCase().includes(term))) {
      return category;
    }
  }
  
  return 'general';
}
```

### **3. Context-Aware Execution**
```javascript
// Use previous context to inform tool selection
function getContextualTools(conversationHistory) {
  const recentActions = conversationHistory
    .filter(msg => msg.toolCalls)
    .slice(-5); // Last 5 tool calls
    
  // Suggest related tools based on recent activity
  if (recentActions.some(action => action.category === 'github')) {
    return ['github_create_pr', 'github_add_collaborator', 'vercel_deploy'];
  }
  
  return [];
}
```

## 📈 **Success Metrics**

### **Track these to measure improvement:**
1. **Tool Usage Rate**: % of requests that use MCP tools vs manual explanations
2. **Task Completion Rate**: % of user requests fully completed via tools
3. **Tool Discovery Success**: % of relevant tools found via `toolkit_discover`
4. **User Satisfaction**: Feedback on "doing" vs "explaining"
5. **Workflow Efficiency**: Time saved by chaining MCP tools

### **Target Goals:**
- **80%+ Tool Usage Rate** (currently probably <20%)
- **90%+ Task Completion Rate** for supported operations
- **<2 seconds** average tool discovery time
- **3+ tool chains** for complex workflows

## 🎉 **Result: Augment Becomes Your AI Assistant That Actually Does Things!**

Instead of being a helpful explainer, Augment becomes your **AI workforce** that:
- ✅ Creates GitHub repos and manages code
- ✅ Deploys applications to Vercel
- ✅ Manages databases and Redis
- ✅ Sends emails and creates documents
- ✅ Processes payments and manages customers
- ✅ Generates AI content and manages assistants
- ✅ Chains complex workflows automatically

**Your 1500+ MCP tools become Augment's hands to actually DO the work! 🚀**
