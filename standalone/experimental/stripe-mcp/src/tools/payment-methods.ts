/**
 * Stripe Payment Method Tools
 * 8 comprehensive payment method management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createPaymentMethodTools(): Tool[] {
  return [
    {
      name: 'stripe_payment_method_create',
      description: 'Create a new payment method',
      inputSchema: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Payment method type (card, us_bank_account, etc.)' },
          card: { type: 'object', description: 'Card details (number, exp_month, exp_year, cvc)' },
          billing_details: { type: 'object', description: 'Billing details (name, email, address, phone)' },
          metadata: { type: 'object', description: 'Custom metadata' },
        },
        required: ['type'],
      },
    },
    {
      name: 'stripe_payment_method_get',
      description: 'Retrieve a payment method by ID',
      inputSchema: {
        type: 'object',
        properties: {
          payment_method_id: { type: 'string', description: 'Payment method ID' },
        },
        required: ['payment_method_id'],
      },
    },
    {
      name: 'stripe_payment_method_update',
      description: 'Update a payment method',
      inputSchema: {
        type: 'object',
        properties: {
          payment_method_id: { type: 'string', description: 'Payment method ID' },
          billing_details: { type: 'object', description: 'Updated billing details' },
          metadata: { type: 'object', description: 'Updated metadata' },
        },
        required: ['payment_method_id'],
      },
    },
    {
      name: 'stripe_payment_method_attach',
      description: 'Attach a payment method to a customer',
      inputSchema: {
        type: 'object',
        properties: {
          payment_method_id: { type: 'string', description: 'Payment method ID' },
          customer: { type: 'string', description: 'Customer ID' },
        },
        required: ['payment_method_id', 'customer'],
      },
    },
    {
      name: 'stripe_payment_method_detach',
      description: 'Detach a payment method from a customer',
      inputSchema: {
        type: 'object',
        properties: {
          payment_method_id: { type: 'string', description: 'Payment method ID' },
        },
        required: ['payment_method_id'],
      },
    },
    {
      name: 'stripe_payment_method_list',
      description: 'List all payment methods for a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Customer ID' },
          type: { type: 'string', description: 'Filter by payment method type' },
          limit: { type: 'number', description: 'Number of results (max 100)' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
        required: ['customer'],
      },
    },
    {
      name: 'stripe_payment_method_list_customer',
      description: 'List customer payment methods (alternative endpoint)',
      inputSchema: {
        type: 'object',
        properties: {
          customer_id: { type: 'string', description: 'Customer ID' },
          type: { type: 'string', description: 'Payment method type filter' },
        },
        required: ['customer_id'],
      },
    },
    {
      name: 'stripe_setup_intent_create',
      description: 'Create a setup intent for saving payment method',
      inputSchema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Customer ID' },
          payment_method_types: { type: 'array', description: 'Allowed payment method types' },
          usage: { type: 'string', description: 'Usage type (off_session or on_session)' },
          metadata: { type: 'object', description: 'Custom metadata' },
        },
      },
    },
  ];
}

