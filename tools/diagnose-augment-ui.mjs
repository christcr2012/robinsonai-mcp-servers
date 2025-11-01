#!/usr/bin/env node
/**
 * Diagnose Augment UI settings page issues
 * - Check Augment extension version
 * - Check feature flags (enableNativeRemoteMcp, partnerMcpLaunch20250916)
 * - Validate augment.mcpServers structure
 * - Check for webview/settings page issues
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const isWindows = os.platform() === 'win32';
const settingsPath = isWindows
  ? path.join(process.env.APPDATA, 'Code', 'User', 'settings.json')
  : path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');

console.log('🔍 Augment UI Diagnostics\n');

// Read settings.json
let settings = {};
try {
  const raw = fs.readFileSync(settingsPath, 'utf8');
  settings = JSON.parse(raw);
  console.log('✅ Settings file read successfully');
} catch (err) {
  console.error('❌ Failed to read settings.json:', err.message);
  process.exit(1);
}

// Check augment.mcpServers
console.log('\n📋 MCP Servers Configuration:');
const mcpServers = settings['augment.mcpServers'];

if (!mcpServers) {
  console.log('❌ augment.mcpServers not found in settings');
} else if (Array.isArray(mcpServers)) {
  console.log('⚠️  augment.mcpServers is an ARRAY (should be object)');
  console.log(`   Length: ${mcpServers.length}`);
} else if (typeof mcpServers === 'object') {
  const keys = Object.keys(mcpServers);
  console.log(`✅ augment.mcpServers is an object with ${keys.length} servers:`);
  
  // Check for numeric keys (red flag)
  const numericKeys = keys.filter(k => /^\d+$/.test(k));
  if (numericKeys.length > 0) {
    console.log(`❌ NUMERIC KEYS detected: ${numericKeys.join(', ')}`);
    console.log('   This breaks Augment UI hydration!');
  }
  
  // List servers
  keys.forEach(name => {
    const server = mcpServers[name];
    console.log(`   - ${name}`);
    if (server.command) {
      console.log(`     command: ${server.command}`);
    }
    if (server.args && server.args.length > 0) {
      console.log(`     args: ${server.args.join(' ')}`);
    }
  });
} else {
  console.log(`❌ augment.mcpServers has unexpected type: ${typeof mcpServers}`);
}

// Check for other Augment settings that might affect UI
console.log('\n⚙️  Other Augment Settings:');
const augmentKeys = Object.keys(settings).filter(k => k.startsWith('augment.'));
console.log(`   Found ${augmentKeys.length} augment.* settings`);

// Look for UI-related settings
const uiSettings = [
  'augment.enableDebugFeatures',
  'augment.disableFocusOnAugmentPanel',
  'augment.chat.enableEditableHistory',
  'augment.agent',
  'augment.integrations'
];

uiSettings.forEach(key => {
  if (settings[key] !== undefined) {
    console.log(`   ${key}: ${JSON.stringify(settings[key])}`);
  }
});

// Check extension version from extensions directory
console.log('\n🔌 Checking Augment Extension:');
const extensionsDir = isWindows
  ? path.join(process.env.USERPROFILE, '.vscode', 'extensions')
  : path.join(os.homedir(), '.vscode', 'extensions');

try {
  const extensions = fs.readdirSync(extensionsDir);
  const augmentExt = extensions.find(e => e.toLowerCase().startsWith('augment.vscode-augment'));
  
  if (augmentExt) {
    console.log(`   Found: ${augmentExt}`);
    
    // Try to read package.json for version
    const pkgPath = path.join(extensionsDir, augmentExt, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      console.log(`   Version: ${pkg.version}`);
      console.log(`   Name: ${pkg.displayName || pkg.name}`);
      
      // Check for contributes.configuration for MCP settings
      if (pkg.contributes && pkg.contributes.configuration) {
        const configs = Array.isArray(pkg.contributes.configuration) 
          ? pkg.contributes.configuration 
          : [pkg.contributes.configuration];
        
        const mcpConfig = configs.find(c => 
          c.properties && c.properties['augment.mcpServers']
        );
        
        if (mcpConfig) {
          console.log('   ✅ MCP configuration schema found in package.json');
        } else {
          console.log('   ⚠️  No MCP configuration schema in package.json');
        }
      }
    }
  } else {
    console.log('   ❌ Augment extension not found');
  }
} catch (err) {
  console.log(`   ⚠️  Could not check extensions directory: ${err.message}`);
}

// Recommendations
console.log('\n💡 Recommendations:');

if (Array.isArray(mcpServers)) {
  console.log('   1. ❌ Convert augment.mcpServers from array to named object');
  console.log('      Run: node tools/repair-augment-settings.mjs');
} else if (mcpServers && typeof mcpServers === 'object') {
  const keys = Object.keys(mcpServers);
  const numericKeys = keys.filter(k => /^\d+$/.test(k));
  
  if (numericKeys.length > 0) {
    console.log('   1. ❌ Remove numeric keys from augment.mcpServers');
    console.log('      Run: node tools/repair-augment-settings.mjs');
  } else if (keys.length === 0) {
    console.log('   1. ⚠️  No MCP servers configured');
    console.log('      Run: node tools/add-toolkit-to-settings.mjs');
  } else {
    console.log('   1. ✅ MCP configuration looks good');
  }
}

console.log('   2. If settings page only shows "Account" tab:');
console.log('      - Check Augment extension version (needs 0.400.0+)');
console.log('      - Try reinstalling Augment extension');
console.log('      - Check feature flags in Augment logs (enableNativeRemoteMcp should be true)');
console.log('   3. Try clearing Augment cache again:');
console.log('      pwsh -File scripts/clear-augment-vscode-cache.ps1 -Force');
console.log('   4. After any changes, reload VS Code window completely');

console.log('\n✅ Diagnostics complete\n');
