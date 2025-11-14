#!/usr/bin/env node
/**
 * Test Playwright-based pricing scraper
 */

import { chromium } from 'playwright';

async function testAnthropicScraper() {
  console.log('🔍 Testing Anthropic pricing scraper with Playwright...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Use the direct API pricing section!
    await page.goto('https://claude.com/pricing#api', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Page loaded:', page.url());

    // Wait for the API section to be visible
    await page.waitForTimeout(3000);

    // Take screenshot to see what we got
    await page.screenshot({ path: 'claude-api-pricing.png', fullPage: true });
    console.log('📸 Screenshot saved to claude-api-pricing.png');

    // Extract all text content
    const text = await page.evaluate(() => document.body.innerText);

    console.log(`\n📄 Page text length: ${text.length} characters\n`);

    // Save full text to file for inspection
    const fs = await import('fs');
    fs.writeFileSync('claude-pricing-text.txt', text);
    console.log('💾 Full text saved to claude-pricing-text.txt\n');

    // Search for any lines with dollar signs
    console.log('🔍 Searching for ALL lines with "$"...');
    const dollarLines = text.split('\n').filter(line => line.includes('$'));
    console.log(`Found ${dollarLines.length} lines with "$":`);
    dollarLines.forEach(line => console.log(`  ${line.trim()}`));

    // Search for pricing patterns
    console.log('\n🔍 Searching for pricing lines...');
    const pricingLines = text.split('\n').filter(line => {
      const lower = line.toLowerCase();
      return (line.includes('$') && (
        lower.includes('input') ||
        lower.includes('output') ||
        lower.includes('mtok') ||
        lower.includes('million') ||
        lower.includes('sonnet') ||
        lower.includes('haiku') ||
        lower.includes('opus')
      ));
    });
    console.log(`Found ${pricingLines.length} pricing lines:`);
    pricingLines.slice(0, 50).forEach(line => {
      const trimmed = line.trim();
      if (trimmed) console.log(`  ${trimmed}`);
    });

  } finally {
    await browser.close();
  }
}

async function testMoonshotScraper() {
  console.log('\n\n🔍 Testing Moonshot pricing scraper with Playwright...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://platform.moonshot.ai/', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Page loaded, waiting for content...');
    await page.waitForTimeout(3000);

    const text = await page.evaluate(() => document.body.innerText);
    
    console.log(`\n📄 Page text length: ${text.length} characters\n`);
    
    // Search for pricing
    console.log('🔍 Searching for pricing mentions...');
    const pricingLines = text.split('\n').filter(line => 
      line.includes('$') || line.includes('¥') || line.toLowerCase().includes('price') || line.toLowerCase().includes('cost')
    );
    pricingLines.slice(0, 10).forEach(line => console.log(`  ${line.trim()}`));

  } finally {
    await browser.close();
  }
}

async function testVoyageScraper() {
  console.log('\n\n🔍 Testing Voyage pricing scraper with Playwright...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://docs.voyageai.com/docs/pricing', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Page loaded, waiting for content...');
    await page.waitForTimeout(3000);

    const text = await page.evaluate(() => document.body.innerText);
    
    console.log(`\n📄 Page text length: ${text.length} characters\n`);
    
    // Search for voyage-3 pricing
    console.log('🔍 Searching for "voyage-3" pricing...');
    const voyageLines = text.split('\n').filter(line => 
      line.toLowerCase().includes('voyage') && line.includes('$')
    );
    voyageLines.slice(0, 10).forEach(line => console.log(`  ${line.trim()}`));

  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    await testAnthropicScraper();
    await testMoonshotScraper();
    await testVoyageScraper();
    console.log('\n✅ All Playwright scraper tests complete!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

