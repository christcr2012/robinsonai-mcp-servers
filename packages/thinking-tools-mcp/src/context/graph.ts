import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';

export function buildImportGraph(repoRoot = process.cwd()): Array<{ from: string; to: string }> {
  const edges: Array<{ from: string; to: string }> = [];
  
  const scan = (p: string) => {
    if (!/\.(ts|tsx|js|jsx)$/.test(p)) return;
    
    const t = fs.readFileSync(p, 'utf8');
    const dir = path.dirname(p);
    const re = /import[^;]*from\s*['"]([^'"]+)['"]/g;
    let m;
    
    while ((m = re.exec(t))) {
      let to = m[1];
      if (to.startsWith('.')) {
        try {
          const rp = path.resolve(dir, to);
          edges.push({ from: p, to: rp });
        } catch {
          // ignore resolution errors
        }
      }
    }
  };
  
  const files = fg.sync(['**/*.{ts,tsx,js,jsx}'], {
    cwd: repoRoot,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    absolute: true
  });
  
  for (const f of files) {
    scan(f);
  }
  
  return edges;
}

