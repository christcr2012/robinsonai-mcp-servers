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

