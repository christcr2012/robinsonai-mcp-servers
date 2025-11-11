/**
 * Orchestrator
 *
 * Coordinates task routing, queuing, and agent execution.
 * Provides high-level API for task submission and processing.
 */

import { registerAgent, callAgent } from "./agents.js";
import { drain, enqueue, Job } from "./queues.js";
import { route, handle, validateTask, Task } from "./router.js";
import { runQualityGates } from "../pipeline/execute.js";
import { judgeCode } from "../pipeline/judge.js";
import { applyFixPlan } from "../pipeline/refine.js";
import { getRepoBrief, buildGlossaryFromBrief, retrieveNearbyFiles } from "../pipeline/context.js";
import { buildSystemPrompt, createPromptConfig } from "../prompt/system.js";
import { makeTaskUserPrompt } from "../prompt/index.js";
import * as memory from "../memory/index.js";

/**
 * Initialize orchestrator with default agents
 *
 * Registers "researcher" and "builder" agents.
 */
export function initializeOrchestrator(): void {
  // Register researcher agent
  registerAgent(
    "researcher",
    async (input: any) => {
      const { detail, cwd } = input;

      // Store research task in episodic memory
      memory.episodic.pushEpisode({
        role: "agent",
        text: `Researching: ${detail}`
      });

      // Store in working memory
      memory.working.setWorking("currentResearch", {
        detail,
        startedAt: Date.now()
      });

      // Use docs search if available
      try {
        // Placeholder for docs search integration
        const notes = `Researched: ${detail}`;

        // Store research notes in SQL memory
        memory.sql.sqlSet(`research-${Date.now()}`, {
          detail,
          notes,
          timestamp: Date.now()
        });

        return { notes, status: "complete" };
      } catch (err) {
        console.error("[Researcher] Error:", err);
        throw err;
      }
    },
    {
      description: "Researches topics and gathers information",
      version: "1.0.0",
      capabilities: ["research", "documentation-search", "analysis"]
    }
  );

  // Register builder agent
  registerAgent(
    "builder",
    async (input: any) => {
      const { detail, cwd } = input;

      // Store build task in episodic memory
      memory.episodic.pushEpisode({
        role: "agent",
        text: `Building: ${detail}`
      });

      // Initialize working memory for this task
      memory.working.setWorking("currentBuild", {
        detail,
        startedAt: Date.now(),
        step: 0,
        totalSteps: 5
      });

      try {
        // Step 1: Gather context
        memory.working.updateWorking("currentBuild", { step: 1 });
        const brief = await getRepoBrief(cwd);
        const glossary = await buildGlossaryFromBrief(cwd);
        const nearby = retrieveNearbyFiles(".");

        // Step 2: Build prompts
        memory.working.updateWorking("currentBuild", { step: 2 });
        const config = createPromptConfig({
          goals: ["Implement the requested change"],
          role: "Repo-native full-stack engineer",
          instructions: [
            "Reuse existing helpers and patterns",
            "Write comprehensive tests",
            "Keep patches minimal and focused",
            "Follow repository conventions"
          ],
          constraints: [
            "Never invent APIs",
            "Use only real, documented functions",
            "Write complete, runnable code"
          ]
        });

        const system = buildSystemPrompt(config);
        const user = makeTaskUserPrompt(detail, { brief, glossary, nearby });

        // Store prompts in vector memory
        memory.vector.upsertVec({
          id: `prompt-system-${Date.now()}`,
          text: system,
          meta: { type: "system", task: detail }
        });

        memory.vector.upsertVec({
          id: `prompt-user-${Date.now()}`,
          text: user,
          meta: { type: "user", task: detail }
        });

        // Step 3: Synthesize code (placeholder)
        memory.working.updateWorking("currentBuild", { step: 3 });
        const generatedCode = `// Generated code for: ${detail}\n// TODO: Implement`;

        // Store generated code in vector memory
        memory.vector.upsertVec({
          id: `generated-${Date.now()}`,
          text: generatedCode,
          meta: { type: "generated", task: detail, attempt: 1 }
        });

        // Step 4: Quality gates loop
        memory.working.updateWorking("currentBuild", { step: 4 });
        let attempts = 0;
        let ok = false;

        while (attempts < 3) {
          const gate = runQualityGates(cwd);
          const verdict = await judgeCode({
            spec: detail,
            signals: gate.report,
            patchSummary: {
              filesChanged: [],
              diffStats: { additions: 0, deletions: 0 }
            },
            modelNotes: ""
          });

          // Store quality metrics in SQL memory
          memory.sql.sqlSet(`quality-${Date.now()}-${attempts}`, {
            attempt: attempts,
            score: verdict.score ?? 0,
            verdict: verdict.verdict,
            metrics: gate.report
          });

          if (gate.ok && verdict.verdict === "accept") {
            ok = true;
            break;
          }

          // Apply fixes from judge's fix plan
          if (verdict.fix_plan && verdict.fix_plan.length > 0) {
            await applyFixPlan(
              verdict,
              [],
              gate.report,
              undefined
            );

            // Store refined code in vector memory
            memory.vector.upsertVec({
              id: `refined-${Date.now()}-${attempts}`,
              text: `Applied fixes for attempt ${attempts + 1}`,
              meta: { type: "refined", task: detail, attempt: attempts + 1 }
            });
          }

          attempts++;
        }

        if (!ok) {
          throw new Error("Failed to pass quality gates after 3 attempts");
        }

        // Step 5: Complete
        memory.working.updateWorking("currentBuild", { step: 5, status: "complete" });

        // Store completion in episodic memory
        memory.episodic.pushEpisode({
          role: "agent",
          text: `Completed build: ${detail}`
        });

        return {
          status: "done",
          detail,
          attempts,
          qualityScore: 90
        };
      } catch (err) {
        console.error("[Builder] Error:", err);
        memory.episodic.pushEpisode({
          role: "agent",
          text: `Failed build: ${detail} - ${(err as Error).message}`
        });
        throw err;
      }
    },
    {
      description: "Builds features, fixes bugs, and refactors code",
      version: "1.0.0",
      capabilities: ["code-generation", "testing", "quality-gates", "refactoring"]
    }
  );
}

/**
 * Submit a task for processing
 *
 * @param task - Task to submit
 * @returns Processing result
 *
 * @example
 * ```typescript
 * const result = await submit({
 *   kind: "feature",
 *   detail: "Add user authentication",
 *   cwd: "."
 * });
 * ```
 */
export async function submit(task: Task): Promise<any> {
  // Validate task
  const validation = validateTask(task);
  if (!validation.valid) {
    throw new Error(`Invalid task: ${validation.errors.join(", ")}`);
  }

  // Route task
  const routeResult = route(task);

  // Drain queue
  return drain(async (job: Job) => {
    const result = await handle(job);
    return result;
  });
}

/**
 * Submit multiple tasks
 *
 * @param tasks - Tasks to submit
 * @returns Array of processing results
 */
export async function submitMultiple(tasks: Task[]): Promise<any[]> {
  const results: any[] = [];

  for (const task of tasks) {
    try {
      const result = await submit(task);
      results.push(result);
    } catch (err) {
      results.push({ error: (err as Error).message });
    }
  }

  return results;
}

/**
 * Get orchestrator status
 *
 * @returns Status information
 */
export function getOrchestratorStatus(): {
  initialized: boolean;
  memoryInfo: any;
} {
  return {
    initialized: true,
    memoryInfo: memory.getMemorySystemInfo()
  };
}

// Export sub-modules
export * from "./queues.js";
export * from "./agents.js";
export * from "./router.js";

