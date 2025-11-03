import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface RepoContext {
  root: string;
  packageManager?: "npm"|"yarn"|"pnpm"|"bun";
  frameworks: string[];
  scripts: Record<string,string>;
  tests: string[];
  docker: { dockerfile: boolean; compose: boolean; ports: number[] };
  languages: string[];
}

function safeJSON(p: string){ 
  try{ 
    return JSON.parse(readFileSync(p,"utf8")); 
  } catch { 
    return null; 
  } 
}

export function scanRepoContext(root = process.cwd()): RepoContext {
  const p = (...xs:string[]) => join(root, ...xs);
  const ctx: RepoContext = {
    root, 
    frameworks: [], 
    scripts: {}, 
    tests: [],
    docker: { 
      dockerfile: existsSync(p("Dockerfile")), 
      compose: existsSync(p("docker-compose.yml")), 
      ports: [] 
    },
    languages: []
  };
  
  // Detect languages
  if (existsSync(p("tsconfig.json"))) ctx.languages.push("ts");
  if (existsSync(p("package.json"))) ctx.languages.push("js");
  if (existsSync(p("go.mod"))) ctx.languages.push("go");
  if (existsSync(p("Cargo.toml"))) ctx.languages.push("rust");
  if (existsSync(p("requirements.txt")) || existsSync(p("pyproject.toml"))) ctx.languages.push("python");
  
  // Detect package manager
  if (existsSync(p("pnpm-lock.yaml"))) ctx.packageManager = "pnpm";
  else if (existsSync(p("yarn.lock"))) ctx.packageManager = "yarn";
  else if (existsSync(p("bun.lockb"))) ctx.packageManager = "bun";
  else if (existsSync(p("package-lock.json"))) ctx.packageManager = "npm";
  
  // Parse package.json
  if (existsSync(p("package.json"))) {
    const pkg = safeJSON(p("package.json")) || {};
    ctx.scripts = pkg.scripts || {};
    const deps = { ...(pkg.dependencies||{}), ...(pkg.devDependencies||{}) };
    
    // Detect frameworks
    if (deps["next"]) ctx.frameworks.push("next");
    if (deps["react"]) ctx.frameworks.push("react");
    if (deps["express"]) ctx.frameworks.push("express");
    if (deps["fastify"]) ctx.frameworks.push("fastify");
    if (deps["@nestjs/core"]) ctx.frameworks.push("nestjs");
    if (deps["vue"]) ctx.frameworks.push("vue");
    if (deps["svelte"]) ctx.frameworks.push("svelte");
    
    // Detect test frameworks
    if (deps["vitest"] || ctx.scripts["test"]?.includes("vitest")) ctx.tests.push("npm run test");
    else if (deps["jest"] || ctx.scripts["test"]?.includes("jest")) ctx.tests.push("npm run test");
    else if (deps["mocha"]) ctx.tests.push("npm run test");
  }
  
  // Parse docker-compose for ports
  if (ctx.docker.compose) {
    try {
      const raw = readFileSync(p("docker-compose.yml"),"utf8");
      const ports = [...raw.matchAll(/\b(\d{2,5}):(\d{2,5})\b/g)].map(m=>Number(m[2]));
      ctx.docker.ports = [...new Set(ports)];
    } catch {}
  }
  
  return ctx;
}

export function formatContextSummary(c: RepoContext){
  return [
    `PM=${c.packageManager ?? "npm"}`,
    `frameworks=${c.frameworks.join(",")||"none"}`,
    `languages=${c.languages.join(",")||"unknown"}`,
    `tests=${c.tests.join(" | ")||"none"}`,
    `docker{df=${c.docker.dockerfile} compose=${c.docker.compose} ports=[${c.docker.ports.join(",")}]}`,
    `scripts{ ${Object.entries(c.scripts).slice(0,10).map(([k,v])=>`${k}=${v}`).join(" | ")} }`
  ].join("\n");
}

