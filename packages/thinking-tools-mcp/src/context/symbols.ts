export function extractSymbols(langExt: string, text: string): string[] {
  const out = new Set<string>();
  const add = (arr: string[]) => { for (const x of arr) out.add(x); };

  // TS/JS
  if (['.ts','.tsx','.js','.jsx'].includes(langExt)) {
    add((text.match(/function\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
    add((text.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
    add((text.match(/([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\(/g) || []).map(s=>s.replace(/\s*=.*/,'').trim()));
    add((text.match(/([A-Za-z_][A-Za-z0-9_]*)\s*\(/g) || []).map(s=>s.replace('(','').trim()));
  }
  // Python
  if (['.py'].includes(langExt)) {
    add((text.match(/def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g) || []).map(s=>s.split(/\s+/)[1].replace('(','').trim()));
    add((text.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)\s*:/g) || []).map(s=>s.split(/\s+/)[1].replace(':','').trim()));
  }
  // Go
  if (['.go'].includes(langExt)) {
    add((text.match(/func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g) || []).map(s=>s.split(/\s+/)[1].replace('(','').trim()));
  }
  // Java / Kotlin / C#
  if (['.java', '.kt', '.cs'].includes(langExt)) {
    add((text.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
    add((text.match(/interface\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
    add((text.match(/enum\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
    add((text.match(/[\w<>\[\]]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g) || []).map(s=>s.replace(/.*\s+/,'').replace('(','').trim()));
  }
  // Rust
  if (['.rs'].includes(langExt)) {
    add((text.match(/fn\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
    add((text.match(/struct\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
    add((text.match(/enum\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
  }
  // C / C++ / Headers
  if (['.c', '.cc', '.cpp', '.cxx', '.hpp', '.h'].includes(langExt)) {
    add((text.match(/(?:class|struct)\s+([A-Za-z_][A-Za-z0-9_]*)/g) || []).map(s=>s.split(/\s+/)[1]));
    add((text.match(/[A-Za-z_][A-Za-z0-9_:<>]*\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g) || []).map(s=>s.replace(/.*\s+/,'').replace('(','').trim()));
  }

  return Array.from(out).slice(0, 200); // cap
}

