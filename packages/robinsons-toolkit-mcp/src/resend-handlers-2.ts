/**
 * Resend Handler Functions Part 2
 * Contacts and Audiences
 */

// Helper function to format Resend responses
function formatResendResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// CONTACTS - 10 handlers
// ============================================================

export async function resendListContacts(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { audienceId } = args;
    const contacts = await this.resendClient.contacts.list({ audienceId });
    return formatResendResponse(contacts);
  } catch (error: any) {
    throw new Error(`Failed to list contacts: ${error.message}`);
  }
}

export async function resendGetContact(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { contactId } = args;
    const contact = await this.resendClient.contacts.get(contactId);
    return formatResendResponse(contact);
  } catch (error: any) {
    throw new Error(`Failed to get contact: ${error.message}`);
  }
}

export async function resendCreateContact(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { email, firstName, lastName, audienceId } = args;
    const contact = await this.resendClient.contacts.create({
      email,
      first_name: firstName,
      last_name: lastName,
      audience_id: audienceId,
    });
    return formatResendResponse(contact);
  } catch (error: any) {
    throw new Error(`Failed to create contact: ${error.message}`);
  }
}

export async function resendUpdateContact(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { contactId, firstName, lastName, unsubscribed } = args;
    const contact = await this.resendClient.contacts.update(contactId, {
      first_name: firstName,
      last_name: lastName,
      unsubscribed,
    });
    return formatResendResponse(contact);
  } catch (error: any) {
    throw new Error(`Failed to update contact: ${error.message}`);
  }
}

export async function resendDeleteContact(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { contactId } = args;
    await this.resendClient.contacts.remove(contactId);
    return formatResendResponse({ contactId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete contact: ${error.message}`);
  }
}

export async function resendImportContacts(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { audienceId, contacts } = args;
    // Batch create contacts
    const results = await Promise.all(
      contacts.map((contact: any) =>
        this.resendClient.contacts.create({
          ...contact,
          audience_id: audienceId,
        })
      )
    );
    return formatResendResponse({ imported: results.length, results });
  } catch (error: any) {
    throw new Error(`Failed to import contacts: ${error.message}`);
  }
}

export async function resendExportContacts(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { audienceId, format } = args;
    const contacts = await this.resendClient.contacts.list({ audienceId });
    if (format === 'csv') {
      // Convert to CSV format
      const csv = contacts.data?.map((c: any) => 
        `${c.email},${c.first_name || ''},${c.last_name || ''}`
      ).join('\n');
      return formatResendResponse({ format: 'csv', data: csv });
    }
    return formatResendResponse({ format: 'json', data: contacts });
  } catch (error: any) {
    throw new Error(`Failed to export contacts: ${error.message}`);
  }
}

export async function resendUnsubscribeContact(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { contactId } = args;
    const contact = await this.resendClient.contacts.update(contactId, {
      unsubscribed: true,
    });
    return formatResendResponse(contact);
  } catch (error: any) {
    throw new Error(`Failed to unsubscribe contact: ${error.message}`);
  }
}

export async function resendResubscribeContact(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { contactId } = args;
    const contact = await this.resendClient.contacts.update(contactId, {
      unsubscribed: false,
    });
    return formatResendResponse(contact);
  } catch (error: any) {
    throw new Error(`Failed to resubscribe contact: ${error.message}`);
  }
}

export async function resendSearchContacts(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { query, audienceId } = args;
    const contacts = await this.resendClient.contacts.list({ audienceId });
    // Filter contacts by query
    const filtered = contacts.data?.filter((c: any) =>
      c.email?.includes(query) ||
      c.first_name?.includes(query) ||
      c.last_name?.includes(query)
    );
    return formatResendResponse({ query, results: filtered });
  } catch (error: any) {
    throw new Error(`Failed to search contacts: ${error.message}`);
  }
}

// ============================================================
// AUDIENCES - 5 handlers
// ============================================================

export async function resendListAudiences(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const audiences = await this.resendClient.audiences.list();
    return formatResendResponse(audiences);
  } catch (error: any) {
    throw new Error(`Failed to list audiences: ${error.message}`);
  }
}

export async function resendGetAudience(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { audienceId } = args;
    const audience = await this.resendClient.audiences.get(audienceId);
    return formatResendResponse(audience);
  } catch (error: any) {
    throw new Error(`Failed to get audience: ${error.message}`);
  }
}

export async function resendCreateAudience(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { name } = args;
    const audience = await this.resendClient.audiences.create({ name });
    return formatResendResponse(audience);
  } catch (error: any) {
    throw new Error(`Failed to create audience: ${error.message}`);
  }
}

export async function resendDeleteAudience(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { audienceId } = args;
    await this.resendClient.audiences.remove(audienceId);
    return formatResendResponse({ audienceId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete audience: ${error.message}`);
  }
}

export async function resendGetAudienceStats(this: any, args: any) {
  if (!this.resendClient) throw new Error('Resend client not initialized');
  try {
    const { audienceId } = args;
    const audience = await this.resendClient.audiences.get(audienceId);
    const contacts = await this.resendClient.contacts.list({ audienceId });
    return formatResendResponse({
      audienceId,
      name: audience.name,
      totalContacts: contacts.data?.length || 0,
      unsubscribed: contacts.data?.filter((c: any) => c.unsubscribed).length || 0,
    });
  } catch (error: any) {
    throw new Error(`Failed to get audience stats: ${error.message}`);
  }
}

