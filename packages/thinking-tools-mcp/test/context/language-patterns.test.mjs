import assert from 'node:assert/strict';
import { extractSymbolMatches } from '../../dist/context/language-patterns.js';

export default async function testLanguagePatterns() {
  const pyText = [
    'def _internal_helper():\n    pass',
    '',
    'def PublicFunction():\n    return True',
    '',
    'class _HiddenThing:\n    pass',
    '',
    'class PublicClass:\n    pass',
  ].join('\n');

  const pyMatches = extractSymbolMatches(pyText, '.py');
  const pyNames = pyMatches.map(m => m.name);
  assert(pyNames.includes('PublicFunction'));
  assert(pyNames.includes('PublicClass'));
  assert(pyNames.includes('_internal_helper'));
  assert.equal(pyMatches.find(m => m.name === 'PublicFunction')?.exported, true);
  assert.equal(pyMatches.find(m => m.name === '_HiddenThing')?.exported, false);
  assert.equal(pyMatches.find(m => m.name === '_internal_helper')?.exported, false);

  const goSource = [
    'package sample',
    '',
    'func internalThing() {}',
    '',
    'func ExportedFunction() {}',
    '',
    'type secretStruct struct{}',
    'type PublicStruct struct{}',
  ].join('\n');

  const goMatches = extractSymbolMatches(goSource, '.go');
  assert(goMatches.some(m => m.name === 'ExportedFunction' && m.exported));
  assert(goMatches.some(m => m.name === 'PublicStruct' && m.exported));
  assert(goMatches.some(m => m.name === 'internalThing'));
  assert.equal(goMatches.find(m => m.name === 'internalThing')?.exported, false);
  assert(goMatches.some(m => m.name === 'secretStruct'));
  assert.equal(goMatches.find(m => m.name === 'secretStruct')?.exported, false);

  const rustSource = [
    'pub enum ExportedEnum { One }',
    'pub mod exposed_module {',
    '  pub fn inside() {}',
    '}',
    'fn private_helper() {}',
    'pub fn public_api() {}',
    'pub struct VisibleStruct {}',
    'struct HiddenStruct {}',
  ].join('\n');

  const rustMatches = extractSymbolMatches(rustSource, '.rs');
  ['public_api', 'VisibleStruct', 'exposed_module', 'ExportedEnum'].forEach(name => {
    const match = rustMatches.find(m => m.name === name);
    assert(match, `expected rust symbol ${name}`);
    assert.equal(match.exported, true);
  });
  const privateFn = rustMatches.find(m => m.name === 'private_helper');
  assert(privateFn);
  assert.equal(privateFn.exported, false);
}
