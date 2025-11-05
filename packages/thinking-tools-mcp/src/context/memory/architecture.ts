import path from 'path';
import type { SymbolIndex } from '../symbol-index.js';
import type { ArchitecturalPattern } from './types.js';
import { BehaviorMemory } from './behavior.js';

type ImportEdge = { from: string; to: string };

function rel(root: string, file: string): string {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  return path.relative(root, abs).split(path.sep).join('/').toLowerCase();
}

export class ArchitectureMemory {
  constructor(private readonly root: string, private readonly behavior: BehaviorMemory) {}

  analyze(symbolIndex: SymbolIndex | null, importGraph: ImportEdge[] | null): ArchitecturalPattern[] {
    const files = symbolIndex?.files ?? [];
    const relFiles = files.map(f => rel(this.root, f));
    const edges = (importGraph ?? []).map(edge => ({ from: rel(this.root, edge.from), to: rel(this.root, edge.to) }));

    const patterns: ArchitecturalPattern[] = [];
    const now = new Date().toISOString();

    const controllers = relFiles.filter(f => f.includes('controller'));
    const models = relFiles.filter(f => f.includes('model'));
    const views = relFiles.filter(f => f.includes('view'));
    if (controllers.length && models.length) {
      const mvcConfidence = Math.min(1, (controllers.length + models.length + views.length) / 18);
      const hasViewEdges = edges.some(e => e.from.includes('controller') && e.to.includes('view'));
      const confidence = hasViewEdges ? Math.min(1, mvcConfidence + 0.2) : mvcConfidence;
      patterns.push({
        name: 'MVC',
        description: 'Controllers coordinate models' + (views.length ? ' and views' : ''),
        files: [...controllers, ...models, ...views],
        confidence,
        tags: ['controllers', 'models', ...(views.length ? ['views'] : [])],
        detectedAt: now,
      });
    }

    const services = relFiles.filter(f => f.includes('service'));
    const repositories = relFiles.filter(f => f.includes('repository') || f.includes('repo/'));
    if (services.length) {
      const serviceConfidence = Math.min(1, services.length / 12 + (repositories.length ? 0.2 : 0));
      const svcEdges = edges.filter(e => e.from.includes('controller') && e.to.includes('service'));
      patterns.push({
        name: 'Service Layer',
        description: 'Service layer detected via dedicated service files' + (repositories.length ? ' with repositories' : ''),
        files: [...services, ...repositories],
        confidence: Math.min(1, serviceConfidence + (svcEdges.length ? 0.2 : 0)),
        tags: ['services', ...(repositories.length ? ['repositories'] : [])],
        detectedAt: now,
      });
    }

    const apiHandlers = relFiles.filter(f => f.includes('/api/') || f.includes('handler')); // Next.js / serverless
    if (apiHandlers.length) {
      patterns.push({
        name: 'API Handlers',
        description: 'HTTP/API handler files detected',
        files: apiHandlers,
        confidence: Math.min(1, apiHandlers.length / 16 + 0.2),
        tags: ['api', 'handlers'],
        detectedAt: now,
      });
    }

    const hasPackagesDir = relFiles.some(f => f.startsWith('packages/'));
    if (hasPackagesDir) {
      const packageFiles = relFiles.filter(f => f.startsWith('packages/'));
      patterns.push({
        name: 'Monorepo Packages',
        description: 'Multiple package modules detected (monorepo layout)',
        files: packageFiles,
        confidence: Math.min(1, packageFiles.length / 40 + 0.3),
        tags: ['monorepo', 'packages'],
        detectedAt: now,
      });
    }

    const domains = relFiles.filter(f => f.includes('use-case') || f.includes('domain'));
    if (domains.length) {
      patterns.push({
        name: 'Domain Modules',
        description: 'Domain-driven structure with use cases/domains',
        files: domains,
        confidence: Math.min(1, domains.length / 20 + 0.2),
        tags: ['domain', 'use-case'],
        detectedAt: now,
      });
    }

    const uiComponents = relFiles.filter(f => f.includes('component') || f.includes('hooks/'));
    if (uiComponents.length) {
      patterns.push({
        name: 'Component Library',
        description: 'UI components/hooks detected',
        files: uiComponents,
        confidence: Math.min(1, uiComponents.length / 25 + 0.2),
        tags: ['components', 'ui'],
        detectedAt: now,
      });
    }

    this.behavior.updateArchitecture(patterns);
    return patterns;
  }
}
