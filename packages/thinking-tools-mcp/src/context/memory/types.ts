export interface StyleMemory {
  namingPreference: 'camelCase' | 'snake_case' | 'pascalCase' | 'kebab-case' | 'mixed' | 'unknown';
  namingConfidence: number;
  identifierExamples: string[];
  indentStyle: 'spaces' | 'tabs' | 'mixed';
  indentSize?: number;
  quoteStyle: 'single' | 'double' | 'mixed' | 'unknown';
  importStyle?: 'relative' | 'absolute' | 'mixed';
  keywords?: string[];
  updatedAt: string;
}

export interface ArchitecturalPattern {
  name: string;
  description: string;
  files: string[];
  confidence: number; // 0-1
  tags: string[];
  detectedAt: string;
}

export interface UsageRecord {
  count: number;
  lastAccessed: string;
}

export interface MemoryData {
  version: number;
  updatedAt: string;
  style: StyleMemory | null;
  architecture: ArchitecturalPattern[];
  usage: Record<string, UsageRecord>;
}
