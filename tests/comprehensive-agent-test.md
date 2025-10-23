# Comprehensive 6-Server AI Agent Test

**Objective**: Exercise ALL AI agents across all 6 MCP servers with ~30 seconds of work each, producing gradable output.

**Test Task**: Build a complete "Task Management API" feature

---

## Test Specification

Create a production-ready Task Management API with the following components:

### 1. Data Models (TypeScript)
- `Task` interface: id, title, description, status, priority, assigneeId, dueDate, createdAt, updatedAt
- `TaskStatus` enum: TODO, IN_PROGRESS, BLOCKED, DONE
- `TaskPriority` enum: LOW, MEDIUM, HIGH, URGENT
- Validation schemas using Zod

### 2. API Endpoints (Express.js)
- POST /api/tasks - Create task
- GET /api/tasks - List tasks (with filtering, pagination)
- GET /api/tasks/:id - Get single task
- PATCH /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task

### 3. Database (PostgreSQL)
- Tasks table with proper indexes
- Migration scripts
- Seed data for testing

### 4. Business Logic
- Task assignment validation
- Due date validation (can't be in past)
- Status transition rules (can't go from DONE to TODO)
- Priority escalation logic

### 5. Tests
- Unit tests for validation
- Integration tests for API endpoints
- Edge case tests (null values, invalid data)

### 6. Security
- Input sanitization
- SQL injection prevention
- Rate limiting
- Authentication middleware

### 7. Performance
- Database query optimization
- Caching strategy
- Pagination implementation

### 8. Documentation
- API documentation (OpenAPI/Swagger)
- Code comments (JSDoc/TSDoc)
- README with setup instructions

---

## Grading Criteria

Each agent's output will be graded on:

1. **Correctness** (40%) - Does it work? No bugs?
2. **Completeness** (20%) - All requirements met?
3. **Code Quality** (20%) - Clean, readable, maintainable?
4. **Best Practices** (10%) - Follows TypeScript/Node.js conventions?
5. **Security** (10%) - Vulnerabilities addressed?

**Total Score**: 0-100 points per agent

---

## Agent Assignments

### Architect MCP (Planning Agent)
**Task**: Create detailed implementation plan
**Expected Output**: 8-step plan with tools, params, dependencies
**Grading Focus**: Plan completeness, logical ordering, tool selection

### Autonomous Agent MCP (4 agents)

#### Agent 1: Code Generation (deepseek-coder)
**Task**: Generate TypeScript data models and Zod schemas
**Expected Output**: Complete types.ts file with interfaces, enums, validators
**Grading Focus**: Type safety, validation logic, JSDoc quality

#### Agent 2: Code Analysis (qwen-coder)
**Task**: Analyze generated code for issues
**Expected Output**: List of bugs, performance issues, security vulnerabilities
**Grading Focus**: Depth of analysis, actionable recommendations

#### Agent 3: Refactoring (codellama)
**Task**: Refactor API endpoints to follow SOLID principles
**Expected Output**: Refactored code with separation of concerns
**Grading Focus**: Code organization, maintainability improvements

#### Agent 4: Test Generation (qwen-coder)
**Task**: Generate comprehensive test suite
**Expected Output**: Vitest tests covering happy path, errors, edge cases
**Grading Focus**: Test coverage, edge case handling, assertions

### OpenAI Worker MCP (3 agents)

#### Agent 1: Mini Worker (gpt-4o-mini)
**Task**: Generate API documentation (OpenAPI spec)
**Expected Output**: Complete openapi.yaml with all endpoints documented
**Grading Focus**: Documentation completeness, accuracy, examples

#### Agent 2: Balanced Worker (gpt-4o)
**Task**: Design database schema with migrations
**Expected Output**: SQL migration files with indexes, constraints
**Grading Focus**: Schema design, index strategy, data integrity

#### Agent 3: Premium Worker (o1-preview)
**Task**: Security audit and threat modeling
**Expected Output**: Security report with vulnerabilities and mitigations
**Grading Focus**: Threat identification, mitigation strategies, depth

### Thinking Tools MCP (15 agents)

#### Agent 1: Devils Advocate
**Task**: Challenge the API design decisions
**Expected Output**: Risks, counterarguments, alternative approaches
**Grading Focus**: Critical thinking, risk identification

#### Agent 2: First Principles
**Task**: Break down task management to fundamentals
**Expected Output**: Core requirements, assumptions, alternative approaches
**Grading Focus**: Depth of analysis, insight quality

#### Agent 3: Root Cause Analysis
**Task**: Why do we need task management? (5 Whys)
**Expected Output**: Root cause chain, contributing factors, solutions
**Grading Focus**: Logical reasoning, actionable insights

#### Agent 4: SWOT Analysis
**Task**: Analyze the technical stack choice
**Expected Output**: Strengths, weaknesses, opportunities, threats
**Grading Focus**: Balanced analysis, strategic recommendations

#### Agent 5: Premortem Analysis
**Task**: Imagine the feature fails in production
**Expected Output**: Failure scenarios, warning signals, mitigations
**Grading Focus**: Scenario realism, preventive measures

#### Agent 6: Critical Thinking
**Task**: Evaluate the API design arguments
**Expected Output**: Claims, evidence quality, logical fallacies
**Grading Focus**: Logical rigor, evidence assessment

#### Agent 7: Lateral Thinking
**Task**: Generate creative alternatives to REST API
**Expected Output**: Unconventional approaches, analogies, provocative ideas
**Grading Focus**: Creativity, feasibility of alternatives

#### Agent 8: Red Team
**Task**: Attack the API design for vulnerabilities
**Expected Output**: Attack vectors, exploits, stress tests
**Grading Focus**: Thoroughness, exploit realism

#### Agent 9: Blue Team
**Task**: Defend against identified attacks
**Expected Output**: Defenses, monitoring, incident response
**Grading Focus**: Defense effectiveness, completeness

#### Agent 10: Decision Matrix
**Task**: Compare database options (PostgreSQL vs MongoDB vs MySQL)
**Expected Output**: Scored matrix, recommendation, tradeoffs
**Grading Focus**: Criteria selection, scoring accuracy

#### Agent 11: Socratic Questioning
**Task**: Deep inquiry into task management requirements
**Expected Output**: Clarifying, assumption, reasoning questions
**Grading Focus**: Question depth, insight generation

#### Agent 12: Systems Thinking
**Task**: Analyze task management as a system
**Expected Output**: Components, feedback loops, leverage points
**Grading Focus**: System understanding, interconnections

#### Agent 13: Scenario Planning
**Task**: Explore future states (1 year, 5 years)
**Expected Output**: Scenarios with probability, impact, preparations
**Grading Focus**: Scenario realism, strategic value

#### Agent 14: Brainstorming
**Task**: Generate 20+ feature ideas for task management
**Expected Output**: Categorized ideas, wild ideas, practical ideas
**Grading Focus**: Quantity, diversity, creativity

#### Agent 15: Mind Mapping
**Task**: Map task management domain concepts
**Expected Output**: Hierarchical structure, Mermaid diagram
**Grading Focus**: Completeness, organization, clarity

### Credit Optimizer MCP (Orchestration Agent)
**Task**: Execute autonomous workflow for the entire feature
**Expected Output**: Workflow execution report with steps, timing, results
**Grading Focus**: Workflow efficiency, error handling, completeness

### Robinson's Toolkit MCP (Integration Agent)
**Task**: Discover and recommend tools for deployment
**Expected Output**: Tool recommendations for CI/CD, monitoring, hosting
**Grading Focus**: Tool relevance, integration feasibility

---

## Execution Plan

**Total Agents**: 27 (1 + 4 + 3 + 15 + 1 + 1 + 2 sequential thinking agents)
**Estimated Time**: ~30 seconds per agent = ~13.5 minutes total
**Parallel Execution**: Where possible (Ollama: 2 concurrent, OpenAI: 1 concurrent)

---

## Expected Deliverables

1. **Implementation Plan** (Architect)
2. **TypeScript Code** (Autonomous Agent x4)
3. **API Documentation** (OpenAI Mini)
4. **Database Schema** (OpenAI Balanced)
5. **Security Report** (OpenAI Premium)
6. **Analysis Reports** (Thinking Tools x15)
7. **Workflow Report** (Credit Optimizer)
8. **Tool Recommendations** (Toolkit)
9. **Test Results Summary** (This file, updated)
10. **Grading Report** (AI self-assessment vs human baseline)

---

## Success Metrics

- ✅ All 27 agents complete without errors
- ✅ All outputs are relevant and actionable
- ✅ Code compiles and passes linting
- ✅ Tests pass (if generated)
- ✅ Security vulnerabilities identified and addressed
- ✅ Total execution time < 15 minutes
- ✅ Average quality score > 70/100

---

## Baseline (Human Expert Performance)

For comparison, a senior full-stack engineer would produce:

1. **Data Models**: Clean TypeScript interfaces with Zod validation (5 min)
2. **API Endpoints**: RESTful Express.js routes with error handling (10 min)
3. **Database Schema**: Normalized PostgreSQL schema with indexes (5 min)
4. **Tests**: 80%+ coverage with edge cases (10 min)
5. **Documentation**: Clear API docs and code comments (5 min)
6. **Security**: Input validation, SQL injection prevention, auth (5 min)
7. **Performance**: Indexed queries, pagination, caching strategy (5 min)

**Total Human Time**: ~45 minutes
**Expected Quality**: 85-95/100

**AI Goal**: Match or exceed human quality in < 15 minutes (3x faster)

---

## Test Execution

Run this test with:
```bash
# Start test
npm run test:comprehensive-agents

# Or manually execute each agent
# (See execution script below)
```

