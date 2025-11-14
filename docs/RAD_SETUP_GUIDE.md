# RAD Memory Setup Guide

**RAD** = **R**epository **A**gent **D**atabase - Centralized long-term memory for all agents, accessible from any workspace or system.

## ✅ Zero Configuration Required!

RAD memory is **built into the published MCP packages** and works out of the box:
- ✅ **Free Agent MCP v0.10.1+** - RAD enabled by default
- ✅ **Paid Agent MCP v0.8.1+** - RAD enabled by default
- ✅ **Shared Neon database** - All agents use the same centralized memory
- ✅ **No environment variables needed** - Works automatically

## How It Works

### Built-In Default Database

All published MCP packages include a default RAD database connection:
- **Project**: RAD Memory (sweet-union-29297909)
- **Region**: aws-us-east-2
- **Tables**: tasks, decisions, lessons, repo_metadata
- **Connection**: Automatically configured in `free-agent-core`

### Automatic Behavior

When you use Free or Paid agents:
1. ✅ RAD is **enabled by default**
2. ✅ Agents **automatically connect** to the shared Neon database
3. ✅ Tasks are **automatically recorded** with decisions and lessons
4. ✅ Knowledge is **automatically retrieved** for similar tasks
5. ✅ Memory is **shared across all workspaces and systems**

### Optional: Custom Database (Advanced)

If you want to use your own private RAD database instead of the shared one:

#### Step 1: Create Your Own Neon Database

1. Go to https://neon.tech and create a new project
2. Run the schema from `scripts/setup-rad-schema.sql`
3. Get your connection string

#### Step 2: Set Environment Variables

**Option A: PowerShell (Recommended)**

```powershell
# Use your own database
[System.Environment]::SetEnvironmentVariable('RAD_DATABASE_URL', 'postgresql://your-connection-string', 'User')

# Or disable RAD entirely
[System.Environment]::SetEnvironmentVariable('RAD_ENABLED', 'false', 'User')
```

**Option B: GUI**

1. Press `Win + X` → "System" → "Advanced system settings" → "Environment Variables"
2. Add `RAD_DATABASE_URL` with your connection string
3. Or add `RAD_ENABLED` = `false` to disable

**Option C: Command Prompt**

```cmd
setx RAD_DATABASE_URL "postgresql://your-connection-string"
```

#### Step 3: Restart Applications

After setting environment variables, restart:
- ✅ VS Code / Augment
- ✅ All terminal windows
- ✅ Any running MCP servers

## Verify RAD is Working

### Check Connection

The agents will automatically log RAD status on startup. Look for:
```
✅ RAD Memory enabled (connected to Neon)
```

### Test Recording

Ask an agent to complete a simple task:
```
"Create a simple hello world function and test it"
```

The agent will automatically record the task, decisions, and lessons to RAD.

### View Recorded Data

Connect to the Neon database and query:
```sql
-- View recent tasks
SELECT task_description, success, created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;

-- View lessons learned
SELECT title, description, tags
FROM lessons
ORDER BY created_at DESC
LIMIT 10;
```

## How RAD Works

### Automatic Recording

When agents complete tasks, they automatically record:
- **Task details**: Description, kind (feature/bugfix/refactor/research), success/failure
- **Decisions**: Approaches chosen, alternatives considered, reasoning
- **Lessons**: What worked, what didn't, what to avoid

### Automatic Retrieval

When agents start new tasks, they automatically query RAD for:
- **Similar tasks**: Past tasks with similar descriptions
- **Relevant decisions**: Decisions made in similar contexts
- **Applicable lessons**: Lessons learned from related work

### Cross-Workspace Learning

Because RAD uses a shared database:
- ✅ Agent learns from work in Project A
- ✅ Agent applies that knowledge in Project B
- ✅ Knowledge accumulates over time across all your projects
- ✅ Patterns emerge across different codebases
- ✅ All users of the published packages share collective knowledge

## Database Schema

### Tables

1. **tasks** - Completed agent tasks with outcomes
2. **decisions** - Planning decisions and reasoning
3. **lessons** - Lessons learned from task outcomes
4. **repo_metadata** - Repository-level metadata

See `docs/RAD_MEMORY_SPEC.md` for full schema details.

## Maintenance

### View Recent Tasks

```sql
SELECT 
  task_description,
  task_kind,
  agent_tier,
  success,
  created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;
```

### View Lessons Learned

```sql
SELECT 
  lesson_type,
  title,
  description,
  tags
FROM lessons
ORDER BY created_at DESC
LIMIT 10;
```

### Clear Old Data (Optional)

```sql
-- Delete tasks older than 90 days
DELETE FROM tasks WHERE created_at < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### RAD not working

1. **Check package versions**:
   - Free Agent MCP should be v0.10.1 or higher
   - Paid Agent MCP should be v0.8.1 or higher
   - Update `augment-mcp-config.json` if needed

2. **Restart Augment**:
   - Close and reopen Augment Code
   - Or use "Reload MCP Servers" command

3. **Check logs**:
   - Look for RAD connection messages in MCP server logs
   - Should see "RAD Memory enabled" on startup

### "Connection failed" error

- Check Neon project is active (not suspended)
- Verify network connectivity
- Check if custom `RAD_DATABASE_URL` is set incorrectly

### Want to disable RAD?

Set environment variable:
```powershell
[System.Environment]::SetEnvironmentVariable('RAD_ENABLED', 'false', 'User')
```

Then restart Augment.

## Security Notes

- ✅ Connection uses SSL (`sslmode=require`)
- ✅ Credentials are in environment variables (not in code)
- ⚠️  Keep database credentials secure
- ⚠️  Don't commit credentials to git

## Future Enhancements

- **Semantic search** - Use embeddings to find similar tasks
- **Pattern detection** - Automatically identify recurring patterns
- **Confidence scoring** - Track which decisions lead to success
- **Cross-repo insights** - Generate insights across all projects
- **RAD UI** - Web interface to browse and search memory

---

**RAD is now ready for system-wide agent memory!** 🧠

