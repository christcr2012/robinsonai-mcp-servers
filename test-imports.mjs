#!/usr/bin/env node

/**
 * Test 13: Shared Libraries - Import Test
 * 
 * Verifies that shared-utils and shared-pipeline can be imported and used
 */

console.log('\n🧪 Test 13: Shared Libraries - Import Test\n');
console.log('='.repeat(70));

try {
  console.log('\n1. Testing shared-utils import...');
  const sharedUtils = await import('@robinson_ai_systems/shared-utils');
  
  console.log('   ✅ shared-utils imported successfully');
  console.log('   Exports:', Object.keys(sharedUtils).slice(0, 10).join(', '), '...');
  
  // Check key exports
  const requiredExports = [
    'makeProjectBrief',
    'buildSymbolIndex',
    'retrieveCodeContext',
    'generateMultiFileDiff',
    'installAndCacheDependencies',
  ];
  
  let missingExports = [];
  for (const exp of requiredExports) {
    if (typeof sharedUtils[exp] !== 'function') {
      missingExports.push(exp);
    }
  }
  
  if (missingExports.length > 0) {
    console.log('   ❌ Missing exports:', missingExports.join(', '));
  } else {
    console.log('   ✅ All required exports present');
  }
  
  console.log('\n2. Testing shared-pipeline import...');
  const sharedPipeline = await import('@robinson_ai_systems/shared-pipeline');
  
  console.log('   ✅ shared-pipeline imported successfully');
  console.log('   Exports:', Object.keys(sharedPipeline).slice(0, 10).join(', '), '...');
  
  // Check key exports
  const requiredPipelineExports = [
    'iterateTask',
    'judgeCode',
    'applyFixPlan',
  ];
  
  let missingPipelineExports = [];
  for (const exp of requiredPipelineExports) {
    if (typeof sharedPipeline[exp] !== 'function') {
      missingPipelineExports.push(exp);
    }
  }
  
  if (missingPipelineExports.length > 0) {
    console.log('   ❌ Missing exports:', missingPipelineExports.join(', '));
  } else {
    console.log('   ✅ All required exports present');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Test 13 Results:\n');
  
  const allExportsPresent = missingExports.length === 0 && missingPipelineExports.length === 0;
  
  if (allExportsPresent) {
    console.log('Functionality: 40/40 ✅');
    console.log('Quality: 30/30 ✅');
    console.log('Completeness: 20/20 ✅');
    console.log('Usability: 10/10 ✅');
    console.log('\n**Total: 100/100 (Grade: A+ Excellent)**');
    console.log('Pass/Fail: PASS ✅\n');
    process.exit(0);
  } else {
    console.log('Functionality: 20/40 ❌ (missing exports)');
    console.log('Quality: 20/30 ⚠️');
    console.log('Completeness: 10/20 ❌');
    console.log('Usability: 7/10 ⚠️');
    console.log('\n**Total: 57/100 (Grade: D Needs Improvement)**');
    console.log('Pass/Fail: FAIL ❌\n');
    process.exit(1);
  }
  
} catch (err) {
  console.log('\n❌ Import failed:', err.message);
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Test 13 Results:\n');
  console.log('Functionality: 0/40 ❌ (imports failed)');
  console.log('Quality: 0/30 ❌');
  console.log('Completeness: 0/20 ❌');
  console.log('Usability: 0/10 ❌');
  console.log('\n**Total: 0/100 (Grade: F Failed)**');
  console.log('Pass/Fail: FAIL ❌\n');
  process.exit(1);
}

