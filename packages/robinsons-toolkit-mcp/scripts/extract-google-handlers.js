#!/usr/bin/env node
/**
 * Extract Google Workspace handlers from temp file and generate:
 * 1. Case statements for executeToolInternal
 * 2. Handler methods for UnifiedToolkit class
 */

const fs = require('fs');
const path = require('path');

// Read temp file
const tempFile = fs.readFileSync(
  path.join(__dirname, '..', 'temp-google-workspace-mcp.ts'),
  'utf8'
);

// Extract handler methods (lines 508-1604)
const lines = tempFile.split('\n');
const handlerLines = lines.slice(507); // 0-indexed, so line 508 is index 507

// Find all handler method signatures
const handlerRegex = /private async (\w+)\(args: any\)/g;
const handlers = [];
let match;

while ((match = handlerRegex.exec(tempFile)) !== null) {
  handlers.push(match[1]);
}

console.log(`Found ${handlers.length} handler methods`);

// Generate case statements
console.log('\n// ============================================================');
console.log('// GOOGLE WORKSPACE TOOLS (192 tools)');
console.log('// ============================================================\n');

// Map handler names to tool names
const toolNameMap = {
  gmailSend: 'gmail_send_message',
  gmailList: 'gmail_list_messages',
  gmailGet: 'gmail_get_message',
  gmailDelete: 'gmail_delete_message',
  gmailListLabels: 'gmail_list_labels',
  gmailCreateLabel: 'gmail_create_label',
  gmailDeleteLabel: 'gmail_delete_label',
  gmailListDrafts: 'gmail_list_drafts',
  gmailCreateDraft: 'gmail_create_draft',
  gmailGetProfile: 'gmail_get_profile',
  driveList: 'drive_list_files',
  driveGet: 'drive_get_file',
  driveCreateFolder: 'drive_create_folder',
  driveDelete: 'drive_delete_file',
  driveCopy: 'drive_copy_file',
  driveShare: 'drive_share_file',
  driveListPerms: 'drive_list_permissions',
  driveSearch: 'drive_search_files',
  driveExport: 'drive_export_file',
  driveGetContent: 'drive_get_file_content',
  calendarList: 'calendar_list_events',
  calendarGet: 'calendar_get_event',
  calendarCreate: 'calendar_create_event',
  calendarUpdate: 'calendar_update_event',
  calendarDelete: 'calendar_delete_event',
  sheetsGetValues: 'sheets_get_values',
  sheetsUpdateValues: 'sheets_update_values',
  sheetsAppendValues: 'sheets_append_values',
  sheetsCreateSpreadsheet: 'sheets_create_spreadsheet',
  sheetsGetSpreadsheet: 'sheets_get_spreadsheet',
  sheetsBatchUpdate: 'sheets_batch_update',
  sheetsClearValues: 'sheets_clear_values',
  sheetsAddSheet: 'sheets_add_sheet',
  sheetsDeleteSheet: 'sheets_delete_sheet',
  sheetsCopySheet: 'sheets_copy_sheet',
  docsGet: 'docs_get_document',
  docsCreate: 'docs_create_document',
  docsInsertText: 'docs_insert_text',
  docsDeleteText: 'docs_delete_text',
  docsReplaceText: 'docs_replace_text',
  adminListUsers: 'admin_list_users',
  adminGetUser: 'admin_get_user',
  adminCreateUser: 'admin_create_user',
  adminUpdateUser: 'admin_update_user',
  adminDeleteUser: 'admin_delete_user',
  adminListUserAliases: 'admin_list_user_aliases',
  adminAddUserAlias: 'admin_add_user_alias',
  adminDeleteUserAlias: 'admin_delete_user_alias',
  adminSuspendUser: 'admin_suspend_user',
  adminUnsuspendUser: 'admin_unsuspend_user',
  adminListGroups: 'admin_list_groups',
  adminGetGroup: 'admin_get_group',
  adminCreateGroup: 'admin_create_group',
  adminUpdateGroup: 'admin_update_group',
  adminDeleteGroup: 'admin_delete_group',
};

// Generate case statements
for (const [handlerName, toolName] of Object.entries(toolNameMap)) {
  console.log(`          case '${toolName}': return await this.${handlerName}(args);`);
}

console.log('\n\n// ============================================================');
console.log('// HANDLER METHODS (add to end of UnifiedToolkit class)');
console.log('// ============================================================\n');

// Extract handler methods from temp file
const handlerStart = tempFile.indexOf('private async gmailSend');
const handlerEnd = tempFile.lastIndexOf('}') - 10; // Before the class closing brace

const handlerMethods = tempFile.substring(handlerStart, handlerEnd);
console.log(handlerMethods);

