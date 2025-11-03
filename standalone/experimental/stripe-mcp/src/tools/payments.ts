/**
 * Stripe Payment Intent Tools
 * 8 comprehensive payment processing tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createPaymentTools(): Tool[] {
  return [
    {
      name: 'stripe_payment_create',
      description: 'Create a payment intent for processing payments',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount in cents' },
          currency: { type: 'string', description: 'Three-letter ISO currency code (e.g., usd, eur)' },
          customer: { type: 'string', description: 'Customer ID' },
          payment_method: { type: 'string', description: 'Payment method ID' },
          description: { type: 'string', description: 'Payment description' },
          metadata: { type: 'object', description: 'Custom metadata' },
          confirm: { type: 'boolean', description: 'Automatically confirm the payment' },
          automatic_payment_methods: { type: 'object', description: 'Enable automatic payment methods' },
          receipt_email: { type: 'string', description: 'Email for receipt' },
        },
        required: ['amount', 'currency'],
      },
    },
    {
      name: 'stripe_payment_get',
      description: 'Retrieve a payment intent by ID',
      inputSchema: {
        type: 'object',
        properties: {
          payment_intent_id: { type: 'string', description: 'Payment intent ID' },
        },
        required: ['payment_intent_id'],
      },
    },
    {
      name: 'stripe_payment_update',
      description: 'Update a payment intent',
      inputSchema: {
        type: 'object',
        properties: {
          payment_intent_id: { type: 'string', description: 'Payment intent ID' },
          amount: { type: 'number', description: 'New amount in cents' },
          metadata: { type: 'object', description: 'Updated metadata' },
          description: { type: 'string', description: 'Updated description' },
          receipt_email: { type: 'string', description: 'Updated receipt email' },
        },
        required: ['payment_intent_id'],
      },
    },
    {
      name: 'stripe_payment_confirm',
      description: 'Confirm a payment intent',
      inputSchema: {
        type: 'object',
        properties: {
          payment_intent_id: { type: 'string', description: 'Payment intent ID' },
          payment_method: { type: 'string', description: 'Payment method ID' },
          return_url: { type: 'string', description: 'URL to redirect after payment' },
        },
        required: ['payment_intent_id'],
      },
    },
    {
      name: 'stripe_payment_cancel',
      description: 'Cancel a payment intent',
      inputSchema: {
        type: 'object',
        properties: {
          payment_intent_id: { type: 'string', description: 'Payment intent ID' },
          cancellation_reason: { type: 'string', description: 'Reason for cancellation' },
        },
        required: ['payment_intent_id'],
      },
    },
    {
      name: 'stripe_payment_capture',
      description: 'Capture a payment intent that was created with capture_method=manual',
      inputSchema: {
        type: 'object',
        properties: {
          payment_intent_id: { type: 'string', description: 'Payment intent ID' },
          amount_to_capture: { type: 'number', description: 'Amount to capture in cents (optional, defaults to full amount)' },
        },
        required: ['payment_intent_id'],
      },
    },
    {
      name: 'stripe_payment_list',
      description: 'List all payment intents with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of payments to return (max 100)' },
          customer: { type: 'string', description: 'Filter by customer ID' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_payment_search',
      description: 'Search payment intents using query language',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (e.g., "status:\'succeeded\' AND amount>1000")' },
          limit: { type: 'number', description: 'Number of results (max 100)' },
          page: { type: 'string', description: 'Page token for pagination' },
        },
        required: ['query'],
      },
    },
  ];
}

