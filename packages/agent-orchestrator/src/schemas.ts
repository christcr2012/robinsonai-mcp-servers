import { z } from "zod";

export const WorkStep = z.object({
  name: z.string(),
  description: z.string(),
  files: z.array(z.string()).default([]),
  tool: z.string(),
  params: z.record(z.any()).default({}),
  successSignals: z.array(z.string()).default([]),
  costHintUSD: z.number().optional()
});

export const WorkPlan = z.object({
  goal: z.string(),
  repo: z.string().default("current"),
  steps: z.array(WorkStep).min(1),
  parallelism: z.number().default(2)
});

export type TWorkPlan = z.infer<typeof WorkPlan>;
export type TWorkStep = z.infer<typeof WorkStep>;

