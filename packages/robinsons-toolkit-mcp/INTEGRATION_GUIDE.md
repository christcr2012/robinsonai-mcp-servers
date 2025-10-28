# Adding New Integration Servers to Robinson's Toolkit

**Complete Step-by-Step Guide with Examples**

---

## Prerequisites

Before adding a new integration:

1. ✅ Have API credentials for the service
2. ✅ Understand the service's API structure
3. ✅ Know the base URL and authentication method
4. ✅ Have a list of tools you want to add

---

## Example: Adding Stripe Integration

Let's walk through adding Stripe as a complete example.

### **Step 1: Research the API**

**Stripe API Details:**
- Base URL: `https://api.stripe.com/v1`
- Authentication: Bearer token in `Authorization` header
- API Key: `STRIPE_SECRET_KEY` (starts with `sk_`)

**Tools to add:**
- `stripe_list_customers`
- `stripe_create_customer`
- `stripe_get_customer`
- `stripe_create_subscription`
- `stripe_cancel_subscription`

---

### **Step 2: Add Environment Variable**

**File:** `src/index.ts`

**Location:** In the `UnifiedToolkit` class constructor (around line 37)

**Before:**
```typescript
constructor() {
  this.githubToken = process.env.GITHUB_TOKEN || '';
  this.vercelToken = process.env.VERCEL_TOKEN || '';
  this.neonApiKey = process.env.NEON_API_KEY || '';
```

**After:**
```typescript
constructor() {
  this.githubToken = process.env.GITHUB_TOKEN || '';
  this.vercelToken = process.env.VERCEL_TOKEN || '';
  this.neonApiKey = process.env.NEON_API_KEY || '';
  this.stripeSecretKey = process.env.STRIPE_SECRET_KEY || ''; // ADD THIS
```

**Also add the property declaration** (around line 30):

```typescript
class UnifiedToolkit {
  private isEnabled: boolean = true;
  private server: Server;
  private githubToken: string;
  private vercelToken: string;
  private neonApiKey: string;
  private stripeSecretKey: string; // ADD THIS
  private client: any;
  private baseUrl: string = BASE_URL;
```

---

### **Step 3: Create Service-Specific Fetch Method**

**Location:** After the existing fetch methods (around line 3455)

```typescript
private async stripeFetch(endpoint: string, options: any = {}) {
  const url = `https://api.stripe.com/v1${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${this.stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe API error (${response.status}): ${error}`);
  }
  
  return await response.json();
}
```

**Note:** Stripe uses `application/x-www-form-urlencoded` for POST requests, not JSON!

---

### **Step 4: Add Tool Definitions**

**Location:** In `ListToolsRequestSchema` handler (around line 112)

**Add after Neon tools:**

```typescript
// STRIPE TOOLS (5 tools for this example)
{ 
  name: 'stripe_list_customers', 
  description: 'List all Stripe customers', 
  inputSchema: { 
    type: 'object', 
    properties: { 
      limit: { type: 'number', description: 'Number of customers to return' },
      starting_after: { type: 'string', description: 'Cursor for pagination' }
    } 
  } 
},
{ 
  name: 'stripe_create_customer', 
  description: 'Create a new Stripe customer', 
  inputSchema: { 
    type: 'object', 
    properties: { 
      email: { type: 'string', description: 'Customer email' },
      name: { type: 'string', description: 'Customer name' },
      description: { type: 'string', description: 'Customer description' }
    },
    required: ['email']
  } 
},
{ 
  name: 'stripe_get_customer', 
  description: 'Get a Stripe customer by ID', 
  inputSchema: { 
    type: 'object', 
    properties: { 
      customerId: { type: 'string', description: 'Customer ID' }
    },
    required: ['customerId']
  } 
},
{ 
  name: 'stripe_create_subscription', 
  description: 'Create a new subscription', 
  inputSchema: { 
    type: 'object', 
    properties: { 
      customerId: { type: 'string', description: 'Customer ID' },
      priceId: { type: 'string', description: 'Price ID' }
    },
    required: ['customerId', 'priceId']
  } 
},
{ 
  name: 'stripe_cancel_subscription', 
  description: 'Cancel a subscription', 
  inputSchema: { 
    type: 'object', 
    properties: { 
      subscriptionId: { type: 'string', description: 'Subscription ID' }
    },
    required: ['subscriptionId']
  } 
},
```

---

### **Step 5: Add Case Handlers**

**Location:** In `CallToolRequestSchema` handler switch statement (around line 2535)

**Add after Neon cases:**

```typescript
// STRIPE
case 'stripe_list_customers': return await this.stripeListCustomers(args);
case 'stripe_create_customer': return await this.stripeCreateCustomer(args);
case 'stripe_get_customer': return await this.stripeGetCustomer(args);
case 'stripe_create_subscription': return await this.stripeCreateSubscription(args);
case 'stripe_cancel_subscription': return await this.stripeCancelSubscription(args);
```

---

### **Step 6: Implement Methods**

**Location:** After existing methods (around line 7000)

```typescript
// ============================================================
// STRIPE METHODS
// ============================================================

