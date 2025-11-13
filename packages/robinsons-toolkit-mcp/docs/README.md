# Robinson's Toolkit MCP - Documentation

**Version:** 2.0.0  
**Total Tools:** 1717  
**Total Categories:** 28

## 📦 Categories

- [**OpenAI**](openai.md) - OpenAI API tools for chat, embeddings, images, audio, assistants, fine-tuning, and more (259 tools)
- [**GitHub**](github.md) - GitHub repository, issue, PR, workflow, and collaboration tools (240 tools)
- [**Neon**](neon.md) - Neon serverless Postgres database management tools (165 tools)
- [**Cloudflare**](cloudflare.md) - Cloudflare DNS, CDN, Workers, and security tools (160 tools)
- [**Vercel**](vercel.md) - Vercel deployment, project, domain, and serverless platform tools (150 tools)
- [**Stripe**](stripe.md) - Stripe payment processing, subscriptions, invoices, and billing tools (150 tools)
- [**Supabase**](supabase.md) - Supabase database, authentication, storage, and edge functions tools (97 tools)
- [**Twilio**](twilio.md) - Twilio SMS, voice, video, and messaging tools (83 tools)
- [**Redis**](redis.md) - Redis database operations via Upstash (alias for upstash category) (80 tools)
- [**Google Admin**](admin.md) - Google Workspace admin console tools for user, group, device, and organization management (78 tools (1 subcategories))
- [**Playwright**](playwright.md) - Playwright browser automation and web scraping tools (49 tools)
- [**Resend**](resend.md) - Resend email delivery and management tools (40 tools)
- [**FastAPI**](fastapi.md) - FastAPI gateway tools (alias for gateway category) (28 tools)
- [**Google Drive**](drive.md) - Google Drive tools for file storage, sharing, and management (15 tools (1 subcategories))
- [**Gmail**](gmail.md) - Gmail tools for email sending, reading, searching, and management (15 tools (1 subcategories))
- [**Google Classroom**](classroom.md) - Google Classroom tools for course, assignment, and student management (13 tools (1 subcategories))
- [**Context7**](context7.md) - Context7 documentation and API reference tools (12 tools)
- [**N8N**](n8n.md) - N8N workflow automation and integration tools (12 tools)
- [**Google Sheets**](sheets.md) - Google Sheets tools for spreadsheet creation, editing, and data management (11 tools (1 subcategories))
- [**Google Tasks**](tasks.md) - Google Tasks tools for task and to-do list management (11 tools (1 subcategories))
- [**Google Slides**](slides.md) - Google Slides tools for presentation creation and editing (10 tools (1 subcategories))
- [**Google Calendar**](calendar.md) - Google Calendar tools for event creation, scheduling, and calendar management (8 tools (1 subcategories))
- [**Google Chat**](chat.md) - Google Chat tools for messaging, spaces, and team collaboration (7 tools (1 subcategories))
- [**Google Docs**](docs.md) - Google Docs tools for document creation, editing, and collaboration (5 tools (1 subcategories))
- [**Google Forms**](forms.md) - Google Forms tools for survey and form creation and response management (5 tools (1 subcategories))
- [**Google Licensing**](licensing.md) - Google Workspace licensing tools for subscription and license management (5 tools (1 subcategories))
- [**Google People**](people.md) - Google People API tools for contact and profile management (5 tools (1 subcategories))
- [**Google Reports**](reports.md) - Google Workspace reports and analytics tools for usage and activity tracking (4 tools (1 subcategories))

## 🔧 How to Use

1. **Discover**: Use `toolkit_discover` or `toolkit_search_tools` to search for tools
2. **List**: Use `toolkit_list_categories` and `toolkit_list_tools` to browse
3. **Inspect**: Use `toolkit_get_tool_schema` to see parameters
4. **Execute**: Use `toolkit_call` to run any tool

## 📖 Category Documentation

Click on any category above to see detailed tool documentation.

## 🏷️ Tool Metadata

All tools include:
- **Tags**: Operation type (read, write, delete) and resource type (repo, issue, deployment, etc.)
- **Danger Level**: 
  - `safe` - Read-only operations
  - `caution` - Modifying operations
  - `dangerous` - Destructive operations (delete, remove, etc.)

## 🔍 Search Examples

```javascript
// Find all safe GitHub tools
toolkit_search_tools({ query: "github", dangerLevel: "safe" })

// Find all delete operations
toolkit_search_tools({ query: "delete", dangerLevel: "dangerous" })

// Find all email tools
toolkit_search_tools({ query: "email", tags: ["email"] })
```

---

Generated on 2025-11-13T02:28:19.397Z
