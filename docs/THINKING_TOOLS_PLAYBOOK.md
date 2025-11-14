# Thinking Tools Playbook

**For Agent Use**: This document explains when and how to use each thinking tool category.

## Core Cognitive Frameworks (24 tools)

### Strategic Planning & Analysis
- **`framework_blue_team`** - Brainstorm strategies, generate approaches, defensive planning
  - Use when: Planning features, designing systems, building defenses
  - Example: "How should we implement user authentication?"

- **`framework_red_team`** - Find weaknesses, attack plans, identify vulnerabilities
  - Use when: Security review, stress-testing designs, finding edge cases
  - Example: "What could go wrong with this API design?"

- **`framework_decision_matrix`** - Compare 3+ options with weighted criteria
  - Use when: Choosing between multiple approaches, technology selection
  - Example: "Should we use PostgreSQL, MongoDB, or DynamoDB?"

- **`framework_swot`** - Analyze Strengths, Weaknesses, Opportunities, Threats
  - Use when: Evaluating technologies, assessing project health
  - Example: "Evaluate our current microservices architecture"

- **`framework_premortem`** - Imagine failure and work backward
  - Use when: Risk assessment, planning critical features
  - Example: "What if this deployment fails catastrophically?"

### Problem Solving
- **`framework_root_cause`** - 5 Whys technique for underlying causes
  - Use when: Debugging recurring issues, understanding system failures
  - Example: "Why do users keep getting logged out?"

- **`framework_first_principles`** - Break down to fundamental truths
  - Use when: Challenging assumptions, rethinking architecture
  - Example: "Do we really need a database for this?"

- **`framework_systems_thinking`** - Understand interconnections and feedback loops
  - Use when: Complex system design, understanding dependencies
  - Example: "How does caching affect our rate limiting?"

- **`framework_second_order_thinking`** - Consider consequences of consequences
  - Use when: Long-term planning, architectural decisions
  - Example: "If we add this feature, what happens next?"

### Creative Thinking
- **`framework_lateral_thinking`** - Generate non-obvious solutions
  - Use when: Stuck on a problem, need creative approaches
  - Example: "How else could we solve this performance issue?"

- **`framework_brainstorming`** - Generate many ideas quickly
  - Use when: Feature ideation, exploring possibilities
  - Example: "What features would make this product better?"

- **`framework_mind_mapping`** - Visual organization of concepts
  - Use when: Planning complex features, organizing knowledge
  - Example: "Map out the user onboarding flow"

- **`framework_inversion`** - Think backwards from failure
  - Use when: Avoiding pitfalls, defensive design
  - Example: "How could we make this system fail?"

### Critical Analysis
- **`framework_critical_thinking`** - Evaluate arguments and evidence
  - Use when: Code review, evaluating proposals
  - Example: "Is this performance optimization worth the complexity?"

- **`framework_socratic`** - Deep inquiry through questions
  - Use when: Understanding requirements, clarifying goals
  - Example: "Why do users need this feature?"

- **`framework_devils_advocate`** - Challenge assumptions and plans
  - Use when: Validating designs, stress-testing ideas
  - Example: "What's wrong with this approach?"

### Decision Making
- **`framework_ooda_loop`** - Observe, Orient, Decide, Act cycle
  - Use when: Rapid iteration, tactical decisions
  - Example: "How should we respond to this production issue?"

- **`framework_cynefin_framework`** - Categorize problems by complexity
  - Use when: Choosing problem-solving approach
  - Example: "Is this a simple fix or a complex refactor?"

- **`framework_scenario_planning`** - Explore multiple futures
  - Use when: Long-term planning, risk assessment
  - Example: "What if our user base 10x in 6 months?"

- **`framework_design_thinking`** - Human-centered problem solving
  - Use when: UX design, user-facing features
  - Example: "How can we make this feature more intuitive?"

### Probabilistic Reasoning
- **`framework_probabilistic_thinking`** - Reason with uncertainty
  - Use when: Risk assessment, estimating outcomes
  - Example: "What's the likelihood this migration succeeds?"

