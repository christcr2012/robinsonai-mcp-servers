# Robinson's Toolkit - Tool Call Flow

**Detailed walkthrough of how a tool call works from start to finish**

---

## Overview

When Augment Code calls a tool, the request flows through multiple layers:

```
Augment Code
    ↓
stdio Transport
    ↓
MCP Server
    ↓
CallToolRequestSchema Handler
    ↓
Switch Statement
    ↓
Service Method (e.g., vercelListProjects)
    ↓
Fetch Method (e.g., vercelFetch)
    ↓
External API (e.g., Vercel API)
    ↓
Response flows back up
```

---

## Example 1: Listing Vercel Projects

### **Step 1: User Request**

User types in Augment Code chat:

```
List all Vercel projects
```

### **Step 2: Augment Code Calls Tool**

Augment Code sends MCP request via stdio:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "vercel_list_projects",
    "arguments": {
      "teamId": "team_abc123"
    }
  }
}
```

### **Step 3: stdio Transport Receives Request**

The `StdioServerTransport` receives the JSON-RPC message and passes it to the MCP server.

**Code location:** Line 7098-7107

```typescript
async run() {
  const transport = new StdioServerTransport();
  await this.server.connect(transport);
  console.error("Robinson's Toolkit MCP server running on stdio");
}
```

### **Step 4: MCP Server Routes to Handler**

The MCP server routes the request to the `CallToolRequestSchema` handler.

**Code location:** Line 2530-2535

```typescript
this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<any> => {
  const { name } = request.params;
  const args = request.params.arguments as any;

  try {
    switch (name) {
```

### **Step 5: Switch Statement Matches Tool**

The switch statement matches `vercel_list_projects` and calls the method.

**Code location:** Line ~2800 (in switch statement)

```typescript
case "vercel_list_projects": 
  return await this.vercelListProjects(args);
```

### **Step 6: Method Builds API Request**

The `vercelListProjects` method builds the API request.

**Code location:** Line ~4840

```typescript
private async vercelListProjects(args: any) {
  const params = new URLSearchParams();
  if (args.teamId) params.append("teamId", args.teamId);
  const data = await this.vercelFetch(`/v9/projects?${params}`);
  return this.formatResponse(data);
}
```

### **Step 7: Fetch Method Calls API**

The `vercelFetch` method makes the HTTPS request to Vercel API.

**Code location:** Line ~3440

```typescript
private async vercelFetch(endpoint: string, options: any = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${this.vercelToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return await response.json();
}
```

**Actual HTTPS request:**

```
GET https://api.vercel.com/v9/projects?teamId=team_abc123
Headers:
  Authorization: Bearer 2LcqlkT0wxcPPc88t5rjNqEL
  Content-Type: application/json
```

### **Step 8: Vercel API Responds**

Vercel API returns JSON response:

```json
{
  "projects": [
    {
      "id": "prj_abc123",
      "name": "cortiware-provider-portal",
      "framework": "nextjs",
      "createdAt": 1234567890
    },
    {
      "id": "prj_def456",
      "name": "cortiware-tenant-app",
      "framework": "nextjs",
      "createdAt": 1234567891
    }
  ],
  "pagination": {
    "count": 2,
    "next": null
  }
}
```

### **Step 9: Response Formatted**

The `formatResponse` helper formats the response for MCP.

**Code location:** Line ~3425

```typescript
private formatResponse(data: any): { content: Array<{ type: string; text: string }> } {
  return {
    content: [{ 
      type: "text", 
      text: JSON.stringify(data, null, 2) 
    }]
  };
}
```

**Formatted response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{\n  \"projects\": [\n    {\n      \"id\": \"prj_abc123\",\n      \"name\": \"cortiware-provider-portal\",\n      \"framework\": \"nextjs\",\n      \"createdAt\": 1234567890\n    },\n    {\n      \"id\": \"prj_def456\",\n      \"name\": \"cortiware-tenant-app\",\n      \"framework\": \"nextjs\",\n      \"createdAt\": 1234567891\n    }\n  ],\n  \"pagination\": {\n    \"count\": 2,\n    \"next\": null\n  }\n}"
  }]
}
```

### **Step 10: Response Sent to Augment Code**

The MCP server sends the response back via stdio:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\n  \"projects\": [...]\n}"
    }]
  }
}
```

### **Step 11: Augment Code Displays Result**

Augment Code parses the response and displays it to the user:

```
Found 2 Vercel projects:

1. cortiware-provider-portal (Next.js)
2. cortiware-tenant-app (Next.js)
```

---

## Example 2: Creating a GitHub Issue

### **User Request**

```
Create a GitHub issue in robinsonai/Cortiware with title "Bug: Login fails" and body "Users cannot log in"
```

### **MCP Request**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "github_create_issue",
    "arguments": {
      "owner": "robinsonai",
      "repo": "Cortiware",
      "title": "Bug: Login fails",
      "body": "Users cannot log in"
    }
  }
}
```

### **Switch Statement**

```typescript
case 'github_create_issue': 
  return await this.createIssue(args);
```

### **Method Implementation**

**Code location:** Line ~4200

