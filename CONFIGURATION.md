# MCP Servers Configuration Guide

This guide explains how to configure all 9 Robinson AI Systems MCP servers with the Augment VS Code extension.

## Prerequisites

1. **Build and link all MCP servers:**
   ```bash
   cd robinsonai-mcp-servers
   npm install
   npm run build

   # Link all packages globally
   cd packages/github-mcp && npm link
   cd ../vercel-mcp && npm link
   cd ../neon-mcp && npm link
   cd ../google-workspace-mcp && npm link
   cd ../resend-mcp && npm link --force
   cd ../twilio-mcp && npm link --force
   cd ../cloudflare-mcp && npm link --force
   cd ../redis-mcp && npm link
   cd ../openai-mcp && npm link
   ```

2. **Obtain API credentials** for each service you want to use.

## IMPORTANT: Use npx, NOT node

**All MCP servers MUST be run with `npx` command, NOT `node` command.**

The `node` command does not work for MCP servers. Always use:
- ✅ `"command": "npx"`
- ❌ NOT `"command": "node"`

## Augment VS Code Extension Configuration

### Configuration Location

The MCP servers are configured in the Augment extension settings:
- **File location**: `C:\Users\<username>\AppData\Roaming\Code\User\mcp.json` (Windows)
- **Access via UI**: Click the settings icon in Augment's chat window, OR
- **Access via command**: Press `Cmd/Ctrl + Shift + P` → "Augment: Open Settings"

### Configuration Format

Each MCP server needs:
- **Command**: MUST be `"npx"` (NOT `"node"`)
- **Arguments**: Package name with `-y` flag (e.g., `["-y", "@robinsonai/github-mcp"]`)
- **Environment Variables**: API tokens/credentials stored in `env` object

---

## Individual Server Configurations

### 1. GitHub MCP (250 tools)

**Required:** GitHub Personal Access Token

**Configuration:**
```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/github-mcp/dist/index.js",
        "${GITHUB_TOKEN}"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token_here"
      }
    }
  }
}
```

**Get Token:** https://github.com/settings/tokens
- Scopes needed: `repo`, `workflow`, `admin:org`, `admin:repo_hook`, `user`, `project`

---

### 2. Vercel MCP (150 tools)

**Required:** Vercel API Token

**Configuration:**
```json
{
  "mcpServers": {
    "vercel": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/vercel-mcp/dist/index.js",
        "${VERCEL_TOKEN}"
      ],
      "env": {
        "VERCEL_TOKEN": "your_vercel_token_here"
      }
    }
  }
}
```

**Get Token:** https://vercel.com/account/tokens

---

### 3. Neon MCP (160 tools)

**Required:** Neon API Key

**Configuration:**
```json
{
  "mcpServers": {
    "neon": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/neon-mcp/dist/index.js",
        "${NEON_API_KEY}"
      ],
      "env": {
        "NEON_API_KEY": "your_neon_api_key_here"
      }
    }
  }
}
```

**Get API Key:** https://console.neon.tech/app/settings/api-keys

---

### 4. Google Workspace MCP (122 tools)

**Required:** Google OAuth2 credentials

**Configuration:**
```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/google-workspace-mcp/dist/index.js"
      ],
      "env": {
        "GOOGLE_CLIENT_ID": "your_client_id",
        "GOOGLE_CLIENT_SECRET": "your_client_secret",
        "GOOGLE_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

**Get Credentials:** https://console.cloud.google.com/apis/credentials

---

### 5. Resend MCP (49 tools)

**Required:** Resend API Key

**Configuration:**
```json
{
  "mcpServers": {
    "resend": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/resend-mcp/dist/index.js",
        "${RESEND_API_KEY}"
      ],
      "env": {
        "RESEND_API_KEY": "re_your_api_key_here"
      }
    }
  }
}
```

**Get API Key:** https://resend.com/api-keys

---

### 6. Twilio MCP (76 tools)

**Required:** Twilio Account SID and Auth Token

**Configuration:**
```json
{
  "mcpServers": {
    "twilio": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/twilio-mcp/dist/index.js"
      ],
      "env": {
        "TWILIO_ACCOUNT_SID": "your_account_sid",
        "TWILIO_AUTH_TOKEN": "your_auth_token"
      }
    }
  }
}
```

**Get Credentials:** https://console.twilio.com/

---

### 7. Cloudflare MCP (136 tools)

**Required:** Cloudflare API Token

**Configuration:**
```json
{
  "mcpServers": {
    "cloudflare": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/cloudflare-mcp/dist/index.js",
        "${CLOUDFLARE_API_TOKEN}"
      ],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_api_token_here",
        "CLOUDFLARE_ACCOUNT_ID": "your_account_id"
      }
    }
  }
}
```

**Get API Token:** https://dash.cloudflare.com/profile/api-tokens

---

### 8. Redis MCP (80 tools)

**Required:** Redis connection URL

**Configuration:**
```json
{
  "mcpServers": {
    "redis": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/redis-mcp/dist/index.js",
        "${REDIS_URL}"
      ],
      "env": {
        "REDIS_URL": "redis://localhost:6379"
      }
    }
  }
}
```

**Redis URL Format:** `redis://[username:password@]host:port[/database]`