- **`framework_bayesian_updating`** - Update beliefs with evidence
  - Use when: Iterative learning, hypothesis testing
  - Example: "Does this test result change our approach?"

## Context Engine Tools (20 tools)

### Code Search & Navigation
- **`context_smart_query`** - Intelligent routing to best search method
  - Use when: General code search, finding functionality
  - Example: "Where is user authentication handled?"

- **`context_query`** - Semantic code search
  - Use when: Finding similar code, concept search
  - Example: "Find all database connection code"

- **`context_find_symbol`** - Find specific symbol definition
  - Use when: Looking for function/class definition
  - Example: "Where is UserService defined?"

- **`context_neighborhood`** - Get file context and related code
  - Use when: Understanding file dependencies
  - Example: "What imports does auth.ts use?"

### Documentation Management
- **`docs_find`** - Find docs by type/status
  - Use when: Looking for plans, RFCs, decisions
  - Example: "Find all approved design docs"

- **`docs_audit_repo`** - Cross-reference docs against code
  - Use when: Checking implementation status
  - Example: "What planned features are missing?"

### Web & External Context
- **`context_web_search`** - Search web with DuckDuckGo
  - Use when: Need external information
  - Example: "Latest best practices for React hooks"

- **`context7_search_libraries`** - Search library documentation
  - Use when: Using external libraries
  - Example: "How to use Stripe webhooks?"

## Evidence & Analysis Tools (10 tools)

### Evidence Collection
- **`think_collect_evidence`** - Gather repo files for analysis
  - Use when: Preparing for major analysis
  - Example: "Collect all TypeScript files for review"

- **`evidence_import`** - Import external evidence
  - Use when: Integrating Context7 or web results
  - Example: "Import API documentation for analysis"

### Automated Analysis
- **`think_swot`** - Auto-generate SWOT from evidence
  - Use when: Quick strategic analysis
  - Example: "SWOT analysis of our testing strategy"

- **`think_premortem`** - Auto-generate premortem from evidence
  - Use when: Risk assessment with context
  - Example: "Premortem for database migration"

- **`think_decision_matrix`** - Create decision matrix
  - Use when: Structured comparison needed
  - Example: "Compare deployment platforms"

## Standard Planning Chain

**For every agent task, use this sequence:**

1. **Blue Team** (`framework_blue_team`) - Generate 3-5 approaches
2. **Red Team** (`framework_red_team`) - Critique each approach
3. **Decision Matrix** (`framework_decision_matrix`) - Pick the best plan

**Example:**
```
Task: "Implement rate limiting"

1. Blue Team: Generate approaches (token bucket, sliding window, fixed window)
2. Red Team: Find weaknesses (token bucket: memory overhead, sliding window: complexity)
3. Decision Matrix: Compare on criteria (performance, simplicity, accuracy)
```

## Tool Selection Guide

| Situation | Primary Tool | Secondary Tools |
|-----------|-------------|-----------------|
| Planning feature | `framework_blue_team` | `framework_premortem`, `framework_swot` |
| Debugging issue | `framework_root_cause` | `context_smart_query`, `framework_systems_thinking` |
| Choosing approach | `framework_decision_matrix` | `framework_swot`, `framework_critical_thinking` |
| Security review | `framework_red_team` | `framework_devils_advocate`, `framework_premortem` |
| Understanding code | `context_smart_query` | `context_neighborhood`, `context_find_symbol` |
| Risk assessment | `framework_premortem` | `framework_scenario_planning`, `framework_swot` |
| Creative problem | `framework_lateral_thinking` | `framework_brainstorming`, `framework_inversion` |

## Best Practices

1. **Always use the standard planning chain** for non-trivial tasks
2. **Gather evidence first** with `think_collect_evidence` or `context_smart_query`
3. **Use multiple frameworks** for important decisions
4. **Document reasoning** - thinking tools create artifacts for future reference
5. **Iterate** - use `framework_bayesian_updating` to refine based on new evidence

