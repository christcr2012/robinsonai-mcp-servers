#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';

class GoogleWorkspaceMCP {
  private server: Server;
  private auth: any;
  private gmail: any;
  private drive: any;
  private calendar: any;
  private sheets: any;
  private docs: any;
  private admin: any;
  private slides: any;
  private tasks: any;
  private people: any;
  private forms: any;
  private classroom: any;
  private chat: any;
  private reports: any;
  private licensing: any;

  constructor() {
    this.server = new Server({ name: '@robinsonai/google-workspace-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });
    const serviceAccountKeyPath = process.argv[2];
    const userEmail = process.argv[3] || 'me';
    if (!serviceAccountKeyPath) {
      console.error('Usage: google-workspace-mcp service-account-key.json user-email');
      process.exit(1);
    }
    this.auth = new google.auth.GoogleAuth({
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
    });
    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    this.drive = google.drive({ version: 'v3', auth: this.auth });
    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.docs = google.docs({ version: 'v1', auth: this.auth });
    this.admin = google.admin({ version: 'directory_v1', auth: this.auth });
    this.slides = google.slides({ version: 'v1', auth: this.auth });
    this.tasks = google.tasks({ version: 'v1', auth: this.auth });
    this.people = google.people({ version: 'v1', auth: this.auth });
    this.forms = google.forms({ version: 'v1', auth: this.auth });
    this.classroom = google.classroom({ version: 'v1', auth: this.auth });
    this.chat = google.chat({ version: 'v1', auth: this.auth });
    this.reports = google.admin({ version: 'reports_v1', auth: this.auth });
    this.licensing = google.licensing({ version: 'v1', auth: this.auth });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [
      { name: 'gmail_send_message', description: 'Send email via Gmail', inputSchema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
      { name: 'gmail_list_messages', description: 'List Gmail messages', inputSchema: { type: 'object', properties: { maxResults: { type: 'number' }, query: { type: 'string' } } } },
      { name: 'gmail_get_message', description: 'Get a Gmail message', inputSchema: { type: 'object', properties: { messageId: { type: 'string' } }, required: ['messageId'] } },
      { name: 'gmail_delete_message', description: 'Delete a Gmail message', inputSchema: { type: 'object', properties: { messageId: { type: 'string' } }, required: ['messageId'] } },
      { name: 'gmail_list_labels', description: 'List Gmail labels', inputSchema: { type: 'object', properties: {} } },
      { name: 'gmail_create_label', description: 'Create a Gmail label', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] } },
      { name: 'gmail_delete_label', description: 'Delete a Gmail label', inputSchema: { type: 'object', properties: { labelId: { type: 'string' } }, required: ['labelId'] } },
      { name: 'gmail_list_drafts', description: 'List Gmail drafts', inputSchema: { type: 'object', properties: { maxResults: { type: 'number' } } } },
      { name: 'gmail_create_draft', description: 'Create a Gmail draft', inputSchema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
      { name: 'gmail_get_profile', description: 'Get Gmail profile', inputSchema: { type: 'object', properties: {} } },
      { name: 'drive_list_files', description: 'List files in Google Drive', inputSchema: { type: 'object', properties: { maxResults: { type: 'number' }, query: { type: 'string' } } } },
      { name: 'drive_get_file', description: 'Get file metadata', inputSchema: { type: 'object', properties: { fileId: { type: 'string' } }, required: ['fileId'] } },
      { name: 'drive_create_folder', description: 'Create a folder', inputSchema: { type: 'object', properties: { name: { type: 'string' }, parentId: { type: 'string' } }, required: ['name'] } },
      { name: 'drive_delete_file', description: 'Delete a file', inputSchema: { type: 'object', properties: { fileId: { type: 'string' } }, required: ['fileId'] } },
      { name: 'drive_copy_file', description: 'Copy a file', inputSchema: { type: 'object', properties: { fileId: { type: 'string' }, name: { type: 'string' } }, required: ['fileId'] } },
      { name: 'drive_share_file', description: 'Share a file', inputSchema: { type: 'object', properties: { fileId: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } }, required: ['fileId', 'email', 'role'] } },
      { name: 'drive_list_permissions', description: 'List file permissions', inputSchema: { type: 'object', properties: { fileId: { type: 'string' } }, required: ['fileId'] } },
      { name: 'drive_search_files', description: 'Search files', inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
      { name: 'drive_export_file', description: 'Export file', inputSchema: { type: 'object', properties: { fileId: { type: 'string' }, mimeType: { type: 'string' } }, required: ['fileId', 'mimeType'] } },
      { name: 'drive_get_file_content', description: 'Get file content', inputSchema: { type: 'object', properties: { fileId: { type: 'string' } }, required: ['fileId'] } },
      { name: 'calendar_list_events', description: 'List calendar events', inputSchema: { type: 'object', properties: { calendarId: { type: 'string' }, maxResults: { type: 'number' } } } },
      { name: 'calendar_get_event', description: 'Get calendar event', inputSchema: { type: 'object', properties: { calendarId: { type: 'string' }, eventId: { type: 'string' } }, required: ['eventId'] } },
      { name: 'calendar_create_event', description: 'Create calendar event', inputSchema: { type: 'object', properties: { summary: { type: 'string' }, start: { type: 'string' }, end: { type: 'string' } }, required: ['summary', 'start', 'end'] } },
      { name: 'calendar_update_event', description: 'Update calendar event', inputSchema: { type: 'object', properties: { eventId: { type: 'string' }, updates: { type: 'object' } }, required: ['eventId', 'updates'] } },
      { name: 'calendar_delete_event', description: 'Delete calendar event', inputSchema: { type: 'object', properties: { eventId: { type: 'string' } }, required: ['eventId'] } },
      { name: 'sheets_get_values', description: 'Get spreadsheet values', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' } }, required: ['spreadsheetId', 'range'] } },
      { name: 'sheets_update_values', description: 'Update spreadsheet values', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' }, values: { type: 'array' } }, required: ['spreadsheetId', 'range', 'values'] } },
      { name: 'sheets_append_values', description: 'Append values to sheet', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' }, values: { type: 'array' } }, required: ['spreadsheetId', 'range', 'values'] } },
      { name: 'sheets_create_spreadsheet', description: 'Create a spreadsheet', inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
      { name: 'sheets_get_spreadsheet', description: 'Get spreadsheet metadata', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' } }, required: ['spreadsheetId'] } },
      { name: 'sheets_batch_update', description: 'Batch update spreadsheet', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, requests: { type: 'array' } }, required: ['spreadsheetId', 'requests'] } },
      { name: 'sheets_clear_values', description: 'Clear spreadsheet values', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' } }, required: ['spreadsheetId', 'range'] } },
      { name: 'sheets_add_sheet', description: 'Add a new sheet', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, title: { type: 'string' } }, required: ['spreadsheetId', 'title'] } },
      { name: 'sheets_delete_sheet', description: 'Delete a sheet', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, sheetId: { type: 'number' } }, required: ['spreadsheetId', 'sheetId'] } },
      { name: 'sheets_copy_sheet', description: 'Copy a sheet', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, sheetId: { type: 'number' }, destinationSpreadsheetId: { type: 'string' } }, required: ['spreadsheetId', 'sheetId'] } },
      { name: 'docs_get_document', description: 'Get document content', inputSchema: { type: 'object', properties: { documentId: { type: 'string' } }, required: ['documentId'] } },
      { name: 'docs_create_document', description: 'Create a document', inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
      { name: 'docs_insert_text', description: 'Insert text in document', inputSchema: { type: 'object', properties: { documentId: { type: 'string' }, text: { type: 'string' }, index: { type: 'number' } }, required: ['documentId', 'text'] } },
      { name: 'docs_delete_text', description: 'Delete text from document', inputSchema: { type: 'object', properties: { documentId: { type: 'string' }, startIndex: { type: 'number' }, endIndex: { type: 'number' } }, required: ['documentId', 'startIndex', 'endIndex'] } },
      { name: 'docs_replace_text', description: 'Replace text in document', inputSchema: { type: 'object', properties: { documentId: { type: 'string' }, find: { type: 'string' }, replace: { type: 'string' } }, required: ['documentId', 'find', 'replace'] } },
      { name: 'admin_list_users', description: 'List users in domain', inputSchema: { type: 'object', properties: { maxResults: { type: 'number' }, query: { type: 'string' } } } },
      { name: 'admin_get_user', description: 'Get user details', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_create_user', description: 'Create a user', inputSchema: { type: 'object', properties: { email: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' }, password: { type: 'string' } }, required: ['email', 'firstName', 'lastName', 'password'] } },
      { name: 'admin_update_user', description: 'Update user details', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, updates: { type: 'object' } }, required: ['userKey', 'updates'] } },
      { name: 'admin_delete_user', description: 'Delete a user', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_list_user_aliases', description: 'List user aliases', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_add_user_alias', description: 'Add user alias', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, alias: { type: 'string' } }, required: ['userKey', 'alias'] } },
      { name: 'admin_delete_user_alias', description: 'Delete user alias', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, alias: { type: 'string' } }, required: ['userKey', 'alias'] } },
      { name: 'admin_suspend_user', description: 'Suspend a user', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_unsuspend_user', description: 'Unsuspend a user', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_list_groups', description: 'List groups in domain', inputSchema: { type: 'object', properties: { maxResults: { type: 'number' }, query: { type: 'string' } } } },
      { name: 'admin_get_group', description: 'Get group details', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' } }, required: ['groupKey'] } },
      { name: 'admin_create_group', description: 'Create a group', inputSchema: { type: 'object', properties: { email: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } }, required: ['email', 'name'] } },
      { name: 'admin_update_group', description: 'Update group details', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' }, updates: { type: 'object' } }, required: ['groupKey', 'updates'] } },
      { name: 'admin_delete_group', description: 'Delete a group', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' } }, required: ['groupKey'] } },
      { name: 'admin_list_group_members', description: 'List group members', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' }, maxResults: { type: 'number' } }, required: ['groupKey'] } },
      { name: 'admin_add_group_member', description: 'Add member to group', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } }, required: ['groupKey', 'email'] } },
      { name: 'admin_remove_group_member', description: 'Remove member from group', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' }, memberKey: { type: 'string' } }, required: ['groupKey', 'memberKey'] } },
      { name: 'admin_list_group_aliases', description: 'List group aliases', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' } }, required: ['groupKey'] } },
      { name: 'admin_add_group_alias', description: 'Add group alias', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' }, alias: { type: 'string' } }, required: ['groupKey', 'alias'] } },
      { name: 'admin_delete_group_alias', description: 'Delete group alias', inputSchema: { type: 'object', properties: { groupKey: { type: 'string' }, alias: { type: 'string' } }, required: ['groupKey', 'alias'] } },
      { name: 'admin_list_orgunits', description: 'List organizational units', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, orgUnitPath: { type: 'string' } } } },
      { name: 'admin_get_orgunit', description: 'Get organizational unit', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, orgUnitPath: { type: 'string' } }, required: ['customerId', 'orgUnitPath'] } },
      { name: 'admin_create_orgunit', description: 'Create organizational unit', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, name: { type: 'string' }, parentOrgUnitPath: { type: 'string' } }, required: ['customerId', 'name'] } },
      { name: 'admin_update_orgunit', description: 'Update organizational unit', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, orgUnitPath: { type: 'string' }, updates: { type: 'object' } }, required: ['customerId', 'orgUnitPath', 'updates'] } },
      { name: 'admin_delete_orgunit', description: 'Delete organizational unit', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, orgUnitPath: { type: 'string' } }, required: ['customerId', 'orgUnitPath'] } },
      { name: 'admin_list_domains', description: 'List domains', inputSchema: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] } },
      { name: 'admin_get_domain', description: 'Get domain details', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, domainName: { type: 'string' } }, required: ['customerId', 'domainName'] } },
      { name: 'admin_create_domain', description: 'Create a domain', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, domainName: { type: 'string' } }, required: ['customerId', 'domainName'] } },
      { name: 'admin_delete_domain', description: 'Delete a domain', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, domainName: { type: 'string' } }, required: ['customerId', 'domainName'] } },
      { name: 'admin_list_domain_aliases', description: 'List domain aliases', inputSchema: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] } },
      { name: 'admin_list_roles', description: 'List roles', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, maxResults: { type: 'number' } }, required: ['customerId'] } },
      { name: 'admin_get_role', description: 'Get role details', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, roleId: { type: 'string' } }, required: ['customerId', 'roleId'] } },
      { name: 'admin_create_role', description: 'Create a role', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, roleName: { type: 'string' }, rolePrivileges: { type: 'array' } }, required: ['customerId', 'roleName'] } },
      { name: 'admin_update_role', description: 'Update role details', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, roleId: { type: 'string' }, updates: { type: 'object' } }, required: ['customerId', 'roleId', 'updates'] } },
      { name: 'admin_delete_role', description: 'Delete a role', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, roleId: { type: 'string' } }, required: ['customerId', 'roleId'] } },
      { name: 'slides_get_presentation', description: 'Get presentation content', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' } }, required: ['presentationId'] } },
      { name: 'slides_create_presentation', description: 'Create a presentation', inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
      { name: 'slides_batch_update', description: 'Batch update presentation', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, requests: { type: 'array' } }, required: ['presentationId', 'requests'] } },
      { name: 'slides_create_slide', description: 'Create a slide', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, insertionIndex: { type: 'number' } }, required: ['presentationId'] } },
      { name: 'slides_delete_slide', description: 'Delete a slide', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, objectId: { type: 'string' } }, required: ['presentationId', 'objectId'] } },
      { name: 'slides_create_shape', description: 'Create a shape on slide', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, pageId: { type: 'string' }, shapeType: { type: 'string' } }, required: ['presentationId', 'pageId', 'shapeType'] } },
      { name: 'slides_create_textbox', description: 'Create a text box', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, pageId: { type: 'string' }, text: { type: 'string' } }, required: ['presentationId', 'pageId', 'text'] } },
      { name: 'slides_insert_text', description: 'Insert text into shape', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, objectId: { type: 'string' }, text: { type: 'string' } }, required: ['presentationId', 'objectId', 'text'] } },
      { name: 'slides_delete_text', description: 'Delete text from shape', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, objectId: { type: 'string' }, startIndex: { type: 'number' }, endIndex: { type: 'number' } }, required: ['presentationId', 'objectId', 'startIndex', 'endIndex'] } },
      { name: 'slides_create_image', description: 'Create an image on slide', inputSchema: { type: 'object', properties: { presentationId: { type: 'string' }, pageId: { type: 'string' }, url: { type: 'string' } }, required: ['presentationId', 'pageId', 'url'] } },
      { name: 'tasks_list_tasklists', description: 'List task lists', inputSchema: { type: 'object', properties: { maxResults: { type: 'number' } } } },
      { name: 'tasks_get_tasklist', description: 'Get task list', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' } }, required: ['tasklistId'] } },
      { name: 'tasks_create_tasklist', description: 'Create a task list', inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
      { name: 'tasks_update_tasklist', description: 'Update task list', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' }, title: { type: 'string' } }, required: ['tasklistId', 'title'] } },
      { name: 'tasks_delete_tasklist', description: 'Delete task list', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' } }, required: ['tasklistId'] } },
      { name: 'tasks_list_tasks', description: 'List tasks', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' }, maxResults: { type: 'number' } }, required: ['tasklistId'] } },
      { name: 'tasks_get_task', description: 'Get a task', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' }, taskId: { type: 'string' } }, required: ['tasklistId', 'taskId'] } },
      { name: 'tasks_create_task', description: 'Create a task', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' }, title: { type: 'string' }, notes: { type: 'string' }, due: { type: 'string' } }, required: ['tasklistId', 'title'] } },
      { name: 'tasks_update_task', description: 'Update a task', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' }, taskId: { type: 'string' }, updates: { type: 'object' } }, required: ['tasklistId', 'taskId', 'updates'] } },
      { name: 'tasks_delete_task', description: 'Delete a task', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' }, taskId: { type: 'string' } }, required: ['tasklistId', 'taskId'] } },
      { name: 'tasks_clear_completed', description: 'Clear completed tasks', inputSchema: { type: 'object', properties: { tasklistId: { type: 'string' } }, required: ['tasklistId'] } },
      { name: 'people_get_person', description: 'Get person details', inputSchema: { type: 'object', properties: { resourceName: { type: 'string' } }, required: ['resourceName'] } },
      { name: 'people_list_connections', description: 'List connections', inputSchema: { type: 'object', properties: { pageSize: { type: 'number' } } } },
      { name: 'people_create_contact', description: 'Create a contact', inputSchema: { type: 'object', properties: { names: { type: 'array' }, emailAddresses: { type: 'array' }, phoneNumbers: { type: 'array' } } } },
      { name: 'people_update_contact', description: 'Update a contact', inputSchema: { type: 'object', properties: { resourceName: { type: 'string' }, updates: { type: 'object' } }, required: ['resourceName', 'updates'] } },
      { name: 'people_delete_contact', description: 'Delete a contact', inputSchema: { type: 'object', properties: { resourceName: { type: 'string' } }, required: ['resourceName'] } },
      { name: 'forms_get_form', description: 'Get form details', inputSchema: { type: 'object', properties: { formId: { type: 'string' } }, required: ['formId'] } },
      { name: 'forms_create_form', description: 'Create a form', inputSchema: { type: 'object', properties: { title: { type: 'string' } }, required: ['title'] } },
      { name: 'forms_batch_update', description: 'Batch update form', inputSchema: { type: 'object', properties: { formId: { type: 'string' }, requests: { type: 'array' } }, required: ['formId', 'requests'] } },
      { name: 'forms_list_responses', description: 'List form responses', inputSchema: { type: 'object', properties: { formId: { type: 'string' } }, required: ['formId'] } },
      { name: 'forms_get_response', description: 'Get form response', inputSchema: { type: 'object', properties: { formId: { type: 'string' }, responseId: { type: 'string' } }, required: ['formId', 'responseId'] } },
      { name: 'classroom_list_courses', description: 'List courses', inputSchema: { type: 'object', properties: { pageSize: { type: 'number' } } } },
      { name: 'classroom_get_course', description: 'Get course details', inputSchema: { type: 'object', properties: { courseId: { type: 'string' } }, required: ['courseId'] } },
      { name: 'classroom_create_course', description: 'Create a course', inputSchema: { type: 'object', properties: { name: { type: 'string' }, section: { type: 'string' }, ownerId: { type: 'string' } }, required: ['name'] } },
      { name: 'classroom_update_course', description: 'Update course', inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, updates: { type: 'object' } }, required: ['courseId', 'updates'] } },
      { name: 'classroom_delete_course', description: 'Delete course', inputSchema: { type: 'object', properties: { courseId: { type: 'string' } }, required: ['courseId'] } },
      { name: 'classroom_list_students', description: 'List students in course', inputSchema: { type: 'object', properties: { courseId: { type: 'string' } }, required: ['courseId'] } },
      { name: 'classroom_add_student', description: 'Add student to course', inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, userId: { type: 'string' } }, required: ['courseId', 'userId'] } },
      { name: 'classroom_remove_student', description: 'Remove student from course', inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, userId: { type: 'string' } }, required: ['courseId', 'userId'] } },
      { name: 'classroom_list_teachers', description: 'List teachers in course', inputSchema: { type: 'object', properties: { courseId: { type: 'string' } }, required: ['courseId'] } },
      { name: 'classroom_add_teacher', description: 'Add teacher to course', inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, userId: { type: 'string' } }, required: ['courseId', 'userId'] } },
      { name: 'classroom_list_coursework', description: 'List coursework', inputSchema: { type: 'object', properties: { courseId: { type: 'string' } }, required: ['courseId'] } },
      { name: 'classroom_create_coursework', description: 'Create coursework', inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' } }, required: ['courseId', 'title'] } },
      { name: 'classroom_list_submissions', description: 'List student submissions', inputSchema: { type: 'object', properties: { courseId: { type: 'string' }, courseWorkId: { type: 'string' } }, required: ['courseId', 'courseWorkId'] } },
      { name: 'chat_list_spaces', description: 'List chat spaces', inputSchema: { type: 'object', properties: { pageSize: { type: 'number' } } } },
      { name: 'chat_get_space', description: 'Get space details', inputSchema: { type: 'object', properties: { spaceName: { type: 'string' } }, required: ['spaceName'] } },
      { name: 'chat_create_space', description: 'Create a space', inputSchema: { type: 'object', properties: { displayName: { type: 'string' } }, required: ['displayName'] } },
      { name: 'chat_list_messages', description: 'List messages in space', inputSchema: { type: 'object', properties: { spaceName: { type: 'string' } }, required: ['spaceName'] } },
      { name: 'chat_create_message', description: 'Create a message', inputSchema: { type: 'object', properties: { spaceName: { type: 'string' }, text: { type: 'string' } }, required: ['spaceName', 'text'] } },
      { name: 'chat_delete_message', description: 'Delete a message', inputSchema: { type: 'object', properties: { messageName: { type: 'string' } }, required: ['messageName'] } },
      { name: 'chat_list_members', description: 'List space members', inputSchema: { type: 'object', properties: { spaceName: { type: 'string' } }, required: ['spaceName'] } },
      { name: 'admin_list_mobile_devices', description: 'List mobile devices', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, maxResults: { type: 'number' } } } },
      { name: 'admin_get_mobile_device', description: 'Get mobile device', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, resourceId: { type: 'string' } }, required: ['customerId', 'resourceId'] } },
      { name: 'admin_delete_mobile_device', description: 'Delete mobile device', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, resourceId: { type: 'string' } }, required: ['customerId', 'resourceId'] } },
      { name: 'admin_action_mobile_device', description: 'Perform action on mobile device', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, resourceId: { type: 'string' }, action: { type: 'string' } }, required: ['customerId', 'resourceId', 'action'] } },
      { name: 'admin_list_chrome_devices', description: 'List Chrome OS devices', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, maxResults: { type: 'number' } } } },
      { name: 'admin_get_chrome_device', description: 'Get Chrome OS device', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, deviceId: { type: 'string' } }, required: ['customerId', 'deviceId'] } },
      { name: 'admin_update_chrome_device', description: 'Update Chrome OS device', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, deviceId: { type: 'string' }, updates: { type: 'object' } }, required: ['customerId', 'deviceId', 'updates'] } },
      { name: 'admin_action_chrome_device', description: 'Perform action on Chrome device', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, deviceId: { type: 'string' }, action: { type: 'string' } }, required: ['customerId', 'deviceId', 'action'] } },
      { name: 'admin_list_calendar_resources', description: 'List calendar resources', inputSchema: { type: 'object', properties: { customer: { type: 'string' } }, required: ['customer'] } },
      { name: 'admin_get_calendar_resource', description: 'Get calendar resource', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, calendarResourceId: { type: 'string' } }, required: ['customer', 'calendarResourceId'] } },
      { name: 'admin_create_calendar_resource', description: 'Create calendar resource', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, resourceId: { type: 'string' }, resourceName: { type: 'string' } }, required: ['customer', 'resourceId', 'resourceName'] } },
      { name: 'admin_update_calendar_resource', description: 'Update calendar resource', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, calendarResourceId: { type: 'string' }, updates: { type: 'object' } }, required: ['customer', 'calendarResourceId', 'updates'] } },
      { name: 'admin_delete_calendar_resource', description: 'Delete calendar resource', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, calendarResourceId: { type: 'string' } }, required: ['customer', 'calendarResourceId'] } },
      { name: 'admin_list_buildings', description: 'List buildings', inputSchema: { type: 'object', properties: { customer: { type: 'string' } }, required: ['customer'] } },
      { name: 'admin_get_building', description: 'Get building', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, buildingId: { type: 'string' } }, required: ['customer', 'buildingId'] } },
      { name: 'admin_create_building', description: 'Create building', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, buildingId: { type: 'string' }, buildingName: { type: 'string' } }, required: ['customer', 'buildingId', 'buildingName'] } },
      { name: 'admin_update_building', description: 'Update building', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, buildingId: { type: 'string' }, updates: { type: 'object' } }, required: ['customer', 'buildingId', 'updates'] } },
      { name: 'admin_delete_building', description: 'Delete building', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, buildingId: { type: 'string' } }, required: ['customer', 'buildingId'] } },
      { name: 'admin_list_features', description: 'List calendar features', inputSchema: { type: 'object', properties: { customer: { type: 'string' } }, required: ['customer'] } },
      { name: 'admin_create_feature', description: 'Create calendar feature', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, name: { type: 'string' } }, required: ['customer', 'name'] } },
      { name: 'admin_delete_feature', description: 'Delete calendar feature', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, featureKey: { type: 'string' } }, required: ['customer', 'featureKey'] } },
      { name: 'admin_list_schemas', description: 'List user schemas', inputSchema: { type: 'object', properties: { customerId: { type: 'string' } }, required: ['customerId'] } },
      { name: 'admin_get_schema', description: 'Get user schema', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, schemaKey: { type: 'string' } }, required: ['customerId', 'schemaKey'] } },
      { name: 'admin_create_schema', description: 'Create user schema', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, schemaName: { type: 'string' }, fields: { type: 'array' } }, required: ['customerId', 'schemaName', 'fields'] } },
      { name: 'admin_update_schema', description: 'Update user schema', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, schemaKey: { type: 'string' }, updates: { type: 'object' } }, required: ['customerId', 'schemaKey', 'updates'] } },
      { name: 'admin_delete_schema', description: 'Delete user schema', inputSchema: { type: 'object', properties: { customerId: { type: 'string' }, schemaKey: { type: 'string' } }, required: ['customerId', 'schemaKey'] } },
      { name: 'admin_list_tokens', description: 'List user tokens', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_get_token', description: 'Get user token', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, clientId: { type: 'string' } }, required: ['userKey', 'clientId'] } },
      { name: 'admin_delete_token', description: 'Delete user token', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, clientId: { type: 'string' } }, required: ['userKey', 'clientId'] } },
      { name: 'admin_list_asp', description: 'List app-specific passwords', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_get_asp', description: 'Get app-specific password', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, codeId: { type: 'string' } }, required: ['userKey', 'codeId'] } },
      { name: 'admin_delete_asp', description: 'Delete app-specific password', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, codeId: { type: 'string' } }, required: ['userKey', 'codeId'] } },
      { name: 'admin_list_role_assignments', description: 'List role assignments', inputSchema: { type: 'object', properties: { customer: { type: 'string' } }, required: ['customer'] } },
      { name: 'admin_get_role_assignment', description: 'Get role assignment', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, roleAssignmentId: { type: 'string' } }, required: ['customer', 'roleAssignmentId'] } },
      { name: 'admin_create_role_assignment', description: 'Create role assignment', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, roleId: { type: 'string' }, assignedTo: { type: 'string' } }, required: ['customer', 'roleId', 'assignedTo'] } },
      { name: 'admin_delete_role_assignment', description: 'Delete role assignment', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, roleAssignmentId: { type: 'string' } }, required: ['customer', 'roleAssignmentId'] } },
      { name: 'reports_usage_user', description: 'Get user usage report', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, date: { type: 'string' } }, required: ['userKey', 'date'] } },
      { name: 'reports_usage_customer', description: 'Get customer usage report', inputSchema: { type: 'object', properties: { date: { type: 'string' }, parameters: { type: 'string' } }, required: ['date'] } },
      { name: 'reports_activity_user', description: 'Get user activity report', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, applicationName: { type: 'string' } }, required: ['userKey', 'applicationName'] } },
      { name: 'reports_activity_entity', description: 'Get entity activity report', inputSchema: { type: 'object', properties: { applicationName: { type: 'string' }, entityType: { type: 'string' }, entityKey: { type: 'string' } }, required: ['applicationName', 'entityType', 'entityKey'] } },
      { name: 'licensing_list_assignments', description: 'List license assignments', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, skuId: { type: 'string' } }, required: ['productId', 'skuId'] } },
      { name: 'licensing_get_assignment', description: 'Get license assignment', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, skuId: { type: 'string' }, userId: { type: 'string' } }, required: ['productId', 'skuId', 'userId'] } },
      { name: 'licensing_assign_license', description: 'Assign license to user', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, skuId: { type: 'string' }, userId: { type: 'string' } }, required: ['productId', 'skuId', 'userId'] } },
      { name: 'licensing_update_assignment', description: 'Update license assignment', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, skuId: { type: 'string' }, userId: { type: 'string' }, updates: { type: 'object' } }, required: ['productId', 'skuId', 'userId', 'updates'] } },
      { name: 'licensing_delete_assignment', description: 'Delete license assignment', inputSchema: { type: 'object', properties: { productId: { type: 'string' }, skuId: { type: 'string' }, userId: { type: 'string' } }, required: ['productId', 'skuId', 'userId'] } },

      // GOOGLE ADMIN CONSOLE (10 tools)
      { name: 'admin_get_security_settings', description: 'Get organization security settings', inputSchema: { type: 'object', properties: { customer: { type: 'string' } }, required: ['customer'] } },
      { name: 'admin_update_security_settings', description: 'Update security settings', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, settings: { type: 'object' } }, required: ['customer', 'settings'] } },
      { name: 'admin_list_alerts', description: 'List security alerts', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, filter: { type: 'string' } }, required: ['customer'] } },
      { name: 'admin_get_alert', description: 'Get alert details', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, alertId: { type: 'string' } }, required: ['customer', 'alertId'] } },
      { name: 'admin_delete_alert', description: 'Delete alert', inputSchema: { type: 'object', properties: { customer: { type: 'string' }, alertId: { type: 'string' } }, required: ['customer', 'alertId'] } },
      { name: 'admin_list_tokens', description: 'List OAuth tokens', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_revoke_token', description: 'Revoke OAuth token', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, clientId: { type: 'string' } }, required: ['userKey', 'clientId'] } },
      { name: 'admin_list_asp', description: 'List app-specific passwords', inputSchema: { type: 'object', properties: { userKey: { type: 'string' } }, required: ['userKey'] } },
      { name: 'admin_delete_asp', description: 'Delete app-specific password', inputSchema: { type: 'object', properties: { userKey: { type: 'string' }, codeId: { type: 'string' } }, required: ['userKey', 'codeId'] } },
      { name: 'admin_get_customer_info', description: 'Get customer information', inputSchema: { type: 'object', properties: { customer: { type: 'string' } }, required: ['customer'] } },

      // ADVANCED GMAIL (6 tools)
      { name: 'gmail_batch_modify', description: 'Batch modify messages', inputSchema: { type: 'object', properties: { userId: { type: 'string' }, ids: { type: 'array', items: { type: 'string' } }, addLabelIds: { type: 'array' }, removeLabelIds: { type: 'array' } }, required: ['userId', 'ids'] } },
      { name: 'gmail_import_message', description: 'Import message to mailbox', inputSchema: { type: 'object', properties: { userId: { type: 'string' }, message: { type: 'object' }, internalDateSource: { type: 'string' } }, required: ['userId', 'message'] } },
      { name: 'gmail_insert_message', description: 'Insert message directly', inputSchema: { type: 'object', properties: { userId: { type: 'string' }, message: { type: 'object' } }, required: ['userId', 'message'] } },
      { name: 'gmail_get_profile', description: 'Get user Gmail profile', inputSchema: { type: 'object', properties: { userId: { type: 'string' } }, required: ['userId'] } },
      { name: 'gmail_stop_watch', description: 'Stop Gmail push notifications', inputSchema: { type: 'object', properties: { userId: { type: 'string' } }, required: ['userId'] } },
      { name: 'gmail_watch', description: 'Set up Gmail push notifications', inputSchema: { type: 'object', properties: { userId: { type: 'string' }, labelIds: { type: 'array' }, topicName: { type: 'string' } }, required: ['userId', 'topicName'] } },

      // ADVANCED DRIVE (6 tools)
      { name: 'drive_export_file', description: 'Export Google Workspace file', inputSchema: { type: 'object', properties: { fileId: { type: 'string' }, mimeType: { type: 'string' } }, required: ['fileId', 'mimeType'] } },
      { name: 'drive_empty_trash', description: 'Empty Drive trash', inputSchema: { type: 'object', properties: {} } },
      { name: 'drive_get_about', description: 'Get Drive storage info', inputSchema: { type: 'object', properties: { fields: { type: 'string' } } } },
      { name: 'drive_list_changes', description: 'List file changes', inputSchema: { type: 'object', properties: { pageToken: { type: 'string' }, includeRemoved: { type: 'boolean' } }, required: ['pageToken'] } },
      { name: 'drive_get_start_page_token', description: 'Get start page token for changes', inputSchema: { type: 'object', properties: {} } },
      { name: 'drive_watch_changes', description: 'Watch for file changes', inputSchema: { type: 'object', properties: { pageToken: { type: 'string' }, address: { type: 'string' }, type: { type: 'string' } }, required: ['pageToken', 'address'] } },

      // ADVANCED CALENDAR (3 tools)
      { name: 'calendar_import_event', description: 'Import event to calendar', inputSchema: { type: 'object', properties: { calendarId: { type: 'string' }, event: { type: 'object' } }, required: ['calendarId', 'event'] } },
      { name: 'calendar_quick_add', description: 'Quick add event from text', inputSchema: { type: 'object', properties: { calendarId: { type: 'string' }, text: { type: 'string' } }, required: ['calendarId', 'text'] } },
      { name: 'calendar_watch_events', description: 'Watch calendar for changes', inputSchema: { type: 'object', properties: { calendarId: { type: 'string' }, address: { type: 'string' }, type: { type: 'string' } }, required: ['calendarId', 'address'] } },

      // ADVANCED SHEETS (3 tools)
      { name: 'sheets_batch_update', description: 'Batch update spreadsheet', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, requests: { type: 'array' } }, required: ['spreadsheetId', 'requests'] } },
      { name: 'sheets_append_values', description: 'Append values to sheet', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, range: { type: 'string' }, values: { type: 'array' } }, required: ['spreadsheetId', 'range', 'values'] } },
      { name: 'sheets_batch_clear', description: 'Batch clear ranges', inputSchema: { type: 'object', properties: { spreadsheetId: { type: 'string' }, ranges: { type: 'array', items: { type: 'string' } } }, required: ['spreadsheetId', 'ranges'] } }
    ] }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const args = request.params.arguments || {};
      switch (request.params.name) {
        case 'gmail_send_message': return await this.gmailSend(args);
        case 'gmail_list_messages': return await this.gmailList(args);
        case 'gmail_get_message': return await this.gmailGet(args);
        case 'gmail_delete_message': return await this.gmailDelete(args);
        case 'gmail_list_labels': return await this.gmailListLabels(args);
        case 'gmail_create_label': return await this.gmailCreateLabel(args);
        case 'gmail_delete_label': return await this.gmailDeleteLabel(args);
        case 'gmail_list_drafts': return await this.gmailListDrafts(args);
        case 'gmail_create_draft': return await this.gmailCreateDraft(args);
        case 'gmail_get_profile': return await this.gmailGetProfile(args);
        case 'drive_list_files': return await this.driveList(args);
        case 'drive_get_file': return await this.driveGet(args);
        case 'drive_create_folder': return await this.driveCreateFolder(args);
        case 'drive_delete_file': return await this.driveDelete(args);
        case 'drive_copy_file': return await this.driveCopy(args);
        case 'drive_share_file': return await this.driveShare(args);
        case 'drive_list_permissions': return await this.driveListPerms(args);
        case 'drive_search_files': return await this.driveSearch(args);
        case 'drive_export_file': return await this.driveExport(args);
        case 'drive_get_file_content': return await this.driveGetContent(args);
        case 'calendar_list_events': return await this.calList(args);
        case 'calendar_get_event': return await this.calGet(args);
        case 'calendar_create_event': return await this.calCreate(args);
        case 'calendar_update_event': return await this.calUpdate(args);
        case 'calendar_delete_event': return await this.calDelete(args);
        case 'sheets_get_values': return await this.sheetsGet(args);
        case 'sheets_update_values': return await this.sheetsUpdate(args);
        case 'sheets_append_values': return await this.sheetsAppend(args);
        case 'sheets_create_spreadsheet': return await this.sheetsCreate(args);
        case 'sheets_get_spreadsheet': return await this.sheetsGetMeta(args);
        case 'sheets_batch_update': return await this.sheetsBatch(args);
        case 'sheets_clear_values': return await this.sheetsClear(args);
        case 'sheets_add_sheet': return await this.sheetsAddSheet(args);
        case 'sheets_delete_sheet': return await this.sheetsDeleteSheet(args);
        case 'sheets_copy_sheet': return await this.sheetsCopySheet(args);
        case 'docs_get_document': return await this.docsGet(args);
        case 'docs_create_document': return await this.docsCreate(args);
        case 'docs_insert_text': return await this.docsInsert(args);
        case 'docs_delete_text': return await this.docsDelete(args);
        case 'docs_replace_text': return await this.docsReplace(args);
        case 'admin_list_users': return await this.adminListUsers(args);
        case 'admin_get_user': return await this.adminGetUser(args);
        case 'admin_create_user': return await this.adminCreateUser(args);
        case 'admin_update_user': return await this.adminUpdateUser(args);
        case 'admin_delete_user': return await this.adminDeleteUser(args);
        case 'admin_list_user_aliases': return await this.adminListAliases(args);
        case 'admin_add_user_alias': return await this.adminAddAlias(args);
        case 'admin_delete_user_alias': return await this.adminDeleteAlias(args);
        case 'admin_suspend_user': return await this.adminSuspend(args);
        case 'admin_unsuspend_user': return await this.adminUnsuspend(args);
        case 'admin_list_groups': return await this.adminListGroups(args);
        case 'admin_get_group': return await this.adminGetGroup(args);
        case 'admin_create_group': return await this.adminCreateGroup(args);
        case 'admin_update_group': return await this.adminUpdateGroup(args);
        case 'admin_delete_group': return await this.adminDeleteGroup(args);
        case 'admin_list_group_members': return await this.adminListGroupMembers(args);
        case 'admin_add_group_member': return await this.adminAddGroupMember(args);
        case 'admin_remove_group_member': return await this.adminRemoveGroupMember(args);
        case 'admin_list_group_aliases': return await this.adminListGroupAliases(args);
        case 'admin_add_group_alias': return await this.adminAddGroupAlias(args);
        case 'admin_delete_group_alias': return await this.adminDeleteGroupAlias(args);
        case 'admin_list_orgunits': return await this.adminListOrgUnits(args);
        case 'admin_get_orgunit': return await this.adminGetOrgUnit(args);
        case 'admin_create_orgunit': return await this.adminCreateOrgUnit(args);
        case 'admin_update_orgunit': return await this.adminUpdateOrgUnit(args);
        case 'admin_delete_orgunit': return await this.adminDeleteOrgUnit(args);
        case 'admin_list_domains': return await this.adminListDomains(args);
        case 'admin_get_domain': return await this.adminGetDomain(args);
        case 'admin_create_domain': return await this.adminCreateDomain(args);
        case 'admin_delete_domain': return await this.adminDeleteDomain(args);
        case 'admin_list_domain_aliases': return await this.adminListDomainAliases(args);
        case 'admin_list_roles': return await this.adminListRoles(args);
        case 'admin_get_role': return await this.adminGetRole(args);
        case 'admin_create_role': return await this.adminCreateRole(args);
        case 'admin_update_role': return await this.adminUpdateRole(args);
        case 'admin_delete_role': return await this.adminDeleteRole(args);
        case 'slides_get_presentation': return await this.slidesGet(args);
        case 'slides_create_presentation': return await this.slidesCreate(args);
        case 'slides_batch_update': return await this.slidesBatch(args);
        case 'slides_create_slide': return await this.slidesCreateSlide(args);
        case 'slides_delete_slide': return await this.slidesDeleteSlide(args);
        case 'slides_create_shape': return await this.slidesCreateShape(args);
        case 'slides_create_textbox': return await this.slidesCreateTextbox(args);
        case 'slides_insert_text': return await this.slidesInsertText(args);
        case 'slides_delete_text': return await this.slidesDeleteText(args);
        case 'slides_create_image': return await this.slidesCreateImage(args);
        case 'tasks_list_tasklists': return await this.tasksListTasklists(args);
        case 'tasks_get_tasklist': return await this.tasksGetTasklist(args);
        case 'tasks_create_tasklist': return await this.tasksCreateTasklist(args);
        case 'tasks_update_tasklist': return await this.tasksUpdateTasklist(args);
        case 'tasks_delete_tasklist': return await this.tasksDeleteTasklist(args);
        case 'tasks_list_tasks': return await this.tasksListTasks(args);
        case 'tasks_get_task': return await this.tasksGetTask(args);
        case 'tasks_create_task': return await this.tasksCreateTask(args);
        case 'tasks_update_task': return await this.tasksUpdateTask(args);
        case 'tasks_delete_task': return await this.tasksDeleteTask(args);
        case 'tasks_clear_completed': return await this.tasksClearCompleted(args);
        case 'people_get_person': return await this.peopleGetPerson(args);
        case 'people_list_connections': return await this.peopleListConnections(args);
        case 'people_create_contact': return await this.peopleCreateContact(args);
        case 'people_update_contact': return await this.peopleUpdateContact(args);
        case 'people_delete_contact': return await this.peopleDeleteContact(args);
        case 'forms_get_form': return await this.formsGet(args);
        case 'forms_create_form': return await this.formsCreate(args);
        case 'forms_batch_update': return await this.formsBatch(args);
        case 'forms_list_responses': return await this.formsListResponses(args);
        case 'forms_get_response': return await this.formsGetResponse(args);
        case 'classroom_list_courses': return await this.classroomListCourses(args);
        case 'classroom_get_course': return await this.classroomGetCourse(args);
        case 'classroom_create_course': return await this.classroomCreateCourse(args);
        case 'classroom_update_course': return await this.classroomUpdateCourse(args);
        case 'classroom_delete_course': return await this.classroomDeleteCourse(args);
        case 'classroom_list_students': return await this.classroomListStudents(args);
        case 'classroom_add_student': return await this.classroomAddStudent(args);
        case 'classroom_remove_student': return await this.classroomRemoveStudent(args);
        case 'classroom_list_teachers': return await this.classroomListTeachers(args);
        case 'classroom_add_teacher': return await this.classroomAddTeacher(args);
        case 'classroom_list_coursework': return await this.classroomListCoursework(args);
        case 'classroom_create_coursework': return await this.classroomCreateCoursework(args);
        case 'classroom_list_submissions': return await this.classroomListSubmissions(args);
        case 'chat_list_spaces': return await this.chatListSpaces(args);
        case 'chat_get_space': return await this.chatGetSpace(args);
        case 'chat_create_space': return await this.chatCreateSpace(args);
        case 'chat_list_messages': return await this.chatListMessages(args);
        case 'chat_create_message': return await this.chatCreateMessage(args);
        case 'chat_delete_message': return await this.chatDeleteMessage(args);
        case 'chat_list_members': return await this.chatListMembers(args);
        case 'admin_list_mobile_devices': return await this.adminListMobileDevices(args);
        case 'admin_get_mobile_device': return await this.adminGetMobileDevice(args);
        case 'admin_delete_mobile_device': return await this.adminDeleteMobileDevice(args);
        case 'admin_action_mobile_device': return await this.adminActionMobileDevice(args);
        case 'admin_list_chrome_devices': return await this.adminListChromeDevices(args);
        case 'admin_get_chrome_device': return await this.adminGetChromeDevice(args);
        case 'admin_update_chrome_device': return await this.adminUpdateChromeDevice(args);
        case 'admin_action_chrome_device': return await this.adminActionChromeDevice(args);
        case 'admin_list_calendar_resources': return await this.adminListCalendarResources(args);
        case 'admin_get_calendar_resource': return await this.adminGetCalendarResource(args);
        case 'admin_create_calendar_resource': return await this.adminCreateCalendarResource(args);
        case 'admin_update_calendar_resource': return await this.adminUpdateCalendarResource(args);
        case 'admin_delete_calendar_resource': return await this.adminDeleteCalendarResource(args);
        case 'admin_list_buildings': return await this.adminListBuildings(args);
        case 'admin_get_building': return await this.adminGetBuilding(args);
        case 'admin_create_building': return await this.adminCreateBuilding(args);
        case 'admin_update_building': return await this.adminUpdateBuilding(args);
        case 'admin_delete_building': return await this.adminDeleteBuilding(args);
        case 'admin_list_features': return await this.adminListFeatures(args);
        case 'admin_create_feature': return await this.adminCreateFeature(args);
        case 'admin_delete_feature': return await this.adminDeleteFeature(args);
        case 'admin_list_schemas': return await this.adminListSchemas(args);
        case 'admin_get_schema': return await this.adminGetSchema(args);
        case 'admin_create_schema': return await this.adminCreateSchema(args);
        case 'admin_update_schema': return await this.adminUpdateSchema(args);
        case 'admin_delete_schema': return await this.adminDeleteSchema(args);
        case 'admin_list_tokens': return await this.adminListTokens(args);
        case 'admin_get_token': return await this.adminGetToken(args);
        case 'admin_delete_token': return await this.adminDeleteToken(args);
        case 'admin_list_asp': return await this.adminListAsp(args);
        case 'admin_get_asp': return await this.adminGetAsp(args);
        case 'admin_delete_asp': return await this.adminDeleteAsp(args);
        case 'admin_list_role_assignments': return await this.adminListRoleAssignments(args);
        case 'admin_get_role_assignment': return await this.adminGetRoleAssignment(args);
        case 'admin_create_role_assignment': return await this.adminCreateRoleAssignment(args);
        case 'admin_delete_role_assignment': return await this.adminDeleteRoleAssignment(args);
        case 'reports_usage_user': return await this.reportsUsageUser(args);
        case 'reports_usage_customer': return await this.reportsUsageCustomer(args);
        case 'reports_activity_user': return await this.reportsActivityUser(args);
        case 'reports_activity_entity': return await this.reportsActivityEntity(args);
        case 'licensing_list_assignments': return await this.licensingListAssignments(args);
        case 'licensing_get_assignment': return await this.licensingGetAssignment(args);
        case 'licensing_assign_license': return await this.licensingAssignLicense(args);
        case 'licensing_update_assignment': return await this.licensingUpdateAssignment(args);
        case 'licensing_delete_assignment': return await this.licensingDeleteAssignment(args);

        // Google Admin Console
        case 'admin_get_security_settings': return await this.adminGetSecuritySettings(args);
        case 'admin_update_security_settings': return await this.adminUpdateSecuritySettings(args);
        case 'admin_list_alerts': return await this.adminListAlerts(args);
        case 'admin_get_alert': return await this.adminGetAlert(args);
        case 'admin_delete_alert': return await this.adminDeleteAlert(args);
        case 'admin_list_tokens': return await this.adminListTokens(args);
        case 'admin_revoke_token': return await this.adminRevokeToken(args);
        case 'admin_list_asp': return await this.adminListAsp(args);
        case 'admin_delete_asp': return await this.adminDeleteAsp(args);
        case 'admin_get_customer_info': return await this.adminGetCustomerInfo(args);

        // Advanced Gmail
        case 'gmail_batch_modify': return await this.gmailBatchModify(args);
        case 'gmail_import_message': return await this.gmailImportMessage(args);
        case 'gmail_insert_message': return await this.gmailInsertMessage(args);
        case 'gmail_get_profile': return await this.gmailGetProfile(args);
        case 'gmail_stop_watch': return await this.gmailStopWatch(args);
        case 'gmail_watch': return await this.gmailWatch(args);

        // Advanced Drive
        case 'drive_export_file': return await this.driveExportFile(args);
        case 'drive_empty_trash': return await this.driveEmptyTrash(args);
        case 'drive_get_about': return await this.driveGetAbout(args);
        case 'drive_list_changes': return await this.driveListChanges(args);
        case 'drive_get_start_page_token': return await this.driveGetStartPageToken(args);
        case 'drive_watch_changes': return await this.driveWatchChanges(args);

        // Advanced Calendar
        case 'calendar_import_event': return await this.calendarImportEvent(args);
        case 'calendar_quick_add': return await this.calendarQuickAdd(args);
        case 'calendar_watch_events': return await this.calendarWatchEvents(args);

        // Advanced Sheets
        case 'sheets_batch_update': return await this.sheetsBatchUpdate(args);
        case 'sheets_append_values': return await this.sheetsAppendValues(args);
        case 'sheets_batch_clear': return await this.sheetsBatchClear(args);

        default: throw new Error('Unknown tool: ' + request.params.name);
      }
    });
  }

  private async gmailSend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const msg = `To: ${args.to}
Subject: ${args.subject}

${args.body}`;
    const encoded = Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = await this.gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } });
    return { content: [{ type: 'text', text: 'Sent. ID: ' + result.data.id }] };
  }

  private async gmailList(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.messages.list({ userId: 'me', maxResults: args.maxResults || 10, q: args.query });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.messages || [], null, 2) }] };
  }

  private async gmailGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.messages.get({ userId: 'me', id: args.messageId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async gmailDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.gmail.users.messages.delete({ userId: 'me', id: args.messageId });
    return { content: [{ type: 'text', text: 'Message deleted' }] };
  }

  private async gmailListLabels(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.labels.list({ userId: 'me' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.labels || [], null, 2) }] };
  }

  private async gmailCreateLabel(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.labels.create({ userId: 'me', requestBody: { name: args.name } });
    return { content: [{ type: 'text', text: 'Label created. ID: ' + result.data.id }] };
  }

  private async gmailDeleteLabel(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.gmail.users.labels.delete({ userId: 'me', id: args.labelId });
    return { content: [{ type: 'text', text: 'Label deleted' }] };
  }

  private async gmailListDrafts(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.drafts.list({ userId: 'me', maxResults: args.maxResults || 10 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.drafts || [], null, 2) }] };
  }

  private async gmailCreateDraft(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const msg = `To: ${args.to}
Subject: ${args.subject}

${args.body}`;
    const encoded = Buffer.from(msg).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = await this.gmail.users.drafts.create({ userId: 'me', requestBody: { message: { raw: encoded } } });
    return { content: [{ type: 'text', text: 'Draft created. ID: ' + result.data.id }] };
  }

  private async gmailGetProfile(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.getProfile({ userId: 'me' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async driveList(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.files.list({ pageSize: args.maxResults || 10, q: args.query, fields: 'files(id, name, mimeType)' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.files || [], null, 2) }] };
  }

  private async driveGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.files.get({ fileId: args.fileId, fields: '*' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async driveCreateFolder(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const metadata: any = { name: args.name, mimeType: 'application/vnd.google-apps.folder' };
    if (args.parentId) metadata.parents = [args.parentId];
    const result = await this.drive.files.create({ requestBody: metadata, fields: 'id' });
    return { content: [{ type: 'text', text: 'Folder created. ID: ' + result.data.id }] };
  }

  private async driveDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.drive.files.delete({ fileId: args.fileId });
    return { content: [{ type: 'text', text: 'File deleted' }] };
  }

  private async driveCopy(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.files.copy({ fileId: args.fileId, requestBody: { name: args.name }, fields: 'id' });
    return { content: [{ type: 'text', text: 'File copied. New ID: ' + result.data.id }] };
  }

  private async driveShare(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.drive.permissions.create({ fileId: args.fileId, requestBody: { type: 'user', role: args.role, emailAddress: args.email } });
    return { content: [{ type: 'text', text: 'File shared with ' + args.email }] };
  }

  private async driveListPerms(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.permissions.list({ fileId: args.fileId, fields: '*' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.permissions || [], null, 2) }] };
  }

  private async driveSearch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.files.list({ q: args.query, fields: 'files(id, name, mimeType)' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.files || [], null, 2) }] };
  }

  private async driveExport(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.files.export({ fileId: args.fileId, mimeType: args.mimeType });
    return { content: [{ type: 'text', text: 'Exported: ' + result.data }] };
  }

  private async driveGetContent(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.files.get({ fileId: args.fileId, alt: 'media' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data) }] };
  }

  private async calList(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.calendar.events.list({ calendarId: args.calendarId || 'primary', maxResults: args.maxResults || 10 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async calGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.calendar.events.get({ calendarId: args.calendarId || 'primary', eventId: args.eventId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async calCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const event = { summary: args.summary, start: { dateTime: args.start }, end: { dateTime: args.end } };
    const result = await this.calendar.events.insert({ calendarId: 'primary', requestBody: event });
    return { content: [{ type: 'text', text: 'Event created. ID: ' + result.data.id }] };
  }

  private async calUpdate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.calendar.events.patch({ calendarId: 'primary', eventId: args.eventId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Event updated' }] };
  }

  private async calDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.calendar.events.delete({ calendarId: 'primary', eventId: args.eventId });
    return { content: [{ type: 'text', text: 'Event deleted' }] };
  }

  private async sheetsGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.values.get({ spreadsheetId: args.spreadsheetId, range: args.range });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.values || [], null, 2) }] };
  }

  private async sheetsUpdate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.values.update({ spreadsheetId: args.spreadsheetId, range: args.range, valueInputOption: 'RAW', requestBody: { values: args.values } });
    return { content: [{ type: 'text', text: 'Updated ' + result.data.updatedCells + ' cells' }] };
  }

  private async sheetsAppend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.values.append({ spreadsheetId: args.spreadsheetId, range: args.range, valueInputOption: 'RAW', requestBody: { values: args.values } });
    return { content: [{ type: 'text', text: 'Appended ' + result.data.updates?.updatedCells + ' cells' }] };
  }

  private async sheetsCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.create({ requestBody: { properties: { title: args.title } } });
    return { content: [{ type: 'text', text: 'Created spreadsheet. ID: ' + result.data.spreadsheetId }] };
  }

  private async sheetsGetMeta(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.get({ spreadsheetId: args.spreadsheetId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async sheetsBatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.batchUpdate({ spreadsheetId: args.spreadsheetId, requestBody: { requests: args.requests } });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async sheetsClear(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.sheets.spreadsheets.values.clear({ spreadsheetId: args.spreadsheetId, range: args.range });
    return { content: [{ type: 'text', text: 'Values cleared' }] };
  }

  private async sheetsAddSheet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.sheets.spreadsheets.batchUpdate({ spreadsheetId: args.spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: args.title } } }] } });
    return { content: [{ type: 'text', text: 'Sheet added' }] };
  }

  private async sheetsDeleteSheet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.sheets.spreadsheets.batchUpdate({ spreadsheetId: args.spreadsheetId, requestBody: { requests: [{ deleteSheet: { sheetId: args.sheetId } }] } });
    return { content: [{ type: 'text', text: 'Sheet deleted' }] };
  }

  private async sheetsCopySheet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.sheets.spreadsheets.sheets.copyTo({ spreadsheetId: args.spreadsheetId, sheetId: args.sheetId, requestBody: { destinationSpreadsheetId: args.destinationSpreadsheetId } });
    return { content: [{ type: 'text', text: 'Sheet copied' }] };
  }

  private async docsGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.docs.documents.get({ documentId: args.documentId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async docsCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.docs.documents.create({ requestBody: { title: args.title } });
    return { content: [{ type: 'text', text: 'Document created. ID: ' + result.data.documentId }] };
  }

  private async docsInsert(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.docs.documents.batchUpdate({ documentId: args.documentId, requestBody: { requests: [{ insertText: { text: args.text, location: { index: args.index || 1 } } }] } });
    return { content: [{ type: 'text', text: 'Text inserted' }] };
  }

  private async docsDelete(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.docs.documents.batchUpdate({ documentId: args.documentId, requestBody: { requests: [{ deleteContentRange: { range: { startIndex: args.startIndex, endIndex: args.endIndex } } }] } });
    return { content: [{ type: 'text', text: 'Text deleted' }] };
  }

  private async docsReplace(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.docs.documents.batchUpdate({ documentId: args.documentId, requestBody: { requests: [{ replaceAllText: { containsText: { text: args.find, matchCase: false }, replaceText: args.replace } }] } });
    return { content: [{ type: 'text', text: 'Text replaced' }] };
  }

  private async adminListUsers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.users.list({ customer: 'my_customer', maxResults: args.maxResults || 100, query: args.query });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.users || [], null, 2) }] };
  }

  private async adminGetUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.users.get({ userKey: args.userKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const user = { primaryEmail: args.email, name: { givenName: args.firstName, familyName: args.lastName }, password: args.password };
    const result = await this.admin.users.insert({ requestBody: user });
    return { content: [{ type: 'text', text: 'User created. ID: ' + result.data.id }] };
  }

  private async adminUpdateUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.users.update({ userKey: args.userKey, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'User updated' }] };
  }

  private async adminDeleteUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.users.delete({ userKey: args.userKey });
    return { content: [{ type: 'text', text: 'User deleted' }] };
  }

  private async adminListAliases(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.users.aliases.list({ userKey: args.userKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.aliases || [], null, 2) }] };
  }

  private async adminAddAlias(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.users.aliases.insert({ userKey: args.userKey, requestBody: { alias: args.alias } });
    return { content: [{ type: 'text', text: 'Alias added: ' + args.alias }] };
  }

  private async adminDeleteAlias(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.users.aliases.delete({ userKey: args.userKey, alias: args.alias });
    return { content: [{ type: 'text', text: 'Alias deleted: ' + args.alias }] };
  }

  private async adminSuspend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.users.update({ userKey: args.userKey, requestBody: { suspended: true } });
    return { content: [{ type: 'text', text: 'User suspended' }] };
  }

  private async adminUnsuspend(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.users.update({ userKey: args.userKey, requestBody: { suspended: false } });
    return { content: [{ type: 'text', text: 'User unsuspended' }] };
  }

  private async adminListGroups(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.groups.list({ customer: 'my_customer', maxResults: args.maxResults || 100, query: args.query });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.groups || [], null, 2) }] };
  }

  private async adminGetGroup(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.groups.get({ groupKey: args.groupKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateGroup(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const group = { email: args.email, name: args.name, description: args.description };
    const result = await this.admin.groups.insert({ requestBody: group });
    return { content: [{ type: 'text', text: 'Group created. ID: ' + result.data.id }] };
  }

  private async adminUpdateGroup(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.groups.update({ groupKey: args.groupKey, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Group updated' }] };
  }

  private async adminDeleteGroup(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.groups.delete({ groupKey: args.groupKey });
    return { content: [{ type: 'text', text: 'Group deleted' }] };
  }

  private async adminListGroupMembers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.members.list({ groupKey: args.groupKey, maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.members || [], null, 2) }] };
  }

  private async adminAddGroupMember(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.members.insert({ groupKey: args.groupKey, requestBody: { email: args.email, role: args.role || 'MEMBER' } });
    return { content: [{ type: 'text', text: 'Member added to group' }] };
  }

  private async adminRemoveGroupMember(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.members.delete({ groupKey: args.groupKey, memberKey: args.memberKey });
    return { content: [{ type: 'text', text: 'Member removed from group' }] };
  }

  private async adminListGroupAliases(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.groups.aliases.list({ groupKey: args.groupKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.aliases || [], null, 2) }] };
  }

  private async adminAddGroupAlias(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.groups.aliases.insert({ groupKey: args.groupKey, requestBody: { alias: args.alias } });
    return { content: [{ type: 'text', text: 'Group alias added: ' + args.alias }] };
  }

  private async adminDeleteGroupAlias(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.groups.aliases.delete({ groupKey: args.groupKey, alias: args.alias });
    return { content: [{ type: 'text', text: 'Group alias deleted: ' + args.alias }] };
  }

  private async adminListOrgUnits(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.orgunits.list({ customerId: args.customerId || 'my_customer', orgUnitPath: args.orgUnitPath });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.organizationUnits || [], null, 2) }] };
  }

  private async adminGetOrgUnit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.orgunits.get({ customerId: args.customerId, orgUnitPath: args.orgUnitPath });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateOrgUnit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const orgUnit = { name: args.name, parentOrgUnitPath: args.parentOrgUnitPath || '/' };
    const result = await this.admin.orgunits.insert({ customerId: args.customerId, requestBody: orgUnit });
    return { content: [{ type: 'text', text: 'Org unit created: ' + result.data.orgUnitPath }] };
  }

  private async adminUpdateOrgUnit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.orgunits.update({ customerId: args.customerId, orgUnitPath: args.orgUnitPath, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Org unit updated' }] };
  }

  private async adminDeleteOrgUnit(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.orgunits.delete({ customerId: args.customerId, orgUnitPath: args.orgUnitPath });
    return { content: [{ type: 'text', text: 'Org unit deleted' }] };
  }

  private async adminListDomains(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.domains.list({ customer: args.customerId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.domains || [], null, 2) }] };
  }

  private async adminGetDomain(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.domains.get({ customer: args.customerId, domainName: args.domainName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateDomain(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.domains.insert({ customer: args.customerId, requestBody: { domainName: args.domainName } });
    return { content: [{ type: 'text', text: 'Domain created: ' + args.domainName }] };
  }

  private async adminDeleteDomain(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.domains.delete({ customer: args.customerId, domainName: args.domainName });
    return { content: [{ type: 'text', text: 'Domain deleted: ' + args.domainName }] };
  }

  private async adminListDomainAliases(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.domainAliases.list({ customer: args.customerId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.domainAliases || [], null, 2) }] };
  }

  private async adminListRoles(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.roles.list({ customer: args.customerId, maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async adminGetRole(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.roles.get({ customer: args.customerId, roleId: args.roleId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateRole(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const role = { roleName: args.roleName, rolePrivileges: args.rolePrivileges || [] };
    const result = await this.admin.roles.insert({ customer: args.customerId, requestBody: role });
    return { content: [{ type: 'text', text: 'Role created. ID: ' + result.data.roleId }] };
  }

  private async adminUpdateRole(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.roles.update({ customer: args.customerId, roleId: args.roleId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Role updated' }] };
  }

  private async adminDeleteRole(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.roles.delete({ customer: args.customerId, roleId: args.roleId });
    return { content: [{ type: 'text', text: 'Role deleted' }] };
  }

  private async slidesGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.slides.presentations.get({ presentationId: args.presentationId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async slidesCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.slides.presentations.create({ requestBody: { title: args.title } });
    return { content: [{ type: 'text', text: 'Presentation created. ID: ' + result.data.presentationId }] };
  }

  private async slidesBatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests: args.requests } });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async slidesCreateSlide(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ createSlide: { insertionIndex: args.insertionIndex || 0 } }];
    await this.slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Slide created' }] };
  }

  private async slidesDeleteSlide(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ deleteObject: { objectId: args.objectId } }];
    await this.slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Slide deleted' }] };
  }

  private async slidesCreateShape(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ createShape: { shapeType: args.shapeType, elementProperties: { pageObjectId: args.pageId } } }];
    await this.slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Shape created' }] };
  }

  private async slidesCreateTextbox(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const objectId = 'textbox_' + Date.now();
    const requests = [
      { createShape: { objectId, shapeType: 'TEXT_BOX', elementProperties: { pageObjectId: args.pageId } } },
      { insertText: { objectId, text: args.text } }
    ];
    await this.slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Text box created' }] };
  }

  private async slidesInsertText(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ insertText: { objectId: args.objectId, text: args.text } }];
    await this.slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Text inserted' }] };
  }

  private async slidesDeleteText(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ deleteText: { objectId: args.objectId, textRange: { startIndex: args.startIndex, endIndex: args.endIndex } } }];
    await this.slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Text deleted' }] };
  }

  private async slidesCreateImage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const requests = [{ createImage: { url: args.url, elementProperties: { pageObjectId: args.pageId } } }];
    await this.slides.presentations.batchUpdate({ presentationId: args.presentationId, requestBody: { requests } });
    return { content: [{ type: 'text', text: 'Image created' }] };
  }

  private async tasksListTasklists(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.tasks.tasklists.list({ maxResults: args.maxResults || 10 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async tasksGetTasklist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.tasks.tasklists.get({ tasklist: args.tasklistId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async tasksCreateTasklist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.tasks.tasklists.insert({ requestBody: { title: args.title } });
    return { content: [{ type: 'text', text: 'Task list created. ID: ' + result.data.id }] };
  }

  private async tasksUpdateTasklist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.tasks.tasklists.update({ tasklist: args.tasklistId, requestBody: { title: args.title } });
    return { content: [{ type: 'text', text: 'Task list updated' }] };
  }

  private async tasksDeleteTasklist(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.tasks.tasklists.delete({ tasklist: args.tasklistId });
    return { content: [{ type: 'text', text: 'Task list deleted' }] };
  }

  private async tasksListTasks(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.tasks.tasks.list({ tasklist: args.tasklistId, maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async tasksGetTask(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.tasks.tasks.get({ tasklist: args.tasklistId, task: args.taskId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async tasksCreateTask(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const task: any = { title: args.title };
    if (args.notes) task.notes = args.notes;
    if (args.due) task.due = args.due;
    const result = await this.tasks.tasks.insert({ tasklist: args.tasklistId, requestBody: task });
    return { content: [{ type: 'text', text: 'Task created. ID: ' + result.data.id }] };
  }

  private async tasksUpdateTask(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.tasks.tasks.update({ tasklist: args.tasklistId, task: args.taskId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Task updated' }] };
  }

  private async tasksDeleteTask(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.tasks.tasks.delete({ tasklist: args.tasklistId, task: args.taskId });
    return { content: [{ type: 'text', text: 'Task deleted' }] };
  }

  private async tasksClearCompleted(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.tasks.tasks.clear({ tasklist: args.tasklistId });
    return { content: [{ type: 'text', text: 'Completed tasks cleared' }] };
  }

  private async peopleGetPerson(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.people.people.get({ resourceName: args.resourceName, personFields: 'names,emailAddresses,phoneNumbers' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async peopleListConnections(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.people.people.connections.list({ resourceName: 'people/me', pageSize: args.pageSize || 100, personFields: 'names,emailAddresses' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.connections || [], null, 2) }] };
  }

  private async peopleCreateContact(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const contact: any = {};
    if (args.names) contact.names = args.names;
    if (args.emailAddresses) contact.emailAddresses = args.emailAddresses;
    if (args.phoneNumbers) contact.phoneNumbers = args.phoneNumbers;
    const result = await this.people.people.createContact({ requestBody: contact });
    return { content: [{ type: 'text', text: 'Contact created. Resource: ' + result.data.resourceName }] };
  }

  private async peopleUpdateContact(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.people.people.updateContact({ resourceName: args.resourceName, updatePersonFields: 'names,emailAddresses,phoneNumbers', requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Contact updated' }] };
  }

  private async peopleDeleteContact(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.people.people.deleteContact({ resourceName: args.resourceName });
    return { content: [{ type: 'text', text: 'Contact deleted' }] };
  }

  private async formsGet(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.forms.forms.get({ formId: args.formId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async formsCreate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.forms.forms.create({ requestBody: { info: { title: args.title } } });
    return { content: [{ type: 'text', text: 'Form created. ID: ' + result.data.formId }] };
  }

  private async formsBatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.forms.forms.batchUpdate({ formId: args.formId, requestBody: { requests: args.requests } });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async formsListResponses(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.forms.forms.responses.list({ formId: args.formId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.responses || [], null, 2) }] };
  }

  private async formsGetResponse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.forms.forms.responses.get({ formId: args.formId, responseId: args.responseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async classroomListCourses(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.classroom.courses.list({ pageSize: args.pageSize || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.courses || [], null, 2) }] };
  }

  private async classroomGetCourse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.classroom.courses.get({ id: args.courseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async classroomCreateCourse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const course: any = { name: args.name };
    if (args.section) course.section = args.section;
    if (args.ownerId) course.ownerId = args.ownerId;
    const result = await this.classroom.courses.create({ requestBody: course });
    return { content: [{ type: 'text', text: 'Course created. ID: ' + result.data.id }] };
  }

  private async classroomUpdateCourse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.classroom.courses.update({ id: args.courseId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Course updated' }] };
  }

  private async classroomDeleteCourse(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.classroom.courses.delete({ id: args.courseId });
    return { content: [{ type: 'text', text: 'Course deleted' }] };
  }

  private async classroomListStudents(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.classroom.courses.students.list({ courseId: args.courseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.students || [], null, 2) }] };
  }

  private async classroomAddStudent(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.classroom.courses.students.create({ courseId: args.courseId, requestBody: { userId: args.userId } });
    return { content: [{ type: 'text', text: 'Student added to course' }] };
  }

  private async classroomRemoveStudent(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.classroom.courses.students.delete({ courseId: args.courseId, userId: args.userId });
    return { content: [{ type: 'text', text: 'Student removed from course' }] };
  }

  private async classroomListTeachers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.classroom.courses.teachers.list({ courseId: args.courseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.teachers || [], null, 2) }] };
  }

  private async classroomAddTeacher(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.classroom.courses.teachers.create({ courseId: args.courseId, requestBody: { userId: args.userId } });
    return { content: [{ type: 'text', text: 'Teacher added to course' }] };
  }

  private async classroomListCoursework(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.classroom.courses.courseWork.list({ courseId: args.courseId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.courseWork || [], null, 2) }] };
  }

  private async classroomCreateCoursework(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const coursework: any = { title: args.title, workType: 'ASSIGNMENT' };
    if (args.description) coursework.description = args.description;
    const result = await this.classroom.courses.courseWork.create({ courseId: args.courseId, requestBody: coursework });
    return { content: [{ type: 'text', text: 'Coursework created. ID: ' + result.data.id }] };
  }

  private async classroomListSubmissions(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.classroom.courses.courseWork.studentSubmissions.list({ courseId: args.courseId, courseWorkId: args.courseWorkId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.studentSubmissions || [], null, 2) }] };
  }

  private async chatListSpaces(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.chat.spaces.list({ pageSize: args.pageSize || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.spaces || [], null, 2) }] };
  }

  private async chatGetSpace(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.chat.spaces.get({ name: args.spaceName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async chatCreateSpace(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.chat.spaces.create({ requestBody: { displayName: args.displayName, spaceType: 'SPACE' } });
    return { content: [{ type: 'text', text: 'Space created: ' + result.data.name }] };
  }

  private async chatListMessages(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.chat.spaces.messages.list({ parent: args.spaceName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.messages || [], null, 2) }] };
  }

  private async chatCreateMessage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.chat.spaces.messages.create({ parent: args.spaceName, requestBody: { text: args.text } });
    return { content: [{ type: 'text', text: 'Message created: ' + result.data.name }] };
  }

  private async chatDeleteMessage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.chat.spaces.messages.delete({ name: args.messageName });
    return { content: [{ type: 'text', text: 'Message deleted' }] };
  }

  private async chatListMembers(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.chat.spaces.members.list({ parent: args.spaceName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.memberships || [], null, 2) }] };
  }

  private async adminListMobileDevices(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.mobiledevices.list({ customerId: args.customerId || 'my_customer', maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.mobiledevices || [], null, 2) }] };
  }

  private async adminGetMobileDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.mobiledevices.get({ customerId: args.customerId, resourceId: args.resourceId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminDeleteMobileDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.mobiledevices.delete({ customerId: args.customerId, resourceId: args.resourceId });
    return { content: [{ type: 'text', text: 'Mobile device deleted' }] };
  }

  private async adminActionMobileDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.mobiledevices.action({ customerId: args.customerId, resourceId: args.resourceId, requestBody: { action: args.action } });
    return { content: [{ type: 'text', text: 'Action performed on mobile device: ' + args.action }] };
  }

  private async adminListChromeDevices(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.chromeosdevices.list({ customerId: args.customerId || 'my_customer', maxResults: args.maxResults || 100 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.chromeosdevices || [], null, 2) }] };
  }

  private async adminGetChromeDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.chromeosdevices.get({ customerId: args.customerId, deviceId: args.deviceId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminUpdateChromeDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.chromeosdevices.update({ customerId: args.customerId, deviceId: args.deviceId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Chrome device updated' }] };
  }

  private async adminActionChromeDevice(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.chromeosdevices.action({ customerId: args.customerId, resourceId: args.deviceId, requestBody: { action: args.action } });
    return { content: [{ type: 'text', text: 'Action performed on Chrome device: ' + args.action }] };
  }

  private async adminListCalendarResources(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.resources.calendars.list({ customer: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async adminGetCalendarResource(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.resources.calendars.get({ customer: args.customer, calendarResourceId: args.calendarResourceId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateCalendarResource(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const resource = { resourceId: args.resourceId, resourceName: args.resourceName };
    const result = await this.admin.resources.calendars.insert({ customer: args.customer, requestBody: resource });
    return { content: [{ type: 'text', text: 'Calendar resource created: ' + result.data.resourceId }] };
  }

  private async adminUpdateCalendarResource(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.resources.calendars.update({ customer: args.customer, calendarResourceId: args.calendarResourceId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Calendar resource updated' }] };
  }

  private async adminDeleteCalendarResource(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.resources.calendars.delete({ customer: args.customer, calendarResourceId: args.calendarResourceId });
    return { content: [{ type: 'text', text: 'Calendar resource deleted' }] };
  }

  private async adminListBuildings(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.resources.buildings.list({ customer: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.buildings || [], null, 2) }] };
  }

  private async adminGetBuilding(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.resources.buildings.get({ customer: args.customer, buildingId: args.buildingId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateBuilding(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const building = { buildingId: args.buildingId, buildingName: args.buildingName };
    const result = await this.admin.resources.buildings.insert({ customer: args.customer, requestBody: building });
    return { content: [{ type: 'text', text: 'Building created: ' + result.data.buildingId }] };
  }

  private async adminUpdateBuilding(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.resources.buildings.update({ customer: args.customer, buildingId: args.buildingId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Building updated' }] };
  }

  private async adminDeleteBuilding(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.resources.buildings.delete({ customer: args.customer, buildingId: args.buildingId });
    return { content: [{ type: 'text', text: 'Building deleted' }] };
  }

  private async adminListFeatures(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.resources.features.list({ customer: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.features || [], null, 2) }] };
  }

  private async adminCreateFeature(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.resources.features.insert({ customer: args.customer, requestBody: { name: args.name } });
    return { content: [{ type: 'text', text: 'Feature created: ' + result.data.name }] };
  }

  private async adminDeleteFeature(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.resources.features.delete({ customer: args.customer, featureKey: args.featureKey });
    return { content: [{ type: 'text', text: 'Feature deleted' }] };
  }

  private async adminListSchemas(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.schemas.list({ customerId: args.customerId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.schemas || [], null, 2) }] };
  }

  private async adminGetSchema(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.schemas.get({ customerId: args.customerId, schemaKey: args.schemaKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateSchema(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const schema = { schemaName: args.schemaName, fields: args.fields };
    const result = await this.admin.schemas.insert({ customerId: args.customerId, requestBody: schema });
    return { content: [{ type: 'text', text: 'Schema created: ' + result.data.schemaId }] };
  }

  private async adminUpdateSchema(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.schemas.update({ customerId: args.customerId, schemaKey: args.schemaKey, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'Schema updated' }] };
  }

  private async adminDeleteSchema(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.schemas.delete({ customerId: args.customerId, schemaKey: args.schemaKey });
    return { content: [{ type: 'text', text: 'Schema deleted' }] };
  }

  private async adminListTokens(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.tokens.list({ userKey: args.userKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async adminGetToken(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.tokens.get({ userKey: args.userKey, clientId: args.clientId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminDeleteToken(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.tokens.delete({ userKey: args.userKey, clientId: args.clientId });
    return { content: [{ type: 'text', text: 'Token deleted' }] };
  }

  private async adminListAsp(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.asps.list({ userKey: args.userKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async adminGetAsp(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.asps.get({ userKey: args.userKey, codeId: args.codeId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminDeleteAsp(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.asps.delete({ userKey: args.userKey, codeId: args.codeId });
    return { content: [{ type: 'text', text: 'App-specific password deleted' }] };
  }

  private async adminListRoleAssignments(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.roleAssignments.list({ customer: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async adminGetRoleAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.roleAssignments.get({ customer: args.customer, roleAssignmentId: args.roleAssignmentId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminCreateRoleAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const assignment = { roleId: args.roleId, assignedTo: args.assignedTo };
    const result = await this.admin.roleAssignments.insert({ customer: args.customer, requestBody: assignment });
    return { content: [{ type: 'text', text: 'Role assignment created: ' + result.data.roleAssignmentId }] };
  }

  private async adminDeleteRoleAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.roleAssignments.delete({ customer: args.customer, roleAssignmentId: args.roleAssignmentId });
    return { content: [{ type: 'text', text: 'Role assignment deleted' }] };
  }

  private async reportsUsageUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.reports.userUsageReport.get({ userKey: args.userKey, date: args.date });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async reportsUsageCustomer(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.reports.customerUsageReports.get({ date: args.date, parameters: args.parameters });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async reportsActivityUser(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.reports.activities.list({ userKey: args.userKey, applicationName: args.applicationName });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async reportsActivityEntity(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.reports.activities.list({ applicationName: args.applicationName, customerId: args.entityType === 'customer' ? args.entityKey : undefined, userKey: args.entityType === 'user' ? args.entityKey : undefined });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async licensingListAssignments(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.licensing.licenseAssignments.listForProductAndSku({ productId: args.productId, skuId: args.skuId, customerId: 'my_customer' });
    return { content: [{ type: 'text', text: JSON.stringify(result.data.items || [], null, 2) }] };
  }

  private async licensingGetAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.licensing.licenseAssignments.get({ productId: args.productId, skuId: args.skuId, userId: args.userId });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async licensingAssignLicense(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.licensing.licenseAssignments.insert({ productId: args.productId, skuId: args.skuId, requestBody: { userId: args.userId } });
    return { content: [{ type: 'text', text: 'License assigned to user: ' + args.userId }] };
  }

  private async licensingUpdateAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.licensing.licenseAssignments.update({ productId: args.productId, skuId: args.skuId, userId: args.userId, requestBody: args.updates });
    return { content: [{ type: 'text', text: 'License assignment updated' }] };
  }

  private async licensingDeleteAssignment(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.licensing.licenseAssignments.delete({ productId: args.productId, skuId: args.skuId, userId: args.userId });
    return { content: [{ type: 'text', text: 'License assignment deleted' }] };
  }

  // GOOGLE ADMIN CONSOLE
  private async adminGetSecuritySettings(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.customers.get({ customerKey: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminUpdateSecuritySettings(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.customers.patch({ customerKey: args.customer, requestBody: args.settings });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async adminListAlerts(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    // Note: Requires Alert Center API
    return { content: [{ type: 'text', text: 'Alert Center API integration required. Use Google Admin Console for alerts.' }] };
  }

  private async adminGetAlert(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    return { content: [{ type: 'text', text: 'Alert Center API integration required. Use Google Admin Console for alerts.' }] };
  }

  private async adminDeleteAlert(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    return { content: [{ type: 'text', text: 'Alert Center API integration required. Use Google Admin Console for alerts.' }] };
  }

  private async adminRevokeToken(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.admin.tokens.delete({ userKey: args.userKey, clientId: args.clientId });
    return { content: [{ type: 'text', text: 'Token revoked successfully' }] };
  }

  private async adminGetCustomerInfo(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.admin.customers.get({ customerKey: args.customer });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  // ADVANCED GMAIL
  private async gmailBatchModify(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.messages.batchModify({
      userId: args.userId || 'me',
      requestBody: {
        ids: args.ids,
        addLabelIds: args.addLabelIds,
        removeLabelIds: args.removeLabelIds
      }
    });
    return { content: [{ type: 'text', text: 'Messages modified successfully' }] };
  }

  private async gmailImportMessage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.messages.import({
      userId: args.userId || 'me',
      requestBody: args.message,
      internalDateSource: args.internalDateSource
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async gmailInsertMessage(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.messages.insert({
      userId: args.userId || 'me',
      requestBody: args.message
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async gmailStopWatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.gmail.users.stop({ userId: args.userId || 'me' });
    return { content: [{ type: 'text', text: 'Push notifications stopped' }] };
  }

  private async gmailWatch(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.gmail.users.watch({
      userId: args.userId || 'me',
      requestBody: {
        labelIds: args.labelIds,
        topicName: args.topicName
      }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  // ADVANCED DRIVE
  private async driveExportFile(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.files.export({
      fileId: args.fileId,
      mimeType: args.mimeType
    });
    return { content: [{ type: 'text', text: 'File exported successfully' }] };
  }

  private async driveEmptyTrash(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    await this.drive.files.emptyTrash({});
    return { content: [{ type: 'text', text: 'Trash emptied successfully' }] };
  }

  private async driveGetAbout(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.about.get({
      fields: args.fields || 'storageQuota,user'
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async driveListChanges(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.changes.list({
      pageToken: args.pageToken,
      includeRemoved: args.includeRemoved
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async driveGetStartPageToken(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.changes.getStartPageToken({});
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async driveWatchChanges(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.drive.changes.watch({
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
  private async calendarImportEvent(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.calendar.events.import({
      calendarId: args.calendarId,
      requestBody: args.event
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async calendarQuickAdd(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.calendar.events.quickAdd({
      calendarId: args.calendarId,
      text: args.text
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async calendarWatchEvents(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.calendar.events.watch({
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
  private async sheetsBatchUpdate(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: args.spreadsheetId,
      requestBody: { requests: args.requests }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async sheetsAppendValues(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.values.append({
      spreadsheetId: args.spreadsheetId,
      range: args.range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: args.values }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  private async sheetsBatchClear(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    const result = await this.sheets.spreadsheets.values.batchClear({
      spreadsheetId: args.spreadsheetId,
      requestBody: { ranges: args.ranges }
    });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/google-workspace-mcp server running on stdio');
  }
}

const server = new GoogleWorkspaceMCP();
server.run().catch(console.error);

