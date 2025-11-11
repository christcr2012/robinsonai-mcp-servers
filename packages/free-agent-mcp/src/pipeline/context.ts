/**
 * Context retrieval for Free Agent
 * 
 * Provides project-aware context:
 * - Project brief (languages, frameworks, conventions)
 * - Symbol glossary (existing functions, types, classes)
 * - Nearby files (similar code patterns)
 */

import { globSync } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { makeProjectBrief, type ProjectBrief } from '../utils/project-brief.js';

export type RepoBrief = {
  languages: string[];
  frameworks: string[];
  style: { naming: string; lint: string[] };
  structure: Array<{ layer: string; paths: string[] }>;
  glossary: Array<{ symbol: string; file: string; summary?: string }>;
};

/**
 * Get project brief with caching
 */
let cachedBrief: { brief: ProjectBrief; timestamp: number } | null = null;
const BRIEF_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getRepoBrief(cwd: string = process.cwd()): Promise<ProjectBrief> {
  const now = Date.now();

  if (cachedBrief && (now - cachedBrief.timestamp) < BRIEF_CACHE_TTL) {
    return cachedBrief.brief;
  }

  const brief = await makeProjectBrief(cwd);
  cachedBrief = { brief, timestamp: now };
  return brief;
}

/**
 * Build glossary from project brief
 * Returns top symbols (functions, types, classes) from the repo
 */
export async function buildGlossaryFromBrief(cwd: string = process.cwd()) {
  const brief = await getRepoBrief(cwd);
  
  // Extract glossary from brief
  const glossary: Array<{ symbol: string; file: string; summary?: string }> = [];
  
  // Add entity names from brief
  if (brief.glossary?.entities) {
    for (const entity of brief.glossary.entities.slice(0, 50)) {
      glossary.push({
        symbol: entity,
        file: 'glossary',
        summary: `Domain entity: ${entity}`
      });
    }
  }
  
  // Add common patterns
  if (brief.glossary?.patterns) {
    for (const pattern of brief.glossary.patterns.slice(0, 20)) {
      glossary.push({
        symbol: pattern,
        file: 'patterns',
        summary: `Common pattern: ${pattern}`
      });
    }
  }
  
  return glossary;
}

/**
 * Retrieve nearby files with similar naming or in same directory
 * Useful for finding related code patterns
 */
export function retrieveNearbyFiles(
  targetPath: string,
  opts = { limit: 3, maxSize: 4000 }
) {
  try {
    const dir = path.dirname(targetPath);
    const base = path.basename(targetPath).split('.')[0];
    
    // Find files in same directory or with similar names
    const candidates = globSync(`${dir}/**/*.{ts,tsx,js,jsx}`, {
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**']
    }).filter(p => {
      const fileName = path.basename(p).split('.')[0];
      return fileName.includes(base) || p.includes(dir);
    });
    
    return candidates.slice(0, opts.limit).map(p => {
      try {
        const content = fs.readFileSync(p, 'utf8');
        const truncated = content.length > opts.maxSize 
          ? content.slice(0, opts.maxSize) + '\n/* …truncated… */'
          : content;
        return {
          path: p,
          content: truncated
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as Array<{ path: string; content: string }>;
  } catch (error) {
    console.warn('Error retrieving nearby files:', error);
    return [];
  }
}

/**
 * Get top-level imports and exports from a file
 * Useful for understanding module structure
 */
export function extractModuleSignature(filePath: string): {
  imports: string[];
  exports: string[];
} {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports: string[] = [];
    const exports: string[] = [];
    
    // Extract imports
    const importRegex = /^import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.push(...match[1].split(',').map(s => s.trim()));
      } else if (match[2]) {
        imports.push(match[2]);
      }
    }
    
    // Extract exports
    const exportRegex = /^export\s+(?:function|class|interface|type|const)\s+(\w+)/gm;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return { imports: [...new Set(imports)], exports: [...new Set(exports)] };
  } catch (error) {
    console.warn(`Error extracting module signature from ${filePath}:`, error);
    return { imports: [], exports: [] };
  }
}

/**
 * Find all files that export a specific symbol
 * Useful for locating where utilities are defined
 */
export function findSymbolDefinition(
  symbol: string,
  cwd: string = process.cwd()
): string | null {
  try {
    const files = globSync(`${cwd}/**/*.{ts,tsx,js,jsx}`, {
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/*.test.*']
    });
    
    for (const file of files) {
      const { exports } = extractModuleSignature(file);
      if (exports.includes(symbol)) {
        return file;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error finding symbol definition:', error);
    return null;
  }
}

