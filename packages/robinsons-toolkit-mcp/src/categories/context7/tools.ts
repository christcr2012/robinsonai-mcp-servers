/**
 * Context7 Tool Definitions
 * Documentation search and library information API
 * 
 * Categories:
 * - Library Search: 3 tools
 * - Documentation: 4 tools
 * - Version Management: 3 tools
 * - Examples: 2 tools
 * 
 * Total: 12 tools
 */

export const CONTEXT7_TOOLS = [
  // ============================================================
  // LIBRARY SEARCH - 3 tools
  // ============================================================
  {
    name: 'context7_resolve_library_id',
    description: 'Resolve a library name to its Context7 ID',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name (e.g., "react", "next.js")' },
      },
      required: ['library'],
    },
  },
  {
    name: 'context7_search_libraries',
    description: 'Search for libraries across multiple sources',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Maximum number of results (default: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'context7_list_libraries',
    description: 'List all available libraries in Context7',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'number', description: 'Page number (default: 1)' },
        perPage: { type: 'number', description: 'Results per page (default: 50)' },
      },
    },
  },

  // ============================================================
  // DOCUMENTATION - 4 tools
  // ============================================================
  {
    name: 'context7_get_library_docs',
    description: 'Get documentation for a specific library',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name or ID' },
        version: { type: 'string', description: 'Library version (optional, defaults to latest)' },
      },
      required: ['library'],
    },
  },
  {
    name: 'context7_search_docs',
    description: 'Search within library documentation',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name or ID' },
        query: { type: 'string', description: 'Search query' },
        version: { type: 'string', description: 'Library version (optional)' },
      },
      required: ['library', 'query'],
    },
  },
  {
    name: 'context7_get_api_reference',
    description: 'Get API reference for a library',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name or ID' },
        version: { type: 'string', description: 'Library version (optional)' },
      },
      required: ['library'],
    },
  },
  {
    name: 'context7_get_guides',
    description: 'Get guides and tutorials for a library',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name or ID' },
        version: { type: 'string', description: 'Library version (optional)' },
      },
      required: ['library'],
    },
  },

  // ============================================================
  // VERSION MANAGEMENT - 3 tools
  // ============================================================
  {
    name: 'context7_compare_versions',
    description: 'Compare two versions of a library',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name or ID' },
        from: { type: 'string', description: 'From version' },
        to: { type: 'string', description: 'To version' },
      },
      required: ['library', 'from', 'to'],
    },
  },
  {
    name: 'context7_get_migration_guide',
    description: 'Get migration guide between versions',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name or ID' },
        from: { type: 'string', description: 'From version' },
        to: { type: 'string', description: 'To version' },
      },
      required: ['library', 'from', 'to'],
    },
  },
  {
    name: 'context7_list_versions',
    description: 'List all available versions of a library',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name or ID' },
      },
      required: ['library'],
    },
  },

  // ============================================================
  // EXAMPLES - 2 tools
  // ============================================================
  {
    name: 'context7_get_examples',
    description: 'Get code examples for a library',
    inputSchema: {
      type: 'object',
      properties: {
        library: { type: 'string', description: 'Library name or ID' },
        topic: { type: 'string', description: 'Topic or feature (optional)' },
        version: { type: 'string', description: 'Library version (optional)' },
      },
      required: ['library'],
    },
  },
  {
    name: 'context7_search_examples',
    description: 'Search for code examples across libraries',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        libraries: { type: 'array', items: { type: 'string' }, description: 'Filter by libraries (optional)' },
        limit: { type: 'number', description: 'Maximum number of results (default: 10)' },
      },
      required: ['query'],
    },
  },
];

