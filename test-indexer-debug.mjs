#!/usr/bin/env node

import fg from 'fast-glob';

const INCLUDE = ['**/*.{ts,tsx,js,jsx,md,mdx,json,yml,yaml,sql,py,sh,ps1}'];
const EXCLUDE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/.venv*/**',
  '**/venv/**',
  '**/__pycache__/**',
  '**/.pytest_cache/**',
  '**/site-packages/**',
  '**/.augment/**',
  '**/.robinson/**',
  '**/.backups/**',
  '**/.training/**',
  '**/sandbox/**',
  '**/*.db',
  '**/*.db-shm',
  '**/*.db-wal'
];

console.log('🔍 Testing file discovery...\n');

const files = await fg(INCLUDE, {
  cwd: process.cwd(),
  ignore: EXCLUDE,
  dot: true
});

console.log(`📁 Found ${files.length} files\n`);

// Group by directory
const byDir = {};
files.forEach(f => {
  const dir = f.split('/')[0] || '.';
  byDir[dir] = (byDir[dir] || 0) + 1;
});

console.log('📊 Files by top-level directory:');
Object.entries(byDir)
  .sort((a, b) => b[1] - a[1])
  .forEach(([dir, count]) => {
    console.log(`  ${dir}: ${count} files`);
  });

console.log('\n📝 Sample files (first 20):');
files.slice(0, 20).forEach(f => console.log(`  ${f}`));

console.log(`\n... and ${files.length - 20} more files`);

