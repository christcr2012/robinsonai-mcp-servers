# @robinsonai/unified-mcp

**Unified MCP Server - All 9 Robinson AI MCP Servers in One**

This is a mega-server that combines all 9 individual Robinson AI MCP servers into a single unified server with 592 tools.

## 🎯 Purpose

Solves the "service unavailable" timeout error caused by loading too many MCP servers simultaneously. Instead of loading 9 separate server processes (18+ second initialization), this loads 1 unified server (2-3 second initialization).

## 📦 What's Included

This unified server combines:

1. **GitHub MCP** (240 tools) - Repository, PR, Issues, Actions, Workflows
2. **Vercel MCP** (~50 tools) - Deployments, Domains, Environment Variables
3. **Neon MCP** (160 tools) - PostgreSQL database management
4. **Google Workspace MCP** (192 tools) - Gmail, Drive, Calendar, Sheets, Docs
5. **Resend MCP** (~40 tools) - Email sending and management
6. **Twilio MCP** (~40 tools) - SMS, Voice, Messaging
7. **Cloudflare MCP** (~60 tools) - DNS, CDN, Workers
8. **Redis MCP** (~80 tools) - Cache, Pub/Sub, Streams
9. **OpenAI MCP** (~30 tools) - AI/ML features

**Total: 592 tools in one server**

## 🚀 Installation

```bash
# From the monorepo root
cd packages/unified-mcp
npm install
npm run build
npm link
```

## ⚙️ Configuration

### For Augment Code

Use the included `unified-mcp-config.json` which has all your secrets pre-configured:

```json
{
  "mcpServers": {
    "unified": {
      "command": "npx",
      "args": ["unified-mcp"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_...",
        "VERCEL_TOKEN": "...",
        "NEON_API_KEY": "...",
        "GOOGLE_SERVICE_ACCOUNT_KEY": "...",
        "GOOGLE_USER_EMAIL": "ops@robinsonaisystems.com",
        "RESEND_API_KEY": "...",
        "TWILIO_ACCOUNT_SID": "...",
        "TWILIO_AUTH_TOKEN": "...",
        "CLOUDFLARE_API_TOKEN": "...",
        "REDIS_URL": "...",
        "OPENAI_API_KEY": "..."
      }
    }
  }
}
```

## 📊 Performance Comparison

| Configuration | Servers | Init Time | Result |
|--------------|---------|-----------|--------|
| **9 Separate Servers** | 9 | ~18 seconds | ❌ Timeout |
| **Unified Server** | 1 | ~2-3 seconds | ✅ Works! |

## 🔧 Development

The unified server is built by combining the implementations from all 9 individual servers. The individual servers remain intact in the monorepo for:
- Individual publishing to npm
- Standalone use
- Easier maintenance

## 📝 Notes

- All 592 tools are prefixed with their service name (e.g., `github_`, `vercel_`, `neon_`)
- No duplicate tool names
- All tools work exactly as they do in the individual servers
- This is a personal build - individual servers will be published separately

## 🎯 Use Cases

**Use the unified server when:**
- You need all/most tools from multiple services
- You want fast initialization
- You're hitting MCP client timeouts

**Use individual servers when:**
- You only need tools from 1-3 services
- You want maximum modularity
- You're publishing/sharing with others

## 🔑 Environment Variables

All environment variables from the 9 individual servers are supported. See `unified-mcp-config.json` for the complete list.

## 📖 Documentation

For detailed documentation on each service's tools, see the individual server READMEs:
- [GitHub MCP](../github-mcp/README.md)
- [Vercel MCP](../vercel-mcp/README.md)
- [Neon MCP](../neon-mcp/README.md)
- [Google Workspace MCP](../google-workspace-mcp/README.md)
- [Resend MCP](../resend-mcp/README.md)
- [Twilio MCP](../twilio-mcp/README.md)
- [Cloudflare MCP](../cloudflare-mcp/README.md)
- [Redis MCP](../redis-mcp/README.md)
- [OpenAI MCP](../openai-mcp/README.md)

## 🏗️ Architecture

The unified server:
1. Initializes all 9 API clients in a single process
2. Registers all 592 tools in one `ListToolsRequestSchema` handler
3. Routes tool calls to the appropriate service handler based on tool name prefix
4. Returns results in the standard MCP format

## ⚡ Quick Start

```bash
# Build
npm run build

# Test locally
npx unified-mcp

# Should output:
# @robinsonai/unified-mcp server running on stdio
# 592 tools available from 9 integrated services
```

## 📄 License

MIT - Robinson AI Systems

---

**Built with ❤️ by Robinson AI Systems**

