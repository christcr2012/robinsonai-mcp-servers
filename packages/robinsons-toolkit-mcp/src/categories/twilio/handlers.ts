/**
 * Twilio Handler Functions Part 1 (Messaging - 20 handlers)
 * Communications platform
 */

// Helper function to format Twilio responses
function formatTwilioResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// MESSAGING HANDLERS (20 handlers)
// ============================================================

export async function twilioSendSms(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { to, from, body } = args;
    const message = await this.twilioClient.messages.create({ to, from, body });
    return formatTwilioResponse(message);
  } catch (error: any) {
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

export async function twilioSendMms(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { to, from, body, mediaUrl } = args;
    const message = await this.twilioClient.messages.create({ to, from, body, mediaUrl });
    return formatTwilioResponse(message);
  } catch (error: any) {
    throw new Error(`Failed to send MMS: ${error.message}`);
  }
}

export async function twilioSendWhatsapp(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { to, from, body } = args;
    const message = await this.twilioClient.messages.create({ to, from, body });
    return formatTwilioResponse(message);
  } catch (error: any) {
    throw new Error(`Failed to send WhatsApp message: ${error.message}`);
  }
}

export async function twilioGetMessage(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { messageSid } = args;
    const message = await this.twilioClient.messages(messageSid).fetch();
    return formatTwilioResponse(message);
  } catch (error: any) {
    throw new Error(`Failed to get message: ${error.message}`);
  }
}

export async function twilioListMessages(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { to, from, dateSent, limit } = args;
    const messages = await this.twilioClient.messages.list({ to, from, dateSent, limit });
    return formatTwilioResponse(messages);
  } catch (error: any) {
    throw new Error(`Failed to list messages: ${error.message}`);
  }
}

export async function twilioDeleteMessage(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { messageSid } = args;
    await this.twilioClient.messages(messageSid).remove();
    return formatTwilioResponse({ messageSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

export async function twilioUpdateMessage(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { messageSid, body } = args;
    const message = await this.twilioClient.messages(messageSid).update({ body });
    return formatTwilioResponse(message);
  } catch (error: any) {
    throw new Error(`Failed to update message: ${error.message}`);
  }
}

export async function twilioCreateMessagingService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { friendlyName, inboundRequestUrl, statusCallback } = args;
    const service = await this.twilioClient.messaging.v1.services.create({
      friendlyName,
      inboundRequestUrl,
      statusCallback,
    });
    return formatTwilioResponse(service);
  } catch (error: any) {
    throw new Error(`Failed to create messaging service: ${error.message}`);
  }
}

export async function twilioGetMessagingService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid } = args;
    const service = await this.twilioClient.messaging.v1.services(serviceSid).fetch();
    return formatTwilioResponse(service);
  } catch (error: any) {
    throw new Error(`Failed to get messaging service: ${error.message}`);
  }
}

export async function twilioListMessagingServices(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    const services = await this.twilioClient.messaging.v1.services.list({ limit });
    return formatTwilioResponse(services);
  } catch (error: any) {
    throw new Error(`Failed to list messaging services: ${error.message}`);
  }
}

export async function twilioUpdateMessagingService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid, friendlyName, inboundRequestUrl } = args;
    const service = await this.twilioClient.messaging.v1.services(serviceSid).update({
      friendlyName,
      inboundRequestUrl,
    });
    return formatTwilioResponse(service);
  } catch (error: any) {
    throw new Error(`Failed to update messaging service: ${error.message}`);
  }
}

export async function twilioDeleteMessagingService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid } = args;
    await this.twilioClient.messaging.v1.services(serviceSid).remove();
    return formatTwilioResponse({ serviceSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete messaging service: ${error.message}`);
  }
}

export async function twilioAddPhoneToService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid, phoneNumberSid } = args;
    const phoneNumber = await this.twilioClient.messaging.v1.services(serviceSid)
      .phoneNumbers.create({ phoneNumberSid });
    return formatTwilioResponse(phoneNumber);
  } catch (error: any) {
    throw new Error(`Failed to add phone to service: ${error.message}`);
  }
}

export async function twilioRemovePhoneFromService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid, phoneNumberSid } = args;
    await this.twilioClient.messaging.v1.services(serviceSid).phoneNumbers(phoneNumberSid).remove();
    return formatTwilioResponse({ serviceSid, phoneNumberSid, status: 'removed' });
  } catch (error: any) {
    throw new Error(`Failed to remove phone from service: ${error.message}`);
  }
}

export async function twilioListServicePhoneNumbers(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid } = args;
    const phoneNumbers = await this.twilioClient.messaging.v1.services(serviceSid).phoneNumbers.list();
    return formatTwilioResponse(phoneNumbers);
  } catch (error: any) {
    throw new Error(`Failed to list service phone numbers: ${error.message}`);
  }
}

export async function twilioScheduleMessage(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { to, from, body, sendAt } = args;
    const message = await this.twilioClient.messages.create({
      to,
      from,
      body,
      scheduleType: 'fixed',
      sendAt: new Date(sendAt),
    });
    return formatTwilioResponse(message);
  } catch (error: any) {
    throw new Error(`Failed to schedule message: ${error.message}`);
  }
}

export async function twilioCancelScheduledMessage(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { messageSid } = args;
    const message = await this.twilioClient.messages(messageSid).update({ status: 'canceled' });
    return formatTwilioResponse(message);
  } catch (error: any) {
    throw new Error(`Failed to cancel scheduled message: ${error.message}`);
  }
}

export async function twilioGetMessageMedia(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { messageSid, mediaSid } = args;
    if (mediaSid) {
      const media = await this.twilioClient.messages(messageSid).media(mediaSid).fetch();
      return formatTwilioResponse(media);
    } else {
      const mediaList = await this.twilioClient.messages(messageSid).media.list();
      return formatTwilioResponse(mediaList);
    }
  } catch (error: any) {
    throw new Error(`Failed to get message media: ${error.message}`);
  }
}

export async function twilioListMessageMedia(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { messageSid } = args;
    const mediaList = await this.twilioClient.messages(messageSid).media.list();
    return formatTwilioResponse(mediaList);
  } catch (error: any) {
    throw new Error(`Failed to list message media: ${error.message}`);
  }
}

export async function twilioDeleteMessageMedia(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { messageSid, mediaSid } = args;
    await this.twilioClient.messages(messageSid).media(mediaSid).remove();
    return formatTwilioResponse({ messageSid, mediaSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete message media: ${error.message}`);
  }
}

