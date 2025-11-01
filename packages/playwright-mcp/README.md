# @robinsonai/playwright-mcp

**Enhanced Playwright MCP Server**

Complete browser automation with 42 tools - all capabilities enabled by default plus powerful enhancements.

## 🌐 Features

### 42 Browser Automation Tools

#### Core Navigation (4 tools)
- `playwright_navigate` - Navigate to URL
- `playwright_navigate_back` - Go back
- `playwright_navigate_forward` - Go forward
- `playwright_reload` - Reload page

#### Interaction (8 tools)
- `playwright_click` - Click elements
- `playwright_type` - Type text
- `playwright_fill` - Fill input fields
- `playwright_select` - Select dropdown options
- `playwright_check` - Check checkboxes
- `playwright_uncheck` - Uncheck checkboxes
- `playwright_hover` - Hover over elements
- `playwright_press` - Press keyboard keys

#### Content Extraction (5 tools)
- `playwright_get_text` - Get element text
- `playwright_get_attribute` - Get element attributes
- `playwright_get_html` - Get HTML content
- `playwright_get_title` - Get page title
- `playwright_get_url` - Get current URL

#### Screenshots & PDFs (2 tools)
- `playwright_screenshot` - Take screenshots
- `playwright_pdf` - Generate PDFs

#### Waiting (3 tools)
- `playwright_wait_for_selector` - Wait for elements
- `playwright_wait_for_timeout` - Wait for time
- `playwright_wait_for_load_state` - Wait for page load

#### JavaScript Execution (1 tool)
- `playwright_evaluate` - Execute JavaScript

#### Cookie Management (3 tools - NEW)
- `playwright_get_cookies` - Get all cookies
- `playwright_set_cookie` - Set a cookie
- `playwright_clear_cookies` - Clear all cookies

#### Storage Management (3 tools - NEW)
- `playwright_get_local_storage` - Get local storage
- `playwright_set_local_storage` - Set local storage
- `playwright_clear_local_storage` - Clear local storage

#### Performance (1 tool - NEW)
- `playwright_get_performance_metrics` - Get page performance metrics

#### Data Extraction (2 tools - NEW)
- `playwright_extract_table` - Extract data from HTML tables
- `playwright_extract_links` - Extract all links from page

#### Browser Management (1 tool)
- `playwright_close` - Close browser

## 🚀 Installation

```bash
cd packages/playwright-mcp
npm install
npm run build
npm link
```

## ⚙️ Configuration

### For Augment Code

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["playwright-mcp"]
    }
  }
}
```

Windows (VS Code Augment) – prefer absolute executables:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "C:\\nvm4w\\nodejs\\playwright-mcp.cmd",
      "args": []
    }
  }
}
```

Or explicit node + dist entry:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "C:\\Program Files\\nodejs\\node.exe",
      "args": [
        "C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers\\packages\\playwright-mcp\\dist\\index.js"
      ]
    }
  }
}
```

## 📖 Usage Examples

### Navigate and Extract
```typescript
// Navigate to a page
{ "url": "https://example.com" }

// Get page title
{}

// Extract all links
{}
```

### Form Automation
```typescript
// Fill a form
{ "selector": "#email", "value": "user@example.com" }
{ "selector": "#password", "value": "secret" }
{ "selector": "#submit", "click": true }
```

### Cookie Management
```typescript
// Set a cookie
{
  "name": "session",
  "value": "abc123",
  "domain": "example.com"
}

// Get all cookies
{}
```

### Performance Monitoring
```typescript
// Get performance metrics
{}
// Returns: load time, DOM content loaded, first paint, etc.
```

### Data Extraction
```typescript
// Extract table data
{ "selector": "table.data" }
// Returns: Structured array of table rows and columns
```

## 🎯 Benefits

- **Complete Automation**: All 42 tools for comprehensive browser control
- **All Capabilities Enabled**: Vision, PDF, testing, tracing - all included
- **Enhanced Features**: Cookie management, storage access, performance metrics
- **Data Extraction**: Built-in tools for extracting structured data
- **Headless or Visible**: Run with browser visible for debugging
- **Fast Initialization**: Single process, quick startup

## 📝 License

MIT - Robinson AI Systems

