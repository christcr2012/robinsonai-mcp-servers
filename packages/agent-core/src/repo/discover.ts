import { existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";

export async function discover(repo: string) {
  const base = resolve(repo);

  // Ensure .free-agent folder exists
  const fa = join(base, ".free-agent");
  try {
    if (!existsSync(fa)) {
      mkdirSync(fa, { recursive: true });
    }
  } catch (e) {
    console.warn(`[Discover] Could not create ${fa}:`, e);
  }

  return base;
}

