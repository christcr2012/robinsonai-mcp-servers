/**
 * Mind Mapping Tool
 * Visual organization of ideas and concepts
 */

export interface MindMappingInput {
  centralIdea: string;
  context?: string;
}

export interface MindMappingOutput {
  centralNode: { id: string; label: string };
  branches: Array<{
    id: string;
    label: string;
    parentId: string;
    level: number;
    children: Array<{ id: string; label: string }>;
  }>;
  connections: Array<{ from: string; to: string; relationship: string }>;
  mermaidDiagram: string;
  confidence: number;
  reasoning: string;
}

export function mindMapping(input: MindMappingInput): MindMappingOutput {
  const { centralIdea, context = '' } = input;
  const combined = `${centralIdea} ${context}`.toLowerCase();
  
  const centralNode = { id: 'central', label: centralIdea };
  const branches: Array<{
    id: string;
    label: string;
    parentId: string;
    level: number;
    children: Array<{ id: string; label: string }>;
  }> = [];
  
  const connections: Array<{ from: string; to: string; relationship: string }> = [];
  
  let nodeId = 1;
  
  // Generate branches based on central idea
  if (combined.includes('api') || combined.includes('service')) {
    // Main branches
    branches.push({
      id: `node${nodeId++}`,
      label: 'Design',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'REST vs GraphQL' },
        { id: `node${nodeId++}`, label: 'Versioning Strategy' },
        { id: `node${nodeId++}`, label: 'Authentication' },
        { id: `node${nodeId++}`, label: 'Rate Limiting' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'Implementation',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Framework Choice' },
        { id: `node${nodeId++}`, label: 'Database Layer' },
        { id: `node${nodeId++}`, label: 'Caching Strategy' },
        { id: `node${nodeId++}`, label: 'Error Handling' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'Testing',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Unit Tests' },
        { id: `node${nodeId++}`, label: 'Integration Tests' },
        { id: `node${nodeId++}`, label: 'Load Testing' },
        { id: `node${nodeId++}`, label: 'Security Testing' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'Deployment',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'CI/CD Pipeline' },
        { id: `node${nodeId++}`, label: 'Monitoring' },
        { id: `node${nodeId++}`, label: 'Logging' },
        { id: `node${nodeId++}`, label: 'Scaling Strategy' }
      ]
    });
  } else if (combined.includes('product') || combined.includes('feature')) {
    branches.push({
      id: `node${nodeId++}`,
      label: 'User Needs',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Pain Points' },
        { id: `node${nodeId++}`, label: 'Use Cases' },
        { id: `node${nodeId++}`, label: 'User Personas' },
        { id: `node${nodeId++}`, label: 'Jobs to be Done' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'Solution',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Core Features' },
        { id: `node${nodeId++}`, label: 'Nice-to-Haves' },
        { id: `node${nodeId++}`, label: 'MVP Scope' },
        { id: `node${nodeId++}`, label: 'Future Roadmap' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'Market',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Target Audience' },
        { id: `node${nodeId++}`, label: 'Competitors' },
        { id: `node${nodeId++}`, label: 'Differentiation' },
        { id: `node${nodeId++}`, label: 'Pricing' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'Execution',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Timeline' },
        { id: `node${nodeId++}`, label: 'Resources' },
        { id: `node${nodeId++}`, label: 'Risks' },
        { id: `node${nodeId++}`, label: 'Success Metrics' }
      ]
    });
  } else {
    // Generic branches
    branches.push({
      id: `node${nodeId++}`,
      label: 'What',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Definition' },
        { id: `node${nodeId++}`, label: 'Components' },
        { id: `node${nodeId++}`, label: 'Scope' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'Why',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Purpose' },
        { id: `node${nodeId++}`, label: 'Benefits' },
        { id: `node${nodeId++}`, label: 'Value Proposition' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'How',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Approach' },
        { id: `node${nodeId++}`, label: 'Steps' },
        { id: `node${nodeId++}`, label: 'Tools' }
      ]
    });
    
    branches.push({
      id: `node${nodeId++}`,
      label: 'When',
      parentId: 'central',
      level: 1,
      children: [
        { id: `node${nodeId++}`, label: 'Timeline' },
        { id: `node${nodeId++}`, label: 'Milestones' },
        { id: `node${nodeId++}`, label: 'Dependencies' }
      ]
    });
  }
  
  // Add cross-connections
  if (branches.length >= 2) {
    connections.push({
      from: branches[0].id,
      to: branches[1].id,
      relationship: 'influences'
    });
  }
  
  if (branches.length >= 4) {
    connections.push({
      from: branches[2].id,
      to: branches[3].id,
      relationship: 'depends on'
    });
  }
  
  // Generate Mermaid diagram
  let mermaid = 'graph TD\n';
  mermaid += `  ${centralNode.id}["${centralNode.label}"]\n`;
  
  branches.forEach(branch => {
    mermaid += `  ${centralNode.id} --> ${branch.id}["${branch.label}"]\n`;
    branch.children.forEach(child => {
      mermaid += `  ${branch.id} --> ${child.id}["${child.label}"]\n`;
    });
  });
  
  connections.forEach(conn => {
    mermaid += `  ${conn.from} -.->|${conn.relationship}| ${conn.to}\n`;
  });
  
  const confidence = 70;
  
  return {
    centralNode,
    branches,
    connections,
    mermaidDiagram: mermaid,
    confidence,
    reasoning: `Created mind map with ${branches.length} main branches and ${branches.reduce((sum, b) => sum + b.children.length, 0)} sub-nodes, plus ${connections.length} cross-connections.`
  };
}

