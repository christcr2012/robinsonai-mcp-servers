/**
 * LangChain Handlers for Chris's Infrastructure
 * 
 * Handler functions for all 4 LangChain tools
 */

import { fastAPIClient } from '../../util/fastapi-client.js';

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

// ============================================================================
// Normalized exports for audit compatibility
// ============================================================================

/**
 * Get LangChain configuration and available features
 * @see https://api.srv823383.hstgr.cloud/docs#/LangChain/get_langchain_info_langchain_info_get
 */
export const fastapiLangchainInfo = handleLangchainInfo;

/**
 * Chat with LLM using LangChain with optional RAG
 * @see https://api.srv823383.hstgr.cloud/docs#/LangChain/chat_langchain_chat_post
 */
export const fastapiLangchainChat = handleLangchainChat;

/**
 * Perform RAG query to search user databases
 * @see https://api.srv823383.hstgr.cloud/docs#/LangChain/rag_query_langchain_rag_query_post
 */
export const fastapiLangchainRagQuery = handleLangchainRagQuery;

/**
 * Ingest document into vector database with automatic embedding generation
 * @see https://api.srv823383.hstgr.cloud/docs#/LangChain/ingest_document_langchain_documents_ingest_post
 */
export const fastapiLangchainIngestDocument = handleLangchainIngestDocument;

