import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import pLimit from 'p-limit';
import { createHash } from 'crypto';

import * as github from './vendors/github.js';
import * as vercel from './vendors/vercel.js';
import * as neon from './vendors/neon.js';
import * as stripe from './vendors/stripe.js';
import * as supabase from './vendors/supabase.js';
import * as twilio from './vendors/twilio.js';
import * as resend from './vendors/resend.js';
import * as cloudflare from './vendors/cloudflare.js';
import * as redis from './vendors/redis.js';
import * as gws from './vendors/google-workspace.js';
import * as flyio from './vendors/flyio.js';

const VENDORS = [github, vercel, neon, stripe, supabase, twilio, resend, cloudflare, redis, gws, flyio];
const limit = pLimit(parseInt(process.env.RTK_MAX_ACTIVE || '12', 10));

// Allowed MCP tool name regex: ^[a-zA-Z0-9._:-]{1,64}$
const SAFE = /[^a-zA-Z0-9._:-]/g;

type Alias = { vendorId: string; original: string };
const aliasMap = new Map<string, Alias>();      // canonical -> (vendor, original)
const renameLog: Array<{ vendor: string; original: string; canonical: string; reason: string }> = [];

function shortHash(s: string, len = 6) {
  return createHash('sha1').update(s).digest('hex').slice(0, len);
}

/**
 * Canonicalize a tool name to meet MCP constraints and remain unique under 64 chars.
 * We also log any rename so we can surface it via diagnostics.
 */
function canonicalize(vendorId: string, rawName: string): { canonical: string; changed: boolean; reason?: string } {
  const prefix = `${vendorId}.`;                         // namespacing is applied by the registry
  let inner = rawName.replace(SAFE, '_');                // replace disallowed chars
  let changed = inner !== rawName;
  let reason = changed ? 'invalid characters' : undefined;

  // Enforce total length <= 64 (including "<vendor>."):
  const maxInner = 64 - prefix.length;
  if (inner.length > maxInner) {
    const h = shortHash(inner);
    inner = inner.slice(0, Math.max(0, maxInner - 1 - h.length)) + '-' + h;
    changed = true;
    reason = reason ? `${reason}; truncated` : 'truncated';
  }

  return { canonical: `${vendorId}.${inner}`, changed, reason };
}

/**
 * Get catalog of all provider tools with sanitized names
 */
export function providerCatalog(): Tool[] {
  aliasMap.clear();
  renameLog.length = 0;

  const tools: Tool[] = [];
  for (const v of VENDORS) {
    const vendorId = v.id;
    const cat = v.catalog();

    for (const t of cat) {
      const { canonical, changed, reason } = canonicalize(vendorId, t.name);
      if (changed) renameLog.push({ vendor: vendorId, original: t.name, canonical, reason: reason || 'changed' });

      // save alias for routing
      aliasMap.set(canonical, { vendorId, original: t.name });

      // publish sanitized tool (with same schema/description)
      tools.push({ ...t, name: canonical });
    }
  }
  return tools;
}

export async function ensureProviders(): Promise<void> {
  await Promise.all(VENDORS.map(v => limit(() => v.ensureClient())));
}

export function whatWasRenamed() {
  return renameLog.slice();
}

export async function routeProviderCall(name: string, args: unknown) {
  // Prefer canonical lookup
  const alias = aliasMap.get(name);
  if (alias) {
    const v = VENDORS.find(x => x.id === alias.vendorId);
    if (!v) return { content: [{ type: 'text', text: `Unknown provider: ${alias.vendorId}` }] };
    if (!v.isReady()) {
      return { content: [{ type: 'text', text: `Provider '${v.id}' not configured. Missing: ${v.missingEnv().join(', ') || 'n/a'}. Add keys to RTK_DOTENV_PATH or Augment env.` }] };
    }
    return v.call(alias.original, args);
  }

  // Fallback: try "<vendor>.<inner>" without alias (in case tool was added after listing)
  const [vendorId, ...rest] = name.split('.');
  const inner = rest.join('.');
  const v = VENDORS.find(x => x.id === vendorId);
  if (!v) return { content: [{ type: 'text', text: `Unknown provider: ${vendorId}` }] };
  if (!v.isReady()) {
    return { content: [{ type: 'text', text: `Provider '${v.id}' not configured. Missing: ${v.missingEnv().join(', ') || 'n/a'}. Add keys to RTK_DOTENV_PATH or Augment env.` }] };
  }
  return v.call(inner, args);
}

