# Chris's Infrastructure Integration Plan

**Date:** 2025-01-09  
**Status:** Design Phase  
**Goal:** Integrate PostgreSQL, Neo4j, Qdrant, N8N into Robinson's Toolkit for AI-powered memory and learning

---

## 🎯 Vision

**Transform your MCP servers from stateless tools into intelligent, learning systems** by giving them:
- **Memory** - Store every interaction, code generation, and decision
- **Knowledge Graphs** - Map relationships between code, tools, and patterns
- **Semantic Search** - Find similar solutions from past work
- **Automation** - Chain operations together with N8N workflows

---

## 🏗️ Architecture

### **Integration Point: Robinson's Toolkit MCP**

**Why Robinson's Toolkit?**
- ✅ Already has dynamic category system (v1.14.0)
- ✅ Broker pattern keeps tools out of context
- ✅ Multi-project support built-in
- ✅ Any AI agent with Robinson's Toolkit can use these tools
- ✅ Centralized authentication and configuration

**New Categories:**
```
postgres    - PostgreSQL with pgvector (vector database)
neo4j       - Neo4j graph database (knowledge graphs)
qdrant      - Qdrant vector search (semantic similarity)
n8n         - N8N workflow automation (orchestration)
```

### **Tool Naming Convention**

```
{service}_{subcategory}_{action}

Examples:
postgres_query_execute          - Execute SQL query
postgres_vector_search          - Semantic search with pgvector
postgres_chat_history_store     - Store chat message
neo4j_query_execute             - Execute Cypher query
neo4j_knowledge_graph_create    - Create knowledge graph node
qdrant_collection_create        - Create vector collection
qdrant_search_semantic          - Semantic similarity search
n8n_workflow_trigger            - Trigger N8N workflow
```

---

## 📦 PostgreSQL Tools (postgres_*)

### **Subcategories:**
1. **queries** - SQL execution
2. **vector_search** - pgvector semantic search
3. **chat_history** - Chat message storage
4. **embeddings** - Embedding storage and retrieval
5. **admin** - Database administration

### **Tool Definitions:**

#### **postgres_query_execute**
```typescript
{
  name: 'postgres_query_execute',
  description: 'Execute SQL query on Chris\'s PostgreSQL database via FastAPI',
  inputSchema: {
    type: 'object',
    properties: {
      sql: {
        type: 'string',
        description: 'SQL query to execute (SELECT, INSERT, UPDATE, DELETE)',
      },
      params: {
        type: 'array',
        items: { type: 'any' },
        description: 'Query parameters for prepared statements',
      },
    },
    required: ['sql'],
  },
}
```

#### **postgres_vector_search**
```typescript
{
  name: 'postgres_vector_search',
  description: 'Semantic search using pgvector embeddings',
  inputSchema: {
    type: 'object',
    properties: {
      table: {
        type: 'string',
        description: 'Table name (e.g., "code_snippets", "chat_history")',
      },
      embedding: {
        type: 'array',
        items: { type: 'number' },
        description: 'Query embedding vector (1536 dimensions for OpenAI)',
      },
      limit: {
        type: 'number',
        default: 5,
        description: 'Number of results to return',
      },
      threshold: {
        type: 'number',
        default: 0.7,
        description: 'Similarity threshold (0-1)',
      },
    },
    required: ['table', 'embedding'],
  },
}
```

#### **postgres_chat_history_store**
```typescript
{
  name: 'postgres_chat_history_store',
  description: 'Store chat message with embedding for semantic search',
  inputSchema: {
    type: 'object',
    properties: {
      role: {
        type: 'string',
        enum: ['user', 'assistant', 'system'],
        description: 'Message role',
      },
      content: {
        type: 'string',
        description: 'Message content',
      },
      embedding: {
        type: 'array',
        items: { type: 'number' },
        description: 'Message embedding vector',
      },
      metadata: {
        type: 'object',
        description: 'Additional metadata (task, context, etc.)',
      },
    },
    required: ['role', 'content', 'embedding'],
  },
}
```

**Total PostgreSQL Tools:** ~25 tools

---

## 🕸️ Neo4j Tools (neo4j_*)

### **Subcategories:**
1. **queries** - Cypher query execution
2. **knowledge_graph** - Knowledge graph operations
3. **relationships** - Relationship management
4. **patterns** - Pattern detection and analysis
5. **admin** - Database administration

