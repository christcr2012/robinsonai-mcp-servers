import fs from 'fs';
import path from 'path';
import { ArchitecturalPattern, MemoryData, StyleMemory, UsageRecord } from './types.js';

const MEMORY_VERSION = 1;
const instances = new Map<string, MemoryStore>();

function normalizeRoot(root: string): string {
  return path.resolve(root);
}

function defaultData(): MemoryData {
  return {
    version: MEMORY_VERSION,
    updatedAt: new Date().toISOString(),
    style: null,
    architecture: [],
    usage: {},
  };
}

export class MemoryStore {
  static forRoot(root: string): MemoryStore {
    const key = normalizeRoot(root);
    if (!instances.has(key)) {
      instances.set(key, new MemoryStore(key));
    }
    return instances.get(key)!;
  }

  private readonly memoryPath: string;
  private data: MemoryData;

  private constructor(private readonly workspaceRoot: string) {
    const dir = path.join(this.workspaceRoot, '.robinson', 'context');
    fs.mkdirSync(dir, { recursive: true });
    this.memoryPath = path.join(dir, 'memory.json');
    this.data = this.read();
  }

  getStyle(): StyleMemory | null {
    return this.data.style;
  }

  setStyle(style: StyleMemory | null): void {
    this.data.style = style;
    this.touch();
  }

  getArchitecture(): ArchitecturalPattern[] {
    return this.data.architecture;
  }

  setArchitecture(patterns: ArchitecturalPattern[]): void {
    this.data.architecture = patterns;
    this.touch();
  }

  getUsage(file: string): UsageRecord | undefined {
    return this.data.usage[file];
  }

  incrementUsage(file: string): UsageRecord {
    const key = file.toLowerCase();
    const existing = this.data.usage[key] ?? { count: 0, lastAccessed: new Date(0).toISOString() };
    const record: UsageRecord = {
      count: existing.count + 1,
      lastAccessed: new Date().toISOString(),
    };
    this.data.usage[key] = record;
    this.touch();
    return record;
  }

  getUsageMap(): Record<string, UsageRecord> {
    return this.data.usage;
  }

  private read(): MemoryData {
    if (!fs.existsSync(this.memoryPath)) {
      return defaultData();
    }

    try {
      const parsed = JSON.parse(fs.readFileSync(this.memoryPath, 'utf8')) as MemoryData;
      if (!parsed.version || parsed.version < MEMORY_VERSION) {
        return {
          ...defaultData(),
          style: parsed.style ?? null,
          architecture: parsed.architecture ?? [],
          usage: parsed.usage ?? {},
        };
      }
      return parsed;
    } catch (error) {
      console.warn('[MemoryStore] Failed to parse memory file, resetting:', (error as Error).message);
      return defaultData();
    }
  }

  private touch(): void {
    this.data.updatedAt = new Date().toISOString();
    this.flush();
  }

  private flush(): void {
    try {
      fs.writeFileSync(this.memoryPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.warn('[MemoryStore] Failed to persist memory file:', (error as Error).message);
    }
  }
}
