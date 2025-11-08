/**
 * Context7 Handler Functions
 * Documentation search and library information API
 * All 12 handlers
 */

// Helper function to format Context7 responses
function formatContext7Response(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// LIBRARY SEARCH - 3 handlers
// ============================================================

export async function context7ResolveLibraryId(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library } = args;
    const response = await this.context7Client.get(`/libraries/resolve`, {
      params: { name: library },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to resolve library ID: ${error.message}`);
  }
}

export async function context7SearchLibraries(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { query, limit = 10 } = args;
    const response = await this.context7Client.get(`/libraries/search`, {
      params: { q: query, limit },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to search libraries: ${error.message}`);
  }
}

export async function context7ListLibraries(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { page = 1, perPage = 50 } = args;
    const response = await this.context7Client.get(`/libraries`, {
      params: { page, per_page: perPage },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to list libraries: ${error.message}`);
  }
}

// ============================================================
// DOCUMENTATION - 4 handlers
// ============================================================

export async function context7GetLibraryDocs(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library, version } = args;
    const response = await this.context7Client.get(`/libraries/${library}/docs`, {
      params: { version },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to get library docs: ${error.message}`);
  }
}

export async function context7SearchDocs(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library, query, version } = args;
    const response = await this.context7Client.get(`/libraries/${library}/docs/search`, {
      params: { q: query, version },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to search docs: ${error.message}`);
  }
}

export async function context7GetApiReference(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library, version } = args;
    const response = await this.context7Client.get(`/libraries/${library}/api`, {
      params: { version },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to get API reference: ${error.message}`);
  }
}

export async function context7GetGuides(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library, version } = args;
    const response = await this.context7Client.get(`/libraries/${library}/guides`, {
      params: { version },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to get guides: ${error.message}`);
  }
}

// ============================================================
// VERSION MANAGEMENT - 3 handlers
// ============================================================

export async function context7CompareVersions(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library, from, to } = args;
    const response = await this.context7Client.get(`/libraries/${library}/compare`, {
      params: { from, to },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to compare versions: ${error.message}`);
  }
}

export async function context7GetMigrationGuide(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library, from, to } = args;
    const response = await this.context7Client.get(`/libraries/${library}/migration`, {
      params: { from, to },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to get migration guide: ${error.message}`);
  }
}

export async function context7ListVersions(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library } = args;
    const response = await this.context7Client.get(`/libraries/${library}/versions`);
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to list versions: ${error.message}`);
  }
}

// ============================================================
// EXAMPLES - 2 handlers
// ============================================================

export async function context7GetExamples(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { library, topic, version } = args;
    const response = await this.context7Client.get(`/libraries/${library}/examples`, {
      params: { topic, version },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to get examples: ${error.message}`);
  }
}

export async function context7SearchExamples(this: any, args: any) {
  if (!this.context7Client) throw new Error('Context7 client not initialized');
  try {
    const { query, libraries, limit = 10 } = args;
    const response = await this.context7Client.get(`/examples/search`, {
      params: { q: query, libraries: libraries?.join(','), limit },
    });
    return formatContext7Response(response.data);
  } catch (error: any) {
    throw new Error(`Failed to search examples: ${error.message}`);
  }
}

