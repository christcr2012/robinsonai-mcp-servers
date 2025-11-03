/**
 * Repository Context Discovery System
 * 
 * This module provides REPOSITORY-AGNOSTIC context discovery.
 * It works on ANY codebase without hardcoded assumptions.
 * 
 * Design Principles:
 * 1. Dynamic Discovery - Learn structure at runtime
 * 2. Pattern Recognition - Identify conventions from existing code
 * 3. Example-Based Learning - Find similar code to guide new work
 * 4. Forward Compatible - Ready for RAD crawler knowledge base integration
 * 
 * Future Integration:
 * When RAD crawler is available, this system will:
 * - Query the knowledge base for deeper insights
 * - Fall back to dynamic discovery if KB unavailable
 * - Merge KB data with runtime discovery
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname, basename, dirname } from "node:path";

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectStructure {
  type: "monorepo" | "single-package" | "multi-module" | "unknown";
  root: string;
  packages: PackageInfo[];
  conventions: CodeConventions;
  examples: CodeExamples;
  metadata: ProjectMetadata;
}

export interface PackageInfo {
  name: string;
  path: string;
  type: "library" | "application" | "tool" | "unknown";
  entryPoint?: string;
  sourceDir?: string;
  testDir?: string;
  buildDir?: string;
}

export interface CodeConventions {
  fileNaming: "kebab-case" | "camelCase" | "PascalCase" | "snake_case" | "mixed";
  importStyle: "esm" | "commonjs" | "mixed";
  quoteStyle: "single" | "double" | "mixed";
  indentation: "tabs" | "2-spaces" | "4-spaces" | "mixed";
  lineEndings: "lf" | "crlf" | "mixed";
  formatting: "compact" | "verbose" | "mixed";
}

export interface CodeExamples {
  toolDefinitions: string[];  // Paths to files with tool definitions
  apiHandlers: string[];      // Paths to API handler files
  testFiles: string[];        // Paths to test files
  configFiles: string[];      // Paths to config files
}

export interface ProjectMetadata {
  languages: string[];
  frameworks: string[];
  packageManager?: "npm" | "yarn" | "pnpm" | "bun";
  buildTools: string[];
  testFrameworks: string[];
  totalFiles: number;
  totalLines: number;
}

// ============================================================================
// MAIN DISCOVERY FUNCTION
// ============================================================================

export function discoverProjectStructure(root: string = process.cwd()): ProjectStructure {
  console.error(`[Discovery] Scanning repository: ${root}`);
  
  const structure: ProjectStructure = {
    type: "unknown",
    root,
    packages: [],
    conventions: detectConventions(root),
    examples: findCodeExamples(root),
    metadata: gatherMetadata(root),
  };
  
  // Detect project type
  structure.type = detectProjectType(root);
  
  // Discover packages
  structure.packages = discoverPackages(root, structure.type);
  
  console.error(`[Discovery] Found ${structure.packages.length} packages, ${structure.metadata.totalFiles} files`);
  
  return structure;
}

// ============================================================================
// PROJECT TYPE DETECTION
// ============================================================================

function detectProjectType(root: string): ProjectStructure["type"] {
  const hasWorkspaces = existsSync(join(root, "package.json")) && 
    JSON.parse(readFileSync(join(root, "package.json"), "utf8")).workspaces;
  
  const hasPackagesDir = existsSync(join(root, "packages"));
  const hasAppsDir = existsSync(join(root, "apps"));
  
  if (hasWorkspaces || hasPackagesDir || hasAppsDir) {
    return "monorepo";
  }
  
  const hasSrcDir = existsSync(join(root, "src"));
  const hasLibDir = existsSync(join(root, "lib"));
  
  if (hasSrcDir || hasLibDir) {
    return "single-package";
  }
  
  return "unknown";
}

// ============================================================================
// PACKAGE DISCOVERY
// ============================================================================

function discoverPackages(root: string, type: ProjectStructure["type"]): PackageInfo[] {
  const packages: PackageInfo[] = [];
  
  if (type === "monorepo") {
    // Scan packages/ and apps/ directories
    const packagesDir = join(root, "packages");
    const appsDir = join(root, "apps");
    
    if (existsSync(packagesDir)) {
      for (const name of readdirSync(packagesDir)) {
        const pkgPath = join(packagesDir, name);
        if (statSync(pkgPath).isDirectory()) {
          packages.push(analyzePackage(name, pkgPath));
        }
      }
    }
    
    if (existsSync(appsDir)) {
      for (const name of readdirSync(appsDir)) {
        const pkgPath = join(appsDir, name);
        if (statSync(pkgPath).isDirectory()) {
          packages.push(analyzePackage(name, pkgPath));
        }
      }
    }
  } else {
    // Single package
    packages.push(analyzePackage(basename(root), root));
  }
  
  return packages;
}

function analyzePackage(name: string, path: string): PackageInfo {
  const pkg: PackageInfo = {
    name,
    path,
    type: "unknown",
  };
  
  // Detect package type from package.json
  const pkgJsonPath = join(path, "package.json");
  if (existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
    
    // Check if it's a binary/tool
    if (pkgJson.bin) {
      pkg.type = "tool";
    }
    // Check if it's an application
    else if (pkgJson.scripts?.start || pkgJson.scripts?.dev) {
      pkg.type = "application";
    }
    // Otherwise it's a library
    else {
      pkg.type = "library";
    }
    
    // Find entry point
    pkg.entryPoint = pkgJson.main || pkgJson.module;
  }
  
  // Find source directory
  if (existsSync(join(path, "src"))) {
    pkg.sourceDir = "src";
  } else if (existsSync(join(path, "lib"))) {
    pkg.sourceDir = "lib";
  }
  
  // Find test directory
  if (existsSync(join(path, "test"))) {
    pkg.testDir = "test";
  } else if (existsSync(join(path, "tests"))) {
    pkg.testDir = "tests";
  } else if (existsSync(join(path, "__tests__"))) {
    pkg.testDir = "__tests__";
  }
  
  // Find build directory
  if (existsSync(join(path, "dist"))) {
    pkg.buildDir = "dist";
  } else if (existsSync(join(path, "build"))) {
    pkg.buildDir = "build";
  }
  
  return pkg;
}

// ============================================================================
// CONVENTION DETECTION
// ============================================================================

function detectConventions(root: string): CodeConventions {
  const samples = collectCodeSamples(root, 50); // Sample 50 files
  
  return {
    fileNaming: detectFileNaming(samples),
    importStyle: detectImportStyle(samples),
    quoteStyle: detectQuoteStyle(samples),
    indentation: detectIndentation(samples),
    lineEndings: detectLineEndings(samples),
    formatting: detectFormatting(samples),
  };
}

function collectCodeSamples(root: string, maxFiles: number): string[] {
  const samples: string[] = [];
  const extensions = [".ts", ".js", ".tsx", ".jsx"];
  
  function scan(dir: string, depth: number = 0) {
    if (depth > 5 || samples.length >= maxFiles) return;
    
    try {
      for (const entry of readdirSync(dir)) {
        if (samples.length >= maxFiles) break;
        
        // Skip node_modules, dist, build
        if (["node_modules", "dist", "build", ".git"].includes(entry)) continue;
        
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath, depth + 1);
        } else if (extensions.includes(extname(entry))) {
          try {
            samples.push(readFileSync(fullPath, "utf8"));
          } catch {}
        }
      }
    } catch {}
  }
  
  scan(root);
  return samples;
}

function detectFileNaming(samples: string[]): CodeConventions["fileNaming"] {
  // This would analyze actual filenames, simplified for now
  return "kebab-case";
}

function detectImportStyle(samples: string[]): CodeConventions["importStyle"] {
  let esmCount = 0;
  let cjsCount = 0;
  
  for (const code of samples) {
    if (code.includes("import ") || code.includes("export ")) esmCount++;
    if (code.includes("require(") || code.includes("module.exports")) cjsCount++;
  }
  
  if (esmCount > cjsCount * 2) return "esm";
  if (cjsCount > esmCount * 2) return "commonjs";
  return "mixed";
}

function detectQuoteStyle(samples: string[]): CodeConventions["quoteStyle"] {
  let singleCount = 0;
  let doubleCount = 0;
  
  for (const code of samples) {
    singleCount += (code.match(/'/g) || []).length;
    doubleCount += (code.match(/"/g) || []).length;
  }
  
  if (singleCount > doubleCount * 1.5) return "single";
  if (doubleCount > singleCount * 1.5) return "double";
  return "mixed";
}

function detectIndentation(samples: string[]): CodeConventions["indentation"] {
  let tabCount = 0;
  let space2Count = 0;
  let space4Count = 0;
  
  for (const code of samples) {
    const lines = code.split("\n");
    for (const line of lines) {
      if (line.startsWith("\t")) tabCount++;
      else if (line.startsWith("  ") && !line.startsWith("    ")) space2Count++;
      else if (line.startsWith("    ")) space4Count++;
    }
  }
  
  const max = Math.max(tabCount, space2Count, space4Count);
  if (max === tabCount) return "tabs";
  if (max === space2Count) return "2-spaces";
  if (max === space4Count) return "4-spaces";
  return "mixed";
}

function detectLineEndings(samples: string[]): CodeConventions["lineEndings"] {
  let crlfCount = 0;
  let lfCount = 0;
  
  for (const code of samples) {
    crlfCount += (code.match(/\r\n/g) || []).length;
    lfCount += (code.match(/(?<!\r)\n/g) || []).length;
  }
  
  if (crlfCount > lfCount * 2) return "crlf";
  if (lfCount > crlfCount * 2) return "lf";
  return "mixed";
}

function detectFormatting(samples: string[]): CodeConventions["formatting"] {
  // Analyze if code is compact (single-line) or verbose (multi-line)
  let compactCount = 0;
  let verboseCount = 0;
  
  for (const code of samples) {
    // Look for compact patterns like: { name: "x", description: "y" }
    if (code.match(/\{\s*\w+:\s*[^,}]+,\s*\w+:\s*[^}]+\}/)) compactCount++;
    
    // Look for verbose patterns with newlines
    if (code.match(/\{\s*\n\s+\w+:/)) verboseCount++;
  }
  
  if (compactCount > verboseCount * 1.5) return "compact";
  if (verboseCount > compactCount * 1.5) return "verbose";
  return "mixed";
}

// ============================================================================
// CODE EXAMPLES DISCOVERY
// ============================================================================

function findCodeExamples(root: string): CodeExamples {
  const examples: CodeExamples = {
    toolDefinitions: [],
    apiHandlers: [],
    testFiles: [],
    configFiles: [],
  };

  function scan(dir: string, depth: number = 0) {
    if (depth > 5) return;

    try {
      for (const entry of readdirSync(dir)) {
        // Skip node_modules, dist, build
        if (["node_modules", "dist", "build", ".git"].includes(entry)) continue;

        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scan(fullPath, depth + 1);
        } else {
          const ext = extname(entry);
          const name = basename(entry, ext);

          // Detect tool definitions
          if (name.includes("tool") || name.includes("handler") || fullPath.includes("/tools/")) {
            examples.toolDefinitions.push(relative(root, fullPath));
          }

          // Detect API handlers
          if (name.includes("handler") || name.includes("route") || name.includes("api")) {
            examples.apiHandlers.push(relative(root, fullPath));
          }

          // Detect test files
          if (name.includes(".test") || name.includes(".spec") || fullPath.includes("/__tests__/")) {
            examples.testFiles.push(relative(root, fullPath));
          }

          // Detect config files
          if (["tsconfig.json", "package.json", ".eslintrc", "jest.config"].some(c => entry.includes(c))) {
            examples.configFiles.push(relative(root, fullPath));
          }
        }
      }
    } catch {}
  }

  scan(root);
  return examples;
}

// ============================================================================
// METADATA GATHERING
// ============================================================================

function gatherMetadata(root: string): ProjectMetadata {
  const metadata: ProjectMetadata = {
    languages: [],
    frameworks: [],
    buildTools: [],
    testFrameworks: [],
    totalFiles: 0,
    totalLines: 0,
  };

  // Detect languages
  if (existsSync(join(root, "tsconfig.json"))) metadata.languages.push("TypeScript");
  if (existsSync(join(root, "package.json"))) metadata.languages.push("JavaScript");
  if (existsSync(join(root, "go.mod"))) metadata.languages.push("Go");
  if (existsSync(join(root, "Cargo.toml"))) metadata.languages.push("Rust");
  if (existsSync(join(root, "requirements.txt")) || existsSync(join(root, "pyproject.toml"))) {
    metadata.languages.push("Python");
  }

  // Detect package manager
  if (existsSync(join(root, "pnpm-lock.yaml"))) metadata.packageManager = "pnpm";
  else if (existsSync(join(root, "yarn.lock"))) metadata.packageManager = "yarn";
  else if (existsSync(join(root, "bun.lockb"))) metadata.packageManager = "bun";
  else if (existsSync(join(root, "package-lock.json"))) metadata.packageManager = "npm";

  // Parse package.json for frameworks and tools
  const pkgJsonPath = join(root, "package.json");
  if (existsSync(pkgJsonPath)) {
    try {
      const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
      const deps = { ...(pkgJson.dependencies || {}), ...(pkgJson.devDependencies || {}) };

      // Detect frameworks
      if (deps["next"]) metadata.frameworks.push("Next.js");
      if (deps["react"]) metadata.frameworks.push("React");
      if (deps["vue"]) metadata.frameworks.push("Vue");
      if (deps["svelte"]) metadata.frameworks.push("Svelte");
      if (deps["express"]) metadata.frameworks.push("Express");
      if (deps["fastify"]) metadata.frameworks.push("Fastify");
      if (deps["@nestjs/core"]) metadata.frameworks.push("NestJS");

      // Detect build tools
      if (deps["typescript"]) metadata.buildTools.push("TypeScript");
      if (deps["webpack"]) metadata.buildTools.push("Webpack");
      if (deps["vite"]) metadata.buildTools.push("Vite");
      if (deps["esbuild"]) metadata.buildTools.push("esbuild");
      if (deps["rollup"]) metadata.buildTools.push("Rollup");

      // Detect test frameworks
      if (deps["vitest"]) metadata.testFrameworks.push("Vitest");
      if (deps["jest"]) metadata.testFrameworks.push("Jest");
      if (deps["mocha"]) metadata.testFrameworks.push("Mocha");
      if (deps["playwright"]) metadata.testFrameworks.push("Playwright");
      if (deps["cypress"]) metadata.testFrameworks.push("Cypress");
    } catch {}
  }

  // Count files and lines
  function countFiles(dir: string, depth: number = 0) {
    if (depth > 5) return;

    try {
      for (const entry of readdirSync(dir)) {
        if (["node_modules", "dist", "build", ".git"].includes(entry)) continue;

        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          countFiles(fullPath, depth + 1);
        } else {
          metadata.totalFiles++;

          // Count lines for code files
          const ext = extname(entry);
          if ([".ts", ".js", ".tsx", ".jsx", ".go", ".rs", ".py"].includes(ext)) {
            try {
              const content = readFileSync(fullPath, "utf8");
              metadata.totalLines += content.split("\n").length;
            } catch {}
          }
        }
      }
    } catch {}
  }

  countFiles(root);
  return metadata;
}

// ============================================================================
// FORMATTING & EXPORT
// ============================================================================

export function formatProjectSummary(structure: ProjectStructure): string {
  const lines: string[] = [];

  lines.push(`# Project Structure: ${structure.type}`);
  lines.push(`Root: ${structure.root}`);
  lines.push("");

  lines.push(`## Metadata`);
  lines.push(`Languages: ${structure.metadata.languages.join(", ")}`);
  lines.push(`Frameworks: ${structure.metadata.frameworks.join(", ") || "None"}`);
  lines.push(`Package Manager: ${structure.metadata.packageManager || "Unknown"}`);
  lines.push(`Build Tools: ${structure.metadata.buildTools.join(", ") || "None"}`);
  lines.push(`Test Frameworks: ${structure.metadata.testFrameworks.join(", ") || "None"}`);
  lines.push(`Total Files: ${structure.metadata.totalFiles}`);
  lines.push(`Total Lines: ${structure.metadata.totalLines}`);
  lines.push("");

  lines.push(`## Packages (${structure.packages.length})`);
  for (const pkg of structure.packages) {
    lines.push(`- ${pkg.name} (${pkg.type})`);
    lines.push(`  Path: ${pkg.path}`);
    if (pkg.sourceDir) lines.push(`  Source: ${pkg.sourceDir}`);
    if (pkg.testDir) lines.push(`  Tests: ${pkg.testDir}`);
    if (pkg.buildDir) lines.push(`  Build: ${pkg.buildDir}`);
  }
  lines.push("");

  lines.push(`## Code Conventions`);
  lines.push(`File Naming: ${structure.conventions.fileNaming}`);
  lines.push(`Import Style: ${structure.conventions.importStyle}`);
  lines.push(`Quote Style: ${structure.conventions.quoteStyle}`);
  lines.push(`Indentation: ${structure.conventions.indentation}`);
  lines.push(`Line Endings: ${structure.conventions.lineEndings}`);
  lines.push(`Formatting: ${structure.conventions.formatting}`);
  lines.push("");

  lines.push(`## Code Examples`);
  lines.push(`Tool Definitions: ${structure.examples.toolDefinitions.length} files`);
  lines.push(`API Handlers: ${structure.examples.apiHandlers.length} files`);
  lines.push(`Test Files: ${structure.examples.testFiles.length} files`);
  lines.push(`Config Files: ${structure.examples.configFiles.length} files`);

  return lines.join("\n");
}

// ============================================================================
// RAD CRAWLER INTEGRATION (FUTURE)
// ============================================================================

/**
 * Future: Query RAD crawler knowledge base for deeper insights
 *
 * When RAD crawler is available, this function will:
 * 1. Check if RAD crawler DB is accessible
 * 2. Query for repository-specific knowledge
 * 3. Merge with runtime discovery
 * 4. Fall back to discovery-only if KB unavailable
 */
export async function enrichWithKnowledgeBase(
  structure: ProjectStructure,
  radCrawlerUrl?: string
): Promise<ProjectStructure> {
  // TODO: Implement RAD crawler integration
  // For now, just return the structure as-is

  if (radCrawlerUrl) {
    console.error(`[Discovery] RAD crawler integration not yet implemented`);
    console.error(`[Discovery] Will query: ${radCrawlerUrl}`);
  }

  return structure;
}

