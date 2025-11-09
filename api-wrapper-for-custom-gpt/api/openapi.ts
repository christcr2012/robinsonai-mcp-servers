import type { VercelRequest, VercelResponse } from '@vercel/node';
import openapiSchema from './openapi.json';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(openapiSchema);
}

