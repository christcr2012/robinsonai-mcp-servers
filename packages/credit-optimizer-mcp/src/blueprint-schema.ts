/**
 * Blueprint Manifest Schema
 * 
 * Full-stack blueprints that create features end-to-end:
 * API, DB, UI, tests, and wiring
 */

export interface BlueprintManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  tags: string[];
  
  // What the blueprint needs to run
  inputs: BlueprintInput[];
  
  // Files to create
  files: BlueprintFile[];
  
  // Optional workflow steps (GitHub/Supabase/Stripe/etc.)
  postSteps?: WorkflowStep[];
  
  // Dependencies (npm packages, etc.)
  dependencies?: {
    npm?: string[];
    env?: string[];
  };
  
  // Metadata
  metadata?: {
    framework?: string;
    database?: string;
    estimatedTime?: number; // seconds
    estimatedCredits?: number;
    complexity?: 'simple' | 'moderate' | 'complex';
  };
}

export interface BlueprintInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface BlueprintFile {
  path: string; // Handlebars template for path
  template: string; // Template name or inline template
  type: 'component' | 'api' | 'db' | 'test' | 'config' | 'other';
  overwrite?: boolean;
  condition?: string; // Handlebars condition
}

export interface WorkflowStep {
  name: string;
  tool: string; // MCP tool name (from Robinson's Toolkit)
  args: Record<string, any>; // Handlebars templates for args
  condition?: string;
  onError?: 'stop' | 'continue' | 'retry';
  retries?: number;
}

/**
 * Example Blueprint: Notifications Feature
 */
export const NotificationsBlueprint: BlueprintManifest = {
  name: 'notifications',
  version: '1.0.0',
  description: 'Full-stack notifications feature with DB, API, UI, and tests',
  tags: ['feature', 'notifications', 'full-stack', 'prisma', 'next.js'],
  
  inputs: [
    {
      name: 'featureName',
      type: 'string',
      description: 'Name of the feature (e.g., "notifications")',
      required: true,
      default: 'notifications'
    },
    {
      name: 'tableName',
      type: 'string',
      description: 'Database table name',
      required: true,
      default: 'Notification'
    },
    {
      name: 'includeEmail',
      type: 'boolean',
      description: 'Include email notification support',
      required: false,
      default: false
    },
    {
      name: 'includePush',
      type: 'boolean',
      description: 'Include push notification support',
      required: false,
      default: false
    }
  ],
  
  files: [
    // Database Schema
    {
      path: 'prisma/schema/{{featureName}}.prisma',
      template: 'prisma-notification-schema',
      type: 'db'
    },
    
    // API Routes
    {
      path: 'src/app/api/{{featureName}}/route.ts',
      template: 'nextjs-api-notifications',
      type: 'api'
    },
    {
      path: 'src/app/api/{{featureName}}/[id]/route.ts',
      template: 'nextjs-api-notification-detail',
      type: 'api'
    },
    {
      path: 'src/app/api/{{featureName}}/mark-read/route.ts',
      template: 'nextjs-api-notification-mark-read',
      type: 'api'
    },
    
    // React Components
    {
      path: 'src/components/{{featureName}}/NotificationBell.tsx',
      template: 'react-notification-bell',
      type: 'component'
    },
    {
      path: 'src/components/{{featureName}}/NotificationList.tsx',
      template: 'react-notification-list',
      type: 'component'
    },
    {
      path: 'src/components/{{featureName}}/NotificationItem.tsx',
      template: 'react-notification-item',
      type: 'component'
    },
    
    // Hooks
    {
      path: 'src/hooks/use{{featureName}}.ts',
      template: 'react-hook-notifications',
      type: 'component'
    },
    
    // Types
    {
      path: 'src/types/{{featureName}}.ts',
      template: 'typescript-notification-types',
      type: 'other'
    },
    
    // Tests
    {
      path: 'src/app/api/{{featureName}}/route.test.ts',
      template: 'test-api-notifications',
      type: 'test'
    },
    {
      path: 'src/components/{{featureName}}/NotificationBell.test.tsx',
      template: 'test-component-notification-bell',
      type: 'test'
    },
    
    // Email template (conditional)
    {
      path: 'src/emails/{{featureName}}.tsx',
      template: 'react-email-notification',
      type: 'component',
      condition: '{{includeEmail}}'
    }
  ],
  
  postSteps: [
    // Create GitHub branch
    {
      name: 'create_branch',
      tool: 'github_create_branch',
      args: {
        owner: '{{githubOwner}}',
        repo: '{{githubRepo}}',
        branch: 'feature/{{featureName}}',
        from_branch: 'main'
      }
    },
    
    // Run Prisma migration
    {
      name: 'run_migration',
      tool: 'neon_prepare_database_migration',
      args: {
        projectId: '{{neonProjectId}}',
        migrationSql: '-- Auto-generated from Prisma schema'
      }
    },
    
    // Install dependencies (if needed)
    {
      name: 'install_deps',
      tool: 'execute_workflow',
      args: {
        workflow: [
          {
            integration: 'shell',
            tool: 'run_command',
            args: { command: 'npm install' }
          }
        ]
      },
      condition: '{{dependencies.npm}}'
    },
    
    // Run tests
    {
      name: 'run_tests',
      tool: 'execute_workflow',
      args: {
        workflow: [
          {
            integration: 'shell',
            tool: 'run_command',
            args: { command: 'npm test -- {{featureName}}' }
          }
        ]
      }
    },
    
    // Create PR
    {
      name: 'create_pr',
      tool: 'github_create_pull_request',
      args: {
        owner: '{{githubOwner}}',
        repo: '{{githubRepo}}',
        title: 'feat: Add {{featureName}} feature',
        body: 'Auto-generated {{featureName}} feature with:\n- Database schema\n- API routes\n- React components\n- Tests',
        head: 'feature/{{featureName}}',
        base: 'main'
      }
    },
    
    // Deploy preview
    {
      name: 'deploy_preview',
      tool: 'vercel_create_deployment',
      args: {
        projectId: '{{vercelProjectId}}',
        gitSource: {
          type: 'github',
          ref: 'feature/{{featureName}}'
        },
        target: 'preview'
      }
    }
  ],
  
  dependencies: {
    npm: ['@prisma/client', 'zod'],
    env: ['DATABASE_URL', 'GITHUB_TOKEN', 'VERCEL_TOKEN']
  },
  
  metadata: {
    framework: 'Next.js',
    database: 'PostgreSQL (Prisma)',
    estimatedTime: 120, // 2 minutes
    estimatedCredits: 500,
    complexity: 'moderate'
  }
};

/**
 * Blueprint Registry
 */
export const BlueprintRegistry: Record<string, BlueprintManifest> = {
  'notifications': NotificationsBlueprint,
  // More blueprints will be added here
};

