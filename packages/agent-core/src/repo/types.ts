import { PatternContract } from "../patterns/contract.js";
import { Example } from "../patterns/examples.js";

export type Cmds = {
  eslint?: string;
  tsc?: string;
  tests?: string;
  install?: string;
  build?: string;
};

export type Adapter = {
  name: string;
  cmd: Cmds;
  specRegistry?: string;
  codegenOutDir?: string;
  prepare(repo: string): Promise<void>;
  run(repo: string, cmd: string): Promise<{ code: number; out: string }>;
  synthesize(args: {
    repo: string;
    task: string;
    kind: string;
    contract?: PatternContract;
    exemplars?: Example[];
    tier?: "free" | "paid";
    quality?: "fast" | "balanced" | "best";
  }): Promise<{ diff: string }>;
  refine(args: {
    repo: string;
    task: string;
    diagnostics: any;
    lastDiff: string;
    contract?: PatternContract;
    exemplars?: Example[];
    tier?: "free" | "paid";
    quality?: "fast" | "balanced" | "best";
  }): Promise<{ diff: string }>;
  applyPatch(repo: string, unifiedDiff: string, contract?: PatternContract): Promise<void>;
};

