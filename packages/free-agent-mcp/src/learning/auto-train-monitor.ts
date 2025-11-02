#!/usr/bin/env node
/**
 * Auto-Train Monitor - Watches for training opportunities and triggers Colab
 * 
 * This script monitors the .agent/sft/ directory and:
 * 1. Detects when 500+ examples are available
 * 2. Opens Colab notebook automatically
 * 3. Optionally triggers training via Colab API
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface TrainingStatus {
  role: 'coder' | 'fixer' | 'judge';
  exampleCount: number;
  ready: boolean;
  lastCheck: string;
  lastTrain?: string;
  trainCount?: number;
}

export class AutoTrainMonitor {
  private repoRoot: string;
  private statusFile: string;
  private colabNotebook: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.statusFile = join(repoRoot, '.agent', 'training-status.json');
    this.colabNotebook = join(repoRoot, '.training', 'colab', 'AUTO_TRAIN_LORA.ipynb');
  }

  /**
   * Check all roles for training readiness
   */
  checkAll(): TrainingStatus[] {
    const roles: Array<'coder' | 'fixer' | 'judge'> = ['coder', 'fixer', 'judge'];
    const statuses: TrainingStatus[] = [];

    for (const role of roles) {
      const status = this.checkRole(role);
      statuses.push(status);

      if (status.ready) {
        console.log(`\n🎯 ${role.toUpperCase()} is ready for training!`);
        console.log(`   Examples: ${status.exampleCount}`);
        console.log(`   Last trained: ${status.lastTrain || 'Never'}`);
      }
    }

    // Save status
    this.saveStatus(statuses);

    return statuses;
  }

  /**
   * Check if a specific role is ready for training
   */
  checkRole(role: 'coder' | 'fixer' | 'judge'): TrainingStatus {
    const sftFile = join(this.repoRoot, '.agent', 'sft', `${role}_sft.jsonl`);
    const lastTrainFile = join(this.repoRoot, '.agent', `last-train-${role}.txt`);

    let exampleCount = 0;
    let lastTrainCount = 0;

    // Count examples
    if (existsSync(sftFile)) {
      const content = readFileSync(sftFile, 'utf-8');
      exampleCount = content.split('\n').filter(line => line.trim()).length;
    }

    // Get last train count
    if (existsSync(lastTrainFile)) {
      lastTrainCount = parseInt(readFileSync(lastTrainFile, 'utf-8').trim());
    }

    // Ready if we have 500+ examples AND more than last time
    const ready = exampleCount >= 500 && exampleCount > lastTrainCount;

    return {
      role,
      exampleCount,
      ready,
      lastCheck: new Date().toISOString(),
      trainCount: lastTrainCount || undefined,
    };
  }

  /**
   * Open Colab notebook for training
   */
  async openColab(role: 'coder' | 'fixer' | 'judge'): Promise<void> {
    console.log(`\n🚀 Opening Colab notebook for ${role}...`);

    // Create a custom notebook with pre-filled config
    const notebook = this.createCustomNotebook(role);
    const customPath = join(this.repoRoot, '.agent', `train_${role}.ipynb`);
    writeFileSync(customPath, JSON.stringify(notebook, null, 2));

    console.log(`✅ Created custom notebook: ${customPath}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Upload ${customPath} to Google Colab`);
    console.log(`   2. Or visit: https://colab.research.google.com/`);
    console.log(`   3. Click Runtime → Run All`);
    console.log(`   4. Wait ~10-15 minutes for training`);
    console.log(`   5. Download adapter and deploy to Ollama`);

    // Try to open in browser
    const colabUrl = `https://colab.research.google.com/`;
    try {
      if (process.platform === 'win32') {
        await execAsync(`start ${colabUrl}`);
      } else if (process.platform === 'darwin') {
        await execAsync(`open ${colabUrl}`);
      } else {
        await execAsync(`xdg-open ${colabUrl}`);
      }
      console.log(`\n🌐 Opened Colab in browser`);
    } catch (error) {
      console.log(`\n⚠️  Could not open browser automatically`);
      console.log(`   Please visit: ${colabUrl}`);
    }
  }

  /**
   * Create a custom notebook with pre-filled configuration
   */
  private createCustomNotebook(role: 'coder' | 'fixer' | 'judge'): any {
    // Read the template notebook
    const template = JSON.parse(readFileSync(this.colabNotebook, 'utf-8'));

    // Update the config cell with actual values
    const configCell = template.cells.find((cell: any) => cell.metadata?.id === 'config_cell');
    if (configCell) {
      configCell.source = [
        `# GitHub repository (format: username/repo)\n`,
        `GITHUB_REPO = "christcr2012/robinsonai-mcp-servers"\n`,
        `\n`,
        `# Branch name\n`,
        `GITHUB_BRANCH = "feat/repo-guardrails"\n`,
        `\n`,
        `# Role to train (coder, fixer, or judge)\n`,
        `ROLE = "${role}"\n`,
        `\n`,
        `# Base model\n`,
        `BASE_MODEL = "unsloth/qwen2.5-coder-7b-bnb-4bit"\n`,
        `\n`,
        `# Training parameters\n`,
        `LORA_RANK = 16\n`,
        `LEARNING_RATE = 2e-4\n`,
        `MAX_STEPS = 100\n`,
        `BATCH_SIZE = 2\n`,
        `\n`,
        `# GitHub token (optional - for auto-upload)\n`,
        `# Get from: https://github.com/settings/tokens\n`,
        `GITHUB_TOKEN = ""  # Leave empty for manual download\n`,
      ];
    }

    return template;
  }

  /**
   * Save training status
   */
  private saveStatus(statuses: TrainingStatus[]): void {
    writeFileSync(this.statusFile, JSON.stringify(statuses, null, 2));
  }

  /**
   * Load training status
   */
  loadStatus(): TrainingStatus[] {
    if (existsSync(this.statusFile)) {
      return JSON.parse(readFileSync(this.statusFile, 'utf-8'));
    }
    return [];
  }

  /**
   * Watch for changes and auto-notify
   */
  async watch(intervalMs: number = 60000): Promise<void> {
    console.log(`👀 Watching for training opportunities...`);
    console.log(`   Checking every ${intervalMs / 1000} seconds`);
    console.log(`   Press Ctrl+C to stop\n`);

    const check = () => {
      const statuses = this.checkAll();
      const ready = statuses.filter(s => s.ready);

      if (ready.length > 0) {
        console.log(`\n🎉 ${ready.length} role(s) ready for training!`);
        for (const status of ready) {
          console.log(`   - ${status.role}: ${status.exampleCount} examples`);
        }
        console.log(`\n💡 Run: npm run train-colab -- --role=${ready[0].role}`);
      }
    };

    // Initial check
    check();

    // Periodic checks
    setInterval(check, intervalMs);
  }
}

