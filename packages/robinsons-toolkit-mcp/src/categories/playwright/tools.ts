/**
 * Playwright Tool Definitions (50 tools)
 * 
 * Resource Groups:
 * - Browser Management: 10 tools
 * - Page Navigation: 10 tools
 * - Element Interaction: 15 tools
 * - Assertions & Waits: 10 tools
 * - Screenshots & Videos: 5 tools
 */

export const PLAYWRIGHT_TOOLS = [
  // ============================================================
  // BROWSER MANAGEMENT (10 tools)
  // ============================================================

  {
    name: 'playwright_launch_browser',
    description: 'Launch a new browser instance',
    inputSchema: {
      type: 'object',
      properties: {
        browserType: { type: 'string', description: 'Browser type (chromium, firefox, webkit)', enum: ['chromium', 'firefox', 'webkit'] },
        headless: { type: 'boolean', description: 'Run in headless mode (default: true)' },
        options: { type: 'object', description: 'Additional launch options' },
      },
      required: ['browserType'],
    },
  },
  {
    name: 'playwright_close_browser',
    description: 'Close the browser instance',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playwright_new_context',
    description: 'Create a new browser context',
    inputSchema: {
      type: 'object',
      properties: {
        options: { type: 'object', description: 'Context options (viewport, userAgent, etc.)' },
      },
    },
  },
  {
    name: 'playwright_close_context',
    description: 'Close a browser context',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playwright_new_page',
    description: 'Create a new page in the current context',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playwright_close_page',
    description: 'Close the current page',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playwright_get_pages',
    description: 'Get all open pages',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playwright_set_viewport',
    description: 'Set viewport size',
    inputSchema: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Viewport width' },
        height: { type: 'number', description: 'Viewport height' },
      },
      required: ['width', 'height'],
    },
  },
  {
    name: 'playwright_set_user_agent',
    description: 'Set user agent string',
    inputSchema: {
      type: 'object',
      properties: {
        userAgent: { type: 'string', description: 'User agent string' },
      },
      required: ['userAgent'],
    },
  },
  {
    name: 'playwright_set_extra_http_headers',
    description: 'Set extra HTTP headers',
    inputSchema: {
      type: 'object',
      properties: {
        headers: { type: 'object', description: 'HTTP headers as key-value pairs' },
      },
      required: ['headers'],
    },
  },

  // ============================================================
  // PAGE NAVIGATION (10 tools)
  // ============================================================

  {
    name: 'playwright_goto',
    description: 'Navigate to a URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to navigate to' },
        options: { type: 'object', description: 'Navigation options (waitUntil, timeout)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'playwright_go_back',
    description: 'Navigate back in history',
    inputSchema: {
      type: 'object',
      properties: {
        options: { type: 'object', description: 'Navigation options' },
      },
    },
  },
  {
    name: 'playwright_go_forward',
    description: 'Navigate forward in history',
    inputSchema: {
      type: 'object',
      properties: {
        options: { type: 'object', description: 'Navigation options' },
      },
    },
  },
  {
    name: 'playwright_reload',
    description: 'Reload the current page',
    inputSchema: {
      type: 'object',
      properties: {
        options: { type: 'object', description: 'Reload options' },
      },
    },
  },
  {
    name: 'playwright_get_url',
    description: 'Get the current page URL',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playwright_get_title',
    description: 'Get the page title',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playwright_get_content',
    description: 'Get the page HTML content',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'playwright_set_content',
    description: 'Set the page HTML content',
    inputSchema: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'HTML content to set' },
        options: { type: 'object', description: 'Set content options' },
      },
      required: ['html'],
    },
  },
  {
    name: 'playwright_wait_for_load_state',
    description: 'Wait for a specific load state',
    inputSchema: {
      type: 'object',
      properties: {
        state: { type: 'string', description: 'Load state (load, domcontentloaded, networkidle)', enum: ['load', 'domcontentloaded', 'networkidle'] },
        options: { type: 'object', description: 'Wait options' },
      },
    },
  },
  {
    name: 'playwright_wait_for_url',
    description: 'Wait for URL to match pattern',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL pattern to wait for' },
        options: { type: 'object', description: 'Wait options' },
      },
      required: ['url'],
    },
  },

  // ============================================================
  // ELEMENT INTERACTION (15 tools)
  // ============================================================

  {
    name: 'playwright_click',
    description: 'Click an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        options: { type: 'object', description: 'Click options (button, clickCount, delay)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_dblclick',
    description: 'Double-click an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        options: { type: 'object', description: 'Click options' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_fill',
    description: 'Fill an input field',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Input selector' },
        value: { type: 'string', description: 'Value to fill' },
        options: { type: 'object', description: 'Fill options' },
      },
      required: ['selector', 'value'],
    },
  },
  {
    name: 'playwright_type',
    description: 'Type text into an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        text: { type: 'string', description: 'Text to type' },
        options: { type: 'object', description: 'Type options (delay)' },
      },
      required: ['selector', 'text'],
    },
  },
  {
    name: 'playwright_press',
    description: 'Press a key',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        key: { type: 'string', description: 'Key to press (e.g., Enter, Tab, Escape)' },
        options: { type: 'object', description: 'Press options' },
      },
      required: ['selector', 'key'],
    },
  },
  {
    name: 'playwright_select_option',
    description: 'Select option(s) in a <select> element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Select element selector' },
        values: { description: 'Option value(s) to select' },
        options: { type: 'object', description: 'Select options' },
      },
      required: ['selector', 'values'],
    },
  },
  {
    name: 'playwright_check',
    description: 'Check a checkbox or radio button',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        options: { type: 'object', description: 'Check options' },
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
        selector: { type: 'string', description: 'Checkbox selector' },
        options: { type: 'object', description: 'Uncheck options' },
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
        selector: { type: 'string', description: 'Element selector' },
        options: { type: 'object', description: 'Hover options' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_focus',
    description: 'Focus an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        options: { type: 'object', description: 'Focus options' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_get_attribute',
    description: 'Get an element attribute',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        name: { type: 'string', description: 'Attribute name' },
      },
      required: ['selector', 'name'],
    },
  },
  {
    name: 'playwright_get_text_content',
    description: 'Get element text content',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_get_inner_text',
    description: 'Get element inner text',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_get_inner_html',
    description: 'Get element inner HTML',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },

  // ============================================================
  // ASSERTIONS & WAITS (10 tools)
  // ============================================================

  {
    name: 'playwright_wait_for_selector',
    description: 'Wait for an element to appear',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        options: { type: 'object', description: 'Wait options (state, timeout)' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_wait_for_timeout',
    description: 'Wait for a specific duration',
    inputSchema: {
      type: 'object',
      properties: {
        timeout: { type: 'number', description: 'Timeout in milliseconds' },
      },
      required: ['timeout'],
    },
  },
  {
    name: 'playwright_is_visible',
    description: 'Check if element is visible',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_is_hidden',
    description: 'Check if element is hidden',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_is_enabled',
    description: 'Check if element is enabled',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_is_disabled',
    description: 'Check if element is disabled',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_is_checked',
    description: 'Check if checkbox/radio is checked',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_is_editable',
    description: 'Check if element is editable',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_count_elements',
    description: 'Count matching elements',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_evaluate',
    description: 'Execute JavaScript in page context',
    inputSchema: {
      type: 'object',
      properties: {
        script: { type: 'string', description: 'JavaScript code to execute' },
        args: { description: 'Arguments to pass to the script' },
      },
      required: ['script'],
    },
  },

  // ============================================================
  // SCREENSHOTS & VIDEOS (5 tools)
  // ============================================================

  {
    name: 'playwright_screenshot',
    description: 'Take a screenshot',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to save screenshot' },
        options: { type: 'object', description: 'Screenshot options (fullPage, type, quality)' },
      },
    },
  },
  {
    name: 'playwright_screenshot_element',
    description: 'Take a screenshot of an element',
    inputSchema: {
      type: 'object',
      properties: {
        selector: { type: 'string', description: 'Element selector' },
        path: { type: 'string', description: 'File path to save screenshot' },
        options: { type: 'object', description: 'Screenshot options' },
      },
      required: ['selector'],
    },
  },
  {
    name: 'playwright_pdf',
    description: 'Generate PDF of the page',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to save PDF' },
        options: { type: 'object', description: 'PDF options (format, landscape, margin)' },
      },
    },
  },
  {
    name: 'playwright_start_video',
    description: 'Start recording video',
    inputSchema: {
      type: 'object',
      properties: {
        options: { type: 'object', description: 'Video recording options (dir, size)' },
      },
    },
  },
  {
    name: 'playwright_stop_video',
    description: 'Stop recording video',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

