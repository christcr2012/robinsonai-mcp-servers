import assert from 'node:assert/strict';

const tests = [
  () => import('./context/engine.quickScan.test.mjs'),
  () => import('./context/language-patterns.test.mjs'),
  () => import('./context/architecture.test.mjs'),
];

let passed = 0;
for (const load of tests) {
  const mod = await load();
  assert.equal(typeof mod.default, 'function', 'test module must export default function');
  await mod.default();
  passed += 1;
}

console.log(`✅ Ran ${passed} context engine checks`);
