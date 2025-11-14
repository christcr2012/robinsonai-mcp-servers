/**
 * Simple Delegate Tools for Paid Agent
 *
 * These tools delegate simple tasks to FREE Ollama models for cost optimization.
 * Unlike Free Agent's complex pipeline, these are lightweight wrappers around the LLM router.
 */

import { createLlmRouter, type LlmRouter } from '../shared/shared-llm/index.js';

export interface DelegateCodeGenerationRequest {
  task: string;
  context: string;
  template?: string;
  model?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  quality?: string;
}

export interface DelegateCodeAnalysisRequest {
  code?: string;
  files?: string[];
  question: string;
  model?: string;
}

export interface DelegateCodeRefactoringRequest {
  code: string;
  instructions: string;
  style?: 'functional' | 'oop' | 'minimal' | 'verbose';
  model?: string;
}

export interface DelegateTestGenerationRequest {
  code: string;
  framework: string;
  coverage?: 'basic' | 'comprehensive' | 'edge-cases';
  model?: string;
}

export interface DelegateDocumentationRequest {
  code: string;
  style?: 'jsdoc' | 'tsdoc' | 'markdown' | 'readme';
  detail?: 'brief' | 'detailed' | 'comprehensive';
}

export interface DelegateResult {
  result: string;
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
}

export class SimpleDelegates {
  private router: LlmRouter;

  constructor() {
    this.router = createLlmRouter();
  }

  async delegateCodeGeneration(request: DelegateCodeGenerationRequest): Promise<DelegateResult> {
    const startTime = Date.now();

    const prompt = `Generate code for the following task:

TASK: ${request.task}

CONTEXT: ${request.context}

${request.template ? `TEMPLATE: ${request.template}` : ''}

Requirements:
- Write clean, production-ready code
- Follow best practices
- Include error handling
- Add comments for complex logic

Generate the code:`;

    const result = await this.router.generate({
      provider: 'ollama', // Always use FREE Ollama for delegates
      model: request.model || 'qwen2.5-coder:7b',
      prompt,
      temperature: 0.7,
      maxTokens: 4096,
    });

    return {
      result: result.text,
      model: result.model,
      tokens: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
        total: result.usage?.totalTokens || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Ollama local model',
      },
      timeMs: Date.now() - startTime,
    };
  }

  async delegateCodeAnalysis(request: DelegateCodeAnalysisRequest): Promise<DelegateResult> {
    const startTime = Date.now();

    const codeToAnalyze = request.code || (request.files ? request.files.join('\n\n') : '');

    const prompt = `Analyze the following code and answer this question: ${request.question}

CODE:
${codeToAnalyze}

Provide a detailed analysis including:
- Issues found (if any)
- Performance concerns
- Security vulnerabilities
- Best practice violations
- Suggestions for improvement

Analysis:`;

    const result = await this.router.generate({
      provider: 'ollama',
      model: request.model || 'qwen2.5-coder:7b',
      prompt,
      temperature: 0.3, // Lower temp for analysis
      maxTokens: 4096,
    });

    return {
      result: result.text,
      model: result.model,
      tokens: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
        total: result.usage?.totalTokens || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Ollama local model',
      },
      timeMs: Date.now() - startTime,
    };
  }

  async delegateCodeRefactoring(request: DelegateCodeRefactoringRequest): Promise<DelegateResult> {
    const startTime = Date.now();

    const prompt = `Refactor the following code according to these instructions:

ORIGINAL CODE:
${request.code}

INSTRUCTIONS: ${request.instructions}

STYLE: ${request.style || 'balanced'}

Requirements:
- Maintain all existing functionality
- Improve code structure and readability
- Apply best practices
- Add comments for complex changes

Refactored code:`;

    const result = await this.router.generate({
      provider: 'ollama',
      model: request.model || 'qwen2.5-coder:7b',
      prompt,
      temperature: 0.5,
      maxTokens: 4096,
    });

    return {
      result: result.text,
      model: result.model,
      tokens: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
        total: result.usage?.totalTokens || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Ollama local model',
      },
      timeMs: Date.now() - startTime,
    };
  }

  async delegateTestGeneration(request: DelegateTestGenerationRequest): Promise<DelegateResult> {
    const startTime = Date.now();

    const prompt = `Generate ${request.coverage || 'comprehensive'} tests for the following code using ${request.framework}:

CODE TO TEST:
${request.code}

Requirements:
- Use ${request.framework} framework
- Cover ${request.coverage || 'comprehensive'} scenarios
- Include edge cases
- Add descriptive test names
- Follow testing best practices

Generated tests:`;

    const result = await this.router.generate({
      provider: 'ollama',
      model: request.model || 'qwen2.5-coder:7b',
      prompt,
      temperature: 0.6,
      maxTokens: 4096,
    });

    return {
      result: result.text,
      model: result.model,
      tokens: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
        total: result.usage?.totalTokens || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Ollama local model',
      },
      timeMs: Date.now() - startTime,
    };
  }

  async delegateDocumentation(request: DelegateDocumentationRequest): Promise<DelegateResult> {
    const startTime = Date.now();

    const prompt = `Generate ${request.detail || 'detailed'} documentation for the following code in ${request.style || 'markdown'} format:

CODE:
${request.code}

Requirements:
- Use ${request.style || 'markdown'} format
- ${request.detail || 'detailed'} level of detail
- Include parameter descriptions
- Add usage examples
- Document return values and exceptions

Generated documentation:`;

    const result = await this.router.generate({
      provider: 'ollama',
      model: 'qwen2.5-coder:7b',
      prompt,
      temperature: 0.4,
      maxTokens: 4096,
    });

    return {
      result: result.text,
      model: result.model,
      tokens: {
        input: result.usage?.promptTokens || 0,
        output: result.usage?.completionTokens || 0,
        total: result.usage?.totalTokens || 0,
      },
      cost: {
        total: 0,
        currency: 'USD',
        note: 'FREE - Ollama local model',
      },
      timeMs: Date.now() - startTime,
    };
  }
}
