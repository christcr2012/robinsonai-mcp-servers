/**
 * First Principles Thinking Tool
 * Breaks down complex problems to fundamental truths and builds up from there
 * Enhanced with context search to find relevant code/docs
 */

import { withContext } from '../lib/context-enhancer.js';

export interface FirstPrinciplesInput {
  problem: string;
  domain?: string;
  depth?: 'quick' | 'deep';
  useContext?: boolean;
  contextQuery?: string;
}

export interface FirstPrinciplesOutput {
  fundamentals: string[];
  assumptions: string[];
  derivedInsights: string[];
  alternativeApproaches: string[];
  confidence: number;
  reasoning: string;
}

export function firstPrinciples(input: FirstPrinciplesInput): FirstPrinciplesOutput {
  const { problem, domain, depth = 'quick' } = input;
  
  const fundamentals: string[] = [];
  const assumptions: string[] = [];
  const derivedInsights: string[] = [];
  const alternativeApproaches: string[] = [];
  
  const lowerProblem = problem.toLowerCase();
  
  // Authentication/Security domain
  if (lowerProblem.includes('auth') || lowerProblem.includes('login') || lowerProblem.includes('security')) {
    fundamentals.push('Authentication = proving identity');
    fundamentals.push('Authorization = granting permissions');
    fundamentals.push('Session = maintaining state across requests');
    
    assumptions.push('Assuming users have unique identifiers');
    assumptions.push('Assuming secure communication channel (HTTPS)');
    assumptions.push('Assuming ability to store secrets securely');
    
    derivedInsights.push('Identity can be proven by: something you know (password), something you have (token), something you are (biometric)');
    derivedInsights.push('Sessions can be: stateful (server-side) or stateless (JWT)');
    derivedInsights.push('Permissions can be: role-based (RBAC) or attribute-based (ABAC)');
    
    alternativeApproaches.push('Use OAuth/OIDC instead of custom auth');
    alternativeApproaches.push('Use magic links instead of passwords');
    alternativeApproaches.push('Use session tokens instead of JWT');
    alternativeApproaches.push('Use API keys for service-to-service auth');
  }
  
  // Caching domain
  if (lowerProblem.includes('cache') || lowerProblem.includes('performance') || lowerProblem.includes('speed')) {
    fundamentals.push('Cache = fast storage for frequently accessed data');
    fundamentals.push('Cache hit = data found in cache');
    fundamentals.push('Cache miss = data not in cache, fetch from source');
    fundamentals.push('Cache invalidation = removing stale data');
    
    assumptions.push('Assuming some data is accessed more frequently than others');
    assumptions.push('Assuming data doesn\'t change too frequently');
    assumptions.push('Assuming faster storage is available (RAM vs disk)');
    
    derivedInsights.push('Cache can be: in-memory (Redis), on-disk (file system), or distributed (CDN)');
    derivedInsights.push('Invalidation strategies: TTL (time-based), LRU (least recently used), manual');
    derivedInsights.push('Cache layers: browser → CDN → application → database');
    
    alternativeApproaches.push('Use CDN for static assets');
    alternativeApproaches.push('Use Redis for session data');
    alternativeApproaches.push('Use in-memory cache for computed results');
    alternativeApproaches.push('Use database query cache');
  }
  
  // Database/Storage domain
  if (lowerProblem.includes('database') || lowerProblem.includes('storage') || lowerProblem.includes('data')) {
    fundamentals.push('Data storage = persisting information for later retrieval');
    fundamentals.push('CRUD = Create, Read, Update, Delete');
    fundamentals.push('Consistency = all nodes see same data');
    fundamentals.push('Durability = data survives failures');
    
    assumptions.push('Assuming data needs to persist beyond application lifetime');
    assumptions.push('Assuming data has structure or relationships');
    assumptions.push('Assuming concurrent access is needed');
    
    derivedInsights.push('Storage types: relational (SQL), document (MongoDB), key-value (Redis), graph (Neo4j)');
    derivedInsights.push('Trade-offs: consistency vs availability vs partition tolerance (CAP theorem)');
    derivedInsights.push('Scaling: vertical (bigger machine) vs horizontal (more machines)');
    
    alternativeApproaches.push('Use PostgreSQL for structured data with relationships');
    alternativeApproaches.push('Use MongoDB for flexible schema');
    alternativeApproaches.push('Use S3 for file storage');
    alternativeApproaches.push('Use Redis for temporary data');
  }
  
  // API/Communication domain
  if (lowerProblem.includes('api') || lowerProblem.includes('endpoint') || lowerProblem.includes('communication')) {
    fundamentals.push('API = interface for programs to communicate');
    fundamentals.push('Request = asking for data or action');
    fundamentals.push('Response = returning data or result');
    fundamentals.push('Protocol = agreed-upon communication rules');
    
    assumptions.push('Assuming network connectivity');
    assumptions.push('Assuming client and server can understand each other');
    assumptions.push('Assuming requests can fail and need retry logic');
    
    derivedInsights.push('API styles: REST (resource-based), GraphQL (query-based), RPC (function-based), WebSocket (bidirectional)');
    derivedInsights.push('Data formats: JSON, XML, Protocol Buffers, MessagePack');
    derivedInsights.push('Error handling: HTTP status codes, error objects, retry strategies');
    
    alternativeApproaches.push('Use REST for simple CRUD operations');
    alternativeApproaches.push('Use GraphQL for flexible client queries');
    alternativeApproaches.push('Use WebSocket for real-time updates');
    alternativeApproaches.push('Use gRPC for service-to-service communication');
  }
  
  // Testing domain
  if (lowerProblem.includes('test') || lowerProblem.includes('quality') || lowerProblem.includes('bug')) {
    fundamentals.push('Testing = verifying code behaves as expected');
    fundamentals.push('Unit test = test individual function');
    fundamentals.push('Integration test = test components together');
    fundamentals.push('E2E test = test entire user flow');
    
    assumptions.push('Assuming code can be tested in isolation');
    assumptions.push('Assuming tests can run automatically');
    assumptions.push('Assuming tests are faster than manual verification');
    
    derivedInsights.push('Test pyramid: many unit tests, some integration tests, few E2E tests');
    derivedInsights.push('Test coverage measures code exercised, not correctness');
    derivedInsights.push('Flaky tests are worse than no tests');
    
    alternativeApproaches.push('Use Jest for unit tests');
    alternativeApproaches.push('Use Playwright for E2E tests');
    alternativeApproaches.push('Use property-based testing for edge cases');
    alternativeApproaches.push('Use snapshot testing for UI components');
  }
  
  // Deployment/Infrastructure domain
  if (lowerProblem.includes('deploy') || lowerProblem.includes('infrastructure') || lowerProblem.includes('server')) {
    fundamentals.push('Deployment = making code available to users');
    fundamentals.push('Server = computer that runs your code');
    fundamentals.push('Scaling = handling more users/requests');
    fundamentals.push('Monitoring = observing system health');
    
    assumptions.push('Assuming code runs differently in production than development');
    assumptions.push('Assuming failures will happen');
    assumptions.push('Assuming need to rollback bad deployments');
    
    derivedInsights.push('Deployment strategies: blue-green, canary, rolling, recreate');
    derivedInsights.push('Infrastructure: VMs, containers, serverless, edge');
    derivedInsights.push('Observability: logs, metrics, traces');
    
    alternativeApproaches.push('Use Vercel for frontend deployments');
    alternativeApproaches.push('Use Docker for containerization');
    alternativeApproaches.push('Use Kubernetes for orchestration');
    alternativeApproaches.push('Use serverless for variable workloads');
  }
  
  // Generic problem breakdown
  if (fundamentals.length === 0) {
    fundamentals.push('Break problem into smallest components');
    fundamentals.push('Identify what is known vs unknown');
    fundamentals.push('Separate facts from assumptions');
    
    assumptions.push('Assuming problem is solvable');
    assumptions.push('Assuming constraints are real, not imagined');
    
    derivedInsights.push('Complex problems are often simple problems combined');
    derivedInsights.push('Most "new" problems have existing solutions');
    
    alternativeApproaches.push('Research how others solved similar problems');
    alternativeApproaches.push('Start with simplest possible solution');
    alternativeApproaches.push('Question all constraints');
  }
  
  if (depth === 'deep') {
    fundamentals.push('All software is: input → processing → output');
    fundamentals.push('All systems have: components, connections, constraints');
    derivedInsights.push('Complexity emerges from interactions, not components');
    derivedInsights.push('Abstractions hide details but add indirection');
  }
  
  const confidence = fundamentals.length >= 3 ? 0.9 : 0.7;

  const reasoning = `Broke down problem into ${fundamentals.length} fundamental truths, identified ${assumptions.length} assumptions, derived ${derivedInsights.length} insights, and found ${alternativeApproaches.length} alternative approaches.`;

  return {
    fundamentals,
    assumptions,
    derivedInsights,
    alternativeApproaches,
    confidence,
    reasoning
  };
}

/**
 * Enhanced version with context search
 */
export const firstPrinciplesEnhanced = withContext(
  firstPrinciples,
  (input) => `${input.problem} ${input.domain || ''}`.slice(0, 200)
);

