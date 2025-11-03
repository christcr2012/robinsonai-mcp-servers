/**
 * Red Team Thinking Tool
 * Attack the plan/design to find vulnerabilities and weaknesses
 * Enhanced with context search to find relevant code/docs
 */

import { withContext } from '../lib/context-enhancer.js';

export interface RedTeamInput {
  plan: string;
  context?: string;
  focus?: 'security' | 'reliability' | 'performance' | 'all';
  useContext?: boolean;
  contextQuery?: string;
}

export interface RedTeamOutput {
  attackVectors: Array<{ vector: string; severity: 'critical' | 'high' | 'medium' | 'low'; impact: string }>;
  exploits: Array<{ exploit: string; howTo: string; mitigation: string }>;
  edgeCases: string[];
  stressTests: Array<{ scenario: string; expectedFailure: string }>;
  recommendations: string[];
  confidence: number;
  reasoning: string;
}

export function redTeam(input: RedTeamInput): RedTeamOutput {
  const { plan, context = '', focus = 'all' } = input;
  const combined = `${plan} ${context}`.toLowerCase();
  
  const attackVectors: Array<{ vector: string; severity: 'critical' | 'high' | 'medium' | 'low'; impact: string }> = [];
  const exploits: Array<{ exploit: string; howTo: string; mitigation: string }> = [];
  const edgeCases: string[] = [];
  const stressTests: Array<{ scenario: string; expectedFailure: string }> = [];
  const recommendations: string[] = [];
  
  // Security attack vectors
  if (focus === 'security' || focus === 'all') {
    if (combined.includes('api') || combined.includes('endpoint')) {
      attackVectors.push({
        vector: 'API Injection Attacks',
        severity: 'critical',
        impact: 'SQL injection, NoSQL injection, command injection could compromise entire database'
      });
      
      exploits.push({
        exploit: 'Mass Assignment Vulnerability',
        howTo: 'Send extra fields in API request to modify unintended properties (e.g., isAdmin: true)',
        mitigation: 'Use explicit allow-lists for input fields, never trust client input'
      });
      
      attackVectors.push({
        vector: 'Rate Limiting Bypass',
        severity: 'high',
        impact: 'Attacker could DDoS the API or scrape all data'
      });
    }
    
    if (combined.includes('auth') || combined.includes('login') || combined.includes('token')) {
      attackVectors.push({
        vector: 'Authentication Bypass',
        severity: 'critical',
        impact: 'Attacker gains unauthorized access to user accounts'
      });
      
      exploits.push({
        exploit: 'JWT Secret Brute Force',
        howTo: 'If JWT secret is weak, attacker can forge tokens and impersonate any user',
        mitigation: 'Use strong secrets (256+ bits), rotate regularly, use asymmetric signing'
      });
      
      exploits.push({
        exploit: 'Session Fixation',
        howTo: 'Attacker sets victim\'s session ID, then hijacks session after victim logs in',
        mitigation: 'Regenerate session ID on login, use secure cookies with SameSite'
      });
    }
    
    if (combined.includes('upload') || combined.includes('file')) {
      attackVectors.push({
        vector: 'Malicious File Upload',
        severity: 'critical',
        impact: 'Attacker uploads executable code (shell, malware) and executes it on server'
      });
      
      exploits.push({
        exploit: 'Path Traversal via Filename',
        howTo: 'Upload file named "../../etc/passwd" to overwrite system files',
        mitigation: 'Sanitize filenames, store uploads outside webroot, validate file types'
      });
    }
    
    if (combined.includes('cors') || combined.includes('cross-origin')) {
      attackVectors.push({
        vector: 'CORS Misconfiguration',
        severity: 'high',
        impact: 'Attacker site can make authenticated requests on behalf of victim'
      });
    }
  }
  
  // Reliability attack vectors
  if (focus === 'reliability' || focus === 'all') {
    if (combined.includes('database') || combined.includes('db')) {
      attackVectors.push({
        vector: 'Database Connection Pool Exhaustion',
        severity: 'high',
        impact: 'All connections consumed, new requests fail, service goes down'
      });
      
      stressTests.push({
        scenario: 'Simulate 10,000 concurrent slow queries',
        expectedFailure: 'Connection pool exhausted, requests timeout, cascading failures'
      });
    }
    
    if (combined.includes('cache') || combined.includes('redis')) {
      attackVectors.push({
        vector: 'Cache Stampede',
        severity: 'high',
        impact: 'Cache expires, all requests hit database simultaneously, database crashes'
      });
      
      stressTests.push({
        scenario: 'Invalidate hot cache key during peak traffic',
        expectedFailure: 'Database overwhelmed with identical queries, response times spike'
      });
    }
    
    if (combined.includes('queue') || combined.includes('job')) {
      attackVectors.push({
        vector: 'Queue Poisoning',
        severity: 'medium',
        impact: 'Malformed job crashes worker, blocks queue, prevents all jobs from processing'
      });
    }
    
    if (combined.includes('microservice') || combined.includes('distributed')) {
      attackVectors.push({
        vector: 'Cascading Failures',
        severity: 'critical',
        impact: 'One service fails, causes retry storms, brings down entire system'
      });
      
      stressTests.push({
        scenario: 'Kill one critical service during peak load',
        expectedFailure: 'Dependent services retry aggressively, exhaust resources, all services fail'
      });
    }
  }
  
  // Performance attack vectors
  if (focus === 'performance' || focus === 'all') {
    if (combined.includes('search') || combined.includes('query')) {
      attackVectors.push({
        vector: 'Expensive Query Attack',
        severity: 'high',
        impact: 'Attacker crafts queries that consume excessive CPU/memory, slows down service'
      });
      
      exploits.push({
        exploit: 'Regex DoS (ReDoS)',
        howTo: 'Send input that causes catastrophic backtracking in regex (e.g., (a+)+b)',
        mitigation: 'Use regex timeout, validate input length, avoid nested quantifiers'
      });
    }
    
    if (combined.includes('pagination') || combined.includes('offset')) {
      attackVectors.push({
        vector: 'Deep Pagination Attack',
        severity: 'medium',
        impact: 'Request page 1,000,000 to force expensive OFFSET query'
      });
    }
  }
  
  // Edge cases
  edgeCases.push('What happens when input is empty string?');
  edgeCases.push('What happens when input is null or undefined?');
  edgeCases.push('What happens when input is extremely large (1GB+)?');
  edgeCases.push('What happens when user sends 1000 requests simultaneously?');
  edgeCases.push('What happens when database is down?');
  edgeCases.push('What happens when external API is slow (30+ seconds)?');
  edgeCases.push('What happens when disk is full?');
  edgeCases.push('What happens when memory is exhausted?');
  edgeCases.push('What happens during deployment (rolling restart)?');
  edgeCases.push('What happens when clock skew occurs between servers?');
  
  // Recommendations
  recommendations.push('Implement rate limiting per user and per IP');
  recommendations.push('Add input validation and sanitization at every boundary');
  recommendations.push('Use circuit breakers for external dependencies');
  recommendations.push('Implement request timeouts and deadlines');
  recommendations.push('Add comprehensive error handling and graceful degradation');
  recommendations.push('Monitor for anomalous patterns (sudden traffic spikes, error rates)');
  recommendations.push('Implement chaos engineering tests (kill services randomly)');
  recommendations.push('Use security headers (CSP, HSTS, X-Frame-Options)');
  recommendations.push('Encrypt sensitive data at rest and in transit');
  recommendations.push('Implement audit logging for all sensitive operations');
  
  const confidence = 75;

  return {
    attackVectors,
    exploits,
    edgeCases,
    stressTests,
    recommendations,
    confidence,
    reasoning: `Red team analysis identified ${attackVectors.length} attack vectors, ${exploits.length} specific exploits, ${edgeCases.length} edge cases, and ${stressTests.length} stress test scenarios.`
  };
}

/**
 * Enhanced version with context search
 */
export const redTeamEnhanced = withContext(
  redTeam,
  (input) => `${input.plan} ${input.context || ''}`.slice(0, 200)
);

