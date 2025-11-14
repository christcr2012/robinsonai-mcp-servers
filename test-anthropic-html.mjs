#!/usr/bin/env node
/**
 * Fetch Anthropic pricing page and inspect HTML structure
 */

async function main() {
  console.log('🔍 Fetching Anthropic pricing page...\n');
  
  const response = await fetch('https://www.anthropic.com/pricing', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    console.log(`❌ Failed: ${response.status}`);
    return;
  }

  const html = await response.text();
  console.log(`✅ Fetched ${html.length} bytes\n`);

  // The page likely loads pricing via JavaScript
  // Let's just save the HTML to a file so we can inspect it
  const fs = await import('fs');
  fs.writeFileSync('anthropic-pricing.html', html);
  console.log('✅ Saved HTML to anthropic-pricing.html');
  console.log('\nℹ️  The pricing page likely loads data dynamically via JavaScript.');
  console.log('   This means web scraping won\'t work reliably.');
  console.log('   Fallback pricing is the correct approach.');
}

main().catch(console.error);

