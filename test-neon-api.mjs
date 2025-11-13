#!/usr/bin/env node

/**
 * Test Neon API directly to diagnose 400 error
 */

const NEON_API_KEY = process.env.NEON_API_KEY;

if (!NEON_API_KEY) {
  console.error('❌ NEON_API_KEY not set');
  process.exit(1);
}

console.log('🔍 Testing Neon API...\n');

// Test 1: List projects without org_id
console.log('Test 1: List projects WITHOUT org_id parameter');
try {
  const response1 = await fetch('https://console.neon.tech/api/v2/projects', {
    headers: {
      'Authorization': `Bearer ${NEON_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  console.log('Status:', response1.status, response1.statusText);
  const data1 = await response1.text();
  
  if (!response1.ok) {
    console.log('❌ Error Response:', data1);
  } else {
    console.log('✅ Success:', JSON.parse(data1));
  }
} catch (error) {
  console.error('❌ Request failed:', error.message);
}

console.log('\n---\n');

// Test 2: Get user organizations
console.log('Test 2: Get user organizations');
try {
  const response2 = await fetch('https://console.neon.tech/api/v2/users/me/organizations', {
    headers: {
      'Authorization': `Bearer ${NEON_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  console.log('Status:', response2.status, response2.statusText);
  const data2 = await response2.json();

  if (!response2.ok) {
    console.log('❌ Error Response:', data2);
  } else {
    console.log('✅ Organizations:', JSON.stringify(data2, null, 2));

    // Test 3: List projects WITH org_id if available
    if (data2.organizations && data2.organizations.length > 0) {
      const orgId = data2.organizations[0].id;
      console.log('\n---\n');
      console.log('Test 3: List projects WITH org_id:', orgId);

      const response3 = await fetch(`https://console.neon.tech/api/v2/projects?org_id=${orgId}`, {
        headers: {
          'Authorization': `Bearer ${NEON_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Status:', response3.status, response3.statusText);
      const data3 = await response3.json();

      if (!response3.ok) {
        console.log('❌ Error Response:', data3);
      } else {
        console.log('✅ Projects:', JSON.stringify(data3, null, 2));
      }
    }
  }
} catch (error) {
  console.error('❌ Request failed:', error.message);
}

