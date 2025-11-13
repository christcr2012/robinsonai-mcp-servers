/**
 * Google Workspace Handler Functions
 * Extracted from temp-google-workspace-mcp.ts
 */

import { google } from 'googleapis';

const serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';
const userEmail = process.env.GOOGLE_USER_EMAIL || 'me';

if (!serviceAccountKeyPath) {
  console.warn('Warning: GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
}

const auth = serviceAccountKeyPath ? new google.auth.GoogleAuth({
  keyFile: serviceAccountKeyPath,
  scopes: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.directory.orgunit',
    'https://www.googleapis.com/auth/admin.directory.domain',
    'https://www.googleapis.com/auth/admin.directory.rolemanagement',
    'https://www.googleapis.com/auth/admin.directory.device.mobile',
    'https://www.googleapis.com/auth/admin.directory.device.chromeos',
    'https://www.googleapis.com/auth/admin.directory.resource.calendar',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/forms.body',
    'https://www.googleapis.com/auth/forms.responses.readonly',
    'https://www.googleapis.com/auth/classroom.courses',
    'https://www.googleapis.com/auth/classroom.rosters',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/admin.reports.usage.readonly',
    'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    'https://www.googleapis.com/auth/apps.licensing'
  ],
  clientOptions: { subject: userEmail !== 'me' ? userEmail : undefined }
}) : null;

const gmail = auth ? google.gmail({ version: 'v1', auth }) : null;
const drive = auth ? google.drive({ version: 'v3', auth }) : null;
const calendar = auth ? google.calendar({ version: 'v3', auth }) : null;
const sheets = auth ? google.sheets({ version: 'v4', auth }) : null;
const docs = auth ? google.docs({ version: 'v1', auth }) : null;
const admin = auth ? google.admin({ version: 'directory_v1', auth }) : null;
const slides = auth ? google.slides({ version: 'v1', auth }) : null;
const tasks = auth ? google.tasks({ version: 'v1', auth }) : null;
const people = auth ? google.people({ version: 'v1', auth }) : null;
const forms = auth ? google.forms({ version: 'v1', auth }) : null;
const classroom = auth ? google.classroom({ version: 'v1', auth }) : null;
const chat = auth ? google.chat({ version: 'v1', auth }) : null;
const reports = auth ? google.admin({ version: 'reports_v1', auth }) : null;
const licensing = auth ? google.licensing({ version: 'v1', auth }) : null;

