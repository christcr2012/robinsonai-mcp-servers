/**
 * Stripe Balance Tools
 * 4 comprehensive balance and transaction tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createBalanceTools(): Tool[] {
  return [
    {
      name: 'stripe_balance_get',
      description: 'Retrieve current account balance',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'stripe_balance_transaction_get',
      description: 'Retrieve a balance transaction by ID',
      inputSchema: {
        type: 'object',
        properties: {
          transaction_id: { type: 'string', description: 'Balance transaction ID' },
        },
        required: ['transaction_id'],
      },
    },
    {
      name: 'stripe_balance_transaction_list',
      description: 'List all balance transactions with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of transactions (max 100)' },
          type: { type: 'string', description: 'Filter by type (charge, refund, adjustment, etc.)' },
          payout: { type: 'string', description: 'Filter by payout ID' },
          source: { type: 'string', description: 'Filter by source ID' },
          created: { type: 'object', description: 'Filter by creation date' },
          available_on: { type: 'object', description: 'Filter by availability date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_balance_history',
      description: 'Get balance history with detailed breakdown',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of transactions to retrieve' },
          currency: { type: 'string', description: 'Filter by currency' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
  ];
}

