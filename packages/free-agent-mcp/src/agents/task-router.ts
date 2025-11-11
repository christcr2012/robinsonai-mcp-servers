/**
 * Intelligent Task Router
 * 
 * Detects subtask types during execution and switches models intelligently
 * Example: Start with code model → detect API setup needed → switch to Mistral → complete setup → switch back
 */

export type SubtaskType = 
  | 'code_generation'
  | 'code_refactoring'
  | 'test_generation'
  | 'api_integration'
  | 'database_setup'
  | 'configuration'
  | 'research'
  | 'analysis'
  | 'planning'
  | 'documentation';

export interface SubtaskDetection {
  type: SubtaskType;
  confidence: number; // 0-1
  keywords: string[];
  suggestedModel: string;
  reason: string;
}

export interface TaskContext {
  originalTask: string;
  currentPhase: SubtaskType;
  completedPhases: SubtaskType[];
  detectedSubtasks: SubtaskType[];
  modelHistory: Array<{ model: string; phase: SubtaskType; duration: number }>;
}

/**
 * Detect subtask type from text content
 */
export function detectSubtaskType(text: string): SubtaskDetection | null {
  const lowerText = text.toLowerCase();

  // API Integration detection
  if (
    lowerText.includes('api') ||
    lowerText.includes('openai') ||
    lowerText.includes('supabase') ||
    lowerText.includes('google workspace') ||
    lowerText.includes('n8n') ||
    lowerText.includes('webhook') ||
    lowerText.includes('authentication') ||
    lowerText.includes('oauth')
  ) {
    return {
      type: 'api_integration',
      confidence: 0.85,
      keywords: ['api', 'openai', 'supabase', 'google', 'n8n', 'webhook', 'auth'],
      suggestedModel: 'mistral:7b',
      reason: 'Mistral excels at API integration and configuration',
    };
  }

  // Database setup detection
  if (
    lowerText.includes('database') ||
    lowerText.includes('schema') ||
    lowerText.includes('migration') ||
    lowerText.includes('postgres') ||
    lowerText.includes('neon') ||
    lowerText.includes('table') ||
    lowerText.includes('index')
  ) {
    return {
      type: 'database_setup',
      confidence: 0.85,
      keywords: ['database', 'schema', 'migration', 'postgres', 'table'],
      suggestedModel: 'mistral:7b',
      reason: 'Mistral is excellent at database design and configuration',
    };
  }

  // Research/Analysis detection
  if (
    lowerText.includes('research') ||
    lowerText.includes('analyze') ||
    lowerText.includes('investigate') ||
    lowerText.includes('understand') ||
    lowerText.includes('compare') ||
    lowerText.includes('evaluate')
  ) {
    return {
      type: 'research',
      confidence: 0.8,
      keywords: ['research', 'analyze', 'investigate', 'understand'],
      suggestedModel: 'mistral:7b',
      reason: 'Mistral has better reasoning for analysis tasks',
    };
  }

  // Test generation detection
  if (
    lowerText.includes('test') ||
    lowerText.includes('jest') ||
    lowerText.includes('vitest') ||
    lowerText.includes('mocha') ||
    lowerText.includes('unit test') ||
    lowerText.includes('integration test')
  ) {
    return {
      type: 'test_generation',
      confidence: 0.9,
      keywords: ['test', 'jest', 'vitest', 'mocha'],
      suggestedModel: 'qwen2.5-coder:7b',
      reason: 'Qwen Coder is best for test generation',
    };
  }

  // Code generation/refactoring detection
  if (
    lowerText.includes('function') ||
    lowerText.includes('class') ||
    lowerText.includes('component') ||
    lowerText.includes('refactor') ||
    lowerText.includes('implement') ||
    lowerText.includes('write code')
  ) {
    return {
      type: 'code_generation',
      confidence: 0.9,
      keywords: ['function', 'class', 'component', 'code'],
      suggestedModel: 'qwen2.5-coder:7b',
      reason: 'Qwen Coder is best for code generation',
    };
  }

  return null;
}

/**
 * Suggest model switch based on detected subtask
 */
export function suggestModelSwitch(
  currentModel: string,
  detection: SubtaskDetection
): { shouldSwitch: boolean; newModel: string; reason: string } {
  // Don't switch if already using the suggested model
  if (currentModel === detection.suggestedModel) {
    return {
      shouldSwitch: false,
      newModel: currentModel,
      reason: 'Already using optimal model',
    };
  }

  // Only switch if confidence is high
  if (detection.confidence < 0.75) {
    return {
      shouldSwitch: false,
      newModel: currentModel,
      reason: `Low confidence (${(detection.confidence * 100).toFixed(0)}%) - staying with current model`,
    };
  }

  return {
    shouldSwitch: true,
    newModel: detection.suggestedModel,
    reason: `Detected ${detection.type}: ${detection.reason}`,
  };
}

/**
 * Create task context for tracking model switches
 */
export function createTaskContext(originalTask: string): TaskContext {
  return {
    originalTask,
    currentPhase: 'code_generation',
    completedPhases: [],
    detectedSubtasks: [],
    modelHistory: [],
  };
}

/**
 * Record model switch in task context
 */
export function recordModelSwitch(
  context: TaskContext,
  model: string,
  phase: SubtaskType,
  duration: number
): void {
  context.modelHistory.push({ model, phase, duration });
  context.currentPhase = phase;
  if (!context.detectedSubtasks.includes(phase)) {
    context.detectedSubtasks.push(phase);
  }
}

/**
 * Get summary of model switches for logging
 */
export function getSwitchSummary(context: TaskContext): string {
  if (context.modelHistory.length === 0) {
    return 'No model switches';
  }

  const switches = context.modelHistory
    .map((h, i) => `${i + 1}. ${h.model} (${h.phase}, ${h.duration}ms)`)
    .join(' → ');

  return `Model switches: ${switches}`;
}

