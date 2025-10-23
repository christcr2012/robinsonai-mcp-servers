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

// -------- MCP constraints
const NAME_MAX = 64;
const SAFE_RX = /^[a-zA-Z0-9._:-]{1,64}$/;
const REPLACE_RX = /[^a-zA-Z0-9._:-]/g;

type Alias = { vendorId: string; original: string };

const aliasMap = new Map<string, Alias>();      // canonical -> (vendor, original)
const renameLog: Array<{ vendor: string; original: string; canonical: string; reason: string }> = [];
const rejectLog: Array<{ vendor: string; original: string; reason: string }> = [];
const seenNames = new Set<string>(); // de-duplication

function shortHash(s: string, len = 6) {
  return createHash('sha1').update(s).digest('hex').slice(0, len);
}

/**
 * Canonicalize a tool name to meet MCP constraints:
 * - Replace invalid chars with underscores
 * - Truncate if too long (with hash suffix)
 * - Add vendor namespace prefix
 * Returns null if the name is invalid/empty
 */
function canonicalize(vendorId: string, rawName: string): { canonical: string; changed: boolean; reason?: string } | null {
  if (!rawName || typeof rawName !== 'string') {
    return null; // reject empty/invalid names
  }

  const prefix = `${vendorId}.`;
  let inner = rawName.replace(REPLACE_RX, '_');
  let changed = inner !== rawName;
  let reason = changed ? 'invalid characters' : undefined;

  // Enforce total length <= 64 (including "<vendor>."):
  const maxInner = NAME_MAX - prefix.length;
  if (inner.length > maxInner) {
    const h = shortHash(inner, 6);
    inner = inner.slice(0, Math.max(0, maxInner - 1 - h.length)) + '-' + h;
    changed = true;
    reason = reason ? `${reason}; truncated` : 'truncated';
  }

  const canonical = `${prefix}${inner}`;

  // Final validation
  if (!SAFE_RX.test(canonical)) {
    return null; // reject if still invalid
  }

  return { canonical, changed, reason };
}

/**
 * Get catalog of all provider tools with sanitized names, de-duplication, and reject logging
 */
export function providerCatalog(): Tool[] {
  aliasMap.clear();
  renameLog.length = 0;
  rejectLog.length = 0;
  seenNames.clear();

  const tools: Tool[] = [];

  for (const v of VENDORS) {
    const vendorId = v.id;
    let cat: Tool[] = [];

    try {
      cat = v.catalog();
    } catch (err) {
      console.error(`[registry] Error getting catalog for ${vendorId}:`, err);
      rejectLog.push({ vendor: vendorId, original: '<catalog_error>', reason: String(err) });
      continue;
    }

    for (const t of cat) {
      // Validate tool has required fields
      if (!t || !t.name) {
        rejectLog.push({ vendor: vendorId, original: '<missing_name>', reason: 'tool missing name field' });
        continue;
      }

      // Canonicalize the name
      const result = canonicalize(vendorId, t.name);
      if (!result) {
        rejectLog.push({ vendor: vendorId, original: t.name, reason: 'invalid name after sanitization' });
        continue;
      }

      const { canonical, changed, reason } = result;

      // De-duplicate
      if (seenNames.has(canonical)) {
        rejectLog.push({ vendor: vendorId, original: t.name, reason: `duplicate canonical name: ${canonical}` });
        continue;
      }
      seenNames.add(canonical);

      // Log renames
      if (changed) {
        renameLog.push({ vendor: vendorId, original: t.name, canonical, reason: reason || 'changed' });
      }

      // Save alias for routing
      aliasMap.set(canonical, { vendorId, original: t.name });

      // Publish sanitized tool (with same schema/description)
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

export function whatWasRejected() {
  return rejectLog.slice();
}

export function getProviderStats() {
  const cats = providerCatalog(); // rebuild for fresh snapshot
  const counts: Record<string, number> = {};

  for (const t of cats) {
    const ns = t.name.split('.')[0];
    counts[ns] = (counts[ns] || 0) + 1;
  }

  return {
    counts,
    total: cats.length,
    renamed: renameLog.length,
    rejected: rejectLog.length,
    vendors: VENDORS.map(v => ({
      id: v.id,
      ready: v.isReady(),
      missing: v.missingEnv()
    }))
  };
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

