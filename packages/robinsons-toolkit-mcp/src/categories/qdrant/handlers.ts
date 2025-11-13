/**
 * Qdrant Handlers for Chris's Infrastructure
 *
 * Handler functions for all 7 Qdrant tools
 */

import { fastAPIClient } from '../../util/fastapi-client.js';

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

// ============================================================================
// Normalized exports for audit compatibility
// ============================================================================

/**
 * List all collections in Qdrant
 * @see https://api.srv823383.hstgr.cloud/docs#/Qdrant/list_collections_qdrant_collections_get
 */
export const fastapiqdrantcollections = handleQdrantCollections;

/**
 * Get detailed information about a Qdrant collection
 * @see https://api.srv823383.hstgr.cloud/docs#/Qdrant/get_collection_qdrant_collections__collection_name__get
 */
export const fastapiqdrantcollectioninfo = handleQdrantCollectionInfo;

/**
 * Perform vector similarity search in Qdrant
 * @see https://api.srv823383.hstgr.cloud/docs#/Qdrant/search_qdrant_search_post
 */
export const fastapiqdrantvectorsearch = handleQdrantVectorSearch;

/**
 * Upsert points into a Qdrant collection
 * @see https://api.srv823383.hstgr.cloud/docs#/Qdrant/upsert_points_qdrant_points_upsert_post
 */
export const fastapiqdrantupsertpoints = handleQdrantUpsertPoints;

/**
 * Delete points from a Qdrant collection
 * @see https://api.srv823383.hstgr.cloud/docs#/Qdrant/delete_points_qdrant_points_delete_delete
 */
export const fastapiqdrantdeletepoints = handleQdrantDeletePoints;

/**
 * Get a specific point from a Qdrant collection
 * @see https://api.srv823383.hstgr.cloud/docs#/Qdrant/get_point_qdrant_points__point_id__get
 */
export const fastapiqdrantgetpoint = handleQdrantGetPoint;

