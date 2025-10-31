/*
  db-migration-safety.ts – Database Migration Safety (Expand/Contract)
  --------------------------------------------------------------------
  Enforce expand→backfill→contract pattern for schema changes.
  
  Safe migration pattern:
  1. EXPAND: Add new column (nullable)
  2. BACKFILL: Populate data
  3. CONTRACT: Make NOT NULL, drop old column
  
  Blocks destructive operations unless flagged.
*/

import type { DesignCard } from './design-card.js';

export type MigrationPlan = {
  phases: MigrationPhase[];
  risks: string[];
  rollbackSteps: string[];
  estimatedDowntime: string;
};

export type MigrationPhase = {
  name: string;
  operations: MigrationOperation[];
  canRollback: boolean;
  requiresDowntime: boolean;
};

export type MigrationOperation = {
  type: 'add-column' | 'remove-column' | 'rename-column' | 'change-type' | 'add-index' | 'remove-index';
  table: string;
  column?: string;
  details: Record<string, any>;
  destructive: boolean;
};

export type SafetyCheck = {
  passed: boolean;
  violations: string[];
  warnings: string[];
};

/**
 * Generate safe migration plan from Design Card
 */
export function generateMigrationPlan(card: DesignCard): MigrationPlan {
  const phases: MigrationPhase[] = [];
  const risks: string[] = [];
  const rollbackSteps: string[] = [];
  
  if (!card.dataModel) {
    return {
      phases: [],
      risks: [],
      rollbackSteps: [],
      estimatedDowntime: '0 minutes',
    };
  }
  
  for (const entity of card.dataModel.entities) {
    // Handle ADD fields (expand/contract pattern)
    if (entity.addFields && entity.addFields.length > 0) {
      // Phase 1: EXPAND - Add columns (nullable)
      const expandOps: MigrationOperation[] = entity.addFields.map(field => ({
        type: 'add-column',
        table: entity.name,
        column: field.name,
        details: {
          type: field.type,
          nullable: true, // Always nullable initially
          index: field.index,
        },
        destructive: false,
      }));
      
      phases.push({
        name: `Expand: Add columns to ${entity.name}`,
        operations: expandOps,
        canRollback: true,
        requiresDowntime: false,
      });
      
      // Phase 2: BACKFILL (if needed)
      const needsBackfill = entity.addFields.some(f => !f.nullable);
      if (needsBackfill) {
        phases.push({
          name: `Backfill: Populate ${entity.name} columns`,
          operations: [],
          canRollback: false,
          requiresDowntime: false,
        });
        
        risks.push(`Backfill may take time on large ${entity.name} table`);
      }
      
      // Phase 3: CONTRACT - Make NOT NULL (if needed)
      const contractOps: MigrationOperation[] = entity.addFields
        .filter(f => !f.nullable)
        .map(field => ({
          type: 'change-type',
          table: entity.name,
          column: field.name,
          details: {
            from: `${field.type} NULL`,
            to: `${field.type} NOT NULL`,
          },
          destructive: false,
        }));
      
      if (contractOps.length > 0) {
        phases.push({
          name: `Contract: Make ${entity.name} columns NOT NULL`,
          operations: contractOps,
          canRollback: false,
          requiresDowntime: false,
        });
      }
    }
    
    // Handle REMOVE fields (expand/contract pattern)
    if (entity.removeFields && entity.removeFields.length > 0) {
      // Phase 1: EXPAND - Mark as deprecated (no DB change)
      phases.push({
        name: `Expand: Mark ${entity.name} columns as deprecated`,
        operations: [],
        canRollback: true,
        requiresDowntime: false,
      });
      
      risks.push(`Ensure no code writes to deprecated columns: ${entity.removeFields.join(', ')}`);
      
      // Phase 2: Wait for old code to drain
      phases.push({
        name: `Wait: Drain old code for ${entity.name}`,
        operations: [],
        canRollback: false,
        requiresDowntime: false,
      });
      
      // Phase 3: CONTRACT - Drop columns
      const contractOps: MigrationOperation[] = entity.removeFields.map(field => ({
        type: 'remove-column',
        table: entity.name,
        column: field,
        details: {},
        destructive: true,
      }));
      
      phases.push({
        name: `Contract: Drop ${entity.name} columns`,
        operations: contractOps,
        canRollback: false,
        requiresDowntime: false,
      });
      
      rollbackSteps.push(`Re-add columns: ${entity.removeFields.join(', ')}`);
    }
    
    // Handle MODIFY fields
    if (entity.modifyFields && entity.modifyFields.length > 0) {
      for (const mod of entity.modifyFields) {
        // Rename is expand/contract
        if (mod.changes.newName) {
          phases.push({
            name: `Expand: Add ${mod.changes.newName} to ${entity.name}`,
            operations: [{
              type: 'add-column',
              table: entity.name,
              column: mod.changes.newName,
              details: { copyFrom: mod.name },
              destructive: false,
            }],
            canRollback: true,
            requiresDowntime: false,
          });
          
          phases.push({
            name: `Backfill: Copy ${mod.name} to ${mod.changes.newName}`,
            operations: [],
            canRollback: false,
            requiresDowntime: false,
          });
          
          phases.push({
            name: `Contract: Drop ${mod.name} from ${entity.name}`,
            operations: [{
              type: 'remove-column',
              table: entity.name,
              column: mod.name,
              details: {},
              destructive: true,
            }],
            canRollback: false,
            requiresDowntime: false,
          });
        }
        
        // Type change is risky
        if (mod.changes.type) {
          risks.push(`Type change for ${entity.name}.${mod.name} may require data conversion`);
        }
      }
    }
  }
  
  // Estimate downtime
  const requiresDowntime = phases.some(p => p.requiresDowntime);
  const estimatedDowntime = requiresDowntime ? '5-10 minutes' : '0 minutes';
  
  return {
    phases,
    risks,
    rollbackSteps,
    estimatedDowntime,
  };
}

