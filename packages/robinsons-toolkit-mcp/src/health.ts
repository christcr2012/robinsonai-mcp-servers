/**
 * Toolkit Health Check
 * 
 * Validates that all tools in the toolkit have valid names and schemas.
 * Helps diagnose "NULL tools" and "invalid name" errors.
 */

import { isValidTool } from "./util/sanitizeTool.js";

const NAME_RE = /^[A-Za-z0-9._-]{1,64}$/;

export interface HealthCheckResult {
  total: number;
  valid: number;
  invalid_count: number;
  sample_invalid: Array<{
    index: number;
    name?: string;
    reason: string;
  }>;
  categories: Record<string, number>;
}

/**
 * Validate all tools and return health report
 */
export async function toolkit_health(tools: any[]): Promise<HealthCheckResult> {
  const invalid: Array<{ index: number; name?: string; reason: string }> = [];
  const categories: Record<string, number> = {};
  
  tools.forEach((t: any, i: number) => {
    // Track categories
    const category = t.name?.split("_")[0] || "unknown";
    categories[category] = (categories[category] || 0) + 1;
    
    // Validate tool
    if (!t || typeof t !== "object") {
      invalid.push({ index: i, name: t?.name, reason: "not an object" });
      return;
    }
    
    if (!t.name || typeof t.name !== "string") {
      invalid.push({ index: i, name: t?.name, reason: "missing or invalid name" });
      return;
    }
    
    if (!NAME_RE.test(t.name)) {
      invalid.push({ index: i, name: t.name, reason: "name doesn't match ^[A-Za-z0-9._-]{1,64}$" });
      return;
    }
    
    if (!t.inputSchema || typeof t.inputSchema !== "object") {
      invalid.push({ index: i, name: t.name, reason: "missing or invalid inputSchema" });
      return;
    }
    
    if (!t.description || typeof t.description !== "string") {
      invalid.push({ index: i, name: t.name, reason: "missing or invalid description" });
      return;
    }
  });
  
  return {
    total: tools.length,
    valid: tools.length - invalid.length,
    invalid_count: invalid.length,
    sample_invalid: invalid.slice(0, 20),
    categories,
  };
}

