#!/usr/bin/env node
// tools/gen-symbol-map.mjs — repo-agnostic symbol map for naming consistency
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const include = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs']);
const ignoreDirs = new Set(['node_modules','.git','dist','build','out','.next','.turbo','.robinson']);
const symbols = { types:[], functions:[], classes:[], imports:{}, env:[] };

function walk(dir){
  for (const ent of fs.readdirSync(dir, { withFileTypes:true })){
    if (ent.isDirectory()){
      if (ignoreDirs.has(ent.name)) continue;
      walk(path.join(dir, ent.name));
    } else {
      const ext = path.extname(ent.name);
      if (!include.has(ext)) continue;
      const fp = path.join(dir, ent.name);
      let t = '';
      try { t = fs.readFileSync(fp, 'utf8'); } catch {}
      for (const m of t.matchAll(/export\s+interface\s+([A-Za-z0-9_]+)/g)) symbols.types.push(m[1]);
      for (const m of t.matchAll(/export\s+type\s+([A-Za-z0-9_]+)/g)) symbols.types.push(m[1]);
      for (const m of t.matchAll(/export\s+class\s+([A-Za-z0-9_]+)/g)) symbols.classes.push(m[1]);
      for (const m of t.matchAll(/export\s+function\s+([A-Za-z0-9_]+)/g)) symbols.functions.push(m[1]);
      for (const m of t.matchAll(/import\s+.*from\s+['\"]([^'\"]+)['\"]/g)) {
        const k = m[1]; symbols.imports[k] = (symbols.imports[k]||0)+1;
      }
      for (const m of t.matchAll(/process\.env\.([A-Z0-9_]+)/g)) symbols.env.push(m[1]);
    }
  }
}

walk(root);

symbols.types = [...new Set(symbols.types)].sort();
symbols.functions = [...new Set(symbols.functions)].sort();
symbols.classes = [...new Set(symbols.classes)].sort();
symbols.env = [...new Set(symbols.env)].sort();

const outPath = path.join(root, '.robinson', 'symbols.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(symbols, null, 2));
console.log('Wrote', outPath);
