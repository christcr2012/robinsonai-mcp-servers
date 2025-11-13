/**
 * Cloudflare Tool Definitions Part 4
 * R2 (continued), Pages, D1, Queues, Durable Objects, Stream
 */

export const CLOUDFLARE_TOOLS_4 = [
  // ============================================================
  // R2 (Object Storage) - 13 more tools
  // ============================================================
  {
    name: 'cloudflare_copy_r2_object',
    description: 'Copy an object within R2',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        sourceKey: { type: 'string', description: 'Source object key' },
        destinationKey: { type: 'string', description: 'Destination object key' },
      },
      required: ['accountId', 'bucketName', 'sourceKey', 'destinationKey'],
    },
  },
  {
    name: 'cloudflare_get_r2_object_metadata',
    description: 'Get metadata for an R2 object',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
      },
      required: ['accountId', 'bucketName', 'key'],
    },
  },
  {
    name: 'cloudflare_update_r2_object_metadata',
    description: 'Update metadata for an R2 object',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
        metadata: { type: 'object', description: 'New metadata' },
      },
      required: ['accountId', 'bucketName', 'key', 'metadata'],
    },
  },
  {
    name: 'cloudflare_create_r2_multipart_upload',
    description: 'Initiate a multipart upload',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
      },
      required: ['accountId', 'bucketName', 'key'],
    },
  },
  {
    name: 'cloudflare_upload_r2_part',
    description: 'Upload a part in a multipart upload',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
        uploadId: { type: 'string', description: 'Upload ID' },
        partNumber: { type: 'number', description: 'Part number' },
        body: { type: 'string', description: 'Part content' },
      },
      required: ['accountId', 'bucketName', 'key', 'uploadId', 'partNumber', 'body'],
    },
  },
  {
    name: 'cloudflare_complete_r2_multipart_upload',
    description: 'Complete a multipart upload',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
        uploadId: { type: 'string', description: 'Upload ID' },
        parts: { type: 'array', description: 'Array of uploaded parts' },
      },
      required: ['accountId', 'bucketName', 'key', 'uploadId', 'parts'],
    },
  },
  {
    name: 'cloudflare_abort_r2_multipart_upload',
    description: 'Abort a multipart upload',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
        uploadId: { type: 'string', description: 'Upload ID' },
      },
      required: ['accountId', 'bucketName', 'key', 'uploadId'],
    },
  },
  {
    name: 'cloudflare_list_r2_multipart_uploads',
    description: 'List in-progress multipart uploads',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
      },
      required: ['accountId', 'bucketName'],
    },
  },
  {
    name: 'cloudflare_get_r2_bucket_usage',
    description: 'Get usage statistics for an R2 bucket',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
      },
      required: ['accountId', 'bucketName'],
    },
  },
  {
    name: 'cloudflare_set_r2_bucket_cors',
    description: 'Set CORS configuration for an R2 bucket',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        corsRules: { type: 'array', description: 'CORS rules' },
      },
      required: ['accountId', 'bucketName', 'corsRules'],
    },
  },
  {
    name: 'cloudflare_get_r2_bucket_cors',
    description: 'Get CORS configuration for an R2 bucket',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
      },
      required: ['accountId', 'bucketName'],
    },
  },
  {
    name: 'cloudflare_delete_r2_bucket_cors',
    description: 'Delete CORS configuration for an R2 bucket',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
      },
      required: ['accountId', 'bucketName'],
    },
  },
  {
    name: 'cloudflare_generate_r2_presigned_url',
    description: 'Generate a presigned URL for R2 object access',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        bucketName: { type: 'string', description: 'Bucket name' },
        key: { type: 'string', description: 'Object key' },
        expiresIn: { type: 'number', description: 'Expiration time in seconds' },
      },
      required: ['accountId', 'bucketName', 'key'],
    },
  },

  // ============================================================
  // PAGES (Static Sites) - 20 tools
  // ============================================================
  {
    name: 'cloudflare_list_pages_projects',
    description: 'List Pages projects',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_get_pages_project',
    description: 'Get a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
      },
      required: ['accountId', 'projectName'],
    },
  },
  {
    name: 'cloudflare_create_pages_project',
    description: 'Create a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        name: { type: 'string', description: 'Project name' },
        productionBranch: { type: 'string', description: 'Production branch' },
        source: { type: 'object', description: 'Source configuration (GitHub, GitLab)' },
      },
      required: ['accountId', 'name'],
    },
  },
  {
    name: 'cloudflare_delete_pages_project',
    description: 'Delete a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
      },
      required: ['accountId', 'projectName'],
    },
  },
  {
    name: 'cloudflare_list_pages_deployments',
    description: 'List deployments for a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
      },
      required: ['accountId', 'projectName'],
    },
  },
  {
    name: 'cloudflare_get_pages_deployment',
    description: 'Get a specific deployment',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        deploymentId: { type: 'string', description: 'Deployment ID' },
      },
      required: ['accountId', 'projectName', 'deploymentId'],
    },
  },
  {
    name: 'cloudflare_create_pages_deployment',
    description: 'Create a new deployment',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        branch: { type: 'string', description: 'Branch name' },
      },
      required: ['accountId', 'projectName'],
    },
  },
  {
    name: 'cloudflare_retry_pages_deployment',
    description: 'Retry a failed deployment',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        deploymentId: { type: 'string', description: 'Deployment ID' },
      },
      required: ['accountId', 'projectName', 'deploymentId'],
    },
  },
  {
    name: 'cloudflare_rollback_pages_deployment',
    description: 'Rollback to a previous deployment',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        deploymentId: { type: 'string', description: 'Deployment ID to rollback to' },
      },
      required: ['accountId', 'projectName', 'deploymentId'],
    },
  },
  {
    name: 'cloudflare_delete_pages_deployment',
    description: 'Delete a deployment',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        deploymentId: { type: 'string', description: 'Deployment ID' },
      },
      required: ['accountId', 'projectName', 'deploymentId'],
    },
  },
  {
    name: 'cloudflare_get_pages_deployment_logs',
    description: 'Get logs for a deployment',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        deploymentId: { type: 'string', description: 'Deployment ID' },
      },
      required: ['accountId', 'projectName', 'deploymentId'],
    },
  },
  {
    name: 'cloudflare_list_pages_domains',
    description: 'List custom domains for a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
      },
      required: ['accountId', 'projectName'],
    },
  },
  {
    name: 'cloudflare_add_pages_domain',
    description: 'Add a custom domain to a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        domain: { type: 'string', description: 'Custom domain' },
      },
      required: ['accountId', 'projectName', 'domain'],
    },
  },
  {
    name: 'cloudflare_delete_pages_domain',
    description: 'Remove a custom domain from a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        domain: { type: 'string', description: 'Custom domain' },
      },
      required: ['accountId', 'projectName', 'domain'],
    },
  },
  {
    name: 'cloudflare_get_pages_build_config',
    description: 'Get build configuration for a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
      },
      required: ['accountId', 'projectName'],
    },
  },
  {
    name: 'cloudflare_update_pages_build_config',
    description: 'Update build configuration',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        buildCommand: { type: 'string', description: 'Build command' },
        buildOutputDirectory: { type: 'string', description: 'Output directory' },
        rootDirectory: { type: 'string', description: 'Root directory' },
      },
      required: ['accountId', 'projectName'],
    },
  },
  {
    name: 'cloudflare_get_pages_env_vars',
    description: 'Get environment variables for a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
      },
      required: ['accountId', 'projectName'],
    },
  },
  {
    name: 'cloudflare_set_pages_env_var',
    description: 'Set an environment variable',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        key: { type: 'string', description: 'Variable name' },
        value: { type: 'string', description: 'Variable value' },
        environment: { type: 'string', description: 'Environment (production, preview)' },
      },
      required: ['accountId', 'projectName', 'key', 'value'],
    },
  },
  {
    name: 'cloudflare_delete_pages_env_var',
    description: 'Delete an environment variable',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
        key: { type: 'string', description: 'Variable name' },
      },
      required: ['accountId', 'projectName', 'key'],
    },
  },
  {
    name: 'cloudflare_purge_pages_cache',
    description: 'Purge cache for a Pages project',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        projectName: { type: 'string', description: 'Project name' },
      },
      required: ['accountId', 'projectName'],
    },
  },

  // ============================================================
  // D1 (SQL Database) - 15 tools
  // ============================================================
  {
    name: 'cloudflare_list_d1_databases',
    description: 'List D1 databases',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
      },
      required: ['accountId'],
    },
  },
  {
    name: 'cloudflare_create_d1_database',
    description: 'Create a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        name: { type: 'string', description: 'Database name' },
      },
      required: ['accountId', 'name'],
    },
  },
  {
    name: 'cloudflare_get_d1_database',
    description: 'Get a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
      },
      required: ['accountId', 'databaseId'],
    },
  },
  {
    name: 'cloudflare_delete_d1_database',
    description: 'Delete a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
      },
      required: ['accountId', 'databaseId'],
    },
  },
  {
    name: 'cloudflare_query_d1_database',
    description: 'Execute a SQL query on a D1 database',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Account ID' },
        databaseId: { type: 'string', description: 'Database ID' },
        sql: { type: 'string', description: 'SQL query' },
        params: { type: 'array', description: 'Query parameters' },
      },
      required: ['accountId', 'databaseId', 'sql'],
    },
  },
];

