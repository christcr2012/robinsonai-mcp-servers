# @robinsonai/vercel-mcp

Comprehensive Vercel MCP server with 50+ tools for complete Vercel API integration.

## 🚀 Features

### Project Management (5 tools)
- List, get, create, update, delete projects
- Full project configuration support

### Deployment Management (7 tools)
- List, get, create, cancel, delete deployments
- Get deployment events and logs
- Redeploy existing deployments

### Environment Variables (5 tools)
- List, create, update, delete environment variables
- Bulk create multiple env vars at once
- Support for all target environments (production, preview, development)

### Domain Management (5 tools)
- List, get, add, remove domains
- Verify domain ownership

### DNS Management (3 tools)
- List, create, delete DNS records
- Support for all record types (A, AAAA, CNAME, MX, TXT, etc.)

### Team Management (3 tools)
- List teams and team members
- Get team details

### Logs & Monitoring (2 tools)
- Get deployment logs
- Get project analytics

### Edge Config (4 tools)
- List, create Edge Configs
- Get and update Edge Config items

### Webhooks (3 tools)
- List, create, delete webhooks
- Full event support

## 📦 Installation

```bash
# Global installation
npm install -g @robinsonai/vercel-mcp

# Or use with npx
npx @robinsonai/vercel-mcp <VERCEL_TOKEN>
```

## 🔧 Usage

### With MCP Config

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@robinsonai/vercel-mcp", "YOUR_VERCEL_TOKEN"]
    }
  }
}
```

### With Environment Variable

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": ["-y", "@robinsonai/vercel-mcp"],
      "env": {
        "VERCEL_TOKEN": "YOUR_VERCEL_TOKEN"
      }
    }
  }
}
```

## 🔑 Getting a Vercel Token

1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Copy the token and use it with this MCP

## 📚 Available Tools

See the full list of 50+ tools in the source code or by connecting the MCP server.

## 📄 License

MIT © Robinson AI Systems

