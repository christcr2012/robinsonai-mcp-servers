/* AUTO-GENERATED (repo-agnostic) — DO NOT EDIT BY HAND */
export type Handler<I = any, O = any> = (i: I) => Promise<O>;

async function http(u: string, m = 'GET', q?: any, b?: any) {
  const url = new URL(u);
  if (q) Object.entries(q).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  const r = await fetch(url.toString(), {
    method: m,
    headers: { 'content-type': 'application/json' },
    body: b ? JSON.stringify(b) : undefined
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
}

export const health_check: Handler<any, any> = async (i: any) => http(new URL("/health", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const get_user_info: Handler<any, any> = async (i: any) => http(new URL("/user", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const postgres_info: Handler<any, any> = async (i: any) => http(new URL("/postgres/info", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const postgres_schemas: Handler<any, any> = async (i: any) => http(new URL("/postgres/schemas", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const postgres_tables: Handler<any, any> = async (i: any) => http(new URL("/postgres/tables", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const postgres_query: Handler<any, any> = async (i: any) => http(new URL("/postgres/query", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const postgres_execute: Handler<any, any> = async (i: any) => http(new URL("/postgres/execute", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const postgres_table_columns: Handler<any, any> = async (i: any) => http(new URL(`/postgres/table/${i.$path.table_name}/columns`, process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const postgres_table_indexes: Handler<any, any> = async (i: any) => http(new URL(`/postgres/table/${i.$path.table_name}/indexes`, process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const postgres_vector_search: Handler<any, any> = async (i: any) => http(new URL("/postgres/vector-search", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const neo4j_info: Handler<any, any> = async (i: any) => http(new URL("/neo4j/info", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const neo4j_query: Handler<any, any> = async (i: any) => http(new URL("/neo4j/query", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const neo4j_execute: Handler<any, any> = async (i: any) => http(new URL("/neo4j/execute", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const neo4j_nodes: Handler<any, any> = async (i: any) => http(new URL("/neo4j/nodes", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const neo4j_relationships: Handler<any, any> = async (i: any) => http(new URL("/neo4j/relationships", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const neo4j_search: Handler<any, any> = async (i: any) => http(new URL("/neo4j/search", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const qdrant_collections: Handler<any, any> = async (i: any) => http(new URL("/qdrant/collections", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const qdrant_collection_info: Handler<any, any> = async (i: any) => http(new URL(`/qdrant/collection/${i.$path.collection_name}`, process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const qdrant_vector_search: Handler<any, any> = async (i: any) => http(new URL("/qdrant/vector-search", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const qdrant_upsert_points: Handler<any, any> = async (i: any) => http(new URL("/qdrant/upsert", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const qdrant_delete_points: Handler<any, any> = async (i: any) => http(new URL("/qdrant/delete", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const qdrant_get_point: Handler<any, any> = async (i: any) => http(new URL(`/qdrant/point/${i.$path.collection_name}/${i.$path.point_id}`, process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const qdrant_scroll: Handler<any, any> = async (i: any) => http(new URL("/qdrant/scroll", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const langchain_info: Handler<any, any> = async (i: any) => http(new URL("/langchain/info", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const langchain_chat: Handler<any, any> = async (i: any) => http(new URL("/langchain/chat", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const langchain_rag_query: Handler<any, any> = async (i: any) => http(new URL("/langchain/rag-query", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const langchain_ingest_document: Handler<any, any> = async (i: any) => http(new URL("/langchain/ingest", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);
export const gateway_services: Handler<any, any> = async (i: any) => http(new URL("/gateway/services", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const gateway_service_health: Handler<any, any> = async (i: any) => http(new URL(`/gateway/service/${i.$path.service_name}/health`, process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "GET", undefined, undefined);
export const gateway_proxy: Handler<any, any> = async (i: any) => http(new URL("/gateway/proxy", process.env.FREE_AGENT_API_ROOT || "https://chris.srv823383.hstgr.cloud").toString(), "POST", undefined, i.$body);