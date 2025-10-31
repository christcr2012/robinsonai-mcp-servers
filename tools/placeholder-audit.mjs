#!/usr/bin/env node
// tools/placeholder-audit.mjs — counts placeholder/stub markers across repo
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const exts = new Set(['.ts','.tsx','.js','.jsx','.mjs','.cjs','.md','.json','.yml','.yaml','.toml','.py','.go']);
const ignore = new Set(['node_modules','.git','dist','build','out','.next','.turbo','.robinson']);
const patterns = [
  /\bTODO\b/i, /\bFIXME\b/i, /\bTBD\b/i, /\bPLACEHOLDER\b/i, /\bstub\b/i, /\bmock(ed)?\b/i,
  /\/\/\s*fill in later/i, /\/\*\s*fill in later/i,
  /throw new Error\(['\"`]Not Implemented['\"`]\)/i,
  /return\s+['\"`]TODO/i, /console\.log\(['\"`]stub/i,
  /PH:/i
];

let files=0, hits=0;
function scan(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(ent.isDirectory()){
      if(ignore.has(ent.name)) continue;
      scan(path.join(dir,ent.name));
    } else {
      const ext = path.extname(ent.name);
      if(!exts.has(ext)) continue;
      const fp = path.join(dir, ent.name);
      let t = '';
      try { t = fs.readFileSync(fp,'utf8'); } catch {}
      files++;
      if(patterns.some(re=>re.test(t))) hits++;
    }
  }
}
scan(root);
console.log(`SCANNED: ${files} files, FOUND: ${hits} files with placeholders`);
