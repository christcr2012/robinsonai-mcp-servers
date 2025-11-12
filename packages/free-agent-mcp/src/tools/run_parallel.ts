// ESM module
import { setTimeout as sleep } from "timers/promises";

type Tier = "free" | "paid";
type Quality = "auto" | "fast" | "safe" | "best";
type CodeTask = { repo: string; task: string; kind?: "feature"|"bugfix"|"refactor"|"research"; tier?: Tier; quality?: Quality; budgetUsd?: number; };

export const run_parallel = {
  name: "run_parallel",
  description: "Run many free_agent_run jobs concurrently with backoff and progress.",
  inputSchema: {
    type: "object", required: ["tasks"],
    properties: {
      tasks: { type: "array", items: { type: "object", required: ["repo","task"],
        properties: {
          repo:{type:"string"}, task:{type:"string"},
          kind:{type:"string", enum:["feature","bugfix","refactor","research"], default:"feature"},
          tier:{type:"string", enum:["free","paid"]},
          quality:{type:"string", enum:["auto","fast","safe","best"]},
          budgetUsd:{type:"number"}
        } } },
      limit: { type: "number", default: 15 },
      jitterMs: { type: "number", default: 300 },
      dryRun: { type: "boolean", default: false }
    }
  },
  async handler(ctx:any) {
    const { tasks, limit=15, jitterMs=300, dryRun=false } = ctx.args as { tasks: CodeTask[]; limit?:number; jitterMs?:number; dryRun?:boolean; };
    if (dryRun) return { ok:true, dryRun:true, planned: tasks.length };

    const results:any[] = [], errors:any[] = [];
    let i = 0, active = 0;

    const call = (name:string, args:any) => ctx.server.callTool(name, args);
    const withRetry = async <T>(fn:()=>Promise<T>, label:string) => {
      let last:any;
      for (let a=0;a<3;a++){ try { return await fn(); } catch(e:any){ last=e; await sleep(250+Math.random()*400); } }
      throw new Error();
    };

    const runOne = async (): Promise<void> => {
      const idx = i++; if (idx >= tasks.length) return;
      active++;
      const t = tasks[idx];
      await sleep(150 + Math.random()*jitterMs); // gentle staggering

      try {
        const payload = {
          repo: t.repo,
          task: t.task,
          kind: t.kind ?? "feature",
          tier: t.tier ?? (process.env.FREE_AGENT_TIER as any) ?? "free",
          quality: t.quality ?? (process.env.FREE_AGENT_QUALITY as any) ?? "auto",
          budgetUsd: t.budgetUsd
        };
        const res = await withRetry(()=>call("free_agent_run", payload), );
        results.push({ index: idx, task: t.task, ok: true, res });
      } catch (e:any) {
        const msg   = e?.message || String(e);
        const stack = e?.stack || null;
        const detail = e?.data ?? e?.cause ?? e?.response?.data ?? e?.response ?? null;
        errors.push({ index: idx, task: t.task, ok: false, error: msg, stack, detail });
      } finally {
        active--; await runOne();
      }
    };

    await Promise.all(Array.from({length: Math.min(limit, tasks.length)}, runOne));
    return { ok: errors.length===0, completed: results.length, failed: errors.length, results, errors };
  }
};
