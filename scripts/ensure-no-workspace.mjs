import fs from 'node:fs';

const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const fields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

for (const f of fields) {
  const m = p[f];
  if (!m) continue;
  
  for (const [k, v] of Object.entries(m)) {
    if (typeof v === 'string' && v.startsWith('workspace:')) {
      throw new Error(`Found workspace: dep in ${f}.${k} -> ${v}. Replace with a real semver before publish.`);
    }
  }
}

console.log('OK: no workspace: deps in this package.json');

