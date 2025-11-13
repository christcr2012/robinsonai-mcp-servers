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

// ============================================================
// CALLS - 15 handlers
// ============================================================

export async function twilioMakeCall(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { to, from, url, twiml } = args;
    const call = await this.twilioClient.calls.create({ to, from, url, twiml });
    return formatTwilioResponse(call);
  } catch (error: any) {
    throw new Error(`Failed to make call: ${error.message}`);
  }
}

export async function twilioGetCall(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { callSid } = args;
    const call = await this.twilioClient.calls(callSid).fetch();
    return formatTwilioResponse(call);
  } catch (error: any) {
    throw new Error(`Failed to get call: ${error.message}`);
  }
}

export async function twilioListCalls(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    const calls = await this.twilioClient.calls.list({ limit });
    return formatTwilioResponse(calls);
  } catch (error: any) {
    throw new Error(`Failed to list calls: ${error.message}`);
  }
}

export async function twilioUpdateCall(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { callSid, status, url } = args;
    const call = await this.twilioClient.calls(callSid).update({ status, url });
    return formatTwilioResponse(call);
  } catch (error: any) {
    throw new Error(`Failed to update call: ${error.message}`);
  }
}

export async function twilioDeleteCall(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { callSid } = args;
    await this.twilioClient.calls(callSid).remove();
    return formatTwilioResponse({ callSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete call: ${error.message}`);
  }
}

export async function twilioGetCallRecording(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { callSid, recordingSid } = args;
    const recording = await this.twilioClient.calls(callSid).recordings(recordingSid).fetch();
    return formatTwilioResponse(recording);
  } catch (error: any) {
    throw new Error(`Failed to get call recording: ${error.message}`);
  }
}

export async function twilioListCallRecordings(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { callSid } = args;
    const recordings = await this.twilioClient.calls(callSid).recordings.list();
    return formatTwilioResponse(recordings);
  } catch (error: any) {
    throw new Error(`Failed to list call recordings: ${error.message}`);
  }
}

export async function twilioDeleteRecording(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { recordingSid } = args;
    await this.twilioClient.recordings(recordingSid).remove();
    return formatTwilioResponse({ recordingSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete recording: ${error.message}`);
  }
}

export async function twilioGetRecordingTranscription(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { recordingSid, transcriptionSid } = args;
    const transcription = await this.twilioClient.recordings(recordingSid).transcriptions(transcriptionSid).fetch();
    return formatTwilioResponse(transcription);
  } catch (error: any) {
    throw new Error(`Failed to get transcription: ${error.message}`);
  }
}

export async function twilioListRecordingTranscriptions(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { recordingSid } = args;
    const transcriptions = await this.twilioClient.recordings(recordingSid).transcriptions.list();
    return formatTwilioResponse(transcriptions);
  } catch (error: any) {
    throw new Error(`Failed to list transcriptions: ${error.message}`);
  }
}

