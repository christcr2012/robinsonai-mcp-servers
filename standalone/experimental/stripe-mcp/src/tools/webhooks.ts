/**
 * Stripe Webhook Tools
 * 8 comprehensive webhook management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createWebhookTools(): Tool[] {
  return [
    {
      name: 'stripe_webhook_endpoint_create',
      description: 'Create a webhook endpoint',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'Webhook URL' },
          enabled_events: { type: 'array', description: 'Array of event types to listen for' },
          description: { type: 'string', description: 'Endpoint description' },
          metadata: { type: 'object', description: 'Custom metadata' },
          api_version: { type: 'string', description: 'Stripe API version' },
        },
        required: ['url', 'enabled_events'],
      },
    },
    {
      name: 'stripe_webhook_endpoint_get',
      description: 'Retrieve a webhook endpoint by ID',
      inputSchema: {
        type: 'object',
        properties: {
          webhook_endpoint_id: { type: 'string', description: 'Webhook endpoint ID' },
        },
        required: ['webhook_endpoint_id'],
      },
    },
    {
      name: 'stripe_webhook_endpoint_update',
      description: 'Update a webhook endpoint',
      inputSchema: {
        type: 'object',
        properties: {
          webhook_endpoint_id: { type: 'string', description: 'Webhook endpoint ID' },
          url: { type: 'string', description: 'Updated URL' },
          enabled_events: { type: 'array', description: 'Updated event types' },
          description: { type: 'string', description: 'Updated description' },
          metadata: { type: 'object', description: 'Updated metadata' },
          disabled: { type: 'boolean', description: 'Disable endpoint' },
        },
        required: ['webhook_endpoint_id'],
      },
    },
    {
      name: 'stripe_webhook_endpoint_delete',
      description: 'Delete a webhook endpoint',
      inputSchema: {
        type: 'object',
        properties: {
          webhook_endpoint_id: { type: 'string', description: 'Webhook endpoint ID to delete' },
        },
        required: ['webhook_endpoint_id'],
      },
    },
    {
      name: 'stripe_webhook_endpoint_list',
      description: 'List all webhook endpoints',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of endpoints (max 100)' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_event_get',
      description: 'Retrieve an event by ID',
      inputSchema: {
        type: 'object',
        properties: {
          event_id: { type: 'string', description: 'Event ID' },
        },
        required: ['event_id'],
      },
    },
    {
      name: 'stripe_event_list',
      description: 'List all events with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of events (max 100)' },
          type: { type: 'string', description: 'Filter by event type' },
          types: { type: 'array', description: 'Filter by multiple event types' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_webhook_construct_event',
      description: 'Verify and construct webhook event from payload',
      inputSchema: {
        type: 'object',
        properties: {
          payload: { type: 'string', description: 'Raw webhook payload' },
          signature: { type: 'string', description: 'Stripe-Signature header value' },
          secret: { type: 'string', description: 'Webhook endpoint secret' },
        },
        required: ['payload', 'signature', 'secret'],
      },
    },
  ];
}

