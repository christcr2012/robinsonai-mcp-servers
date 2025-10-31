/*
  pr-quality-pack.ts – PR Quality Pack
  ------------------------------------
  Auto-create PR description with:
  - Summary
  - Risks
  - Migration steps
  - Test plan
  - Rollback instructions
  - Mermaid diagrams (if interfaces changed)
  
  Integrates with ExecReport and Design Card
*/

import type { ExecReport } from '../utils/convention-score-patch.js';
import type { DesignCard } from './design-card.js';
import type { JudgeVerdict } from '../utils/judge-fixer-prompts.js';

export type PRQualityPack = {
  title: string;
  summary: string;
  changes: {
    added: string[];
    modified: string[];
    removed: string[];
  };
  risks: string[];
  migrationSteps?: string[];
  testPlan: string;
  rollback: string;
  diagrams?: string[];
  metadata: {
    iterations: number;
    verdict: string;
    scores: Record<string, number>;
  };
};

/**
 * Generate PR Quality Pack from Design Card and execution results
 */
export function generatePRQualityPack(
  card: DesignCard,
  exec: ExecReport,
  verdict: JudgeVerdict,
  opts: {
    iterations?: number;
    changedFiles?: string[];
    conventionsUsed?: Array<{ new: string; mirrors: string[] }>;
  } = {}
): PRQualityPack {
  const pack: PRQualityPack = {
    title: card.name,
    summary: generateSummary(card, exec, verdict),
    changes: categorizeChanges(opts.changedFiles || []),
    risks: card.risks || [],
    testPlan: generateTestPlan(card, exec),
    rollback: generateRollback(card, opts.changedFiles || []),
    metadata: {
      iterations: opts.iterations || 0,
      verdict: verdict.verdict,
      scores: verdict.scores,
    },
  };
  
  // Add migration steps if data model changed
  if (card.dataModel) {
    pack.migrationSteps = generateMigrationSteps(card);
  }
  
  // Add diagrams if interfaces changed
  if (card.interfaces && card.interfaces.length > 0) {
    pack.diagrams = generateDiagrams(card);
  }
  
  return pack;
}

/**
 * Render PR Quality Pack as Markdown
 */
export function renderPRQualityPack(pack: PRQualityPack): string {
  let md = `# ${pack.title}\n\n`;
  
  // Summary
  md += `## Summary\n\n${pack.summary}\n\n`;
  
  // Changes
  md += `## Changes\n\n`;
  if (pack.changes.added.length > 0) {
    md += `**Added:**\n${pack.changes.added.map(f => `- ${f}`).join('\n')}\n\n`;
  }
  if (pack.changes.modified.length > 0) {
    md += `**Modified:**\n${pack.changes.modified.map(f => `- ${f}`).join('\n')}\n\n`;
  }
  if (pack.changes.removed.length > 0) {
    md += `**Removed:**\n${pack.changes.removed.map(f => `- ${f}`).join('\n')}\n\n`;
  }
  
  // Risks
  if (pack.risks.length > 0) {
    md += `## ⚠️ Risks\n\n${pack.risks.map(r => `- ${r}`).join('\n')}\n\n`;
  }
  
  // Migration Steps
  if (pack.migrationSteps && pack.migrationSteps.length > 0) {
    md += `## 🔄 Migration Steps\n\n`;
    pack.migrationSteps.forEach((step, i) => {
      md += `${i + 1}. ${step}\n`;
    });
    md += '\n';
  }
  
  // Test Plan
  md += `## ✅ Test Plan\n\n${pack.testPlan}\n\n`;
  
  // Rollback
  md += `## 🔙 Rollback\n\n${pack.rollback}\n\n`;
  
  // Diagrams
  if (pack.diagrams && pack.diagrams.length > 0) {
    md += `## 📊 Diagrams\n\n`;
    for (const diagram of pack.diagrams) {
      md += `${diagram}\n\n`;
    }
  }
  
  // Metadata
  md += `## 📋 Metadata\n\n`;
  md += `- **Iterations:** ${pack.metadata.iterations}\n`;
  md += `- **Verdict:** ${pack.metadata.verdict}\n`;
  md += `- **Scores:**\n`;
  for (const [key, value] of Object.entries(pack.metadata.scores)) {
    md += `  - ${key}: ${value}\n`;
  }
  
  return md;
}

/**
 * Generate summary from Design Card and execution results
 */
function generateSummary(
  card: DesignCard,
  exec: ExecReport,
  verdict: JudgeVerdict
): string {
  let summary = card.context || '';
  
  summary += `\n\n**Goals:**\n${card.goals.map(g => `- ${g}`).join('\n')}`;
  
  if (card.nonGoals && card.nonGoals.length > 0) {
    summary += `\n\n**Non-Goals:**\n${card.nonGoals.map(g => `- ${g}`).join('\n')}`;
  }
  
  summary += `\n\n**Acceptance Criteria:**\n${card.acceptance.map(a => `- ${a}`).join('\n')}`;
  
  // Add execution summary
  summary += `\n\n**Quality Gates:**\n`;
  summary += `- Compiled: ${exec.compiled ? '✅' : '❌'}\n`;
  summary += `- Lint Errors: ${exec.lintErrors.length}\n`;
  summary += `- Type Errors: ${exec.typeErrors.length}\n`;
  summary += `- Tests: ${exec.test.passed} passed, ${exec.test.failed} failed\n`;
  summary += `- Coverage: ${exec.test.coveragePct || 'N/A'}%\n`;
  
  return summary;
}

