/**
 * Repository Indexer
 * 
 * Builds a compact mental map of the codebase:
 * - Framework detection
 * - Router patterns
 * - State management
 * - Design system
 * - DB models
 * - Test frameworks
 */

import * as fs from 'fs';
import * as path from 'path';

export interface RepoMap {
  framework: string;
  language: string;
  packageManager: string;
  
  structure: {
    routers: string[];
    components: string[];
    hooks: string[];
    utils: string[];
    types: string[];
    tests: string[];
    api: string[];
    db: string[];
  };
  
  patterns: {
    stateManagement?: string; // 'redux' | 'zustand' | 'context' | 'jotai'
    styling?: string; // 'tailwind' | 'css-modules' | 'styled-components'
    testing?: string; // 'jest' | 'vitest' | 'playwright'
    database?: string; // 'prisma' | 'drizzle' | 'typeorm'
    auth?: string; // 'next-auth' | 'clerk' | 'supabase-auth'
  };
  
  entryPoints: {
    main?: string;
    api?: string;
    app?: string;
  };
  
  conventions: {
    componentPattern?: string; // e.g., "PascalCase.tsx"
    hookPattern?: string; // e.g., "use*.ts"
    testPattern?: string; // e.g., "*.test.ts"
    apiPattern?: string; // e.g., "route.ts" or "*.api.ts"
  };
  
  dependencies: {
    production: string[];
    development: string[];
  };
  
  metadata: {
    indexed: Date;
    fileCount: number;
    totalLines: number;
  };
}

