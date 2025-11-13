/**
 * Code Analyzer Agent
 * 
 * Analyzes code using local LLMs (Ollama).
 * Finds issues, performance problems, security vulnerabilities.
 */

import { OllamaClient, GenerateOptions } from '../ollama-client.js';
import { PromptBuilder } from '../utils/prompt-builder.js';
import { stripCodeFences } from '../utils/output-format.js';

export interface AnalyzeRequest {
  code?: string;
  files?: string[];
  question: string;
  model?: string;
}

export interface Issue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: string;
  suggestion: string;
}

export interface AnalyzeResult {
  analysis: string;
  issues: Issue[];
  augmentCreditsUsed: number;
  creditsSaved: number;
  model: string;
  tokensGenerated: number;
  timeMs: number;
}

export class CodeAnalyzer {
  private ollama: OllamaClient;
  private promptBuilder: PromptBuilder;

  constructor(ollama: OllamaClient) {
    this.ollama = ollama;
    this.promptBuilder = new PromptBuilder();
  }

  /**
   * Analyze code and find issues
   */
  async analyze(request: AnalyzeRequest): Promise<AnalyzeResult> {
    const prompt = this.promptBuilder.buildAnalysisPrompt(request);

    const options: GenerateOptions = {
      model: request.model,
      complexity: 'medium',
      temperature: 0.3, // Lower temp for analysis (more factual)
      maxTokens: 4096,
    };

    const result = await this.ollama.generate(prompt, options);
    const analysisText = stripCodeFences(result.text);

    // Parse issues from the analysis
    const issues = this.parseIssues(analysisText);

    // Calculate credit savings
    // Augment would use ~5,000 credits for analysis
    // We use ~300 credits (just for orchestration)
    const augmentCreditsUsed = 300;
    const creditsSaved = 5000 - augmentCreditsUsed;

    return {
      analysis: analysisText,
      issues,
      augmentCreditsUsed,
      creditsSaved,
      model: result.model,
      tokensGenerated: result.tokensGenerated,
      timeMs: result.timeMs,
    };
  }

  /**
   * Parse issues from analysis text
   */
  private parseIssues(text: string): Issue[] {
    const issues: Issue[] = [];

    // Look for structured issue format
    const issuePattern = /\[(\w+)\]\s*\((\w+)\)\s*(.+?):\s*(.+?)(?:\n|$)/g;
    const matches = Array.from(text.matchAll(issuePattern));

    for (const match of matches) {
      const [, type, severity, location, description] = match;

      issues.push({
        type: type.toLowerCase(),
        severity: this.normalizeSeverity(severity),
        description: description.trim(),
        location: location.trim(),
        suggestion: '', // Could be extracted from following text
      });
    }

    // If no structured issues found, try to extract from natural language
    if (issues.length === 0) {
      const lines = text.split('\n');
      for (const line of lines) {
        if (
          line.includes('issue') ||
          line.includes('problem') ||
          line.includes('error') ||
          line.includes('warning')
        ) {
          issues.push({
            type: 'general',
            severity: 'medium',
            description: line.trim(),
            location: 'unknown',
            suggestion: '',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Normalize severity to standard levels
   */
  private normalizeSeverity(severity: string): 'low' | 'medium' | 'high' {
    const s = severity.toLowerCase();
    if (s.includes('high') || s.includes('critical') || s.includes('severe')) {
      return 'high';
    }
    if (s.includes('low') || s.includes('minor')) {
      return 'low';
    }
    return 'medium';
  }
}

