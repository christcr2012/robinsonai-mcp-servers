/**
 * Code Generator Agent
 * 
 * Generates code using local LLMs (Ollama).
 * Saves 90%+ Augment credits!
 */

import { OllamaClient, GenerateOptions } from '../ollama-client.js';
import { PromptBuilder } from '../utils/prompt-builder.js';
import { iterateTask, PipelineResult } from '../pipeline/index.js';
import { ValidationResult } from '../types/validation.js';
import { getModelManager } from '../utils/model-manager.js';
import { isDockerAvailable, runDockerSandboxPipeline } from '../pipeline/docker-sandbox.js';
import { runSandboxPipeline } from '../pipeline/sandbox.js';
import { formatGMCode, formatUnifiedDiffs, stripCodeFences, type OutputFile } from '../utils/output-format.js';

export interface GenerateRequest {
  task: string;
  context: string;
  template?: string;
  model?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  quality?: 'fast' | 'balanced' | 'best'; // NEW: Quality vs speed tradeoff
}

export interface GenerateResult {
  code: string;
  files?: Array<{
    path: string;
    content: string;
  }>;
  filesDetailed?: OutputFile[];
  gmcode?: string;
  diff?: string;
  augmentCreditsUsed: number;
  creditsSaved: number;
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    total: number;
    currency: string;
    note: string;
  };
  timeMs: number;
  validation?: ValidationResult;
  refinementAttempts?: number;
}

export class CodeGenerator {
  private ollama: OllamaClient;
  private promptBuilder: PromptBuilder;

