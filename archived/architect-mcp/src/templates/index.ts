/**
 * Step Templates Library
 * 
 * Provides concrete templates that Architect fills with specific values.
 * No free-form fluff allowed - all fields must be filled.
 */

export interface StepTemplate {
  name: string;
  description: string;
  required_params: string[];
  optional_params?: string[];
  example: Record<string, any>;
}

export const STEP_TEMPLATES: Record<string, StepTemplate> = {
  'github.open_pr_with_changes': {
    name: 'github.open_pr_with_changes',
    description: 'Create GitHub PR with file changes',
    required_params: ['owner', 'repo', 'title', 'changes', 'baseBranch'],
    optional_params: ['body', 'branchName', 'draft'],
    example: {
      owner: 'robinsonai',
      repo: 'mcp-servers',
      title: 'Add feature X',
      baseBranch: 'main',
      branchName: 'feature/add-x',
      changes: [
        {
          path: 'packages/foo/src/bar.ts',
          mode: 'update',
          content: '...',
        },
      ],
      body: 'Implements feature X as specified in #123',
      draft: false,
    },
  },

  'vercel.deploy_preview': {
    name: 'vercel.deploy_preview',
    description: 'Deploy Vercel preview from branch',
    required_params: ['project', 'branch'],
    optional_params: ['env'],
    example: {
      project: 'rad-vercel-api',
      branch: 'feature/new-endpoint',
      env: {
        NEON_DATABASE_URL: '@neon-database-url',
      },
    },
  },

  'neon.migrate_sql': {
    name: 'neon.migrate_sql',
    description: 'Run SQL migration on Neon database',
    required_params: ['database', 'sql_file'],
    optional_params: ['rollback_sql'],
    example: {
      database: 'rad-production',
      sql_file: 'packages/rad-crawler-mcp/migrations/001_add_index.sql',
      rollback_sql: 'packages/rad-crawler-mcp/migrations/001_rollback.sql',
    },
  },

  'playwright.create_test': {
    name: 'playwright.create_test',
    description: 'Create Playwright E2E test',
    required_params: ['test_file', 'test_name', 'url'],
    optional_params: ['selectors', 'assertions'],
    example: {
      test_file: 'packages/rad-vercel-api/tests/e2e/search.spec.ts',
      test_name: 'Search API returns results',
      url: 'https://rad-api.vercel.app/api/search',
      selectors: {
        searchInput: '[data-testid="search-input"]',
        submitButton: '[data-testid="submit"]',
      },
      assertions: [
        'response.status === 200',
        'results.length > 0',
      ],
    },
  },

  'rad.search_then_attach_refs': {
    name: 'rad.search_then_attach_refs',
    description: 'Search RAD index and attach chunk references',
    required_params: ['query', 'top_k'],
    optional_params: ['semantic'],
    example: {
      query: 'database schema migration patterns',
      top_k: 10,
      semantic: true,
    },
  },

  'npm.install_package': {
    name: 'npm.install_package',
    description: 'Install npm package in workspace',
    required_params: ['package', 'workspace'],
    optional_params: ['version', 'dev'],
    example: {
      package: 'better-sqlite3',
      workspace: 'packages/architect-mcp',
      version: '^9.0.0',
      dev: false,
    },
  },

  'file.patch_edit': {
    name: 'file.patch_edit',
    description: 'Apply patch-only edit to file',
    required_params: ['file', 'old_str', 'new_str', 'start_line', 'end_line'],
    example: {
      file: 'packages/architect-mcp/src/index.ts',
      old_str: 'export const VERSION = "1.0.0";',
      new_str: 'export const VERSION = "1.1.0";',
      start_line: 5,
      end_line: 5,
    },
  },

  'test.run_suite': {
    name: 'test.run_suite',
    description: 'Run specific test suite',
    required_params: ['test_file', 'command'],
    optional_params: ['timeout_ms'],
    example: {
      test_file: 'packages/architect-mcp/test/validator.test.ts',
      command: 'npm test -- validator.test.ts',
      timeout_ms: 30000,
    },
  },

  'docker.build_image': {
    name: 'docker.build_image',
    description: 'Build Docker image',
    required_params: ['dockerfile', 'tag'],
    optional_params: ['build_args', 'context'],
    example: {
      dockerfile: 'packages/rad-crawler-mcp/Dockerfile',
      tag: 'rad-crawler:latest',
      context: 'packages/rad-crawler-mcp',
      build_args: {
        NODE_VERSION: '20',
      },
    },
  },

  'git.create_branch': {
    name: 'git.create_branch',
    description: 'Create new git branch',
    required_params: ['branch_name', 'from_branch'],
    example: {
      branch_name: 'feature/add-validator',
      from_branch: 'main',
    },
  },
};

/**
 * Get template by name
 */
export function getTemplate(name: string): StepTemplate | null {
  return STEP_TEMPLATES[name] || null;
}

/**
 * List all available templates
 */
export function listTemplates(): string[] {
  return Object.keys(STEP_TEMPLATES);
}

/**
 * Validate that params match template requirements
 */
export function validateTemplateParams(
  templateName: string,
  params: Record<string, any>
): { valid: boolean; errors: string[] } {
  const template = getTemplate(templateName);
  
  if (!template) {
    return {
      valid: false,
      errors: [`Template "${templateName}" not found`],
    };
  }
  
  const errors: string[] = [];
  
  // Check required params
  for (const required of template.required_params) {
    if (!(required in params)) {
      errors.push(`Missing required parameter: ${required}`);
    }
  }
  
  // Check for unknown params
  const allParams = [...template.required_params, ...(template.optional_params || [])];
  for (const param of Object.keys(params)) {
    if (!allParams.includes(param)) {
      errors.push(`Unknown parameter: ${param}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

