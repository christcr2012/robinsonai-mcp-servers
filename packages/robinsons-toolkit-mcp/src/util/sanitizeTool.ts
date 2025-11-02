/**
 * Tool Sanitization Utilities
 *
 * Ensures all tools have valid names and schemas before being exposed to MCP clients.
 * Prevents "NULL tools" and "invalid name" errors in Augment.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

const NAME_RE = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * Sanitize a tool name to match MCP requirements
 * - Must match ^[A-Za-z0-9._-]{1,64}$
 * - Replaces invalid characters with underscores
 * - Generates fallback name if invalid
 */
export function sanitizeName(name: string, prefix = "tool"): string {
  let n = (name || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "_");
  
  if (!n || !NAME_RE.test(n)) {
    n = `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
  }
  
  return n.slice(0, 64);
}

/**
 * Normalize a raw tool object to ensure it has valid name, description, and schema
 * Returns null if the tool is invalid and cannot be fixed
 */
export function normalizeTool(t: any, prefix = "tool"): Tool | null {
  if (!t || typeof t !== "object") {
    return null;
  }
  
  const name = sanitizeName(t.name || "", prefix);
  const description = (t.description?.toString() || "—").slice(0, 280);
  const inputSchema = (t.inputSchema && typeof t.inputSchema === "object")
    ? t.inputSchema
    : { type: "object", properties: {} };
  
  return { name, description, inputSchema };
}

/**
 * Validate that a tool meets MCP requirements
 * Returns true if valid, false otherwise
 */
export function isValidTool(t: any): boolean {
  if (!t || typeof t !== "object") return false;
  if (!t.name || typeof t.name !== "string") return false;
  if (!NAME_RE.test(t.name)) return false;
  if (!t.inputSchema || typeof t.inputSchema !== "object") return false;
  return true;
}

