#!/usr/bin/env node
/**
 * Test if we can fetch pricing pages
 */

async function testFetch(name, url) {
  console.log(`\n🔍 Testing ${name}:`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`   ✅ SUCCESS - ${html.length} bytes`);
      
      // Check for pricing indicators
      if (name === 'OpenAI') {
        console.log(`   Contains "gpt-4o": ${html.includes('gpt-4o')}`);
        console.log(`   Contains "$": ${html.includes('$')}`);
      } else if (name === 'Anthropic') {
        console.log(`   Contains "Claude": ${html.includes('Claude')}`);
        console.log(`   Contains "$": ${html.includes('$')}`);
      } else if (name === 'Moonshot') {
        console.log(`   Contains "moonshot": ${html.includes('moonshot')}`);
        console.log(`   Contains "¥": ${html.includes('¥')}`);
      } else if (name === 'Voyage') {
        console.log(`   Contains "voyage": ${html.includes('voyage')}`);
        console.log(`   Contains "$": ${html.includes('$')}`);
      }
    } else {
      console.log(`   ❌ FAILED - Status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Testing Pricing Page Fetches\n');
  
  await testFetch('OpenAI', 'https://openai.com/api/pricing/');
  await testFetch('Anthropic', 'https://www.anthropic.com/pricing');
  await testFetch('Moonshot', 'https://platform.moonshot.ai/');
  await testFetch('Voyage', 'https://docs.voyageai.com/docs/pricing');
  
  console.log('\n✅ All tests complete!');
}

main().catch(console.error);

