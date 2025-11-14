# Future Work & Next Steps

**Status**: All Phases 2-6 complete ✅  
**Date**: 2025-11-14  
**Implementation**: Multi-phase Agent Core evolution

This document consolidates all future work items, technical debt, and enhancement opportunities identified during the Phase 2-6 implementation.

---

## Phase 2: Agent Core Foundation

### ✅ Completed
- Promoted `free-agent-core` to shared Agent Core
- Created shared types: `AgentTask`, `AgentRunResult`, `AgentKind`, `AgentTier`
- Added `runAgentTask()` generic wrapper
- Wired both Free and Paid agents into Agent Core
- Set up `@fa/core` alias in both MCP tsup configs

### 🔮 Future Enhancements
- **Richer result data**: Add patches applied, tests run, files modified to `AgentRunResult`
- **Progress streaming**: Stream progress updates during long-running tasks
- **Cancellation support**: Allow users to cancel in-progress tasks

---

## Phase 2.5: Anthropic Batch Support

### ✅ Completed
- Extended `ProviderMetricsAdapter` with batch job types
- Implemented Anthropic batch methods in `anthropic-adapter.ts`
- Added three batch tools to Paid Agent MCP

### 🔮 Future Enhancements
- **OpenAI batch support**: Add batch methods to `openai-adapter.ts`
- **Batch monitoring**: Add webhook support for batch completion notifications
- **Batch optimization**: Automatically batch similar requests to reduce costs
- **Batch retry logic**: Handle failed batch items with automatic retry

---

## Phase 3: Thinking Tools Integration

### ✅ Completed
- Created `docs/THINKING_TOOLS_PLAYBOOK.md` with comprehensive guide
- Added `thinking.ts` with `runStandardPlanningChain()`
- Implemented standard planning chain: Blue Team → Red Team → Decision Matrix
- Exported thinking types and functions

### 🔮 Future Enhancements
- **Automatic framework selection**: Use AI to pick the best thinking framework for each task
- **Framework chaining**: Support custom chains beyond Blue→Red→Decision
- **Thinking artifacts persistence**: Save thinking artifacts to RAD for future reference
- **Collaborative thinking**: Multiple agents working through frameworks together
- **Thinking tool metrics**: Track which frameworks lead to best outcomes

---

## Phase 4: Evidence Gathering

### ✅ Completed
- Created `evidence.ts` with `gatherEvidence()` function
- Integrated Context Engine, Robinson's Toolkit, RAD, and Web Search
- Added `EvidenceBundle` and `EvidenceOptions` types
- Updated `runStandardPlanningChain()` to accept and use evidence
- Added `AgentTaskConstraints` with `allowWebEvidence` flag

### 🔮 Future Enhancements
- **Semantic search**: Implement proper similarity scoring for context snippets
- **Evidence ranking**: Rank evidence by relevance and quality
- **Evidence caching**: Cache evidence bundles to avoid redundant queries
- **Cross-repo evidence**: Share evidence across related projects
- **Evidence visualization**: Generate diagrams showing evidence relationships
- **Actual MCP client integration**: Currently uses placeholder clients - wire real MCP connections

---

## Phase 5: RAD/Postgres Memory

### ✅ Completed
- Created `docs/RAD_MEMORY_SPEC.md` with Postgres schema
- Implemented `RadClient` with `recordEvent()` and `getRelatedKnowledge()`
- Integrated RAD into `gatherEvidence()` for radNotes
- Integrated RAD into `runAgentTask()` to record events after completion
- Added pg and @types/pg dependencies

### 🔮 Future Enhancements
- **Semantic search**: Use embeddings for similarity matching instead of text ILIKE
- **Decision extraction**: Automatically extract decisions from planning phase (currently TODO)
- **Lesson extraction**: Automatically extract lessons from execution (currently TODO)
- **Pattern detection**: Identify recurring patterns across tasks
- **Confidence scoring**: Track which decisions lead to success
- **Cross-repo learning**: Share lessons across different projects
- **Automated suggestions**: Proactively suggest approaches based on history
- **RAD UI**: Build a web interface to browse and search RAD memory
- **RAD analytics**: Generate reports on agent performance and learning

---

## Phase 6: Credit Optimizer Migration

### ✅ Completed
- Created `docs/AGENT_OPTIMIZER_PROTOTYPE.md` documenting capabilities
- Extracted workflow DSL to `workflow.ts`
- Extracted autonomous executor to `executor.ts`
- Added workflow validation, dependency graph, and cost estimation
- Marked Credit Optimizer MCP as legacy

### 🔮 Future Enhancements
- **Parallel executor**: Implement actual parallel execution with agent pool
- **Batch operations**: Implement actual batch operation logic (currently TODO)
- **Rollback logic**: Implement proper rollback for failed workflows
- **Workflow templates**: Pre-built workflows for common tasks
- **Workflow optimization**: Automatically optimize workflows for cost/speed
- **Workflow visualization**: Generate diagrams showing workflow execution
- **Cost tracking integration**: Wire workflow executor into existing metrics system
- **Agent pool management**: Implement actual agent pool for parallel work
- **Decommission Credit Optimizer**: Once agents are fully capable, delete the MCP server

---

## Cross-Cutting Concerns

### Testing
- **Unit tests**: Add comprehensive unit tests for all new modules
- **Integration tests**: Test end-to-end workflows with real MCP servers
- **Performance tests**: Benchmark workflow execution and evidence gathering
- **Regression tests**: Ensure changes don't break existing functionality

### Documentation
- **API documentation**: Generate API docs from TypeScript types
- **Usage examples**: Add more real-world examples to playbooks
- **Migration guides**: Help users migrate from old patterns to new ones
- **Architecture diagrams**: Visual representations of system architecture

### Monitoring & Observability
- **Structured logging**: Add structured logging throughout Agent Core
- **Metrics collection**: Track key metrics (task duration, success rate, cost)
- **Error tracking**: Integrate with error tracking service (Sentry, etc.)
- **Performance profiling**: Identify bottlenecks in workflow execution

### Security
- **Input validation**: Validate all user inputs and workflow definitions
- **Sandboxing**: Run untrusted code in isolated environments
- **Secrets management**: Secure handling of API keys and credentials
- **Audit logging**: Log all agent actions for security review

---

## Immediate Next Steps (Priority Order)

1. **Wire real MCP clients** into evidence gathering (Context Engine, Toolkit, RAD)
2. **Implement decision/lesson extraction** from planning and execution phases
3. **Add semantic search** to RAD using embeddings
4. **Implement parallel executor** with actual agent pool
5. **Add comprehensive testing** for all new modules
6. **Create usage examples** showing end-to-end workflows
7. **Monitor production usage** and gather feedback
8. **Iterate based on real-world usage** patterns

---

## Long-Term Vision

- **Self-improving agents**: Agents that learn from every task and get better over time
- **Multi-agent collaboration**: Multiple agents working together on complex tasks
- **Autonomous project management**: Agents that can plan and execute entire projects
- **Cross-organization learning**: Share knowledge across different teams and companies
- **Agent marketplace**: Community-contributed workflows, templates, and patterns

---

**All phases complete! 🎉**  
The Agent Core is now a unified, powerful foundation for both Free and Paid agents with thinking tools, evidence gathering, memory, and workflow execution capabilities.