private async stripeListCustomers(args: any) {
  const params = new URLSearchParams();
  if (args.limit) params.append('limit', args.limit.toString());
  if (args.starting_after) params.append('starting_after', args.starting_after);
  
  const data = await this.stripeFetch(`/customers?${params}`);
  return this.formatResponse(data);
}

private async stripeCreateCustomer(args: any) {
  const params = new URLSearchParams();
  params.append('email', args.email);
  if (args.name) params.append('name', args.name);
  if (args.description) params.append('description', args.description);
  
  const data = await this.stripeFetch('/customers', {
    method: 'POST',
    body: params.toString()
  });
  return this.formatResponse(data);
}

private async stripeGetCustomer(args: any) {
  const data = await this.stripeFetch(`/customers/${args.customerId}`);
  return this.formatResponse(data);
}

private async stripeCreateSubscription(args: any) {
  const params = new URLSearchParams();
  params.append('customer', args.customerId);
  params.append('items[0][price]', args.priceId);
  
  const data = await this.stripeFetch('/subscriptions', {
    method: 'POST',
    body: params.toString()
  });
  return this.formatResponse(data);
}

private async stripeCancelSubscription(args: any) {
  const data = await this.stripeFetch(`/subscriptions/${args.subscriptionId}`, {
    method: 'DELETE'
  });
  return this.formatResponse(data);
}
```

---

### **Step 7: Update Documentation**

**File:** `src/index.ts` (top comment)

**Before:**
```typescript
/**
 * Robinson's Toolkit - Unified MCP Server  
 * 563 tools: GitHub (240) + Vercel (150) + Neon (173)
 */
```

**After:**
```typescript
/**
 * Robinson's Toolkit - Unified MCP Server  
 * 568 tools: GitHub (240) + Vercel (150) + Neon (173) + Stripe (5)
 */
```

**File:** `README.md`

Update the tool counts and add Stripe to the list.

---

### **Step 8: Rebuild**

```bash
cd packages/robinsons-toolkit-mcp
npm run build
```

**Expected output:**
```
> @robinsonai/robinsons-toolkit-mcp@0.1.1 build
> tsc

# Should complete with 0 errors
```

---

### **Step 9: Update Augment Code Configuration**

**File:** `%APPDATA%\Code\User\globalStorage\augment.vscode-augment\augment-global-state\mcpServers.json`

**Add Stripe API key to env:**

```json
{
  "type": "stdio",
  "name": "robinsons-toolkit",
  "command": "node",
  "arguments": ["C:\\Users\\chris\\Git Local\\robinsonai-mcp-servers\\packages\\robinsons-toolkit-mcp\\dist\\index.js"],
  "env": {
    "GITHUB_TOKEN": "gho_...",
    "VERCEL_TOKEN": "...",
    "NEON_API_KEY": "napi_...",
    "STRIPE_SECRET_KEY": "sk_test_..." // ADD THIS
  }
}
```

---

### **Step 10: Reload VS Code**

**Important:** VS Code must be reloaded to pick up the new build!

1. Press `Ctrl+Shift+P`
2. Type "Reload Window"
3. Press Enter

---

### **Step 11: Test**

In Augment Code chat:

```
Test stripe_list_customers with limit=5
```

**Expected response:**
```json
{
  "object": "list",
  "data": [
    {
      "id": "cus_...",
      "email": "customer@example.com",
      "name": "John Doe"
    }
  ],
  "has_more": false
}
```

---

## Common Patterns

### **Pattern 1: REST API with JSON**

Most modern APIs use JSON:

```typescript
private async serviceFetch(endpoint: string, options: any = {}) {
  const url = `https://api.service.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${this.serviceToken}`,
      'Content-Type': 'application/json', // JSON
      ...options.headers
    }
  });
  return await response.json();
}

