/**
 * Cloudflare Handler Functions Part 1
 * Zones (DNS & Domain Management) - 30 handlers
 * 
 * Note: Cloudflare SDK uses a different pattern than other integrations.
 * The 'cloudflare' package exports a Cloudflare class that needs to be instantiated.
 * Handlers use this.cloudflareClient which is initialized in index.ts constructor.
 */

// Helper function to format Cloudflare responses
function formatCloudflareResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// ZONES (DNS & Domain Management) - 30 handlers
// ============================================================

export async function cloudflareListZones(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { name, status, page, perPage } = args;
    const zones = await this.cloudflareClient.zones.list({ name, status, page, per_page: perPage });
    return formatCloudflareResponse(zones);
  } catch (error: any) {
    throw new Error(`Failed to list zones: ${error.message}`);
  }
}

export async function cloudflareGetZone(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const zone = await this.cloudflareClient.zones.get(zoneId);
    return formatCloudflareResponse(zone);
  } catch (error: any) {
    throw new Error(`Failed to get zone: ${error.message}`);
  }
}

export async function cloudflareCreateZone(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { name, account, jumpStart, type } = args;
    const zone = await this.cloudflareClient.zones.create({ name, account, jump_start: jumpStart, type });
    return formatCloudflareResponse(zone);
  } catch (error: any) {
    throw new Error(`Failed to create zone: ${error.message}`);
  }
}

export async function cloudflareDeleteZone(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    await this.cloudflareClient.zones.del(zoneId);
    return formatCloudflareResponse({ zoneId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete zone: ${error.message}`);
  }
}

export async function cloudflarePurgeCache(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, purgeEverything, files, tags, hosts } = args;
    const result = await this.cloudflareClient.zones.purgeCache(zoneId, {
      purge_everything: purgeEverything,
      files,
      tags,
      hosts,
    });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to purge cache: ${error.message}`);
  }
}

export async function cloudflareListDnsRecords(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, type, name, content, page, perPage } = args;
    const records = await this.cloudflareClient.dnsRecords.browse(zoneId, {
      type,
      name,
      content,
      page,
      per_page: perPage,
    });
    return formatCloudflareResponse(records);
  } catch (error: any) {
    throw new Error(`Failed to list DNS records: ${error.message}`);
  }
}

export async function cloudflareGetDnsRecord(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, recordId } = args;
    const record = await this.cloudflareClient.dnsRecords.read(zoneId, recordId);
    return formatCloudflareResponse(record);
  } catch (error: any) {
    throw new Error(`Failed to get DNS record: ${error.message}`);
  }
}

export async function cloudflareCreateDnsRecord(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, type, name, content, ttl, priority, proxied } = args;
    const record = await this.cloudflareClient.dnsRecords.add(zoneId, {
      type,
      name,
      content,
      ttl,
      priority,
      proxied,
    });
    return formatCloudflareResponse(record);
  } catch (error: any) {
    throw new Error(`Failed to create DNS record: ${error.message}`);
  }
}

export async function cloudflareUpdateDnsRecord(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, recordId, type, name, content, ttl, proxied } = args;
    const record = await this.cloudflareClient.dnsRecords.edit(zoneId, recordId, {
      type,
      name,
      content,
      ttl,
      proxied,
    });
    return formatCloudflareResponse(record);
  } catch (error: any) {
    throw new Error(`Failed to update DNS record: ${error.message}`);
  }
}

export async function cloudflareDeleteDnsRecord(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, recordId } = args;
    await this.cloudflareClient.dnsRecords.del(zoneId, recordId);
    return formatCloudflareResponse({ zoneId, recordId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete DNS record: ${error.message}`);
  }
}

export async function cloudflareGetZoneSettings(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const settings = await this.cloudflareClient.zoneSettings.browse(zoneId);
    return formatCloudflareResponse(settings);
  } catch (error: any) {
    throw new Error(`Failed to get zone settings: ${error.message}`);
  }
}

export async function cloudflareUpdateZoneSetting(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, setting, value } = args;
    const result = await this.cloudflareClient.zoneSettings.edit(zoneId, setting, { value });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to update zone setting: ${error.message}`);
  }
}

export async function cloudflareGetSslSetting(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const setting = await this.cloudflareClient.zoneSettings.read(zoneId, 'ssl');
    return formatCloudflareResponse(setting);
  } catch (error: any) {
    throw new Error(`Failed to get SSL setting: ${error.message}`);
  }
}

export async function cloudflareUpdateSslSetting(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, value } = args;
    const result = await this.cloudflareClient.zoneSettings.edit(zoneId, 'ssl', { value });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to update SSL setting: ${error.message}`);
  }
}

export async function cloudflareListFirewallRules(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, page, perPage } = args;
    const rules = await this.cloudflareClient.firewallRules.browse(zoneId, { page, per_page: perPage });
    return formatCloudflareResponse(rules);
  } catch (error: any) {
    throw new Error(`Failed to list firewall rules: ${error.message}`);
  }
}

export async function cloudflareCreateFirewallRule(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, filter, action, description, priority } = args;
    const rule = await this.cloudflareClient.firewallRules.add(zoneId, {
      filter,
      action,
      description,
      priority,
    });
    return formatCloudflareResponse(rule);
  } catch (error: any) {
    throw new Error(`Failed to create firewall rule: ${error.message}`);
  }
}

export async function cloudflareUpdateFirewallRule(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, ruleId, filter, action, description } = args;
    const rule = await this.cloudflareClient.firewallRules.edit(zoneId, ruleId, {
      filter,
      action,
      description,
    });
    return formatCloudflareResponse(rule);
  } catch (error: any) {
    throw new Error(`Failed to update firewall rule: ${error.message}`);
  }
}

export async function cloudflareDeleteFirewallRule(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, ruleId } = args;
    await this.cloudflareClient.firewallRules.del(zoneId, ruleId);
    return formatCloudflareResponse({ zoneId, ruleId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete firewall rule: ${error.message}`);
  }
}

export async function cloudflareListPageRules(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const rules = await this.cloudflareClient.pageRules.browse(zoneId);
    return formatCloudflareResponse(rules);
  } catch (error: any) {
    throw new Error(`Failed to list page rules: ${error.message}`);
  }
}

export async function cloudflareCreatePageRule(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, targets, actions, priority, status } = args;
    const rule = await this.cloudflareClient.pageRules.add(zoneId, {
      targets,
      actions,
      priority,
      status,
    });
    return formatCloudflareResponse(rule);
  } catch (error: any) {
    throw new Error(`Failed to create page rule: ${error.message}`);
  }
}

export async function cloudflareUpdatePageRule(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, ruleId, targets, actions, status } = args;
    const rule = await this.cloudflareClient.pageRules.edit(zoneId, ruleId, {
      targets,
      actions,
      status,
    });
    return formatCloudflareResponse(rule);
  } catch (error: any) {
    throw new Error(`Failed to update page rule: ${error.message}`);
  }
}

export async function cloudflareDeletePageRule(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, ruleId } = args;
    await this.cloudflareClient.pageRules.del(zoneId, ruleId);
    return formatCloudflareResponse({ zoneId, ruleId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete page rule: ${error.message}`);
  }
}