```typescript
private async createIssue(args: any) {
  const body: any = { title: args.title };
  if (args.body) body.body = args.body;
  if (args.assignees) body.assignees = args.assignees;
  if (args.labels) body.labels = args.labels;
  if (args.milestone) body.milestone = args.milestone;
  
  const response = await this.client.post(
    `/repos/${args.owner}/${args.repo}/issues`, 
    body
  );
  
  return { 
    content: [{ 
      type: 'text', 
      text: JSON.stringify(response, null, 2) 
    }] 
  };
}
```

### **GitHub Client Call**

The `this.client.post()` method calls `githubFetch()`:

**Code location:** Line ~85

```typescript
post: (path: string, body?: any) =>
  this.githubFetch(path, { 
    method: 'POST', 
    body: body ? JSON.stringify(body) : undefined 
  }),
```

### **HTTPS Request**

```
POST https://api.github.com/repos/robinsonai/Cortiware/issues
Headers:
  Authorization: token ghp_YOUR_GITHUB_TOKEN_HERE
  Accept: application/vnd.github+json
  X-GitHub-Api-Version: 2022-11-28
  Content-Type: application/json
Body:
  {
    "title": "Bug: Login fails",
    "body": "Users cannot log in"
  }
```

### **GitHub API Response**

```json
{
  "id": 123456,
  "number": 42,
  "title": "Bug: Login fails",
  "body": "Users cannot log in",
  "state": "open",
  "html_url": "https://github.com/robinsonai/Cortiware/issues/42",
  "created_at": "2024-01-15T10:30:00Z"
}
```

### **User Sees**

```
✅ Created issue #42: Bug: Login fails
https://github.com/robinsonai/Cortiware/issues/42
```

---

## Example 3: Running SQL on Neon Database

### **User Request**

```
Run SQL query "SELECT * FROM users LIMIT 5" on Neon project prj_abc123
```

### **MCP Request**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "neon_run_sql",
    "arguments": {
      "projectId": "prj_abc123",
      "sql": "SELECT * FROM users LIMIT 5"
    }
  }
}
```

### **Switch Statement**

```typescript
case 'neon_run_sql': 
  return await this.runSql(args);
```

### **Method Implementation**

**Code location:** Line ~6500

```typescript
private async runSql(args: any) {
  const body = {
    query: args.sql,
    params: args.params || []
  };
  
  const branchId = args.branchId || 'main';
  const databaseName = args.databaseName || 'neondb';
  
  const data = await this.neonFetch(
    `/projects/${args.projectId}/branches/${branchId}/databases/${databaseName}/query`,
    {
      method: 'POST',
      body: JSON.stringify(body)
    }
  );
  
  return this.formatResponse(data);
}
```

### **HTTPS Request**

```
POST https://console.neon.tech/api/v2/projects/prj_abc123/branches/main/databases/neondb/query
Headers:
  Authorization: Bearer napi_71z83xrn7sm79kc5v2x5hko2ilanrsl611jzaa9wp6zr3d0fb5alzkdgesgts6fh
  Content-Type: application/json
Body:
  {
    "query": "SELECT * FROM users LIMIT 5",
    "params": []
  }
```

### **Neon API Response**

```json
{
  "rows": [
    { "id": 1, "email": "user1@example.com", "name": "User 1" },
    { "id": 2, "email": "user2@example.com", "name": "User 2" },
    { "id": 3, "email": "user3@example.com", "name": "User 3" },
    { "id": 4, "email": "user4@example.com", "name": "User 4" },
    { "id": 5, "email": "user5@example.com", "name": "User 5" }
  ],
  "rowCount": 5,
  "fields": [
    { "name": "id", "dataTypeID": 23 },
    { "name": "email", "dataTypeID": 25 },
    { "name": "name", "dataTypeID": 25 }
  ]
}
```

### **User Sees**

```
Query returned 5 rows:

1. user1@example.com - User 1
2. user2@example.com - User 2
3. user3@example.com - User 3
4. user4@example.com - User 4
5. user5@example.com - User 5
```

---

## Error Handling Flow

### **Example: Invalid API Token**

**User Request:**

```
List Vercel projects
```

**HTTPS Request:**

```
GET https://api.vercel.com/v9/projects
Headers:
  Authorization: Bearer INVALID_TOKEN
```

**Vercel API Response:**

```
HTTP 401 Unauthorized
{
  "error": {
    "code": "forbidden",
    "message": "Invalid token"
  }
}
```

**Error Caught in vercelFetch:**

```typescript
private async vercelFetch(endpoint: string, options: any = {}) {
  const response = await fetch(url, {...});
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel API error (${response.status}): ${error}`);
  }
  
  return await response.json();
}
```

**Error Caught in Handler:**

```typescript
try {
  switch (name) {
    case 'vercel_list_projects': 
      return await this.vercelListProjects(args);
  }
} catch (error: any) {
  return {
    content: [{
      type: 'text',
      text: `Error: ${error.message}`
    }],
    isError: true
  };
}
```

**User Sees:**

```
❌ Error: Vercel API error (401): {"error":{"code":"forbidden","message":"Invalid token"}}
```

---

## Summary

Every tool call follows this pattern:

1. **User request** → Augment Code
2. **MCP request** → stdio transport
3. **Handler routing** → switch statement
4. **Method execution** → service-specific method
5. **API call** → service-specific fetch method
6. **HTTPS request** → external API
7. **Response** → flows back up the chain
8. **User sees result** → formatted in Augment Code

Understanding this flow helps debug issues and add new tools correctly!