// Usage
const data = await this.serviceFetch('/items', {
  method: 'POST',
  body: JSON.stringify({ name: 'Item' }) // JSON body
});
```

### **Pattern 2: REST API with Form Data**

Some APIs (like Stripe) use form-encoded data:

```typescript
private async serviceFetch(endpoint: string, options: any = {}) {
  const url = `https://api.service.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${this.serviceToken}`,
      'Content-Type': 'application/x-www-form-urlencoded', // Form data
      ...options.headers
    }
  });
  return await response.json();
}

// Usage
const params = new URLSearchParams();
params.append('name', 'Item');
const data = await this.serviceFetch('/items', {
  method: 'POST',
  body: params.toString() // Form-encoded body
});
```

### **Pattern 3: API with Custom Headers**

Some APIs require custom headers:

```typescript
private async serviceFetch(endpoint: string, options: any = {}) {
  const url = `https://api.service.com${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-API-Key': this.serviceApiKey, // Custom header
      'X-Client-Version': '1.0.0',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return await response.json();
}
```

---

## Checklist for Adding New Integration

Use this checklist to ensure you don't miss any steps:

- [ ] **Step 1:** Add environment variable property to class
- [ ] **Step 2:** Load environment variable in constructor
- [ ] **Step 3:** Create service-specific fetch method
- [ ] **Step 4:** Add tool definitions to `ListToolsRequestSchema`
- [ ] **Step 5:** Add case handlers to `CallToolRequestSchema`
- [ ] **Step 6:** Implement all methods
- [ ] **Step 7:** Update documentation (top comment, README)
- [ ] **Step 8:** Run `npm run build` (must succeed with 0 errors)
- [ ] **Step 9:** Update Augment Code configuration with API key
- [ ] **Step 10:** Reload VS Code window
- [ ] **Step 11:** Test each tool individually
- [ ] **Step 12:** Verify tool count in VS Code status bar

---

## Troubleshooting

### **Build fails with "Property does not exist"**

**Cause:** Forgot to add property declaration to class.

**Solution:** Add property at top of class:

```typescript
class UnifiedToolkit {
  private newServiceToken: string; // ADD THIS
```

### **Tool not showing in Augment Code**

**Cause:** VS Code hasn't reloaded the server.

**Solution:** Reload VS Code window.

### **"Unknown tool" error**

**Cause:** Missing case handler in switch statement.

**Solution:** Add case to `CallToolRequestSchema` handler.

### **Method name collision**

**Cause:** Method name conflicts with existing method.

**Solution:** Use service-specific prefix (e.g., `stripeListCustomers` not `listCustomers`).

---

## Best Practices

1. **Always use service-specific method names** to avoid collisions
2. **Test each tool individually** before moving to the next
3. **Keep backup of working version** before major changes
4. **Use `formatResponse()` helper** for consistent response format
5. **Add proper error handling** in fetch methods
6. **Document all tools** with clear descriptions
7. **Follow existing patterns** for consistency

---

## Summary

Adding a new integration to Robinson's Toolkit requires:

1. Environment variable setup
2. Service-specific fetch method
3. Tool definitions
4. Case handlers
5. Method implementations
6. Build and test

Follow this guide step-by-step and you'll successfully add new integrations without breaking existing tools!

