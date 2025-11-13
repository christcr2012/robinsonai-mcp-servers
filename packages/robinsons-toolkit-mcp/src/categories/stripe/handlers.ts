// Stripe Handler Methods - 150 handlers
// These methods will be added to the UnifiedToolkit class

import Stripe from 'stripe';

// Helper function to format Stripe responses
function formatStripeResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// CORE RESOURCES HANDLERS (30 handlers)
// ============================================================

// CUSTOMERS (6 handlers)
export async function stripeCustomerCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const customer = await this.stripeClient.customers.create(args);
    return formatStripeResponse(customer);
  } catch (error: any) {
    throw new Error(`Failed to create customer: ${error.message}`);
  }
}

export async function stripeCustomerRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const customer = await this.stripeClient.customers.retrieve(args.customer_id);
    return formatStripeResponse(customer);
  } catch (error: any) {
    throw new Error(`Failed to retrieve customer: ${error.message}`);
  }
}

export async function stripeCustomerUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customer_id, ...updateData } = args;
    const customer = await this.stripeClient.customers.update(customer_id, updateData);
    return formatStripeResponse(customer);
  } catch (error: any) {
    throw new Error(`Failed to update customer: ${error.message}`);
  }
}

export async function stripeCustomerDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const result = await this.stripeClient.customers.del(args.customer_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete customer: ${error.message}`);
  }
}

export async function stripeCustomerList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const customers = await this.stripeClient.customers.list(args);
    return formatStripeResponse(customers);
  } catch (error: any) {
    throw new Error(`Failed to list customers: ${error.message}`);
  }
}

export async function stripeCustomerSearch(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const customers = await this.stripeClient.customers.search(args);
    return formatStripeResponse(customers);
  } catch (error: any) {
    throw new Error(`Failed to search customers: ${error.message}`);
  }
}

// PAYMENT INTENTS (6 handlers)
export async function stripePaymentIntentCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentIntent = await this.stripeClient.paymentIntents.create(args);
    return formatStripeResponse(paymentIntent);
  } catch (error: any) {
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
}

export async function stripePaymentIntentRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentIntent = await this.stripeClient.paymentIntents.retrieve(args.payment_intent_id);
    return formatStripeResponse(paymentIntent);
  } catch (error: any) {
    throw new Error(`Failed to retrieve payment intent: ${error.message}`);
  }
}

export async function stripePaymentIntentUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { payment_intent_id, ...updateData } = args;
    const paymentIntent = await this.stripeClient.paymentIntents.update(payment_intent_id, updateData);
    return formatStripeResponse(paymentIntent);
  } catch (error: any) {
    throw new Error(`Failed to update payment intent: ${error.message}`);
  }
}

export async function stripePaymentIntentConfirm(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { payment_intent_id, ...confirmData } = args;
    const paymentIntent = await this.stripeClient.paymentIntents.confirm(payment_intent_id, confirmData);
    return formatStripeResponse(paymentIntent);
  } catch (error: any) {
    throw new Error(`Failed to confirm payment intent: ${error.message}`);
  }
}

export async function stripePaymentIntentCancel(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { payment_intent_id, ...cancelData } = args;
    const paymentIntent = await this.stripeClient.paymentIntents.cancel(payment_intent_id, cancelData);
    return formatStripeResponse(paymentIntent);
  } catch (error: any) {
    throw new Error(`Failed to cancel payment intent: ${error.message}`);
  }
}

export async function stripePaymentIntentList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentIntents = await this.stripeClient.paymentIntents.list(args);
    return formatStripeResponse(paymentIntents);
  } catch (error: any) {
    throw new Error(`Failed to list payment intents: ${error.message}`);
  }
}

// CHARGES (5 handlers)
export async function stripeChargeCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const charge = await this.stripeClient.charges.create(args);
    return formatStripeResponse(charge);
  } catch (error: any) {
    throw new Error(`Failed to create charge: ${error.message}`);
  }
}

export async function stripeChargeRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const charge = await this.stripeClient.charges.retrieve(args.charge_id);
    return formatStripeResponse(charge);
  } catch (error: any) {
    throw new Error(`Failed to retrieve charge: ${error.message}`);
  }
}

export async function stripeChargeUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { charge_id, ...updateData } = args;
    const charge = await this.stripeClient.charges.update(charge_id, updateData);
    return formatStripeResponse(charge);
  } catch (error: any) {
    throw new Error(`Failed to update charge: ${error.message}`);
  }
}

export async function stripeChargeCapture(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { charge_id, ...captureData } = args;
    const charge = await this.stripeClient.charges.capture(charge_id, captureData);
    return formatStripeResponse(charge);
  } catch (error: any) {
    throw new Error(`Failed to capture charge: ${error.message}`);
  }
}

export async function stripeChargeList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const charges = await this.stripeClient.charges.list(args);
    return formatStripeResponse(charges);
  } catch (error: any) {
    throw new Error(`Failed to list charges: ${error.message}`);
  }
}

// REFUNDS (5 handlers)
export async function stripeRefundCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const refund = await this.stripeClient.refunds.create(args);
    return formatStripeResponse(refund);
  } catch (error: any) {
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

export async function stripeRefundRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const refund = await this.stripeClient.refunds.retrieve(args.refund_id);
    return formatStripeResponse(refund);
  } catch (error: any) {
    throw new Error(`Failed to retrieve refund: ${error.message}`);
  }
}

export async function stripeRefundUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { refund_id, ...updateData } = args;
    const refund = await this.stripeClient.refunds.update(refund_id, updateData);
    return formatStripeResponse(refund);
  } catch (error: any) {
    throw new Error(`Failed to update refund: ${error.message}`);
  }
}

export async function stripeRefundCancel(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const refund = await this.stripeClient.refunds.cancel(args.refund_id);
    return formatStripeResponse(refund);
  } catch (error: any) {
    throw new Error(`Failed to cancel refund: ${error.message}`);
  }
}

export async function stripeRefundList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const refunds = await this.stripeClient.refunds.list(args);
    return formatStripeResponse(refunds);
  } catch (error: any) {
    throw new Error(`Failed to list refunds: ${error.message}`);
  }
}

// PAYOUTS (5 handlers)
export async function stripePayoutCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const payout = await this.stripeClient.payouts.create(args);
    return formatStripeResponse(payout);
  } catch (error: any) {
    throw new Error(`Failed to create payout: ${error.message}`);
  }
}

export async function stripePayoutRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const payout = await this.stripeClient.payouts.retrieve(args.payout_id);
    return formatStripeResponse(payout);
  } catch (error: any) {
    throw new Error(`Failed to retrieve payout: ${error.message}`);
  }
}

export async function stripePayoutUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { payout_id, ...updateData } = args;
    const payout = await this.stripeClient.payouts.update(payout_id, updateData);
    return formatStripeResponse(payout);
  } catch (error: any) {
    throw new Error(`Failed to update payout: ${error.message}`);
  }
}

export async function stripePayoutCancel(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const payout = await this.stripeClient.payouts.cancel(args.payout_id);
    return formatStripeResponse(payout);
  } catch (error: any) {
    throw new Error(`Failed to cancel payout: ${error.message}`);
  }
}

export async function stripePayoutList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const payouts = await this.stripeClient.payouts.list(args);
    return formatStripeResponse(payouts);
  } catch (error: any) {
    throw new Error(`Failed to list payouts: ${error.message}`);
  }
}

// BALANCE TRANSACTIONS (3 handlers)
export async function stripeBalanceTransactionRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const transaction = await this.stripeClient.balanceTransactions.retrieve(args.transaction_id);
    return formatStripeResponse(transaction);
  } catch (error: any) {
    throw new Error(`Failed to retrieve balance transaction: ${error.message}`);
  }
}

export async function stripeBalanceTransactionList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const transactions = await this.stripeClient.balanceTransactions.list(args);
    return formatStripeResponse(transactions);
  } catch (error: any) {
    throw new Error(`Failed to list balance transactions: ${error.message}`);
  }
}

export async function stripeBalanceRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const balance = await this.stripeClient.balance.retrieve();
    return formatStripeResponse(balance);
  } catch (error: any) {
    throw new Error(`Failed to retrieve balance: ${error.message}`);
  }
}

// ============================================================
// BILLING HANDLERS (40 handlers)
// ============================================================

// SUBSCRIPTIONS (7 handlers)
export async function stripeSubscriptionCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const subscription = await this.stripeClient.subscriptions.create(args);
    return formatStripeResponse(subscription);
  } catch (error: any) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }
}

export async function stripeSubscriptionRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const subscription = await this.stripeClient.subscriptions.retrieve(args.subscription_id);
    return formatStripeResponse(subscription);
  } catch (error: any) {
    throw new Error(`Failed to retrieve subscription: ${error.message}`);
  }
}

export async function stripeSubscriptionUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { subscription_id, ...updateData } = args;
    const subscription = await this.stripeClient.subscriptions.update(subscription_id, updateData);
    return formatStripeResponse(subscription);
  } catch (error: any) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }
}

export async function stripeSubscriptionCancel(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { subscription_id, ...cancelData } = args;
    const subscription = await this.stripeClient.subscriptions.cancel(subscription_id, cancelData);
    return formatStripeResponse(subscription);
  } catch (error: any) {
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}

export async function stripeSubscriptionResume(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const subscription = await this.stripeClient.subscriptions.resume(args.subscription_id);
    return formatStripeResponse(subscription);
  } catch (error: any) {
    throw new Error(`Failed to resume subscription: ${error.message}`);
  }
}

export async function stripeSubscriptionList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const subscriptions = await this.stripeClient.subscriptions.list(args);
    return formatStripeResponse(subscriptions);
  } catch (error: any) {
    throw new Error(`Failed to list subscriptions: ${error.message}`);
  }
}

export async function stripeSubscriptionSearch(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const subscriptions = await this.stripeClient.subscriptions.search(args);
    return formatStripeResponse(subscriptions);
  } catch (error: any) {
    throw new Error(`Failed to search subscriptions: ${error.message}`);
  }
}

// SUBSCRIPTION ITEMS (5 handlers)
export async function stripeSubscriptionItemCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const item = await this.stripeClient.subscriptionItems.create(args);
    return formatStripeResponse(item);
  } catch (error: any) {
    throw new Error(`Failed to create subscription item: ${error.message}`);
  }
}

export async function stripeSubscriptionItemRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const item = await this.stripeClient.subscriptionItems.retrieve(args.item_id);
    return formatStripeResponse(item);
  } catch (error: any) {
    throw new Error(`Failed to retrieve subscription item: ${error.message}`);
  }
}

export async function stripeSubscriptionItemUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { item_id, ...updateData } = args;
    const item = await this.stripeClient.subscriptionItems.update(item_id, updateData);
    return formatStripeResponse(item);
  } catch (error: any) {
    throw new Error(`Failed to update subscription item: ${error.message}`);
  }
}

export async function stripeSubscriptionItemDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const result = await this.stripeClient.subscriptionItems.del(args.item_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete subscription item: ${error.message}`);
  }
}

