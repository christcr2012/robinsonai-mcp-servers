/**
 * Context7 Documentation Tools
 * Full Context7 API integration for library documentation access
 * Requires CONTEXT7_API_KEY environment variable (optional - works without for public docs)
 */

import axios, { AxiosInstance } from 'axios';

// Singleton axios client
let context7Client: AxiosInstance | null = null;

function getContext7Client(): AxiosInstance {
  if (!context7Client) {
    const apiKey = process.env.CONTEXT7_API_KEY || '';
    context7Client = axios.create({
      baseURL: 'https://api.context7.com',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
      timeout: 30000,
    });
  }
  return context7Client;
}

export async function context7ResolveLibraryId(args: any): Promise<any> {
  try {
    const client = getContext7Client();
    const response = await client.post('/v1/resolve', {
      libraryName: args.libraryName,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error resolving library: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function context7GetLibraryDocs(args: any): Promise<any> {
  try {
    const client = getContext7Client();
    const response = await client.post('/v1/docs', {
      libraryId: args.context7CompatibleLibraryID,
      topic: args.topic,
      tokens: args.tokens || 5000,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching docs: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function context7SearchLibraries(args: any): Promise<any> {
  try {
    const client = getContext7Client();
    const response = await client.post('/v1/search', {
      query: args.query,
      limit: args.limit || 10,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error searching libraries: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function context7CompareVersions(args: any): Promise<any> {
  try {
    const client = getContext7Client();
    const response = await client.post('/v1/compare', {
      libraryId: args.libraryId,
      fromVersion: args.fromVersion,
      toVersion: args.toVersion,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error comparing versions: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function context7GetExamples(args: any): Promise<any> {
  try {
    const client = getContext7Client();
    const response = await client.post('/v1/examples', {
      libraryId: args.libraryId,
      useCase: args.useCase,
      language: args.language || 'javascript',
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching examples: ${error.message}`,
      }],
      isError: true,
    };
  }
}

export async function context7GetMigrationGuide(args: any): Promise<any> {
  try {
    const client = getContext7Client();
    const response = await client.post('/v1/migration', {
      libraryId: args.libraryId,
      fromVersion: args.fromVersion,
      toVersion: args.toVersion,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(response.data, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: `Error fetching migration guide: ${error.message}`,
      }],
      isError: true,
    };
  }
}

