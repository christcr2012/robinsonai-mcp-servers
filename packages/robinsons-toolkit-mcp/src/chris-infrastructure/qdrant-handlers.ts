/**
 * Qdrant Handlers for Chris's Infrastructure
 *
 * Handler functions for all 7 Qdrant tools
 */

import { fastAPIClient } from './fastapi-client.js';

// ============================================================================
// Collection Management
// ============================================================================

export async function handleQdrantCollections(args: any) {
  return await fastAPIClient.request('/qdrant/collections', {
    method: 'GET',
  });
}

export async function handleQdrantCollectionInfo(args: any) {
  const { collection_name } = args;

  return await fastAPIClient.request(`/qdrant/collections/${collection_name}`, {
    method: 'GET',
  });
}

// ============================================================================
// Search Operations
// ============================================================================

export async function handleQdrantVectorSearch(args: any) {
  const { collection_name, vector, limit = 10, score_threshold, filter } = args;

  let url = `/qdrant/search?collection_name=${collection_name}&limit=${limit}`;
  if (score_threshold !== undefined) {
    url += `&score_threshold=${score_threshold}`;
  }

  return await fastAPIClient.request(url, {
    method: 'POST',
    body: JSON.stringify({
      vector,
      filter,
    }),
  });
}

// ============================================================================
// Point Operations
// ============================================================================

export async function handleQdrantUpsertPoints(args: any) {
  const { collection_name, points } = args;

  return await fastAPIClient.request(`/qdrant/points/upsert?collection_name=${collection_name}`, {
    method: 'POST',
    body: JSON.stringify({
      points,
    }),
  });
}

export async function handleQdrantDeletePoints(args: any) {
  const { collection_name, point_ids } = args;

  return await fastAPIClient.request(`/qdrant/points/delete?collection_name=${collection_name}`, {
    method: 'DELETE',
    body: JSON.stringify({
      point_ids,
    }),
  });
}

export async function handleQdrantGetPoint(args: any) {
  const { collection_name, point_id } = args;

  return await fastAPIClient.request(`/qdrant/points/${point_id}?collection_name=${collection_name}`, {
    method: 'GET',
  });
}

