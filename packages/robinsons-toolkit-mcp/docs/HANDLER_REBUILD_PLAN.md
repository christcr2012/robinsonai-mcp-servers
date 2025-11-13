# Handler Rebuild Plan

## Overview

This document outlines the strategy for rebuilding 432 missing handler implementations across 16 categories in Robinson's Toolkit MCP.

## Priority Order

Based on missing count and impact:

1. **Cloudflare** (138 tools) - Highest priority
2. **Stripe** (80 tools) - High priority, widely used
3. **Twilio** (63 tools) - High priority, communication platform
4. **Supabase** (51 tools) - Medium priority
5. **FastAPI** (28 tools) - Medium priority, internal tooling
6. **Resend** (15 tools) - Low priority
7. **N8N** (12 tools) - Low priority
8. **Google Workspace** (45 tools total) - Medium priority, split across subcategories

## Implementation Strategy

### Phase 1: Locate Legacy Implementation

For each missing tool:

1. **Identify legacy source file** based on category mapping:
   - `cloudflare` → `standalone/cloudflare-mcp`
   - `stripe` → `standalone/stripe-mcp`
   - `twilio` → `standalone/twilio-mcp`
   - `supabase` → `standalone/supabase-mcp`
   - `fastapi` → `src/fastapi-client.ts`
   - Google Workspace → `src/temp-google-workspace-mcp.ts`

2. **Search for tool implementation** using patterns:
   - Tool name (e.g., `cloudflare_abort_r2_multipart_upload`)
   - Operation name (e.g., `abortR2MultipartUpload`)
   - API endpoint (e.g., `/r2/multipart/abort`)

3. **Extract key components**:
   - API client initialization
   - HTTP method and endpoint
   - Request parameters and body
   - Response handling
   - Error handling
   - Pagination logic (if applicable)

### Phase 2: Rebuild Handler

For each tool, create a handler function in `src/categories/<category>/handlers.ts`:

```typescript
// Implemented from: <legacy-source-file>
// API docs: <api-documentation-url>
export async function categoryToolName(args: any) {
  try {
    // 1. Extract and validate arguments
    const { param1, param2 } = args;
    
    // 2. Make API call (using existing client or direct HTTP)
    const response = await apiClient.method(endpoint, {
      param1,
      param2,
    });
    
    // 3. Return formatted response
    return formatResponse(response);
    
  } catch (error) {
    // 4. Handle errors
    throw new Error(`Failed to execute tool: ${error.message}`);
  }
}
```

### Phase 3: Testing

For each implemented handler:

1. **Smoke test**: Verify function exists and is callable
2. **Unit test**: Test with mock data
3. **Integration test**: Test with real API (if credentials available)

## Category-Specific Patterns

### Cloudflare (138 tools)

**Legacy Source:** `standalone/cloudflare-mcp`

**API Client Pattern:**
```typescript
const client = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
});
```

**Common Patterns:**
- R2 Storage operations
- Workers KV operations
- Pages deployments
- D1 Database operations
- Queue operations

**Example Tools:**
- `cloudflare_abort_r2_multipart_upload`
- `cloudflare_ack_queue_message`
- `cloudflare_add_pages_domain`

### Stripe (80 tools)

**Legacy Source:** `standalone/stripe-mcp`

**API Client Pattern:**
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

**Common Patterns:**
- Account operations
- Customer operations
- Payment operations
- Subscription operations
- Invoice operations

**Example Tools:**
- `stripe_account_create`
- `stripe_customer_create`
- `stripe_payment_intent_create`

### Twilio (63 tools)

**Legacy Source:** `standalone/twilio-mcp`

**API Client Pattern:**
```typescript
const twilio = require('twilio')(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
```

**Common Patterns:**
- SMS operations
- Voice operations
- Conversation operations
- Phone number operations
- Verification operations

**Example Tools:**
- `twilio_send_message`
- `twilio_make_call`
- `twilio_buy_phone_number`

## Implementation Checklist

For each handler:

- [ ] Locate legacy implementation
- [ ] Extract API call pattern
- [ ] Identify required parameters
- [ ] Implement handler function
- [ ] Add error handling
- [ ] Add JSDoc comments with API docs link
- [ ] Test with mock data
- [ ] Update audit status
- [ ] Commit changes

## Next Steps

1. Start with Cloudflare (highest count)
2. Implement handlers in batches of 10-20
3. Run audit after each batch
4. Track progress in this document
5. Move to next category when complete

## Progress Tracking

### Cloudflare (0/138)
- [ ] R2 operations (multipart upload, etc.)
- [ ] Queue operations
- [ ] Pages operations
- [ ] D1 Database operations
- [ ] Workers KV operations

### Stripe (0/80)
- [ ] Account operations
- [ ] Customer operations
- [ ] Payment operations
- [ ] Subscription operations
- [ ] Invoice operations

### Twilio (0/63)
- [ ] SMS operations
- [ ] Voice operations
- [ ] Conversation operations
- [ ] Phone number operations
- [ ] Verification operations

