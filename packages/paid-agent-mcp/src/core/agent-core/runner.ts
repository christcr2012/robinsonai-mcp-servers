import { loadAdapter } from "./repo/adapter.js";
import { discover } from "./repo/discover.js";
import { ensureCodegen } from "./spec/codegen.js";
import { buildPipeline } from "./pipeline/index.js";
import { learnPatternContract } from "./patterns/learn.js";
import { pickExamples } from "./patterns/examples.js";
import type { AgentTask, AgentRunResult } from './task.js';
import { getRadClient } from './rad-client.js';
import { getCortexClient } from './cortex/index.js';
import { gatherEvidence } from './evidence.js';

export async function runFreeAgent(opts: {
  repo: string;
  task: string;
  kind: "feature" | "bugfix" | "refactor" | "research";
  tier?: "free" | "paid";
  quality?: "fast" | "balanced" | "best" | "auto";
}) {
  // 1) pick adapter: per-repo config > auto-discover > defaults
  const base = await discover(opts.repo);
  const adapter = await loadAdapter(base);

  console.log(`[Runner] Adapter: ${adapter.name}`);

  // 2) learn pattern contract from repo
  const contract = learnPatternContract(base);
  const exemplars = pickExamples(base, contract, 6);
  console.log(
    `[Runner] Learned contract with ${contract.containers.length} containers, ${contract.wrappers.length} wrappers`
  );

  // 3) ensure spec-first handlers exist (registry path/URL, not repo-bound)
  const specRegistry =
    process.env.FREE_AGENT_SPEC ?? adapter.specRegistry;
  if (specRegistry) {
    console.log(`[Runner] Spec registry: ${specRegistry}`);
    await ensureCodegen({
      registry: specRegistry,
      outDir: adapter.codegenOutDir,
    });
  }

  // 4) run repo-specific gates/commands via adapter (build/lint/test are abstract)
  const pipe = buildPipeline({ adapter, repo: base, contract, exemplars });
  await pipe.run(opts.kind, opts.task, {
    tier: opts.tier || (process.env.FREE_AGENT_TIER as any) || "free",
    quality: (opts.quality as any) || (process.env.FREE_AGENT_QUALITY as any) || "auto",
  });
}

/**
 * Generic agent task runner - neutral entrypoint for both Free and Paid agents
 * This is the shared Agent Core interface used by both MCP servers
 */
