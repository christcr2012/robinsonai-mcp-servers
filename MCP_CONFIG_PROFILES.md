# MCP Configuration Profiles

This directory contains multiple MCP configuration profiles optimized for different workflows. Use these to avoid loading too many servers at once and prevent "service unavailable" errors.

## 📋 Available Profiles

### 1. **mcp-config-minimal.json** ⭐ RECOMMENDED FOR DAILY USE

**Servers**: GitHub, Vercel, Neon  
**Total Tools**: ~450  
**Performance**: ✅ Excellent  
**Use For**: 
- General web development
- Most day-to-day tasks
- When you need fast, reliable performance

**Servers Included**:
- ✅ GitHub MCP (240 tools) - Repository, PR, Issues, Actions
- ✅ Vercel MCP (~50 tools) - Deployments, Domains, Env Vars
- ✅ Neon MCP (160 tools) - Database management

---

### 2. **mcp-config-communication.json**

**Servers**: GitHub, Vercel, Neon, Resend, Twilio  
**Total Tools**: ~530  
**Performance**: ✅ Good  
**Use For**:
- Email/SMS feature development
- Communication workflows
- Customer notification systems

**Servers Included**:
- ✅ GitHub MCP (240 tools)
- ✅ Vercel MCP (~50 tools)
- ✅ Neon MCP (160 tools)
- ✅ Resend MCP (~40 tools) - Email sending
- ✅ Twilio MCP (~40 tools) - SMS/Voice

---

### 3. **mcp-config-fullstack.json**

**Servers**: GitHub, Vercel, Neon, Resend, Cloudflare, OpenAI  
**Total Tools**: ~580  
**Performance**: ⚠️ Monitor closely  
**Use For**:
- Complex full-stack projects
- AI-powered features
- CDN/DNS management

**Servers Included**:
- ✅ GitHub MCP (240 tools)
- ✅ Vercel MCP (~50 tools)
- ✅ Neon MCP (160 tools)
- ✅ Resend MCP (~40 tools)
- ✅ Cloudflare MCP (~60 tools) - DNS, CDN, Workers
- ✅ OpenAI MCP (~30 tools) - AI/ML features

**⚠️ Warning**: This is near the maximum recommended. Monitor for slowdowns.

---

### 4. **mcp-config-devops.json**

**Servers**: GitHub, Vercel, Neon, Cloudflare, Redis  
**Total Tools**: ~530  
**Performance**: ⚠️ Requires Redis running  
**Use For**:
- Infrastructure management
- DevOps workflows
- Cache management

**Servers Included**:
- ✅ GitHub MCP (240 tools)
- ✅ Vercel MCP (~50 tools)
- ✅ Neon MCP (160 tools)
- ✅ Cloudflare MCP (~60 tools)
- ✅ Redis MCP (~80 tools) - Cache, Pub/Sub, Streams

**⚠️ Warning**: Only use if Redis server is running at `localhost:6379`

---

### 5. **mcp-config-all.json** ⚠️ NOT RECOMMENDED

**Servers**: All 9 servers  
**Total Tools**: ~592  
**Performance**: ❌ Causes "service unavailable" errors  
**Use For**:
- Reference only
- Backup of all credentials

**⚠️ DO NOT USE**: This configuration is too heavy and will cause the MCP client to timeout. Only use as a reference or backup.

---

## 🚀 How to Use

### Step 1: Choose Your Profile

Pick the profile that matches your current workflow:
- **Daily work?** → Use `mcp-config-minimal.json`
- **Email/SMS features?** → Use `mcp-config-communication.json`
- **Full-stack project?** → Use `mcp-config-fullstack.json`
- **DevOps/Infrastructure?** → Use `mcp-config-devops.json`

### Step 2: Add Your Credentials

Edit the chosen profile and replace the placeholder values:

```json
{
  "GITHUB_TOKEN": "ghp_your_actual_token_here",
  "VERCEL_TOKEN": "your_actual_vercel_token",
  "NEON_API_KEY": "your_actual_neon_key"
}
```

### Step 3: Configure Augment Code

1. Open Augment Code settings
2. Navigate to MCP configuration
3. Import or copy the contents of your chosen profile
4. Restart Augment Code

### Step 4: Test

After restarting, verify the AI assistant responds without "service unavailable" errors.

---

## 🔄 Switching Profiles

To switch between profiles:

1. **Save your current config** (if you made changes)
2. **Copy the new profile** to your MCP configuration
3. **Restart Augment Code**

**Tip**: Keep your credentials in a separate file and copy them between profiles to avoid re-entering them.

---

## 📊 Profile Comparison

| Profile | Servers | Tools | Performance | Best For |
|---------|---------|-------|-------------|----------|
| **Minimal** ⭐ | 3 | ~450 | ✅ Excellent | Daily development |
| **Communication** | 5 | ~530 | ✅ Good | Email/SMS features |
| **Full-Stack** | 6 | ~580 | ⚠️ Monitor | Complex projects |
| **DevOps** | 5 | ~530 | ⚠️ Requires Redis | Infrastructure |
| **All** | 9 | ~592 | ❌ Too heavy | Reference only |

---

## 🔑 Getting API Keys/Tokens

### GitHub Token
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`, `admin:org`

### Vercel Token
1. Go to https://vercel.com/account/tokens
2. Create new token
3. Copy the token

### Neon API Key
1. Go to https://console.neon.tech/app/settings/api-keys
2. Generate new API key
3. Copy the key

### Resend API Key
1. Go to https://resend.com/api-keys
2. Create API key
3. Copy the key

### Cloudflare API Token
1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Create token with appropriate permissions
3. Copy token and account ID

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key

### Twilio Credentials
1. Go to https://console.twilio.com/
2. Find Account SID and Auth Token
3. Copy both values

### Redis URL
- Local: `redis://localhost:6379`
- Remote: `redis://username:password@host:port/database`

---

## 💡 Tips

### For Best Performance
1. **Start with minimal** - Use `mcp-config-minimal.json` by default
2. **Add as needed** - Only switch to larger profiles when you need specific tools
3. **Monitor performance** - If you notice slowdowns, switch to a smaller profile
4. **Avoid "all"** - Never use `mcp-config-all.json` for actual work

### Troubleshooting
- **Service unavailable?** → Switch to `mcp-config-minimal.json`
- **Redis errors?** → Don't use `mcp-config-devops.json` unless Redis is running
- **Slow initialization?** → Use a smaller profile
- **Missing tools?** → Switch to a larger profile temporarily

### Custom Profiles
Feel free to create your own custom profiles by mixing and matching servers from the examples above. Just remember:
- ✅ Keep it under 6 servers
- ✅ Keep total tools under 550
- ✅ Test after adding each server

---

## 📖 Additional Resources

- **Troubleshooting**: See `MCP_TROUBLESHOOTING.md`
- **Service Unavailable Fix**: See `SERVICE_UNAVAILABLE_FIX.md`
- **Diagnostic Tool**: Run `node test-mcp-servers.js`
- **Full Configuration Guide**: See `CONFIGURATION.md`

---

## ⚡ Quick Start

**Just want to get started?**

1. Copy `mcp-config-minimal.json`
2. Replace `YOUR_GITHUB_TOKEN_HERE`, `YOUR_VERCEL_TOKEN_HERE`, `YOUR_NEON_API_KEY_HERE`
3. Import into Augment Code
4. Restart
5. Done! ✅

This will give you 450 tools with excellent performance.

