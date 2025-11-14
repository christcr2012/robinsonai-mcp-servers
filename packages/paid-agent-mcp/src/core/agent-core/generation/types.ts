import { PatternContract } from "../patterns/contract.js";

export interface Example {
  path: string;
  content: string;
}

export interface FileTarget {
  path: string;
  container?: {
    kind: "class" | "module" | "function";
    name: string;
  };
}

export interface GenInput {
  repo: string;
  task: string;
  contract: PatternContract;
  examples: Example[];
  targets?: FileTarget[];
  tier?: "free" | "paid";
  quality?: "fast" | "balanced" | "best" | "auto";
}

export interface DiffGenerator {
  name: string;
  generate(input: GenInput): Promise<string>; // returns a unified diff
}

// New types for the generator module system
export interface GenRequest {
  repo: string;
  task: string;
  quality?: "fast" | "safe" | "balanced" | "best" | "auto";
  kind?: "feature" | "bugfix" | "refactor" | "research";
  tier?: "free" | "paid";
  patternContract?: PatternContract;
  examples?: Example[];
  targets?: FileTarget[];
}

export interface GenResult {
  diff: string;
  meta?: Record<string, any>;
}

export interface Generator {
  generate(req: GenRequest): Promise<GenResult>;
}

export interface GeneratorFactory {
  (deps?: Record<string, any>): Generator;
}

