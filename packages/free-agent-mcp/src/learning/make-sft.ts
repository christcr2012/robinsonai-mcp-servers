#!/usr/bin/env node
/**
 * SFT Dataset Exporter - Export pairs table to JSONL for LoRA training
 * 
 * Exports high-quality prompt→output pairs from experience.db to:
 * - coder_sft.jsonl: Coder role (spec → code)
 * - fixer_sft.jsonl: Fixer role (diagnostics → patch)
 * - judge_sft.jsonl: Judge role (code → verdict)
 * 
 * Format: Unsloth/PEFT compatible JSONL
 * {
 *   "instruction": "...",
 *   "input": "...",
 *   "output": "..."
 * }
 * 
 * Usage:
 *   node make-sft.ts [repo-root] [--min-reward=0.7] [--limit=1000]
 */

import { ExperienceDB, Pair } from './experience-db.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

export interface SFTExample {
  instruction: string;
  input: string;
  output: string;
}

export class SFTExporter {
  private db: ExperienceDB;
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.db = new ExperienceDB(repoRoot);
  }

  /**
   * Export coder pairs (spec → code)
   */
  exportCoderSFT(minReward = 0.7, limit = 1000): SFTExample[] {
    const pairs = this.db.getTopPairs('coder', limit);
    const filtered = pairs.filter(p => p.label >= minReward);

    return filtered.map(pair => {
      const prompt = JSON.parse(pair.prompt_json);
      const output = JSON.parse(pair.output_json);

      return {
        instruction: 'You are a precise code generator that follows project conventions. Generate code that compiles, passes tests, and matches the project style.',
        input: this.formatCoderInput(prompt),
        output: this.formatCoderOutput(output),
      };
    });
  }

  /**
   * Export fixer pairs (diagnostics → patch)
   */
  exportFixerSFT(minReward = 0.7, limit = 1000): SFTExample[] {
    const pairs = this.db.getTopPairs('fixer', limit);
    const filtered = pairs.filter(p => p.label >= minReward);

    return filtered.map(pair => {
      const prompt = JSON.parse(pair.prompt_json);
      const output = JSON.parse(pair.output_json);

      return {
        instruction: 'You are a code fixer. Given diagnostics and code, generate a minimal patch that fixes all errors while preserving style and functionality.',
        input: this.formatFixerInput(prompt),
        output: this.formatFixerOutput(output),
      };
    });
  }

  /**
   * Export judge pairs (code → verdict)
   */
  exportJudgeSFT(minReward = 0.7, limit = 1000): SFTExample[] {
    const pairs = this.db.getTopPairs('judge', limit);
    const filtered = pairs.filter(p => p.label >= minReward);

    return filtered.map(pair => {
      const prompt = JSON.parse(pair.prompt_json);
      const output = JSON.parse(pair.output_json);

      return {
        instruction: 'You are a code judge. Evaluate code quality across 8 dimensions and provide a verdict (accept/reject/refine) with detailed rationale.',
        input: this.formatJudgeInput(prompt),
        output: this.formatJudgeOutput(output),
      };
    });
  }

  /**
   * Format coder input (project brief + spec)
   */
  private formatCoderInput(prompt: any): string {
    const parts: string[] = [];

    if (prompt.brief) {
      parts.push('# Project Context');
      parts.push(prompt.brief);
      parts.push('');
    }

    if (prompt.spec) {
      parts.push('# Task Specification');
      parts.push(prompt.spec);
      parts.push('');
    }

    if (prompt.neighbors && prompt.neighbors.length > 0) {
      parts.push('# Similar Code Examples');
      prompt.neighbors.forEach((n: any, i: number) => {
        parts.push(`## Example ${i + 1}: ${n.file}`);
        parts.push('```');
        parts.push(n.code);
        parts.push('```');
        parts.push('');
      });
    }

    return parts.join('\n');
  }

  /**
   * Format coder output (generated code)
   */
  private formatCoderOutput(output: any): string {
    if (output.files && Array.isArray(output.files)) {
      const parts: string[] = [];
      output.files.forEach((file: any) => {
        parts.push(`# ${file.path}`);
        parts.push('```');
        parts.push(file.content);
        parts.push('```');
        parts.push('');
      });
      return parts.join('\n');
    }
    return JSON.stringify(output, null, 2);
  }

  /**
   * Format fixer input (diagnostics + code)
   */
  private formatFixerInput(prompt: any): string {
    const parts: string[] = [];

    if (prompt.diagnostics) {
      parts.push('# Diagnostics');
      parts.push(prompt.diagnostics);
      parts.push('');
    }

    if (prompt.code) {
      parts.push('# Current Code');
      parts.push('```');
      parts.push(prompt.code);
      parts.push('```');
      parts.push('');
    }

    if (prompt.diff) {
      parts.push('# Git Diff');
      parts.push('```diff');
      parts.push(prompt.diff);
      parts.push('```');
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Format fixer output (patch)
   */
  private formatFixerOutput(output: any): string {
    if (output.patch) {
      return JSON.stringify(output.patch, null, 2);
    }
    return JSON.stringify(output, null, 2);
  }

  /**
   * Format judge input (code + quality gates)
   */
  private formatJudgeInput(prompt: any): string {
    const parts: string[] = [];

    if (prompt.code) {
      parts.push('# Code to Evaluate');
      parts.push('```');
      parts.push(prompt.code);
      parts.push('```');
      parts.push('');
    }

    if (prompt.gates) {
      parts.push('# Quality Gate Results');
      parts.push(JSON.stringify(prompt.gates, null, 2));
      parts.push('');
    }

    return parts.join('\n');
  }

  /**
   * Format judge output (verdict)
   */
  private formatJudgeOutput(output: any): string {
    return JSON.stringify(output, null, 2);
  }

  /**
   * Export all SFT datasets to JSONL files
   */
  exportAll(minReward = 0.7, limit = 1000): void {
    const outputDir = join(this.repoRoot, '.agent', 'sft');
    const { mkdirSync } = require('fs');
    mkdirSync(outputDir, { recursive: true });

    // Export coder SFT
    const coderExamples = this.exportCoderSFT(minReward, limit);
    const coderPath = join(outputDir, 'coder_sft.jsonl');
    writeFileSync(coderPath, coderExamples.map(e => JSON.stringify(e)).join('\n'));
    console.log(`✅ Exported ${coderExamples.length} coder examples to ${coderPath}`);

    // Export fixer SFT
    const fixerExamples = this.exportFixerSFT(minReward, limit);
    const fixerPath = join(outputDir, 'fixer_sft.jsonl');
    writeFileSync(fixerPath, fixerExamples.map(e => JSON.stringify(e)).join('\n'));
    console.log(`✅ Exported ${fixerExamples.length} fixer examples to ${fixerPath}`);

    // Export judge SFT
    const judgeExamples = this.exportJudgeSFT(minReward, limit);
    const judgePath = join(outputDir, 'judge_sft.jsonl');
    writeFileSync(judgePath, judgeExamples.map(e => JSON.stringify(e)).join('\n'));
    console.log(`✅ Exported ${judgeExamples.length} judge examples to ${judgePath}`);

    console.log('\n📊 Summary:');
    console.log(`  Coder: ${coderExamples.length} examples`);
    console.log(`  Fixer: ${fixerExamples.length} examples`);
    console.log(`  Judge: ${judgeExamples.length} examples`);
    console.log(`  Total: ${coderExamples.length + fixerExamples.length + judgeExamples.length} examples`);
    console.log(`\n📁 Output directory: ${outputDir}`);
    console.log('\n🚀 Next steps:');
    console.log('  1. Fine-tune with Unsloth/PEFT:');
    console.log('     python train_lora.py --data coder_sft.jsonl --base qwen2.5-coder:7b');
    console.log('  2. Convert LoRA to GGUF:');
    console.log('     python convert_lora_to_gguf.py --adapter ./lora_adapter');
    console.log('  3. Create Ollama Modelfile:');
    console.log('     FROM qwen2.5-coder:7b');
    console.log('     ADAPTER ./coder_adapter.gguf');
    console.log('  4. Serve with Ollama:');
    console.log('     ollama create my-coder-tuned -f Modelfile');
    console.log('     ollama run my-coder-tuned');
  }

  close(): void {
    this.db.close();
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const repoRoot = args[0] || process.cwd();
  const minReward = parseFloat(args.find(a => a.startsWith('--min-reward='))?.split('=')[1] || '0.7');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '1000');

  console.log('🔧 SFT Dataset Exporter');
  console.log(`📂 Repo: ${repoRoot}`);
  console.log(`🎯 Min reward: ${minReward}`);
  console.log(`📊 Limit: ${limit}`);
  console.log('');

  const exporter = new SFTExporter(repoRoot);
  exporter.exportAll(minReward, limit);
  exporter.close();
}