export async function runAgentTask(task: AgentTask): Promise<AgentRunResult> {
  const started = Date.now();
  let success = true;
  let errorMessage: string | undefined;
  let errorStack: string | undefined;
  let errorType: string | undefined;
  let taskId: string | undefined;
  let planningArtifacts: any[] = [];
  let executionArtifacts: any[] = [];
  const logs: string[] = [];

  logs.push(`[${new Date().toISOString()}] Starting agent task: ${task.task}`);
  logs.push(`[${new Date().toISOString()}] Repo: ${task.repo}, Kind: ${task.kind}, Tier: ${task.tier || 'free'}`);

  // Gather evidence (with caching and web search)
  // Note: MCP clients (web, contextEngine, toolkit, rad) should be injected via task.clients
  try {
    logs.push(`[${new Date().toISOString()}] Gathering evidence...`);

    // Determine if web evidence should be gathered based on task kind
    const allowWebEvidence = task.kind === 'research' ||
                             task.task.toLowerCase().includes('research') ||
                             task.task.toLowerCase().includes('guide') ||
                             task.task.toLowerCase().includes('best practices') ||
                             task.task.toLowerCase().includes('patterns');

    const evidence = await gatherEvidence(task.task, task.repo, {
      useCache: true,
      cacheTTLMinutes: 60,
      allowWebEvidence,
      maxWebResults: 8,
    }, task.clients || {});

    logs.push(`[${new Date().toISOString()}] Evidence gathered successfully (web: ${allowWebEvidence ? 'enabled' : 'disabled'})`);
    if (evidence.webSnippets && evidence.webSnippets.length > 0) {
      logs.push(`[${new Date().toISOString()}] Found ${evidence.webSnippets.length} web snippets`);
    }
  } catch (error) {
    logs.push(`[${new Date().toISOString()}] Warning: Failed to gather evidence: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Get Cortex context (playbooks, workflows, patterns, capabilities, RAD knowledge)
  const cortex = getCortexClient();
  let cortexContext;
  if (cortex.isEnabled()) {
    try {
      logs.push(`[${new Date().toISOString()}] Querying Cortex for context...`);
      const evidence = await gatherEvidence(task.task, task.repo, {
        useCache: true,
        cacheTTLMinutes: 60,
      });
      cortexContext = await cortex.getCortexContext({
        task: task.task,
        evidence,
        includeRelatedKnowledge: true,
      });
      logs.push(`[${new Date().toISOString()}] Cortex: Found ${cortexContext.playbooks.length} playbooks, ${cortexContext.workflows.length} workflows`);
    } catch (error) {
      logs.push(`[${new Date().toISOString()}] Warning: Failed to get Cortex context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  try {
    logs.push(`[${new Date().toISOString()}] Executing agent pipeline...`);
    await runFreeAgent({
      repo: task.repo,
      task: task.task,
      kind: task.kind,
      tier: task.tier,
      quality: task.quality,
    });
    logs.push(`[${new Date().toISOString()}] Agent pipeline completed successfully`);
  } catch (error) {
    success = false;
    errorMessage = error instanceof Error ? error.message : String(error);
    errorStack = error instanceof Error ? error.stack : undefined;
    errorType = error instanceof Error ? error.name : 'Error';
    logs.push(`[${new Date().toISOString()}] ERROR: Agent pipeline failed: ${errorMessage}`);
  }

  // Record event in RAD if enabled
  const radClient = getRadClient();
  if (radClient.isEnabled()) {
    try {
      logs.push(`[${new Date().toISOString()}] Recording event in RAD...`);
      const eventResult = await radClient.recordEvent(
        {
          repoId: task.repo,
          taskDescription: task.task,
          taskKind: task.kind,
          agentTier: task.tier || 'free',
          success,
          errorMessage,
        },
        [], // TODO: Extract decisions from planning phase
        [] // TODO: Extract lessons from execution
      );
      // Get task ID from RAD for Cortex artifact recording
      if (eventResult?.taskId) {
        taskId = eventResult.taskId;
        logs.push(`[${new Date().toISOString()}] RAD event recorded with task ID: ${taskId}`);
      }
    } catch (radError) {
      logs.push(`[${new Date().toISOString()}] Warning: Failed to record RAD event: ${radError instanceof Error ? radError.message : String(radError)}`);
    }
  }

  // Record outcome in Cortex (saves artifacts)
  if (cortex.isEnabled() && taskId) {
    try {
      logs.push(`[${new Date().toISOString()}] Recording outcome in Cortex...`);
      await cortex.recordOutcome({
        taskId,
        success,
        planningArtifacts,
        executionArtifacts,
        errorMessage,
      });
      logs.push(`[${new Date().toISOString()}] Cortex outcome recorded`);
    } catch (cortexError) {
      logs.push(`[${new Date().toISOString()}] Warning: Failed to record Cortex outcome: ${cortexError instanceof Error ? cortexError.message : String(cortexError)}`);
    }
  }

  const timingMs = Date.now() - started;
  logs.push(`[${new Date().toISOString()}] Task completed in ${timingMs}ms with status: ${success ? 'success' : 'failed'}`);

  // Return comprehensive result
  if (success) {
    return {
      status: 'success',
      output: 'Task completed successfully', // TODO: Extract actual output from pipeline
      logs,
      timingMs,
      model: task.tier === 'paid' ? 'paid-model' : 'ollama-local',
      taskDescription: task.task,
      meta: {
        agentType: task.tier || 'free',
        taskId,
        repo: task.repo,
        kind: task.kind,
        quality: task.quality,
      },
      success: true, // Legacy field
    };
  } else {
    return {
      status: 'failed',
      logs,
      timingMs,
      model: task.tier === 'paid' ? 'paid-model' : 'ollama-local',
      taskDescription: task.task,
      meta: {
        agentType: task.tier || 'free',
        taskId,
        repo: task.repo,
        kind: task.kind,
        quality: task.quality,
      },
      error: {
        message: errorMessage || 'Unknown error in Agent Core',
        stack: errorStack,
        type: errorType || 'Error',
        context: {
          repo: task.repo,
          task: task.task,
          kind: task.kind,
          tier: task.tier,
        },
      },
      success: false, // Legacy field
    };
  }
}

