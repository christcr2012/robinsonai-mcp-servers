/**
 * Stripe Coupon Tools
 * 6 comprehensive coupon management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createCouponTools(): Tool[] {
  return [
    {
      name: 'stripe_coupon_create',
      description: 'Create a new coupon',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique coupon ID (optional, auto-generated if not provided)' },
          duration: { type: 'string', description: 'Duration (forever, once, repeating)' },
          amount_off: { type: 'number', description: 'Amount off in cents' },
          percent_off: { type: 'number', description: 'Percent off (1-100)' },
          currency: { type: 'string', description: 'Currency for amount_off' },
          duration_in_months: { type: 'number', description: 'Months for repeating duration' },
          max_redemptions: { type: 'number', description: 'Maximum redemptions' },
          redeem_by: { type: 'number', description: 'Unix timestamp for expiration' },
          metadata: { type: 'object', description: 'Custom metadata' },
          name: { type: 'string', description: 'Coupon name' },
        },
        required: ['duration'],
      },
    },
    {
      name: 'stripe_coupon_get',
      description: 'Retrieve a coupon by ID',
      inputSchema: {
        type: 'object',
        properties: {
          coupon_id: { type: 'string', description: 'Coupon ID' },
        },
        required: ['coupon_id'],
      },
    },
    {
      name: 'stripe_coupon_update',
      description: 'Update a coupon',
      inputSchema: {
        type: 'object',
        properties: {
          coupon_id: { type: 'string', description: 'Coupon ID' },
          metadata: { type: 'object', description: 'Updated metadata' },
          name: { type: 'string', description: 'Updated name' },
        },
        required: ['coupon_id'],
      },
    },
    {
      name: 'stripe_coupon_delete',
      description: 'Delete a coupon',
      inputSchema: {
        type: 'object',
        properties: {
          coupon_id: { type: 'string', description: 'Coupon ID to delete' },
        },
        required: ['coupon_id'],
      },
    },
    {
      name: 'stripe_coupon_list',
      description: 'List all coupons with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of coupons (max 100)' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_customer_discount_delete',
      description: 'Remove discount from customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
        },
        required: ['customer_id'],
      },
    },
  ];
}

