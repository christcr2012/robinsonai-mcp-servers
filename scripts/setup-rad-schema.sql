-- RAD Memory Database Schema
-- Repository Agent Database for long-term agent memory

-- Tasks table: Stores completed agent tasks with outcomes
CREATE TABLE IF NOT EXISTS tasks (
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

CREATE INDEX IF NOT EXISTS idx_tasks_repo ON tasks(repo_id);
CREATE INDEX IF NOT EXISTS idx_tasks_kind ON tasks(task_kind);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);

-- Decisions table: Stores planning decisions and reasoning
CREATE TABLE IF NOT EXISTS decisions (
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

CREATE INDEX IF NOT EXISTS idx_decisions_task ON decisions(task_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON decisions(decision_type);

-- Lessons table: Stores lessons learned from task outcomes
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  lesson_type VARCHAR(50) NOT NULL, -- 'success', 'failure', 'optimization', 'warning'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lessons_task ON lessons(task_id);
CREATE INDEX IF NOT EXISTS idx_lessons_type ON lessons(lesson_type);
CREATE INDEX IF NOT EXISTS idx_lessons_tags ON lessons USING GIN(tags);

-- Repo metadata table: Stores repository-level metadata
CREATE TABLE IF NOT EXISTS repo_metadata (
  repo_id VARCHAR(255) PRIMARY KEY,
  repo_name VARCHAR(255) NOT NULL,
  repo_url TEXT,
  project_type VARCHAR(100),
  main_languages TEXT[],
  frameworks TEXT[],
  last_indexed TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Verify tables were created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('tasks', 'decisions', 'lessons', 'repo_metadata')
ORDER BY table_name;

