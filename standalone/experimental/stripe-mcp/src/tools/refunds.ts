/**
 * Stripe Refund Tools
 * 5 comprehensive refund management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createRefundTools(): Tool[] {
  return [
    {
      name: 'stripe_refund_create',
      description: 'Create a refund for a charge or payment intent',
      inputSchema: {
        type: 'object',
        properties: {
          charge: { type: 'string', description: 'Charge ID to refund' },
          payment_intent: { type: 'string', description: 'Payment intent ID to refund' },
          amount: { type: 'number', description: 'Amount to refund in cents (omit for full refund)' },
          reason: { type: 'string', description: 'Refund reason (duplicate, fraudulent, requested_by_customer)' },
          metadata: { type: 'object', description: 'Custom metadata' },
          refund_application_fee: { type: 'boolean', description: 'Refund application fee' },
          reverse_transfer: { type: 'boolean', description: 'Reverse transfer to connected account' },
        },
      },
    },
    {
      name: 'stripe_refund_get',
      description: 'Retrieve a refund by ID',
      inputSchema: {
        type: 'object',
        properties: {
          refund_id: { type: 'string', description: 'Refund ID' },
        },
        required: ['refund_id'],
      },
    },
    {
      name: 'stripe_refund_update',
      description: 'Update a refund metadata',
      inputSchema: {
        type: 'object',
        properties: {
          refund_id: { type: 'string', description: 'Refund ID' },
          metadata: { type: 'object', description: 'Updated metadata' },
        },
        required: ['refund_id'],
      },
    },
    {
      name: 'stripe_refund_cancel',
      description: 'Cancel a pending refund',
      inputSchema: {
        type: 'object',
        properties: {
          refund_id: { type: 'string', description: 'Refund ID to cancel' },
        },
        required: ['refund_id'],
      },
    },
    {
      name: 'stripe_refund_list',
      description: 'List all refunds with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of refunds (max 100)' },
          charge: { type: 'string', description: 'Filter by charge ID' },
          payment_intent: { type: 'string', description: 'Filter by payment intent ID' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
  ];
}

