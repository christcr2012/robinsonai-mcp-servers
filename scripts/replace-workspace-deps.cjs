#!/usr/bin/env node

/**
 * Replace workspace:* dependencies with actual semver versions
 * Run this before publishing to npm
 */

const fs = require('node:fs');
const path = require('node:path');

const pkgsDir = path.join(process.cwd(), 'packages');
const versions = {};

console.log('Collecting package versions...');

// Collect versions from all packages
for (const name of fs.readdirSync(pkgsDir)) {
  const pkgPath = path.join(pkgsDir, name, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  versions[pkg.name] = pkg.version;
  console.log(`  ${pkg.name}@${pkg.version}`);
}

console.log('\nRewriting workspace:* dependencies...');

// Rewrite workspace:* dependencies to semver
for (const name of fs.readdirSync(pkgsDir)) {
  const pkgPath = path.join(pkgsDir, name, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  let changed = false;
  
  for (const section of ['dependencies', 'peerDependencies', 'optionalDependencies', 'devDependencies']) {
    const deps = pkg[section];
    if (!deps) continue;
    
    for (const dep in deps) {
      if (String(deps[dep]).startsWith('workspace:')) {
        const ver = versions[dep];
        if (ver) {
          console.log(`  ${pkg.name}: ${dep} workspace:* -> ^${ver}`);
          deps[dep] = `^${ver}`;
          changed = true;
        } else {
          console.warn(`  WARNING: ${pkg.name} depends on ${dep} but version not found!`);
        }
      }
    }
  }
  
  if (changed) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}

console.log('\n✅ Rewrote workspace:* to semver for publish.');

