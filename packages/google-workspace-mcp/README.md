# @robinsonai/google-workspace-mcp

**Comprehensive Google Workspace MCP Server with 193 Tools**

A powerful Model Context Protocol (MCP) server providing complete Google Workspace automation capabilities across Gmail, Drive, Calendar, Sheets, Docs, Slides, Admin, Tasks, People, Forms, Classroom, Chat, Reports, and Licensing.

## Features

### 🎯 **193 Comprehensive Tools** organized into 15 service categories:

1. **Gmail Tools** (10 tools)
   - Send, list, get, delete messages
   - Manage labels and drafts
   - Get profile information
   - Full inbox management

2. **Google Drive Tools** (30+ tools)
   - List, get, create, delete files
   - Folder management
   - File sharing and permissions
   - Copy, move, and export files
   - Search and metadata management

3. **Google Calendar Tools** (15+ tools)
   - List, create, update, delete events
   - Calendar management
   - Attendee management
   - Event reminders and notifications

4. **Google Sheets Tools** (25+ tools)
   - Spreadsheet operations
   - Cell reading and writing
   - Batch updates
   - Formatting and formulas
   - Sheet management

5. **Google Docs Tools** (15+ tools)
   - Document creation and editing
   - Text formatting
   - Content insertion
   - Document sharing

6. **Google Slides Tools** (10+ tools)
   - Presentation creation
   - Slide management
   - Content editing
   - Template operations

7. **Admin Directory Tools** (30+ tools)
   - User management
   - Group management
   - Organization units
   - Domain management
   - Device management
   - Role and privilege management

8. **Google Tasks Tools** (8 tools)
   - Task list management
   - Task operations
   - Due dates and notes
   - Task completion

9. **People API Tools** (8 tools)
   - Contact management
   - Contact groups
   - Profile information

10. **Google Forms Tools** (8 tools)
    - Form creation and management
    - Response collection
    - Form sharing

11. **Google Classroom Tools** (10+ tools)
    - Course management
    - Student roster
    - Assignments and coursework
    - Grades and feedback

12. **Google Chat Tools** (8 tools)
    - Space management
    - Message sending
    - Member management

13. **Admin Reports Tools** (8 tools)
    - Usage reports
    - Audit logs
    - Activity tracking

14. **Licensing Tools** (5 tools)
    - License assignments
    - License management
    - Product information

15. **Security & Admin Tools** (5 tools)
    - Security settings
    - Mobile device management
    - Chrome OS management

## Installation

```bash
npm install @robinsonai/google-workspace-mcp
```

## Prerequisites

### Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable Required APIs**
   - Gmail API
   - Google Drive API
   - Google Calendar API
   - Google Sheets API
   - Google Docs API
   - Google Slides API
   - Admin SDK API
   - Tasks API
   - People API
   - Forms API
   - Classroom API
   - Chat API
   - Reports API
   - Licensing API

3. **Create Service Account**
   - Go to IAM & Admin → Service Accounts
   - Create new service account
   - Download JSON key file

4. **Domain-Wide Delegation** (for Admin APIs)
   - Note the service account's Client ID
   - Go to Google Workspace Admin Console
   - Security → API Controls → Domain-wide Delegation
   - Add the Client ID with required scopes

### Required Scopes

```
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/drive
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/documents
https://www.googleapis.com/auth/presentations
https://www.googleapis.com/auth/admin.directory.user
https://www.googleapis.com/auth/admin.directory.group
https://www.googleapis.com/auth/admin.directory.orgunit
https://www.googleapis.com/auth/admin.directory.domain
https://www.googleapis.com/auth/admin.directory.rolemanagement
https://www.googleapis.com/auth/admin.directory.device.mobile
https://www.googleapis.com/auth/admin.directory.device.chromeos
https://www.googleapis.com/auth/admin.directory.resource.calendar
https://www.googleapis.com/auth/tasks
https://www.googleapis.com/auth/contacts
https://www.googleapis.com/auth/forms.body
https://www.googleapis.com/auth/forms.responses.readonly
https://www.googleapis.com/auth/classroom.courses
https://www.googleapis.com/auth/classroom.rosters
https://www.googleapis.com/auth/classroom.coursework.students
https://www.googleapis.com/auth/chat.spaces
https://www.googleapis.com/auth/chat.messages
https://www.googleapis.com/auth/admin.reports.usage.readonly
https://www.googleapis.com/auth/admin.reports.audit.readonly
https://www.googleapis.com/auth/apps.licensing
```

## Usage

### As MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": [
        "@robinsonai/google-workspace-mcp",
        "/path/to/service-account-key.json",
        "user@yourdomain.com"
      ]
    }
  }
}
```

Or use environment variables:

```json
{
  "mcpServers": {
    "google-workspace": {
      "command": "npx",
      "args": ["@robinsonai/google-workspace-mcp"],
      "env": {
        "GOOGLE_SERVICE_ACCOUNT_KEY": "/path/to/service-account-key.json",
        "GOOGLE_USER_EMAIL": "user@yourdomain.com"
      }
    }
  }
}
```

### Direct Usage

```bash
# Using arguments
npx @robinsonai/google-workspace-mcp /path/to/key.json user@domain.com

# Using environment variables
export GOOGLE_SERVICE_ACCOUNT_KEY=/path/to/key.json
export GOOGLE_USER_EMAIL=user@domain.com
npx @robinsonai/google-workspace-mcp
```

## Example Tools

### Gmail Operations
- `gmail_send_message` - Send emails
- `gmail_list_messages` - List inbox messages
- `gmail_get_message` - Get message details
- `gmail_create_label` - Create labels

### Drive Operations
- `drive_list_files` - List Drive files
- `drive_create_folder` - Create folders
- `drive_share_file` - Share files with users
- `drive_search_files` - Search Drive

### Calendar Operations
- `calendar_list_events` - List calendar events
- `calendar_create_event` - Create events
- `calendar_update_event` - Update events
- `calendar_delete_event` - Delete events

### Sheets Operations
- `sheets_get_values` - Read cell values
- `sheets_update_values` - Update cells
- `sheets_append_values` - Append rows
- `sheets_create_spreadsheet` - Create new sheets

### Admin Operations
- `admin_create_user` - Create workspace users
- `admin_list_users` - List all users
- `admin_update_user` - Update user info
- `admin_delete_user` - Delete users

## Security Considerations

1. **Service Account Key Storage**
   - Store service account keys securely
   - Never commit keys to version control
   - Use environment variables or secure vaults
   - Rotate keys regularly

2. **Scope Minimization**
   - Only request scopes you need
   - Remove unused scopes from domain-wide delegation
   - Review permissions regularly

3. **Domain-Wide Delegation**
   - Required for Admin APIs
   - Grant with caution
   - Audit regularly
   - Document usage

4. **Rate Limiting**
   - Google APIs have quota limits
   - Implement exponential backoff
   - Monitor quota usage
   - Request quota increases if needed

## Implementation Status

- ✅ **Fully Implemented**: All 193 tools
- ✅ **Google API Integration**: Complete
- ✅ **Service Account Auth**: Working
- ✅ **Domain-Wide Delegation**: Supported
- ✅ **Production-Ready**: Yes

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Link globally
npm link
```

## License

MIT

## Author

Robinson AI Systems

## Version

1.0.0 - Complete Google Workspace automation with 193 tools
