/**
 * Handler code generator
 * Reads tools.registry.json and generates typed, validated handlers
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const regPath = path.join(root, "spec/tools.registry.json");
const outPath = path.join(root, "src/handlers/handlers.generated.ts");

// Read registry
const reg = JSON.parse(fs.readFileSync(regPath, "utf8"));

/**
 * Convert mini schema to Zod expression
 */
function toZodExpr(shape: any): string {
  if (!shape) return "Z.toZod('any')";
  if (typeof shape === "string") return `Z.toZod(${JSON.stringify(shape)})`;
  return `Z.toZod(${JSON.stringify(shape)})`;
}

/**
 * Generate handler code
 */
const lines: string[] = [];

lines.push(`/* AUTO-GENERATED — DO NOT EDIT BY HAND */
import { http, HttpOptions } from "../http/client";
import { HOSTS } from "../http/hosts";
import { z as zod } from "zod";
import * as Z from "../spec/zod-from-mini";

type Handler<I = any, O = any> = (i: I) => Promise<O>;

/**
 * Wrap handler with input validation
 */
function withValidation<I>(
  schema: zod.ZodTypeAny,
  fn: Handler<I>
): Handler<I> {
  return async (raw: any) => {
    const validated = schema.parse(raw);
    return fn(validated as I);
  };
}
`);

// Generate handlers for each service
Object.entries(reg.services).forEach(([svcName, svc]: any) => {
  const baseRef = `HOSTS.${svcName}`;

  Object.entries(svc.endpoints).forEach(([key, ep]: any) => {
    const safeName = key.replace(/[^a-zA-Z0-9_]/g, "_") + "_handler";
    const pathTmpl = ep.path;
    const hasPathParams = ep.pathParams && ep.pathParams.length > 0;
    const hasQuery = !!ep.query;
    const hasInput = !!ep.input;

    // Build path expression
    let pathExpr: string;
    if (hasPathParams) {
      let pathStr = pathTmpl;
      for (const param of ep.pathParams) {
        pathStr = pathStr.replace(
          `{${param}}`,
          `\${encodeURIComponent(i.$path.${param})}`
        );
      }
      pathExpr = `\`${pathStr}\``;
    } else {
      pathExpr = `"${pathTmpl}"`;
    }

    // Build schema pieces
    const schemaPieces: string[] = [];

    if (hasPathParams) {
      const pathProps: Record<string, string> = {};
      for (const p of ep.pathParams) {
        pathProps[p] = "string:min1";
      }
      schemaPieces.push(
        `$path: Z.toZod(${JSON.stringify({ type: "object", props: pathProps })})`
      );
    }

    if (hasQuery) {
      schemaPieces.push(
        `$query: Z.toZod(${JSON.stringify({ type: "object", props: ep.query })})`
      );
    }

    if (hasInput) {
      schemaPieces.push(`$body: ${toZodExpr(ep.input)}`);
    }

    const schemaObj =
      schemaPieces.length > 0
        ? `zod.object({ ${schemaPieces.join(", ")} })`
        : `zod.any()`;

    const queryExpr = hasQuery ? `i.$query` : `undefined`;
    const bodyExpr = hasInput ? `i.$body` : `undefined`;

    lines.push(`
/**
 * ${ep.description || key}
 */
export const ${safeName} = withValidation(${schemaObj}, async (i: any) => {
  const path = ${pathExpr};
  return http(${baseRef}, path, {
    method: "${ep.method}",
    query: ${queryExpr},
    body: ${bodyExpr},
  });
});
`);
  });
});

// Write output
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, lines.join("\n"), "utf8");

// Ensure index.ts exists
const indexPath = path.join(root, "src/handlers/index.ts");
if (!fs.existsSync(indexPath)) {
  fs.writeFileSync(indexPath, `export * from "./handlers.generated";\n`, "utf8");
}

console.log("[spec-first] generated handlers →", path.relative(process.cwd(), outPath));

