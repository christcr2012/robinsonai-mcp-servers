import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: {
      hasGitHubToken: !!process.env.GITHUB_TOKEN,
      hasVercelToken: !!process.env.VERCEL_TOKEN,
      hasNeonApiKey: !!process.env.NEON_API_KEY,
      hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
    }
  });
}