---

### 9. OpenAI MCP (120 tools)

**Required:** OpenAI API Key

**Configuration:**
```json
{
  "mcpServers": {
    "openai": {
      "command": "node",
      "args": [
        "C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/openai-mcp/dist/index.js",
        "${OPENAI_API_KEY}"
      ],
      "env": {
        "OPENAI_API_KEY": "sk-your_api_key_here"
      }
    }
  }
}
```

**Get API Key:** https://platform.openai.com/api-keys

---

## Complete Configuration Example

Here's a complete configuration with all 9 servers:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/github-mcp/dist/index.js", "${GITHUB_TOKEN}"],
      "env": { "GITHUB_TOKEN": "ghp_your_token" }
    },
    "vercel": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/vercel-mcp/dist/index.js", "${VERCEL_TOKEN}"],
      "env": { "VERCEL_TOKEN": "your_token" }
    },
    "neon": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/neon-mcp/dist/index.js", "${NEON_API_KEY}"],
      "env": { "NEON_API_KEY": "your_key" }
    },
    "google-workspace": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/google-workspace-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your_id",
        "GOOGLE_CLIENT_SECRET": "your_secret",
        "GOOGLE_REFRESH_TOKEN": "your_token"
      }
    },
    "resend": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/resend-mcp/dist/index.js", "${RESEND_API_KEY}"],
      "env": { "RESEND_API_KEY": "re_your_key" }
    },
    "twilio": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/twilio-mcp/dist/index.js"],
      "env": {
        "TWILIO_ACCOUNT_SID": "your_sid",
        "TWILIO_AUTH_TOKEN": "your_token"
      }
    },
    "cloudflare": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/cloudflare-mcp/dist/index.js", "${CLOUDFLARE_API_TOKEN}"],
      "env": {
        "CLOUDFLARE_API_TOKEN": "your_token",
        "CLOUDFLARE_ACCOUNT_ID": "your_account_id"
      }
    },
    "redis": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/redis-mcp/dist/index.js", "${REDIS_URL}"],
      "env": { "REDIS_URL": "redis://localhost:6379" }
    },
    "openai": {
      "command": "node",
      "args": ["C:/Users/chris/Git Local/robinsonai-mcp-servers/packages/openai-mcp/dist/index.js", "${OPENAI_API_KEY}"],
      "env": { "OPENAI_API_KEY": "sk-your_key" }
    }
  }
}
```

---

## Troubleshooting

### Server shows "no tools"
- **Cause:** Missing or invalid API credentials
- **Fix:** Check that environment variables are set correctly and tokens are valid

### Server fails to start
- **Cause:** Build files missing or outdated
- **Fix:** Run `npm run build` in the robinsonai-mcp-servers directory

### Permission errors
- **Cause:** Insufficient API token permissions
- **Fix:** Regenerate tokens with required scopes (see individual server sections)

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all credentials
3. **Rotate tokens regularly** (every 90 days recommended)
4. **Use minimal scopes** - only grant permissions needed
5. **Store credentials securely** - use a password manager or secrets vault

---

## Next Steps

After configuration:
1. Restart VS Code or reload the Augment extension
2. Open Augment chat and verify all servers show their tool counts
3. Test a simple tool from each server to confirm functionality

**Total Tools Available:** 1,354 across 9 MCP servers

