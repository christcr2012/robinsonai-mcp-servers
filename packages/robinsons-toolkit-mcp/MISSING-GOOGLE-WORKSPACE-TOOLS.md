# Missing Google Workspace Tools - Audit Report

**Date:** 2025-11-06  
**Current Version:** 1.3.0  
**Status:** Comprehensive API audit in progress

---

## Executive Summary

After auditing Google Workspace APIs against our current implementation, we've identified **60+ missing tools** across Calendar, Drive, Gmail, Sheets, Docs, Slides, and Admin SDK.

**Priority:** HIGH - These are core Google Workspace features that users expect.

---

## 1. Calendar API v3 - Missing Tools (30 tools)

### 1.1 Calendars Resource (6 tools) - **CRITICAL**
**Purpose:** Create and manage calendars themselves (not just events)

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `calendar_create` | POST | `/calendars` | Create secondary calendar |
| `calendar_get` | GET | `/calendars/{calendarId}` | Get calendar metadata |
| `calendar_update` | PUT | `/calendars/{calendarId}` | Update calendar |
| `calendar_patch` | PATCH | `/calendars/{calendarId}` | Patch calendar |
| `calendar_delete` | DELETE | `/calendars/{calendarId}` | Delete secondary calendar |
| `calendar_clear` | POST | `/calendars/{calendarId}/clear` | Clear primary calendar events |

**Current Status:** ❌ MISSING - We can create events but NOT calendars!

### 1.2 CalendarList Resource (7 tools) - **HIGH**
**Purpose:** Manage user's calendar list (which calendars they see)

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `calendar_list_calendars` | GET | `/users/me/calendarList` | List user's calendars |
| `calendar_list_insert` | POST | `/users/me/calendarList` | Add existing calendar to list |
| `calendar_list_get` | GET | `/users/me/calendarList/{calendarId}` | Get calendar from list |
| `calendar_list_update` | PUT | `/users/me/calendarList/{calendarId}` | Update calendar in list |
| `calendar_list_patch` | PATCH | `/users/me/calendarList/{calendarId}` | Patch calendar in list |
| `calendar_list_delete` | DELETE | `/users/me/calendarList/{calendarId}` | Remove calendar from list |
| `calendar_list_watch` | POST | `/users/me/calendarList/watch` | Watch for calendar list changes |

**Current Status:** ❌ MISSING

### 1.3 ACL Resource (7 tools) - **MEDIUM**
**Purpose:** Manage calendar access control (sharing)

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `calendar_acl_list` | GET | `/calendars/{calendarId}/acl` | List ACL rules |
| `calendar_acl_get` | GET | `/calendars/{calendarId}/acl/{ruleId}` | Get ACL rule |
| `calendar_acl_insert` | POST | `/calendars/{calendarId}/acl` | Create ACL rule |
| `calendar_acl_update` | PUT | `/calendars/{calendarId}/acl/{ruleId}` | Update ACL rule |
| `calendar_acl_patch` | PATCH | `/calendars/{calendarId}/acl/{ruleId}` | Patch ACL rule |
| `calendar_acl_delete` | DELETE | `/calendars/{calendarId}/acl/{ruleId}` | Delete ACL rule |
| `calendar_acl_watch` | POST | `/calendars/{calendarId}/acl/watch` | Watch ACL changes |

**Current Status:** ❌ MISSING

### 1.4 Freebusy Resource (1 tool) - **MEDIUM**
**Purpose:** Query free/busy information

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `calendar_freebusy_query` | POST | `/freeBusy` | Query free/busy info |

**Current Status:** ❌ MISSING

### 1.5 Colors Resource (1 tool) - **LOW**
**Purpose:** Get color definitions

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `calendar_colors_get` | GET | `/colors` | Get color definitions |

**Current Status:** ❌ MISSING

### 1.6 Settings Resource (3 tools) - **LOW**
**Purpose:** Manage calendar settings

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `calendar_settings_list` | GET | `/users/me/settings` | List settings |
| `calendar_settings_get` | GET | `/users/me/settings/{setting}` | Get setting |
| `calendar_settings_watch` | POST | `/users/me/settings/watch` | Watch settings |

**Current Status:** ❌ MISSING

### 1.7 Events Resource - Missing Methods (5 tools) - **MEDIUM**
**Purpose:** Additional event operations we don't have

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `calendar_event_instances` | GET | `/calendars/{calendarId}/events/{eventId}/instances` | Get recurring event instances |
| `calendar_event_move` | POST | `/calendars/{calendarId}/events/{eventId}/move` | Move event to another calendar |
| `calendar_event_patch` | PATCH | `/calendars/{calendarId}/events/{eventId}` | Patch event |
| `calendar_event_import` | POST | `/calendars/{calendarId}/events/import` | Import event (already have as `calendar_import_event`) |
| `calendar_event_quick_add` | POST | `/calendars/{calendarId}/events/quickAdd` | Quick add (already have as `calendar_quick_add`) |

