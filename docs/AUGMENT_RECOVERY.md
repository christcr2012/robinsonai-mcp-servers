# Augment UI Recovery and MCP Audit

If Augment's UI hangs (settings pane won't render or chat is stuck), it's usually caused by one MCP server printing to stdout before JSON-RPC messages. This corrupts the stdio stream Augment expects.

This guide helps you quickly recover the UI and identify the offending server.

## TL;DR

- Fully exit VS Code and any Augment clients.
- Temporarily remove the suspected server from your VS Code `settings.json` (e.g., openai-mcp).
- Reload VS Code; the UI should recover.
- Update or rebuild the server and verify it doesn't print to stdout before JSON.
- Re-enable it and test again.

## 1) Quick recovery: disable a server

Use the audit helper to disable a problematic server by name (creates a timestamped backup of your settings):

```
node tools/audit-augment-mcp.mjs --disable openai-mcp
```

Then reload VS Code (Developer: Reload Window) or fully restart. The MCP settings pane should render again.

To re-add a server, use your import script/flow (the `--enable` flag does not reconstitute a deleted spec).

## 2) Audit your configured MCP servers

Run the audit to print configured servers and detect stdout pollution by spawning them with their configured command/args/env and sending a JSON-RPC initialize request:

```
node tools/audit-augment-mcp.mjs --test
```

You’ll see one of these for each server:

- ✅ OK (no stdout pollution before JSON)
- ⚠️ JSON-RPC OK, but stdout pollution detected (lines shown)
- ❌ No JSON-RPC detected or other error

Fix any server that prints to stdout before JSON-RPC: move logs to stderr (use `console.error`), or delay logs until after initialization if they must be stdout.

## 3) Common fixes

- Node-based servers: ensure everything printed before the JSON-RPC `initialize` response goes to `console.error(...)` or a file logger.
- Verify your globally installed package is the updated build. On Windows with NVM for Node:
  - Check your global prefix (e.g., `C:\nvm4w\nodejs`), and ensure the shim `.cmd` points to the updated `node_modules/@robinsonai/<server>/dist/index.js`.
  - Rebuild (`npm run build`) and reinstall globally from the local path with quotes to handle spaces in paths.
- Inline critical env values in the `augment.mcpServers` entries to avoid missing env in the extension host.

## 4) Where settings live (Windows)

VS Code stable:
- `%APPDATA%\Code\User\settings.json`

We read and write this file to update `augment.mcpServers`.

A backup is created automatically by the audit script (e.g., `settings.json.backup-2025-11-01T12-34-56-789Z`).

## 5) If UI is still stuck

- Remove all MCP entries, reload, then re-add one by one. Use Core set first (excluding heavier servers), then add others.
- Clear Augment caches if applicable (depends on client version). Then reload.
- Run the audit with `--test` after each addition to catch regressions early.

## 6) Support matrix used here

- Client: VS Code + Augment Code (stdio transport)
- Servers: Thinking Tools, OpenAI MCP, Paid Agent, Credit Optimizer, Free Agent, Robinson’s Toolkit
- OS: Windows, PowerShell

This repo’s audit tool is conservative and only inspects stdout behavior before the first JSON-RPC response, which is the most common cause of UI corruption with stdio-based clients.
