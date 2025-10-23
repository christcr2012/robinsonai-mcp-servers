/**
 * Blue Team Thinking Tool
 * Defend against attacks and strengthen the plan/design
 */

export interface BlueTeamInput {
  plan: string;
  threats?: string[];
  context?: string;
}

export interface BlueTeamOutput {
  defenses: Array<{ threat: string; defense: string; effectiveness: number }>;
  monitoringStrategy: Array<{ metric: string; threshold: string; action: string }>;
  incidentResponse: Array<{ scenario: string; response: string; priority: 'critical' | 'high' | 'medium' | 'low' }>;
  hardeningSteps: string[];
  resilienceImprovements: string[];
  confidence: number;
  reasoning: string;
}

export function blueTeam(input: BlueTeamInput): BlueTeamOutput {
  const { plan, threats = [], context = '' } = input;
  const combined = `${plan} ${context}`.toLowerCase();
  
  const defenses: Array<{ threat: string; defense: string; effectiveness: number }> = [];
  const monitoringStrategy: Array<{ metric: string; threshold: string; action: string }> = [];
  const incidentResponse: Array<{ scenario: string; response: string; priority: 'critical' | 'high' | 'medium' | 'low' }> = [];
  const hardeningSteps: string[] = [];
  const resilienceImprovements: string[] = [];
  
  // Defenses against common threats
  if (combined.includes('api') || combined.includes('endpoint')) {
    defenses.push({
      threat: 'API Injection Attacks',
      defense: 'Implement parameterized queries, input validation with allow-lists, and WAF rules',
      effectiveness: 90
    });
    
    defenses.push({
      threat: 'Rate Limiting Bypass',
      defense: 'Multi-layer rate limiting: per-IP, per-user, per-endpoint with Redis-backed sliding window',
      effectiveness: 85
    });
    
    hardeningSteps.push('Enable API request signing to prevent replay attacks');
    hardeningSteps.push('Implement request size limits (max 1MB payload)');
    hardeningSteps.push('Add API versioning to allow safe deprecation');
    
    monitoringStrategy.push({
      metric: 'API error rate',
      threshold: '>5% errors in 5 minutes',
      action: 'Alert on-call, enable circuit breaker if >20%'
    });
    
    monitoringStrategy.push({
      metric: 'Request rate per IP',
      threshold: '>100 req/sec from single IP',
      action: 'Auto-block IP for 1 hour, alert security team'
    });
  }
  
  if (combined.includes('auth') || combined.includes('login') || combined.includes('token')) {
    defenses.push({
      threat: 'Authentication Bypass',
      defense: 'Multi-factor authentication, JWT with short expiry (15min), refresh token rotation',
      effectiveness: 95
    });
    
    defenses.push({
      threat: 'Session Hijacking',
      defense: 'Secure cookies (HttpOnly, Secure, SameSite=Strict), session fingerprinting, IP validation',
      effectiveness: 85
    });
    
    hardeningSteps.push('Implement account lockout after 5 failed login attempts');
    hardeningSteps.push('Use bcrypt/argon2 for password hashing with high cost factor');
    hardeningSteps.push('Enforce strong password policy (12+ chars, complexity)');
    hardeningSteps.push('Add CAPTCHA after 3 failed login attempts');
    
    monitoringStrategy.push({
      metric: 'Failed login attempts',
      threshold: '>10 failures from same IP in 1 minute',
      action: 'Block IP, alert security team, check for credential stuffing'
    });
    
    incidentResponse.push({
      scenario: 'Suspected account takeover',
      response: '1) Force logout all sessions 2) Require password reset 3) Enable MFA 4) Notify user via email/SMS',
      priority: 'critical'
    });
  }
  
  if (combined.includes('database') || combined.includes('db')) {
    defenses.push({
      threat: 'Database Connection Exhaustion',
      defense: 'Connection pooling with max limits, query timeout (5s), read replicas for load distribution',
      effectiveness: 80
    });
    
    defenses.push({
      threat: 'SQL Injection',
      defense: 'Parameterized queries only, ORM with query builder, database user with minimal privileges',
      effectiveness: 95
    });
    
    hardeningSteps.push('Enable database query logging for slow queries (>1s)');
    hardeningSteps.push('Implement database backups every 6 hours with point-in-time recovery');
    hardeningSteps.push('Use separate read-only database user for reporting queries');
    
    monitoringStrategy.push({
      metric: 'Database connection pool usage',
      threshold: '>80% pool utilization',
      action: 'Alert on-call, scale up pool size or add read replica'
    });
    
    incidentResponse.push({
      scenario: 'Database corruption detected',
      response: '1) Stop writes immediately 2) Restore from last known good backup 3) Replay transaction logs 4) Validate data integrity',
      priority: 'critical'
    });
  }
  
  if (combined.includes('cache') || combined.includes('redis')) {
    defenses.push({
      threat: 'Cache Stampede',
      defense: 'Probabilistic early expiration, cache warming, request coalescing for identical keys',
      effectiveness: 85
    });
    
    hardeningSteps.push('Implement cache versioning for safe invalidation');
    hardeningSteps.push('Add cache hit/miss ratio monitoring');
    
    monitoringStrategy.push({
      metric: 'Cache hit rate',
      threshold: '<70% hit rate',
      action: 'Alert on-call, investigate cache invalidation patterns'
    });
  }
  
  if (combined.includes('microservice') || combined.includes('distributed')) {
    defenses.push({
      threat: 'Cascading Failures',
      defense: 'Circuit breakers (fail fast after 5 errors), bulkheads (isolate resources), timeouts (3s max)',
      effectiveness: 90
    });
    
    defenses.push({
      threat: 'Service Discovery Failure',
      defense: 'Client-side load balancing with health checks, fallback to cached service registry',
      effectiveness: 80
    });
    
    resilienceImprovements.push('Implement retry with exponential backoff (max 3 retries)');
    resilienceImprovements.push('Add graceful degradation (serve stale data if service down)');
    resilienceImprovements.push('Use idempotency keys for safe retries');
    resilienceImprovements.push('Implement request hedging (send duplicate request if slow)');
    
    monitoringStrategy.push({
      metric: 'Service-to-service latency',
      threshold: 'p99 >500ms',
      action: 'Alert on-call, check for network issues or downstream slowness'
    });
    
    incidentResponse.push({
      scenario: 'Critical service down',
      response: '1) Enable circuit breaker 2) Serve cached/stale data 3) Scale up healthy instances 4) Investigate root cause',
      priority: 'critical'
    });
  }
  
  // General hardening steps
  hardeningSteps.push('Enable HTTPS only with TLS 1.3, disable older protocols');
  hardeningSteps.push('Implement security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)');
  hardeningSteps.push('Use principle of least privilege for all service accounts');
  hardeningSteps.push('Enable audit logging for all sensitive operations');
  hardeningSteps.push('Implement automated security scanning (SAST, DAST, dependency scanning)');
  hardeningSteps.push('Use secrets management (Vault, AWS Secrets Manager) instead of env vars');
  
  // General resilience improvements
  resilienceImprovements.push('Implement health check endpoints (/health, /ready)');
  resilienceImprovements.push('Add chaos engineering tests (random pod kills, network delays)');
  resilienceImprovements.push('Use blue-green or canary deployments for zero-downtime releases');
  resilienceImprovements.push('Implement automatic rollback on deployment failure');
  resilienceImprovements.push('Add request tracing (OpenTelemetry) for debugging distributed issues');
  
  // General monitoring
  monitoringStrategy.push({
    metric: 'Error rate',
    threshold: '>1% errors in 5 minutes',
    action: 'Alert on-call, check logs for patterns'
  });
  
  monitoringStrategy.push({
    metric: 'Response time',
    threshold: 'p95 >1s',
    action: 'Alert on-call, check for slow queries or external API issues'
  });
  
  monitoringStrategy.push({
    metric: 'CPU/Memory usage',
    threshold: '>80% for 10 minutes',
    action: 'Auto-scale if possible, alert on-call if at max capacity'
  });
  
  const confidence = 80;
  
  return {
    defenses,
    monitoringStrategy,
    incidentResponse,
    hardeningSteps,
    resilienceImprovements,
    confidence,
    reasoning: `Blue team defense strategy includes ${defenses.length} specific defenses, ${monitoringStrategy.length} monitoring metrics, ${incidentResponse.length} incident response plans, ${hardeningSteps.length} hardening steps, and ${resilienceImprovements.length} resilience improvements.`
  };
}