export async function stripeSubscriptionItemList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const items = await this.stripeClient.subscriptionItems.list(args);
    return formatStripeResponse(items);
  } catch (error: any) {
    throw new Error(`Failed to list subscription items: ${error.message}`);
  }
}

// INVOICES (9 handlers)
export async function stripeInvoiceCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const invoice = await this.stripeClient.invoices.create(args);
    return formatStripeResponse(invoice);
  } catch (error: any) {
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
}

export async function stripeInvoiceRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const invoice = await this.stripeClient.invoices.retrieve(args.invoice_id);
    return formatStripeResponse(invoice);
  } catch (error: any) {
    throw new Error(`Failed to retrieve invoice: ${error.message}`);
  }
}

export async function stripeInvoiceUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { invoice_id, ...updateData } = args;
    const invoice = await this.stripeClient.invoices.update(invoice_id, updateData);
    return formatStripeResponse(invoice);
  } catch (error: any) {
    throw new Error(`Failed to update invoice: ${error.message}`);
  }
}

export async function stripeInvoiceDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const result = await this.stripeClient.invoices.del(args.invoice_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete invoice: ${error.message}`);
  }
}

export async function stripeInvoiceFinalize(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { invoice_id, ...finalizeData } = args;
    const invoice = await this.stripeClient.invoices.finalizeInvoice(invoice_id, finalizeData);
    return formatStripeResponse(invoice);
  } catch (error: any) {
    throw new Error(`Failed to finalize invoice: ${error.message}`);
  }
}

export async function stripeInvoicePay(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { invoice_id, ...payData } = args;
    const invoice = await this.stripeClient.invoices.pay(invoice_id, payData);
    return formatStripeResponse(invoice);
  } catch (error: any) {
    throw new Error(`Failed to pay invoice: ${error.message}`);
  }
}

export async function stripeInvoiceSend(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const invoice = await this.stripeClient.invoices.sendInvoice(args.invoice_id);
    return formatStripeResponse(invoice);
  } catch (error: any) {
    throw new Error(`Failed to send invoice: ${error.message}`);
  }
}

export async function stripeInvoiceVoid(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const invoice = await this.stripeClient.invoices.voidInvoice(args.invoice_id);
    return formatStripeResponse(invoice);
  } catch (error: any) {
    throw new Error(`Failed to void invoice: ${error.message}`);
  }
}

export async function stripeInvoiceList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const invoices = await this.stripeClient.invoices.list(args);
    return formatStripeResponse(invoices);
  } catch (error: any) {
    throw new Error(`Failed to list invoices: ${error.message}`);
  }
}

// INVOICE ITEMS (5 handlers)
export async function stripeInvoiceItemCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const item = await this.stripeClient.invoiceItems.create(args);
    return formatStripeResponse(item);
  } catch (error: any) {
    throw new Error(`Failed to create invoice item: ${error.message}`);
  }
}

export async function stripeInvoiceItemRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const item = await this.stripeClient.invoiceItems.retrieve(args.item_id);
    return formatStripeResponse(item);
  } catch (error: any) {
    throw new Error(`Failed to retrieve invoice item: ${error.message}`);
  }
}

export async function stripeInvoiceItemUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { item_id, ...updateData } = args;
    const item = await this.stripeClient.invoiceItems.update(item_id, updateData);
    return formatStripeResponse(item);
  } catch (error: any) {
    throw new Error(`Failed to update invoice item: ${error.message}`);
  }
}

export async function stripeInvoiceItemDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const result = await this.stripeClient.invoiceItems.del(args.item_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete invoice item: ${error.message}`);
  }
}

