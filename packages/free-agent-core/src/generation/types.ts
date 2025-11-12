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
  quality?: "fast" | "balanced" | "best";
}

export interface DiffGenerator {
  name: string;
  generate(input: GenInput): Promise<string>; // returns a unified diff
}

