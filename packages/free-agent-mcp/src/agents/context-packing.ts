/*
  context-packing.ts – Context Packing with Inline Citations
  ----------------------------------------------------------
  Add inline anchors to examples for citation tracking.
  The Fixer must reference them in conventions_used.

  Features:
  - Inject anchors into code examples
  - Truncate by token budget
  - Track citations for audit trail
*/

export type CodeExample = {
  id: string;
  file: string;
  startLine: number;
  endLine: number;
  content: string;
  description?: string;
};

export type CitedExample = CodeExample & {
  anchor: string;
  citedContent: string;
};

export type ContextPack = {
  examples: CitedExample[];
  totalTokens: number;
  truncated: boolean;
};

/**
 * Pack context with inline citations
 */
export function packContext(
  examples: CodeExample[],
  opts: {
    maxTokens?: number;
    anchorPrefix?: string;
  } = {}
): ContextPack {
  const maxTokens = opts.maxTokens || 8000;
  const anchorPrefix = opts.anchorPrefix || 'EX';
  
  const cited: CitedExample[] = [];
  let totalTokens = 0;
  let truncated = false;
  
  for (let i = 0; i < examples.length; i++) {
    const example = examples[i];
    const anchor = `⟦${anchorPrefix}${i + 1}:${example.file}:${example.startLine}⟧`;
    
    // Inject anchor at the start of the content
    const citedContent = `/* ${anchor} */\n${example.content}`;
    
    // Estimate tokens (rough: 1 token ≈ 4 chars)
    const tokens = Math.ceil(citedContent.length / 4);
    
    if (totalTokens + tokens > maxTokens) {
      truncated = true;
      break;
    }
    
    cited.push({
      ...example,
      anchor,
      citedContent,
    });
    
    totalTokens += tokens;
  }
  
  return {
    examples: cited,
    totalTokens,
    truncated,
  };
}

/**
 * Extract citations from conventions_used
 */
export function extractCitations(
  conventionsUsed: Array<{ new: string; mirrors: string[] }>
): {
  cited: string[];
  uncited: string[];
} {
  const cited: string[] = [];
  const uncited: string[] = [];
  
  for (const conv of conventionsUsed) {
    if (conv.mirrors.some(m => m.includes('⟦'))) {
      cited.push(conv.new);
    } else {
      uncited.push(conv.new);
    }
  }
  
  return { cited, uncited };
}

/**
 * Validate that Fixer referenced examples
 */
export function validateCitations(
  conventionsUsed: Array<{ new: string; mirrors: string[] }>,
  examples: CitedExample[]
): {
  valid: boolean;
  missingCitations: string[];
  invalidCitations: string[];
} {
  const validAnchors = new Set(examples.map(e => e.anchor));
  const missingCitations: string[] = [];
  const invalidCitations: string[] = [];
  
  for (const conv of conventionsUsed) {
    let hasCitation = false;
    
    for (const mirror of conv.mirrors) {
      const anchorMatch = mirror.match(/⟦([^⟧]+)⟧/);
      if (anchorMatch) {
        hasCitation = true;
        const anchor = `⟦${anchorMatch[1]}⟧`;
        if (!validAnchors.has(anchor)) {
          invalidCitations.push(anchor);
        }
      }
    }
    
    if (!hasCitation) {
      missingCitations.push(conv.new);
    }
  }
  
  return {
    valid: missingCitations.length === 0 && invalidCitations.length === 0,
    missingCitations,
    invalidCitations,
  };
}

/**
 * Render context pack as prompt text
 */
export function renderContextPack(pack: ContextPack): string {
  let text = '# Code Examples\n\n';
  text += 'Use these examples as reference. When you use a pattern from an example, ';
  text += 'reference it in conventions_used with the anchor (e.g., ⟦EX1:src/foo.ts:42⟧).\n\n';
  
  for (const example of pack.examples) {
    text += `## ${example.id}\n`;
    if (example.description) {
      text += `${example.description}\n\n`;
    }
    text += '```\n';
    text += example.citedContent;
    text += '\n```\n\n';
  }
  
  if (pack.truncated) {
    text += '\n_Note: Context truncated to fit token budget_\n';
  }
  
  return text;
}

