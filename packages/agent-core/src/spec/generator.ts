/**
 * Generate TypeScript handlers from a spec registry
 * Repo-agnostic: works with any registry format
 */

export function generateFromRegistry(reg: any): string {
  const lines = [
    `/* AUTO-GENERATED (repo-agnostic) — DO NOT EDIT BY HAND */`,
    `export type Handler<I = any, O = any> = (i: I) => Promise<O>;`,
    ``,
    `async function http(u: string, m = 'GET', q?: any, b?: any) {`,
    `  const url = new URL(u);`,
    `  if (q) Object.entries(q).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));`,
    `  const r = await fetch(url.toString(), {`,
    `    method: m,`,
    `    headers: { 'content-type': 'application/json' },`,
    `    body: b ? JSON.stringify(b) : undefined`,
    `  });`,
    `  const t = await r.text();`,
    `  try { return JSON.parse(t); } catch { return t; }`,
    `}`,
    ``,
  ];

  // Generate handlers from services
  const services = reg.services || {};
  for (const [svc, s] of Object.entries<any>(services)) {
    const base = s.baseEnv
      ? `process.env.${s.baseEnv} || "${s.defaultBase}"`
      : `"${s.defaultBase}"`;

    const endpoints = s.endpoints || {};
    for (const [name, ep] of Object.entries<any>(endpoints)) {
      const fn = name.replace(/[^a-zA-Z0-9_]/g, "_");
      const path =
        ep.pathParams && ep.pathParams.length > 0
          ? "`" + ep.path.replace(/\{(\w+)\}/g, "${i.$path.$1}") + "`"
          : `"${ep.path}"`;

      const method = ep.method || "GET";
      const hasQuery = ep.query ? "i.$query" : "undefined";
      const hasBody = ep.input ? "i.$body" : "undefined";

      lines.push(
        `export const ${fn}: Handler<any, any> = async (i: any) => http(new URL(${path}, ${base}).toString(), "${method}", ${hasQuery}, ${hasBody});`
      );
    }
  }

  return lines.join("\n");
}