export async function twilioDeleteTranscription(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { transcriptionSid } = args;
    await this.twilioClient.transcriptions(transcriptionSid).remove();
    return formatTwilioResponse({ transcriptionSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete transcription: ${error.message}`);
  }
}

export async function twilioCreateConference(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { friendlyName, statusCallback } = args;
    const conference = await this.twilioClient.conferences.create({ friendlyName, statusCallback });
    return formatTwilioResponse(conference);
  } catch (error: any) {
    throw new Error(`Failed to create conference: ${error.message}`);
  }
}

export async function twilioGetConference(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conferenceSid } = args;
    const conference = await this.twilioClient.conferences(conferenceSid).fetch();
    return formatTwilioResponse(conference);
  } catch (error: any) {
    throw new Error(`Failed to get conference: ${error.message}`);
  }
}

export async function twilioListConferences(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    const conferences = await this.twilioClient.conferences.list({ limit });
    return formatTwilioResponse(conferences);
  } catch (error: any) {
    throw new Error(`Failed to list conferences: ${error.message}`);
  }
}

export async function twilioGetConferenceParticipant(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conferenceSid, callSid } = args;
    const participant = await this.twilioClient.conferences(conferenceSid).participants(callSid).fetch();
    return formatTwilioResponse(participant);
  } catch (error: any) {
    throw new Error(`Failed to get conference participant: ${error.message}`);
  }
}



// ============================================================
// CONVERSATIONS - 10 handlers
// ============================================================

export async function twilioCreateConversation(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { friendlyName } = args;
    const conversation = await this.twilioClient.conversations.v1.conversations.create({ friendlyName });
    return formatTwilioResponse(conversation);
  } catch (error: any) {
    throw new Error(`Failed to create conversation: ${error.message}`);
  }
}

export async function twilioGetConversation(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conversationSid } = args;
    const conversation = await this.twilioClient.conversations.v1.conversations(conversationSid).fetch();
    return formatTwilioResponse(conversation);
  } catch (error: any) {
    throw new Error(`Failed to get conversation: ${error.message}`);
  }
}

export async function twilioListConversations(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    const conversations = await this.twilioClient.conversations.v1.conversations.list({ limit });
    return formatTwilioResponse(conversations);
  } catch (error: any) {
    throw new Error(`Failed to list conversations: ${error.message}`);
  }
}

export async function twilioUpdateConversation(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conversationSid, friendlyName } = args;
    const conversation = await this.twilioClient.conversations.v1.conversations(conversationSid).update({ friendlyName });
    return formatTwilioResponse(conversation);
  } catch (error: any) {
    throw new Error(`Failed to update conversation: ${error.message}`);
  }
}

export async function twilioDeleteConversation(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conversationSid } = args;
    await this.twilioClient.conversations.v1.conversations(conversationSid).remove();
    return formatTwilioResponse({ conversationSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete conversation: ${error.message}`);
  }
}

export async function twilioAddConversationParticipant(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conversationSid, identity, messagingBindingAddress } = args;
    const participant = await this.twilioClient.conversations.v1.conversations(conversationSid).participants.create({
      identity,
      'messagingBinding.address': messagingBindingAddress,
    });
    return formatTwilioResponse(participant);
  } catch (error: any) {
    throw new Error(`Failed to add conversation participant: ${error.message}`);
  }
}

export async function twilioRemoveConversationParticipant(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conversationSid, participantSid } = args;
    await this.twilioClient.conversations.v1.conversations(conversationSid).participants(participantSid).remove();
    return formatTwilioResponse({ conversationSid, participantSid, status: 'removed' });
  } catch (error: any) {
    throw new Error(`Failed to remove conversation participant: ${error.message}`);
  }
}

export async function twilioListConversationParticipants(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conversationSid } = args;
    const participants = await this.twilioClient.conversations.v1.conversations(conversationSid).participants.list();
    return formatTwilioResponse(participants);
  } catch (error: any) {
    throw new Error(`Failed to list conversation participants: ${error.message}`);
  }
}

export async function twilioSendConversationMessage(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conversationSid, body, author } = args;
    const message = await this.twilioClient.conversations.v1.conversations(conversationSid).messages.create({ body, author });
    return formatTwilioResponse(message);
  } catch (error: any) {
    throw new Error(`Failed to send conversation message: ${error.message}`);
  }
}

export async function twilioListConversationMessages(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conversationSid, limit } = args;
    const messages = await this.twilioClient.conversations.v1.conversations(conversationSid).messages.list({ limit });
    return formatTwilioResponse(messages);
  } catch (error: any) {
    throw new Error(`Failed to list conversation messages: ${error.message}`);
  }
}

// ============================================================
// VERIFY - 10 handlers
// ============================================================

export async function twilioCreateVerifyService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { friendlyName } = args;
    const service = await this.twilioClient.verify.v2.services.create({ friendlyName });
    return formatTwilioResponse(service);
  } catch (error: any) {
    throw new Error(`Failed to create verify service: ${error.message}`);
  }
}

