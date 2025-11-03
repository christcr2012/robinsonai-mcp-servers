import { MCPClient } from "./mcpClient.js";
import { WorkPlan, TWorkPlan } from "./schemas.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { recordExecution, getStats, findSimilarExecutions, getInsights } from "./history.js";
import { analyzeAndSelectModels, estimateTask, getAPIKeyRecommendation, type ModelSelectionStrategy } from "./meta-planner.js";

// Get repo root for local package paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..", "..");
const NODE = process.execPath;

// Lazy initialization - create clients when needed (after env vars are loaded)
let ARCH: MCPClient;
let THINK: MCPClient;
let OPT: MCPClient;
let FREE: MCPClient;
let PAID: MCPClient;
let RTK: MCPClient;

function initClients() {
  if (ARCH) return; // Already initialized

  // Use local paths for unpublished packages
  // Pass ALL necessary env vars to each server
  ARCH = new MCPClient("architect", NODE, [join(REPO_ROOT, "packages/architect-mcp/dist/index.js")], {
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    ARCHITECT_FAST_MODEL: process.env.ARCHITECT_FAST_MODEL,
    ARCHITECT_STD_MODEL: process.env.ARCHITECT_STD_MODEL,
    ARCHITECT_BIG_MODEL: process.env.ARCHITECT_BIG_MODEL
  });

  THINK = new MCPClient("thinking-tools", NODE, [join(REPO_ROOT, "packages/thinking-tools-mcp/dist/index.js")]);

  OPT = new MCPClient("credit-optimizer", NODE, [join(REPO_ROOT, "packages/credit-optimizer-mcp/dist/index.js")], {
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL
  });

  FREE = new MCPClient("free-agent", NODE, [join(REPO_ROOT, "packages/free-agent-mcp/dist/index.js")], {
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    MAX_OLLAMA_CONCURRENCY: process.env.MAX_OLLAMA_CONCURRENCY
  });

  PAID = new MCPClient("paid-agent", NODE, [join(REPO_ROOT, "packages/paid-agent-mcp/dist/index.js")], {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    MONTHLY_BUDGET: process.env.MONTHLY_BUDGET,
    MAX_OPENAI_CONCURRENCY: process.env.MAX_OPENAI_CONCURRENCY
  });

  RTK = new MCPClient("toolkit", NODE, [join(REPO_ROOT, "packages/robinsons-toolkit-mcp/dist/index.js")], {
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    VERCEL_TOKEN: process.env.VERCEL_TOKEN,
    NEON_API_KEY: process.env.NEON_API_KEY,
    UPSTASH_API_KEY: process.env.UPSTASH_API_KEY,
    GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    GOOGLE_USER_EMAIL: process.env.GOOGLE_USER_EMAIL
  });
}

async function startAll() {
  initClients(); // Initialize clients with current env vars
  console.log("[Orchestrator] Starting all MCP servers...");
  await Promise.all([ARCH.start(), THINK.start(), OPT.start(), FREE.start(), PAID.start(), RTK.start()]);
  console.log("[Orchestrator] All servers ready");
}

/**
 * Validate that a step's result actually accomplished what was intended.
 * Checks for success signals in the result.
 */
