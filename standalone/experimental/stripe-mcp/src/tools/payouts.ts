/**
 * Stripe Payout Tools
 * 6 comprehensive payout management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createPayoutTools(): Tool[] {
  return [
    {
      name: 'stripe_payout_create',
      description: 'Create a payout to bank account',
      inputSchema: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount in cents' },
          currency: { type: 'string', description: 'Three-letter ISO currency code' },
          description: { type: 'string', description: 'Payout description' },
          metadata: { type: 'object', description: 'Custom metadata' },
          method: { type: 'string', description: 'Payout method (standard or instant)' },
          destination: { type: 'string', description: 'Bank account ID' },
        },
        required: ['amount', 'currency'],
      },
    },
    {
      name: 'stripe_payout_get',
      description: 'Retrieve a payout by ID',
      inputSchema: {
        type: 'object',
        properties: {
          payout_id: { type: 'string', description: 'Payout ID' },
        },
        required: ['payout_id'],
      },
    },
    {
      name: 'stripe_payout_update',
      description: 'Update payout metadata',
      inputSchema: {
        type: 'object',
        properties: {
          payout_id: { type: 'string', description: 'Payout ID' },
          metadata: { type: 'object', description: 'Updated metadata' },
        },
        required: ['payout_id'],
      },
    },
    {
      name: 'stripe_payout_cancel',
      description: 'Cancel a pending payout',
      inputSchema: {
        type: 'object',
        properties: {
          payout_id: { type: 'string', description: 'Payout ID to cancel' },
        },
        required: ['payout_id'],
      },
    },
    {
      name: 'stripe_payout_reverse',
      description: 'Reverse a payout',
      inputSchema: {
        type: 'object',
        properties: {
          payout_id: { type: 'string', description: 'Payout ID to reverse' },
          metadata: { type: 'object', description: 'Metadata for reversal' },
        },
        required: ['payout_id'],
      },
    },
    {
      name: 'stripe_payout_list',
      description: 'List all payouts with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of payouts (max 100)' },
          status: { type: 'string', description: 'Filter by status (paid, pending, in_transit, canceled, failed)' },
          created: { type: 'object', description: 'Filter by creation date' },
          arrival_date: { type: 'object', description: 'Filter by arrival date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
  ];
}

