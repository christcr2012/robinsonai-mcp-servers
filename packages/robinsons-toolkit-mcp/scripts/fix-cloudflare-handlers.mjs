#!/usr/bin/env node
/**
 * Fix Cloudflare handlers to use module-level client instead of this.cloudflareClient
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

const handlerFile = path.join(root, 'src/categories/cloudflare/handlers.ts');

console.log('🔧 Fixing Cloudflare handlers...');

let content = fs.readFileSync(handlerFile, 'utf8');
let changeCount = 0;

// Replace this.cloudflareClient with cloudflareClient
const beforeCount = (content.match(/this\.cloudflareClient/g) || []).length;
content = content.replace(/this\.cloudflareClient/g, 'cloudflareClient');
const afterCount = (content.match(/this\.cloudflareClient/g) || []).length;
changeCount += (beforeCount - afterCount);

console.log(`  ✅ Replaced ${beforeCount - afterCount} occurrences of this.cloudflareClient`);

// Remove 'this: any,' parameter from function signatures
const beforeThisCount = (content.match(/\(this: any,/g) || []).length;
content = content.replace(/\(this: any,\s*/g, '(');
const afterThisCount = (content.match(/\(this: any,/g) || []).length;
changeCount += (beforeThisCount - afterThisCount);

console.log(`  ✅ Removed ${beforeThisCount - afterThisCount} 'this: any' parameters`);

// Write back
fs.writeFileSync(handlerFile, content, 'utf8');

console.log(`\n✅ Fixed ${changeCount} total changes in cloudflare/handlers.ts`);

