import twilio from 'twilio';

export class TwilioClient {
  private client: ReturnType<typeof twilio>;
  private accountSid: string;

  constructor(accountSid?: string, authToken?: string) {
    this.accountSid = accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    const token = authToken || process.env.TWILIO_AUTH_TOKEN;
    
    if (!this.accountSid || !token) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required');
    }
    
    this.client = twilio(this.accountSid, token);
  }

  getClient() {
    return this.client;
  }

  getAccountSid() {
    return this.accountSid;
  }

  // SMS/MMS Methods
  async sendSms(params: any) {
    return await this.client.messages.create(params);
  }

  async getMessage(messageSid: string) {
    return await this.client.messages(messageSid).fetch();
  }

  async listMessages(params?: any) {
    return await this.client.messages.list(params);
  }

  async deleteMessage(messageSid: string) {
    return await this.client.messages(messageSid).remove();
  }

  // Voice Methods
  async makeCall(params: any) {
    return await this.client.calls.create(params);
  }

  async getCall(callSid: string) {
    return await this.client.calls(callSid).fetch();
  }

  async listCalls(params?: any) {
    return await this.client.calls.list(params);
  }

  async updateCall(callSid: string, params: any) {
    return await this.client.calls(callSid).update(params);
  }

  async deleteCall(callSid: string) {
    return await this.client.calls(callSid).remove();
  }

  // Recording Methods
  async getRecording(recordingSid: string) {
    return await this.client.recordings(recordingSid).fetch();
  }

  async listRecordings(params?: any) {
    return await this.client.recordings.list(params);
  }

  async deleteRecording(recordingSid: string) {
    return await this.client.recordings(recordingSid).remove();
  }

  // Phone Number Methods
  async buyPhoneNumber(params: any) {
    return await this.client.incomingPhoneNumbers.create(params);
  }

  async getPhoneNumber(phoneNumberSid: string) {
    return await this.client.incomingPhoneNumbers(phoneNumberSid).fetch();
  }

  async listPhoneNumbers(params?: any) {
    return await this.client.incomingPhoneNumbers.list(params);
  }

  async updatePhoneNumber(phoneNumberSid: string, params: any) {
    return await this.client.incomingPhoneNumbers(phoneNumberSid).update(params);
  }

  async releasePhoneNumber(phoneNumberSid: string) {
    return await this.client.incomingPhoneNumbers(phoneNumberSid).remove();
  }

  async searchAvailablePhoneNumbers(countryCode: string, params?: any) {
    return await this.client.availablePhoneNumbers(countryCode).local.list(params);
  }

  // Messaging Service Methods
  async createMessagingService(params: any) {
    return await this.client.messaging.v1.services.create(params);
  }

  async getMessagingService(serviceSid: string) {
    return await this.client.messaging.v1.services(serviceSid).fetch();
  }

  async listMessagingServices() {
    return await this.client.messaging.v1.services.list();
  }

  async updateMessagingService(serviceSid: string, params: any) {
    return await this.client.messaging.v1.services(serviceSid).update(params);
  }

  async deleteMessagingService(serviceSid: string) {
    return await this.client.messaging.v1.services(serviceSid).remove();
  }

  // Subaccount Methods
  async createSubaccount(params: any) {
    return await this.client.api.accounts.create(params);
  }

  async getSubaccount(subaccountSid: string) {
    return await this.client.api.accounts(subaccountSid).fetch();
  }

  async listSubaccounts() {
    return await this.client.api.accounts.list();
  }

  async updateSubaccount(subaccountSid: string, params: any) {
    return await this.client.api.accounts(subaccountSid).update(params);
  }

  // Usage Methods
  async getUsage(params?: any) {
    return await this.client.usage.records.list(params);
  }

  async getUsageTriggers() {
    return await this.client.usage.triggers.list();
  }

  async createUsageTrigger(params: any) {
    return await this.client.usage.triggers.create(params);
  }

  async deleteUsageTrigger(triggerSid: string) {
    return await this.client.usage.triggers(triggerSid).remove();
  }

  // Balance Methods
  async getBalance() {
    return await this.client.balance.fetch();
  }

  // Conference methods
  async listConferences(params?: any) {
    return await this.client.conferences.list(params);
  }

  async getConference(conferenceSid: string) {
    return await this.client.conferences(conferenceSid).fetch();
  }

  async updateConference(conferenceSid: string, params: any) {
    return await this.client.conferences(conferenceSid).update(params);
  }

  async listConferenceParticipants(conferenceSid: string, params?: any) {
    return await this.client.conferences(conferenceSid).participants.list(params);
  }

  async getConferenceParticipant(conferenceSid: string, callSid: string) {
    return await this.client.conferences(conferenceSid).participants(callSid).fetch();
  }

  async updateConferenceParticipant(conferenceSid: string, callSid: string, params: any) {
    return await this.client.conferences(conferenceSid).participants(callSid).update(params);
  }

  async removeConferenceParticipant(conferenceSid: string, callSid: string) {
    return await this.client.conferences(conferenceSid).participants(callSid).remove();
  }

  // Message media methods
  async listMessageMedia(messageSid: string) {
    return await this.client.messages(messageSid).media.list();
  }

  async getMessageMedia(messageSid: string, mediaSid: string) {
    return await this.client.messages(messageSid).media(mediaSid).fetch();
  }

  async deleteMessageMedia(messageSid: string, mediaSid: string) {
    return await this.client.messages(messageSid).media(mediaSid).remove();
  }

  async createMessageFeedback(messageSid: string, outcome: string) {
    return await this.client.messages(messageSid).feedback.create({ outcome: outcome as any });
  }

  // Messaging service phone number methods
  async listMessagingServiceNumbers(serviceSid: string, params?: any) {
    return await this.client.messaging.v1.services(serviceSid).phoneNumbers.list(params);
  }

  async addNumberToMessagingService(serviceSid: string, phoneNumberSid: string) {
    return await this.client.messaging.v1.services(serviceSid).phoneNumbers.create({ phoneNumberSid });
  }

  async removeNumberFromMessagingService(serviceSid: string, phoneNumberSid: string) {
    return await this.client.messaging.v1.services(serviceSid).phoneNumbers(phoneNumberSid).remove();
  }
}

