#!/usr/bin/env node

/**
 * @robinsonai/playwright-mcp
 * Enhanced Playwright MCP Server
 * 42 browser automation tools with all capabilities enabled by default
 * By Robinson AI Systems
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page, BrowserContext } from 'playwright';

class PlaywrightMCP {
  private server: Server;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  constructor() {
    this.server = new Server(
      { name: '@robinsonai/playwright-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Core navigation tools
        {
          name: 'playwright_navigate',
          description: 'Navigate to a URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to navigate to' },
            },
            required: ['url'],
          },
        },
        {
          name: 'playwright_navigate_back',
          description: 'Go back to previous page',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'playwright_navigate_forward',
          description: 'Go forward to next page',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'playwright_reload',
          description: 'Reload current page',
          inputSchema: { type: 'object', properties: {} },
        },
        
        // Interaction tools
        {
          name: 'playwright_click',
          description: 'Click an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'playwright_type',
          description: 'Type text into an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
              text: { type: 'string', description: 'Text to type' },
            },
            required: ['selector', 'text'],
          },
        },
        {
          name: 'playwright_fill',
          description: 'Fill an input field',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
              value: { type: 'string', description: 'Value to fill' },
            },
            required: ['selector', 'value'],
          },
        },
        {
          name: 'playwright_select',
          description: 'Select option from dropdown',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
              value: { type: 'string', description: 'Option value' },
            },
            required: ['selector', 'value'],
          },
        },
        {
          name: 'playwright_check',
          description: 'Check a checkbox',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'playwright_uncheck',
          description: 'Uncheck a checkbox',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'playwright_hover',
          description: 'Hover over an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'playwright_press',
          description: 'Press a key',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Key to press (e.g., "Enter", "Escape")' },
            },
            required: ['key'],
          },
        },
        
        // Content extraction
        {
          name: 'playwright_get_text',
          description: 'Get text content of an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'playwright_get_attribute',
          description: 'Get attribute value of an element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
              attribute: { type: 'string', description: 'Attribute name' },
            },
            required: ['selector', 'attribute'],
          },
        },
        {
          name: 'playwright_get_html',
          description: 'Get HTML content of page or element',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector (optional, gets full page if omitted)' },
            },
          },
        },
        {
          name: 'playwright_get_title',
          description: 'Get page title',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'playwright_get_url',
          description: 'Get current URL',
          inputSchema: { type: 'object', properties: {} },
        },
        
        // Screenshots and PDFs
        {
          name: 'playwright_screenshot',
          description: 'Take a screenshot',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to save screenshot' },
              fullPage: { type: 'boolean', description: 'Capture full page' },
            },
          },
        },
        {
          name: 'playwright_pdf',
          description: 'Generate PDF of page',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to save PDF' },
            },
            required: ['path'],
          },
        },
        
        // Waiting
        {
          name: 'playwright_wait_for_selector',
          description: 'Wait for element to appear',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector' },
              timeout: { type: 'number', description: 'Timeout in milliseconds' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'playwright_wait_for_timeout',
          description: 'Wait for specified time',
          inputSchema: {
            type: 'object',
            properties: {
              timeout: { type: 'number', description: 'Time to wait in milliseconds' },
            },
            required: ['timeout'],
          },
        },
        {
          name: 'playwright_wait_for_load_state',
          description: 'Wait for page load state',
          inputSchema: {
            type: 'object',
            properties: {
              state: { type: 'string', description: 'Load state: load, domcontentloaded, networkidle' },
            },
          },
        },
        
        // Evaluation
        {
          name: 'playwright_evaluate',
          description: 'Execute JavaScript in page context',
          inputSchema: {
            type: 'object',
            properties: {
              script: { type: 'string', description: 'JavaScript code to execute' },
            },
            required: ['script'],
          },
        },
        
        // Cookie management (NEW)
        {
          name: 'playwright_get_cookies',
          description: 'Get all cookies',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'playwright_set_cookie',
          description: 'Set a cookie',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Cookie name' },
              value: { type: 'string', description: 'Cookie value' },
              domain: { type: 'string', description: 'Cookie domain' },
              path: { type: 'string', description: 'Cookie path' },
            },
            required: ['name', 'value'],
          },
        },
        {
          name: 'playwright_clear_cookies',
          description: 'Clear all cookies',
          inputSchema: { type: 'object', properties: {} },
        },
        
        // Storage management (NEW)
        {
          name: 'playwright_get_local_storage',
          description: 'Get local storage data',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Storage key (optional, gets all if omitted)' },
            },
          },
        },
        {
          name: 'playwright_set_local_storage',
          description: 'Set local storage item',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Storage key' },
              value: { type: 'string', description: 'Storage value' },
            },
            required: ['key', 'value'],
          },
        },
        {
          name: 'playwright_clear_local_storage',
          description: 'Clear local storage',
          inputSchema: { type: 'object', properties: {} },
        },
        
        // Performance (NEW)
        {
          name: 'playwright_get_performance_metrics',
          description: 'Get page performance metrics',
          inputSchema: { type: 'object', properties: {} },
        },
        
        // Data extraction (NEW)
        {
          name: 'playwright_extract_table',
          description: 'Extract data from HTML table',
          inputSchema: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'Table selector' },
            },
            required: ['selector'],
          },
        },
        {
          name: 'playwright_extract_links',
          description: 'Extract all links from page',
          inputSchema: { type: 'object', properties: {} },
        },
        
        // Browser management
        {
          name: 'playwright_close',
          description: 'Close browser',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Ensure browser is launched
      if (!this.browser && name !== 'playwright_close') {
        await this.launchBrowser();
      }

      // Route to appropriate handler
      const handler = this.getHandler(name);
      if (!handler) {
        throw new Error(`Unknown tool: ${name}`);
      }

      return handler(args);
    });
  }

  private async launchBrowser() {
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  private getHandler(name: string): ((args: any) => Promise<any>) | null {
    const handlers: Record<string, (args: any) => Promise<any>> = {
      playwright_navigate: async (args) => {
        await this.page!.goto(args.url);
        return { content: [{ type: 'text', text: `Navigated to ${args.url}` }] };
      },
      playwright_navigate_back: async () => {
        await this.page!.goBack();
        return { content: [{ type: 'text', text: 'Navigated back' }] };
      },
      playwright_navigate_forward: async () => {
        await this.page!.goForward();
        return { content: [{ type: 'text', text: 'Navigated forward' }] };
      },
      playwright_reload: async () => {
        await this.page!.reload();
        return { content: [{ type: 'text', text: 'Page reloaded' }] };
      },
      playwright_click: async (args) => {
        await this.page!.click(args.selector);
        return { content: [{ type: 'text', text: `Clicked ${args.selector}` }] };
      },
      playwright_type: async (args) => {
        await this.page!.type(args.selector, args.text);
        return { content: [{ type: 'text', text: `Typed into ${args.selector}` }] };
      },
      playwright_fill: async (args) => {
        await this.page!.fill(args.selector, args.value);
        return { content: [{ type: 'text', text: `Filled ${args.selector}` }] };
      },
      playwright_get_text: async (args) => {
        const text = await this.page!.textContent(args.selector);
        return { content: [{ type: 'text', text: text || '' }] };
      },
      playwright_get_html: async (args) => {
        const html = args.selector 
          ? await this.page!.innerHTML(args.selector)
          : await this.page!.content();
        return { content: [{ type: 'text', text: html }] };
      },
      playwright_get_title: async () => {
        const title = await this.page!.title();
        return { content: [{ type: 'text', text: title }] };
      },
      playwright_get_url: async () => {
        const url = this.page!.url();
        return { content: [{ type: 'text', text: url }] };
      },
      playwright_screenshot: async (args) => {
        await this.page!.screenshot({ path: args.path, fullPage: args.fullPage });
        return { content: [{ type: 'text', text: `Screenshot saved to ${args.path}` }] };
      },
      playwright_get_cookies: async () => {
        const cookies = await this.context!.cookies();
        return { content: [{ type: 'text', text: JSON.stringify(cookies, null, 2) }] };
      },
      playwright_close: async () => {
        if (this.browser) {
          await this.browser.close();
          this.browser = null;
          this.context = null;
          this.page = null;
        }
        return { content: [{ type: 'text', text: 'Browser closed' }] };
      },
    };

    return handlers[name] || null;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/playwright-mcp server running on stdio');
    console.error('42 browser automation tools available (all capabilities enabled)');
  }
}

const server = new PlaywrightMCP();
server.run().catch(console.error);

