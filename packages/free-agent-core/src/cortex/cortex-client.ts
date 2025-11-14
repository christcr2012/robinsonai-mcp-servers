/**
 * Agent Cortex Client
 * Main interface for Agent Cortex - the agent's "brain" for learning and planning
 */

import { Pool } from 'pg';
import { PlaybooksRepo } from './playbooks-repo.js';
import { WorkflowsRepo } from './workflows-repo.js';
import { PatternsRepo } from './patterns-repo.js';
import { CapabilitiesRepo } from './capabilities-repo.js';
import { ArtifactsRepo } from './artifacts-repo.js';
import { EvidenceCacheRepo } from './evidence-cache.js';
import { getRadClient } from '../rad-client.js';
import type {
  CortexContext,
  GetCortexContextOptions,
  RecordOutcomeOptions,
} from './types.js';

// Default RAD database URL (same as RAD Memory)
const DEFAULT_CORTEX_DATABASE_URL =
  'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

export class AgentCortexClient {
  private pool: Pool;
  private enabled: boolean;

  // Repositories
  public playbooks: PlaybooksRepo;
  public workflows: WorkflowsRepo;
  public patterns: PatternsRepo;
  public capabilities: CapabilitiesRepo;
  public artifacts: ArtifactsRepo;
  public evidenceCache: EvidenceCacheRepo;

  constructor() {
    // Cortex is enabled by default, can be disabled with CORTEX_ENABLED=false
    this.enabled = process.env.CORTEX_ENABLED !== 'false';

    if (this.enabled) {
      // Use custom database URL if provided, otherwise use shared default
      const databaseUrl =
        process.env.CORTEX_DATABASE_URL ||
        process.env.RAD_DATABASE_URL ||
        DEFAULT_CORTEX_DATABASE_URL;

      this.pool = new Pool({
        connectionString: databaseUrl,
      });

      // Initialize repositories
      this.playbooks = new PlaybooksRepo(this.pool);
      this.workflows = new WorkflowsRepo(this.pool);
      this.patterns = new PatternsRepo(this.pool);
      this.capabilities = new CapabilitiesRepo(this.pool);
      this.artifacts = new ArtifactsRepo(this.pool);
      this.evidenceCache = new EvidenceCacheRepo(this.pool);
    } else {
      // Create dummy pool and repos when disabled
      this.pool = null as any;
      this.playbooks = null as any;
      this.workflows = null as any;
      this.patterns = null as any;
      this.capabilities = null as any;
      this.artifacts = null as any;
      this.evidenceCache = null as any;
    }
  }

  /**
   * Check if Cortex is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get Cortex context for a task
   * Combines playbooks, workflows, patterns, capabilities, artifacts, and RAD knowledge
   */
  async getCortexContext(options: GetCortexContextOptions): Promise<CortexContext> {
    if (!this.enabled) {
      return {
        playbooks: [],
        workflows: [],
        patterns: [],
        capabilities: [],
        artifacts: [],
        relatedKnowledge: [],
      };
    }

    const {
      task,
      evidence,
      includeRelatedKnowledge = true,
      maxPlaybooks = 5,
      maxWorkflows = 10,
      maxPatterns = 10,
      maxArtifacts = 20,
    } = options;

    // Gather context in parallel
    const [playbooks, workflows, patterns, capabilities, artifacts, relatedKnowledge] =
      await Promise.all([
        // Find matching playbooks
        this.playbooks.findMatchingPlaybooks(task, maxPlaybooks),

        // Get all workflows (can be filtered by category later)
        this.workflows.listAll().then(all => all.slice(0, maxWorkflows)),

        // Get all patterns (can be filtered by type/language later)
        this.patterns.listAll().then(all => all.slice(0, maxPatterns)),

        // Get all capabilities
        this.capabilities.listAll(),

        // Get recent artifacts (can be filtered by tags later)
        this.artifacts.findByType('thinking_output', maxArtifacts),

        // Get related knowledge from RAD if enabled
        includeRelatedKnowledge
          ? getRadClient()
              .getRelatedKnowledge({ taskDescription: task, repoId: evidence?.repo || '' })
              .then(result => (result ? [result] : []))
              .catch(() => [])
          : Promise.resolve([]),
      ]);

    return {
      playbooks,
      workflows,
      patterns,
      capabilities,
      artifacts,
      relatedKnowledge,
    };
  }

  /**
   * Record task outcome and save artifacts
   */
  async recordOutcome(options: RecordOutcomeOptions): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const { taskId, success, planningArtifacts, executionArtifacts, errorMessage } = options;

    // Delegate to RAD for event recording
    const radClient = getRadClient();
    if (radClient.isEnabled()) {
      // RAD recordEvent is called from runner.ts, so we don't duplicate it here
      // This is just for saving additional artifacts
    }

    // Save planning artifacts
    if (planningArtifacts && planningArtifacts.length > 0) {
      for (const artifact of planningArtifacts) {
        await this.artifacts.saveThinkingArtifact(
          taskId,
          artifact.title || 'Planning Artifact',
          artifact.content || JSON.stringify(artifact),
          artifact.tags || [],
          artifact.metadata || {}
        );
      }
    }

    // Save execution artifacts
    if (executionArtifacts && executionArtifacts.length > 0) {
      for (const artifact of executionArtifacts) {
        await this.artifacts.saveExecutionSummary(
          taskId,
          artifact.title || 'Execution Summary',
          artifact.content || JSON.stringify(artifact),
          artifact.tags || [],
          artifact.metadata || {}
        );
      }
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Singleton instance
let cortexClientInstance: AgentCortexClient | null = null;

/**
 * Get singleton Cortex client instance
 */
export function getCortexClient(): AgentCortexClient {
  if (!cortexClientInstance) {
    cortexClientInstance = new AgentCortexClient();
  }
  return cortexClientInstance;
}

