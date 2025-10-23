/**
 * Reflective Thinking Tool
 * Review and critique previous thoughts and decisions
 * Identify improvements and assess confidence
 */

interface ReflectionPoint {
  thoughtNumber: number;
  reflection: string;
  improvements: string[];
  confidence: number;
  timestamp: number;
}

// Global state for reflections (persists across calls)
const reflections: ReflectionPoint[] = [];

export async function reflectiveThinking(args: any): Promise<any> {
  const reflection: ReflectionPoint = {
    thoughtNumber: args.thoughtNumber,
    reflection: args.reflection,
    improvements: args.improvements,
    confidence: args.confidence,
    timestamp: Date.now(),
  };

  reflections.push(reflection);

  // Calculate average confidence across all reflections
  const averageConfidence = reflections.reduce((sum, r) => sum + r.confidence, 0) / reflections.length;

  // Find low-confidence reflections (< 0.6)
  const lowConfidenceReflections = reflections.filter(r => r.confidence < 0.6);

  const response = {
    reflectionAdded: true,
    totalReflections: reflections.length,
    thoughtNumber: args.thoughtNumber,
    confidence: args.confidence,
    improvementCount: args.improvements.length,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    lowConfidenceCount: lowConfidenceReflections.length,
    improvements: args.improvements,
    summary: `Reflected on thought ${args.thoughtNumber} with ${args.confidence * 100}% confidence. ${args.improvements.length} improvements identified.`,
    recommendation: args.confidence < 0.6 
      ? 'Low confidence detected. Consider revisiting this thought or exploring alternative approaches.'
      : 'Confidence is good. Proceed with this approach.',
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

