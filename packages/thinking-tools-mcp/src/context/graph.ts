import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';

type Edge = { from: string; to: string };

const IGNORE = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/.next/**', '**/.venv*/**'];
const FILE_GLOB = ['**/*.{ts,tsx,js,jsx,py,go,java,rs,cpp,c,cc,cxx,h,hpp,hh}'];
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs', '.cpp', '.c', '.cc', '.cxx', '.mjs', '.mts', '.cts', '.h', '.hpp', '.hh'];

function normalize(root: string, file: string): string {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  return path.relative(root, abs).split(path.sep).join('/');
}

function resolveRelative(fromFile: string, spec: string): string | null {
  const dir = path.dirname(fromFile);
  const base = path.resolve(dir, spec);
  const candidates = [base, ...EXTENSIONS.map(ext => base + ext), ...EXTENSIONS.map(ext => path.join(base, 'index' + ext)), path.join(base, '__init__.py')];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function resolvePythonRelative(fromFile: string, spec: string): string | null {
  const match = spec.match(/^([.]+)(.*)$/);
  if (!match) return null;
  const depth = match[1].length;
  const remainder = match[2].replace(/\./g, '/');
  let dir = path.dirname(fromFile);
  for (let i = 0; i < depth; i++) {
    dir = path.dirname(dir);
  }
  const target = path.join(dir, remainder);
  return resolveRelative(fromFile, path.relative(path.dirname(fromFile), target) || '.');
}

function addEdge(edges: Edge[], root: string, fromFile: string, target: string | null, spec: string) {
  const from = normalize(root, fromFile);
  const to = target ? normalize(root, target) : `external:${spec}`;
  edges.push({ from, to });
}

function scanFile(root: string, file: string, edges: Edge[]) {
  const ext = path.extname(file).toLowerCase();
  const text = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);

  if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cts'].includes(ext)) {
    const re = /import[^;]*from\s*['"]([^'"]+)['"]/g;
    let m;
    while ((m = re.exec(text))) {
      const spec = m[1];
      if (spec.startsWith('.')) {
        const resolved = resolveRelative(file, spec);
        addEdge(edges, root, file, resolved, spec);
      }
    }
  } else if (ext === '.py') {
    const fromRe = /from\s+([.\w]+)\s+import\s+[\w*, ]+/g;
    let m;
    while ((m = fromRe.exec(text))) {
      const spec = m[1];
      const resolved = spec.startsWith('.') ? resolvePythonRelative(file, spec) : null;
      addEdge(edges, root, file, resolved, spec);
    }
  } else if (ext === '.go') {
    const importBlock = /import\s*(\(([^)]+)\)|"([^"]+)")/gm;
    let m;
    while ((m = importBlock.exec(text))) {
      const block = m[2];
      if (block) {
        const lines = block.split(/\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          const match = line.match(/"([^"]+)"/);
          if (match) {
            addEdge(edges, root, file, null, match[1]);
          }
        }
      } else if (m[3]) {
        addEdge(edges, root, file, null, m[3]);
      }
    }
  } else if (ext === '.rs') {
    const useRe = /use\s+crate::([A-Za-z0-9_:]+)/g;
    let m;
    while ((m = useRe.exec(text))) {
      const spec = m[1].replace(/::/g, '/');
      const target = resolveRelative(file, `./${spec}.rs`);
      addEdge(edges, root, file, target, spec);
    }
  } else if (['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp', '.hh'].includes(ext)) {
    const includeRe = /#include\s+["<]([^">]+)[">]/g;
    let m;
    while ((m = includeRe.exec(text))) {
      const spec = m[1];
      if (spec.startsWith('.')) {
        const resolved = path.resolve(dir, spec);
        addEdge(edges, root, file, fs.existsSync(resolved) ? resolved : null, spec);
      }
    }
  } else if (ext === '.java') {
    const importRe = /import\s+([a-zA-Z0-9_.]+);/g;
    let m;
    while ((m = importRe.exec(text))) {
      const spec = m[1];
      addEdge(edges, root, file, null, spec);
    }
  }
}

export function buildImportGraph(repoRoot = process.cwd()): Array<{ from: string; to: string }> {
  const edges: Edge[] = [];
  const files = fg.sync(FILE_GLOB, {
    cwd: repoRoot,
    ignore: IGNORE,
    absolute: true,
  });

  for (const file of files) {
    try {
      scanFile(repoRoot, file, edges);
    } catch (error) {
      console.warn(`[buildImportGraph] Failed to parse ${file}:`, (error as Error).message);
    }
  }

  return edges;
}

