# RAD Memory Specification

**RAD** = **R**epository **A**gent **D**atabase - Shared long-term memory for Free and Paid agents.

## Purpose

Agents should learn from past tasks, decisions, and outcomes. RAD provides:
- **Task history** - What tasks were attempted, how they were solved
- **Decision records** - Why certain approaches were chosen
- **Lessons learned** - What worked, what didn't, what to avoid
- **Cross-repo knowledge** - Patterns that apply across projects

## Postgres Schema

### Tables

#### `tasks`
Stores completed agent tasks with outcomes.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id VARCHAR(255) NOT NULL,
  task_description TEXT NOT NULL,
  task_kind VARCHAR(50) NOT NULL, -- 'feature', 'bugfix', 'refactor', 'research'
  agent_tier VARCHAR(10) NOT NULL, -- 'free', 'paid'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_tasks_repo ON tasks(repo_id);
CREATE INDEX idx_tasks_kind ON tasks(task_kind);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
```

#### `decisions`
Stores planning decisions and reasoning.

```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  decision_type VARCHAR(50) NOT NULL, -- 'approach', 'technology', 'architecture'
  chosen_option TEXT NOT NULL,
  alternatives TEXT[], -- Array of rejected options
  reasoning TEXT NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_decisions_task ON decisions(task_id);
CREATE INDEX idx_decisions_type ON decisions(decision_type);
```

#### `lessons`
Stores lessons learned from task outcomes.

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  lesson_type VARCHAR(50) NOT NULL, -- 'success', 'failure', 'optimization', 'warning'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_lessons_task ON lessons(task_id);
CREATE INDEX idx_lessons_type ON lessons(lesson_type);
CREATE INDEX idx_lessons_tags ON lessons USING GIN(tags);
```

#### `repo_metadata`
Stores repository-level metadata.

```sql
CREATE TABLE repo_metadata (
  repo_id VARCHAR(255) PRIMARY KEY,
  repo_name VARCHAR(255) NOT NULL,
  repo_url TEXT,
  project_type VARCHAR(100),
  main_languages TEXT[],
  frameworks TEXT[],
  last_indexed TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);
```

## Agent API

### Recording Events

#### `recordEvent(task, plan, outcome)`
Records a completed task with its outcome.

```typescript
interface TaskRecord {
  repoId: string;
  taskDescription: string;
  taskKind: 'feature' | 'bugfix' | 'refactor' | 'research';
  agentTier: 'free' | 'paid';
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

interface DecisionRecord {
  decisionType: 'approach' | 'technology' | 'architecture';
  chosenOption: string;
  alternatives: string[];
  reasoning: string;
  confidence: number; // 0-1
}

interface LessonRecord {
  lessonType: 'success' | 'failure' | 'optimization' | 'warning';
  title: string;
  description: string;
  tags: string[];
}

async function recordEvent(
  task: TaskRecord,
  decisions: DecisionRecord[],
  lessons: LessonRecord[]
): Promise<{ taskId: string }>;
```

### Querying Knowledge

#### `getRelatedKnowledge(task)`
Retrieves relevant past tasks, decisions, and lessons.

```typescript
interface KnowledgeQuery {
  taskDescription: string;
  repoId?: string;
  taskKind?: string;
  limit?: number;
}

interface RelatedKnowledge {
  similarTasks: Array<{
    id: string;
    description: string;
    success: boolean;
    similarity: number;
  }>;
  relevantDecisions: Array<{
    chosenOption: string;
    reasoning: string;
    confidence: number;
  }>;
  applicableLessons: Array<{
    title: string;
    description: string;
    lessonType: string;
  }>;
}

async function getRelatedKnowledge(
  query: KnowledgeQuery
): Promise<RelatedKnowledge>;
```

## Integration Points

### In `gatherEvidence()`
```typescript
// packages/free-agent-core/src/evidence.ts
if (clients?.rad) {
  bundle.radNotes = await getRelatedKnowledge({
    taskDescription: task,
    repoId: repoPath,
    limit: 5,
  });
}
```

### In `runAgentTask()` (after completion)
```typescript
// packages/free-agent-core/src/runner.ts
if (radClient) {
  await recordEvent(
    {
      repoId: task.repo,
      taskDescription: task.task,
      taskKind: task.kind,
      agentTier: task.tier || 'free',
      success: result.success,
    },
    decisions,
    lessons
  );
}
```

## Implementation Options

### Option 1: RAD MCP Server
Create `packages/rad-memory-mcp` as a standalone MCP server.
- **Pros**: Clean separation, can be used by other tools
- **Cons**: Another server to manage

### Option 2: Internal Client
Add `packages/free-agent-core/src/rad-client.ts` that talks directly to Postgres.
- **Pros**: Simpler, fewer moving parts
- **Cons**: Tight coupling to Postgres

**Recommendation**: Start with Option 2 (internal client) for simplicity, can extract to MCP later if needed.

## Environment Variables

```bash
# Postgres connection
RAD_DATABASE_URL=postgresql://user:pass@localhost:5432/rad_memory

# Optional: Enable/disable RAD
RAD_ENABLED=true
```

## Future Enhancements

- **Semantic search** - Use embeddings to find similar tasks
- **Pattern detection** - Automatically identify recurring patterns
- **Cross-repo learning** - Share lessons across different projects
- **Confidence scoring** - Track which decisions led to success
- **Automated suggestions** - Proactively suggest approaches based on history