/**
 * Create code example from file
 */
export function createExample(
  id: string,
  file: string,
  content: string,
  opts: {
    startLine?: number;
    endLine?: number;
    description?: string;
  } = {}
): CodeExample {
  return {
    id,
    file,
    startLine: opts.startLine || 1,
    endLine: opts.endLine || content.split('\n').length,
    content,
    description: opts.description,
  };
}

/**
 * Extract examples from neighbor files
 */
export function extractExamplesFromNeighbors(
  neighbors: Array<{ file: string; content: string }>,
  opts: {
    maxExamplesPerFile?: number;
    targetSymbols?: string[];
  } = {}
): CodeExample[] {
  const maxExamplesPerFile = opts.maxExamplesPerFile || 3;
  const examples: CodeExample[] = [];
  
  for (const neighbor of neighbors) {
    // Extract functions/classes from the file
    const extracted = extractCodeBlocks(neighbor.content, opts.targetSymbols);
    
    for (let i = 0; i < Math.min(extracted.length, maxExamplesPerFile); i++) {
      const block = extracted[i];
      examples.push(createExample(
        `${neighbor.file}:${block.name}`,
        neighbor.file,
        block.content,
        {
          startLine: block.startLine,
          endLine: block.endLine,
          description: `Example: ${block.name} from ${neighbor.file}`,
        }
      ));
    }
  }
  
  return examples;
}

/**
 * Extract code blocks (functions, classes) from content
 */
function extractCodeBlocks(
  content: string,
  targetSymbols?: string[]
): Array<{ name: string; content: string; startLine: number; endLine: number }> {
  const blocks: Array<{ name: string; content: string; startLine: number; endLine: number }> = [];
  const lines = content.split('\n');
  
  // Simple regex-based extraction (works for TS/JS/Python)
  const functionRegex = /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/;
  const classRegex = /^(?:export\s+)?class\s+(\w+)/;
  const constRegex = /^(?:export\s+)?const\s+(\w+)\s*=/;
  
  let currentBlock: { name: string; startLine: number; lines: string[] } | null = null;
  let braceDepth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is the start of a block
    const funcMatch = line.match(functionRegex);
    const classMatch = line.match(classRegex);
    const constMatch = line.match(constRegex);
    
    if (funcMatch || classMatch || constMatch) {
      const name = (funcMatch || classMatch || constMatch)![1];
      
      // Skip if not in target symbols (if specified)
      if (targetSymbols && !targetSymbols.includes(name)) {
        continue;
      }
      
      currentBlock = {
        name,
        startLine: i + 1,
        lines: [line],
      };
      
      braceDepth = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      continue;
    }
    
    // If we're in a block, collect lines
    if (currentBlock) {
      currentBlock.lines.push(line);
      braceDepth += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
      
      // End of block
      if (braceDepth === 0) {
        blocks.push({
          name: currentBlock.name,
          content: currentBlock.lines.join('\n'),
          startLine: currentBlock.startLine,
          endLine: i + 1,
        });
        currentBlock = null;
      }
    }
  }
  
  return blocks;
}

/**
 * Prioritize examples by relevance
 */
export function prioritizeExamples(
  examples: CodeExample[],
  targetSymbols: string[]
): CodeExample[] {
  // Score each example by how many target symbols it contains
  const scored = examples.map(ex => {
    let score = 0;
    for (const sym of targetSymbols) {
      if (ex.content.includes(sym)) {
        score++;
      }
    }
    return { example: ex, score };
  });
  
  // Sort by score (descending)
  scored.sort((a, b) => b.score - a.score);
  
  return scored.map(s => s.example);
}

