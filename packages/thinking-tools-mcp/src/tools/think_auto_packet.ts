// packages/thinking-tools-mcp/src/tools/think_auto_packet.ts
import { promises as fs } from "fs";
import { resolve, dirname } from "path";
import { normalize, resolveWorkspaceRoot } from "../lib/workspace.js";

type PacketInput = {
  slug: string;               // e.g., "swot--robinson-mcp"
  sections: Record<string,string>; // { "Summary": "...", "Findings": "..." }
};

export async function think_auto_packet(input: PacketInput) {
  const root = resolveWorkspaceRoot();
  const base = resolve(root, ".robctx/thinking");
  const file = resolve(base, `${input.slug}.md`);

  await fs.mkdir(dirname(file), { recursive: true });

  const body =
    `# ${input.slug}\n\n` +
    Object.entries(input.sections || {})
      .map(([k, v]) => `## ${k}\n\n${v}\n`)
      .join("\n");

  await fs.writeFile(file, body, "utf8");

  // validate
  let ok = true;
  try {
    const s = await fs.stat(file);
    ok = s.size > 0;
  } catch {
    ok = false;
  }

  return {
    ok,
    root: normalize(root),
    file: normalize(file),
    message: ok ? "Packet created." : "Failed to create packet.",
  };
}

