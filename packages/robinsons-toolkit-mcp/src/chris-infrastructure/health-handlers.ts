/**
 * Health Handlers for Chris's Infrastructure
 * 
 * Handler functions for health checks and user information
 */

import { fastAPIClient } from './fastapi-client.js';

export async function handleHealthCheck(args: any) {
  return await fastAPIClient.request('/health', {
    method: 'GET',
  });
}

export async function handleUserInfo(args: any) {
  return await fastAPIClient.request('/user/info', {
    method: 'GET',
  });
}

