/**
 * Dependency Caching
 * 
 * Cache node_modules between sandbox runs to speed up builds.
 * Instead of running npm install every time, we:
 * 1. Create a shared cache directory
 * 2. Symlink node_modules from cache to sandbox
 * 3. Only install if dependencies change
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

const CACHE_DIR = path.join(os.tmpdir(), 'agent-sandbox-cache');

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Generate cache key from package.json
 */
function generateCacheKey(packageJson: any): string {
  const deps = {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {},
  };
  
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(deps));
  return hash.digest('hex').substring(0, 16);
}

/**
 * Get cached node_modules path
 */
function getCachedNodeModulesPath(cacheKey: string): string {
  return path.join(CACHE_DIR, `node_modules-${cacheKey}`);
}

/**
 * Check if cache exists for given package.json
 */
export function hasCachedDependencies(packageJson: any): boolean {
  ensureCacheDir();
  
  const cacheKey = generateCacheKey(packageJson);
  const cachedPath = getCachedNodeModulesPath(cacheKey);
  
  return fs.existsSync(cachedPath);
}

/**
 * Install dependencies and cache them
 */
export function installAndCacheDependencies(
  sandboxDir: string,
  packageJson: any
): void {
  ensureCacheDir();
  
  const cacheKey = generateCacheKey(packageJson);
  const cachedPath = getCachedNodeModulesPath(cacheKey);
  
  // Check if already cached
  if (fs.existsSync(cachedPath)) {
    console.log(`Using cached dependencies (key: ${cacheKey})`);
    linkCachedDependencies(sandboxDir, cachedPath);
    return;
  }
  
  console.log(`Installing dependencies (will cache with key: ${cacheKey})...`);
  
  // Install in sandbox
  try {
    execSync('npm install --silent --no-audit --no-fund', {
      cwd: sandboxDir,
      stdio: 'pipe',
      timeout: 60000, // 1 minute timeout
    });
  } catch (error) {
    console.error('npm install failed:', error);
    throw error;
  }
  
  // Copy to cache
  const sandboxNodeModules = path.join(sandboxDir, 'node_modules');
  if (fs.existsSync(sandboxNodeModules)) {
    console.log(`Caching dependencies to ${cachedPath}...`);
    copyDirectory(sandboxNodeModules, cachedPath);
  }
}

/**
 * Link cached dependencies to sandbox
 */
function linkCachedDependencies(sandboxDir: string, cachedPath: string): void {
  const sandboxNodeModules = path.join(sandboxDir, 'node_modules');
  
  // Remove existing node_modules if present
  if (fs.existsSync(sandboxNodeModules)) {
    fs.rmSync(sandboxNodeModules, { recursive: true, force: true });
  }
  
  // Create symlink (or copy on Windows if symlink fails)
  try {
    fs.symlinkSync(cachedPath, sandboxNodeModules, 'junction');
  } catch (error) {
    // Fallback to copy if symlink fails (Windows permissions)
    console.warn('Symlink failed, copying instead:', error);
    copyDirectory(cachedPath, sandboxNodeModules);
  }
}

/**
 * Copy directory recursively
 */
function copyDirectory(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Clean old cache entries (keep only last 10)
 */
export function cleanOldCache(): void {
  ensureCacheDir();
  
  const entries = fs.readdirSync(CACHE_DIR, { withFileTypes: true });
  const cacheEntries = entries
    .filter(e => e.isDirectory() && e.name.startsWith('node_modules-'))
    .map(e => ({
      name: e.name,
      path: path.join(CACHE_DIR, e.name),
      mtime: fs.statSync(path.join(CACHE_DIR, e.name)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime); // Sort by most recent first
  
  // Keep only last 10
  const toDelete = cacheEntries.slice(10);
  
  for (const entry of toDelete) {
    console.log(`Cleaning old cache: ${entry.name}`);
    fs.rmSync(entry.path, { recursive: true, force: true });
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  totalEntries: number;
  totalSize: number;
  entries: Array<{ key: string; size: number; mtime: Date }>;
} {
  ensureCacheDir();
  
  const entries = fs.readdirSync(CACHE_DIR, { withFileTypes: true });
  const cacheEntries = entries
    .filter(e => e.isDirectory() && e.name.startsWith('node_modules-'))
    .map(e => {
      const entryPath = path.join(CACHE_DIR, e.name);
      const stats = fs.statSync(entryPath);
      const size = getDirectorySize(entryPath);
      
      return {
        key: e.name.replace('node_modules-', ''),
        size,
        mtime: stats.mtime,
      };
    });
  
  const totalSize = cacheEntries.reduce((sum, e) => sum + e.size, 0);
  
  return {
    totalEntries: cacheEntries.length,
    totalSize,
    entries: cacheEntries,
  };
}

/**
 * Get directory size in bytes
 */
function getDirectorySize(dirPath: string): number {
  let size = 0;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      size += getDirectorySize(entryPath);
    } else {
      size += fs.statSync(entryPath).size;
    }
  }
  
  return size;
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  if (fs.existsSync(CACHE_DIR)) {
    console.log(`Clearing all cache at ${CACHE_DIR}...`);
    fs.rmSync(CACHE_DIR, { recursive: true, force: true });
  }
  
  ensureCacheDir();
}

