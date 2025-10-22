/**
 * Code Refactor Agent
 * 
 * Refactors code using local LLMs (Ollama).
 * Extracts components, improves structure, applies patterns.
 */

import { OllamaClient, GenerateOptions } from '../ollama-client.js';
import { PromptBuilder } from '../utils/prompt-builder.js';

export interface RefactorRequest {
  code: string;
  instructions: string;
  style?: 'functional' | 'oop' | 'minimal' | 'verbose';
  model?: string;
}

export interface Change {
  type: string;
  description: string;
}

export interface RefactorResult {
  refactoredCode: string;
  changes: Change[];
  augmentCreditsUsed: number;
  creditsSaved: number;
  model: string;
  tokensGenerated: number;
  timeMs: number;
}

export class CodeRefactor {
  private ollama: OllamaClient;
  private promptBuilder: PromptBuilder;

  constructor(ollama: OllamaClient) {
    this.ollama = ollama;
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Refactor code according to instructions
   */
  async refactor(request: RefactorRequest): Promise<RefactorResult> {
    const prompt = this.promptBuilder.buildRefactorPrompt(request);

    const options: GenerateOptions = {
      model: request.model,
      complexity: 'medium',
      temperature: 0.5, // Balanced for refactoring
      maxTokens: 4096,
    };

    const result = await this.ollama.generate(prompt, options);

    // Parse the refactored code and changes
    const { code, changes } = this.parseRefactorResult(result.text);

    // Calculate credit savings
    // Augment would use ~7,000 credits for refactoring
    // We use ~400 credits (just for orchestration)
    const augmentCreditsUsed = 400;
    const creditsSaved = 7000 - augmentCreditsUsed;

    return {
      refactoredCode: code,
      changes,
      augmentCreditsUsed,
      creditsSaved,
      model: result.model,
      tokensGenerated: result.tokensGenerated,
      timeMs: result.timeMs,
    };
  }

  /**
   * Parse refactored code and extract changes
   */
  private parseRefactorResult(text: string): {
    code: string;
    changes: Change[];
  } {
    const changes: Change[] = [];

    // Extract code block
    const codeBlockPattern = /```(?:\w+)?\n([\s\S]+?)```/;
    const match = text.match(codeBlockPattern);
    const code = match ? match[1].trim() : text.trim();

    // Extract changes from text
    const changePatterns = [
      /- Extracted (.+?) into (.+)/gi,
      /- Renamed (.+?) to (.+)/gi,
      /- Moved (.+?) to (.+)/gi,
      /- Applied (.+?) pattern/gi,
      /- Simplified (.+)/gi,
      /- Improved (.+)/gi,
    ];

    for (const pattern of changePatterns) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        changes.push({
          type: this.inferChangeType(match[0]),
          description: match[0].replace(/^-\s*/, '').trim(),
        });
      }
    }

    // If no structured changes found, extract from bullet points
    if (changes.length === 0) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          changes.push({
            type: 'general',
            description: line.replace(/^[-*]\s*/, '').trim(),
          });
        }
      }
    }

    return { code, changes };
  }

  /**
   * Infer change type from description
   */
  private inferChangeType(description: string): string {
    const d = description.toLowerCase();
    if (d.includes('extract')) return 'extraction';
    if (d.includes('rename')) return 'rename';
    if (d.includes('move')) return 'move';
    if (d.includes('pattern')) return 'pattern';
    if (d.includes('simplif')) return 'simplification';
    if (d.includes('improv')) return 'improvement';
    return 'general';
  }
}