function formatResponse(data: any) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

  export async function gmailSend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const msg = `To: ${args.to}
Subject: ${args.subject}

${args.body}`;
    const encoded = Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
    return { content: [{ type: 'text', text: 'Sent. ID: ' + result.data.id }] };
  }

  export async function gmailList(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.messages.list({ userId: 'me', maxResults: args.maxResults || 10, q: args.query });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.messages || [], null, 2) }] };
  }

  export async function gmailGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.messages.get({ userId: 'me', id: args.messageId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function gmailDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await gmail.users.messages.delete({ userId: 'me', id: args.messageId });
    return { content: [{ type: 'text', text: 'Message deleted' }] };
  }

  export async function gmailListLabels(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.labels.list({ userId: 'me' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.labels || [], null, 2) }] };
  }

  export async function gmailCreateLabel(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.labels.create({ userId: 'me', requestBody: { name: args.name } });
    return { content: [{ type: 'text', text: 'Label created. ID: ' + result.data.id }] };
  }

  export async function gmailDeleteLabel(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await gmail.users.labels.delete({ userId: 'me', id: args.labelId });
    return { content: [{ type: 'text', text: 'Label deleted' }] };
  }

  export async function gmailListDrafts(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.drafts.list({ userId: 'me', maxResults: args.maxResults || 10 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.drafts || [], null, 2) }] };
  }

  export async function gmailCreateDraft(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const msg = `To: ${args.to}
Subject: ${args.subject}

${args.body}`;
    const encoded = Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = await gmail.users.drafts.create({ userId: 'me', requestBody: { message: { raw: encoded } } });
    return { content: [{ type: 'text', text: 'Draft created. ID: ' + result.data.id }] };
  }

  export async function gmailGetProfile(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.getProfile({ userId: 'me' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function driveList(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.files.list({ pageSize: args.maxResults || 10, q: args.query, fields: 'files(id, name, mimeType)' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.files || [], null, 2) }] };
  }

  export async function driveGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.files.get({ fileId: args.fileId, fields: '*' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function driveCreateFolder(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const metadata: any = { name: args.name, mimeType: 'application/vnd.google-apps.folder' };
    if (args.parentId) metadata.parents = [args.parentId];
    const result = await drive.files.create({ requestBody: metadata, fields: 'id' });
    return { content: [{ type: 'text', text: 'Folder created. ID: ' + result.data.id }] };
  }

  export async function driveDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await drive.files.delete({ fileId: args.fileId });
    return { content: [{ type: 'text', text: 'File deleted' }] };
  }

  export async function driveCopy(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.files.copy({ fileId: args.fileId, requestBody: { name: args.name }, fields: 'id' });
    return { content: [{ type: 'text', text: 'File copied. New ID: ' + result.data.id }] };
  }

  export async function driveShare(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await drive.permissions.create({ fileId: args.fileId, requestBody: { type: 'user', role: args.role, emailAddress: args.email } });
    return { content: [{ type: 'text', text: 'File shared with ' + args.email }] };
  }

  export async function driveListPerms(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.permissions.list({ fileId: args.fileId, fields: '*' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.permissions || [], null, 2) }] };
  }

  export async function driveSearch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.files.list({ q: args.query, fields: 'files(id, name, mimeType)' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.files || [], null, 2) }] };
  }

  export async function driveExport(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.files.export({ fileId: args.fileId, mimeType: args.mimeType });
    return { content: [{ type: 'text', text: 'Exported: ' + result.data }] };
  }

  export async function driveGetContent(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.files.get({ fileId: args.fileId, alt: 'media' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data) }] };
  }

  export async function calList(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await calendar.events.list({ calendarId: args.calendarId || 'primary', maxResults: args.maxResults || 10 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function calGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await calendar.events.get({ calendarId: args.calendarId || 'primary', eventId: args.eventId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function calCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const event = { summary: args.summary, start: { dateTime: args.start }, end: { dateTime: args.end } };
    const result = await calendar.events.insert({ calendarId: 'primary', requestBody: event });
    return { content: [{ type: 'text', text: 'Event created. ID: ' + result.data.id }] };
  }

  export async function calUpdate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await calendar.events.patch({ calendarId: 'primary', eventId: args.eventId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Event updated' }] };
  }

  export async function calDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await calendar.events.delete({ calendarId: 'primary', eventId: args.eventId });
    return { content: [{ type: 'text', text: 'Event deleted' }] };
  }

  export async function sheetsGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.values.get({ spreadsheetId: args.spreadsheetId, range: args.range });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.values || [], null, 2) }] };
  }

  export async function sheetsUpdate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.values.update({ spreadsheetId: args.spreadsheetId, range: args.range, valueInputOption: 'RAW', requestBody: { values: args.values } });
    return { content: [{ type: 'text', text: 'Updated ' + result.data.updatedCells + ' cells' }] };
  }

  export async function sheetsAppend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.values.append({ spreadsheetId: args.spreadsheetId, range: args.range, valueInputOption: 'RAW', requestBody: { values: args.values } });
    return { content: [{ type: 'text', text: 'Appended ' + result.data.updates?.updatedCells + ' cells' }] };
  }

  export async function sheetsCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.create({ requestBody: { properties: { title: args.title } } });
    return { content: [{ type: 'text', text: 'Created spreadsheet. ID: ' + result.data.spreadsheetId }] };
  }

  export async function sheetsGetMeta(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.get({ spreadsheetId: args.spreadsheetId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function sheetsBatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.batchUpdate({ spreadsheetId: args.spreadsheetId, requestBody: { requests: args.requests } });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function sheetsClear(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await sheets.spreadsheets.values.clear({ spreadsheetId: args.spreadsheetId, range: args.range });
    return { content: [{ type: 'text', text: 'Values cleared' }] };
  }

  export async function sheetsAddSheet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: args.spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: args.title } } }] } });
    return { content: [{ type: 'text', text: 'Sheet added' }] };
  }

  export async function sheetsDeleteSheet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: args.spreadsheetId, requestBody: { requests: [{ deleteSheet: { sheetId: args.sheetId } }] } });
    return { content: [{ type: 'text', text: 'Sheet deleted' }] };
  }

  export async function sheetsCopySheet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await sheets.spreadsheets.sheets.copyTo({ spreadsheetId: args.spreadsheetId, sheetId: args.sheetId, requestBody: { destinationSpreadsheetId: args.destinationSpreadsheetId } });
    return { content: [{ type: 'text', text: 'Sheet copied' }] };
  }

  export async function docsGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await docs.documents.get({ documentId: args.documentId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function docsCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await docs.documents.create({ requestBody: { title: args.title } });
    return { content: [{ type: 'text', text: 'Document created. ID: ' + result.data.documentId }] };
  }

  export async function docsInsert(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await docs.documents.batchUpdate({ documentId: args.documentId, requestBody: { requests: [{ insertText: { text: args.text, location: { index: args.index || 1 } } }] } });
    return { content: [{ type: 'text', text: 'Text inserted' }] };
  }

  export async function docsDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await docs.documents.batchUpdate({ documentId: args.documentId, requestBody: { requests: [{ deleteContentRange: { range: { startIndex: args.startIndex, endIndex: args.endIndex } } }] } });
    return { content: [{ type: 'text', text: 'Text deleted' }] };
  }

  export async function docsReplace(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await docs.documents.batchUpdate({ documentId: args.documentId, requestBody: { requests: [{ replaceAllText: { containsText: { text: args.find, matchCase: false }, replaceText: args.replace } }] } });
    return { content: [{ type: 'text', text: 'Text replaced' }] };
  }

  export async function adminListUsers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.users.list({ customer: 'my_customer', maxResults: args.maxResults || 100, query: args.query });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.users || [], null, 2) }] };
  }

  export async function adminGetUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.users.get({ userKey: args.userKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const user = { primaryEmail: args.email, name: { givenName: args.firstName, familyName: args.lastName }, password: args.password };
    const result = await admin.users.insert({ requestBody: user });
    return { content: [{ type: 'text', text: 'User created. ID: ' + result.data.id }] };
  }

  export async function adminUpdateUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.users.update({ userKey: args.userKey, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'User updated' }] };
  }

  export async function adminDeleteUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.users.delete({ userKey: args.userKey });
    return { content: [{ type: 'text', text: 'User deleted' }] };
  }

  export async function adminListAliases(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.users.aliases.list({ userKey: args.userKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.aliases || [], null, 2) }] };
  }

  export async function adminAddAlias(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.users.aliases.insert({ userKey: args.userKey, requestBody: { alias: args.alias } });
    return { content: [{ type: 'text', text: 'Alias added: ' + args.alias }] };
  }

  export async function adminDeleteAlias(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.users.aliases.delete({ userKey: args.userKey, alias: args.alias });
    return { content: [{ type: 'text', text: 'Alias deleted: ' + args.alias }] };
  }

  export async function adminSuspend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.users.update({ userKey: args.userKey, requestBody: { suspended: true } });
    return { content: [{ type: 'text', text: 'User suspended' }] };
  }

  export async function adminUnsuspend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.users.update({ userKey: args.userKey, requestBody: { suspended: false } });
    return { content: [{ type: 'text', text: 'User unsuspended' }] };
  }

  export async function adminListGroups(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.groups.list({ customer: 'my_customer', maxResults: args.maxResults || 100, query: args.query });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.groups || [], null, 2) }] };
  }

  export async function adminGetGroup(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.groups.get({ groupKey: args.groupKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateGroup(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const group = { email: args.email, name: args.name, description: args.description };
    const result = await admin.groups.insert({ requestBody: group });
    return { content: [{ type: 'text', text: 'Group created. ID: ' + result.data.id }] };
  }

  export async function adminUpdateGroup(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.groups.update({ groupKey: args.groupKey, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Group updated' }] };
  }

  export async function adminDeleteGroup(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.groups.delete({ groupKey: args.groupKey });
    return { content: [{ type: 'text', text: 'Group deleted' }] };
  }

  export async function adminListGroupMembers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.members.list({ groupKey: args.groupKey, maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.members || [], null, 2) }] };
  }

  export async function adminAddGroupMember(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.members.insert({ groupKey: args.groupKey, requestBody: { email: args.email, role: args.role || 'MEMBER' } });
    return { content: [{ type: 'text', text: 'Member added to group' }] };
  }

  export async function adminRemoveGroupMember(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.members.delete({ groupKey: args.groupKey, memberKey: args.memberKey });
    return { content: [{ type: 'text', text: 'Member removed from group' }] };
  }

  export async function adminListGroupAliases(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.groups.aliases.list({ groupKey: args.groupKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.aliases || [], null, 2) }] };
  }

  export async function adminAddGroupAlias(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.groups.aliases.insert({ groupKey: args.groupKey, requestBody: { alias: args.alias } });
    return { content: [{ type: 'text', text: 'Group alias added: ' + args.alias }] };
  }

  export async function adminDeleteGroupAlias(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.groups.aliases.delete({ groupKey: args.groupKey, alias: args.alias });
    return { content: [{ type: 'text', text: 'Group alias deleted: ' + args.alias }] };
  }

  export async function adminListOrgUnits(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.orgunits.list({ customerId: args.customerId || 'my_customer', orgUnitPath: args.orgUnitPath });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.organizationUnits || [], null, 2) }] };
  }

  export async function adminGetOrgUnit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.orgunits.get({ customerId: args.customerId, orgUnitPath: args.orgUnitPath });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateOrgUnit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const orgUnit = { name: args.name, parentOrgUnitPath: args.parentOrgUnitPath || '/' };
    const result = await admin.orgunits.insert({ customerId: args.customerId, requestBody: orgUnit });
    return { content: [{ type: 'text', text: 'Org unit created: ' + result.data.orgUnitPath }] };
  }

  export async function adminUpdateOrgUnit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.orgunits.update({ customerId: args.customerId, orgUnitPath: args.orgUnitPath, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Org unit updated' }] };
  }

  export async function adminDeleteOrgUnit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.orgunits.delete({ customerId: args.customerId, orgUnitPath: args.orgUnitPath });
    return { content: [{ type: 'text', text: 'Org unit deleted' }] };
  }

  export async function adminListDomains(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.domains.list({ customer: args.customerId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.domains || [], null, 2) }] };
  }

  export async function adminGetDomain(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.domains.get({ customer: args.customerId, domainName: args.domainName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateDomain(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.domains.insert({ customer: args.customerId, requestBody: { domainName: args.domainName } });
    return { content: [{ type: 'text', text: 'Domain created: ' + args.domainName }] };
  }

  export async function adminDeleteDomain(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.domains.delete({ customer: args.customerId, domainName: args.domainName });
    return { content: [{ type: 'text', text: 'Domain deleted: ' + args.domainName }] };
  }

  export async function adminListDomainAliases(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.domainAliases.list({ customer: args.customerId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.domainAliases || [], null, 2) }] };
  }

  export async function adminListRoles(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.roles.list({ customer: args.customerId, maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function adminGetRole(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.roles.get({ customer: args.customerId, roleId: args.roleId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateRole(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const role = { roleName: args.roleName, rolePrivileges: args.rolePrivileges || [] };
    const result = await admin.roles.insert({ customer: args.customerId, requestBody: role });
    return { content: [{ type: 'text', text: 'Role created. ID: ' + result.data.roleId }] };
  }

  export async function adminUpdateRole(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.roles.update({ customer: args.customerId, roleId: args.roleId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Role updated' }] };
  }

  export async function adminDeleteRole(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.roles.delete({ customer: args.customerId, roleId: args.roleId });
    return { content: [{ type: 'text', text: 'Role deleted' }] };
  }

  export async function slidesGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await slides.presentations.get({ presentationId: args.presentationId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function slidesCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await slides.presentations.create({ requestBody: { title: args.title } });
    return { content: [{ type: 'text', text: 'Presentation created. ID: ' + result.data.presentationId }] };
  }

  export async function slidesBatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests: args.requests } });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function slidesCreateSlide(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ createSlide: { insertionIndex: args.insertionIndex || 0 } }];
    await slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Slide created' }] };
  }

  export async function slidesDeleteSlide(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ deleteObject: { objectId: args.objectId } }];
    await slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Slide deleted' }] };
  }

  export async function slidesCreateShape(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ createShape: { shapeType: args.shapeType, elementProperties: { pageObjectId: args.pageId } } }];
    await slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Shape created' }] };
  }

  export async function slidesCreateTextbox(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const objectId = 'textbox_' + Date.now();
    const requests = [
      { createShape: { objectId, shapeType: 'TEXT_BOX', elementProperties: { pageObjectId: args.pageId } } },
      { insertText: { objectId, text: args.text } }
    ];
    await slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Text box created' }] };
  }

  export async function slidesInsertText(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ insertText: { objectId: args.objectId, text: args.text } }];
    await slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Text inserted' }] };
  }

  export async function slidesDeleteText(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ deleteText: { objectId: args.objectId, textRange: { startIndex: args.startIndex, endIndex: args.endIndex } } }];
    await slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Text deleted' }] };
  }

  export async function slidesCreateImage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ createImage: { url: args.url, elementProperties: { pageObjectId: args.pageId } } }];
    await slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Image created' }] };
  }

  export async function tasksListTasklists(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await tasks.tasklists.list({ maxResults: args.maxResults || 10 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function tasksGetTasklist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await tasks.tasklists.get({ tasklist: args.tasklistId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function tasksCreateTasklist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await tasks.tasklists.insert({ requestBody: { title: args.title } });
    return { content: [{ type: 'text', text: 'Task list created. ID: ' + result.data.id }] };
  }

  export async function tasksUpdateTasklist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await tasks.tasklists.update({ tasklist: args.tasklistId, requestBody: { title: args.title } });
    return { content: [{ type: 'text', text: 'Task list updated' }] };
  }

  export async function tasksDeleteTasklist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await tasks.tasklists.delete({ tasklist: args.tasklistId });
    return { content: [{ type: 'text', text: 'Task list deleted' }] };
  }

  export async function tasksListTasks(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await tasks.tasks.list({ tasklist: args.tasklistId, maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function tasksGetTask(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await tasks.tasks.get({ tasklist: args.tasklistId, task: args.taskId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function tasksCreateTask(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const task: any = { title: args.title };
    if (args.notes) task.notes = args.notes;
    if (args.due) task.due = args.due;
    const result = await tasks.tasks.insert({ tasklist: args.tasklistId, requestBody: task });
    return { content: [{ type: 'text', text: 'Task created. ID: ' + result.data.id }] };
  }

  export async function tasksUpdateTask(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await tasks.tasks.update({ tasklist: args.tasklistId, task: args.taskId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Task updated' }] };
  }

  export async function tasksDeleteTask(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await tasks.tasks.delete({ tasklist: args.tasklistId, task: args.taskId });
    return { content: [{ type: 'text', text: 'Task deleted' }] };
  }

  export async function tasksClearCompleted(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await tasks.tasks.clear({ tasklist: args.tasklistId });
    return { content: [{ type: 'text', text: 'Completed tasks cleared' }] };
  }

  export async function peopleGetPerson(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await people.people.get({ resourceName: args.resourceName, personFields: 'names,emailAddresses,phoneNumbers' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function peopleListConnections(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await people.people.connections.list({ resourceName: 'people/me', pageSize: args.pageSize || 100, personFields: 'names,emailAddresses' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.connections || [], null, 2) }] };
  }

  export async function peopleCreateContact(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const contact: any = {};
    if (args.names) contact.names = args.names;
    if (args.emailAddresses) contact.emailAddresses = args.emailAddresses;
    if (args.phoneNumbers) contact.phoneNumbers = args.phoneNumbers;
    const result = await people.people.createContact({ requestBody: contact });
    return { content: [{ type: 'text', text: 'Contact created. Resource: ' + result.data.resourceName }] };
  }

  export async function peopleUpdateContact(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await people.people.updateContact({ resourceName: args.resourceName, updatePersonFields: 'names,emailAddresses,phoneNumbers', requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Contact updated' }] };
  }

  export async function peopleDeleteContact(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await people.people.deleteContact({ resourceName: args.resourceName });
    return { content: [{ type: 'text', text: 'Contact deleted' }] };
  }

  export async function formsGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await forms.forms.get({ formId: args.formId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function formsCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await forms.forms.create({ requestBody: { info: { title: args.title } } });
    return { content: [{ type: 'text', text: 'Form created. ID: ' + result.data.formId }] };
  }

  export async function formsBatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await forms.forms.batchUpdate({ formId: args.formId, requestBody: { requests: args.requests } });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function formsListResponses(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await forms.forms.responses.list({ formId: args.formId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.responses || [], null, 2) }] };
  }

  export async function formsGetResponse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await forms.forms.responses.get({ formId: args.formId, responseId: args.responseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function classroomListCourses(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await classroom.courses.list({ pageSize: args.pageSize || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.courses || [], null, 2) }] };
  }

  export async function classroomGetCourse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await classroom.courses.get({ id: args.courseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function classroomCreateCourse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const course: any = { name: args.name };
    if (args.section) course.section = args.section;
    if (args.ownerId) course.ownerId = args.ownerId;
    const result = await classroom.courses.create({ requestBody: course });
    return { content: [{ type: 'text', text: 'Course created. ID: ' + result.data.id }] };
  }

  export async function classroomUpdateCourse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await classroom.courses.update({ id: args.courseId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Course updated' }] };
  }

  export async function classroomDeleteCourse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await classroom.courses.delete({ id: args.courseId });
    return { content: [{ type: 'text', text: 'Course deleted' }] };
  }

  export async function classroomListStudents(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await classroom.courses.students.list({ courseId: args.courseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.students || [], null, 2) }] };
  }

  export async function classroomAddStudent(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await classroom.courses.students.create({ courseId: args.courseId, requestBody: { userId: args.userId } });
    return { content: [{ type: 'text', text: 'Student added to course' }] };
  }

  export async function classroomRemoveStudent(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await classroom.courses.students.delete({ courseId: args.courseId, userId: args.userId });
    return { content: [{ type: 'text', text: 'Student removed from course' }] };
  }

  export async function classroomListTeachers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await classroom.courses.teachers.list({ courseId: args.courseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.teachers || [], null, 2) }] };
  }

  export async function classroomAddTeacher(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await classroom.courses.teachers.create({ courseId: args.courseId, requestBody: { userId: args.userId } });
    return { content: [{ type: 'text', text: 'Teacher added to course' }] };
  }

  export async function classroomListCoursework(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await classroom.courses.courseWork.list({ courseId: args.courseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.courseWork || [], null, 2) }] };
  }

  export async function classroomCreateCoursework(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const coursework: any = { title: args.title, workType: 'ASSIGNMENT' };
    if (args.description) coursework.description = args.description;
    const result = await classroom.courses.courseWork.create({ courseId: args.courseId, requestBody: coursework });
    return { content: [{ type: 'text', text: 'Coursework created. ID: ' + result.data.id }] };
  }

  export async function classroomListSubmissions(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await classroom.courses.courseWork.studentSubmissions.list({ courseId: args.courseId, courseWorkId: args.courseWorkId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.studentSubmissions || [], null, 2) }] };
  }

  export async function chatListSpaces(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await chat.spaces.list({ pageSize: args.pageSize || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.spaces || [], null, 2) }] };
  }

  export async function chatGetSpace(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await chat.spaces.get({ name: args.spaceName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function chatCreateSpace(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await chat.spaces.create({ requestBody: { displayName: args.displayName, spaceType: 'SPACE' } });
    return { content: [{ type: 'text', text: 'Space created: ' + result.data.name }] };
  }

  export async function chatListMessages(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await chat.spaces.messages.list({ parent: args.spaceName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.messages || [], null, 2) }] };
  }

  export async function chatCreateMessage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await chat.spaces.messages.create({ parent: args.spaceName, requestBody: { text: args.text } });
    return { content: [{ type: 'text', text: 'Message created: ' + result.data.name }] };
  }

  export async function chatDeleteMessage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await chat.spaces.messages.delete({ name: args.messageName });
    return { content: [{ type: 'text', text: 'Message deleted' }] };
  }

  export async function chatListMembers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await chat.spaces.members.list({ parent: args.spaceName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.memberships || [], null, 2) }] };
  }

  export async function adminListMobileDevices(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.mobiledevices.list({ customerId: args.customerId || 'my_customer', maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.mobiledevices || [], null, 2) }] };
  }

  export async function adminGetMobileDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.mobiledevices.get({ customerId: args.customerId, resourceId: args.resourceId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminDeleteMobileDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.mobiledevices.delete({ customerId: args.customerId, resourceId: args.resourceId });
    return { content: [{ type: 'text', text: 'Mobile device deleted' }] };
  }

  export async function adminActionMobileDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.mobiledevices.action({ customerId: args.customerId, resourceId: args.resourceId, requestBody: { action: args.action } });
    return { content: [{ type: 'text', text: 'Action performed on mobile device: ' + args.action }] };
  }

  export async function adminListChromeDevices(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.chromeosdevices.list({ customerId: args.customerId || 'my_customer', maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.chromeosdevices || [], null, 2) }] };
  }

  export async function adminGetChromeDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.chromeosdevices.get({ customerId: args.customerId, deviceId: args.deviceId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminUpdateChromeDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.chromeosdevices.update({ customerId: args.customerId, deviceId: args.deviceId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Chrome device updated' }] };
  }

  export async function adminActionChromeDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.chromeosdevices.action({ customerId: args.customerId, resourceId: args.deviceId, requestBody: { action: args.action } });
    return { content: [{ type: 'text', text: 'Action performed on Chrome device: ' + args.action }] };
  }

  export async function adminListCalendarResources(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.resources.calendars.list({ customer: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function adminGetCalendarResource(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.resources.calendars.get({ customer: args.customer, calendarResourceId: args.calendarResourceId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateCalendarResource(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const resource = { resourceId: args.resourceId, resourceName: args.resourceName };
    const result = await admin.resources.calendars.insert({ customer: args.customer, requestBody: resource });
    return { content: [{ type: 'text', text: 'Calendar resource created: ' + result.data.resourceId }] };
  }

  export async function adminUpdateCalendarResource(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.resources.calendars.update({ customer: args.customer, calendarResourceId: args.calendarResourceId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Calendar resource updated' }] };
  }

  export async function adminDeleteCalendarResource(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.resources.calendars.delete({ customer: args.customer, calendarResourceId: args.calendarResourceId });
    return { content: [{ type: 'text', text: 'Calendar resource deleted' }] };
  }

  export async function adminListBuildings(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.resources.buildings.list({ customer: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.buildings || [], null, 2) }] };
  }

  export async function adminGetBuilding(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.resources.buildings.get({ customer: args.customer, buildingId: args.buildingId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateBuilding(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const building = { buildingId: args.buildingId, buildingName: args.buildingName };
    const result = await admin.resources.buildings.insert({ customer: args.customer, requestBody: building });
    return { content: [{ type: 'text', text: 'Building created: ' + result.data.buildingId }] };
  }

  export async function adminUpdateBuilding(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.resources.buildings.update({ customer: args.customer, buildingId: args.buildingId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Building updated' }] };
  }

  export async function adminDeleteBuilding(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.resources.buildings.delete({ customer: args.customer, buildingId: args.buildingId });
    return { content: [{ type: 'text', text: 'Building deleted' }] };
  }

  export async function adminListFeatures(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.resources.features.list({ customer: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.features || [], null, 2) }] };
  }

  export async function adminCreateFeature(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.resources.features.insert({ customer: args.customer, requestBody: { name: args.name } });
    return { content: [{ type: 'text', text: 'Feature created: ' + result.data.name }] };
  }

  export async function adminDeleteFeature(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.resources.features.delete({ customer: args.customer, featureKey: args.featureKey });
    return { content: [{ type: 'text', text: 'Feature deleted' }] };
  }

  export async function adminListSchemas(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.schemas.list({ customerId: args.customerId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.schemas || [], null, 2) }] };
  }

  export async function adminGetSchema(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.schemas.get({ customerId: args.customerId, schemaKey: args.schemaKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateSchema(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const schema = { schemaName: args.schemaName, fields: args.fields };
    const result = await admin.schemas.insert({ customerId: args.customerId, requestBody: schema });
    return { content: [{ type: 'text', text: 'Schema created: ' + result.data.schemaId }] };
  }

  export async function adminUpdateSchema(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.schemas.update({ customerId: args.customerId, schemaKey: args.schemaKey, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Schema updated' }] };
  }

  export async function adminDeleteSchema(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.schemas.delete({ customerId: args.customerId, schemaKey: args.schemaKey });
    return { content: [{ type: 'text', text: 'Schema deleted' }] };
  }

  export async function adminListTokens(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.tokens.list({ userKey: args.userKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function adminGetToken(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.tokens.get({ userKey: args.userKey, clientId: args.clientId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminDeleteToken(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.tokens.delete({ userKey: args.userKey, clientId: args.clientId });
    return { content: [{ type: 'text', text: 'Token deleted' }] };
  }

  export async function adminListAsp(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.asps.list({ userKey: args.userKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function adminGetAsp(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.asps.get({ userKey: args.userKey, codeId: args.codeId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminDeleteAsp(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.asps.delete({ userKey: args.userKey, codeId: args.codeId });
    return { content: [{ type: 'text', text: 'App-specific password deleted' }] };
  }

  export async function adminListRoleAssignments(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.roleAssignments.list({ customer: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function adminGetRoleAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.roleAssignments.get({ customer: args.customer, roleAssignmentId: args.roleAssignmentId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminCreateRoleAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const assignment = { roleId: args.roleId, assignedTo: args.assignedTo };
    const result = await admin.roleAssignments.insert({ customer: args.customer, requestBody: assignment });
    return { content: [{ type: 'text', text: 'Role assignment created: ' + result.data.roleAssignmentId }] };
  }

  export async function adminDeleteRoleAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.roleAssignments.delete({ customer: args.customer, roleAssignmentId: args.roleAssignmentId });
    return { content: [{ type: 'text', text: 'Role assignment deleted' }] };
  }

  export async function reportsUsageUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await reports.userUsageReport.get({ userKey: args.userKey, date: args.date });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function reportsUsageCustomer(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await reports.customerUsageReports.get({ date: args.date, parameters: args.parameters });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function reportsActivityUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await reports.activities.list({ userKey: args.userKey, applicationName: args.applicationName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function reportsActivityEntity(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await reports.activities.list({ applicationName: args.applicationName, customerId: args.entityType === 'customer' ? args.entityKey : undefined, userKey: args.entityType === 'user' ? args.entityKey : undefined });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function licensingListAssignments(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await licensing.licenseAssignments.listForProductAndSku({ productId: args.productId, skuId: args.skuId, customerId: 'my_customer' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  export async function licensingGetAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await licensing.licenseAssignments.get({ productId: args.productId, skuId: args.skuId, userId: args.userId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function licensingAssignLicense(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await licensing.licenseAssignments.insert({ productId: args.productId, skuId: args.skuId, requestBody: { userId: args.userId } });
    return { content: [{ type: 'text', text: 'License assigned to user: ' + args.userId }] };
  }

  export async function licensingUpdateAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await licensing.licenseAssignments.update({ productId: args.productId, skuId: args.skuId, userId: args.userId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'License assignment updated' }] };
  }

  export async function licensingDeleteAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await licensing.licenseAssignments.delete({ productId: args.productId, skuId: args.skuId, userId: args.userId });
    return { content: [{ type: 'text', text: 'License assignment deleted' }] };
  }

  // GOOGLE ADMIN CONSOLE
  export async function adminGetSecuritySettings(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.customers.get({ customerKey: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminUpdateSecuritySettings(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.customers.patch({ customerKey: args.customer, requestBody: args.settings });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function adminListAlerts(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Note: Requires Alert Center API
    return { content: [{ type: 'text', text: 'Alert Center API integration required. Use Google Admin Console for alerts.' }] };
  }

  export async function adminGetAlert(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    return { content: [{ type: 'text', text: 'Alert Center API integration required. Use Google Admin Console for alerts.' }] };
  }

  export async function adminDeleteAlert(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    return { content: [{ type: 'text', text: 'Alert Center API integration required. Use Google Admin Console for alerts.' }] };
  }

  export async function adminRevokeToken(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await admin.tokens.delete({ userKey: args.userKey, clientId: args.clientId });
    return { content: [{ type: 'text', text: 'Token revoked successfully' }] };
  }

  export async function adminGetCustomerInfo(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await admin.customers.get({ customerKey: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  // ADVANCED GMAIL
  export async function gmailBatchModify(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.messages.batchModify({
      userId: args.userId || 'me',
      requestBody: {
        ids: args.ids,
        addLabelIds: args.addLabelIds,
        removeLabelIds: args.removeLabelIds
      }
    });
    return { content: [{ type: 'text', text: 'Messages modified successfully' }] };
  }

  export async function gmailImportMessage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.messages.import({
      userId: args.userId || 'me',
      requestBody: args.message,
      internalDateSource: args.internalDateSource
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function gmailInsertMessage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.messages.insert({
      userId: args.userId || 'me',
      requestBody: args.message
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function gmailStopWatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await gmail.users.stop({ userId: args.userId || 'me' });
    return { content: [{ type: 'text', text: 'Push notifications stopped' }] };
  }

  export async function gmailWatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await gmail.users.watch({
      userId: args.userId || 'me',
      requestBody: {
        labelIds: args.labelIds,
        topicName: args.topicName
      }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  // ADVANCED DRIVE
  export async function driveExportFile(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.files.export({
      fileId: args.fileId,
      mimeType: args.mimeType
    });
    return { content: [{ type: 'text', text: 'File exported successfully' }] };
  }

  export async function driveEmptyTrash(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await drive.files.emptyTrash({});
    return { content: [{ type: 'text', text: 'Trash emptied successfully' }] };
  }

  export async function driveGetAbout(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.about.get({
      fields: args.fields || 'storageQuota,user'
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function driveListChanges(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.changes.list({
      pageToken: args.pageToken,
      includeRemoved: args.includeRemoved
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function driveGetStartPageToken(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.changes.getStartPageToken({});
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function driveWatchChanges(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await drive.changes.watch({
      pageToken: args.pageToken,
      requestBody: {
        id: Date.now().toString(),
        type: args.type || 'web_hook',
        address: args.address
      }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  // ADVANCED CALENDAR
  export async function calendarImportEvent(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await calendar.events.import({
      calendarId: args.calendarId,
      requestBody: args.event
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function calendarQuickAdd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await calendar.events.quickAdd({
      calendarId: args.calendarId,
      text: args.text
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function calendarWatchEvents(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await calendar.events.watch({
      calendarId: args.calendarId,
      requestBody: {
        id: Date.now().toString(),
        type: args.type || 'web_hook',
        address: args.address
      }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  // ADVANCED SHEETS
  export async function sheetsBatchUpdate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: args.spreadsheetId,
      requestBody: { requests: args.requests }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function sheetsAppendValues(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: args.values }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  export async function sheetsBatchClear(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await sheets.spreadsheets.values.batchClear({
      spreadsheetId: args.spreadsheetId,
      requestBody: { ranges: args.ranges }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

