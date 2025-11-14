#!/usr/bin/env node
/**
 * Test web scrapers for pricing pages
 */

async function testScraper(name, url) {
  console.log(`\n🔍 Testing ${name} scraper:`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log(`   Status: ${response.status}`);
    console.log(`   OK: ${response.ok}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`   HTML Length: ${html.length} bytes`);
      console.log(`   ✅ SUCCESS - Page fetched`);
      
      // Show first 500 chars
      console.log(`\n   First 500 chars:`);
      console.log(`   ${html.substring(0, 500).replace(/\n/g, ' ')}`);
    } else {
      console.log(`   ❌ FAILED - Status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 Testing Pricing Page Scrapers\n');
  
  await testScraper('OpenAI', 'https://openai.com/api/pricing/');
  await testScraper('Anthropic', 'https://www.anthropic.com/pricing');
  await testScraper('Moonshot', 'https://platform.moonshot.cn/docs/price/chat');
  await testScraper('Voyage', 'https://www.voyageai.com/pricing');
  
  console.log('\n\n✅ All scraper tests complete!');
}

main().catch(console.error);

