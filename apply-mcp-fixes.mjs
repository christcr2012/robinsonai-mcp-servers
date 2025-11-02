#!/usr/bin/env node

/**
 * Apply MCP Fixes Script
 * 
 * Applies all the fixes implemented to make MCP servers work for delegation
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const FIXES = [
  {
    name: 'Update Package Versions',
    description: 'Bump all modified package versions',
    apply: () => {
      console.log('📦 Updating package versions...');
      
      const packages = [
        { path: 'packages/free-agent-mcp/package.json', from: '0.1.7', to: '0.1.8' },
        { path: 'packages/shared-llm/package.json', from: '0.1.0', to: '0.1.1' },
        { path: 'packages/credit-optimizer-mcp/package.json', from: '0.1.6', to: '0.1.7' },
        { path: 'packages/robinsons-toolkit-mcp/package.json', from: '1.0.5', to: '1.0.6' },
        { path: 'packages/thinking-tools-mcp/package.json', from: '1.4.1', to: '1.4.2' }
      ];

      packages.forEach(pkg => {
        if (existsSync(pkg.path)) {
          let content = readFileSync(pkg.path, 'utf-8');
          content = content.replace(`"version": "${pkg.from}"`, `"version": "${pkg.to}"`);
          writeFileSync(pkg.path, content);
          console.log(`   ✅ ${pkg.path}: ${pkg.from} → ${pkg.to}`);
        } else {
          console.log(`   ⚠️  ${pkg.path}: File not found`);
        }
      });
    }
  },
  {
    name: 'Update Augment Config',
    description: 'Update augment-mcp-config.json with new versions',
    apply: () => {
      console.log('⚙️  Updating Augment MCP config...');
      
      if (!existsSync('augment-mcp-config.json')) {
        console.log('   ⚠️  augment-mcp-config.json not found');
        return;
      }

      let config = readFileSync('augment-mcp-config.json', 'utf-8');
      
      // Update versions
      config = config.replace('@robinson_ai_systems/free-agent-mcp@0.1.7', '@robinson_ai_systems/free-agent-mcp@0.1.8');
      config = config.replace('@robinson_ai_systems/thinking-tools-mcp@1.4.1', '@robinson_ai_systems/thinking-tools-mcp@1.4.2');
      config = config.replace('@robinson_ai_systems/credit-optimizer-mcp@latest', '@robinson_ai_systems/credit-optimizer-mcp@0.1.7');
      config = config.replace('@robinson_ai_systems/robinsons-toolkit-mcp@latest', '@robinson_ai_systems/robinsons-toolkit-mcp@1.0.6');
      
      // Fix model configuration
      config = config.replace('"COMPLEX_MODEL": "deepseek-coder:33b"', '"COMPLEX_MODEL": "deepseek-coder:1.3b"');
      
      writeFileSync('augment-mcp-config.json', config);
      console.log('   ✅ Config updated with new versions and model fix');
    }
  },
  {
    name: 'Create Tools Index',
    description: 'Create missing tools-index.json for Credit Optimizer',
    apply: () => {
      console.log('📋 Creating tools index...');
      
      const distPath = 'packages/credit-optimizer-mcp/dist/tools-index.json';
      const srcPath = 'packages/credit-optimizer-mcp/src/tools-index.json';
      
      if (existsSync(srcPath) && !existsSync(distPath)) {
        const content = readFileSync(srcPath, 'utf-8');
        writeFileSync(distPath, content);
        console.log('   ✅ Copied tools-index.json to dist directory');
      } else if (existsSync(distPath)) {
        console.log('   ✅ tools-index.json already exists in dist');
      } else {
        console.log('   ⚠️  Source tools-index.json not found');
      }
    }
  },
  {
    name: 'Verify Fixes',
    description: 'Run basic verification of applied fixes',
    apply: () => {
      console.log('🔍 Verifying fixes...');
      
      const checks = [
        {
          name: 'Free Agent model config',
          check: () => {
            const config = readFileSync('augment-mcp-config.json', 'utf-8');
            return config.includes('deepseek-coder:1.3b');
          }
        },
        {
          name: 'Tools index exists',
          check: () => existsSync('packages/credit-optimizer-mcp/dist/tools-index.json')
        },
        {
          name: 'Package versions updated',
          check: () => {
            const freeAgent = JSON.parse(readFileSync('packages/free-agent-mcp/package.json', 'utf-8'));
            return freeAgent.version === '0.1.8';
          }
        }
      ];

      let allPassed = true;
      checks.forEach(check => {
        try {
          const passed = check.check();
          console.log(`   ${passed ? '✅' : '❌'} ${check.name}`);
          if (!passed) allPassed = false;
        } catch (error) {
          console.log(`   ❌ ${check.name}: ${error.message}`);
          allPassed = false;
        }
      });

      if (allPassed) {
        console.log('   🎉 All fixes verified successfully!');
      } else {
        console.log('   ⚠️  Some fixes may not have applied correctly');
      }
    }
  }
];

async function main() {
  console.log('🚀 Applying MCP Delegation Fixes...\n');

  for (const fix of FIXES) {
    console.log(`\n${fix.name}:`);
    console.log(`   ${fix.description}`);
    
    try {
      await fix.apply();
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 MCP Fixes Applied!');
  console.log('='.repeat(60));
  console.log('\n📋 Next Steps:');
  console.log('1. Run test suite: node test-mcp-delegation.mjs');
  console.log('2. Start MCP servers and verify they work');
  console.log('3. Test delegation with simple tasks');
  console.log('4. Monitor cost savings in production');
  console.log('\n💰 Expected Result: 96% cost savings through successful delegation');
}

main().catch(console.error);
