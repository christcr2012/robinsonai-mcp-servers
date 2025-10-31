/*
  design-card.ts – Design Card parser and validator
  -------------------------------------------------
  Parses YAML/JSON Design Cards that specify task scope, acceptance criteria,
  and constraints for the Builder agent.

  Design Card format:
    name: "Task name"
    context: "Background/motivation"
    goals: ["Goal 1", "Goal 2"]
    nonGoals: ["What not to do"]
    acceptance: ["Acceptance criterion 1", "Acceptance criterion 2"]
    constraints: ["Constraint 1", "Constraint 2"]
    allowedPaths: ["src/features/**", "tests/**"]
    interfaces: [{ style: "http", method: "POST", path: "/api/...", ... }]
    dataModel: { entities: [{ name: "User", addFields: [...] }] }
    risks: ["Risk 1", "Risk 2"]
*/

import * as fs from 'fs';
import * as path from 'path';

export type DesignCard = {
  name: string;
  context?: string;
  goals: string[];
  nonGoals?: string[];
  acceptance: string[];
  constraints?: string[];
  allowedPaths?: string[];
  interfaces?: Array<{
    style: 'http' | 'grpc' | 'graphql';
    method?: string;
    path?: string;
    request?: string;
    response?: string;
    description?: string;
  }>;
  dataModel?: {
    entities: Array<{
      name: string;
      addFields?: Array<{ name: string; type: string; index?: boolean; nullable?: boolean }>;
      removeFields?: string[];
      modifyFields?: Array<{ name: string; changes: Record<string, any> }>;
    }>;
  };
  risks?: string[];
};

/**
 * Parse Design Card from YAML or JSON file
 */
export function parseDesignCard(filePath: string): DesignCard {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();
  
  let card: any;
  
  if (ext === '.json') {
    card = JSON.parse(content);
  } else if (ext === '.yaml' || ext === '.yml') {
    // Simple YAML parser (no external deps)
    card = parseSimpleYAML(content);
  } else {
    throw new Error(`Unsupported Design Card format: ${ext}. Use .json, .yaml, or .yml`);
  }
  
  return validateDesignCard(card);
}

/**
 * Simple YAML parser (handles basic key-value, lists, nested objects)
 * For production, consider using a proper YAML library
 */
function parseSimpleYAML(content: string): any {
  const lines = content.split('\n');
  const result: any = {};
  const stack: Array<{ obj: any; indent: number }> = [{ obj: result, indent: -1 }];
  
  for (let line of lines) {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) continue;
    
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    
    // Pop stack to correct level
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    
    const current = stack[stack.length - 1].obj;
    
    // List item
    if (trimmed.startsWith('- ')) {
      const value = trimmed.substring(2).trim();
      if (!Array.isArray(current)) {
        throw new Error('Invalid YAML: list item outside array context');
      }
      
      // Check if it's an object
      if (value.includes(':')) {
        const obj: any = {};
        const [key, val] = value.split(':').map(s => s.trim());
        obj[key] = parseValue(val);
        current.push(obj);
        stack.push({ obj, indent });
      } else {
        current.push(parseValue(value));
      }
    }
    // Key-value pair
    else if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      if (!value || value === '[]' || value === '{}') {
        // Empty array or object
        current[key] = value === '[]' ? [] : {};
        stack.push({ obj: current[key], indent });
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array
        current[key] = JSON.parse(value);
      } else if (value.startsWith('{') && value.endsWith('}')) {
        // Inline object
        current[key] = JSON.parse(value);
      } else {
        current[key] = parseValue(value);
      }
    }
  }
  
  return result;
}

function parseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.substring(1, value.length - 1);
  }
  return value;
}

/**
 * Validate Design Card structure
 */