**Current Status:** ⚠️ PARTIAL (have import and quickAdd, missing others)

---

## 2. Drive API v3 - Missing Tools (15+ tools)

### 2.1 Files Resource - Missing Methods
**Current:** We have basic file operations  
**Missing:**
- `drive_copy_file` - POST `/files/{fileId}/copy`
- `drive_empty_trash` - DELETE `/files/trash`
- `drive_generate_ids` - GET `/files/generateIds`
- `drive_watch_file` - POST `/files/{fileId}/watch`

### 2.2 Permissions Resource - **CRITICAL**
**Purpose:** Manage file sharing and permissions

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `drive_permissions_list` | GET | `/files/{fileId}/permissions` | List permissions |
| `drive_permissions_get` | GET | `/files/{fileId}/permissions/{permissionId}` | Get permission |
| `drive_permissions_create` | POST | `/files/{fileId}/permissions` | Create permission |
| `drive_permissions_update` | PATCH | `/files/{fileId}/permissions/{permissionId}` | Update permission |
| `drive_permissions_delete` | DELETE | `/files/{fileId}/permissions/{permissionId}` | Delete permission |

**Current Status:** ❌ MISSING - Can't share files!

### 2.3 Comments Resource
**Purpose:** Manage file comments

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `drive_comments_list` | GET | `/files/{fileId}/comments` | List comments |
| `drive_comments_get` | GET | `/files/{fileId}/comments/{commentId}` | Get comment |
| `drive_comments_create` | POST | `/files/{fileId}/comments` | Create comment |
| `drive_comments_update` | PATCH | `/files/{fileId}/comments/{commentId}` | Update comment |
| `drive_comments_delete` | DELETE | `/files/{fileId}/comments/{commentId}` | Delete comment |

**Current Status:** ❌ MISSING

### 2.4 Replies Resource
**Purpose:** Manage comment replies

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `drive_replies_list` | GET | `/files/{fileId}/comments/{commentId}/replies` | List replies |
| `drive_replies_get` | GET | `/files/{fileId}/comments/{commentId}/replies/{replyId}` | Get reply |
| `drive_replies_create` | POST | `/files/{fileId}/comments/{commentId}/replies` | Create reply |
| `drive_replies_update` | PATCH | `/files/{fileId}/comments/{commentId}/replies/{replyId}` | Update reply |
| `drive_replies_delete` | DELETE | `/files/{fileId}/comments/{commentId}/replies/{replyId}` | Delete reply |

**Current Status:** ❌ MISSING

---

## 3. Gmail API - Missing Tools (10+ tools)

### 3.1 Drafts Resource
**Purpose:** Manage email drafts

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `gmail_drafts_list` | GET | `/users/{userId}/drafts` | List drafts |
| `gmail_drafts_get` | GET | `/users/{userId}/drafts/{id}` | Get draft |
| `gmail_drafts_create` | POST | `/users/{userId}/drafts` | Create draft |
| `gmail_drafts_update` | PUT | `/users/{userId}/drafts/{id}` | Update draft |
| `gmail_drafts_delete` | DELETE | `/users/{userId}/drafts/{id}` | Delete draft |
| `gmail_drafts_send` | POST | `/users/{userId}/drafts/{id}/send` | Send draft |

**Current Status:** ❌ MISSING

### 3.2 Threads Resource
**Purpose:** Manage email threads

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `gmail_threads_list` | GET | `/users/{userId}/threads` | List threads |
| `gmail_threads_get` | GET | `/users/{userId}/threads/{id}` | Get thread |
| `gmail_threads_modify` | POST | `/users/{userId}/threads/{id}/modify` | Modify thread |
| `gmail_threads_trash` | POST | `/users/{userId}/threads/{id}/trash` | Trash thread |
| `gmail_threads_untrash` | POST | `/users/{userId}/threads/{id}/untrash` | Untrash thread |
| `gmail_threads_delete` | DELETE | `/users/{userId}/threads/{id}` | Delete thread |

**Current Status:** ❌ MISSING

### 3.3 History Resource
**Purpose:** Track mailbox changes

| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `gmail_history_list` | GET | `/users/{userId}/history` | List history |

**Current Status:** ❌ MISSING

---

## 4. Sheets API v4 - Missing Tools (10+ tools)

### 4.1 Spreadsheets Resource - Missing Methods
**Current:** We have basic get/update  
**Missing:**
- `sheets_create` - POST `/spreadsheets` - Create spreadsheet
- `sheets_batch_update` - POST `/spreadsheets/{spreadsheetId}:batchUpdate` - Batch update
- `sheets_get_by_data_filter` - POST `/spreadsheets/{spreadsheetId}:getByDataFilter`

