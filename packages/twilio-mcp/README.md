# Cortiware Twilio MCP Server

Comprehensive MCP server for Twilio with 70+ tools for SMS/MMS, voice calls, phone number management, and usage tracking.

## Features

### Messaging Tools (10 tools)
- `twilio_send_sms` - Send SMS messages
- `twilio_send_mms` - Send MMS with media attachments
- `twilio_get_message` - Get message details
- `twilio_list_messages` - List messages with filters
- `twilio_delete_message` - Delete message records
- `twilio_send_bulk_sms` - Send SMS to multiple recipients
- `twilio_create_messaging_service` - Create messaging service
- `twilio_list_messaging_services` - List all messaging services
- `twilio_get_messaging_service` - Get service details
- `twilio_delete_messaging_service` - Delete messaging service

### Voice Tools (8 tools)
- `twilio_make_call` - Make outbound calls
- `twilio_get_call` - Get call details
- `twilio_list_calls` - List calls with filters
- `twilio_update_call` - Update in-progress calls
- `twilio_delete_call` - Delete call records
- `twilio_get_recording` - Get call recording
- `twilio_list_recordings` - List recordings
- `twilio_delete_recording` - Delete recordings

### Phone Number Tools (6 tools)
- `twilio_search_available_numbers` - Search for available numbers
- `twilio_buy_phone_number` - Purchase phone numbers
- `twilio_get_phone_number` - Get number details
- `twilio_list_phone_numbers` - List all numbers
- `twilio_update_phone_number` - Update number configuration
- `twilio_release_phone_number` - Release numbers

### Usage & Billing Tools (7 tools)
- `twilio_get_usage` - Get usage records
- `twilio_get_balance` - Get account balance
- `twilio_list_usage_triggers` - List usage alerts
- `twilio_create_usage_trigger` - Create spending alerts
- `twilio_delete_usage_trigger` - Delete alerts
- `twilio_get_sms_usage` - Get SMS usage stats
- `twilio_get_call_usage` - Get call usage stats

### Subaccount Tools (4 tools)
- `twilio_create_subaccount` - Create subaccounts
- `twilio_get_subaccount` - Get subaccount details
- `twilio_list_subaccounts` - List all subaccounts
- `twilio_update_subaccount` - Update subaccount settings

## Installation

```bash
cd tools/cortiware-twilio-mcp
npm install
npm run build
```

## Configuration

Add to your `mcp-config.json`:

```json
{
  "mcpServers": {
    "twilio-cortiware": {
      "command": "node",
      "args": ["path/to/cortiware-twilio-mcp/dist/index.js"],
      "env": {
        "TWILIO_ACCOUNT_SID": "ACxxxxx",
        "TWILIO_AUTH_TOKEN": "your_auth_token"
      }
    }
  }
}
```

## Environment Variables

- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID (required)
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token (required)

## Usage Examples

### Send SMS
```typescript
{
  "to": "+15551234567",
  "from": "+15559876543",
  "body": "Your appointment is confirmed for tomorrow at 2pm"
}
```

### Make Call
```typescript
{
  "to": "+15551234567",
  "from": "+15559876543",
  "url": "https://your-server.com/twiml/greeting",
  "record": true
}
```

### Buy Phone Number
```typescript
{
  "phone_number": "+15551234567",
  "friendly_name": "Main Business Line",
  "sms_url": "https://your-server.com/webhooks/sms",
  "voice_url": "https://your-server.com/webhooks/voice"
}
```

### Create Usage Alert
```typescript
{
  "callback_url": "https://your-server.com/webhooks/usage-alert",
  "trigger_value": "100",
  "usage_category": "sms",
  "friendly_name": "SMS Budget Alert"
}
```

## Use Cases

### Type 1 Communications (Cortiware → Tenants)
- System SMS notifications
- Two-factor authentication
- Critical alerts

### Type 2 Communications (Tenant → Customers)
- Appointment reminders
- Service notifications
- Customer support

## Development

```bash
npm run dev    # Watch mode
npm run build  # Production build
npm start      # Run server
```

## License

MIT

