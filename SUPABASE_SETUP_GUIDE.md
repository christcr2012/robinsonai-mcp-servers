# Supabase Setup Guide

## What You Need

For Supabase MCP to work, you need **2 things**:

1. **SUPABASE_URL** - Your project URL
2. **SUPABASE_ANON_KEY** - Your anonymous/public API key

## Where to Find Them

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Log in with your account
3. Select your project (or create a new one)

### Step 2: Get Your Credentials

**Option A: From Project Settings (Recommended)**
1. Click on the **Settings** icon (gear) in the left sidebar
2. Click **API** in the settings menu
3. You'll see:
   - **Project URL** → This is your `SUPABASE_URL`
   - **Project API keys** section:
     - **anon/public** key → This is your `SUPABASE_ANON_KEY`
     - **service_role** key → Optional, for admin operations

**Option B: From Project Home**
1. Go to your project home page
2. Look for "Connect to your project" section
3. You'll see the URL and keys there

### Step 3: Update Configuration

Once you have the credentials, update `WORKING_AUGMENT_CONFIG.json`:

```json
"supabase-mcp": {
  "command": "npx",
  "args": ["-y", "@robinsonai/supabase-mcp"],
  "env": {
    "SUPABASE_URL": "https://your-project-id.supabase.co",
    "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Example Values

Your credentials will look like this:

**SUPABASE_URL:**
```
https://abcdefghijklmnop.supabase.co
```

**SUPABASE_ANON_KEY:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjM0NTY3OCwiZXhwIjoxOTI3OTIxNjc4fQ.abcdefghijklmnopqrstuvwxyz1234567890
```

## What Each Key Does

### SUPABASE_URL
- Your project's API endpoint
- Format: `https://[project-id].supabase.co`
- Used for all API requests

### SUPABASE_ANON_KEY (Public Key)
- Safe to use in client-side code
- Has Row Level Security (RLS) restrictions
- Good for most operations
- **This is what you should use for the MCP**

### SUPABASE_SERVICE_ROLE_KEY (Optional)
- **Admin key** - bypasses RLS
- Should NEVER be exposed to clients
- Only use if you need admin operations
- Can be used instead of ANON_KEY for the MCP

## Current Status

✅ **Supabase MCP is already built** with 80 tools:
- Auth (20 tools) - signup, signin, OAuth, MFA
- Database (25 tools) - select, insert, update, delete, filters
- Storage (15 tools) - upload, download, buckets, signed URLs
- Realtime (10 tools) - subscriptions, broadcast, presence
- Functions (10 tools) - edge function invocation

⏳ **Just needs API keys** to activate

## Graceful Degradation

The Supabase MCP works even without API keys:
- Server starts successfully
- Tools are registered
- Calling tools shows helpful error: "Please set SUPABASE_URL and SUPABASE_ANON_KEY"

So you can leave it as-is until you're ready to use Supabase!

## Quick Test

Once you add the keys, test with:

```bash
# Start the MCP server
npx @robinsonai/supabase-mcp

# Or test through Augment Code
# Call any supabase tool like:
# supabase_auth_signup({ email: "test@example.com", password: "password123" })
```

## Security Notes

1. **ANON_KEY is safe** to use in MCP - it has RLS protection
2. **SERVICE_ROLE_KEY is dangerous** - only use if you need admin access
3. **Never commit keys** to git (they're in .gitignore)
4. **Rotate keys** if they're ever exposed

## Need Help?

If you can't find your keys:
1. Make sure you have a Supabase project created
2. Check you're logged into the right account
3. Try creating a new project if needed (free tier available)

---

**Next Steps:**
1. Get your SUPABASE_URL and SUPABASE_ANON_KEY from dashboard
2. Update `WORKING_AUGMENT_CONFIG.json`
3. Restart Augment Code
4. Start using 80 Supabase tools!