### 4.2 Values Resource - Missing Methods
**Missing:**
- `sheets_values_append` - POST `/spreadsheets/{spreadsheetId}/values/{range}:append`
- `sheets_values_batch_get` - GET `/spreadsheets/{spreadsheetId}/values:batchGet`
- `sheets_values_batch_update` - POST `/spreadsheets/{spreadsheetId}/values:batchUpdate`
- `sheets_values_batch_clear` - POST `/spreadsheets/{spreadsheetId}/values:batchClear` (already have as `sheets_batch_clear`)
- `sheets_values_batch_update_by_data_filter` - POST `/spreadsheets/{spreadsheetId}/values:batchUpdateByDataFilter`

---

## 5. Docs API v1 - Missing Tools (20+ tools)

**Current Status:** ❌ NO DOCS TOOLS AT ALL!

### 5.1 Documents Resource
| Tool Name | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| `docs_create` | POST | `/documents` | Create document |
| `docs_get` | GET | `/documents/{documentId}` | Get document |
| `docs_batch_update` | POST | `/documents/{documentId}:batchUpdate` | Batch update |

**Current Status:** ❌ MISSING - Can't create or edit Google Docs!

---

## 6. Slides API v1 - Missing Tools (15+ tools)

**Current Status:** ⚠️ PARTIAL (have 10 tools, 1 stub)

### 6.1 Presentations Resource - Missing Methods
**Missing:**
- `slides_create` - POST `/presentations` - Create presentation
- `slides_batch_update` - POST `/presentations/{presentationId}:batchUpdate` - Batch update
- `slides_get_page` - GET `/presentations/{presentationId}/pages/{pageObjectId}` - Get page
- `slides_get_page_thumbnail` - GET `/presentations/{presentationId}/pages/{pageObjectId}/thumbnail` - Get thumbnail

---

## 7. Forms API v1 - Missing Tools (10+ tools)

**Current Status:** ⚠️ PARTIAL (have 5 tools, 3 stubs)

### 7.1 Forms Resource - Missing Methods
**Missing:**
- `forms_create` - POST `/forms` - Create form
- `forms_batch_update` - POST `/forms/{formId}:batchUpdate` - Batch update
- `forms_get_responses` - GET `/forms/{formId}/responses` - Get responses
- `forms_get_response` - GET `/forms/{formId}/responses/{responseId}` - Get response

---

## Summary by Priority

### 🔴 CRITICAL (Must Have)
1. **Calendar - Calendars Resource** (6 tools) - Can't create calendars!
2. **Drive - Permissions Resource** (5 tools) - Can't share files!
3. **Docs API** (20+ tools) - No Docs support at all!

### 🟡 HIGH (Should Have)
1. **Calendar - CalendarList Resource** (7 tools)
2. **Gmail - Drafts Resource** (6 tools)
3. **Gmail - Threads Resource** (6 tools)
4. **Sheets - Create/BatchUpdate** (3 tools)

### 🟢 MEDIUM (Nice to Have)
1. **Calendar - ACL Resource** (7 tools)
2. **Calendar - Events Missing Methods** (3 tools)
3. **Drive - Comments/Replies** (10 tools)
4. **Slides - Missing Methods** (4 tools)

### ⚪ LOW (Future)
1. **Calendar - Colors/Settings** (4 tools)
2. **Forms - Missing Methods** (4 tools)

---

## Next Steps

1. ✅ **Phase 1:** Add Calendar Calendars Resource (6 tools) - CRITICAL
2. ✅ **Phase 2:** Add Drive Permissions Resource (5 tools) - CRITICAL
3. ✅ **Phase 3:** Add Docs API (20+ tools) - CRITICAL
4. ⏳ **Phase 4:** Add remaining HIGH priority tools
5. ⏳ **Phase 5:** Add MEDIUM priority tools
6. ⏳ **Phase 6:** Add LOW priority tools

**Estimated Total:** 60-80 new tools to add

---

## References

- [Calendar API v3 Reference](https://developers.google.com/workspace/calendar/api/v3/reference)
- [Drive API v3 Reference](https://developers.google.com/workspace/drive/api/reference/rest/v3)
- [Gmail API Reference](https://developers.google.com/workspace/gmail/api/reference/rest)
- [Sheets API v4 Reference](https://developers.google.com/workspace/sheets/api/reference/rest)
- [Docs API v1 Reference](https://developers.google.com/workspace/docs/api/reference/rest)
- [Slides API v1 Reference](https://developers.google.com/workspace/slides/api/reference/rest)
- [Forms API v1 Reference](https://developers.google.com/workspace/forms/api/reference/rest)