export function validateDesignCard(card: any): DesignCard {
  const errors: string[] = [];
  
  if (!card.name || typeof card.name !== 'string') {
    errors.push('Missing or invalid "name" field (required string)');
  }
  
  if (!Array.isArray(card.goals) || card.goals.length === 0) {
    errors.push('Missing or empty "goals" field (required non-empty array)');
  }
  
  if (!Array.isArray(card.acceptance) || card.acceptance.length === 0) {
    errors.push('Missing or empty "acceptance" field (required non-empty array)');
  }
  
  if (card.nonGoals && !Array.isArray(card.nonGoals)) {
    errors.push('Invalid "nonGoals" field (must be array)');
  }
  
  if (card.constraints && !Array.isArray(card.constraints)) {
    errors.push('Invalid "constraints" field (must be array)');
  }
  
  if (card.allowedPaths && !Array.isArray(card.allowedPaths)) {
    errors.push('Invalid "allowedPaths" field (must be array)');
  }
  
  if (card.interfaces && !Array.isArray(card.interfaces)) {
    errors.push('Invalid "interfaces" field (must be array)');
  }
  
  if (card.risks && !Array.isArray(card.risks)) {
    errors.push('Invalid "risks" field (must be array)');
  }
  
  if (errors.length > 0) {
    throw new Error(`Invalid Design Card:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
  
  return card as DesignCard;
}

/**
 * Convert Design Card to task specification for Coder
 */
export function designCardToTaskSpec(card: DesignCard, brief: any): string {
  let spec = `# ${card.name}\n\n`;
  
  if (card.context) {
    spec += `## Context\n${card.context}\n\n`;
  }
  
  spec += `## Goals\n${card.goals.map(g => `- ${g}`).join('\n')}\n\n`;
  
  if (card.nonGoals && card.nonGoals.length > 0) {
    spec += `## Non-Goals\n${card.nonGoals.map(g => `- ${g}`).join('\n')}\n\n`;
  }
  
  spec += `## Acceptance Criteria\n${card.acceptance.map(a => `- ${a}`).join('\n')}\n\n`;
  
  if (card.constraints && card.constraints.length > 0) {
    spec += `## Constraints\n${card.constraints.map(c => `- ${c}`).join('\n')}\n\n`;
  }
  
  if (card.allowedPaths && card.allowedPaths.length > 0) {
    spec += `## Allowed Paths\nOnly modify files matching:\n${card.allowedPaths.map(p => `- ${p}`).join('\n')}\n\n`;
  }
  
  if (card.interfaces && card.interfaces.length > 0) {
    spec += `## Interfaces\n`;
    for (const iface of card.interfaces) {
      spec += `- ${iface.style.toUpperCase()}: ${iface.method || ''} ${iface.path || ''}\n`;
      if (iface.request) spec += `  Request: ${iface.request}\n`;
      if (iface.response) spec += `  Response: ${iface.response}\n`;
      if (iface.description) spec += `  ${iface.description}\n`;
    }
    spec += '\n';
  }
  
  if (card.dataModel && card.dataModel.entities.length > 0) {
    spec += `## Data Model Changes\n`;
    for (const entity of card.dataModel.entities) {
      spec += `- Entity: ${entity.name}\n`;
      if (entity.addFields) {
        spec += `  Add fields:\n`;
        for (const field of entity.addFields) {
          spec += `    - ${field.name}: ${field.type}`;
          if (field.index) spec += ' (indexed)';
          if (field.nullable) spec += ' (nullable)';
          spec += '\n';
        }
      }
      if (entity.removeFields) {
        spec += `  Remove fields: ${entity.removeFields.join(', ')}\n`;
      }
      if (entity.modifyFields) {
        spec += `  Modify fields:\n`;
        for (const mod of entity.modifyFields) {
          spec += `    - ${mod.name}: ${JSON.stringify(mod.changes)}\n`;
        }
      }
    }
    spec += '\n';
  }
  
  if (card.risks && card.risks.length > 0) {
    spec += `## Risks\n${card.risks.map(r => `- ${r}`).join('\n')}\n\n`;
  }
  
  // Append naming conventions from brief
  if (brief.naming) {
    spec += `## Naming Conventions (from repo)\n`;
    spec += `- Variables: ${brief.naming.var}\n`;
    spec += `- Types: ${brief.naming.type}\n`;
    spec += `- Constants: ${brief.naming.const}\n\n`;
  }
  
  // Append glossary
  if (brief.glossary && brief.glossary.length > 0) {
    spec += `## Common Terms (use these)\n${brief.glossary.slice(0, 20).join(', ')}\n\n`;
  }
  
  return spec;
}

/**
 * Find Design Card file by slug
 */
export function findDesignCard(slug: string, root = process.cwd()): string {
  const candidates = [
    path.join(root, '.agent', 'tasks', `${slug}.yaml`),
    path.join(root, '.agent', 'tasks', `${slug}.yml`),
    path.join(root, '.agent', 'tasks', `${slug}.json`),
  ];
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  
  throw new Error(`Design Card not found: ${slug}\nSearched:\n${candidates.map(c => `  - ${c}`).join('\n')}`);
}