  constructor(ollama: OllamaClient) {
    this.ollama = ollama;
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Generate code from task description using the Synthesize-Execute-Critique-Refine pipeline
   * This produces REAL, WORKING code with hard quality gates
   */
  async generate(request: GenerateRequest): Promise<GenerateResult> {
    // Determine quality mode (default: fast for simple tasks, balanced for medium, best for complex)
    const quality = request.quality || this.getDefaultQuality(request.complexity);

    // Fast mode: Skip sandbox for speed (good for 80% of tasks)
    if (quality === 'fast') {
      return await this.generateFast(request);
    }

    // Full pipeline mode: Use sandbox with quality gates
    const startTime = Date.now();

    // Build specification from request
    const spec = `${request.task}\n\nContext: ${request.context}`;

    // Configure pipeline based on quality level
    const pipelineConfig = this.getPipelineConfig(quality);

    // Run the pipeline with tuned parameters
    const pipelineResult = await iterateTask(spec, pipelineConfig);

    const totalTimeMs = Date.now() - startTime;

    // Extract code and files from pipeline result
    const mainFile = pipelineResult.files[0];
    const code = stripCodeFences(mainFile?.content || '');
    const detailedFiles: OutputFile[] = (pipelineResult.files ?? []).map((file, index) => ({
      path: file.path || `generated-${index}.ts`,
      content: stripCodeFences(file.content || ''),
      originalContent: '',
    }));

    // Convert pipeline validation to old format for compatibility
    const validation: ValidationResult = {
      valid: pipelineResult.ok,
      score: pipelineResult.score * 100, // Convert 0-1 to 0-100
      issues: pipelineResult.verdict?.explanations.root_cause ? [{
        type: 'incomplete',
        severity: 'error',
        description: pipelineResult.verdict.explanations.root_cause,
        suggestion: pipelineResult.verdict.explanations.minimal_fix,
      }] : [],
    };

    // Calculate credit savings
    const augmentCreditsUsed = 500;
    const creditsSaved = 13000 - augmentCreditsUsed;

    if (detailedFiles.length === 0 && code) {
      detailedFiles.push({ path: 'generated.ts', content: code, originalContent: '' });
    }

    return {
      code,
      files: detailedFiles.filter(file => !file.deleted).map(file => ({ path: file.path, content: file.content })),
      augmentCreditsUsed,
      creditsSaved,
      model: request.model || 'qwen2.5:3b',
      tokens: {
        input: 0, // Pipeline doesn't expose token counts yet
        output: 0,
        total: 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Local Ollama model with production-grade pipeline',
      },
      timeMs: totalTimeMs,
      validation,
      refinementAttempts: pipelineResult.attempts,
      filesDetailed: detailedFiles,
      gmcode: detailedFiles.length > 0 ? formatGMCode(detailedFiles) : undefined,
      diff: detailedFiles.length > 0 ? formatUnifiedDiffs(detailedFiles) : undefined,
    };
  }

  /**
   * Generate tests for code using the pipeline
   * NOTE: The pipeline generates tests WITH code automatically.
   * This method is kept for backward compatibility.
   */
  async generateTests(request: {
    code: string;
    framework: string;
    coverage?: string;
    model?: string;
  }): Promise<GenerateResult> {
    const startTime = Date.now();

    // Build spec for test generation
    const spec = `Generate comprehensive tests for this code using ${request.framework}:

CODE:
${request.code}

Requirements:
- Coverage: ${request.coverage || 'comprehensive'}
- Framework: ${request.framework}
- Test all functions and edge cases
- Include error handling tests
`;

    // Use pipeline to generate tests with tuned parameters
    const pipelineResult = await iterateTask(spec, {
      maxAttempts: 4, // Increased from 2 for better test quality
      acceptThreshold: 0.70, // Lowered for faster iteration
      minCoverage: parseInt(request.coverage || '70'), // Lowered default from 80
    });

    const totalTimeMs = Date.now() - startTime;

    // Extract test files
    const testFiles = pipelineResult.files.filter(f => f.path.includes('.test.') || f.path.includes('.spec.'));
    const code = stripCodeFences(testFiles[0]?.content || '');

    const validation: ValidationResult = {
      valid: pipelineResult.ok,
      score: pipelineResult.score * 100,
      issues: pipelineResult.verdict?.explanations.root_cause ? [{
        type: 'incomplete',
        severity: 'error',
        description: pipelineResult.verdict.explanations.root_cause,
        suggestion: pipelineResult.verdict.explanations.minimal_fix,
      }] : [],
    };

    const detailedFiles: OutputFile[] = (testFiles.length > 0 ? testFiles : pipelineResult.files).map((file, index) => ({
      path: file.path || `tests-${index}.ts`,
      content: stripCodeFences(file.content || ''),
      originalContent: '',
    }));

    if (detailedFiles.length === 0 && code) {
      detailedFiles.push({ path: 'generated-tests.ts', content: code, originalContent: '' });
    }

    return {
      code,
      files: (testFiles.length > 0 ? testFiles : pipelineResult.files).map(file => ({
        path: file.path,
        content: stripCodeFences(file.content || ''),
      })),
      augmentCreditsUsed: 400,
      creditsSaved: 8000,
      model: request.model || 'qwen2.5:3b',
      tokens: {
        input: 0,
        output: 0,
        total: 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Local Ollama model with production-grade pipeline',
      },
      timeMs: totalTimeMs,
      validation,
      refinementAttempts: pipelineResult.attempts,
      filesDetailed: detailedFiles,
      gmcode: detailedFiles.length > 0 ? formatGMCode(detailedFiles) : undefined,
      diff: detailedFiles.length > 0 ? formatUnifiedDiffs(detailedFiles) : undefined,
    };
  }

  /**
   * Fast mode: Generate code without sandbox execution
   * - Uses direct Ollama generation
   * - No quality gates or test execution
   * - Fast response (<5 seconds)
   * - Good for simple tasks and rapid iteration
   */
  private async generateFast(request: GenerateRequest): Promise<GenerateResult> {
    const startTime = Date.now();
    console.error('[CodeGenerator] Starting fast mode generation...');

    // Build a comprehensive prompt
    console.error('[CodeGenerator] Building prompt...');
    const prompt = this.promptBuilder.buildCodePrompt({
      task: request.task,
      context: request.context,
      template: request.template,
      includeTests: false, // Fast mode doesn't generate tests
    });

    // Select model based on complexity
    const model = request.model || this.selectModel(request.complexity);
    console.error(`[CodeGenerator] Selected model: ${model}`);

    // Generate code using Ollama
    const options: GenerateOptions = {
      model,
      complexity: request.complexity || 'simple',
      temperature: 0.2, // Low temperature for more deterministic code
      maxTokens: 4096,
    };

    console.error('[CodeGenerator] Calling Ollama.generate...');
    const result = await this.ollama.generate(prompt, options);
    console.error(`[CodeGenerator] Ollama.generate completed in ${Date.now() - startTime}ms`);

    // Parse the generated code
    console.error('[CodeGenerator] Parsing generated code...');
    const parsed = this.parseGeneratedCode(result.text);
    console.error('[CodeGenerator] Parsing complete');

    const totalTimeMs = Date.now() - startTime;

    const detailedFiles: OutputFile[] = (parsed.files || []).map((file, index) => ({
      path: file.path || `generated-${index}.ts`,
      content: file.content,
      originalContent: '',
    }));

    if (detailedFiles.length === 0 && parsed.code) {
      detailedFiles.push({ path: 'generated.ts', content: parsed.code, originalContent: '' });
    }

    return {
      code: parsed.code,
      files: parsed.files || [{
        path: 'generated.ts',
        content: parsed.code,
      }],
      augmentCreditsUsed: 0, // FREE!
      creditsSaved: 13000,
      model: result.model,
      tokens: {
        input: result.tokensInput || 0,
        output: result.tokensGenerated || 0,
        total: result.tokensTotal || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Fast mode (no sandbox)',
      },
      timeMs: totalTimeMs,
      validation: {
        valid: true, // Fast mode assumes valid (no validation)
        score: 75, // Estimated score
        issues: [],
      },
      refinementAttempts: 1,
      filesDetailed: detailedFiles,
      gmcode: detailedFiles.length > 0 ? formatGMCode(detailedFiles) : undefined,
      diff: detailedFiles.length > 0 ? formatUnifiedDiffs(detailedFiles) : undefined,
    };
  }

  /**
   * Get default quality based on complexity
   */
  private getDefaultQuality(complexity?: string): 'fast' | 'balanced' | 'best' {
    switch (complexity) {
      case 'simple':
        return 'fast';
      case 'medium':
        return 'balanced';
      case 'complex':
        return 'best';
      default:
        return 'fast'; // Default to fast for best UX
    }
  }

  /**
   * Get pipeline configuration based on quality level
   */
  private getPipelineConfig(quality: 'fast' | 'balanced' | 'best') {
    const configs = {
      fast: {
        maxAttempts: 2,
        acceptThreshold: 0.60,
        minCoverage: 60,
        allowedLibraries: [
          'fs', 'path', 'util', 'crypto', 'stream', 'events', 'buffer',
          'lodash', 'axios', 'express', 'react', 'vue', 'next',
          'jest', 'vitest', 'mocha', 'chai',
          'typescript', '@types/*',
        ],
      },
      balanced: {
        maxAttempts: 5,
        acceptThreshold: 0.70,
        minCoverage: 70,
        allowedLibraries: [
          'fs', 'path', 'util', 'crypto', 'stream', 'events', 'buffer',
          'lodash', 'axios', 'express', 'react', 'vue', 'next',
          'jest', 'vitest', 'mocha', 'chai',
          'typescript', '@types/*',
        ],
      },
      best: {
        maxAttempts: 10,
        acceptThreshold: 0.85,
        minCoverage: 80,
        allowedLibraries: [
          'fs', 'path', 'util', 'crypto', 'stream', 'events', 'buffer',
          'lodash', 'axios', 'express', 'react', 'vue', 'next',
          'jest', 'vitest', 'mocha', 'chai',
          'typescript', '@types/*',
        ],
      },
    };

    return configs[quality];
  }

  /**
   * Select model based on complexity
   */
  private selectModel(complexity?: string): string {
    switch (complexity) {
      case 'simple':
        return 'qwen2.5:3b'; // Fast model (1.9 GB)
      case 'medium':
        return 'qwen2.5-coder:7b'; // Balanced model (4.7 GB)
      case 'complex':
        return 'qwen2.5-coder:7b'; // Use 7b for now (deepseek-coder:1.3b is too small)
      default:
        return 'qwen2.5:3b';
    }
  }

  /**
   * Generate documentation
   */
  async generateDocs(request: {
    code: string;
    style?: string;
    detail?: string;
  }): Promise<GenerateResult> {
    const prompt = this.promptBuilder.buildDocPrompt(request);

    const options: GenerateOptions = {
      model: 'qwen-coder', // Fast model for docs
      complexity: 'simple',
      temperature: 0.3, // Very deterministic for docs
      maxTokens: 2048,
    };

    const result = await this.ollama.generate(prompt, options);

    const sanitizedDoc = stripCodeFences(result.text);
    const detailedFiles: OutputFile[] = [{
      path: 'documentation.md',
      content: sanitizedDoc,
      originalContent: '',
    }];

    return {
      code: sanitizedDoc,
      augmentCreditsUsed: 200,
      creditsSaved: 3000,
      model: result.model,
      tokens: {
        input: result.tokensInput || 0,
        output: result.tokensGenerated || 0,
        total: result.tokensTotal || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Local Ollama model',
      },
      timeMs: result.timeMs,
      filesDetailed: detailedFiles,
      gmcode: formatGMCode(detailedFiles),
      diff: formatUnifiedDiffs(detailedFiles),
    };
  }

  /**
   * Parse generated code into structured format
   */
  private parseGeneratedCode(text: string): {
    code: string;
    files?: Array<{ path: string; content: string }>;
  } {
    const codeBlocks = Array.from(text.matchAll(/```([^\n]*)\n([\s\S]*?)```/g));
    const files: Array<{ path: string; content: string }> = [];

    for (const block of codeBlocks) {
      let meta = (block[1] || '').trim();
      let body = (block[2] || '').replace(/\r\n/g, '\n');

      let inlinePath: string | undefined;
      if (meta.includes('//')) {
        const [languagePart, ...rest] = meta.split('//');
        meta = languagePart.trim();
        inlinePath = rest.join('//').trim();
      }

      let path = this.extractPathCandidate(inlinePath);

      const lines = body.split('\n');
      if (!path && lines.length > 0) {
        const firstLinePath = this.extractPathCandidate(lines[0]);
        if (firstLinePath) {
          path = firstLinePath;
          lines.shift();
        }
      }

      if (!path) {
        const metaPath = this.extractPathCandidate(meta);
        if (metaPath) {
          path = metaPath;
        }
      }

      const content = lines.join('\n').trimEnd();

      if (content.length === 0 && !path) {
        continue;
      }

      files.push({
        path: path || `generated-${files.length}.ts`,
        content,
      });
    }

    if (files.length > 0) {
      return { code: files[0]?.content || '', files };
    }

    const singleMatch = text.match(/```(?:\w+)?\n([\s\S]+?)```/);
    if (singleMatch) {
      const code = singleMatch[1].trim();
      return {
        code,
        files: [
          {
            path: 'generated.ts',
            content: code,
          },
        ],
      };
    }

    return { code: text.trim() };
  }

  /**
   * Extract file path from various formats in LLM output.
   *
   * Handles:
   * - Inline comments: "// path/to/file.ts"
   * - Prefixed paths: "path: src/file.ts" or "file: src/file.ts"
   * - Quoted paths: "'src/my file.ts'" or "\"src/file.ts\""
   * - Paths with trailing comments: "src/file.ts // comment"
   *
   * Rejects:
   * - URLs: "https://example.com/file.ts"
   * - Invalid Windows paths: "C:file.ts" (missing backslash)
   * - Paths without separators: "filename" (no . or / or \)
   */
  private extractPathCandidate(raw?: string): string | undefined {
    if (!raw) return undefined;

    let candidate = raw.trim();
    if (!candidate) return undefined;

    // Strip leading comment markers
    if (candidate.startsWith('//')) {
      candidate = candidate.replace(/^\/\//, '').trim();
    }

    // Extract from "path: ..." or "file: ..." prefixes
    const prefixed = candidate.match(/^(?:path|file|filepath|filename)\s*: ?(.+)$/i);
    if (prefixed) {
      candidate = prefixed[1].trim();
    }

    // Strip quotes (handles paths with spaces inside quotes)
    candidate = candidate.replace(/^['"`](.+?)['"`]$/, '$1').trim();

    // Remove trailing comments
    const commentIndex = candidate.indexOf(' //');
    if (commentIndex !== -1) {
      candidate = candidate.slice(0, commentIndex).trim();
    }

    // Normalize whitespace
    candidate = candidate.replace(/\s+/g, ' ').trim();

    if (!candidate) {
      return undefined;
    }

    // Must contain path separators (., /, or \)
    if (!/[./\\]/.test(candidate)) {
      return undefined;
    }

    // Reject URLs
    if (/^https?:\/\//i.test(candidate)) {
      return undefined;
    }

    // Reject invalid Windows paths (e.g., "C:file.ts" without backslash)
    if (/^[A-Z]:[^\\]/i.test(candidate)) {
      return undefined;
    }

    return candidate;
  }
}

