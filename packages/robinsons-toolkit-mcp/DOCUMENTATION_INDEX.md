# Robinson's Toolkit MCP Server - Documentation Index

**Complete documentation for the unified MCP server**

---

## 📚 Documentation Files

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[README.md](README.md)** | User-facing documentation | First-time setup, basic usage |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Complete architecture guide | Understanding how it works |
| **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** | Step-by-step integration guide | Adding new services |
| **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** | Fast lookup reference | Quick answers while coding |
| **[TOOL_CALL_FLOW.md](TOOL_CALL_FLOW.md)** | Detailed call flow examples | Debugging, understanding flow |
| **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** | This file | Finding the right doc |

---

## 🎯 Quick Navigation

### **I want to...**

#### **Understand the System**

- **"How does Robinson's Toolkit work?"**  
  → Read [ARCHITECTURE.md](ARCHITECTURE.md) - Complete architecture overview

- **"What's the difference between unified and broker patterns?"**  
  → Read [ARCHITECTURE.md § Architecture Overview](ARCHITECTURE.md#architecture-overview)

- **"How does a tool call flow through the system?"**  
  → Read [TOOL_CALL_FLOW.md](TOOL_CALL_FLOW.md) - Detailed examples

#### **Add New Integration**

- **"How do I add a new service like Stripe?"**  
  → Read [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Complete walkthrough with Stripe example

- **"What's the checklist for adding new tools?"**  
  → Read [INTEGRATION_GUIDE.md § Checklist](INTEGRATION_GUIDE.md#checklist-for-adding-new-integration)

- **"How do I avoid method name collisions?"**  
  → Read [ARCHITECTURE.md § Method Name Collision Resolution](ARCHITECTURE.md#method-name-collision-resolution)

#### **Quick Lookups**

- **"Where is the configuration file?"**  
  → Read [QUICK_REFERENCE.md § File Locations](QUICK_REFERENCE.md#file-locations)

- **"What line numbers should I edit?"**  
  → Read [QUICK_REFERENCE.md § Key Line Numbers](QUICK_REFERENCE.md#key-line-numbers-in-srcindexts)

- **"What's the naming convention for tools?"**  
  → Read [QUICK_REFERENCE.md § Naming Conventions](QUICK_REFERENCE.md#naming-conventions)

#### **Troubleshooting**

- **"Build succeeds but tools don't show in VS Code"**  
  → Read [QUICK_REFERENCE.md § Common Errors](QUICK_REFERENCE.md#common-errors)

- **"Getting 'Unknown tool' error"**  
  → Read [ARCHITECTURE.md § Troubleshooting](ARCHITECTURE.md#troubleshooting)

- **"API authentication failing"**  
  → Read [QUICK_REFERENCE.md § Debugging](QUICK_REFERENCE.md#debugging)

#### **Development**

- **"How do I test my changes?"**  
  → Read [ARCHITECTURE.md § Testing](ARCHITECTURE.md#testing)

- **"What's the build process?"**  
  → Read [QUICK_REFERENCE.md § Common Commands](QUICK_REFERENCE.md#common-commands)

- **"How do I debug tool calls?"**  
  → Read [TOOL_CALL_FLOW.md § Error Handling Flow](TOOL_CALL_FLOW.md#error-handling-flow)

---

## 📖 Reading Order

### **For New Developers**

1. **[README.md](README.md)** - Get started, understand what it is
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Learn how it works
3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Bookmark for quick lookups
4. **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - When ready to add tools
5. **[TOOL_CALL_FLOW.md](TOOL_CALL_FLOW.md)** - For deep understanding

### **For Experienced Developers**

1. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Fast overview
2. **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Add new services
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Reference as needed

### **For Troubleshooting**

1. **[QUICK_REFERENCE.md § Common Errors](QUICK_REFERENCE.md#common-errors)** - Check common issues
2. **[ARCHITECTURE.md § Troubleshooting](ARCHITECTURE.md#troubleshooting)** - Detailed solutions
3. **[TOOL_CALL_FLOW.md](TOOL_CALL_FLOW.md)** - Understand the flow to debug

---

## 🔍 Document Summaries

### **README.md**

**Target audience:** End users, first-time setup  
**Length:** ~200 lines  
**Key sections:**
- Installation
- Configuration
- Basic usage
- Available tools
- Environment variables

### **ARCHITECTURE.md**

**Target audience:** Developers who want to understand the system  
**Length:** ~300 lines  
**Key sections:**
- Architecture overview (unified vs broker)
- File structure
- Core components (class, clients, handlers)
- How it works (startup flow, tool call flow)
- Adding new integrations (step-by-step)
- Method name collision resolution
- Configuration details
- Testing procedures
- Troubleshooting guide

### **INTEGRATION_GUIDE.md**

**Target audience:** Developers adding new services  
**Length:** ~300 lines  
**Key sections:**
- Prerequisites
- Complete Stripe example (step-by-step)
- Common API patterns (JSON, form data, custom headers)
- Integration checklist
- Troubleshooting
- Best practices

### **QUICK_REFERENCE.md**

**Target audience:** Developers who need fast lookups  
**Length:** ~300 lines  
**Key sections:**
- File locations
- Key line numbers
- Current status
- Common commands
- Environment variables
- API endpoints
- Code patterns
- Naming conventions
- Testing checklist
- Debugging tips
- Common errors
- Quick fixes

### **TOOL_CALL_FLOW.md**

**Target audience:** Developers debugging or learning internals  
**Length:** ~300 lines  
**Key sections:**
- Overview of call flow
- Example 1: Listing Vercel projects (11 steps)
- Example 2: Creating GitHub issue
- Example 3: Running SQL on Neon
- Error handling flow
- Summary

---

## 🛠️ Common Tasks

### **Task: Add Stripe Integration**

**Documents to read:**
1. [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Follow the Stripe example
2. [QUICK_REFERENCE.md § Code Patterns](QUICK_REFERENCE.md#code-patterns) - Copy-paste templates
3. [ARCHITECTURE.md § Method Name Collision](ARCHITECTURE.md#method-name-collision-resolution) - Avoid collisions

**Steps:**
1. Add environment variable (INTEGRATION_GUIDE Step 2)
2. Create `stripeFetch()` method (INTEGRATION_GUIDE Step 3)
3. Add tool definitions (INTEGRATION_GUIDE Step 4)
4. Add case handlers (INTEGRATION_GUIDE Step 5)
5. Implement methods (INTEGRATION_GUIDE Step 6)
6. Build and test (INTEGRATION_GUIDE Steps 8-11)

### **Task: Debug "Unknown tool" Error**

**Documents to read:**
1. [QUICK_REFERENCE.md § Common Errors](QUICK_REFERENCE.md#common-errors) - Quick fix
2. [TOOL_CALL_FLOW.md](TOOL_CALL_FLOW.md) - Understand the flow
3. [ARCHITECTURE.md § Tool Execution Handler](ARCHITECTURE.md#4-tool-execution-handler) - Check handler

**Steps:**
1. Check if case handler exists in switch statement
2. Verify tool name matches exactly
3. Rebuild with `npm run build`
4. Reload VS Code window

### **Task: Understand How GitHub Tools Work**

**Documents to read:**
1. [ARCHITECTURE.md § Custom API Clients](ARCHITECTURE.md#2-custom-api-clients) - GitHub client pattern
2. [TOOL_CALL_FLOW.md § Example 2](TOOL_CALL_FLOW.md#example-2-creating-a-github-issue) - GitHub example
3. [QUICK_REFERENCE.md § API Endpoints](QUICK_REFERENCE.md#api-endpoints) - GitHub API details

**Key points:**
- Uses custom client (NOT Octokit)
- `githubFetch()` wraps native `fetch()`
- `createGitHubClient()` returns object with `.get()`, `.post()`, etc.

---

## 📊 Current Status

**As of last update:**

| Metric | Value |
|--------|-------|
| Total tools | 563 (target) |
| Showing in VS Code | 556 |
| Missing | 7 (needs investigation) |
| GitHub tools | 240 ✅ |
| Vercel tools | 150 ✅ |
| Neon tools | 173 ✅ |
| Source file size | 7,108 lines |
| Tool definitions | 414 (found) |
| Case handlers | 416 (found) |
| Private methods | 539 (found) |

**Known issues:**
- 7 tools missing (discrepancy between expected 563 and showing 556)
- Need to investigate which tools are missing

---

## 🎓 Learning Path

### **Beginner → Intermediate**

1. **Read README.md** - Understand what it is
2. **Read ARCHITECTURE.md § Architecture Overview** - Understand unified pattern
3. **Read ARCHITECTURE.md § How It Works** - Understand startup and call flow
4. **Read QUICK_REFERENCE.md** - Familiarize with common patterns
5. **Try adding a simple tool** - Follow INTEGRATION_GUIDE with 1-2 tools

### **Intermediate → Advanced**

1. **Read TOOL_CALL_FLOW.md** - Deep dive into call flow
2. **Read ARCHITECTURE.md § Method Name Collision** - Understand collision resolution
3. **Add a complete service** - Follow INTEGRATION_GUIDE with 10+ tools
4. **Debug an issue** - Use QUICK_REFERENCE.md § Debugging
5. **Optimize performance** - Understand fetch methods and caching

---

## 🔗 External Resources

### **MCP Protocol**
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [MCP Specification](https://spec.modelcontextprotocol.io/)

### **API Documentation**
- [GitHub REST API](https://docs.github.com/en/rest)
- [Vercel API](https://vercel.com/docs/rest-api)
- [Neon API](https://neon.tech/docs/reference/api-reference)
- [Stripe API](https://stripe.com/docs/api)

### **TypeScript**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node.js Fetch API](https://nodejs.org/dist/latest-v18.x/docs/api/globals.html#fetch)

---

## 📝 Contributing

When adding new documentation:

1. **Update this index** - Add new document to the table
2. **Follow the format** - Use existing docs as templates
3. **Keep it practical** - Focus on how-to, not theory
4. **Add examples** - Real code examples are essential
5. **Test instructions** - Verify steps actually work

---

## 🆘 Getting Help

### **Can't find what you need?**

1. **Check QUICK_REFERENCE.md first** - Fast lookups
2. **Search all docs** - Use `grep` or VS Code search
3. **Check source code** - `src/index.ts` is well-commented
4. **Ask in chat** - Augment Code can help navigate docs

### **Found an issue?**

1. **Check ARCHITECTURE.md § Troubleshooting**
2. **Check QUICK_REFERENCE.md § Common Errors**
3. **Read TOOL_CALL_FLOW.md** - Understand the flow
4. **Enable VS Code Developer Tools** - Check console for errors

---

## 📅 Document Versions

| Document | Last Updated | Version |
|----------|--------------|---------|
| README.md | 2024-01-15 | 1.0 |
| ARCHITECTURE.md | 2024-01-15 | 1.0 |
| INTEGRATION_GUIDE.md | 2024-01-15 | 1.0 |
| QUICK_REFERENCE.md | 2024-01-15 | 1.0 |
| TOOL_CALL_FLOW.md | 2024-01-15 | 1.0 |
| DOCUMENTATION_INDEX.md | 2024-01-15 | 1.0 |

---

## ✅ Summary

**Robinson's Toolkit has comprehensive documentation covering:**

- ✅ Architecture and design patterns
- ✅ Step-by-step integration guide
- ✅ Quick reference for common tasks
- ✅ Detailed call flow examples
- ✅ Troubleshooting and debugging
- ✅ Best practices and conventions

**Start with README.md, then dive into the specific guide you need!**