export async function stripeInvoiceItemList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const items = await this.stripeClient.invoiceItems.list(args);
    return formatStripeResponse(items);
  } catch (error: any) {
    throw new Error(`Failed to list invoice items: ${error.message}`);
  }
}

// PLANS (5 handlers)
export async function stripePlanCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const plan = await this.stripeClient.plans.create(args);
    return formatStripeResponse(plan);
  } catch (error: any) {
    throw new Error(`Failed to create plan: ${error.message}`);
  }
}

export async function stripePlanRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const plan = await this.stripeClient.plans.retrieve(args.plan_id);
    return formatStripeResponse(plan);
  } catch (error: any) {
    throw new Error(`Failed to retrieve plan: ${error.message}`);
  }
}

export async function stripePlanUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { plan_id, ...updateData } = args;
    const plan = await this.stripeClient.plans.update(plan_id, updateData);
    return formatStripeResponse(plan);
  } catch (error: any) {
    throw new Error(`Failed to update plan: ${error.message}`);
  }
}

export async function stripePlanDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const result = await this.stripeClient.plans.del(args.plan_id);
    return formatStripeResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete plan: ${error.message}`);
  }
}

export async function stripePlanList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const plans = await this.stripeClient.plans.list(args);
    return formatStripeResponse(plans);
  } catch (error: any) {
    throw new Error(`Failed to list plans: ${error.message}`);
  }
}

// PRICES (5 handlers)
export async function stripePriceCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const price = await this.stripeClient.prices.create(args);
    return formatStripeResponse(price);
  } catch (error: any) {
    throw new Error(`Failed to create price: ${error.message}`);
  }
}

export async function stripePriceRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const price = await this.stripeClient.prices.retrieve(args.price_id);
    return formatStripeResponse(price);
  } catch (error: any) {
    throw new Error(`Failed to retrieve price: ${error.message}`);
  }
}

export async function stripePriceUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { price_id, ...updateData } = args;
    const price = await this.stripeClient.prices.update(price_id, updateData);
    return formatStripeResponse(price);
  } catch (error: any) {
    throw new Error(`Failed to update price: ${error.message}`);
  }
}

export async function stripePriceSearch(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const prices = await this.stripeClient.prices.search(args);
    return formatStripeResponse(prices);
  } catch (error: any) {
    throw new Error(`Failed to search prices: ${error.message}`);
  }
}

export async function stripePriceList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const prices = await this.stripeClient.prices.list(args);
    return formatStripeResponse(prices);
  } catch (error: any) {
    throw new Error(`Failed to list prices: ${error.message}`);
  }
}

// CREDIT NOTES (4 handlers)
export async function stripeCreditNoteCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const creditNote = await this.stripeClient.creditNotes.create(args);
    return formatStripeResponse(creditNote);
  } catch (error: any) {
    throw new Error(`Failed to create credit note: ${error.message}`);
  }
}

export async function stripeCreditNoteRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const creditNote = await this.stripeClient.creditNotes.retrieve(args.credit_note_id);
    return formatStripeResponse(creditNote);
  } catch (error: any) {
    throw new Error(`Failed to retrieve credit note: ${error.message}`);
  }
}

export async function stripeCreditNoteVoid(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const creditNote = await this.stripeClient.creditNotes.voidCreditNote(args.credit_note_id);
    return formatStripeResponse(creditNote);
  } catch (error: any) {
    throw new Error(`Failed to void credit note: ${error.message}`);
  }
}

export async function stripeCreditNoteList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const creditNotes = await this.stripeClient.creditNotes.list(args);
    return formatStripeResponse(creditNotes);
  } catch (error: any) {
    throw new Error(`Failed to list credit notes: ${error.message}`);
  }
}

// ============================================================
// ACCOUNTS - 7 handlers
// ============================================================

export async function stripeAccountCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const account = await this.stripeClient.accounts.create(args);
    return formatStripeResponse(account);
  } catch (error: any) {
    throw new Error(`Failed to create account: ${error.message}`);
  }
}

export async function stripeAccountRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { accountId } = args;
    const account = await this.stripeClient.accounts.retrieve(accountId);
    return formatStripeResponse(account);
  } catch (error: any) {
    throw new Error(`Failed to retrieve account: ${error.message}`);
  }
}

export async function stripeAccountUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { accountId, ...updateData } = args;
    const account = await this.stripeClient.accounts.update(accountId, updateData);
    return formatStripeResponse(account);
  } catch (error: any) {
    throw new Error(`Failed to update account: ${error.message}`);
  }
}

export async function stripeAccountDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { accountId } = args;
    const deleted = await this.stripeClient.accounts.del(accountId);
    return formatStripeResponse(deleted);
  } catch (error: any) {
    throw new Error(`Failed to delete account: ${error.message}`);
  }
}

export async function stripeAccountList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const accounts = await this.stripeClient.accounts.list(args);
    return formatStripeResponse(accounts);
  } catch (error: any) {
    throw new Error(`Failed to list accounts: ${error.message}`);
  }
}

export async function stripeAccountLinkCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const accountLink = await this.stripeClient.accountLinks.create(args);
    return formatStripeResponse(accountLink);
  } catch (error: any) {
    throw new Error(`Failed to create account link: ${error.message}`);
  }
}

export async function stripeAccountSessionCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const accountSession = await this.stripeClient.accountSessions.create(args);
    return formatStripeResponse(accountSession);
  } catch (error: any) {
    throw new Error(`Failed to create account session: ${error.message}`);
  }
}

// ============================================================
// CARDS - 5 handlers
// ============================================================

export async function stripeCardCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, source } = args;
    const card = await this.stripeClient.customers.createSource(customerId, { source });
    return formatStripeResponse(card);
  } catch (error: any) {
    throw new Error(`Failed to create card: ${error.message}`);
  }
}

export async function stripeCardRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, cardId } = args;
    const card = await this.stripeClient.customers.retrieveSource(customerId, cardId);
    return formatStripeResponse(card);
  } catch (error: any) {
    throw new Error(`Failed to retrieve card: ${error.message}`);
  }
}

export async function stripeCardUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, cardId, ...updateData } = args;
    const card = await this.stripeClient.customers.updateSource(customerId, cardId, updateData);
    return formatStripeResponse(card);
  } catch (error: any) {
    throw new Error(`Failed to update card: ${error.message}`);
  }
}

export async function stripeCardDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, cardId } = args;
    const deleted = await this.stripeClient.customers.deleteSource(customerId, cardId);
    return formatStripeResponse(deleted);
  } catch (error: any) {
    throw new Error(`Failed to delete card: ${error.message}`);
  }
}

export async function stripeCardList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, ...listParams } = args;
    const cards = await this.stripeClient.customers.listSources(customerId, { object: 'card', ...listParams });
    return formatStripeResponse(cards);
  } catch (error: any) {
    throw new Error(`Failed to list cards: ${error.message}`);
  }
}

// ============================================================
// BANK ACCOUNTS - 5 handlers
// ============================================================

export async function stripeBankAccountCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, source } = args;
    const bankAccount = await this.stripeClient.customers.createSource(customerId, { source });
    return formatStripeResponse(bankAccount);
  } catch (error: any) {
    throw new Error(`Failed to create bank account: ${error.message}`);
  }
}

export async function stripeBankAccountRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, bankAccountId } = args;
    const bankAccount = await this.stripeClient.customers.retrieveSource(customerId, bankAccountId);
    return formatStripeResponse(bankAccount);
  } catch (error: any) {
    throw new Error(`Failed to retrieve bank account: ${error.message}`);
  }
}

export async function stripeBankAccountUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, bankAccountId, ...updateData } = args;
    const bankAccount = await this.stripeClient.customers.updateSource(customerId, bankAccountId, updateData);
    return formatStripeResponse(bankAccount);
  } catch (error: any) {
    throw new Error(`Failed to update bank account: ${error.message}`);
  }
}

export async function stripeBankAccountDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, bankAccountId } = args;
    const deleted = await this.stripeClient.customers.deleteSource(customerId, bankAccountId);
    return formatStripeResponse(deleted);
  } catch (error: any) {
    throw new Error(`Failed to delete bank account: ${error.message}`);
  }
}

export async function stripeBankAccountVerify(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { customerId, bankAccountId, amounts } = args;
    const verified = await this.stripeClient.customers.verifySource(customerId, bankAccountId, { amounts });
    return formatStripeResponse(verified);
  } catch (error: any) {
    throw new Error(`Failed to verify bank account: ${error.message}`);
  }
}

// ============================================================
// CHECKOUT SESSIONS - 4 handlers
// ============================================================

export async function stripeCheckoutSessionCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const session = await this.stripeClient.checkout.sessions.create(args);
    return formatStripeResponse(session);
  } catch (error: any) {
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}

export async function stripeCheckoutSessionRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { sessionId } = args;
    const session = await this.stripeClient.checkout.sessions.retrieve(sessionId);
    return formatStripeResponse(session);
  } catch (error: any) {
    throw new Error(`Failed to retrieve checkout session: ${error.message}`);
  }
}

export async function stripeCheckoutSessionList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const sessions = await this.stripeClient.checkout.sessions.list(args);
    return formatStripeResponse(sessions);
  } catch (error: any) {
    throw new Error(`Failed to list checkout sessions: ${error.message}`);
  }
}

export async function stripeCheckoutSessionExpire(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { sessionId } = args;
    const session = await this.stripeClient.checkout.sessions.expire(sessionId);
    return formatStripeResponse(session);
  } catch (error: any) {
    throw new Error(`Failed to expire checkout session: ${error.message}`);
  }
}

// ============================================================
// COUPONS - 5 handlers
// ============================================================

export async function stripeCouponCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const coupon = await this.stripeClient.coupons.create(args);
    return formatStripeResponse(coupon);
  } catch (error: any) {
    throw new Error(`Failed to create coupon: ${error.message}`);
  }
}

export async function stripeCouponRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { couponId } = args;
    const coupon = await this.stripeClient.coupons.retrieve(couponId);
    return formatStripeResponse(coupon);
  } catch (error: any) {
    throw new Error(`Failed to retrieve coupon: ${error.message}`);
  }
}

export async function stripeCouponUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { couponId, ...updateData } = args;
    const coupon = await this.stripeClient.coupons.update(couponId, updateData);
    return formatStripeResponse(coupon);
  } catch (error: any) {
    throw new Error(`Failed to update coupon: ${error.message}`);
  }
}

export async function stripeCouponDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { couponId } = args;
    const deleted = await this.stripeClient.coupons.del(couponId);
    return formatStripeResponse(deleted);
  } catch (error: any) {
    throw new Error(`Failed to delete coupon: ${error.message}`);
  }
}

export async function stripeCouponList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const coupons = await this.stripeClient.coupons.list(args);
    return formatStripeResponse(coupons);
  } catch (error: any) {
    throw new Error(`Failed to list coupons: ${error.message}`);
  }
}

// ============================================================
// PRODUCTS - 6 handlers
// ============================================================

export async function stripeProductCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const product = await this.stripeClient.products.create(args);
    return formatStripeResponse(product);
  } catch (error: any) {
    throw new Error(`Failed to create product: ${error.message}`);
  }
}

export async function stripeProductRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { productId } = args;
    const product = await this.stripeClient.products.retrieve(productId);
    return formatStripeResponse(product);
  } catch (error: any) {
    throw new Error(`Failed to retrieve product: ${error.message}`);
  }
}

export async function stripeProductUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { productId, ...updateData } = args;
    const product = await this.stripeClient.products.update(productId, updateData);
    return formatStripeResponse(product);
  } catch (error: any) {
    throw new Error(`Failed to update product: ${error.message}`);
  }
}

export async function stripeProductDelete(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { productId } = args;
    const deleted = await this.stripeClient.products.del(productId);
    return formatStripeResponse(deleted);
  } catch (error: any) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

export async function stripeProductList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const products = await this.stripeClient.products.list(args);
    return formatStripeResponse(products);
  } catch (error: any) {
    throw new Error(`Failed to list products: ${error.message}`);
  }
}

export async function stripeProductSearch(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { query } = args;
    const products = await this.stripeClient.products.search({ query });
    return formatStripeResponse(products);
  } catch (error: any) {
    throw new Error(`Failed to search products: ${error.message}`);
  }
}

// ============================================================
// CAPABILITIES - 3 handlers
// ============================================================

export async function stripeCapabilityList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { accountId } = args;
    const capabilities = await this.stripeClient.accounts.listCapabilities(accountId);
    return formatStripeResponse(capabilities);
  } catch (error: any) {
    throw new Error(`Failed to list capabilities: ${error.message}`);
  }
}

export async function stripeCapabilityRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { accountId, capabilityId } = args;
    const capability = await this.stripeClient.accounts.retrieveCapability(accountId, capabilityId);
    return formatStripeResponse(capability);
  } catch (error: any) {
    throw new Error(`Failed to retrieve capability: ${error.message}`);
  }
}

export async function stripeCapabilityUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { accountId, capabilityId, ...updateData } = args;
    const capability = await this.stripeClient.accounts.updateCapability(accountId, capabilityId, updateData);
    return formatStripeResponse(capability);
  } catch (error: any) {
    throw new Error(`Failed to update capability: ${error.message}`);
  }
}

// ============================================================
// APPLICATION FEES - 3 handlers
// ============================================================

export async function stripeApplicationFeeList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const fees = await this.stripeClient.applicationFees.list(args);
    return formatStripeResponse(fees);
  } catch (error: any) {
    throw new Error(`Failed to list application fees: ${error.message}`);
  }
}

export async function stripeApplicationFeeRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { feeId } = args;
    const fee = await this.stripeClient.applicationFees.retrieve(feeId);
    return formatStripeResponse(fee);
  } catch (error: any) {
    throw new Error(`Failed to retrieve application fee: ${error.message}`);
  }
}

export async function stripeApplicationFeeRefund(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { feeId, ...refundData } = args;
    const refund = await this.stripeClient.applicationFees.createRefund(feeId, refundData);
    return formatStripeResponse(refund);
  } catch (error: any) {
    throw new Error(`Failed to refund application fee: ${error.message}`);
  }
}

// ============================================================
// DISPUTES - 5 handlers
// ============================================================

export async function stripeDisputeList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const disputes = await this.stripeClient.disputes.list(args);
    return formatStripeResponse(disputes);
  } catch (error: any) {
    throw new Error(`Failed to list disputes: ${error.message}`);
  }
}

export async function stripeDisputeRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { disputeId } = args;
    const dispute = await this.stripeClient.disputes.retrieve(disputeId);
    return formatStripeResponse(dispute);
  } catch (error: any) {
    throw new Error(`Failed to retrieve dispute: ${error.message}`);
  }
}

export async function stripeDisputeUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { disputeId, ...updateData } = args;
    const dispute = await this.stripeClient.disputes.update(disputeId, updateData);
    return formatStripeResponse(dispute);
  } catch (error: any) {
    throw new Error(`Failed to update dispute: ${error.message}`);
  }
}

export async function stripeDisputeClose(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { disputeId } = args;
    const dispute = await this.stripeClient.disputes.close(disputeId);
    return formatStripeResponse(dispute);
  } catch (error: any) {
    throw new Error(`Failed to close dispute: ${error.message}`);
  }
}

export async function stripeDisputeSubmitEvidence(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { disputeId, evidence } = args;
    const dispute = await this.stripeClient.disputes.update(disputeId, { evidence });
    return formatStripeResponse(dispute);
  } catch (error: any) {
    throw new Error(`Failed to submit dispute evidence: ${error.message}`);
  }
}

// ============================================================
// EVENTS - 2 handlers
// ============================================================

export async function stripeEventList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const events = await this.stripeClient.events.list(args);
    return formatStripeResponse(events);
  } catch (error: any) {
    throw new Error(`Failed to list events: ${error.message}`);
  }
}

export async function stripeEventRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { eventId } = args;
    const event = await this.stripeClient.events.retrieve(eventId);
    return formatStripeResponse(event);
  } catch (error: any) {
    throw new Error(`Failed to retrieve event: ${error.message}`);
  }
}

// ============================================================
// FILES - 3 handlers
// ============================================================

export async function stripeFileCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const file = await this.stripeClient.files.create(args);
    return formatStripeResponse(file);
  } catch (error: any) {
    throw new Error(`Failed to create file: ${error.message}`);
  }
}

export async function stripeFileRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { fileId } = args;
    const file = await this.stripeClient.files.retrieve(fileId);
    return formatStripeResponse(file);
  } catch (error: any) {
    throw new Error(`Failed to retrieve file: ${error.message}`);
  }
}

export async function stripeFileList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const files = await this.stripeClient.files.list(args);
    return formatStripeResponse(files);
  } catch (error: any) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

// ============================================================
// PAYMENT METHODS - 6 handlers
// ============================================================

export async function stripePaymentMethodCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentMethod = await this.stripeClient.paymentMethods.create(args);
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to create payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { paymentMethodId } = args;
    const paymentMethod = await this.stripeClient.paymentMethods.retrieve(paymentMethodId);
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to retrieve payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { paymentMethodId, ...updateData } = args;
    const paymentMethod = await this.stripeClient.paymentMethods.update(paymentMethodId, updateData);
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to update payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodAttach(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { paymentMethodId, customerId } = args;
    const paymentMethod = await this.stripeClient.paymentMethods.attach(paymentMethodId, { customer: customerId });
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to attach payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodDetach(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { paymentMethodId } = args;
    const paymentMethod = await this.stripeClient.paymentMethods.detach(paymentMethodId);
    return formatStripeResponse(paymentMethod);
  } catch (error: any) {
    throw new Error(`Failed to detach payment method: ${error.message}`);
  }
}

export async function stripePaymentMethodList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentMethods = await this.stripeClient.paymentMethods.list(args);
    return formatStripeResponse(paymentMethods);
  } catch (error: any) {
    throw new Error(`Failed to list payment methods: ${error.message}`);
  }
}

// ============================================================
// PAYMENT LINKS - 5 handlers
// ============================================================

export async function stripePaymentLinkCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentLink = await this.stripeClient.paymentLinks.create(args);
    return formatStripeResponse(paymentLink);
  } catch (error: any) {
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
}

export async function stripePaymentLinkRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { paymentLinkId } = args;
    const paymentLink = await this.stripeClient.paymentLinks.retrieve(paymentLinkId);
    return formatStripeResponse(paymentLink);
  } catch (error: any) {
    throw new Error(`Failed to retrieve payment link: ${error.message}`);
  }
}

export async function stripePaymentLinkUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { paymentLinkId, ...updateData } = args;
    const paymentLink = await this.stripeClient.paymentLinks.update(paymentLinkId, updateData);
    return formatStripeResponse(paymentLink);
  } catch (error: any) {
    throw new Error(`Failed to update payment link: ${error.message}`);
  }
}

export async function stripePaymentLinkList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const paymentLinks = await this.stripeClient.paymentLinks.list(args);
    return formatStripeResponse(paymentLinks);
  } catch (error: any) {
    throw new Error(`Failed to list payment links: ${error.message}`);
  }
}

export async function stripePaymentLinkListLineItems(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { paymentLinkId } = args;
    const lineItems = await this.stripeClient.paymentLinks.listLineItems(paymentLinkId);
    return formatStripeResponse(lineItems);
  } catch (error: any) {
    throw new Error(`Failed to list payment link line items: ${error.message}`);
  }
}

// ============================================================
// PROMOTION CODES - 5 handlers
// ============================================================

export async function stripePromotionCodeCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const promotionCode = await this.stripeClient.promotionCodes.create(args);
    return formatStripeResponse(promotionCode);
  } catch (error: any) {
    throw new Error(`Failed to create promotion code: ${error.message}`);
  }
}

export async function stripePromotionCodeRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { promotionCodeId } = args;
    const promotionCode = await this.stripeClient.promotionCodes.retrieve(promotionCodeId);
    return formatStripeResponse(promotionCode);
  } catch (error: any) {
    throw new Error(`Failed to retrieve promotion code: ${error.message}`);
  }
}

export async function stripePromotionCodeUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { promotionCodeId, ...updateData } = args;
    const promotionCode = await this.stripeClient.promotionCodes.update(promotionCodeId, updateData);
    return formatStripeResponse(promotionCode);
  } catch (error: any) {
    throw new Error(`Failed to update promotion code: ${error.message}`);
  }
}

export async function stripePromotionCodeList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const promotionCodes = await this.stripeClient.promotionCodes.list(args);
    return formatStripeResponse(promotionCodes);
  } catch (error: any) {
    throw new Error(`Failed to list promotion codes: ${error.message}`);
  }
}

export async function stripePromotionCodeDeactivate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { promotionCodeId } = args;
    const promotionCode = await this.stripeClient.promotionCodes.update(promotionCodeId, { active: false });
    return formatStripeResponse(promotionCode);
  } catch (error: any) {
    throw new Error(`Failed to deactivate promotion code: ${error.message}`);
  }
}

// ============================================================
// SETUP INTENTS - 5 handlers
// ============================================================

export async function stripeSetupIntentCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const setupIntent = await this.stripeClient.setupIntents.create(args);
    return formatStripeResponse(setupIntent);
  } catch (error: any) {
    throw new Error(`Failed to create setup intent: ${error.message}`);
  }
}

export async function stripeSetupIntentRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { setupIntentId } = args;
    const setupIntent = await this.stripeClient.setupIntents.retrieve(setupIntentId);
    return formatStripeResponse(setupIntent);
  } catch (error: any) {
    throw new Error(`Failed to retrieve setup intent: ${error.message}`);
  }
}

export async function stripeSetupIntentUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { setupIntentId, ...updateData } = args;
    const setupIntent = await this.stripeClient.setupIntents.update(setupIntentId, updateData);
    return formatStripeResponse(setupIntent);
  } catch (error: any) {
    throw new Error(`Failed to update setup intent: ${error.message}`);
  }
}

export async function stripeSetupIntentConfirm(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { setupIntentId, ...confirmData } = args;
    const setupIntent = await this.stripeClient.setupIntents.confirm(setupIntentId, confirmData);
    return formatStripeResponse(setupIntent);
  } catch (error: any) {
    throw new Error(`Failed to confirm setup intent: ${error.message}`);
  }
}

export async function stripeSetupIntentCancel(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { setupIntentId } = args;
    const setupIntent = await this.stripeClient.setupIntents.cancel(setupIntentId);
    return formatStripeResponse(setupIntent);
  } catch (error: any) {
    throw new Error(`Failed to cancel setup intent: ${error.message}`);
  }
}

// ============================================================
// TAX RATES - 4 handlers
// ============================================================

export async function stripeTaxRateCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const taxRate = await this.stripeClient.taxRates.create(args);
    return formatStripeResponse(taxRate);
  } catch (error: any) {
    throw new Error(`Failed to create tax rate: ${error.message}`);
  }
}

export async function stripeTaxRateRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { taxRateId } = args;
    const taxRate = await this.stripeClient.taxRates.retrieve(taxRateId);
    return formatStripeResponse(taxRate);
  } catch (error: any) {
    throw new Error(`Failed to retrieve tax rate: ${error.message}`);
  }
}

export async function stripeTaxRateUpdate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { taxRateId, ...updateData } = args;
    const taxRate = await this.stripeClient.taxRates.update(taxRateId, updateData);
    return formatStripeResponse(taxRate);
  } catch (error: any) {
    throw new Error(`Failed to update tax rate: ${error.message}`);
  }
}

export async function stripeTaxRateList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const taxRates = await this.stripeClient.taxRates.list(args);
    return formatStripeResponse(taxRates);
  } catch (error: any) {
    throw new Error(`Failed to list tax rates: ${error.message}`);
  }
}

// ============================================================
// WEBHOOKS - 3 handlers
// ============================================================

export async function stripeWebhookEndpointCreate(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const endpoint = await this.stripeClient.webhookEndpoints.create(args);
    return formatStripeResponse(endpoint);
  } catch (error: any) {
    throw new Error(`Failed to create webhook endpoint: ${error.message}`);
  }
}

export async function stripeWebhookEndpointRetrieve(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const { endpointId } = args;
    const endpoint = await this.stripeClient.webhookEndpoints.retrieve(endpointId);
    return formatStripeResponse(endpoint);
  } catch (error: any) {
    throw new Error(`Failed to retrieve webhook endpoint: ${error.message}`);
  }
}

export async function stripeWebhookEndpointList(this: any, args: any) {
  if (!this.stripeClient) throw new Error('Stripe client not initialized');
  try {
    const endpoints = await this.stripeClient.webhookEndpoints.list(args);
    return formatStripeResponse(endpoints);
  } catch (error: any) {
    throw new Error(`Failed to list webhook endpoints: ${error.message}`);
  }
}






