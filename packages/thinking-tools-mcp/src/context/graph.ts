import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';

export function buildImportGraph(repoRoot = process.cwd()): Array<{ from: string; to: string }> {
  const edges: Array<{ from: string; to: string }> = [];

  const scan = (p: string) => {
    const ext = path.extname(p).toLowerCase();
    const content = fs.readFileSync(p, 'utf8');
    const dir = path.dirname(p);

    const pushEdge = (target: string) => {
      try {
        const resolved = path.resolve(dir, target);
        edges.push({ from: p, to: resolved });
      } catch {
        // ignore resolution errors
      }
    };

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
      const importRe = /import[^;]*from\s*['"]([^'"\n]+)['"]/g;
      const requireRe = /require\(['"]([^'"\n]+)['"]\)/g;
      let m: RegExpExecArray | null;
      while ((m = importRe.exec(content))) {
        const mod = m[1];
        if (mod.startsWith('.')) pushEdge(mod);
      }
      while ((m = requireRe.exec(content))) {
        const mod = m[1];
        if (mod.startsWith('.')) pushEdge(mod);
      }
      return;
    }

    if (ext === '.py') {
      const fromRe = /from\s+([\.\w_]+)\s+import/g;
      const importRe = /import\s+([\.\w_]+)(?:\s+as\s+\w+)?/g;
      let m: RegExpExecArray | null;
      while ((m = fromRe.exec(content))) {
        const mod = m[1];
        if (!mod.startsWith('.')) continue;
        const resolved = resolvePythonModule(dir, mod);
        if (resolved) pushEdge(resolved);
      }
      while ((m = importRe.exec(content))) {
        const mod = m[1];
        if (!mod.startsWith('.')) continue;
        const resolved = resolvePythonModule(dir, mod);
        if (resolved) pushEdge(resolved);
      }
      return;
    }

    if (ext === '.go') {
      const importBlock = content.match(/import\s*\(([^)]+)\)/);
      const singleImport = content.match(/import\s+"([^"]+)"/g);
      const modules = new Set<string>();
      if (importBlock) {
        for (const line of importBlock[1].split(/\r?\n/)) {
          const match = line.match(/"([^"]+)"/);
          if (match && match[1].startsWith('.')) modules.add(match[1]);
        }
      }
      if (singleImport) {
        for (const line of singleImport) {
          const match = line.match(/"([^"]+)"/);
          if (match && match[1].startsWith('.')) modules.add(match[1]);
        }
      }
      modules.forEach(mod => pushEdge(mod));
      return;
    }
  };

  const files = fg.sync(['**/*.{ts,tsx,js,jsx,py,go}'], {
    cwd: repoRoot,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/__pycache__/**'],
    absolute: true
  });

  for (const f of files) {
    scan(f);
  }

  return edges;
}

function resolvePythonModule(dir: string, module: string): string | null {
  const dots = module.match(/^\.+/);
  const depth = dots ? dots[0].length : 0;
  const remainder = module.slice(depth).replace(/\./g, path.sep);
  let base = dir;
  for (let i = 0; i < depth; i++) {
    base = path.dirname(base);
  }
  const candidateFile = path.join(base, remainder + '.py');
  if (fs.existsSync(candidateFile)) {
    return path.relative(dir, candidateFile);
  }
  const candidateInit = path.join(base, remainder, '__init__.py');
  if (fs.existsSync(candidateInit)) {
    return path.relative(dir, candidateInit);
  }
  return null;
}

