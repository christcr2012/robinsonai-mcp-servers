# Google Workspace MCP Server - Implementation Plan

## Overview

A comprehensive MCP server for Google Workspace integration, providing AI agents with powerful tools to interact with Gmail, Google Drive, Calendar, Sheets, Docs, and more.

## Authentication Strategy

### OAuth 2.0 Setup
- Use Google Cloud Console to create OAuth credentials
- Required scopes:
  - Gmail: `https://www.googleapis.com/auth/gmail.modify`
  - Drive: `https://www.googleapis.com/auth/drive`
  - Calendar: `https://www.googleapis.com/auth/calendar`
  - Sheets: `https://www.googleapis.com/auth/spreadsheets`
  - Docs: `https://www.googleapis.com/auth/documents`

### Configuration
```typescript
// Accept credentials path as argument
const CREDENTIALS_PATH = process.argv[2] || process.env.GOOGLE_CREDENTIALS_PATH;
const TOKEN_PATH = process.argv[3] || process.env.GOOGLE_TOKEN_PATH;
```

## Tool Categories and Implementation

### 1. Gmail Tools (20+ tools)

#### Message Management
- `gmail_list_messages` - List messages with filters (unread, from, to, subject, date range)
- `gmail_get_message` - Get full message details including body and attachments
- `gmail_send_message` - Send email with optional attachments
- `gmail_reply_to_message` - Reply to a message
- `gmail_forward_message` - Forward a message
- `gmail_delete_message` - Delete a message
- `gmail_trash_message` - Move message to trash
- `gmail_mark_as_read` - Mark message(s) as read
- `gmail_mark_as_unread` - Mark message(s) as unread
- `gmail_star_message` - Star a message
- `gmail_unstar_message` - Unstar a message

#### Label Management
- `gmail_list_labels` - List all labels
- `gmail_create_label` - Create a new label
- `gmail_delete_label` - Delete a label
- `gmail_add_label` - Add label to message(s)
- `gmail_remove_label` - Remove label from message(s)

#### Search and Filters
- `gmail_search_messages` - Advanced search with Gmail query syntax
- `gmail_list_threads` - List email threads
- `gmail_get_thread` - Get full thread details

#### Attachments
- `gmail_list_attachments` - List attachments in a message
- `gmail_get_attachment` - Download attachment
- `gmail_send_with_attachment` - Send email with file attachments

### 2. Google Drive Tools (25+ tools)

#### File Management
- `drive_list_files` - List files with filters (name, type, parent, modified date)
- `drive_get_file` - Get file metadata
- `drive_download_file` - Download file content
- `drive_upload_file` - Upload a file
- `drive_create_file` - Create a new file
- `drive_update_file` - Update file content
- `drive_delete_file` - Delete a file
- `drive_trash_file` - Move file to trash
- `drive_restore_file` - Restore from trash
- `drive_copy_file` - Copy a file
- `drive_move_file` - Move file to different folder

#### Folder Management
- `drive_list_folders` - List folders
- `drive_create_folder` - Create a new folder
- `drive_delete_folder` - Delete a folder
- `drive_get_folder_contents` - List contents of a folder

#### Sharing and Permissions
- `drive_share_file` - Share file with users/groups
- `drive_list_permissions` - List file permissions
- `drive_add_permission` - Add permission to file
- `drive_remove_permission` - Remove permission from file
- `drive_update_permission` - Update permission level

#### Search
- `drive_search_files` - Advanced search with Drive query syntax
- `drive_search_by_content` - Full-text search in file contents

#### Comments and Revisions
- `drive_list_comments` - List comments on a file
- `drive_add_comment` - Add comment to file
- `drive_list_revisions` - List file revision history
- `drive_get_revision` - Get specific revision

### 3. Google Calendar Tools (15+ tools)

#### Event Management
- `calendar_list_events` - List events with date range and filters
- `calendar_get_event` - Get event details
- `calendar_create_event` - Create a new event
- `calendar_update_event` - Update an event
- `calendar_delete_event` - Delete an event
- `calendar_quick_add` - Quick add event from natural language

#### Calendar Management
- `calendar_list_calendars` - List all calendars
- `calendar_get_calendar` - Get calendar details
- `calendar_create_calendar` - Create a new calendar
- `calendar_delete_calendar` - Delete a calendar

#### Attendees and Invitations
- `calendar_add_attendee` - Add attendee to event
- `calendar_remove_attendee` - Remove attendee from event
- `calendar_send_invitation` - Send event invitation

#### Availability
- `calendar_check_availability` - Check free/busy status
- `calendar_find_meeting_time` - Find available meeting slots

### 4. Google Sheets Tools (20+ tools)

#### Spreadsheet Management
- `sheets_list_spreadsheets` - List spreadsheets
- `sheets_get_spreadsheet` - Get spreadsheet metadata
- `sheets_create_spreadsheet` - Create a new spreadsheet
- `sheets_delete_spreadsheet` - Delete a spreadsheet

#### Sheet Operations
- `sheets_list_sheets` - List sheets in a spreadsheet
- `sheets_create_sheet` - Add a new sheet
- `sheets_delete_sheet` - Delete a sheet
- `sheets_rename_sheet` - Rename a sheet
- `sheets_copy_sheet` - Copy sheet to another spreadsheet

#### Data Operations
- `sheets_get_values` - Get cell values from range
- `sheets_update_values` - Update cell values
- `sheets_append_values` - Append rows to sheet
- `sheets_clear_values` - Clear range of cells
- `sheets_batch_update` - Batch update multiple ranges

