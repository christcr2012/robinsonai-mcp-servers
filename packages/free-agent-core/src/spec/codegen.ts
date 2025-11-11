import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { generateFromRegistry } from "./generator.js";

export async function ensureCodegen({
  registry,
  outDir,
}: {
  registry?: string;
  outDir?: string;
}): Promise<void> {
  if (!registry) {
    console.warn(
      `[Codegen] No spec registry. Set FREE_AGENT_SPEC or provide adapter.specRegistry`
    );
    return;
  }

  console.log(`[Codegen] Loading spec from: ${registry}`);

  let spec: any;

  // Load from URL or file
  if (registry.startsWith("http://") || registry.startsWith("https://")) {
    console.log(`[Codegen] Fetching from URL...`);
    const res = await fetch(registry);
    spec = await res.json();
  } else {
    console.log(`[Codegen] Reading from file...`);
    spec = JSON.parse(readFileSync(registry, "utf8"));
  }

  const code = generateFromRegistry(spec);

  const dir = outDir || mkdtempSync(join(tmpdir(), "fa-gen-"));
  mkdirSync(dir, { recursive: true });

  const outPath = join(dir, "handlers.generated.ts");
  writeFileSync(outPath, code);

  console.log(`[Codegen] Generated handlers → ${outPath}`);

  // Expose path via env so adapters can import/require it
  process.env.FREE_AGENT_GENERATED_HANDLERS = outPath;
}

