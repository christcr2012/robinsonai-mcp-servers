import { promises as fs } from "node:fs";
import { join } from "node:path";

type J = Record<string, any>;
type Tool = { name:string; description:string; inputSchema:J; handler:(args:J)=>Promise<J> };

export const validate_artifacts: Tool = {
  name: "think_validate_artifacts",
  description: "Validate .robctx/thinking artifacts: no '(none yet)' lines, warn on TODO/PLACEHOLDER.",
  inputSchema: { type: "object" },
  handler: async () => {
    const dir = ".robctx/thinking";
    let ok = true;
    const problems: string[] = [];
    try {
      const files = await fs.readdir(dir);
      for (const f of files) {
        if (!f.endsWith(".md")) continue;
        const t = await fs.readFile(join(dir, f), "utf8");
        if (/\(none yet\)/i.test(t)) { ok = false; problems.push(`${f}: contains '(none yet)'`); }
        if (/(TODO|PLACEHOLDER|stub)/i.test(t)) problems.push(`${f}: includes TODO/PLACEHOLDER/stub`);
      }
    } catch {
      ok = false;
      problems.push("No artifacts directory found.");
    }
    return { ok, problems };
  }
};

export function getValidationTools(){ return [validate_artifacts]; }

