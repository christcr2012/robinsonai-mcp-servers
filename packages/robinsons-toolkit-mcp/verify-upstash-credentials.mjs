#!/usr/bin/env node

/**
 * Upstash Credentials Verification Script
 * 
 * This script helps verify your Upstash Management API credentials.
 * 
 * Usage:
 *   node verify-upstash-credentials.mjs
 * 
 * What it checks:
 * 1. Loads credentials from .env.local
 * 2. Displays credential format information
 * 3. Tests authentication with Upstash Management API
 * 4. Provides guidance on getting the correct API key
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local (in repo root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '..', '.env.local');
config({ path: envPath });

console.log('═══════════════════════════════════════════════════════════════');
console.log('  UPSTASH CREDENTIALS VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// Get credentials from environment
const email = process.env.UPSTASH_EMAIL;
const apiKey = process.env.UPSTASH_API_KEY;

console.log('📋 Current Credentials:\n');
console.log(`   Email: ${email || '❌ NOT SET'}`);
console.log(`   API Key: ${apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)` : '❌ NOT SET'}\n`);

// Analyze API key format
if (apiKey) {
  console.log('🔍 API Key Analysis:\n');
  
  const isHexString = /^[a-f0-9]+$/i.test(apiKey);
  const length = apiKey.length;
  
  console.log(`   Length: ${length} characters`);
  console.log(`   Format: ${isHexString ? 'Hexadecimal string' : 'Mixed characters'}`);
  
  if (length === 32 && isHexString) {
    console.log('\n   ⚠️  WARNING: This looks like a DATABASE REST TOKEN, not a Management API key!');
    console.log('   ⚠️  Database tokens are 32-character hex strings.');
    console.log('   ⚠️  Management API keys are typically longer and may contain dashes/underscores.\n');
  } else if (length > 50) {
    console.log('\n   ✅ This looks like a valid Management API key format.\n');
  } else {
    console.log('\n   ⚠️  This key format is unusual. Please verify it\'s from the Management API section.\n');
  }
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  HOW TO GET THE CORRECT MANAGEMENT API KEY');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('1. Go to: https://console.upstash.com/');
console.log('2. Click on your profile/account icon (top right)');
console.log('3. Select "Account" or "Settings"');
console.log('4. Look for "Management API" or "API Keys" section');
console.log('5. Copy the API key from there (NOT from individual database settings)\n');

console.log('The Management API key should be:');
console.log('  • Longer than 32 characters');
console.log('  • May contain letters, numbers, dashes, or underscores');
console.log('  • Different from database-specific REST tokens\n');

// Test authentication if credentials are present
if (email && apiKey) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  TESTING AUTHENTICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('Testing connection to Upstash Management API...\n');
  
  const credentials = Buffer.from(`${email}:${apiKey}`).toString('base64');
  
  try {
    const response = await fetch('https://api.upstash.com/v2/redis/databases', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Response Status: ${response.status} ${response.statusText}\n`);
    
    if (response.ok) {
      const databases = await response.json();
      console.log('✅ SUCCESS! Authentication works!\n');
      console.log(`Found ${databases.length} database(s):\n`);
      
      if (databases.length === 0) {
        console.log('   (No databases yet - this is expected for a new account)\n');
      } else {
        databases.forEach((db, index) => {
          console.log(`   ${index + 1}. ${db.database_name} (${db.region})`);
        });
        console.log('');
      }
      
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('  ✅ CREDENTIALS ARE VALID!');
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log('You can now proceed with testing the Upstash integration.\n');
      
    } else {
      const errorText = await response.text();
      console.log('❌ AUTHENTICATION FAILED!\n');
      console.log(`Error: ${errorText}\n`);
      
      if (response.status === 401) {
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('  ❌ INVALID CREDENTIALS');
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('The API key or email is incorrect.\n');
        console.log('Please verify:');
        console.log('1. You\'re using the Management API key (not a database token)');
        console.log('2. The email matches your Upstash account');
        console.log('3. The API key was copied correctly (no extra spaces)\n');
        console.log('To get the correct key, follow the steps above.\n');
      }
    }
    
  } catch (error) {
    console.log('❌ CONNECTION ERROR!\n');
    console.log(`Error: ${error.message}\n`);
    console.log('Please check your internet connection and try again.\n');
  }
  
} else {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ⚠️  CREDENTIALS NOT CONFIGURED');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Please add your Upstash credentials to .env.local:\n');
  console.log('UPSTASH_EMAIL="your-email@example.com"');
  console.log('UPSTASH_API_KEY="your-management-api-key"\n');
}

console.log('═══════════════════════════════════════════════════════════════\n');

