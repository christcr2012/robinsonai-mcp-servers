import { Resend } from 'resend';

export class ResendClient {
  private client: Resend;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    this.client = new Resend(key);
  }

  getClient(): Resend {
    return this.client;
  }

  // Email methods
  async sendEmail(params: any) {
    return await this.client.emails.send(params);
  }

  async getEmail(emailId: string) {
    return await this.client.emails.get(emailId);
  }

  async cancelEmail(emailId: string): Promise<any> {
    return await this.client.emails.cancel(emailId);
  }

  async updateEmail(emailId: string, scheduledAt: string): Promise<any> {
    // Resend API uses camelCase
    return await this.client.emails.update({
      id: emailId,
      scheduledAt: scheduledAt
    });
  }

  // Domain methods
  async addDomain(params: any) {
    return await this.client.domains.create(params);
  }

  async getDomain(domainId: string) {
    return await this.client.domains.get(domainId);
  }

  async listDomains() {
    return await this.client.domains.list();
  }

  async updateDomain(domainId: string, params: any) {
    // Resend API uses camelCase
    return await this.client.domains.update({
      id: domainId,
      openTracking: params.open_tracking,
      clickTracking: params.click_tracking,
    });
  }

  async deleteDomain(domainId: string) {
    return await this.client.domains.remove(domainId);
  }

  async verifyDomain(domainId: string) {
    return await this.client.domains.verify(domainId);
  }

  // API Key methods
  async createApiKey(params: any) {
    return await this.client.apiKeys.create(params);
  }

  async listApiKeys() {
    return await this.client.apiKeys.list();
  }

  async deleteApiKey(apiKeyId: string) {
    return await this.client.apiKeys.remove(apiKeyId);
  }

  // Audience methods
  async createAudience(params: any) {
    return await this.client.audiences.create(params);
  }

  async getAudience(audienceId: string) {
    return await this.client.audiences.get(audienceId);
  }

  async listAudiences() {
    return await this.client.audiences.list();
  }

  async deleteAudience(audienceId: string) {
    return await this.client.audiences.remove(audienceId);
  }

  // Contact methods
  async createContact(params: any) {
    return await this.client.contacts.create(params);
  }

  async getContact(contactId: string, audienceId: string) {
    return await this.client.contacts.get({ id: contactId, audienceId });
  }

  async listContacts(audienceId: string) {
    return await this.client.contacts.list({ audienceId });
  }

  async updateContact(contactId: string, audienceId: string, params: any) {
    return await this.client.contacts.update({ id: contactId, audienceId, ...params });
  }

  async deleteContact(contactId: string, audienceId: string) {
    return await this.client.contacts.remove({ id: contactId, audienceId });
  }

  // Broadcast methods (using batch emails)
  async createBroadcast(params: any) {
    return await this.client.batch.send([params]);
  }

  // Webhook methods (Note: Resend API doesn't have webhook management endpoints yet)
  // These would need to be managed through the Resend dashboard
}