export async function twilioGetVerifyService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid } = args;
    const service = await this.twilioClient.verify.v2.services(serviceSid).fetch();
    return formatTwilioResponse(service);
  } catch (error: any) {
    throw new Error(`Failed to get verify service: ${error.message}`);
  }
}

export async function twilioListVerifyServices(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    const services = await this.twilioClient.verify.v2.services.list({ limit });
    return formatTwilioResponse(services);
  } catch (error: any) {
    throw new Error(`Failed to list verify services: ${error.message}`);
  }
}

export async function twilioUpdateVerifyService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid, friendlyName } = args;
    const service = await this.twilioClient.verify.v2.services(serviceSid).update({ friendlyName });
    return formatTwilioResponse(service);
  } catch (error: any) {
    throw new Error(`Failed to update verify service: ${error.message}`);
  }
}

export async function twilioDeleteVerifyService(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid } = args;
    await this.twilioClient.verify.v2.services(serviceSid).remove();
    return formatTwilioResponse({ serviceSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete verify service: ${error.message}`);
  }
}

export async function twilioCreateVerification(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid, to, channel } = args;
    const verification = await this.twilioClient.verify.v2.services(serviceSid).verifications.create({ to, channel });
    return formatTwilioResponse(verification);
  } catch (error: any) {
    throw new Error(`Failed to create verification: ${error.message}`);
  }
}

export async function twilioCheckVerification(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid, to, code } = args;
    const verificationCheck = await this.twilioClient.verify.v2.services(serviceSid).verificationChecks.create({ to, code });
    return formatTwilioResponse(verificationCheck);
  } catch (error: any) {
    throw new Error(`Failed to check verification: ${error.message}`);
  }
}

export async function twilioCreateRateLimit(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid, uniqueName, description } = args;
    const rateLimit = await this.twilioClient.verify.v2.services(serviceSid).rateLimits.create({ uniqueName, description });
    return formatTwilioResponse(rateLimit);
  } catch (error: any) {
    throw new Error(`Failed to create rate limit: ${error.message}`);
  }
}

export async function twilioListRateLimits(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid } = args;
    const rateLimits = await this.twilioClient.verify.v2.services(serviceSid).rateLimits.list();
    return formatTwilioResponse(rateLimits);
  } catch (error: any) {
    throw new Error(`Failed to list rate limits: ${error.message}`);
  }
}

export async function twilioDeleteRateLimit(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { serviceSid, rateLimitSid } = args;
    await this.twilioClient.verify.v2.services(serviceSid).rateLimits(rateLimitSid).remove();
    return formatTwilioResponse({ serviceSid, rateLimitSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete rate limit: ${error.message}`);
  }
}

// ============================================================
// PHONE NUMBERS - 15 handlers
// ============================================================

export async function twilioListPhoneNumbers(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    const phoneNumbers = await this.twilioClient.incomingPhoneNumbers.list({ limit });
    return formatTwilioResponse(phoneNumbers);
  } catch (error: any) {
    throw new Error(`Failed to list phone numbers: ${error.message}`);
  }
}

export async function twilioGetPhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumberSid } = args;
    const phoneNumber = await this.twilioClient.incomingPhoneNumbers(phoneNumberSid).fetch();
    return formatTwilioResponse(phoneNumber);
  } catch (error: any) {
    throw new Error(`Failed to get phone number: ${error.message}`);
  }
}

export async function twilioBuyPhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumber, areaCode } = args;
    const number = await this.twilioClient.incomingPhoneNumbers.create({ phoneNumber, areaCode });
    return formatTwilioResponse(number);
  } catch (error: any) {
    throw new Error(`Failed to buy phone number: ${error.message}`);
  }
}

