/**
 * Stripe Subscription Tools
 * 12 comprehensive subscription management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createSubscriptionTools(): Tool[] {
  return [
    {
      name: 'stripe_subscription_create',
      description: 'Create a new subscription for a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Customer ID' },
          items: { type: 'array', description: 'Array of subscription items with price IDs' },
          default_payment_method: { type: 'string', description: 'Default payment method ID' },
          trial_period_days: { type: 'number', description: 'Number of trial days' },
          metadata: { type: 'object', description: 'Custom metadata' },
          proration_behavior: { type: 'string', description: 'Proration behavior (create_prorations, none, always_invoice)' },
          billing_cycle_anchor: { type: 'number', description: 'Unix timestamp for billing cycle anchor' },
        },
        required: ['customer', 'items'],
      },
    },
    {
      name: 'stripe_subscription_get',
      description: 'Retrieve a subscription by ID',
      inputSchema: {
        type: 'object',
        properties: {
          subscription_id: { type: 'string', description: 'Subscription ID' },
        },
        required: ['subscription_id'],
      },
    },
    {
      name: 'stripe_subscription_update',
      description: 'Update a subscription',
      inputSchema: {
        type: 'object',
        properties: {
          subscription_id: { type: 'string', description: 'Subscription ID' },
          items: { type: 'array', description: 'Updated subscription items' },
          metadata: { type: 'object', description: 'Updated metadata' },
          proration_behavior: { type: 'string', description: 'Proration behavior' },
          trial_end: { type: 'number', description: 'Unix timestamp for trial end' },
        },
        required: ['subscription_id'],
      },
    },
    {
      name: 'stripe_subscription_cancel',
      description: 'Cancel a subscription',
      inputSchema: {
        type: 'object',
        properties: {
          subscription_id: { type: 'string', description: 'Subscription ID' },
          cancel_at_period_end: { type: 'boolean', description: 'Cancel at end of billing period' },
          prorate: { type: 'boolean', description: 'Prorate the cancellation' },
        },
        required: ['subscription_id'],
      },
    },
    {
      name: 'stripe_subscription_resume',
      description: 'Resume a canceled subscription',
      inputSchema: {
        type: 'object',
        properties: {
          subscription_id: { type: 'string', description: 'Subscription ID' },
          proration_behavior: { type: 'string', description: 'Proration behavior' },
        },
        required: ['subscription_id'],
      },
    },
    {
      name: 'stripe_subscription_list',
      description: 'List all subscriptions with filters',
      inputSchema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Filter by customer ID' },
          price: { type: 'string', description: 'Filter by price ID' },
          status: { type: 'string', description: 'Filter by status (active, past_due, canceled, etc.)' },
          limit: { type: 'number', description: 'Number of results' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_subscription_search',
      description: 'Search subscriptions using query language',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          limit: { type: 'number', description: 'Number of results' },
          page: { type: 'string', description: 'Page token' },
        },
        required: ['query'],
      },
    },
    {
      name: 'stripe_subscription_pause',
      description: 'Pause a subscription',
      inputSchema: {
        type: 'object',
        properties: {
          subscription_id: { type: 'string', description: 'Subscription ID' },
          pause_collection: { type: 'object', description: 'Pause collection settings' },
        },
        required: ['subscription_id'],
      },
    },
    {
      name: 'stripe_subscription_item_create',
      description: 'Add an item to a subscription',
      inputSchema: {
        type: 'object',
        properties: {
          subscription: { type: 'string', description: 'Subscription ID' },
          price: { type: 'string', description: 'Price ID' },
          quantity: { type: 'number', description: 'Quantity' },
          metadata: { type: 'object', description: 'Custom metadata' },
        },
        required: ['subscription', 'price'],
      },
    },
    {
      name: 'stripe_subscription_item_update',
      description: 'Update a subscription item',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'Subscription item ID' },
          price: { type: 'string', description: 'New price ID' },
          quantity: { type: 'number', description: 'New quantity' },
          metadata: { type: 'object', description: 'Updated metadata' },
        },
        required: ['item_id'],
      },
    },
    {
      name: 'stripe_subscription_item_delete',
      description: 'Remove an item from a subscription',
      inputSchema: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'Subscription item ID' },
          proration_behavior: { type: 'string', description: 'Proration behavior' },
        },
        required: ['item_id'],
      },
    },
    {
      name: 'stripe_subscription_schedule_create',
      description: 'Create a subscription schedule for future changes',
      inputSchema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Customer ID' },
          phases: { type: 'array', description: 'Array of subscription phases' },
          start_date: { type: 'number', description: 'Unix timestamp for start' },
          metadata: { type: 'object', description: 'Custom metadata' },
        },
        required: ['customer', 'phases'],
      },
    },
  ];
}

