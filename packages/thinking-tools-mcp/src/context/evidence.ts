/**
 * Evidence Store - Track evidence and findings across thinking tools
 */

import path from 'node:path';
import fs from 'node:fs';

export interface EvidenceItem {
  id: string;
  source: string; // Tool that created it (e.g., 'sequential_thinking', 'premortem')
  timestamp: number;
  data: any;
  meta?: Record<string, any>;
}

export class EvidenceStore {
  private items: Map<string, EvidenceItem> = new Map();
  private evidenceDir: string;

  constructor(private workspaceRoot: string) {
    this.evidenceDir = path.join(workspaceRoot, '.robctx', 'evidence');
  }

  /**
   * Add evidence item
   */
  async add(source: string, data: any, meta?: Record<string, any>): Promise<string> {
    const id = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const item: EvidenceItem = {
      id,
      source,
      timestamp: Date.now(),
      data,
      meta,
    };

    this.items.set(id, item);

    // Optionally persist to disk
    try {
      await this.persist(item);
    } catch (error) {
      console.error('[EvidenceStore] Failed to persist:', error);
    }

    return id;
  }

  /**
   * Get evidence by ID
   */
  get(id: string): EvidenceItem | undefined {
    return this.items.get(id);
  }

  /**
   * Get all evidence from a source
   */
  getBySource(source: string): EvidenceItem[] {
    return Array.from(this.items.values()).filter((item) => item.source === source);
  }

  /**
   * Get all evidence
   */
  getAll(): EvidenceItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Clear all evidence
   */
  clear(): void {
    this.items.clear();
  }

  /**
   * Persist evidence to disk
   */
  private async persist(item: EvidenceItem): Promise<void> {
    if (!fs.existsSync(this.evidenceDir)) {
      fs.mkdirSync(this.evidenceDir, { recursive: true });
    }

    const filePath = path.join(this.evidenceDir, `${item.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
  }

  /**
   * Load evidence from disk
   */
  async load(): Promise<void> {
    if (!fs.existsSync(this.evidenceDir)) return;

    const files = fs.readdirSync(this.evidenceDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      try {
        const filePath = path.join(this.evidenceDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const item: EvidenceItem = JSON.parse(content);
        this.items.set(item.id, item);
      } catch (error) {
        console.error(`[EvidenceStore] Failed to load ${file}:`, error);
      }
    }
  }
}

