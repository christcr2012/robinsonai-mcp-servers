#!/usr/bin/env tsx
/**
 * Seed Global Knowledge Artifacts
 * Generates and inserts comprehensive guides into the knowledge_artifacts table
 */

import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.CORTEX_DATABASE_URL || process.env.RAD_DATABASE_URL,
});

interface KnowledgeArtifact {
  artifact_type: string;
  title: string;
  content: string;
  tags: string[];
  scope: string;
  scope_repo_id: string | null;
  version: string;
}

const artifacts: KnowledgeArtifact[] = [
  {
    artifact_type: 'guide',
    title: 'SaaS Multitenancy Best Practices',
    content: `# SaaS Multitenancy Best Practices

## Overview
Multitenancy is a software architecture where a single instance of an application serves multiple customers (tenants). This guide covers best practices for designing and implementing multitenant SaaS applications.

## Database Isolation Strategies

### 1. Shared Database, Shared Schema
- **Pros**: Most cost-effective, easiest to maintain
- **Cons**: Highest risk of data leakage, complex queries
- **Use Case**: Low-risk applications with many small tenants

### 2. Shared Database, Separate Schemas
- **Pros**: Good balance of isolation and cost
- **Cons**: Schema management complexity
- **Use Case**: Medium-risk applications with moderate tenant count

### 3. Separate Databases
- **Pros**: Maximum isolation and security
- **Cons**: Highest cost, complex maintenance
- **Use Case**: High-risk applications, regulated industries

## Tenant Context Management

\`\`\`typescript
// Middleware to extract and validate tenant context
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const tenantId = req.headers['x-tenant-id'] || req.subdomain;
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }
  
  // Validate tenant exists and is active
  const tenant = await getTenant(tenantId);
  if (!tenant || !tenant.isActive) {
    return res.status(403).json({ error: 'Invalid or inactive tenant' });
  }
  
  // Attach to request context
  req.tenant = tenant;
  next();
}
\`\`\`

## Data Security

### Row-Level Security (RLS)
\`\`\`sql
-- PostgreSQL RLS example
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
\`\`\`

### Application-Level Filtering
\`\`\`typescript
// Always filter by tenant_id
export async function getUsers(tenantId: string) {
  return db.users.findMany({
    where: { tenant_id: tenantId }
  });
}
\`\`\`

## Scaling Strategies

### Horizontal Scaling
- Use tenant ID for sharding key
- Distribute tenants across multiple database instances
- Implement connection pooling per tenant

### Vertical Scaling
- Tier-based resource allocation
- Premium tenants get dedicated resources
- Implement rate limiting per tenant

## Monitoring and Observability

\`\`\`typescript
// Track per-tenant metrics
metrics.increment('api.requests', {
  tenant_id: req.tenant.id,
  endpoint: req.path
});
\`\`\`

## Best Practices Checklist

- [ ] Implement tenant context in all database queries
- [ ] Use RLS or application-level filtering
- [ ] Validate tenant access in middleware
- [ ] Monitor per-tenant resource usage
- [ ] Implement tenant-specific rate limiting
- [ ] Test cross-tenant data leakage scenarios
- [ ] Document tenant onboarding/offboarding process
- [ ] Implement tenant-specific feature flags
- [ ] Plan for tenant data export/migration
- [ ] Regular security audits for tenant isolation`,
    tags: ['best-practices', 'global-knowledge-pack', 'saas', 'multitenancy'],
    scope: 'global',
    scope_repo_id: null,
    version: '1.0.0',
  },
  // Add more artifacts here...
];

async function seedArtifacts() {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1'); // Test connection
    
    console.log(`Seeding ${artifacts.length} knowledge artifacts...`);
    
    for (const artifact of artifacts) {
      const result = await pool.query(
        `INSERT INTO knowledge_artifacts 
         (artifact_type, title, content, tags, scope, scope_repo_id, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (title) DO UPDATE SET
           content = EXCLUDED.content,
           tags = EXCLUDED.tags,
           version = EXCLUDED.version,
           updated_at = NOW()
         RETURNING id, title`,
        [
          artifact.artifact_type,
          artifact.title,
          artifact.content,
          artifact.tags,
          artifact.scope,
          artifact.scope_repo_id,
          artifact.version,
        ]
      );
      
      console.log(`✅ Seeded: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
    }
    
    console.log('\n✅ All knowledge artifacts seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding artifacts:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedArtifacts();

