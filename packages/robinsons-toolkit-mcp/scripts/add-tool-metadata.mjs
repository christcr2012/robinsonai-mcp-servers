#!/usr/bin/env node
/**
 * Add metadata (tags, dangerLevel) to tool definitions
 * 
 * This script analyzes tool names and descriptions to automatically add:
 * - tags: ["read", "write", "delete", etc.]
 * - dangerLevel: "safe" | "caution" | "dangerous"
 * 
 * Run after registry generation to enhance tool metadata.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');

console.log('🏷️  Adding metadata to tools...');

// Load registry
const registryPath = join(DIST, 'registry.json');
const tools = JSON.parse(readFileSync(registryPath, 'utf8'));

// Patterns for automatic tagging
const TAG_PATTERNS = {
  // Operation types
  read: /^(get|list|search|find|fetch|retrieve|read|show|view|describe)_/i,
  write: /^(create|add|insert|post|put|update|modify|edit|set|enable|configure)_/i,
  delete: /^(delete|remove|destroy|clear|disable)_/i,
  
  // Resource types (GitHub)
  repo: /_repo/i,
  issue: /_issue/i,
  pr: /_(pr|pull_request)/i,
  commit: /_commit/i,
  branch: /_branch/i,
  workflow: /_workflow/i,
  
  // Resource types (Vercel)
  deployment: /_deployment/i,
  project: /_project/i,
  domain: /_domain/i,
  
  // Resource types (OpenAI)
  chat: /_chat/i,
  embedding: /_embedding/i,
  image: /_image/i,
  audio: /_audio/i,
  assistant: /_assistant/i,
  
  // Resource types (Google)
  email: /(gmail|email)/i,
  file: /(drive|file)/i,
  calendar: /calendar/i,
  spreadsheet: /(sheet|spreadsheet)/i,
  document: /(doc|document)/i,
  
  // Resource types (Database)
  database: /(database|db|postgres|neo4j|qdrant|redis)/i,
  query: /query/i,
  vector: /vector/i,
};

// Danger level classification
function classifyDangerLevel(toolName, description) {
  const name = toolName.toLowerCase();
  const desc = (description || '').toLowerCase();

  // Dangerous: Destructive operations (delete anywhere in name)
  if (name.includes('delete') || name.includes('remove') || name.includes('destroy') ||
      name.includes('drop') || name.includes('truncate') || name.includes('purge')) {
    return 'dangerous';
  }
  if (desc.includes('delete') || desc.includes('permanently') || desc.includes('cannot be undone')) {
    return 'dangerous';
  }

  // Safe: Read-only operations (check after category prefix)
  if (name.match(/_(get|list|search|find|fetch|retrieve|read|show|view|describe|check)_/) ||
      name.match(/^(get|list|search|find|fetch|retrieve|read|show|view|describe|check)_/)) {
    return 'safe';
  }

  // Caution: Modifying operations
  if (name.match(/_(create|update|modify|edit|set|enable|disable|configure|transfer|merge|add|insert|post|put)_/) ||
      name.match(/^(create|update|modify|edit|set|enable|disable|configure|transfer|merge|add|insert|post|put)_/)) {
    return 'caution';
  }

  // Default to caution for unknown patterns
  return 'caution';
}

// Add tags based on patterns
function addTags(toolName, description) {
  const tags = [];
  const name = toolName.toLowerCase();
  const desc = (description || '').toLowerCase();
  
  for (const [tag, pattern] of Object.entries(TAG_PATTERNS)) {
    if (pattern.test(name) || pattern.test(desc)) {
      tags.push(tag);
    }
  }
  
  return tags.length > 0 ? tags : undefined;
}

// Process all tools
let enhanced = 0;
for (const tool of tools) {
  const tags = addTags(tool.name, tool.description);
  const dangerLevel = classifyDangerLevel(tool.name, tool.description);
  
  if (tags) {
    tool.tags = tags;
    enhanced++;
  }
  
  if (dangerLevel) {
    tool.dangerLevel = dangerLevel;
    enhanced++;
  }
}

// Write enhanced registry
writeFileSync(registryPath, JSON.stringify(tools, null, 2));

console.log(`✅ Enhanced ${enhanced} tool metadata entries`);
console.log(`📊 Total tools: ${tools.length}`);
console.log(`✅ Updated ${registryPath}`);

