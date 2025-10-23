/**
 * Stripe Promotion Code Tools
 * 5 comprehensive promotion code management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createPromotionCodeTools(): Tool[] {
  return [
    {
      name: 'stripe_promotion_code_create',
      description: 'Create a new promotion code',
      inputSchema: {
        type: 'object',
        properties: {
          coupon: { type: 'string', description: 'Coupon ID to attach' },
          code: { type: 'string', description: 'Promotion code string (auto-generated if not provided)' },
          active: { type: 'boolean', description: 'Whether code is active' },
          max_redemptions: { type: 'number', description: 'Maximum redemptions' },
          expires_at: { type: 'number', description: 'Unix timestamp for expiration' },
          restrictions: { type: 'object', description: 'Restrictions (first_time_transaction, minimum_amount, etc.)' },
          metadata: { type: 'object', description: 'Custom metadata' },
        },
        required: ['coupon'],
      },
    },
    {
      name: 'stripe_promotion_code_get',
      description: 'Retrieve a promotion code by ID',
      inputSchema: {
        type: 'object',
        properties: {
          promotion_code_id: { type: 'string', description: 'Promotion code ID' },
        },
        required: ['promotion_code_id'],
      },
    },
    {
      name: 'stripe_promotion_code_update',
      description: 'Update a promotion code',
      inputSchema: {
        type: 'object',
        properties: {
          promotion_code_id: { type: 'string', description: 'Promotion code ID' },
          active: { type: 'boolean', description: 'Updated active status' },
          metadata: { type: 'object', description: 'Updated metadata' },
        },
        required: ['promotion_code_id'],
      },
    },
    {
      name: 'stripe_promotion_code_list',
      description: 'List all promotion codes with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of codes (max 100)' },
          active: { type: 'boolean', description: 'Filter by active status' },
          code: { type: 'string', description: 'Filter by code string' },
          coupon: { type: 'string', description: 'Filter by coupon ID' },
          customer: { type: 'string', description: 'Filter by customer ID' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_promotion_code_lookup',
      description: 'Look up a promotion code by code string',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'Promotion code string to look up' },
        },
        required: ['code'],
      },
    },
  ];
}

