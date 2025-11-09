import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    name: "Robinson's Toolkit API",
    version: "1.0.0",
    description: "REST API wrapper for Robinson's Toolkit MCP - 1237+ tools across 16+ categories",
    categories: [
      "github", "vercel", "neon", "upstash", "google", "openai", "stripe",
      "supabase", "playwright", "twilio", "resend", "context7", "cloudflare",
      "postgres", "neo4j", "qdrant", "n8n"
    ],
    endpoints: {
      openapi: "/api/openapi",
      health: "/api/health",
      execute: "/api/execute (POST)"
    },
    usage: {
      openapi: "Import /api/openapi into Custom GPT Actions",
      execute: "POST /api/execute with {category, tool_name, arguments}"
    },
    note: "This API provides direct access to Robinson's Toolkit tool handlers. No MCP server required!"
  });
}

