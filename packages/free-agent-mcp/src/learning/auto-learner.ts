#!/usr/bin/env node
/**
 * Auto-Learner - Automated learning orchestrator
 * 
 * Automatically:
 * 1. Records every run with learning loop
 * 2. Exports SFT datasets when threshold is reached
 * 3. Triggers LoRA training when enough data is available
 * 4. Deploys trained models to Ollama
 * 5. Detects drift and rolls back if needed
 */

import { ExperienceDB } from './experience-db.js';
import { LearningLoop, RewardInputs } from './learning-loop.js';
import { SFTExporter } from './make-sft.js';
import { loadLearningConfig, LearningConfig } from './config.js';
import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface RunResult {
  compile_pass: boolean;
  lint_errors: number;
  type_errors: number;
  tests_passed: number;
  tests_total: number;
  coverage_pct: number;
  schema_errors: number;
  boundary_errors: number;
  cost_tokens: number;
  duration_ms: number;
  prompt: any;
  output: any;
}

export class AutoLearner {
  private db: ExperienceDB;
  private loop: LearningLoop;
  private config: LearningConfig;
  private repoRoot: string;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    this.db = new ExperienceDB(repoRoot);
    this.loop = new LearningLoop(repoRoot);
    this.config = loadLearningConfig(repoRoot);
  }

  /**
   * Record a run and trigger automation if thresholds are met
   */
  async recordRun(
    taskSlug: string,
    modelName: string,
    promptId: string,
    result: RunResult,
    role: 'coder' | 'fixer' | 'judge',
    humanAccept?: boolean
  ): Promise<void> {
    if (!this.config.enabled) {
      console.log('⏸️  Learning system disabled');
      return;
    }

    // Record run
    const rewardInputs: RewardInputs = {
      compile_pass: result.compile_pass,
      lint_errors: result.lint_errors,
      type_errors: result.type_errors,
      tests_passed: result.tests_passed,
      tests_total: result.tests_total,
      coverage_pct: result.coverage_pct,
      schema_errors: result.schema_errors,
      boundary_errors: result.boundary_errors,
      human_accept: humanAccept,
    };

    const runId = this.loop.recordRun(
      taskSlug,
      modelName,
      promptId,
      rewardInputs,
      result.cost_tokens,
      result.duration_ms,
      JSON.stringify(result.prompt),
      JSON.stringify(result.output),
      role
    );

    console.log(`✅ Recorded run ${runId} (reward: ${this.loop.calculateReward(rewardInputs).toFixed(2)})`);

    // Check if we should trigger automation
    await this.checkAndTriggerAutomation(role);
  }

  /**
   * Check if automation thresholds are met and trigger if needed
   */
  private async checkAndTriggerAutomation(role: 'coder' | 'fixer' | 'judge'): Promise<void> {
    // Check auto-export threshold
    if (this.config.autoExport.enabled) {
      const stats = this.db.getRecentStats(this.config.autoExport.minRuns);
      const highQualityRuns = this.db.getTopPairs(role, this.config.autoExport.maxExamples)
        .filter(p => p.label >= this.config.autoExport.minReward);

      if (highQualityRuns.length >= this.config.autoExport.minRuns) {
        const lastExportPath = join(this.repoRoot, '.agent', `last-export-${role}.txt`);
        const lastExportCount = existsSync(lastExportPath)
          ? parseInt(readFileSync(lastExportPath, 'utf-8'))
          : 0;

        // Only export if we have new data
        if (highQualityRuns.length > lastExportCount) {
          console.log(`\n📦 Auto-exporting SFT dataset for ${role}...`);
          await this.exportSFT(role);
          writeFileSync(lastExportPath, highQualityRuns.length.toString());
        }
      }
    }

    // Check auto-train threshold
    if (this.config.autoTrain.enabled) {
      const sftPath = join(this.repoRoot, '.agent', 'sft', `${role}_sft.jsonl`);
      if (existsSync(sftPath)) {
        const lines = readFileSync(sftPath, 'utf-8').split('\n').filter(l => l.trim());
        
        if (lines.length >= this.config.autoTrain.minExamples) {
          const lastTrainPath = join(this.repoRoot, '.agent', `last-train-${role}.txt`);
          const lastTrainCount = existsSync(lastTrainPath)
            ? parseInt(readFileSync(lastTrainPath, 'utf-8'))
            : 0;

          // Only train if we have new data
          if (lines.length > lastTrainCount) {
            console.log(`\n🚀 Auto-training LoRA adapter for ${role}...`);
            await this.trainLoRA(role);
            writeFileSync(lastTrainPath, lines.length.toString());
          }
        }
      }
    }
  }

  /**
   * Export SFT dataset
   */
  private async exportSFT(role: 'coder' | 'fixer' | 'judge'): Promise<void> {
    const exporter = new SFTExporter(this.repoRoot);
    
    try {
      exporter.exportAll(
        this.config.autoExport.minReward,
        this.config.autoExport.maxExamples
      );
      console.log(`✅ Exported SFT dataset for ${role}`);
    } catch (error) {
      console.error(`❌ Failed to export SFT dataset:`, error);
    } finally {
      exporter.close();
    }
  }

  /**
   * Train LoRA adapter
   */
  private async trainLoRA(role: 'coder' | 'fixer' | 'judge'): Promise<void> {
    const sftPath = join(this.repoRoot, '.agent', 'sft', `${role}_sft.jsonl`);
    const outputDir = join(this.repoRoot, '.agent', 'lora', role);

    // Create training script
    const trainScript = this.generateTrainingScript(role, sftPath, outputDir);
    const scriptPath = join(this.repoRoot, '.agent', `train_${role}.py`);
    writeFileSync(scriptPath, trainScript);

    try {
      console.log(`🔧 Training LoRA adapter for ${role}...`);
      console.log(`   Dataset: ${sftPath}`);
      console.log(`   Output: ${outputDir}`);
      
      // Run training (this will take a while)
      execSync(`python ${scriptPath}`, {
        cwd: this.repoRoot,
        stdio: 'inherit',
      });

      console.log(`✅ LoRA training complete for ${role}`);

      // Auto-deploy if enabled
      if (this.config.autoDeploy.enabled) {
        await this.deployToOllama(role, outputDir);
      }
    } catch (error) {
      console.error(`❌ Failed to train LoRA adapter:`, error);
    }
  }

  /**
   * Generate Python training script
   */
  private generateTrainingScript(role: string, dataPath: string, outputDir: string): string {
    return `#!/usr/bin/env python3
"""
Auto-generated LoRA training script for ${role}
Generated by AutoLearner
"""

from unsloth import FastLanguageModel
import torch
from datasets import load_dataset
from trl import SFTTrainer
from transformers import TrainingArguments

# Load base model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="${this.config.autoTrain.baseModel}",
    max_seq_length=4096,
    dtype=None,
    load_in_4bit=True,
)

# Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r=${this.config.autoTrain.loraRank},
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_alpha=${this.config.autoTrain.loraRank},
    lora_dropout=0,
    bias="none",
    use_gradient_checkpointing="unsloth",
    random_state=3407,
)

# Load dataset
dataset = load_dataset("json", data_files="${dataPath}", split="train")

# Format for training
def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs = examples["input"]
    outputs = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        text = f"### Instruction:\\n{instruction}\\n\\n### Input:\\n{input}\\n\\n### Response:\\n{output}"
        texts.append(text)
    return {"text": texts}

dataset = dataset.map(formatting_prompts_func, batched=True)

# Train
trainer = SFTTrainer(
    model=model,
    tokenizer=tokenizer,
    train_dataset=dataset,
    dataset_text_field="text",
    max_seq_length=4096,
    args=TrainingArguments(
        per_device_train_batch_size=${this.config.autoTrain.batchSize},
        gradient_accumulation_steps=4,
        warmup_steps=5,
        num_train_epochs=${this.config.autoTrain.epochs},
        learning_rate=${this.config.autoTrain.learningRate},
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        logging_steps=1,
        optim="adamw_8bit",
        weight_decay=0.01,
        lr_scheduler_type="linear",
        seed=3407,
        output_dir="${outputDir}",
    ),
)

trainer.train()

# Save LoRA adapter
model.save_pretrained("${outputDir}")
tokenizer.save_pretrained("${outputDir}")

# Convert to GGUF
model.save_pretrained_gguf("${outputDir}/adapter", tokenizer, quantization_method="q4_k_m")

print("✅ Training complete!")
print(f"📁 Adapter saved to: ${outputDir}/adapter-unsloth-adapter.gguf")
`;
  }

  /**
   * Deploy trained adapter to Ollama
   */
  private async deployToOllama(role: string, adapterDir: string): Promise<void> {
    const adapterPath = join(adapterDir, 'adapter-unsloth-adapter.gguf');
    
    if (!existsSync(adapterPath)) {
      console.error(`❌ Adapter not found: ${adapterPath}`);
      return;
    }

    const modelName = `${this.config.autoDeploy.modelNamePrefix}-${role}`;
    const modelfilePath = join(this.repoRoot, '.agent', `Modelfile.${role}`);

    // Create Modelfile
    const modelfile = `FROM ${this.config.autoTrain.baseModel}
ADAPTER ${adapterPath}
SYSTEM You are a precise ${role} that follows project conventions.
PARAMETER temperature ${this.config.autoDeploy.temperature}
PARAMETER top_p ${this.config.autoDeploy.topP}
PARAMETER top_k ${this.config.autoDeploy.topK}
`;

    writeFileSync(modelfilePath, modelfile);

    try {
      console.log(`🚀 Deploying to Ollama: ${modelName}`);
      
      // Create Ollama model
      execSync(`ollama create ${modelName} -f ${modelfilePath}`, {
        cwd: this.repoRoot,
        stdio: 'inherit',
      });

      console.log(`✅ Model deployed: ${modelName}`);
      console.log(`   Run with: ollama run ${modelName}`);

      // Update model variants to use new model
      this.updateModelVariants(modelName, role);
    } catch (error) {
      console.error(`❌ Failed to deploy to Ollama:`, error);
    }
  }

  /**
   * Update model variants to include new trained model
   */
  private updateModelVariants(modelName: string, role: string): void {
    const variantsPath = join(this.repoRoot, '.agent', 'model_variants.json');
    
    let variants = [];
    if (existsSync(variantsPath)) {
      variants = JSON.parse(readFileSync(variantsPath, 'utf-8'));
    }

    // Add new model if not exists
    const exists = variants.find((v: any) => v.id === modelName);
    if (!exists) {
      variants.push({
        id: modelName,
        name: `${role} (LoRA-tuned)`,
        cost_per_1k: 0, // Local model
        wins: 0,
        trials: 0,
      });

      writeFileSync(variantsPath, JSON.stringify(variants, null, 2));
      console.log(`✅ Added ${modelName} to model variants`);
    }
  }

  /**
   * Get learning stats
   */
  getStats() {
    return this.loop.getStats();
  }

  close(): void {
    this.db.close();
    this.loop.close();
  }
}