async function validateStepResult(step: any, result: any): Promise<boolean> {
  // If no success signals defined, assume success
  if (!step.successSignals || step.successSignals.length === 0) {
    return true;
  }

  // Convert result to string for searching (case-insensitive)
  const resultStr = (typeof result === 'string'
    ? result
    : JSON.stringify(result)).toLowerCase();

  // Check if ANY success signal is present (case-insensitive, flexible matching)
  for (const signal of step.successSignals) {
    const signalLower = signal.toLowerCase();

    // Exact match
    if (resultStr.includes(signalLower)) {
      console.log(`[Orchestrator] ✅ Found success signal: "${signal}"`);
      return true;
    }

    // Partial word match (e.g., "completed" matches "complete")
    const words = signalLower.split(/\s+/);
    if (words.every((word: string) => resultStr.includes(word))) {
      console.log(`[Orchestrator] ✅ Found success signal (partial): "${signal}"`);
      return true;
    }
  }

  // Check for common success indicators even if not in signals
  const commonSuccessPatterns = [
    /success/i,
    /completed/i,
    /done/i,
    /finished/i,
    /created/i,
    /updated/i,
    /modified/i,
    /generated/i
  ];

  for (const pattern of commonSuccessPatterns) {
    if (pattern.test(resultStr)) {
      console.log(`[Orchestrator] ✅ Found common success pattern: ${pattern}`);
      return true;
    }
  }

  // No success signals found
  console.warn(`[Orchestrator] ⚠️  No success signals found. Expected one of: ${step.successSignals.join(", ")}`);
  return false;
}

/**
 * Check cache for step result to avoid re-doing work.
 * Returns cached result if found, null otherwise.
 */
async function checkStepCache(step: any): Promise<any | null> {
  try {
    // Generate cache key from step
    const cacheKey = `step:${step.tool}:${JSON.stringify(step.params)}`;

    // Check cache
    const cached = await OPT.callTool("get_cached_analysis", { key: cacheKey }, 5000);

    if (cached && !cached.error && cached.data) {
      console.log(`[Orchestrator] 💾 Cache HIT: ${step.name}`);
      return cached.data;
    }

    return null;
  } catch (e) {
    // Cache miss or error - continue without cache
    return null;
  }
}

/**
 * Cache step result for future use.
 */
async function cacheStepResult(step: any, result: any): Promise<void> {
  try {
    // Generate cache key from step
    const cacheKey = `step:${step.tool}:${JSON.stringify(step.params)}`;

    // Cache result (1 hour TTL)
    await OPT.callTool("cache_analysis", {
      key: cacheKey,
      data: result,
      ttl: 3600000 // 1 hour
    }, 5000);

    console.log(`[Orchestrator] 💾 Cached result for: ${step.name}`);
  } catch (e) {
    // Cache error - log but don't fail
    console.warn(`[Orchestrator] ⚠️  Failed to cache result:`, e);
  }
}

function cheapestWorkerFor(step:any, estimate:number|null, strategy?: ModelSelectionStrategy | null){
  // If Meta-Planner provided a strategy, use it
  if (strategy?.orchestrator.useAI) {
    // TODO: Call GPT-4o-mini to analyze this specific step
    // For now, use escalation rules from strategy
    const stepComplexity = estimateStepComplexity(step);
    const recommendedModel = strategy.workers.escalationRules[stepComplexity];

    if (recommendedModel === 'ollama') {
      return FREE;
    } else {
      return PAID;
    }
  }

  // Fallback: Simple router using hardcoded rules
  const heavy = /analy(z|s)e\s+1000|massive|o1|gpt-4|claude/i.test(step.name + " " + step.description);
  return heavy ? PAID : FREE;
}

function estimateStepComplexity(step: any): 'simple' | 'medium' | 'complex' | 'critical' {
  const text = (step.name + " " + step.description).toLowerCase();

  if (text.includes('critical') || text.includes('security') || text.includes('production')) {
    return 'critical';
  } else if (text.includes('complex') || text.includes('architecture') || text.includes('design')) {
    return 'complex';
  } else if (text.includes('simple') || text.includes('basic') || text.includes('boilerplate')) {
    return 'simple';
  } else {
    return 'medium';
  }
}

/**
 * Pre-warm Ollama models to avoid cold start delays
 */
async function prewarmOllamaModels() {
  const defaultModel = process.env.DEFAULT_OLLAMA_MODEL || "qwen2.5-coder:7b";

  try {
    console.log(`[Orchestrator] 🔥 Pre-warming Ollama model: ${defaultModel}...`);

    // Make a simple request to load the model into memory
    await FREE.callTool("execute_versatile_task_autonomous-agent-mcp_free-agent-mcp", {
      task: "echo 'warmup'",
      taskType: "code_generation",
      params: {}
    }, 30000); // 30 second timeout for warmup

    console.log(`[Orchestrator] ✅ Ollama model pre-warmed and ready`);
  } catch (e) {
    console.warn(`[Orchestrator] ⚠️  Failed to pre-warm Ollama (will use on-demand loading):`, e);
  }
}

