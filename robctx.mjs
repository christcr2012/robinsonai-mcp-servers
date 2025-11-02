#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const CWD = process.cwd();
const OUT_DIR = join(CWD, ".robctx");
const MODE = process.argv.includes("preview") ? "preview" : "index";
const INCLUDE = process.env.CTX_INCLUDE?.split(",").map(s=>s.trim()).filter(Boolean) ?? ["**/*"];
const EXTSET = new Set((process.env.CTX_EXT || "ts,tsx,js,jsx,json,md,sql,yml,yaml,ini,env,ps1,sh,py").split(",").map(s=>s.trim().replace(/^\./,"")));

function sh(cmd, args) {
  return spawnSync(cmd, args, { cwd: CWD, encoding: "utf-8" });
}

function candidate(p) {
  const dot = p.lastIndexOf(".");
  if (dot === -1) return false;
  const ext = p.slice(dot+1).toLowerCase();
  return EXTSET.has(ext);
}

// 1) Try git ls-files (fast, reliable on Windows)
let files = [];
const git = sh("git", ["ls-files", "-z"]);
if (git.status === 0) {
  files = git.stdout.split("\x00").filter(Boolean).map(s=>s.replaceAll("\\","/")).filter(candidate);
} else {
  // 2) Fallback to glob if no git (lazy load)
  const { globbySync } = await import("globby");
  files = globbySync(INCLUDE, {
    cwd: CWD,
    gitignore: true,
    onlyFiles: true,
    dot: false,
  }).map(s=>s.replaceAll("\\","/")).filter(candidate);
}

const sample = files.slice(0, 20);
const report = [
  `Repo: ${CWD}`,
  `Total matched files: ${files.length}`,
  `Sample files (first ${sample.length}):`,
  ...sample.map(s=>" - "+s),
  ""
].join("\n");

await import("node:fs/promises").then(fs=>fs.mkdir(OUT_DIR, { recursive: true }));
writeFileSync(join(OUT_DIR, "context_index.json"), JSON.stringify({ files }, null, 2));
writeFileSync(join(OUT_DIR, "CONTEXT_AUDIT.md"), report, "utf8");

if (MODE === "preview") {
  console.log(report);
} else {
  console.log(`Wrote ${files.length} entries to .robctx/context_index.json`);
}

