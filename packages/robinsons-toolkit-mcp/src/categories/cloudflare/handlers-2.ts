/**
 * Cloudflare Handler Functions Part 2
 * Zones (remaining 8) + Workers (25 tools)
 */

function formatCloudflareResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// ZONES (8 remaining handlers)
// ============================================================

export async function cloudflareGetAnalytics(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, since, until } = args;
    const analytics = await this.cloudflareClient.zones.analytics.dashboard({ zone_id: zoneId, since, until });
    return formatCloudflareResponse(analytics);
  } catch (error: any) {
    throw new Error(`Failed to get analytics: ${error.message}`);
  }
}

export async function cloudflareGetZonePlan(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const zone = await this.cloudflareClient.zones.get(zoneId);
    return formatCloudflareResponse({ zoneId, plan: zone.plan });
  } catch (error: any) {
    throw new Error(`Failed to get zone plan: ${error.message}`);
  }
}

export async function cloudflareListRateLimits(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, page, perPage } = args;
    const limits = await this.cloudflareClient.zones.rateLimits.list(zoneId, { page, per_page: perPage });
    return formatCloudflareResponse(limits);
  } catch (error: any) {
    throw new Error(`Failed to list rate limits: ${error.message}`);
  }
}

export async function cloudflareCreateRateLimit(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, threshold, period, action } = args;
    const limit = await this.cloudflareClient.zones.rateLimits.create(zoneId, { threshold, period, action });
    return formatCloudflareResponse(limit);
  } catch (error: any) {
    throw new Error(`Failed to create rate limit: ${error.message}`);
  }
}

export async function cloudflareDeleteRateLimit(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, limitId } = args;
    await this.cloudflareClient.zones.rateLimits.del(zoneId, limitId);
    return formatCloudflareResponse({ zoneId, limitId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete rate limit: ${error.message}`);
  }
}

export async function cloudflareListLoadBalancers(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const lbs = await this.cloudflareClient.zones.loadBalancers.list(zoneId);
    return formatCloudflareResponse(lbs);
  } catch (error: any) {
    throw new Error(`Failed to list load balancers: ${error.message}`);
  }
}

export async function cloudflareCreateLoadBalancer(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, name, defaultPools, fallbackPool } = args;
    const lb = await this.cloudflareClient.zones.loadBalancers.create(zoneId, {
      name,
      default_pools: defaultPools,
      fallback_pool: fallbackPool,
    });
    return formatCloudflareResponse(lb);
  } catch (error: any) {
    throw new Error(`Failed to create load balancer: ${error.message}`);
  }
}

export async function cloudflareDeleteLoadBalancer(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, lbId } = args;
    await this.cloudflareClient.zones.loadBalancers.del(zoneId, lbId);
    return formatCloudflareResponse({ zoneId, lbId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete load balancer: ${error.message}`);
  }
}

// ============================================================
// WORKERS (25 handlers)
// ============================================================

export async function cloudflareListWorkers(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const workers = await this.cloudflareClient.workers.scripts.list();
    return formatCloudflareResponse(workers);
  } catch (error: any) {
    throw new Error(`Failed to list workers: ${error.message}`);
  }
}

export async function cloudflareGetWorker(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName } = args;
    const worker = await this.cloudflareClient.workers.scripts.get(scriptName);
    return formatCloudflareResponse(worker);
  } catch (error: any) {
    throw new Error(`Failed to get worker: ${error.message}`);
  }
}

export async function cloudflareUploadWorker(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName, script, bindings } = args;
    const worker = await this.cloudflareClient.workers.scripts.upload(scriptName, { script, bindings });
    return formatCloudflareResponse(worker);
  } catch (error: any) {
    throw new Error(`Failed to upload worker: ${error.message}`);
  }
}

