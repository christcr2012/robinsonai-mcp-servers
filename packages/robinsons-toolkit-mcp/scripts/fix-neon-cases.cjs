#!/usr/bin/env node

/**
 * Fix Neon Case Statements
 * 
 * All Neon case statements are calling the wrong handlers.
 * They call this.listProjects() but should call this.neonListProjects()
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../src/index.ts');

console.log('🔧 FIXING NEON CASE STATEMENTS\n');

// Read file
let content = fs.readFileSync(INDEX_PATH, 'utf-8');

// Find all neon case statements and fix them
const fixes = [
  // Already fixed manually
  // { from: "case 'neon_list_projects': return await this.listProjects(args);", to: "case 'neon_list_projects': return await this.neonListProjects(args);" },
  
  // BRANCH MANAGEMENT
  { from: "case 'neon_create_branch': return await this.createBranch(args);", to: "case 'neon_create_branch': return await this.neonCreateBranch(args);" },
  { from: "case 'neon_delete_branch': return await this.deleteBranch(args);", to: "case 'neon_delete_branch': return await this.neonDeleteBranch(args);" },
  { from: "case 'neon_describe_branch': return await this.describeBranch(args);", to: "case 'neon_describe_branch': return await this.neonDescribeBranch(args);" },
  { from: "case 'neon_reset_from_parent': return await this.resetFromParent(args);", to: "case 'neon_reset_from_parent': return await this.neonResetFromParent(args);" },
  { from: "case 'neon_update_branch': return await this.updateBranch(args);", to: "case 'neon_update_branch': return await this.neonUpdateBranch(args);" },
  { from: "case 'neon_list_branches': return await this.listBranches(args);", to: "case 'neon_list_branches': return await this.neonListBranches(args);" },
  { from: "case 'neon_get_branch_details': return await this.getBranchDetails(args);", to: "case 'neon_get_branch_details': return await this.neonGetBranchDetails(args);" },
  { from: "case 'neon_restore_branch': return await this.restoreBranch(args);", to: "case 'neon_restore_branch': return await this.neonRestoreBranch(args);" },
  { from: "case 'neon_set_branch_protection': return await this.setBranchProtection(args);", to: "case 'neon_set_branch_protection': return await this.neonSetBranchProtection(args);" },
  { from: "case 'neon_get_branch_schema_diff': return await this.getBranchSchemaDiff(args);", to: "case 'neon_get_branch_schema_diff': return await this.neonGetBranchSchemaDiff(args);" },
  { from: "case 'neon_get_branch_data_diff': return await this.getBranchDataDiff(args);", to: "case 'neon_get_branch_data_diff': return await this.neonGetBranchDataDiff(args);" },
  { from: "case 'neon_merge_branches': return await this.mergeBranches(args);", to: "case 'neon_merge_branches': return await this.neonMergeBranches(args);" },
  { from: "case 'neon_promote_branch': return await this.promoteBranch(args);", to: "case 'neon_promote_branch': return await this.neonPromoteBranch(args);" },
  { from: "case 'neon_set_branch_retention': return await this.setBranchRetention(args);", to: "case 'neon_set_branch_retention': return await this.neonSetBranchRetention(args);" },
  { from: "case 'neon_get_branch_history': return await this.getBranchHistory(args);", to: "case 'neon_get_branch_history': return await this.neonGetBranchHistory(args);" },
  { from: "case 'neon_restore_branch_to_timestamp': return await this.restoreBranchToTimestamp(args);", to: "case 'neon_restore_branch_to_timestamp': return await this.neonRestoreBranchToTimestamp(args);" },
  { from: "case 'neon_get_branch_size': return await this.getBranchSize(args);", to: "case 'neon_get_branch_size': return await this.neonGetBranchSize(args);" },
  { from: "case 'neon_set_branch_compute_settings': return await this.setBranchComputeSettings(args);", to: "case 'neon_set_branch_compute_settings': return await this.neonSetBranchComputeSettings(args);" },
  { from: "case 'neon_get_branch_connections': return await this.getBranchConnections(args);", to: "case 'neon_get_branch_connections': return await this.neonGetBranchConnections(args);" },
  { from: "case 'neon_list_branch_computes': return await this.listBranchComputes(args);", to: "case 'neon_list_branch_computes': return await this.neonListBranchComputes(args);" },
];

// Use regex to fix ALL neon cases at once
// Pattern: case 'neon_xxx': return await this.yyy(args);
// Replace with: case 'neon_xxx': return await this.neonYyy(args);

const regex = /case 'neon_([a-z_]+)':\s*return await this\.([a-z][a-zA-Z0-9]*)\(args\);/g;

let fixCount = 0;
content = content.replace(regex, (match, toolSuffix, handlerName) => {
  // Skip if handler already has neon prefix
  if (handlerName.startsWith('neon')) {
    return match;
  }

  // Add neon prefix to handler name
  const fixedHandlerName = 'neon' + handlerName.charAt(0).toUpperCase() + handlerName.slice(1);
  fixCount++;

  return `case 'neon_${toolSuffix}': return await this.${fixedHandlerName}(args);`;
});

console.log(`✅ Applied ${fixCount} fixes`);

// Write back
fs.writeFileSync(INDEX_PATH, content, 'utf-8');

console.log(`✅ Fixed ${INDEX_PATH}\n`);

