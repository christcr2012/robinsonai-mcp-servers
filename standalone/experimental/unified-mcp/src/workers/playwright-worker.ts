/**
 * Playwright Worker Thread
 * 
 * Runs Playwright in a separate worker thread to avoid blocking stdio
 * during browser launch and heavy operations.
 */

import { parentPort } from 'worker_threads';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;

async function handleMessage(message: any) {
  const { id, action, params } = message;

  try {
    let result: any;

    switch (action) {
      case 'launch':
        if (!browser) {
          browser = await chromium.launch({ 
            headless: true, 
            timeout: 30000 
          });
          context = await browser.newContext();
          page = await context.newPage();
        }
        result = { success: true, message: 'Browser launched' };
        break;

      case 'navigate':
        if (!page) throw new Error('Browser not launched');
        await page.goto(params.url, { timeout: 30000 });
        result = { success: true, url: page.url() };
        break;

      case 'screenshot':
        if (!page) throw new Error('Browser not launched');
        const screenshot = await page.screenshot({ 
          type: params.type || 'png',
          fullPage: params.fullPage || false 
        });
        result = { success: true, screenshot: screenshot.toString('base64') };
        break;

      case 'click':
        if (!page) throw new Error('Browser not launched');
        await page.click(params.selector);
        result = { success: true };
        break;

      case 'type':
        if (!page) throw new Error('Browser not launched');
        await page.fill(params.selector, params.text);
        result = { success: true };
        break;

      case 'evaluate':
        if (!page) throw new Error('Browser not launched');
        const evalResult = await page.evaluate(params.script);
        result = { success: true, result: evalResult };
        break;

      case 'close':
        if (browser) {
          await browser.close();
          browser = null;
          context = null;
          page = null;
        }
        result = { success: true, message: 'Browser closed' };
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    parentPort?.postMessage({ id, success: true, result });
  } catch (error: any) {
    parentPort?.postMessage({ 
      id, 
      success: false, 
      error: error.message 
    });
  }
}

parentPort?.on('message', handleMessage);

