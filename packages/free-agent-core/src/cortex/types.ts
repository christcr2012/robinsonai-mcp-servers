/**
 * Agent Cortex Types
 * Type definitions for the Agent Cortex system
 */

// ============================================================================
// THINKING PLAYBOOKS
// ============================================================================

export interface ThinkingPlaybook {
  id: string;
  name: string;
  description: string;
  taskPattern: string; // Regex or keyword pattern
  toolSequence: ThinkingToolStep[];
  priority: number;
  successRate: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface ThinkingToolStep {
  tool: string;
  params?: Record<string, any>;
}

// ============================================================================
// TOOL WORKFLOWS
// ============================================================================

export interface ToolWorkflow {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
  prerequisites: string[];
  successRate: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  tool: string;
  params: Record<string, any>;
  dependencies: string[]; // IDs of steps that must complete first
}

// ============================================================================
// CODE PATTERNS
// ============================================================================

export interface CodePattern {
  id: string;
  name: string;
  description: string;
  patternType: string;
  language: string;
  template: string;
  variables: PatternVariable[];
  tags: string[];
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface PatternVariable {
  name: string;
  type: string;
  description: string;
  default?: any;
}

// ============================================================================
// CAPABILITY REGISTRY
// ============================================================================

export interface Capability {
  id: string;
  name: string;
  description: string;
  category: string;
  requiredTools: string[];
  requiredEnvVars: string[];
  workflowId?: string;
  complexity: 'simple' | 'medium' | 'complex' | 'expert';
  estimatedDurationMinutes?: number;
  successRate: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

// ============================================================================
// KNOWLEDGE ARTIFACTS
// ============================================================================

export interface KnowledgeArtifact {
  id: string;
  taskId: string;
  artifactType: 'thinking_output' | 'plan' | 'decision' | 'execution_summary';
  title: string;
  content: string;
  format: 'markdown' | 'json' | 'yaml';
  tags: string[];
  createdAt: Date;
  metadata: Record<string, any>;
}

// ============================================================================
// EVIDENCE CACHE
// ============================================================================

export interface EvidenceCacheEntry {
  id: string;
  cacheKey: string;
  evidenceBundle: any; // EvidenceBundle from evidence.ts
  createdAt: Date;
  expiresAt: Date;
  hitCount: number;
  lastAccessedAt: Date;
}

// ============================================================================
// CORTEX CONTEXT
// ============================================================================

export interface CortexContext {
  playbooks: ThinkingPlaybook[];
  workflows: ToolWorkflow[];
  patterns: CodePattern[];
  capabilities: Capability[];
  artifacts: KnowledgeArtifact[];
  relatedKnowledge: any[]; // From RAD memory
  radDocuments?: any[]; // From RAD Crawler index (NEW)
}

// ============================================================================
// CORTEX OPTIONS
// ============================================================================

export interface GetCortexContextOptions {
  task: string;
  evidence?: any;
  includeRelatedKnowledge?: boolean;
  includeRadDocuments?: boolean; // NEW: Include RAD Crawler documents
  maxPlaybooks?: number;
  maxWorkflows?: number;
  maxPatterns?: number;
  maxArtifacts?: number;
  maxRadDocuments?: number; // NEW: Max RAD documents to include
}

export interface RecordOutcomeOptions {
  taskId: string;
  success: boolean;
  planningArtifacts?: any[];
  executionArtifacts?: any[];
  errorMessage?: string;
}

