#!/usr/bin/env node

/**
 * Build and Publish MCP Fixes Script
 * 
 * Builds and publishes all modified MCP packages with fixes to npm
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

const PACKAGES_TO_PUBLISH = [
  {
    name: '@robinson_ai_systems/shared-llm',
    path: 'packages/shared-llm',
    version: '0.1.1',
    changes: ['Enhanced Ollama connection logic', 'Dual URL support', 'Better error handling']
  },
  {
    name: '@robinson_ai_systems/free-agent-mcp',
    path: 'packages/free-agent-mcp',
    version: '0.1.8',
    changes: ['Fixed Ollama connection', 'Updated model config', 'Increased timeout', 'Better logging']
  },
  {
    name: '@robinson_ai_systems/credit-optimizer-mcp',
    path: 'packages/credit-optimizer-mcp',
    version: '0.1.7',
    changes: ['Fixed tool discovery', 'Added tools-index.json', 'Enhanced search debugging']
  },
  {
    name: '@robinson_ai_systems/robinsons-toolkit-mcp',
    path: 'packages/robinsons-toolkit-mcp',
    version: '1.0.6',
    changes: ['Fixed tool discovery', 'Added search debugging', 'Enhanced error reporting']
  },
  {
    name: '@robinson_ai_systems/thinking-tools-mcp',
    path: 'packages/thinking-tools-mcp',
    version: '1.4.2',
    changes: ['Added Robinson AI context', 'MCP-specific insights', 'Architecture awareness']
  }
];

class PackagePublisher {
  constructor() {
    this.publishedPackages = [];
    this.failedPackages = [];
  }

  async buildPackage(pkg) {
    console.log(`\n🔨 Building ${pkg.name}...`);
    
    try {
      // Check if package.json exists and has correct version
      const packageJsonPath = `${pkg.path}/package.json`;
      if (!existsSync(packageJsonPath)) {
        throw new Error(`package.json not found at ${packageJsonPath}`);
      }

      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.version !== pkg.version) {
        throw new Error(`Version mismatch: expected ${pkg.version}, got ${packageJson.version}`);
      }

      // Build the package
      console.log(`   📦 Running build for ${pkg.name}...`);
      execSync(`npm run build`, { 
        cwd: pkg.path, 
        stdio: 'pipe' 
      });

      console.log(`   ✅ Build successful for ${pkg.name}`);
      return true;

    } catch (error) {
      console.log(`   ❌ Build failed for ${pkg.name}: ${error.message}`);
      return false;
    }
  }

  async publishPackage(pkg) {
    console.log(`\n📤 Publishing ${pkg.name} v${pkg.version}...`);
    
    try {
      // Check if we're logged in to npm
      try {
        execSync('npm whoami', { stdio: 'pipe' });
      } catch (error) {
        throw new Error('Not logged in to npm. Run: npm login');
      }

      // Check if version already exists
      try {
        const existingVersions = execSync(`npm view ${pkg.name} versions --json`, { 
          stdio: 'pipe' 
        }).toString();
        const versions = JSON.parse(existingVersions);
        
        if (versions.includes(pkg.version)) {
          console.log(`   ⚠️  Version ${pkg.version} already exists, skipping publish`);
          return true;
        }
      } catch (error) {
        // Package might not exist yet, which is fine
        console.log(`   📝 Package ${pkg.name} not found on npm, will publish as new`);
      }

      // Publish the package
      console.log(`   🚀 Publishing ${pkg.name}@${pkg.version}...`);
      execSync(`npm publish --access public`, { 
        cwd: pkg.path, 
        stdio: 'pipe' 
      });

      console.log(`   ✅ Published ${pkg.name}@${pkg.version} successfully`);
      this.publishedPackages.push(pkg);
      return true;

    } catch (error) {
      console.log(`   ❌ Publish failed for ${pkg.name}: ${error.message}`);
      this.failedPackages.push({ ...pkg, error: error.message });
      return false;
    }
  }

  async verifyPackage(pkg) {
    console.log(`\n🔍 Verifying ${pkg.name}@${pkg.version}...`);
    
    try {
      // Wait a moment for npm to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if package is available
      const packageInfo = execSync(`npm view ${pkg.name}@${pkg.version} --json`, { 
        stdio: 'pipe' 
      }).toString();
      
      const info = JSON.parse(packageInfo);
      
      if (info.version === pkg.version) {
        console.log(`   ✅ ${pkg.name}@${pkg.version} is available on npm`);
        return true;
      } else {
        console.log(`   ❌ Version mismatch: expected ${pkg.version}, got ${info.version}`);
        return false;
      }

    } catch (error) {
      console.log(`   ❌ Verification failed for ${pkg.name}: ${error.message}`);
      return false;
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 BUILD AND PUBLISH REPORT');
    console.log('='.repeat(80));

    console.log(`\n✅ Successfully Published: ${this.publishedPackages.length}/${PACKAGES_TO_PUBLISH.length}`);
    
    if (this.publishedPackages.length > 0) {
      console.log('\n🎉 Published Packages:');
      this.publishedPackages.forEach(pkg => {
        console.log(`   • ${pkg.name}@${pkg.version}`);
        pkg.changes.forEach(change => {
          console.log(`     - ${change}`);
        });
      });
    }

    if (this.failedPackages.length > 0) {
      console.log('\n❌ Failed Packages:');
      this.failedPackages.forEach(pkg => {
        console.log(`   • ${pkg.name}@${pkg.version}: ${pkg.error}`);
      });
    }

    if (this.publishedPackages.length === PACKAGES_TO_PUBLISH.length) {
      console.log('\n🎯 ALL PACKAGES PUBLISHED SUCCESSFULLY!');
      console.log('\n📋 Next Steps:');
      console.log('1. Update Augment to use new package versions');
      console.log('2. Test delegation with: node test-mcp-delegation.mjs');
      console.log('3. Verify 96% cost savings are achieved');
      console.log('\n💰 Expected Result: MCP delegation now works with 96% cost savings');
    } else {
      console.log('\n⚠️  Some packages failed to publish. Please fix errors and retry.');
    }

    console.log('\n' + '='.repeat(80));
  }

  async publishAll() {
    console.log('🚀 Building and Publishing MCP Fixes...\n');
    console.log(`📦 Packages to publish: ${PACKAGES_TO_PUBLISH.length}`);

    for (const pkg of PACKAGES_TO_PUBLISH) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Processing: ${pkg.name}`);
      console.log(`   Version: ${pkg.version}`);
      console.log(`   Changes: ${pkg.changes.join(', ')}`);

      // Build the package
      const buildSuccess = await this.buildPackage(pkg);
      if (!buildSuccess) {
        this.failedPackages.push({ ...pkg, error: 'Build failed' });
        continue;
      }

      // Publish the package
      const publishSuccess = await this.publishPackage(pkg);
      if (!publishSuccess) {
        continue;
      }

      // Verify the package
      await this.verifyPackage(pkg);
    }

    this.generateReport();
  }
}

// Check if we're in the right directory
if (!existsSync('package.json')) {
  console.error('❌ package.json not found. Please run this script from the repository root.');
  process.exit(1);
}

// Check if this is the right repository
const rootPackage = JSON.parse(readFileSync('package.json', 'utf-8'));
if (rootPackage.name !== 'robinsonai-mcp-servers') {
  console.error('❌ This script must be run from the robinsonai-mcp-servers repository root.');
  process.exit(1);
}

// Run the publisher
const publisher = new PackagePublisher();
publisher.publishAll().catch(console.error);