### **Tool Definitions:**

#### **neo4j_query_execute**
```typescript
{
  name: 'neo4j_query_execute',
  description: 'Execute Cypher query on Chris\'s Neo4j graph database',
  inputSchema: {
    type: 'object',
    properties: {
      cypher: {
        type: 'string',
        description: 'Cypher query to execute',
      },
      params: {
        type: 'object',
        description: 'Query parameters',
      },
    },
    required: ['cypher'],
  },
}
```

#### **neo4j_knowledge_graph_create_node**
```typescript
{
  name: 'neo4j_knowledge_graph_create_node',
  description: 'Create a node in the knowledge graph',
  inputSchema: {
    type: 'object',
    properties: {
      label: {
        type: 'string',
        description: 'Node label (e.g., "Tool", "Code", "Pattern")',
      },
      properties: {
        type: 'object',
        description: 'Node properties',
      },
    },
    required: ['label', 'properties'],
  },
}
```

#### **neo4j_relationship_create**
```typescript
{
  name: 'neo4j_relationship_create',
  description: 'Create relationship between two nodes',
  inputSchema: {
    type: 'object',
    properties: {
      from_id: {
        type: 'string',
        description: 'Source node ID',
      },
      to_id: {
        type: 'string',
        description: 'Target node ID',
      },
      type: {
        type: 'string',
        description: 'Relationship type (e.g., "USES", "DEPENDS_ON", "SIMILAR_TO")',
      },
      properties: {
        type: 'object',
        description: 'Relationship properties',
      },
    },
    required: ['from_id', 'to_id', 'type'],
  },
}
```

**Total Neo4j Tools:** ~20 tools

---

## 🔍 Qdrant Tools (qdrant_*)

### **Subcategories:**
1. **collections** - Collection management
2. **search** - Vector search operations
3. **points** - Point (vector) management
4. **admin** - Database administration

### **Tool Definitions:**

#### **qdrant_collection_create**
```typescript
{
  name: 'qdrant_collection_create',
  description: 'Create a new vector collection in Qdrant',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Collection name',
      },
      vector_size: {
        type: 'number',
        description: 'Vector dimension (e.g., 1536 for OpenAI embeddings)',
      },
      distance: {
        type: 'string',
        enum: ['Cosine', 'Euclidean', 'Dot'],
        default: 'Cosine',
        description: 'Distance metric',
      },
    },
    required: ['name', 'vector_size'],
  },
}
```

#### **qdrant_search_semantic**
```typescript
{
  name: 'qdrant_search_semantic',
  description: 'Semantic search in Qdrant collection',
  inputSchema: {
    type: 'object',
    properties: {
      collection: {
        type: 'string',
        description: 'Collection name',
      },
      vector: {
        type: 'array',
        items: { type: 'number' },
        description: 'Query vector',
      },
      limit: {
        type: 'number',
        default: 5,
        description: 'Number of results',
      },
      filter: {
        type: 'object',
        description: 'Optional filter conditions',
      },
    },
    required: ['collection', 'vector'],
  },
}
```

#### **qdrant_point_upsert**
```typescript
{
  name: 'qdrant_point_upsert',
  description: 'Insert or update point (vector) in collection',
  inputSchema: {
    type: 'object',
    properties: {
      collection: {
        type: 'string',
        description: 'Collection name',
      },
      id: {
        type: 'string',
        description: 'Point ID',
      },
      vector: {
        type: 'array',
        items: { type: 'number' },
        description: 'Vector embedding',
      },
      payload: {
        type: 'object',
        description: 'Metadata payload',
      },
    },
    required: ['collection', 'id', 'vector'],
  },
}
```

**Total Qdrant Tools:** ~15 tools

---

## 🔄 N8N Tools (n8n_*)

### **Subcategories:**
1. **workflows** - Workflow management
2. **executions** - Execution monitoring
3. **credentials** - Credential management
4. **admin** - Administration

### **Tool Definitions:**

#### **n8n_workflow_trigger**
```typescript
{
  name: 'n8n_workflow_trigger',
  description: 'Trigger N8N workflow execution',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_id: {
        type: 'string',
        description: 'Workflow ID or name',
      },
      data: {
        type: 'object',
        description: 'Input data for workflow',
      },
    },
    required: ['workflow_id'],
  },
}
```