#### Formatting
- `sheets_format_cells` - Format cells (bold, color, borders, etc.)
- `sheets_merge_cells` - Merge cells
- `sheets_unmerge_cells` - Unmerge cells
- `sheets_set_column_width` - Set column width
- `sheets_set_row_height` - Set row height

#### Advanced Features
- `sheets_create_chart` - Create a chart
- `sheets_add_formula` - Add formula to cells
- `sheets_sort_range` - Sort data range
- `sheets_filter_data` - Apply filters

### 5. Google Docs Tools (15+ tools)

#### Document Management
- `docs_list_documents` - List documents
- `docs_get_document` - Get document content
- `docs_create_document` - Create a new document
- `docs_delete_document` - Delete a document

#### Content Operations
- `docs_insert_text` - Insert text at position
- `docs_delete_text` - Delete text range
- `docs_replace_text` - Find and replace text
- `docs_append_text` - Append text to end

#### Formatting
- `docs_format_text` - Format text (bold, italic, font, size, color)
- `docs_insert_image` - Insert image
- `docs_insert_table` - Insert table
- `docs_insert_page_break` - Insert page break

#### Advanced Features
- `docs_create_heading` - Create heading
- `docs_create_list` - Create bulleted/numbered list
- `docs_add_comment` - Add comment to text range

## Implementation Structure

### Package Structure
```
packages/google-workspace-mcp/
├── src/
│   ├── index.ts              # Main server class
│   ├── auth.ts               # OAuth authentication
│   ├── gmail.ts              # Gmail tools
│   ├── drive.ts              # Drive tools
│   ├── calendar.ts           # Calendar tools
│   ├── sheets.ts             # Sheets tools
│   ├── docs.ts               # Docs tools
│   └── types.ts              # TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

### Dependencies
```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "googleapis": "^140.0.0",
    "google-auth-library": "^9.0.0"
  }
}
```

### Main Server Class Pattern
```typescript
class GoogleWorkspaceMCP {
  private server: Server;
  private gmail: GmailTools;
  private drive: DriveTools;
  private calendar: CalendarTools;
  private sheets: SheetsTools;
  private docs: DocsTools;

  constructor() {
    // Initialize auth
    const auth = this.initializeAuth();
    
    // Initialize service tools
    this.gmail = new GmailTools(auth);
    this.drive = new DriveTools(auth);
    this.calendar = new CalendarTools(auth);
    this.sheets = new SheetsTools(auth);
    this.docs = new DocsTools(auth);
    
    // Setup MCP server
    this.server = new Server({
      name: "@robinsonai/google-workspace-mcp",
      version: "1.0.0",
    }, {
      capabilities: { tools: {} },
    });
    
    this.setupHandlers();
  }
}
```

## Usage Examples

### MCP Config
```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": [
        "google-workspace-mcp",
        "/path/to/credentials.json",
        "/path/to/token.json"
      ]
    }
  }
}
```

### Example Tool Calls

**Send Email:**
```typescript
{
  "name": "gmail_send_message",
  "arguments": {
    "to": "user@example.com",
    "subject": "Meeting Follow-up",
    "body": "Thanks for the meeting today...",
    "cc": ["manager@example.com"],
    "attachments": ["/path/to/file.pdf"]
  }
}
```

**Create Calendar Event:**
```typescript
{
  "name": "calendar_create_event",
  "arguments": {
    "summary": "Team Standup",
    "start": "2024-01-15T10:00:00-08:00",
    "end": "2024-01-15T10:30:00-08:00",
    "attendees": ["team@example.com"],
    "description": "Daily standup meeting"
  }
}
```

**Update Spreadsheet:**
```typescript
{
  "name": "sheets_update_values",
  "arguments": {
    "spreadsheetId": "abc123",
    "range": "Sheet1!A1:B2",
    "values": [
      ["Name", "Email"],
      ["John Doe", "john@example.com"]
    ]
  }
}
```

## Security Considerations

1. **Credential Storage:**
   - Store credentials outside repository
   - Use environment variables or secure config files
   - Never commit credentials to git

2. **Token Refresh:**
   - Implement automatic token refresh
   - Handle expired tokens gracefully

3. **Scope Minimization:**
   - Only request necessary scopes
   - Document why each scope is needed

4. **Rate Limiting:**
   - Implement rate limiting to avoid API quota issues
   - Add retry logic with exponential backoff

## Testing Strategy

1. **Unit Tests:**
   - Test each tool handler independently
   - Mock Google API responses

2. **Integration Tests:**
   - Test with real Google Workspace account
   - Use test data that can be safely modified

3. **Manual Testing:**
   - Test through Augment Code
   - Verify all tools work end-to-end

## Estimated Tool Count

- Gmail: 21 tools
- Drive: 26 tools
- Calendar: 15 tools
- Sheets: 23 tools
- Docs: 15 tools

**Total: 100+ tools**

This would make it the most comprehensive Robinson AI MCP server!

## Implementation Priority

### Phase 1 (MVP - 30 tools)
- Gmail: send, list, get, search (5 tools)
- Drive: list, upload, download, share (5 tools)
- Calendar: list, create, update events (5 tools)
- Sheets: get, update, append values (5 tools)
- Docs: get, create, insert text (5 tools)
- Auth setup and core infrastructure (5 tools)

### Phase 2 (Extended - 40 tools)
- Gmail: labels, attachments, advanced search
- Drive: folders, permissions, comments
- Calendar: attendees, availability
- Sheets: formatting, formulas
- Docs: formatting, images, tables

### Phase 3 (Complete - 100+ tools)
- All remaining tools
- Advanced features
- Batch operations
- Optimization and polish

