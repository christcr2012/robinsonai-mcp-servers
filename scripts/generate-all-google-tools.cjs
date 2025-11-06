#!/usr/bin/env node
/**
 * Generate ALL 76 missing Google Workspace tools
 * This script generates tool definitions, case statements, and handler methods
 */

const fs = require('fs');
const path = require('path');

// Helper to convert tool_name to methodName
function toMethodName(toolName) {
  return toolName.split('_').map((part, i) => 
    i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

// All 76 tools with their complete specifications
const allTools = [
  // ========== PHASE 1: CRITICAL (11 tools) ==========
  {
    name: 'calendar_create',
    description: 'Create a secondary calendar',
    schema: { summary: 'string*', description: 'string', timeZone: 'string', location: 'string' },
    api: 'calendar.calendars.insert',
    body: '{ summary: args.summary, description: args.description, timeZone: args.timeZone || "UTC", location: args.location }'
  },
  {
    name: 'calendar_get_calendar',
    description: 'Get calendar metadata',
    schema: { calendarId: 'string*' },
    api: 'calendar.calendars.get',
    params: '{ calendarId: args.calendarId }'
  },
  {
    name: 'calendar_update_calendar',
    description: 'Update calendar metadata',
    schema: { calendarId: 'string*', summary: 'string', description: 'string', timeZone: 'string', location: 'string' },
    api: 'calendar.calendars.update',
    params: '{ calendarId: args.calendarId }',
    body: '{ summary: args.summary, description: args.description, timeZone: args.timeZone, location: args.location }'
  },
  {
    name: 'calendar_patch_calendar',
    description: 'Patch calendar metadata',
    schema: { calendarId: 'string*', updates: 'object*' },
    api: 'calendar.calendars.patch',
    params: '{ calendarId: args.calendarId }',
    body: 'args.updates'
  },
  {
    name: 'calendar_delete_calendar',
    description: 'Delete a secondary calendar',
    schema: { calendarId: 'string*' },
    api: 'calendar.calendars.delete',
    params: '{ calendarId: args.calendarId }',
    returnText: '"Calendar deleted successfully"'
  },
  {
    name: 'calendar_clear_calendar',
    description: 'Clear all events from primary calendar',
    schema: { calendarId: 'string*' },
    api: 'calendar.calendars.clear',
    params: '{ calendarId: args.calendarId }',
    returnText: '"Calendar cleared successfully"'
  },
  {
    name: 'drive_permissions_list',
    description: 'List file permissions',
    schema: { fileId: 'string*' },
    api: 'drive.permissions.list',
    params: '{ fileId: args.fileId, fields: "permissions(id,type,role,emailAddress,domain,displayName)" }'
  },
  {
    name: 'drive_permissions_get',
    description: 'Get file permission',
    schema: { fileId: 'string*', permissionId: 'string*' },
    api: 'drive.permissions.get',
    params: '{ fileId: args.fileId, permissionId: args.permissionId, fields: "id,type,role,emailAddress,domain,displayName" }'
  },
  {
    name: 'drive_permissions_create',
    description: 'Create file permission (share file)',
    schema: { fileId: 'string*', type: 'string*', role: 'string*', emailAddress: 'string', domain: 'string', sendNotificationEmail: 'boolean' },
    api: 'drive.permissions.create',
    params: '{ fileId: args.fileId, sendNotificationEmail: args.sendNotificationEmail !== false }',
    body: '{ type: args.type, role: args.role, emailAddress: args.emailAddress, domain: args.domain }'
  },
  {
    name: 'drive_permissions_update',
    description: 'Update file permission',
    schema: { fileId: 'string*', permissionId: 'string*', role: 'string*' },
    api: 'drive.permissions.update',
    params: '{ fileId: args.fileId, permissionId: args.permissionId }',
    body: '{ role: args.role }'
  },
  {
    name: 'drive_permissions_delete',
    description: 'Delete file permission (unshare)',
    schema: { fileId: 'string*', permissionId: 'string*' },
    api: 'drive.permissions.delete',
    params: '{ fileId: args.fileId, permissionId: args.permissionId }',
    returnText: '"Permission deleted successfully"'
  },

  // ========== PHASE 2: HIGH (24 tools) ==========
  {
    name: 'calendar_list_calendars',
    description: 'List user calendars',
    schema: { maxResults: 'number', showHidden: 'boolean' },
    api: 'calendar.calendarList.list',
    params: '{ maxResults: args.maxResults || 250, showHidden: args.showHidden || false }'
  },
  {
    name: 'calendar_list_insert',
    description: 'Add existing calendar to user calendar list',
    schema: { calendarId: 'string*', colorId: 'string', hidden: 'boolean' },
    api: 'calendar.calendarList.insert',
    body: '{ id: args.calendarId, colorId: args.colorId, hidden: args.hidden }'
  },
  {
    name: 'calendar_list_get',
    description: 'Get calendar from user calendar list',
    schema: { calendarId: 'string*' },
    api: 'calendar.calendarList.get',
    params: '{ calendarId: args.calendarId }'
  },
  {
    name: 'calendar_list_update',
    description: 'Update calendar in user calendar list',
    schema: { calendarId: 'string*', colorId: 'string', hidden: 'boolean', summaryOverride: 'string' },
    api: 'calendar.calendarList.update',
    params: '{ calendarId: args.calendarId }',
    body: '{ colorId: args.colorId, hidden: args.hidden, summaryOverride: args.summaryOverride }'
  },
  {
    name: 'calendar_list_patch',
    description: 'Patch calendar in user calendar list',
    schema: { calendarId: 'string*', updates: 'object*' },
    api: 'calendar.calendarList.patch',
    params: '{ calendarId: args.calendarId }',
    body: 'args.updates'
  },
  {
    name: 'calendar_list_delete',
    description: 'Remove calendar from user calendar list',
    schema: { calendarId: 'string*' },
    api: 'calendar.calendarList.delete',
    params: '{ calendarId: args.calendarId }',
    returnText: '"Calendar removed from list successfully"'
  },
  {
    name: 'calendar_list_watch',
    description: 'Watch for calendar list changes',
    schema: { address: 'string*', type: 'string*', id: 'string*' },
    api: 'calendar.calendarList.watch',
    body: '{ id: args.id, type: args.type, address: args.address }'
  },
  {
    name: 'gmail_drafts_list',
    description: 'List email drafts',
    schema: { maxResults: 'number', q: 'string' },
    api: 'gmail.users.drafts.list',
    params: '{ userId: "me", maxResults: args.maxResults || 100, q: args.q }'
  },
  {
    name: 'gmail_drafts_get',
    description: 'Get email draft',
    schema: { draftId: 'string*' },
    api: 'gmail.users.drafts.get',
    params: '{ userId: "me", id: args.draftId }'
  },
  {
    name: 'gmail_drafts_create',
    description: 'Create email draft',
    schema: { to: 'string*', subject: 'string*', body: 'string*' },
    api: 'gmail.users.drafts.create',
    params: '{ userId: "me" }',
    body: '{ message: { raw: Buffer.from(`To: ${args.to}\\nSubject: ${args.subject}\\n\\n${args.body}`).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "") } }'
  },
  {
    name: 'gmail_drafts_update',
    description: 'Update email draft',
    schema: { draftId: 'string*', to: 'string', subject: 'string', body: 'string' },
    api: 'gmail.users.drafts.update',
    params: '{ userId: "me", id: args.draftId }',
    body: '{ message: { raw: Buffer.from(`To: ${args.to}\\nSubject: ${args.subject}\\n\\n${args.body}`).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "") } }'
  },
  {
    name: 'gmail_drafts_delete',
    description: 'Delete email draft',
    schema: { draftId: 'string*' },
    api: 'gmail.users.drafts.delete',
    params: '{ userId: "me", id: args.draftId }',
    returnText: '"Draft deleted successfully"'
  },
  {
    name: 'gmail_drafts_send',
    description: 'Send email draft',
    schema: { draftId: 'string*' },
    api: 'gmail.users.drafts.send',
    params: '{ userId: "me" }',
    body: '{ id: args.draftId }'
  },
  {
    name: 'gmail_threads_list',
    description: 'List email threads',
    schema: { maxResults: 'number', q: 'string' },
    api: 'gmail.users.threads.list',
    params: '{ userId: "me", maxResults: args.maxResults || 100, q: args.q }'
  },
  {
    name: 'gmail_threads_get',
    description: 'Get email thread',
    schema: { threadId: 'string*' },
    api: 'gmail.users.threads.get',
    params: '{ userId: "me", id: args.threadId }'
  },
  {
    name: 'gmail_threads_modify',
    description: 'Modify email thread',
    schema: { threadId: 'string*', addLabelIds: 'array', removeLabelIds: 'array' },
    api: 'gmail.users.threads.modify',
    params: '{ userId: "me", id: args.threadId }',
    body: '{ addLabelIds: args.addLabelIds, removeLabelIds: args.removeLabelIds }'
  },
  {
    name: 'gmail_threads_trash',
    description: 'Trash email thread',
    schema: { threadId: 'string*' },
    api: 'gmail.users.threads.trash',
    params: '{ userId: "me", id: args.threadId }'
  },
  {
    name: 'gmail_threads_untrash',
    description: 'Untrash email thread',
    schema: { threadId: 'string*' },
    api: 'gmail.users.threads.untrash',
    params: '{ userId: "me", id: args.threadId }'
  },
  {
    name: 'gmail_threads_delete',
    description: 'Delete email thread',
    schema: { threadId: 'string*' },
    api: 'gmail.users.threads.delete',
    params: '{ userId: "me", id: args.threadId }',
    returnText: '"Thread deleted successfully"'
  },
  {
    name: 'sheets_create',
    description: 'Create spreadsheet',
    schema: { title: 'string*', sheetTitles: 'array' },
    api: 'sheets.spreadsheets.create',
    body: '{ properties: { title: args.title }, sheets: (args.sheetTitles || []).map(title => ({ properties: { title } })) }'
  },
  {
    name: 'sheets_batch_update',
    description: 'Batch update spreadsheet',
    schema: { spreadsheetId: 'string*', requests: 'array*' },
    api: 'sheets.spreadsheets.batchUpdate',
    params: '{ spreadsheetId: args.spreadsheetId }',
    body: '{ requests: args.requests }'
  },
  {
    name: 'sheets_values_append',
    description: 'Append values to range',
    schema: { spreadsheetId: 'string*', range: 'string*', values: 'array*' },
    api: 'sheets.spreadsheets.values.append',
    params: '{ spreadsheetId: args.spreadsheetId, range: args.range, valueInputOption: "USER_ENTERED" }',
    body: '{ values: args.values }'
  },
  {
    name: 'sheets_values_batch_get',
    description: 'Batch get values',
    schema: { spreadsheetId: 'string*', ranges: 'array*' },
    api: 'sheets.spreadsheets.values.batchGet',
    params: '{ spreadsheetId: args.spreadsheetId, ranges: args.ranges }'
  },
  {
    name: 'sheets_values_batch_update',
    description: 'Batch update values',
    schema: { spreadsheetId: 'string*', data: 'array*' },
    api: 'sheets.spreadsheets.values.batchUpdate',
    params: '{ spreadsheetId: args.spreadsheetId }',
    body: '{ valueInputOption: "USER_ENTERED", data: args.data }'
  }
];

console.log(`Generating ${allTools.length} tools...`);
console.log('This is Phase 1 + Phase 2 (35 tools total)');
console.log('\\nWill continue with remaining phases after these are tested.\\n');

// Generate outputs (continuing in next message due to length)