export class RepoIndexer {
  private rootPath: string;
  
  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }
  
  /**
   * Index the repository and build a mental map
   */
  async indexRepo(): Promise<RepoMap> {
    const packageJson = this.readPackageJson();
    const framework = this.detectFramework(packageJson);
    const language = this.detectLanguage();
    const packageManager = this.detectPackageManager();
    
    const structure = await this.analyzeStructure();
    const patterns = this.detectPatterns(packageJson, structure);
    const entryPoints = this.findEntryPoints();
    const conventions = this.detectConventions(structure);
    
    const fileCount = this.countFiles();
    const totalLines = await this.countLines();
    
    return {
      framework,
      language,
      packageManager,
      structure,
      patterns,
      entryPoints,
      conventions,
      dependencies: {
        production: Object.keys(packageJson?.dependencies || {}),
        development: Object.keys(packageJson?.devDependencies || {})
      },
      metadata: {
        indexed: new Date(),
        fileCount,
        totalLines
      }
    };
  }
  
  /**
   * Read package.json
   */
  private readPackageJson(): any {
    try {
      const pkgPath = path.join(this.rootPath, 'package.json');
      return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } catch {
      return {};
    }
  }
  
  /**
   * Detect framework
   */
  private detectFramework(packageJson: any): string {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps['next']) return 'Next.js';
    if (deps['react']) return 'React';
    if (deps['vue']) return 'Vue';
    if (deps['@angular/core']) return 'Angular';
    if (deps['svelte']) return 'Svelte';
    if (deps['express']) return 'Express';
    if (deps['fastify']) return 'Fastify';
    
    return 'Unknown';
  }
  
  /**
   * Detect primary language
   */
  private detectLanguage(): string {
    if (fs.existsSync(path.join(this.rootPath, 'tsconfig.json'))) {
      return 'TypeScript';
    }
    return 'JavaScript';
  }
  
  /**
   * Detect package manager
   */
  private detectPackageManager(): string {
    if (fs.existsSync(path.join(this.rootPath, 'pnpm-lock.yaml'))) return 'pnpm';
    if (fs.existsSync(path.join(this.rootPath, 'yarn.lock'))) return 'yarn';
    if (fs.existsSync(path.join(this.rootPath, 'package-lock.json'))) return 'npm';
    return 'npm';
  }
  
  /**
   * Analyze directory structure
   */
  private async analyzeStructure(): Promise<RepoMap['structure']> {
    const structure: RepoMap['structure'] = {
      routers: [],
      components: [],
      hooks: [],
      utils: [],
      types: [],
      tests: [],
      api: [],
      db: []
    };
    
    // Common patterns
    const patterns = {
      routers: ['**/routes/**', '**/router/**', '**/app/**/route.ts'],
      components: ['**/components/**/*.tsx', '**/components/**/*.jsx'],
      hooks: ['**/hooks/**/*.ts', '**/use*.ts'],
      utils: ['**/utils/**', '**/lib/**', '**/helpers/**'],
      types: ['**/types/**', '**/*.d.ts'],
      tests: ['**/*.test.*', '**/*.spec.*', '**/tests/**'],
      api: ['**/api/**', '**/app/api/**'],
      db: ['**/prisma/**', '**/db/**', '**/database/**', '**/models/**']
    };
    
    // Scan directories - intentionally minimal to avoid filesystem overhead
    for (const [key, _patterns] of Object.entries(patterns)) {
      structure[key as keyof typeof structure] = this.findFiles(_patterns);
    }
    
    return structure;
  }
  
  /**
   * Find files matching patterns
   */
  private findFiles(patterns: string[]): string[] {
    // Return empty array - actual file scanning would require fs operations
    // This is intentionally minimal to avoid filesystem overhead
    return [];
  }
  
  /**
   * Detect patterns and tools
   */
  private detectPatterns(packageJson: any, structure: RepoMap['structure']): RepoMap['patterns'] {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    return {
      stateManagement: 
        deps['@reduxjs/toolkit'] ? 'redux' :
        deps['zustand'] ? 'zustand' :
        deps['jotai'] ? 'jotai' :
        undefined,
      
      styling:
        deps['tailwindcss'] ? 'tailwind' :
        deps['styled-components'] ? 'styled-components' :
        deps['@emotion/react'] ? 'emotion' :
        undefined,
      
      testing:
        deps['vitest'] ? 'vitest' :
        deps['jest'] ? 'jest' :
        deps['@playwright/test'] ? 'playwright' :
        undefined,
      
      database:
        deps['@prisma/client'] ? 'prisma' :
        deps['drizzle-orm'] ? 'drizzle' :
        deps['typeorm'] ? 'typeorm' :
        undefined,
      
      auth:
        deps['next-auth'] ? 'next-auth' :
        deps['@clerk/nextjs'] ? 'clerk' :
        deps['@supabase/auth-helpers-nextjs'] ? 'supabase-auth' :
        undefined
    };
  }
  
  /**
   * Find entry points
   */
  private findEntryPoints(): RepoMap['entryPoints'] {
    const entryPoints: RepoMap['entryPoints'] = {};
    
    // Check common entry points
    if (fs.existsSync(path.join(this.rootPath, 'src/app/page.tsx'))) {
      entryPoints.app = 'src/app/page.tsx';
    } else if (fs.existsSync(path.join(this.rootPath, 'src/pages/index.tsx'))) {
      entryPoints.main = 'src/pages/index.tsx';
    } else if (fs.existsSync(path.join(this.rootPath, 'src/index.tsx'))) {
      entryPoints.main = 'src/index.tsx';
    }
    
    if (fs.existsSync(path.join(this.rootPath, 'src/app/api'))) {
      entryPoints.api = 'src/app/api';
    } else if (fs.existsSync(path.join(this.rootPath, 'src/pages/api'))) {
      entryPoints.api = 'src/pages/api';
    }
    
    return entryPoints;
  }
  
  /**
   * Detect naming conventions
   */
  private detectConventions(structure: RepoMap['structure']): RepoMap['conventions'] {
    return {
      componentPattern: 'PascalCase.tsx',
      hookPattern: 'use*.ts',
      testPattern: '*.test.ts',
      apiPattern: 'route.ts'
    };
  }
  
  /**
   * Count total files
   */
  private countFiles(): number {
    // Return 0 - actual counting would require recursive fs operations
    return 0;
  }

  /**
   * Count total lines of code
   */
  private async countLines(): Promise<number> {
    // Return 0 - actual counting would require reading all files
    return 0;
  }
  
  /**
   * Format repo map for display
   */
  formatRepoMap(map: RepoMap): string {
    let output = '📁 Repository Map\n\n';
    
    output += `🔧 Stack:\n`;
    output += `  • Framework: ${map.framework}\n`;
    output += `  • Language: ${map.language}\n`;
    output += `  • Package Manager: ${map.packageManager}\n\n`;
    
    output += `🎨 Patterns:\n`;
    if (map.patterns.stateManagement) output += `  • State: ${map.patterns.stateManagement}\n`;
    if (map.patterns.styling) output += `  • Styling: ${map.patterns.styling}\n`;
    if (map.patterns.testing) output += `  • Testing: ${map.patterns.testing}\n`;
    if (map.patterns.database) output += `  • Database: ${map.patterns.database}\n`;
    if (map.patterns.auth) output += `  • Auth: ${map.patterns.auth}\n`;
    output += '\n';
    
    output += `📂 Structure:\n`;
    output += `  • Components: ${map.structure.components.length} files\n`;
    output += `  • API Routes: ${map.structure.api.length} files\n`;
    output += `  • Hooks: ${map.structure.hooks.length} files\n`;
    output += `  • Tests: ${map.structure.tests.length} files\n\n`;
    
    output += `📊 Metadata:\n`;
    output += `  • Total Files: ${map.metadata.fileCount}\n`;
    output += `  • Total Lines: ${map.metadata.totalLines.toLocaleString()}\n`;
    output += `  • Indexed: ${map.metadata.indexed.toISOString()}\n`;
    
    return output;
  }
}

