/**
 * Stripe Dispute Tools
 * 6 comprehensive dispute management tools
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createDisputeTools(): Tool[] {
  return [
    {
      name: 'stripe_dispute_get',
      description: 'Retrieve a dispute by ID',
      inputSchema: {
        type: 'object',
        properties: {
          dispute_id: { type: 'string', description: 'Dispute ID' },
        },
        required: ['dispute_id'],
      },
    },
    {
      name: 'stripe_dispute_update',
      description: 'Update dispute evidence and metadata',
      inputSchema: {
        type: 'object',
        properties: {
          dispute_id: { type: 'string', description: 'Dispute ID' },
          evidence: { type: 'object', description: 'Evidence to submit' },
          metadata: { type: 'object', description: 'Updated metadata' },
          submit: { type: 'boolean', description: 'Submit evidence immediately' },
        },
        required: ['dispute_id'],
      },
    },
    {
      name: 'stripe_dispute_close',
      description: 'Close a dispute (concede)',
      inputSchema: {
        type: 'object',
        properties: {
          dispute_id: { type: 'string', description: 'Dispute ID to close' },
        },
        required: ['dispute_id'],
      },
    },
    {
      name: 'stripe_dispute_list',
      description: 'List all disputes with filters',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of disputes (max 100)' },
          charge: { type: 'string', description: 'Filter by charge ID' },
          payment_intent: { type: 'string', description: 'Filter by payment intent ID' },
          created: { type: 'object', description: 'Filter by creation date' },
          starting_after: { type: 'string', description: 'Cursor for pagination' },
        },
      },
    },
    {
      name: 'stripe_dispute_evidence_submit',
      description: 'Submit evidence for a dispute',
      inputSchema: {
        type: 'object',
        properties: {
          dispute_id: { type: 'string', description: 'Dispute ID' },
          customer_name: { type: 'string', description: 'Customer name' },
          customer_email_address: { type: 'string', description: 'Customer email' },
          billing_address: { type: 'string', description: 'Billing address' },
          receipt: { type: 'string', description: 'Receipt file ID' },
          customer_signature: { type: 'string', description: 'Customer signature file ID' },
          shipping_documentation: { type: 'string', description: 'Shipping documentation file ID' },
          uncategorized_text: { type: 'string', description: 'Additional evidence text' },
        },
        required: ['dispute_id'],
      },
    },
    {
      name: 'stripe_dispute_file_upload',
      description: 'Upload a file for dispute evidence',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: { type: 'string', description: 'Path to file to upload' },
          purpose: { type: 'string', description: 'File purpose (dispute_evidence)' },
        },
        required: ['file_path', 'purpose'],
      },
    },
  ];
}