export async function runUserTask(userPrompt: string) {
  await startAll();

  // 0) Meta-Planner: Intelligently decide which models to use
  console.log("[Orchestrator] 🧠 Meta-Planner: Analyzing task and selecting models...");
  const taskAnalysis = estimateTask(userPrompt);
  console.log(`[Orchestrator] 📊 Task Analysis: ${taskAnalysis.estimatedSteps} steps, ${taskAnalysis.estimatedComplexity} complexity`);

  let modelStrategy: ModelSelectionStrategy | null = null;
  const useMetaPlanner = process.env.USE_META_PLANNER !== 'false'; // Default: enabled

  if (useMetaPlanner) {
    try {
      modelStrategy = await analyzeAndSelectModels(taskAnalysis);
      console.log(`[Orchestrator] ✅ Meta-Planner Strategy:`);
      console.log(`[Orchestrator]   - Architect: ${modelStrategy.architect.model} ($${modelStrategy.architect.estimatedCost.toFixed(3)})`);
      console.log(`[Orchestrator]   - Orchestrator: ${modelStrategy.orchestrator.useAI ? modelStrategy.orchestrator.model : 'hardcoded rules'} ($${modelStrategy.orchestrator.totalCost.toFixed(3)})`);
      console.log(`[Orchestrator]   - Workers: ${modelStrategy.workers.defaultModel} default ($${modelStrategy.workers.estimatedCost.toFixed(2)})`);
      console.log(`[Orchestrator]   - Total: $${modelStrategy.summary.totalEstimatedCost.toFixed(3)} (saves $${modelStrategy.summary.expectedSavings.toFixed(2)})`);

      // Check if user needs to set up API keys
      const apiKeyRec = getAPIKeyRecommendation(modelStrategy);
      if (apiKeyRec) {
        console.log(`\n[Orchestrator] ${apiKeyRec.message}`);
        console.log(`[Orchestrator] 💡 Would you like to set up these API keys now for better performance?`);
      }
    } catch (e: any) {
      console.warn(`[Orchestrator] ⚠️  Meta-Planner failed, using defaults:`, e.message);
    }
  } else {
    console.log(`[Orchestrator] ⚙️  Meta-Planner disabled (USE_META_PLANNER=false)`);
  }

  // Pre-warm Ollama models in background (don't wait)
  prewarmOllamaModels().catch(() => {});

  const startTime = Date.now();
  let totalCost = 0;
  let totalRetries = 0;
  let cachedSteps = 0;
  const errors: string[] = [];

  // Check for similar past executions to learn from
  const similar = findSimilarExecutions(userPrompt);
  if (similar.length > 0) {
    console.log(`[Orchestrator] 📚 Found ${similar.length} similar past executions`);
    const successfulSimilar = similar.filter((s: any) => s.success === 1);
    if (successfulSimilar.length > 0) {
      console.log(`[Orchestrator] ✅ ${successfulSimilar.length} were successful`);
    }
  }

  // 1) Get plan from Architect (tool discovery; find 'plan' generator)
  console.log("[Orchestrator] Requesting plan from Architect...");
  const planTool = (await ARCH.findTool(/plan.*work|create.*plan|generate.*plan/i)) || "plan_work";
  const planRaw = await ARCH.callTool(planTool, { goal: userPrompt, mode: "autonomous" });

  console.log("[Orchestrator] Raw plan response:", JSON.stringify(planRaw, null, 2));

  // Handle async planning
  let plan: TWorkPlan;
  if (planRaw?.plan_id) {
    console.log(`[Orchestrator] Plan ${planRaw.plan_id} created, waiting for completion...`);
    const statusTool = await ARCH.findTool(/plan.*status|get.*plan/i);
    let status = await ARCH.callTool(statusTool!, { plan_id: planRaw.plan_id });
    console.log("[Orchestrator] Initial status:", JSON.stringify(status, null, 2));

    let attempts = 0;
    while (status?.state !== "done" && status?.state !== "error" && attempts < 60) {
      await new Promise(r => setTimeout(r, 2000));
      status = await ARCH.callTool(statusTool!, { plan_id: planRaw.plan_id });
      console.log(`[Orchestrator] Status check ${attempts + 1}: state=${status?.state}, progress=${status?.progress}%, steps=${status?.steps_count}`);
      attempts++;
    }

    if (status?.state === "error" || status?.state === "failed") {
      throw new Error(`Plan failed: ${status.error}`);
    }

    if (attempts >= 60) {
      throw new Error(`Plan timeout after 120 seconds`);
    }

    // Get plan chunks
    const chunkTool = await ARCH.findTool(/^get_plan_chunk$/i);
    const chunk = await ARCH.callTool(chunkTool!, { plan_id: planRaw.plan_id, from: 0, size: 100 });
    console.log("[Orchestrator] Plan chunk:", JSON.stringify(chunk, null, 2));

    // Transform architect's format (title) to orchestrator's format (name, description)
    const steps = (chunk.steps || []).map((s: any) => ({
      name: s.name || s.title || "Unnamed step",
      description: s.description || s.title || "No description",
      files: s.files || [],
      tool: s.tool || "",
      params: s.params || {},
      successSignals: s.successSignals || [],
      costHintUSD: s.costHintUSD
    }));

    plan = WorkPlan.parse({ goal: userPrompt, steps, parallelism: 2 });
  } else {
    plan = WorkPlan.parse(typeof planRaw === "string" ? JSON.parse(planRaw) : planRaw);
  }

  console.log(`[Orchestrator] Plan received: ${plan.steps.length} steps`);

  // 2) Validate with Thinking Tools (e.g., premortem/SWOT)
  console.log("[Orchestrator] Validating plan with Thinking Tools...");
  const validateTool = (await THINK.findTool(/devils.*advocate|premortem|swot/i)) || (await THINK.findTool(/critical.*thinking/i));
  if (validateTool) {
    const validation = await THINK.callTool(validateTool, { context: JSON.stringify(plan), goal: userPrompt });
    console.log("[Orchestrator] Validation:", validation?.challenges?.length || 0, "challenges found");
  }

  // 3) Ask Optimizer for cost estimate + budget decision
  console.log("[Orchestrator] Getting cost estimate from Optimizer...");
  const estimateTool = (await OPT.findTool(/estimate.*cost|cost.*estimate/i)) || "estimate_task_cost";
  const est = await OPT.callTool(estimateTool, { taskType: "code_generation", complexity: "medium", numFiles: plan.steps.length });
  console.log(`[Orchestrator] Estimated cost: $${est?.estimatedCost || 0}`);

  // Start cost tracking
  const taskId = `task_${Date.now()}`;
  try {
    await OPT.callTool("record_task_cost", {
      taskId,
      taskType: "orchestration",
      estimatedCost: est?.estimatedCost || 0,
      workerUsed: "orchestrator",
      complexity: "medium",
      numFiles: plan.steps.length
    }, 5000);
    console.log(`[Orchestrator] 💰 Started cost tracking: ${taskId}`);
  } catch (e) {
    console.warn(`[Orchestrator] ⚠️  Failed to start cost tracking:`, e);
  }

  // 4) Query agent pool capacity and auto-scale parallelism
  let agentPoolStats: any = null;
  try {
    agentPoolStats = await OPT.callTool("get_agent_pool_stats", {}, 5000);
    console.log(`[Orchestrator] 🤖 Agent Pool: ${agentPoolStats.total} total (${agentPoolStats.free} FREE, ${agentPoolStats.paid} PAID)`);
    console.log(`[Orchestrator] 📊 Availability: ${agentPoolStats.available} available, ${agentPoolStats.busy} busy`);
  } catch (e) {
    console.warn(`[Orchestrator] ⚠️  Could not query agent pool, using default parallelism`);
  }

  // Auto-scale parallelism based on available agents
  let maxPar: number;
  if (agentPoolStats) {
    // Use all available agents, but cap at total agent count
    maxPar = Math.min(agentPoolStats.total, plan.steps.length);
    console.log(`[Orchestrator] 🚀 Auto-scaled parallelism: ${maxPar} (using all ${agentPoolStats.total} agents)`);
  } else {
    // Fallback to plan's parallelism setting
    maxPar = Math.max(1, Math.min(6, plan.parallelism));
    console.log(`[Orchestrator] ⚙️  Using default parallelism: ${maxPar}`);
  }

  console.log(`[Orchestrator] Executing ${plan.steps.length} steps (parallelism: ${maxPar})...`);

  type StepResult = {success: boolean; stepIndex: number; result: any; validated: boolean; agent?: string};
  let inFlight: Promise<StepResult>[] = [];
  const results: StepResult[] = [];
  let completedSteps = 0;

  // Progress reporting with agent stats
  const reportProgress = () => {
    const validated = results.filter(r => r.success && r.validated).length;
    const unvalidated = results.filter(r => r.success && !r.validated).length;
    const failed = results.filter(r => !r.success).length;
    const freeAgentResults = results.filter(r => r.agent?.includes('free')).length;
    const paidAgentResults = results.filter(r => r.agent?.includes('paid')).length;
    console.log(`[Orchestrator] 📊 Progress: ${completedSteps}/${plan.steps.length} steps | ✅ ${validated} validated | ⚠️  ${unvalidated} unvalidated | ❌ ${failed} failed | 🆓 ${freeAgentResults} FREE | 💰 ${paidAgentResults} PAID`);
  };

  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    const exec = async (): Promise<StepResult> => {
      console.log(`[Orchestrator] Step ${i+1}/${plan.steps.length}: ${step.name}`);

      // 4a) Check cache first
      const cachedResult = await checkStepCache(step);
      if (cachedResult) {
        console.log(`[Orchestrator] ✅ Using cached result for step ${i+1}`);
        cachedSteps++;
        return { success: true, stepIndex: i, result: cachedResult, validated: true, agent: 'cache' };
      }

      // 4b) Execute with retry logic
      const maxRetries = 3;
      let lastError: any = null;
      let skipOllama = false; // Skip Ollama if it times out

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          // Choose worker (FREE by default, PAID for heavy tasks, retries, or if Ollama timed out)
          const usePaid = attempt > 1 || skipOllama; // Use paid worker for retries or after Ollama timeout
          const worker = usePaid ? PAID : cheapestWorkerFor(step, est?.perStep?.[step.name] ?? null, modelStrategy);
          const workerName = worker === PAID ? "paid-agent" : "free-agent";

          if (attempt > 1) {
            console.log(`[Orchestrator] 🔄 Retry ${attempt}/${maxRetries} for step ${i+1} (using ${workerName}${skipOllama ? ' - Ollama skipped due to timeout' : ''})`);
            totalRetries++;
          }

          // Select a concrete tool on the worker
          const toolName = (await worker.findTool(new RegExp(step.tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))))
            || (await worker.findTool(/execute.*versatile|delegate.*code/i))
            || step.tool;

          const res = await worker.callTool(toolName, {
            task: step.description || step.params?.task || step.name,
            taskType: step.params?.taskType || "code_generation",  // Preserve original taskType!
            params: { files: step.files, ...step.params },
            forcePaid: usePaid  // Force PAID OpenAI on retries (bypass Ollama)
          }, 5 * 60_000);

          // Validate result
          const validated = await validateStepResult(step, res);

          if (validated) {
            console.log(`[Orchestrator] ✅ Step ${i+1} completed and validated${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);

            // Cache successful result
            await cacheStepResult(step, res);

            // Update progress
            completedSteps++;
            reportProgress();

            return { success: true, stepIndex: i, result: res, validated, agent: workerName };
          } else {
            console.warn(`[Orchestrator] ⚠️  Step ${i+1} completed but validation failed (attempt ${attempt}/${maxRetries})`);
            lastError = new Error("Validation failed");

            // If validation failed and we have retries left, continue to next attempt
            if (attempt < maxRetries) {
              continue;
            }

            // Last attempt failed validation - return unvalidated result (don't cache)
            completedSteps++;
            reportProgress();
            return { success: true, stepIndex: i, result: res, validated: false };
          }
        } catch (e: any) {
          lastError = e;
          console.error(`[Orchestrator] ❌ Step ${i+1} failed (attempt ${attempt}/${maxRetries}):`, e.message);

          // If timeout error, skip Ollama on next retry
          if (e.message?.includes('timeout') || e.message?.includes('timed out')) {
            skipOllama = true;
            console.log(`[Orchestrator] ⏱️  Timeout detected - will use PAID worker on next retry`);
          }

          // If we have retries left, continue to next attempt
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
            continue;
          }
        }
      }

      // All retries exhausted - return failure
      console.error(`[Orchestrator] 💥 Step ${i+1} failed after ${maxRetries} attempts`);
      completedSteps++;
      reportProgress();
      return { success: false, stepIndex: i, result: null, validated: false };
    };

    inFlight.push(exec());
    if (inFlight.length >= maxPar) {
      const completed = await Promise.race(inFlight);
      results.push(completed);
      inFlight = inFlight.filter((p: any) => {
        const state = (p as any).status;
        return state !== "fulfilled" && state !== "rejected";
      });
    }
  }

  const remaining = await Promise.allSettled(inFlight);
  remaining.forEach(r => {
    if (r.status === "fulfilled") results.push(r.value);
  });

  // 5) Analyze results
  const successful = results.filter(r => r.success && r.validated).length;
  const failed = results.filter(r => !r.success).length;
  const unvalidated = results.filter(r => r.success && !r.validated).length;

  // Collect errors
  results.forEach(r => {
    if (!r.success && r.result?.error) {
      errors.push(r.result.error);
    }
  });

  console.log(`[Orchestrator] Task complete! ✅ ${successful} validated, ⚠️  ${unvalidated} unvalidated, ❌ ${failed} failed`);

  // Calculate total cost and duration
  const duration = Date.now() - startTime;
  totalCost = Number(est?.estimatedCost ?? 0);

  // Record execution in history
  recordExecution({
    task: userPrompt,
    plan,
    results,
    success: failed === 0,
    duration,
    cost: totalCost,
    errors,
    timestamp: Date.now(),
    workerUsed: 'orchestrator',
    retries: totalRetries,
    cachedSteps
  });

  // Show insights from history
  const insights = getInsights();
  console.log(`[Orchestrator] 📊 History insights: ${insights.avgRetries.toFixed(1)} avg retries, ${insights.cacheHitRate.toFixed(1)}% cache hit rate`);

  // Complete cost tracking
  try {
    await OPT.callTool("complete_task_cost", { taskId }, 5000);
    console.log(`[Orchestrator] 💰 Completed cost tracking: ${taskId}`);

    // Get cost analytics
    const analytics = await OPT.callTool("get_cost_analytics", {}, 5000);
    if (analytics) {
      console.log(`[Orchestrator] 💰 Total spend this month: $${analytics.totalSpend?.toFixed(2) || 0}`);
    }
  } catch (e) {
    console.warn(`[Orchestrator] ⚠️  Failed to complete cost tracking:`, e);
  }

  return {
    success: failed === 0,
    estimateUSD: totalCost,
    duration,
    results: {
      total: plan.steps.length,
      successful,
      failed,
      unvalidated,
      cached: cachedSteps,
      retries: totalRetries
    }
  };
}

