/**
 * Twilio Handler Functions Part 2 (Voice & Calls, Phone Numbers - 35 handlers)
 */

// Helper function to format Twilio responses
function formatTwilioResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// VOICE & CALLS HANDLERS (20 handlers)
// ============================================================

export async function twilioMakeCall(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { to, from, url, statusCallback } = args;
    const call = await this.twilioClient.calls.create({ to, from, url, statusCallback });
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
    const { to, from, status, startTime, limit } = args;
    const calls = await this.twilioClient.calls.list({ to, from, status, startTime, limit });
    return formatTwilioResponse(calls);
  } catch (error: any) {
    throw new Error(`Failed to list calls: ${error.message}`);
  }
}

export async function twilioUpdateCall(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { callSid, url, method, status } = args;
    const call = await this.twilioClient.calls(callSid).update({ url, method, status });
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
    const { status, friendlyName, limit } = args;
    const conferences = await this.twilioClient.conferences.list({ status, friendlyName, limit });
    return formatTwilioResponse(conferences);
  } catch (error: any) {
    throw new Error(`Failed to list conferences: ${error.message}`);
  }
}

export async function twilioUpdateConference(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conferenceSid, status, announceUrl } = args;
    const conference = await this.twilioClient.conferences(conferenceSid).update({ status, announceUrl });
    return formatTwilioResponse(conference);
  } catch (error: any) {
    throw new Error(`Failed to update conference: ${error.message}`);
  }
}

export async function twilioListConferenceParticipants(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conferenceSid } = args;
    const participants = await this.twilioClient.conferences(conferenceSid).participants.list();
    return formatTwilioResponse(participants);
  } catch (error: any) {
    throw new Error(`Failed to list conference participants: ${error.message}`);
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

export async function twilioUpdateConferenceParticipant(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conferenceSid, callSid, muted, hold } = args;
    const participant = await this.twilioClient.conferences(conferenceSid).participants(callSid).update({ muted, hold });
    return formatTwilioResponse(participant);
  } catch (error: any) {
    throw new Error(`Failed to update conference participant: ${error.message}`);
  }
}

export async function twilioRemoveConferenceParticipant(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { conferenceSid, callSid } = args;
    await this.twilioClient.conferences(conferenceSid).participants(callSid).remove();
    return formatTwilioResponse({ conferenceSid, callSid, status: 'removed' });
  } catch (error: any) {
    throw new Error(`Failed to remove conference participant: ${error.message}`);
  }
}

export async function twilioGetRecording(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { recordingSid } = args;
    const recording = await this.twilioClient.recordings(recordingSid).fetch();
    return formatTwilioResponse(recording);
  } catch (error: any) {
    throw new Error(`Failed to get recording: ${error.message}`);
  }
}

export async function twilioListRecordings(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { callSid, conferenceSid, dateCreated, limit } = args;
    const recordings = await this.twilioClient.recordings.list({ callSid, conferenceSid, dateCreated, limit });
    return formatTwilioResponse(recordings);
  } catch (error: any) {
    throw new Error(`Failed to list recordings: ${error.message}`);
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

export async function twilioGetTranscription(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { transcriptionSid } = args;
    const transcription = await this.twilioClient.transcriptions(transcriptionSid).fetch();
    return formatTwilioResponse(transcription);
  } catch (error: any) {
    throw new Error(`Failed to get transcription: ${error.message}`);
  }
}

export async function twilioListTranscriptions(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { recordingSid, limit } = args;
    const transcriptions = await this.twilioClient.transcriptions.list({ recordingSid, limit });
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

// ============================================================
// PHONE NUMBERS HANDLERS (15 handlers)
// ============================================================

export async function twilioSearchAvailableNumbers(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { countryCode, areaCode, contains, smsEnabled, voiceEnabled, limit } = args;
    const numbers = await this.twilioClient.availablePhoneNumbers(countryCode).local.list({
      areaCode,
      contains,
      smsEnabled,
      voiceEnabled,
      limit,
    });
    return formatTwilioResponse(numbers);
  } catch (error: any) {
    throw new Error(`Failed to search available numbers: ${error.message}`);
  }
}

export async function twilioBuyPhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumber, friendlyName, smsUrl, voiceUrl } = args;
    const number = await this.twilioClient.incomingPhoneNumbers.create({
      phoneNumber,
      friendlyName,
      smsUrl,
      voiceUrl,
    });
    return formatTwilioResponse(number);
  } catch (error: any) {
    throw new Error(`Failed to buy phone number: ${error.message}`);
  }
}

export async function twilioGetPhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumberSid } = args;
    const number = await this.twilioClient.incomingPhoneNumbers(phoneNumberSid).fetch();
    return formatTwilioResponse(number);
  } catch (error: any) {
    throw new Error(`Failed to get phone number: ${error.message}`);
  }
}

export async function twilioListPhoneNumbers(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumber, friendlyName, limit } = args;
    const numbers = await this.twilioClient.incomingPhoneNumbers.list({ phoneNumber, friendlyName, limit });
    return formatTwilioResponse(numbers);
  } catch (error: any) {
    throw new Error(`Failed to list phone numbers: ${error.message}`);
  }
}

export async function twilioUpdatePhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumberSid, friendlyName, smsUrl, voiceUrl, statusCallback } = args;
    const number = await this.twilioClient.incomingPhoneNumbers(phoneNumberSid).update({
      friendlyName,
      smsUrl,
      voiceUrl,
      statusCallback,
    });
    return formatTwilioResponse(number);
  } catch (error: any) {
    throw new Error(`Failed to update phone number: ${error.message}`);
  }
}

export async function twilioDeletePhoneNumber(this: any, args: any) {
  if (!this.twilioClient) throw new Error('Twilio client not initialized');
  try {
    const { phoneNumberSid } = args;
    await this.twilioClient.incomingPhoneNumbers(phoneNumberSid).remove();
    return formatTwilioResponse({ phoneNumberSid, status: 'released' });
  } catch (error: any) {
    throw new Error(`Failed to delete phone number: ${error.message}`);
  }
}

