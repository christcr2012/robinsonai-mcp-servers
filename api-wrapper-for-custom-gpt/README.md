# Robinson's Toolkit API Wrapper for Custom GPTs

REST API wrapper that exposes Robinson's Toolkit MCP (1237+ tools) as HTTP endpoints for Custom GPT integration.

## Features

- ✅ Exposes all 1237+ Robinson's Toolkit tools via REST API
- ✅ OpenAPI/Swagger schema for Custom GPT Actions
- ✅ Supports all 16+ integrations (GitHub, Vercel, PostgreSQL, Neo4j, Qdrant, N8N, etc.)
- ✅ Easy deployment to Vercel, Railway, or any Node.js host
- ✅ CORS enabled for browser access

## Quick Start

### 1. Install Dependencies

```bash
cd api-wrapper-for-custom-gpt
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run Locally

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### 4. Test the API

```bash
# Health check
curl http://localhost:3000/health

# List all tools
curl http://localhost:3000/api/tools

# Execute a tool
curl -X POST http://localhost:3000/api/toolkit/call \
  -H "Content-Type: application/json" \
  -d '{
    "category": "postgres",
    "tool_name": "postgres_connection_test",
    "arguments": {}
  }'
```

## Deployment Options

### Option 1: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

4. Get your production URL (e.g., `https://your-app.vercel.app`)

### Option 2: Deploy to Railway

1. Create account at railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy automatically

### Option 3: Deploy to Your Own Server

```bash
npm run build
npm start
```

## Connect to Custom GPT

### Step 1: Get Your API URL

After deployment, you'll have a URL like:
- Vercel: `https://your-app.vercel.app`
- Railway: `https://your-app.railway.app`
- Local: `http://localhost:3000` (for testing only)

### Step 2: Add to Custom GPT

1. Go to ChatGPT → My GPTs
2. Create or edit a GPT
3. Go to "Configure" tab
4. Scroll to "Actions" section
5. Click "Create new action"
6. Import schema from: `https://your-app.vercel.app/openapi.json`

OR manually paste this schema:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Robinson's Toolkit API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://your-app.vercel.app"
    }
  ],
  "paths": {
    "/api/toolkit/call": {
      "post": {
        "operationId": "executeToolkitTool",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["category", "tool_name"],
                "properties": {
                  "category": {
                    "type": "string",
                    "enum": ["github", "vercel", "postgres", "neo4j", "qdrant", "n8n"]
                  },
                  "tool_name": {
                    "type": "string"
                  },
                  "arguments": {
                    "type": "object"
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Step 3: Test in Custom GPT

Ask your GPT:
- "List all PostgreSQL tables"
- "Create a GitHub repository called 'test-repo'"
- "Search my Neo4j knowledge graph for nodes about AI"

## API Endpoints

### GET /health
Health check endpoint

### GET /api/tools
List all available tools

### GET /api/tools/category/:category
List tools in a specific category

### POST /api/toolkit/call
Execute a tool

**Request:**
```json
{
  "category": "postgres",
  "tool_name": "postgres_query_execute",
  "arguments": {
    "sql": "SELECT * FROM users LIMIT 10"
  }
}
```

**Response:**
```json
{
  "success": true,
  "category": "postgres",
  "tool": "postgres_query_execute",
  "result": { ... }
}
```

### GET /openapi.json
OpenAPI schema for Custom GPT integration

## Available Categories

- `github` - GitHub repositories, issues, PRs, workflows
- `vercel` - Vercel deployments, projects, domains
- `neon` - Neon serverless Postgres
- `upstash` - Upstash Redis
- `google` - Google Workspace (Gmail, Drive, Calendar, etc.)
- `openai` - OpenAI API tools
- `stripe` - Stripe payments
- `supabase` - Supabase database, auth, storage
- `playwright` - Browser automation
- `twilio` - SMS, voice, messaging
- `resend` - Email delivery
- `cloudflare` - DNS, CDN, Workers
- `postgres` - PostgreSQL with pgvector (Chris's Infrastructure)
- `neo4j` - Neo4j knowledge graphs (Chris's Infrastructure)
- `qdrant` - Qdrant vector search (Chris's Infrastructure)
- `n8n` - N8N workflow automation (Chris's Infrastructure)

## Security Notes

⚠️ **Important:**
- Never commit `.env` file with real credentials
- Use environment variables in production
- Consider adding authentication middleware for production use
- Rate limit the API to prevent abuse

## Troubleshooting

**MCP client not connecting:**
- Check that Robinson's Toolkit v1.15.0 is published to npm
- Verify environment variables are set correctly

**Tools not loading:**
- Check server logs for errors
- Verify npx can access the package

**Custom GPT can't connect:**
- Ensure API is publicly accessible (not localhost)
- Check CORS is enabled
- Verify OpenAPI schema is valid

## License

MIT

