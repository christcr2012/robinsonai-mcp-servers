/**
 * LangChain Handlers for Chris's Infrastructure
 * 
 * Handler functions for all 4 LangChain tools
 */

import { fastAPIClient } from './fastapi-client.js';

export async function handleLangchainInfo(args: any) {
  return await fastAPIClient.request('/langchain/info', {
    method: 'GET',
  });
}

export async function handleLangchainChat(args: any) {
  const { messages, model, temperature, max_tokens, use_rag, rag_source } = args;
  
  return await fastAPIClient.request('/langchain/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages,
      model,
      temperature,
      max_tokens,
      use_rag,
      rag_source,
    }),
  });
}

export async function handleLangchainRagQuery(args: any) {
  const { query, collection_name, table_name, limit, use_context } = args;
  
  return await fastAPIClient.request('/langchain/rag/query', {
    method: 'POST',
    body: JSON.stringify({
      query,
      collection_name,
      table_name,
      limit,
      use_context,
    }),
  });
}

export async function handleLangchainIngestDocument(args: any) {
  const { content, metadata, collection_name, table_name } = args;
  
  return await fastAPIClient.request('/langchain/documents/ingest', {
    method: 'POST',
    body: JSON.stringify({
      content,
      metadata,
      collection_name,
      table_name,
    }),
  });
}

