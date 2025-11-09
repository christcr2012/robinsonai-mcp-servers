/**
 * Qdrant Handlers for Chris's Infrastructure
 * 
 * Handler functions for all 15 Qdrant tools
 */

import { fastAPIClient } from './fastapi-client.js';

// ============================================================================
// Collection Management
// ============================================================================

export async function handleQdrantCollectionCreate(args: any) {
  const { collection_name, vector_size, distance = 'Cosine' } = args;
  return await fastAPIClient.qdrantCreateCollection(collection_name, vector_size, distance);
}

export async function handleQdrantCollectionList(args: any) {
  return await fastAPIClient.qdrantListCollections();
}

export async function handleQdrantCollectionGet(args: any) {
  const { collection_name } = args;
  return await fastAPIClient.qdrantGetCollection(collection_name);
}

export async function handleQdrantCollectionDelete(args: any) {
  const { collection_name } = args;
  return await fastAPIClient.qdrantDeleteCollection(collection_name);
}

export async function handleQdrantCollectionUpdate(args: any) {
  const { collection_name, optimizers_config } = args;
  
  return await fastAPIClient.request(`/qdrant/collections/${collection_name}`, {
    method: 'PATCH',
    body: JSON.stringify({
      optimizers_config,
    }),
  });
}

// ============================================================================
// Search Operations
// ============================================================================

export async function handleQdrantSearchSemantic(args: any) {
  const { collection_name, query_vector, limit = 5, score_threshold, filter } = args;
  
  return await fastAPIClient.qdrantSearch(
    collection_name,
    query_vector,
    limit,
    score_threshold
  );
}

export async function handleQdrantSearchBatch(args: any) {
  const { collection_name, query_vectors, limit = 5 } = args;
  
  const searches = query_vectors.map((vector: number[]) => ({
    vector,
    limit,
  }));
  
  return await fastAPIClient.request(`/qdrant/collections/${collection_name}/points/search/batch`, {
    method: 'POST',
    body: JSON.stringify({ searches }),
  });
}

// ============================================================================
// Point Operations
// ============================================================================

export async function handleQdrantPointUpsert(args: any) {
  const { collection_name, point_id, vector, payload = {} } = args;
  
  const point = {
    id: point_id,
    vector,
    payload,
  };
  
  return await fastAPIClient.qdrantUpsertPoints(collection_name, [point]);
}

export async function handleQdrantPointGet(args: any) {
  const { collection_name, point_id } = args;
  
  return await fastAPIClient.request(`/qdrant/collections/${collection_name}/points/${point_id}`, {
    method: 'GET',
  });
}

export async function handleQdrantPointDelete(args: any) {
  const { collection_name, point_id } = args;
  
  return await fastAPIClient.request(`/qdrant/collections/${collection_name}/points/delete`, {
    method: 'POST',
    body: JSON.stringify({
      points: [point_id],
    }),
  });
}

export async function handleQdrantPointSearch(args: any) {
  const { collection_name, filter, limit = 10 } = args;
  
  return await fastAPIClient.request(`/qdrant/collections/${collection_name}/points/scroll`, {
    method: 'POST',
    body: JSON.stringify({
      filter,
      limit,
    }),
  });
}

export async function handleQdrantPointsBatchUpsert(args: any) {
  const { collection_name, points } = args;
  return await fastAPIClient.qdrantUpsertPoints(collection_name, points);
}

// ============================================================================
// Snapshot & Admin
// ============================================================================

export async function handleQdrantSnapshotCreate(args: any) {
  const { collection_name } = args;
  
  return await fastAPIClient.request(`/qdrant/collections/${collection_name}/snapshots`, {
    method: 'POST',
  });
}

export async function handleQdrantSnapshotList(args: any) {
  const { collection_name } = args;
  
  return await fastAPIClient.request(`/qdrant/collections/${collection_name}/snapshots`, {
    method: 'GET',
  });
}

export async function handleQdrantConnectionTest(args: any) {
  try {
    const result = await fastAPIClient.qdrantListCollections();
    return {
      success: true,
      message: 'Connection successful',
      collections: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