/**
 * Check migration safety
 */
export function checkMigrationSafety(plan: MigrationPlan): SafetyCheck {
  const violations: string[] = [];
  const warnings: string[] = [];
  
  // Check for destructive operations without proper expand/contract
  for (const phase of plan.phases) {
    for (const op of phase.operations) {
      if (op.destructive && !phase.name.includes('Contract')) {
        violations.push(`Destructive operation ${op.type} on ${op.table}.${op.column} not in Contract phase`);
      }
    }
  }
  
  // Check for missing backfill
  const hasAddColumn = plan.phases.some(p => 
    p.operations.some(op => op.type === 'add-column' && !op.details.nullable)
  );
  const hasBackfill = plan.phases.some(p => p.name.includes('Backfill'));
  
  if (hasAddColumn && !hasBackfill) {
    warnings.push('Adding NOT NULL column without backfill phase');
  }
  
  // Check for missing wait phase before dropping columns
  const hasRemoveColumn = plan.phases.some(p => 
    p.operations.some(op => op.type === 'remove-column')
  );
  const hasWait = plan.phases.some(p => p.name.includes('Wait'));
  
  if (hasRemoveColumn && !hasWait) {
    warnings.push('Dropping columns without wait phase for code drain');
  }
  
  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}

/**
 * Generate migration SQL (Prisma example)
 */
export function generateMigrationSQL(plan: MigrationPlan, dialect: 'postgres' | 'mysql' = 'postgres'): string[] {
  const sqls: string[] = [];
  
  for (const phase of plan.phases) {
    sqls.push(`-- ${phase.name}`);
    
    for (const op of phase.operations) {
      switch (op.type) {
        case 'add-column':
          const nullable = op.details.nullable ? 'NULL' : 'NOT NULL';
          sqls.push(`ALTER TABLE ${op.table} ADD COLUMN ${op.column} ${op.details.type} ${nullable};`);
          if (op.details.index) {
            sqls.push(`CREATE INDEX idx_${op.table}_${op.column} ON ${op.table}(${op.column});`);
          }
          break;
          
        case 'remove-column':
          sqls.push(`ALTER TABLE ${op.table} DROP COLUMN ${op.column};`);
          break;
          
        case 'rename-column':
          if (dialect === 'postgres') {
            sqls.push(`ALTER TABLE ${op.table} RENAME COLUMN ${op.column} TO ${op.details.newName};`);
          } else {
            sqls.push(`ALTER TABLE ${op.table} CHANGE ${op.column} ${op.details.newName} ${op.details.type};`);
          }
          break;
          
        case 'change-type':
          if (dialect === 'postgres') {
            sqls.push(`ALTER TABLE ${op.table} ALTER COLUMN ${op.column} TYPE ${op.details.to};`);
          } else {
            sqls.push(`ALTER TABLE ${op.table} MODIFY COLUMN ${op.column} ${op.details.to};`);
          }
          break;
          
        case 'add-index':
          sqls.push(`CREATE INDEX ${op.details.name} ON ${op.table}(${op.column});`);
          break;
          
        case 'remove-index':
          sqls.push(`DROP INDEX ${op.details.name};`);
          break;
      }
    }
    
    sqls.push('');
  }
  
  return sqls;
}

/**
 * Render migration plan as markdown
 */
export function renderMigrationPlan(plan: MigrationPlan): string {
  let md = '# Migration Plan\n\n';
  
  md += `**Estimated Downtime:** ${plan.estimatedDowntime}\n\n`;
  
  if (plan.risks.length > 0) {
    md += '## ⚠️ Risks\n\n';
    md += plan.risks.map(r => `- ${r}`).join('\n') + '\n\n';
  }
  
  md += '## Phases\n\n';
  for (let i = 0; i < plan.phases.length; i++) {
    const phase = plan.phases[i];
    md += `### Phase ${i + 1}: ${phase.name}\n\n`;
    md += `- **Can Rollback:** ${phase.canRollback ? 'Yes' : 'No'}\n`;
    md += `- **Requires Downtime:** ${phase.requiresDowntime ? 'Yes' : 'No'}\n\n`;
    
    if (phase.operations.length > 0) {
      md += '**Operations:**\n';
      for (const op of phase.operations) {
        md += `- ${op.type} on ${op.table}.${op.column || ''}\n`;
      }
      md += '\n';
    }
  }
  
  if (plan.rollbackSteps.length > 0) {
    md += '## 🔙 Rollback Steps\n\n';
    md += plan.rollbackSteps.map((s, i) => `${i + 1}. ${s}`).join('\n') + '\n';
  }
  
  return md;
}