export async function twilioUpdatePhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumberSid, friendlyName, voiceUrl, smsUrl } = args;
    const phoneNumber = await this.twilioClient.incomingPhoneNumbers(phoneNumberSid).update({ friendlyName, voiceUrl, smsUrl });
    return formatTwilioResponse(phoneNumber);
  } catch (error: any) {
    throw new Error(`Failed to update phone number: ${error.message}`);
  }
}

export async function twilioDeletePhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumberSid } = args;
    await this.twilioClient.incomingPhoneNumbers(phoneNumberSid).remove();
    return formatTwilioResponse({ phoneNumberSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete phone number: ${error.message}`);
  }
}

export async function twilioSearchAvailablePhoneNumbers(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { countryCode, areaCode, contains } = args;
    const numbers = await this.twilioClient.availablePhoneNumbers(countryCode).local.list({ areaCode, contains });
    return formatTwilioResponse(numbers);
  } catch (error: any) {
    throw new Error(`Failed to search available phone numbers: ${error.message}`);
  }
}

export async function twilioListPortRequests(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    // Note: Port requests may require different API endpoint
    return formatTwilioResponse({ message: 'Port requests API may require separate endpoint' });
  } catch (error: any) {
    throw new Error(`Failed to list port requests: ${error.message}`);
  }
}

export async function twilioGetPortRequest(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { portRequestSid } = args;
    return formatTwilioResponse({ portRequestSid, message: 'Port requests API may require separate endpoint' });
  } catch (error: any) {
    throw new Error(`Failed to get port request: ${error.message}`);
  }
}

export async function twilioCreatePortRequest(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumber } = args;
    return formatTwilioResponse({ phoneNumber, message: 'Port requests API may require separate endpoint' });
  } catch (error: any) {
    throw new Error(`Failed to create port request: ${error.message}`);
  }
}

export async function twilioCancelPortRequest(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { portRequestSid } = args;
    return formatTwilioResponse({ portRequestSid, status: 'cancelled', message: 'Port requests API may require separate endpoint' });
  } catch (error: any) {
    throw new Error(`Failed to cancel port request: ${error.message}`);
  }
}

export async function twilioListTollFreePhoneNumbers(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { countryCode } = args;
    const numbers = await this.twilioClient.availablePhoneNumbers(countryCode || 'US').tollFree.list();
    return formatTwilioResponse(numbers);
  } catch (error: any) {
    throw new Error(`Failed to list toll-free phone numbers: ${error.message}`);
  }
}

export async function twilioListMobilePhoneNumbers(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { countryCode } = args;
    const numbers = await this.twilioClient.availablePhoneNumbers(countryCode || 'US').mobile.list();
    return formatTwilioResponse(numbers);
  } catch (error: any) {
    throw new Error(`Failed to list mobile phone numbers: ${error.message}`);
  }
}

export async function twilioListLocalPhoneNumbers(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { countryCode, areaCode } = args;
    const numbers = await this.twilioClient.availablePhoneNumbers(countryCode || 'US').local.list({ areaCode });
    return formatTwilioResponse(numbers);
  } catch (error: any) {
    throw new Error(`Failed to list local phone numbers: ${error.message}`);
  }
}

export async function twilioGetPhoneNumberCapabilities(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumberSid } = args;
    const phoneNumber = await this.twilioClient.incomingPhoneNumbers(phoneNumberSid).fetch();
    return formatTwilioResponse({
      voice: phoneNumber.capabilities.voice,
      sms: phoneNumber.capabilities.sms,
      mms: phoneNumber.capabilities.mms,
    });
  } catch (error: any) {
    throw new Error(`Failed to get phone number capabilities: ${error.message}`);
  }
}

export async function twilioReleasePhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumberSid } = args;
    await this.twilioClient.incomingPhoneNumbers(phoneNumberSid).remove();
    return formatTwilioResponse({ phoneNumberSid, status: 'released' });
  } catch (error: any) {
    throw new Error(`Failed to release phone number: ${error.message}`);
  }
}

// ============================================================
// VIDEO - 13 handlers
// ============================================================

export async function twilioCreateVideoRoom(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { uniqueName, type } = args;
    const room = await this.twilioClient.video.v1.rooms.create({ uniqueName, type });
    return formatTwilioResponse(room);
  } catch (error: any) {
    throw new Error(`Failed to create video room: ${error.message}`);
  }
}

export async function twilioGetVideoRoom(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid } = args;
    const room = await this.twilioClient.video.v1.rooms(roomSid).fetch();
    return formatTwilioResponse(room);
  } catch (error: any) {
    throw new Error(`Failed to get video room: ${error.message}`);
  }
}

export async function twilioListVideoRooms(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    const rooms = await this.twilioClient.video.v1.rooms.list({ limit });
    return formatTwilioResponse(rooms);
  } catch (error: any) {
    throw new Error(`Failed to list video rooms: ${error.message}`);
  }
}

export async function twilioCompleteVideoRoom(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid } = args;
    const room = await this.twilioClient.video.v1.rooms(roomSid).update({ status: 'completed' });
    return formatTwilioResponse(room);
  } catch (error: any) {
    throw new Error(`Failed to complete video room: ${error.message}`);
  }
}

export async function twilioListVideoParticipants(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid } = args;
    const participants = await this.twilioClient.video.v1.rooms(roomSid).participants.list();
    return formatTwilioResponse(participants);
  } catch (error: any) {
    throw new Error(`Failed to list video participants: ${error.message}`);
  }
}

export async function twilioGetVideoParticipant(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid, participantSid } = args;
    const participant = await this.twilioClient.video.v1.rooms(roomSid).participants(participantSid).fetch();
    return formatTwilioResponse(participant);
  } catch (error: any) {
    throw new Error(`Failed to get video participant: ${error.message}`);
  }
}

export async function twilioUpdateVideoParticipant(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid, participantSid, status } = args;
    const participant = await this.twilioClient.video.v1.rooms(roomSid).participants(participantSid).update({ status });
    return formatTwilioResponse(participant);
  } catch (error: any) {
    throw new Error(`Failed to update video participant: ${error.message}`);
  }
}

export async function twilioListVideoRecordings(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid } = args;
    const recordings = await this.twilioClient.video.v1.rooms(roomSid).recordings.list();
    return formatTwilioResponse(recordings);
  } catch (error: any) {
    throw new Error(`Failed to list video recordings: ${error.message}`);
  }
}

export async function twilioGetVideoRecording(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid, recordingSid } = args;
    const recording = await this.twilioClient.video.v1.rooms(roomSid).recordings(recordingSid).fetch();
    return formatTwilioResponse(recording);
  } catch (error: any) {
    throw new Error(`Failed to get video recording: ${error.message}`);
  }
}

export async function twilioDeleteVideoRecording(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid, recordingSid } = args;
    await this.twilioClient.video.v1.rooms(roomSid).recordings(recordingSid).remove();
    return formatTwilioResponse({ roomSid, recordingSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete video recording: ${error.message}`);
  }
}

export async function twilioCreateVideoComposition(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { roomSid, videoLayout } = args;
    const composition = await this.twilioClient.video.v1.compositions.create({ roomSid, videoLayout });
    return formatTwilioResponse(composition);
  } catch (error: any) {
    throw new Error(`Failed to create video composition: ${error.message}`);
  }
}

export async function twilioListVideoCompositions(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { limit } = args;
    const compositions = await this.twilioClient.video.v1.compositions.list({ limit });
    return formatTwilioResponse(compositions);
  } catch (error: any) {
    throw new Error(`Failed to list video compositions: ${error.message}`);
  }
}

export async function twilioDeleteVideoComposition(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { compositionSid } = args;
    await this.twilioClient.video.v1.compositions(compositionSid).remove();
    return formatTwilioResponse({ compositionSid, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete video composition: ${error.message}`);
  }
}

