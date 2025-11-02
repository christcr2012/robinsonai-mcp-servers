import { execSync } from 'node:child_process';

export function summarizeDiff(range = 'HEAD~1..HEAD'): {
  range: string;
  files: Array<{ file: string; adds: number; dels: number }>;
} {
  const raw = execSync(`git --no-pager diff --unified=0 ${range}`, {
    encoding: 'utf8'
  });
  
  const files = new Map<string, { adds: number; dels: number }>();
  
  for (const l of raw.split(/\n/)) {
    const m = /^\+\+\+ b\/(.*)$/.exec(l) || /^--- a\/(.*)$/.exec(l);
    if (m) {
      files.set(m[1], files.get(m[1]) || { adds: 0, dels: 0 });
    }
    
    if (/^\+[^+]/.test(l)) {
      files.forEach(v => v.adds++);
    }
    
    if (/^-[^-]/.test(l)) {
      files.forEach(v => v.dels++);
    }
  }
  
  const out = [...files.entries()].map(([file, { adds, dels }]) => ({
    file,
    adds,
    dels
  }));
  
  return { range, files: out };
}

