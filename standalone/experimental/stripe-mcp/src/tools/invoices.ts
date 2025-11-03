/**
 * Stripe Invoice Tools
 * 10 comprehensive invoice management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createInvoiceTools(): Tool[] {
  return [
    {
      name: 'stripe_invoice_create',
      description: 'Create a new invoice',
      inputSchema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Customer ID' },
          auto_advance: { type: 'boolean', description: 'Auto-finalize invoice' },
          collection_method: { type: 'string', description: 'Collection method (charge_automatically or send_invoice)' },
          description: { type: 'string', description: 'Invoice description' },
          metadata: { type: 'object', description: 'Custom metadata' },
          subscription: { type: 'string', description: 'Subscription ID' },
          days_until_due: { type: 'number', description: 'Days until invoice is due' },
        },
        required: ['customer'],
      },
    },
    {
      name: 'stripe_invoice_get',
      description: 'Retrieve an invoice by ID',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'Invoice ID' },
        },
        required: ['invoice_id'],
      },
    },
    {
      name: 'stripe_invoice_update',
      description: 'Update an invoice',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'Invoice ID' },
          description: { type: 'string', description: 'Updated description' },
          metadata: { type: 'object', description: 'Updated metadata' },
          auto_advance: { type: 'boolean', description: 'Updated auto-advance setting' },
          days_until_due: { type: 'number', description: 'Updated days until due' },
        },
        required: ['invoice_id'],
      },
    },
    {
      name: 'stripe_invoice_delete',
      description: 'Delete a draft invoice',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'Invoice ID to delete (must be draft)' },
        },
        required: ['invoice_id'],
      },
    },
    {
      name: 'stripe_invoice_finalize',
      description: 'Finalize a draft invoice',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'Invoice ID' },
          auto_advance: { type: 'boolean', description: 'Auto-advance after finalizing' },
        },
        required: ['invoice_id'],
      },
    },
    {
      name: 'stripe_invoice_pay',
      description: 'Pay an invoice',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'Invoice ID' },
          payment_method: { type: 'string', description: 'Payment method ID' },
          source: { type: 'string', description: 'Payment source ID' },
        },
        required: ['invoice_id'],
      },
    },
    {
      name: 'stripe_invoice_send',
      description: 'Send an invoice to customer',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'Invoice ID' },
        },
        required: ['invoice_id'],
      },
    },
    {
      name: 'stripe_invoice_void',
      description: 'Void an invoice',
      inputSchema: {
        type: 'object',
        properties: {
          invoice_id: { type: 'string', description: 'Invoice ID' },
        },
        required: ['invoice_id'],
      },
    },
    {
      name: 'stripe_invoice_list',
      description: 'List all invoices with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of invoices (max 100)' },
          customer: { type: 'string', description: 'Filter by customer ID' },
          subscription: { type: 'string', description: 'Filter by subscription ID' },
          status: { type: 'string', description: 'Filter by status (draft, open, paid, void, uncollectible)' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_invoice_upcoming',
      description: 'Preview upcoming invoice for a customer',
      inputSchema: {
        type: 'object',
        properties: {
          customer: { type: 'string', description: 'Customer ID' },
          subscription: { type: 'string', description: 'Subscription ID' },
          subscription_items: { type: 'array', description: 'Preview with different subscription items' },
        },
        required: ['customer'],
      },
    },
  ];
}

