/**
 * Gateway Handlers for Chris's Infrastructure
 * 
 * Handler functions for unified API gateway access
 */

import { fastAPIClient } from '../../util/fastapi-client.js';

export async function handleGatewayServices(args: any) {
  return await fastAPIClient.request('/gateway/services', {
    method: 'GET',
  });
}

export async function handleGatewayServiceHealth(args: any) {
  const { service } = args;
  
  return await fastAPIClient.request(`/gateway/${service}/health`, {
    method: 'GET',
  });
}

export async function handleGatewayProxy(args: any) {
  const { service, path, method = 'GET', query_params, body } = args;
  
  let url = `/gateway/${service}${path}`;
  
  // Add query parameters if provided
  if (query_params && Object.keys(query_params).length > 0) {
    const params = new URLSearchParams(query_params);
    url += `?${params.toString()}`;
  }
  
  const options: any = {
    method,
  };
  
  // Add body for POST/PUT/PATCH requests
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify(body);
  }
  
  return await fastAPIClient.request(url, options);
}

