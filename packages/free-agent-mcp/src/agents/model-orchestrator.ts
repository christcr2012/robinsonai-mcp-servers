/**
 * Model Orchestrator
 * 
 * Intelligently switches between models during task execution based on detected subtasks.
 * Enables optimal model selection for each phase of work.
 */

import { detectSubtaskType, suggestModelSwitch, createTaskContext, recordModelSwitch, getSwitchSummary, type SubtaskType, type TaskContext } from './task-router.js';
import { llmGenerate, type LLMGenerateOptions } from '../shared/shared-llm/llm-client.js';

export interface OrchestrationConfig {
  enableSwitching: boolean;
  initialModel: string;
  provider: 'ollama' | 'openai' | 'claude' | 'kimi' | 'voyage';
  maxSwitches: number;
  logSwitches: boolean;
}

export interface SwitchEvent {
  timestamp: number;
  fromModel: string;
  toModel: string;
  reason: string;
  detectedType: SubtaskType;
  confidence: number;
}

/**
 * Orchestrate LLM calls with intelligent model switching
 */
export class ModelOrchestrator {
  private config: OrchestrationConfig;
  private taskContext: TaskContext | null = null;
  private switchEvents: SwitchEvent[] = [];
  private currentModel: string;
  private originalTask: string = ''; // Store original task for detection

  constructor(config: Partial<OrchestrationConfig> = {}) {
    this.config = {
      enableSwitching: true,
      initialModel: 'qwen2.5-coder:7b',
      provider: 'ollama',
      maxSwitches: 5,
      logSwitches: true,
      ...config,
    };
    this.currentModel = this.config.initialModel;
  }

  /**
   * Initialize orchestration for a task
   */
  initializeTask(taskDescription: string): void {
    this.originalTask = taskDescription; // Store for detection
    this.taskContext = createTaskContext(taskDescription);
    this.switchEvents = [];
    this.currentModel = this.config.initialModel;

    if (this.config.logSwitches) {
      console.error(`[ModelOrchestrator] Initialized for task: "${taskDescription.substring(0, 50)}..."`);
      console.error(`[ModelOrchestrator] Starting model: ${this.currentModel}`);
    }
  }

  /**
   * Generate with intelligent model switching
   */
  async generateWithSwitching(options: LLMGenerateOptions): Promise<any> {
    if (!this.taskContext) {
      throw new Error('Task not initialized. Call initializeTask() first.');
    }

    if (!this.config.enableSwitching) {
      // Fallback to regular generation without switching
      return llmGenerate(options);
    }

    // Detect subtask type from the ORIGINAL TASK, not the full prompt
    // The full prompt has too much noise and dilutes the signal
    const detection = detectSubtaskType(this.originalTask);

    if (this.config.logSwitches && detection) {
      console.error(`[ModelOrchestrator] Detection: ${detection.type} (confidence: ${(detection.confidence * 100).toFixed(0)}%)`);
      console.error(`[ModelOrchestrator] Keywords matched: ${detection.keywords.join(', ')}`);
    }

    if (detection && this.switchEvents.length < this.config.maxSwitches) {
      const switchDecision = suggestModelSwitch(this.currentModel, detection);

      if (switchDecision.shouldSwitch) {
        // Record the switch
        const switchEvent: SwitchEvent = {
          timestamp: Date.now(),
          fromModel: this.currentModel,
          toModel: switchDecision.newModel,
          reason: switchDecision.reason,
          detectedType: detection.type,
          confidence: detection.confidence,
        };

        this.switchEvents.push(switchEvent);

        if (this.config.logSwitches) {
          console.error(`[ModelOrchestrator] 🔄 SWITCHING MODELS`);
          console.error(`  From: ${switchEvent.fromModel}`);
          console.error(`  To: ${switchEvent.toModel}`);
          console.error(`  Reason: ${switchEvent.reason}`);
          console.error(`  Detected: ${detection.type} (confidence: ${(detection.confidence * 100).toFixed(0)}%)`);
        }

        // Update current model
        this.currentModel = switchDecision.newModel;

        // Record in task context
        if (this.taskContext) {
          recordModelSwitch(this.taskContext, switchDecision.newModel, detection.type, 0);
        }
      }
    }

    // Generate with current model
    const result = await llmGenerate({
      ...options,
      model: this.currentModel,
      provider: this.config.provider,
    });

    return result;
  }

  /**
   * Get summary of all model switches
   */
  getSwitchSummary(): string {
    if (this.switchEvents.length === 0) {
      return 'No model switches occurred';
    }

    const summary = this.switchEvents
      .map((e, i) => `${i + 1}. ${e.fromModel} → ${e.toModel} (${e.detectedType}): ${e.reason}`)
      .join('\n');

    return `Model switches (${this.switchEvents.length} total):\n${summary}`;
  }

  /**
   * Get all switch events
   */
  getSwitchEvents(): SwitchEvent[] {
    return [...this.switchEvents];
  }

  /**
   * Get current model
   */
  getCurrentModel(): string {
    return this.currentModel;
  }

  /**
   * Get task context
   */
  getTaskContext(): TaskContext | null {
    return this.taskContext;
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.taskContext = null;
    this.switchEvents = [];
    this.currentModel = this.config.initialModel;
  }
}

/**
 * Global orchestrator instance (singleton)
 */
let globalOrchestrator: ModelOrchestrator | null = null;

/**
 * Get or create global orchestrator
 * FIXED: Always create a new instance to avoid stale config from previous tasks
 */
export function getGlobalOrchestrator(config?: Partial<OrchestrationConfig>): ModelOrchestrator {
  // Always create a new instance to avoid config/state pollution between tasks
  globalOrchestrator = new ModelOrchestrator(config);
  return globalOrchestrator;
}

/**
 * Reset global orchestrator
 */
export function resetGlobalOrchestrator(): void {
  if (globalOrchestrator) {
    globalOrchestrator.reset();
  }
}