/**
 * CLI
 */
// ES module check for direct execution
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this file is being run directly
const isMainModule = process.argv[1] && (
  process.argv[1] === __filename ||
  process.argv[1] === fileURLToPath(import.meta.url)
);

if (isMainModule) {
  const repoRoot = process.cwd();
  const monitor = new AutoTrainMonitor(repoRoot);

  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'check') {
    // Check all roles
    const statuses = monitor.checkAll();
    console.log(`\n📊 Training Status:`);
    console.log(JSON.stringify(statuses, null, 2));
  } else if (command === 'open') {
    // Open Colab for specific role
    const role = args[1] as 'coder' | 'fixer' | 'judge';
    if (!role || !['coder', 'fixer', 'judge'].includes(role)) {
      console.error('Usage: auto-train-monitor open <role>');
      console.error('  role: coder, fixer, or judge');
      process.exit(1);
    }
    monitor.openColab(role);
  } else if (command === 'watch') {
    // Watch for changes
    const interval = parseInt(args[1]) || 60000;
    monitor.watch(interval);
  } else {
    console.log('Usage:');
    console.log('  auto-train-monitor check          - Check training status');
    console.log('  auto-train-monitor open <role>    - Open Colab for training');
    console.log('  auto-train-monitor watch [ms]     - Watch for training opportunities');
  }
}

