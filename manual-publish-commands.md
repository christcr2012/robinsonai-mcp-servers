# Manual Build and Publish Commands

Since the automated script can't run due to WSL issues, here are the manual commands to build and publish each fixed package:

## Prerequisites

```bash
# Make sure you're logged in to npm
npm login

# Verify you're logged in
npm whoami
```

## 1. Shared LLM v0.1.1

```bash
cd packages/shared-llm
npm run build
npm publish --access public
cd ../..
```

**Changes:** Enhanced Ollama connection logic, dual URL support, better error handling

## 2. Free Agent MCP v0.1.8

```bash
cd packages/free-agent-mcp
npm run build
npm publish --access public
cd ../..
```

**Changes:** Fixed Ollama connection, updated model config, increased timeout, better logging

## 3. Credit Optimizer MCP v0.1.7

```bash
cd packages/credit-optimizer-mcp
npm run build
npm publish --access public
cd ../..
```

**Changes:** Fixed tool discovery, added tools-index.json, enhanced search debugging

## 4. Robinson's Toolkit MCP v1.0.6

```bash
cd packages/robinsons-toolkit-mcp
npm run build
npm publish --access public
cd ../..
```

**Changes:** Fixed tool discovery, added search debugging, enhanced error reporting

## 5. Thinking Tools MCP v1.4.2

```bash
cd packages/thinking-tools-mcp
npm run build
npm publish --access public
cd ../..
```

**Changes:** Added Robinson AI context, MCP-specific insights, architecture awareness

## Verification Commands

After publishing, verify each package is available:

```bash
npm view @robinson_ai_systems/shared-llm@0.1.1
npm view @robinson_ai_systems/free-agent-mcp@0.1.8
npm view @robinson_ai_systems/credit-optimizer-mcp@0.1.7
npm view @robinson_ai_systems/robinsons-toolkit-mcp@1.0.6
npm view @robinson_ai_systems/thinking-tools-mcp@1.4.2
```

## Alternative: Batch Build and Publish

If you want to build all packages at once:

```bash
# Build all packages
npm run build

# Then publish each one individually
cd packages/shared-llm && npm publish --access public && cd ../..
cd packages/free-agent-mcp && npm publish --access public && cd ../..
cd packages/credit-optimizer-mcp && npm publish --access public && cd ../..
cd packages/robinsons-toolkit-mcp && npm publish --access public && cd ../..
cd packages/thinking-tools-mcp && npm publish --access public && cd ../..
```

## Test After Publishing

Once all packages are published, test the fixes:

```bash
node test-mcp-delegation.mjs
```

## Expected Result

After publishing, the MCP delegation system should work with:
- ✅ Free Agent connecting to Ollama (0 cost)
- ✅ Tool discovery returning results
- ✅ Thinking tools providing specific insights
- ✅ 96% cost savings achieved through delegation
