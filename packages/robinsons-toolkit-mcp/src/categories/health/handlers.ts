/**
 * Health Handlers for Chris's Infrastructure
 * 
 * Handler functions for health checks and user information
 */

import { fastAPIClient } from '../../util/fastapi-client.js';

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

// ============================================================================
// Normalized exports for audit compatibility
// ============================================================================

/**
 * Check health status of the FastAPI gateway and all connected services
 * @see https://api.srv823383.hstgr.cloud/docs#/Health/health_check_health_get
 */
export const fastapiHealthCheck = handleHealthCheck;

/**
 * Get current user information and database status
 * @see https://api.srv823383.hstgr.cloud/docs#/User/user_info_user_info_get
 */
export const fastapiUserInfo = handleUserInfo;