export async function cloudflareDeleteWorker(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName } = args;
    await this.cloudflareClient.workers.scripts.del(scriptName);
    return formatCloudflareResponse({ scriptName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker: ${error.message}`);
  }
}

export async function cloudflareListWorkerRoutes(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const routes = await this.cloudflareClient.workers.routes.list({ zone_id: zoneId });
    return formatCloudflareResponse(routes);
  } catch (error: any) {
    throw new Error(`Failed to list worker routes: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerRoute(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, pattern, scriptName } = args;
    const route = await this.cloudflareClient.workers.routes.create({
      zone_id: zoneId,
      pattern,
      script: scriptName,
    });
    return formatCloudflareResponse(route);
  } catch (error: any) {
    throw new Error(`Failed to create worker route: ${error.message}`);
  }
}

export async function cloudflareUpdateWorkerRoute(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { routeId, pattern, scriptName } = args;
    const route = await this.cloudflareClient.workers.routes.update(routeId, { pattern, script: scriptName });
    return formatCloudflareResponse(route);
  } catch (error: any) {
    throw new Error(`Failed to update worker route: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerRoute(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { routeId } = args;
    await this.cloudflareClient.workers.routes.del(routeId);
    return formatCloudflareResponse({ routeId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker route: ${error.message}`);
  }
}

export async function cloudflareListWorkerCronTriggers(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName } = args;
    const triggers = await this.cloudflareClient.workers.scripts.schedules.get(scriptName);
    return formatCloudflareResponse(triggers);
  } catch (error: any) {
    throw new Error(`Failed to list cron triggers: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerCronTrigger(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName, cron } = args;
    const trigger = await this.cloudflareClient.workers.scripts.schedules.update(scriptName, { crons: [cron] });
    return formatCloudflareResponse(trigger);
  } catch (error: any) {
    throw new Error(`Failed to create cron trigger: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerCronTrigger(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName, cron } = args;
    const result = await this.cloudflareClient.workers.scripts.schedules.update(scriptName, { crons: [] });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to delete cron trigger: ${error.message}`);
  }
}

export async function cloudflareGetWorkerSettings(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName } = args;
    const settings = await this.cloudflareClient.workers.scripts.settings.get(scriptName);
    return formatCloudflareResponse(settings);
  } catch (error: any) {
    throw new Error(`Failed to get worker settings: ${error.message}`);
  }
}

export async function cloudflareUpdateWorkerSettings(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName, settings } = args;
    const result = await this.cloudflareClient.workers.scripts.settings.edit(scriptName, settings);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to update worker settings: ${error.message}`);
  }
}

export async function cloudflareListWorkerSubdomain(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const subdomain = await this.cloudflareClient.workers.subdomain.get();
    return formatCloudflareResponse(subdomain);
  } catch (error: any) {
    throw new Error(`Failed to list worker subdomain: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerSubdomain(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { subdomain } = args;
    const result = await this.cloudflareClient.workers.subdomain.update({ subdomain });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to create worker subdomain: ${error.message}`);
  }
}

export async function cloudflareGetWorkerTail(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName } = args;
    // Tail is a streaming endpoint, return placeholder
    return formatCloudflareResponse({ scriptName, message: 'Use Cloudflare dashboard for live tail' });
  } catch (error: any) {
    throw new Error(`Failed to get worker tail: ${error.message}`);
  }
}

export async function cloudflareListWorkerSecrets(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName } = args;
    const secrets = await this.cloudflareClient.workers.scripts.secrets.list(scriptName);
    return formatCloudflareResponse(secrets);
  } catch (error: any) {
    throw new Error(`Failed to list worker secrets: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerSecret(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName, name, text } = args;
    const secret = await this.cloudflareClient.workers.scripts.secrets.update(scriptName, { name, text });
    return formatCloudflareResponse(secret);
  } catch (error: any) {
    throw new Error(`Failed to create worker secret: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerSecret(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { scriptName, secretName } = args;
    await this.cloudflareClient.workers.scripts.secrets.del(scriptName, secretName);
    return formatCloudflareResponse({ scriptName, secretName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker secret: ${error.message}`);
  }
}

