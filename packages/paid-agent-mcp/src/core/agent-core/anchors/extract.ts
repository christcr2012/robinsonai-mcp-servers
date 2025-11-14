import { Anchor, FileAnchors } from "./types.js";

function dedupe<T>(xs: T[], key: (x:T)=>string) {
  const m = new Map<string,T>();
  xs.forEach(x => m.set(key(x), x));
  return [...m.values()];
}

export function extractAnchors(path: string, content: string): FileAnchors {
  const lines = content.replace(/\r\n/g,"\n").split("\n");
  const anchors: Anchor[] = [];

  const push = (text: string, kind: Anchor["kind"], line: number) => {
    if (!text || text.length < 3) return;
    anchors.push({ text, kind, line });
  };

  lines.forEach((l, i) => {
    // imports
    if (/^\s*import\s.+from\s+['"].+['"]/.test(l)) push(l.trim(), "import", i+1);

    // class decls
    const mClass = l.match(/^\s*export\s+class\s+([A-Za-z0-9_]+)/) || l.match(/^\s*class\s+([A-Za-z0-9_]+)/);
    if (mClass) push(mClass[0].trim(), "class", i+1);

    // method sigs inside classes
    const mMethod = l.match(/^\s*(public|private|protected|async|\s)*\s*[A-Za-z0-9_]+\s*\([^)]*\)\s*{/);
    if (mMethod) push(mMethod[0].trim(), "method", i+1);

    // top-level functions
    const mFn = l.match(/^\s*export\s+function\s+[A-Za-z0-9_]+\s*\(|^\s*function\s+[A-Za-z0-9_]+\s*\(/);
    if (mFn) push(mFn[0].trim(), "function", i+1);

    // switch cases
    const mCase = l.match(/^\s*case\s+['"`]?[A-Za-z0-9_.-]+['"`]?\s*:/);
    if (mCase) push(mCase[0].trim(), "switchCase", i+1);

    // region markers
    if (/^\s*\/\/\s*region\b/i.test(l) || /^\s*\/\/\s*endregion\b/i.test(l)) push(l.trim(), "region", i+1);
  });

  return { path, anchors: dedupe(anchors, a => `${a.kind}:${a.text}`) };
}

