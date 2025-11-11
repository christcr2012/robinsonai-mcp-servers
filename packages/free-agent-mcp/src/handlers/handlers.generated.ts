/* AUTO-GENERATED — DO NOT EDIT BY HAND */
import { http, HttpOptions } from "../http/client";
import { HOSTS } from "../http/hosts";
import { z as zod } from "zod";
import * as Z from "../spec/zod-from-mini";

type Handler<I = any, O = any> = (i: I) => Promise<O>;

/**
 * Wrap handler with input validation
 */
function withValidation<I>(
  schema: zod.ZodTypeAny,
  fn: Handler<I>
): Handler<I> {
  return async (raw: any) => {
    const validated = schema.parse(raw);
    return fn(validated as I);
  };
}


/**
 * Check server health status
 */
export const health_check_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/health";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Get current user information
 */
export const get_user_info_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/user";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Get PostgreSQL database info
 */
export const postgres_info_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/postgres/info";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * List all schemas in PostgreSQL
 */
export const postgres_schemas_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/postgres/schemas";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * List all tables in PostgreSQL
 */
export const postgres_tables_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/postgres/tables";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Execute a SELECT query
 */
export const postgres_query_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"query":"string:min1","params":"array:any:opt"}}) }), async (i: any) => {
  const path = "/postgres/query";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Execute a DML statement (INSERT/UPDATE/DELETE)
 */
export const postgres_execute_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"query":"string:min1","params":"array:any:opt"}}) }), async (i: any) => {
  const path = "/postgres/execute";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Get columns for a specific table
 */
export const postgres_table_columns_handler = withValidation(zod.object({ $path: Z.toZod({"type":"object","props":{"table_name":"string:min1"}}) }), async (i: any) => {
  const path = `/postgres/table/${encodeURIComponent(i.$path.table_name)}/columns`;
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Get indexes for a specific table
 */
export const postgres_table_indexes_handler = withValidation(zod.object({ $path: Z.toZod({"type":"object","props":{"table_name":"string:min1"}}) }), async (i: any) => {
  const path = `/postgres/table/${encodeURIComponent(i.$path.table_name)}/indexes`;
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Vector search in PostgreSQL
 */
export const postgres_vector_search_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"query":"string:min1","limit":"number:int:1-100:opt"}}) }), async (i: any) => {
  const path = "/postgres/vector-search";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Get Neo4j database info
 */
export const neo4j_info_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/neo4j/info";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Execute a Cypher query
 */
export const neo4j_query_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"query":"string:min1","params":"record:any:opt"}}) }), async (i: any) => {
  const path = "/neo4j/query";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Execute a Cypher statement
 */
export const neo4j_execute_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"query":"string:min1","params":"record:any:opt"}}) }), async (i: any) => {
  const path = "/neo4j/execute";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * List all nodes in Neo4j
 */
export const neo4j_nodes_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/neo4j/nodes";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * List all relationships in Neo4j
 */
export const neo4j_relationships_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/neo4j/relationships";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Search Neo4j graph
 */
export const neo4j_search_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"query":"string:min1"}}) }), async (i: any) => {
  const path = "/neo4j/search";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * List all Qdrant collections
 */
export const qdrant_collections_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/qdrant/collections";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Get info about a specific collection
 */
export const qdrant_collection_info_handler = withValidation(zod.object({ $path: Z.toZod({"type":"object","props":{"collection_name":"string:min1"}}) }), async (i: any) => {
  const path = `/qdrant/collection/${encodeURIComponent(i.$path.collection_name)}`;
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Vector search in Qdrant
 */
export const qdrant_vector_search_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"collection":"string:min1","query_vector":"array:any","limit":"number:int:1-100:opt"}}) }), async (i: any) => {
  const path = "/qdrant/vector-search";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Upsert points into Qdrant
 */
export const qdrant_upsert_points_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"collection":"string:min1","points":"array:any"}}) }), async (i: any) => {
  const path = "/qdrant/upsert";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Delete points from Qdrant
 */
export const qdrant_delete_points_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"collection":"string:min1","point_ids":"array:any"}}) }), async (i: any) => {
  const path = "/qdrant/delete";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Get a specific point from Qdrant
 */
export const qdrant_get_point_handler = withValidation(zod.object({ $path: Z.toZod({"type":"object","props":{"collection_name":"string:min1","point_id":"string:min1"}}) }), async (i: any) => {
  const path = `/qdrant/point/${encodeURIComponent(i.$path.collection_name)}/${encodeURIComponent(i.$path.point_id)}`;
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Scroll through Qdrant points
 */
export const qdrant_scroll_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"collection":"string:min1","limit":"number:int:1-100:opt","offset":"string:opt"}}) }), async (i: any) => {
  const path = "/qdrant/scroll";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Get LangChain info
 */
export const langchain_info_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/langchain/info";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Chat with LangChain
 */
export const langchain_chat_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"message":"string:min1","history":"array:any:opt"}}) }), async (i: any) => {
  const path = "/langchain/chat";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * RAG query with LangChain
 */
export const langchain_rag_query_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"query":"string:min1","top_k":"number:int:1-20:opt"}}) }), async (i: any) => {
  const path = "/langchain/rag-query";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * Ingest document into LangChain
 */
export const langchain_ingest_document_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"content":"string:min1","metadata":"record:any:opt"}}) }), async (i: any) => {
  const path = "/langchain/ingest";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});


/**
 * List all gateway services
 */
export const gateway_services_handler = withValidation(zod.any(), async (i: any) => {
  const path = "/gateway/services";
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Check health of a specific service
 */
export const gateway_service_health_handler = withValidation(zod.object({ $path: Z.toZod({"type":"object","props":{"service_name":"string:min1"}}) }), async (i: any) => {
  const path = `/gateway/service/${encodeURIComponent(i.$path.service_name)}/health`;
  return http(HOSTS.apiRoot, path, {
    method: "GET",
    query: undefined,
    body: undefined,
  });
});


/**
 * Proxy request through gateway
 */
export const gateway_proxy_handler = withValidation(zod.object({ $body: Z.toZod({"type":"object","props":{"service":"string:min1","endpoint":"string:min1","method":"enum:GET,POST,PUT,PATCH,DELETE","data":"record:any:opt"}}) }), async (i: any) => {
  const path = "/gateway/proxy";
  return http(HOSTS.apiRoot, path, {
    method: "POST",
    query: undefined,
    body: i.$body,
  });
});
