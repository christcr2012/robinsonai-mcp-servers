/**
 * Stats Tracker
 * 
 * Tracks usage statistics and credit savings.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UsageRecord {
  timestamp: number;
  toolName: string;
  augmentCreditsUsed: number;
  creditsSaved: number;
  timeMs: number;
}

interface Stats {
  totalRequests: number;
  augmentCreditsSaved: number;
  averageTimeMs: number;
  modelUsage: Record<string, number>;
  taskBreakdown: Record<string, number>;
}

export class StatsTracker {
  private statsFile: string;
  private records: UsageRecord[] = [];

  constructor() {
    // Store stats in user's home directory
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    const statsDir = path.join(homeDir, '.autonomous-agent-mcp');
    this.statsFile = path.join(statsDir, 'stats.json');
    this.loadStats();
  }

  /**
   * Record a tool usage
   */
  async recordUsage(
    toolName: string,
    augmentCreditsUsed: number,
    creditsSaved: number,
    timeMs: number
  ): Promise<void> {
    const record: UsageRecord = {
      timestamp: Date.now(),
      toolName,
      augmentCreditsUsed,
      creditsSaved,
      timeMs,
    };

    this.records.push(record);

    // Save to disk (async, don't wait)
    this.saveStats().catch((err) => {
      console.error('Failed to save stats:', err);
    });
  }

  /**
   * Get statistics for a period
   */
  async getStats(options: { period?: string } = {}): Promise<Stats> {
    const period = options.period || 'all';
    const cutoff = this.getPeriodCutoff(period);

    // Filter records by period
    const filteredRecords = this.records.filter(
      (r) => r.timestamp >= cutoff
    );

    if (filteredRecords.length === 0) {
      return {
        totalRequests: 0,
        augmentCreditsSaved: 0,
        averageTimeMs: 0,
        modelUsage: {},
        taskBreakdown: {},
      };
    }

    // Calculate stats
    const totalRequests = filteredRecords.length;
    const augmentCreditsSaved = filteredRecords.reduce(
      (sum, r) => sum + r.creditsSaved,
      0
    );
    const averageTimeMs =
      filteredRecords.reduce((sum, r) => sum + r.timeMs, 0) / totalRequests;

    // Task breakdown
    const taskBreakdown: Record<string, number> = {};
    for (const record of filteredRecords) {
      const task = this.getTaskCategory(record.toolName);
      taskBreakdown[task] = (taskBreakdown[task] || 0) + 1;
    }

    return {
      totalRequests,
      augmentCreditsSaved,
      averageTimeMs,
      modelUsage: {}, // TODO: Track model usage
      taskBreakdown,
    };
  }

  /**
   * Get cutoff timestamp for period
   */
  private getPeriodCutoff(period: string): number {
    const now = Date.now();
    switch (period) {
      case 'today':
        return now - 24 * 60 * 60 * 1000;
      case 'week':
        return now - 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return now - 30 * 24 * 60 * 60 * 1000;
      case 'all':
      default:
        return 0;
    }
  }

  /**
   * Get task category from tool name
   */
  private getTaskCategory(toolName: string): string {
    if (toolName.includes('generation')) return 'generation';
    if (toolName.includes('analysis')) return 'analysis';
    if (toolName.includes('refactor')) return 'refactoring';
    if (toolName.includes('test')) return 'testing';
    if (toolName.includes('documentation')) return 'documentation';
    return 'other';
  }

  /**
   * Load stats from disk
   */
  private async loadStats(): Promise<void> {
    try {
      const data = await fs.readFile(this.statsFile, 'utf-8');
      this.records = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start fresh
      this.records = [];
    }
  }

  /**
   * Save stats to disk
   */
  private async saveStats(): Promise<void> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.statsFile);
      await fs.mkdir(dir, { recursive: true });

      // Keep only last 10,000 records to prevent file from growing too large
      const recordsToSave = this.records.slice(-10000);

      await fs.writeFile(
        this.statsFile,
        JSON.stringify(recordsToSave, null, 2)
      );
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  }
}

