import { PatternContract } from "./contract";

export function enforceContractOnDiff(diff: string, contract: PatternContract): void {
  const violations: string[] = [];

  // 1) Validate file placement: new/modified files must live under layout.baseDir
  const fileHeaders = diff
    .split(/^diff --git/m)
    .slice(1)
    .map(c => (c.match(/\+\+\+ b\/(.+)\n/) || [])[1])
    .filter(Boolean);

  for (const f of fileHeaders) {
    if (!f.startsWith(contract.layout.baseDir + "/") && !f.startsWith("test") && !f.endsWith(".md")) {
      violations.push(`Contract violation: file outside baseDir (${contract.layout.baseDir}): ${f}`);
    }
  }

  // 2) Parse added lines per file and check for containers/wrappers/any/placeholder
  const chunks = diff.split(/^diff --git/m).slice(1);
  for (const c of chunks) {
    const file = (c.match(/\+\+\+ b\/(.+)\n/) || [])[1];
    if (!file) continue;
    const added = c
      .split("\n")
      .filter(l => l.startsWith("+") && !l.startsWith("+++"))
      .map(l => l.slice(1))
      .join("\n");
    if (!added.trim()) continue;

    // Forbid strings
    for (const bad of contract.forbid) {
      if (new RegExp(bad, "i").test(added)) {
        violations.push(`Contract violation: contains "${bad}" in ${file}`);
      }
    }

    // TypeScript 'any' (quick scan)
    if (/\bany\b(?!\s*=>)/.test(added)) {
      violations.push(`Contract violation: TypeScript 'any' in ${file}`);
    }

    // Wrapper usage (if any wrapper is marked mustUse, assert presence when calling http/fetch)
    const usesHttp = /\b(fetch|http|axios)\s*\(/.test(added);
    const must = contract.wrappers.filter(w => w.mustUse);
    if (usesHttp && must.length) {
      const ok = must.some(w => new RegExp(`\\b${w.name}\\s*\\(`).test(added));
      if (!ok) {
        violations.push(
          `Contract violation: must use wrapper ${must.map(w => w.name).join(" or ")} instead of raw fetch/http in ${file}`
        );
      }
    }

    // Container enforcement (if repo prefers class container)
    const wantsClass = contract.containers.some(c => c.kind === "class");
    if (wantsClass && /(export\s+function|const\s+\w+\s*=\s*\()/m.test(added) && /class\s+\w+/.test(added) === false) {
      // If project uses container classes, discourage standalone functions
      // (soft warning for now)
    }
  }

  if (violations.length > 0) {
    throw new Error("Contract violations:\n" + violations.join("\n"));
  }
}