/**
 * Categorize changed files
 */
function categorizeChanges(changedFiles: string[]): {
  added: string[];
  modified: string[];
  removed: string[];
} {
  // Simple heuristic: assume all are modified for now
  // In real implementation, use git diff to detect added/removed
  return {
    added: changedFiles.filter(f => f.includes('/new/')),
    modified: changedFiles.filter(f => !f.includes('/new/') && !f.includes('/deleted/')),
    removed: changedFiles.filter(f => f.includes('/deleted/')),
  };
}

/**
 * Generate test plan
 */
function generateTestPlan(card: DesignCard, exec: ExecReport): string {
  let plan = 'The following tests verify the implementation:\n\n';
  
  // Add acceptance criteria as test checklist
  for (const criterion of card.acceptance) {
    plan += `- [ ] ${criterion}\n`;
  }
  
  plan += `\n**Test Results:**\n`;
  plan += `- Passed: ${exec.test.passed}\n`;
  plan += `- Failed: ${exec.test.failed}\n`;
  plan += `- Coverage: ${exec.test.coveragePct || 'N/A'}%\n`;
  
  return plan;
}

/**
 * Generate rollback instructions
 */
function generateRollback(card: DesignCard, changedFiles: string[]): string {
  let rollback = 'To rollback this change:\n\n';
  
  if (card.dataModel) {
    rollback += '1. **Database:** Run down migration to revert schema changes\n';
  }
  
  rollback += '2. **Code:** Revert this PR\n';
  rollback += '3. **Deploy:** Redeploy previous version\n';
  
  if (card.interfaces && card.interfaces.length > 0) {
    rollback += '4. **API:** Ensure clients are compatible with previous API version\n';
  }
  
  return rollback;
}

/**
 * Generate migration steps for data model changes
 */
function generateMigrationSteps(card: DesignCard): string[] {
  const steps: string[] = [];
  
  if (!card.dataModel) return steps;
  
  for (const entity of card.dataModel.entities) {
    if (entity.addFields) {
      steps.push(`Add fields to ${entity.name}: ${entity.addFields.map(f => f.name).join(', ')}`);
      steps.push(`Run migration to add columns (nullable initially)`);
      steps.push(`Backfill data if needed`);
      steps.push(`Add NOT NULL constraint if required`);
    }
    
    if (entity.removeFields) {
      steps.push(`Mark ${entity.removeFields.join(', ')} as deprecated in ${entity.name}`);
      steps.push(`Deploy code that stops writing to deprecated fields`);
      steps.push(`Wait for old code to drain`);
      steps.push(`Run migration to drop columns`);
    }
    
    if (entity.modifyFields) {
      steps.push(`Modify fields in ${entity.name}: ${entity.modifyFields.map(f => f.name).join(', ')}`);
      steps.push(`Use expand/contract pattern for breaking changes`);
    }
  }
  
  return steps;
}

/**
 * Generate Mermaid diagrams for interface changes
 */
function generateDiagrams(card: DesignCard): string[] {
  const diagrams: string[] = [];
  
  if (!card.interfaces || card.interfaces.length === 0) return diagrams;
  
  // Generate sequence diagram for HTTP endpoints
  const httpEndpoints = card.interfaces.filter(i => i.style === 'http');
  if (httpEndpoints.length > 0) {
    let diagram = '```mermaid\nsequenceDiagram\n';
    diagram += '    participant Client\n';
    diagram += '    participant API\n';
    diagram += '    participant DB\n\n';
    
    for (const endpoint of httpEndpoints) {
      const method = endpoint.method || 'GET';
      const path = endpoint.path || '/';
      diagram += `    Client->>API: ${method} ${path}\n`;
      diagram += `    API->>DB: Query/Update\n`;
      diagram += `    DB-->>API: Result\n`;
      diagram += `    API-->>Client: ${endpoint.response || 'Response'}\n`;
    }
    
    diagram += '```';
    diagrams.push(diagram);
  }
  
  return diagrams;
}

/**
 * Generate risk heatmap
 */
export function generateRiskHeatmap(
  changedFiles: string[],
  risks: string[]
): string {
  let heatmap = '## 🔥 Risk Heatmap\n\n';
  
  // Categorize files by risk level
  const highRisk = changedFiles.filter(f => 
    /\/(api|schema|migration|auth|payment)\//.test(f)
  );
  const mediumRisk = changedFiles.filter(f => 
    /\/(service|controller|model)\//.test(f) && !highRisk.includes(f)
  );
  const lowRisk = changedFiles.filter(f => 
    !highRisk.includes(f) && !mediumRisk.includes(f)
  );
  
  if (highRisk.length > 0) {
    heatmap += '**🔴 High Risk:**\n';
    heatmap += highRisk.map(f => `- ${f}`).join('\n') + '\n\n';
  }
  
  if (mediumRisk.length > 0) {
    heatmap += '**🟡 Medium Risk:**\n';
    heatmap += mediumRisk.map(f => `- ${f}`).join('\n') + '\n\n';
  }
  
  if (lowRisk.length > 0) {
    heatmap += '**🟢 Low Risk:**\n';
    heatmap += lowRisk.map(f => `- ${f}`).join('\n') + '\n\n';
  }
  
  if (risks.length > 0) {
    heatmap += '**Known Risks:**\n';
    heatmap += risks.map(r => `- ${r}`).join('\n') + '\n';
  }
  
  return heatmap;
}