#### **n8n_execution_get_status**
```typescript
{
  name: 'n8n_execution_get_status',
  description: 'Get status of workflow execution',
  inputSchema: {
    type: 'object',
    properties: {
      execution_id: {
        type: 'string',
        description: 'Execution ID',
      },
    },
    required: ['execution_id'],
  },
}
```

**Total N8N Tools:** ~12 tools

---

## 🔧 Implementation

### **File Structure**

```
packages/robinsons-toolkit-mcp/src/
├── chris-infrastructure/
│   ├── postgres-tools.ts       (25 tool definitions)
│   ├── postgres-handlers.ts    (API handlers)
│   ├── neo4j-tools.ts          (20 tool definitions)
│   ├── neo4j-handlers.ts       (API handlers)
│   ├── qdrant-tools.ts         (15 tool definitions)
│   ├── qdrant-handlers.ts      (API handlers)
│   ├── n8n-tools.ts            (12 tool definitions)
│   ├── n8n-handlers.ts         (API handlers)
│   └── fastapi-client.ts       (Unified FastAPI client)
└── index.ts                     (Import and register tools)
```

### **FastAPI Client**

```typescript
// packages/robinsons-toolkit-mcp/src/chris-infrastructure/fastapi-client.ts

export class FastAPIClient {
  private baseUrl = 'https://api.srv823383.hstgr.cloud/api/v1';
  private userId = 'chris';

  async request(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'X-User': this.userId,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.statusText}`);
    }

    return response.json();
  }

  // PostgreSQL methods
  async postgresQuery(sql: string, params?: any[]) {
    return this.request('/postgres/execute', {
      method: 'POST',
      body: JSON.stringify({ sql, params }),
    });
  }

  // Neo4j methods
  async neo4jQuery(cypher: string, params?: any) {
    return this.request('/neo4j/execute', {
      method: 'POST',
      body: JSON.stringify({ cypher, params }),
    });
  }

  // Qdrant methods
  async qdrantSearch(collection: string, vector: number[], limit: number = 5) {
    return this.request(`/qdrant/collections/${collection}/search`, {
      method: 'POST',
      body: JSON.stringify({ vector, limit }),
    });
  }

  // N8N methods
  async n8nTriggerWorkflow(workflowId: string, data?: any) {
    return this.request(`/n8n/workflows/${workflowId}/trigger`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }
}
```

---

## 🚀 Use Cases

### **1. Give MCP Servers Memory**

**Workflow:** Every code generation is stored in PostgreSQL with embedding

```typescript
// When FREE/PAID agent generates code:
1. Generate code
2. Create embedding of code + task description
3. Call postgres_chat_history_store to save
4. Later: Call postgres_vector_search to find similar past solutions
```

### **2. Build Knowledge Graph of Codebase**

**Workflow:** Map relationships between tools, code, and patterns

```typescript
// When user uses a tool:
1. Create node for tool: neo4j_knowledge_graph_create_node
2. Create node for task: neo4j_knowledge_graph_create_node
3. Create relationship: neo4j_relationship_create (USED_FOR)
4. Later: Query patterns: neo4j_query_execute
```

### **3. Semantic Code Search**

**Workflow:** Find similar code snippets by meaning

```typescript
// Store code snippets:
1. Generate embedding of code
2. Call qdrant_point_upsert to store
3. Later: Call qdrant_search_semantic to find similar code
```

### **4. Automate Workflows**

**Workflow:** Chain MCP operations with N8N

```typescript
// Example: "Deploy new feature" workflow
1. Trigger: n8n_workflow_trigger("deploy-feature")
2. N8N workflow:
   - Generate code (FREE agent)
   - Store in PostgreSQL
   - Store embedding in Qdrant
   - Update knowledge graph in Neo4j
   - Deploy to Vercel
   - Send notification
```

---

## 📝 Next Steps

1. **Create tool definitions** - All 72 tools (postgres, neo4j, qdrant, n8n)
2. **Implement handlers** - API integration with FastAPI
3. **Test with real data** - Verify all operations work
4. **Document usage** - Examples and best practices
5. **Publish** - Robinson's Toolkit v1.15.0

**Estimated Timeline:** 1 week for full implementation

---

**Total Tools:** ~72 new tools across 4 categories
**Impact:** Transforms MCP servers from stateless to intelligent, learning systems

