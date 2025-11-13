/**
 * Cloudflare Handler Functions Part 1
 * Zones (DNS & Domain Management) - 30 handlers
 */

import Cloudflare from 'cloudflare';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

if (!CLOUDFLARE_API_TOKEN) {
  console.warn('Warning: CLOUDFLARE_API_TOKEN environment variable not set');
}

// Initialize Cloudflare client at module level
const cloudflareClient = new Cloudflare({
  apiToken: CLOUDFLARE_API_TOKEN,
});

// Helper function to format Cloudflare responses
function formatCloudflareResponse(result: any) {
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

// ============================================================
// ZONES (DNS & Domain Management) - 30 handlers
// ============================================================

export async function cloudflareListZones(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { name, status, page, perPage } = args;
    const zones = await cloudflareClient.zones.list({ name, status, page, per_page: perPage });
    return formatCloudflareResponse(zones);
  } catch (error: any) {
    throw new Error(`Failed to list zones: ${error.message}`);
  }
}

export async function cloudflareGetZone(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const zone = await cloudflareClient.zones.get(zoneId);
    return formatCloudflareResponse(zone);
  } catch (error: any) {
    throw new Error(`Failed to get zone: ${error.message}`);
  }
}

export async function cloudflareCreateZone(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { name, account, jumpStart, type } = args;
    const zone = await cloudflareClient.zones.create({ name, account, jump_start: jumpStart, type });
    return formatCloudflareResponse(zone);
  } catch (error: any) {
    throw new Error(`Failed to create zone: ${error.message}`);
  }
}

export async function cloudflareDeleteZone(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    await cloudflareClient.zones.del(zoneId);
    return formatCloudflareResponse({ zoneId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete zone: ${error.message}`);
  }
}

export async function cloudflarePurgeCache(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, purgeEverything, files, tags, hosts } = args;
    const result = await cloudflareClient.zones.purgeCache(zoneId, {
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

export async function cloudflareListDnsRecords(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, type, name, content, page, perPage } = args;
    const records = await cloudflareClient.dnsRecords.browse(zoneId, {
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

export async function cloudflareGetDnsRecord(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, recordId } = args;
    const record = await cloudflareClient.dnsRecords.read(zoneId, recordId);
    return formatCloudflareResponse(record);
  } catch (error: any) {
    throw new Error(`Failed to get DNS record: ${error.message}`);
  }
}

export async function cloudflareCreateDnsRecord(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, type, name, content, ttl, priority, proxied } = args;
    const record = await cloudflareClient.dnsRecords.add(zoneId, {
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

export async function cloudflareUpdateDnsRecord(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, recordId, type, name, content, ttl, proxied } = args;
    const record = await cloudflareClient.dnsRecords.edit(zoneId, recordId, {
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

export async function cloudflareDeleteDnsRecord(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, recordId } = args;
    await cloudflareClient.dnsRecords.del(zoneId, recordId);
    return formatCloudflareResponse({ zoneId, recordId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete DNS record: ${error.message}`);
  }
}

export async function cloudflareGetZoneSettings(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const settings = await cloudflareClient.zoneSettings.browse(zoneId);
    return formatCloudflareResponse(settings);
  } catch (error: any) {
    throw new Error(`Failed to get zone settings: ${error.message}`);
  }
}

export async function cloudflareUpdateZoneSetting(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, setting, value } = args;
    const result = await cloudflareClient.zoneSettings.edit(zoneId, setting, { value });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to update zone setting: ${error.message}`);
  }
}

export async function cloudflareGetSslSetting(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const setting = await cloudflareClient.zoneSettings.read(zoneId, 'ssl');
    return formatCloudflareResponse(setting);
  } catch (error: any) {
    throw new Error(`Failed to get SSL setting: ${error.message}`);
  }
}

export async function cloudflareUpdateSslSetting(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, value } = args;
    const result = await cloudflareClient.zoneSettings.edit(zoneId, 'ssl', { value });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to update SSL setting: ${error.message}`);
  }
}

export async function cloudflareListFirewallRules(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, page, perPage } = args;
    const rules = await cloudflareClient.firewallRules.browse(zoneId, { page, per_page: perPage });
    return formatCloudflareResponse(rules);
  } catch (error: any) {
    throw new Error(`Failed to list firewall rules: ${error.message}`);
  }
}

export async function cloudflareCreateFirewallRule(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, filter, action, description, priority } = args;
    const rule = await cloudflareClient.firewallRules.add(zoneId, {
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

export async function cloudflareUpdateFirewallRule(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, ruleId, filter, action, description } = args;
    const rule = await cloudflareClient.firewallRules.edit(zoneId, ruleId, {
      filter,
      action,
      description,
    });
    return formatCloudflareResponse(rule);
  } catch (error: any) {
    throw new Error(`Failed to update firewall rule: ${error.message}`);
  }
}

export async function cloudflareDeleteFirewallRule(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, ruleId } = args;
    await cloudflareClient.firewallRules.del(zoneId, ruleId);
    return formatCloudflareResponse({ zoneId, ruleId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete firewall rule: ${error.message}`);
  }
}

export async function cloudflareListPageRules(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const rules = await cloudflareClient.pageRules.browse(zoneId);
    return formatCloudflareResponse(rules);
  } catch (error: any) {
    throw new Error(`Failed to list page rules: ${error.message}`);
  }
}

export async function cloudflareCreatePageRule(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, targets, actions, priority, status } = args;
    const rule = await cloudflareClient.pageRules.add(zoneId, {
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

export async function cloudflareUpdatePageRule(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, ruleId, targets, actions, status } = args;
    const rule = await cloudflareClient.pageRules.edit(zoneId, ruleId, {
      targets,
      actions,
      status,
    });
    return formatCloudflareResponse(rule);
  } catch (error: any) {
    throw new Error(`Failed to update page rule: ${error.message}`);
  }
}

export async function cloudflareDeletePageRule(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, ruleId } = args;
    await cloudflareClient.pageRules.del(zoneId, ruleId);
    return formatCloudflareResponse({ zoneId, ruleId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete page rule: ${error.message}`);
  }
}

// ============================================================
// R2 STORAGE - 20 handlers
// ============================================================

export async function cloudflareCreateR2Bucket(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name } = args;
    const bucket = await cloudflareClient.r2.buckets.create(accountId, { name });
    return formatCloudflareResponse(bucket);
  } catch (error: any) {
    throw new Error(`Failed to create R2 bucket: ${error.message}`);
  }
}

export async function cloudflareListR2Buckets(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const buckets = await cloudflareClient.r2.buckets.list(accountId);
    return formatCloudflareResponse(buckets);
  } catch (error: any) {
    throw new Error(`Failed to list R2 buckets: ${error.message}`);
  }
}

export async function cloudflareGetR2Bucket(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    const bucket = await cloudflareClient.r2.buckets.get(accountId, bucketName);
    return formatCloudflareResponse(bucket);
  } catch (error: any) {
    throw new Error(`Failed to get R2 bucket: ${error.message}`);
  }
}

export async function cloudflareDeleteR2Bucket(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    await cloudflareClient.r2.buckets.delete(accountId, bucketName);
    return formatCloudflareResponse({ accountId, bucketName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete R2 bucket: ${error.message}`);
  }
}

export async function cloudflareUploadR2Object(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, body } = args;
    const object = await cloudflareClient.r2.objects.put(accountId, bucketName, key, body);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to upload R2 object: ${error.message}`);
  }
}

export async function cloudflareGetR2Object(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key } = args;
    const object = await cloudflareClient.r2.objects.get(accountId, bucketName, key);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to get R2 object: ${error.message}`);
  }
}

export async function cloudflareDeleteR2Object(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key } = args;
    await cloudflareClient.r2.objects.delete(accountId, bucketName, key);
    return formatCloudflareResponse({ accountId, bucketName, key, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete R2 object: ${error.message}`);
  }
}

export async function cloudflareListR2Objects(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, prefix } = args;
    const objects = await cloudflareClient.r2.objects.list(accountId, bucketName, { prefix });
    return formatCloudflareResponse(objects);
  } catch (error: any) {
    throw new Error(`Failed to list R2 objects: ${error.message}`);
  }
}

export async function cloudflareCopyR2Object(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, sourceKey, destinationKey } = args;
    const object = await cloudflareClient.r2.objects.copy(accountId, bucketName, sourceKey, destinationKey);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to copy R2 object: ${error.message}`);
  }
}

export async function cloudflareGetR2ObjectMetadata(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key } = args;
    const metadata = await cloudflareClient.r2.objects.head(accountId, bucketName, key);
    return formatCloudflareResponse(metadata);
  } catch (error: any) {
    throw new Error(`Failed to get R2 object metadata: ${error.message}`);
  }
}

export async function cloudflareCreateR2MultipartUpload(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key } = args;
    const upload = await cloudflareClient.r2.multipart.create(accountId, bucketName, key);
    return formatCloudflareResponse(upload);
  } catch (error: any) {
    throw new Error(`Failed to create R2 multipart upload: ${error.message}`);
  }
}

export async function cloudflareUploadR2Part(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, uploadId, partNumber, body } = args;
    const part = await cloudflareClient.r2.multipart.uploadPart(accountId, bucketName, key, uploadId, partNumber, body);
    return formatCloudflareResponse(part);
  } catch (error: any) {
    throw new Error(`Failed to upload R2 part: ${error.message}`);
  }
}

export async function cloudflareCompleteR2MultipartUpload(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, uploadId, parts } = args;
    const object = await cloudflareClient.r2.multipart.complete(accountId, bucketName, key, uploadId, parts);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to complete R2 multipart upload: ${error.message}`);
  }
}

export async function cloudflareAbortR2MultipartUpload(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, uploadId } = args;
    await cloudflareClient.r2.multipart.abort(accountId, bucketName, key, uploadId);
    return formatCloudflareResponse({ accountId, bucketName, key, uploadId, status: 'aborted' });
  } catch (error: any) {
    throw new Error(`Failed to abort R2 multipart upload: ${error.message}`);
  }
}

export async function cloudflareListR2MultipartUploads(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    const uploads = await cloudflareClient.r2.multipart.list(accountId, bucketName);
    return formatCloudflareResponse(uploads);
  } catch (error: any) {
    throw new Error(`Failed to list R2 multipart uploads: ${error.message}`);
  }
}

export async function cloudflareListR2Parts(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, uploadId } = args;
    const parts = await cloudflareClient.r2.multipart.listParts(accountId, bucketName, key, uploadId);
    return formatCloudflareResponse(parts);
  } catch (error: any) {
    throw new Error(`Failed to list R2 parts: ${error.message}`);
  }
}

export async function cloudflareGetR2BucketUsage(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    const usage = await cloudflareClient.r2.buckets.usage(accountId, bucketName);
    return formatCloudflareResponse(usage);
  } catch (error: any) {
    throw new Error(`Failed to get R2 bucket usage: ${error.message}`);
  }
}

export async function cloudflareSetR2BucketCors(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, corsRules } = args;
    const cors = await cloudflareClient.r2.buckets.setCors(accountId, bucketName, corsRules);
    return formatCloudflareResponse(cors);
  } catch (error: any) {
    throw new Error(`Failed to set R2 bucket CORS: ${error.message}`);
  }
}

export async function cloudflareGetR2BucketCors(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    const cors = await cloudflareClient.r2.buckets.getCors(accountId, bucketName);
    return formatCloudflareResponse(cors);
  } catch (error: any) {
    throw new Error(`Failed to get R2 bucket CORS: ${error.message}`);
  }
}

export async function cloudflareDeleteR2BucketCors(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    await cloudflareClient.r2.buckets.deleteCors(accountId, bucketName);
    return formatCloudflareResponse({ accountId, bucketName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete R2 bucket CORS: ${error.message}`);
  }
}

// ============================================================
// KV STORAGE - 15 handlers
// ============================================================

export async function cloudflareCreateKvNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, title } = args;
    const namespace = await cloudflareClient.kv.namespaces.create(accountId, { title });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to create KV namespace: ${error.message}`);
  }
}

export async function cloudflareListKvNamespaces(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const namespaces = await cloudflareClient.kv.namespaces.list(accountId);
    return formatCloudflareResponse(namespaces);
  } catch (error: any) {
    throw new Error(`Failed to list KV namespaces: ${error.message}`);
  }
}

export async function cloudflareGetKvNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    const namespace = await cloudflareClient.kv.namespaces.get(accountId, namespaceId);
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to get KV namespace: ${error.message}`);
  }
}

export async function cloudflareRenameKvNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, title } = args;
    const namespace = await cloudflareClient.kv.namespaces.update(accountId, namespaceId, { title });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to rename KV namespace: ${error.message}`);
  }
}

export async function cloudflareDeleteKvNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    await cloudflareClient.kv.namespaces.delete(accountId, namespaceId);
    return formatCloudflareResponse({ accountId, namespaceId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete KV namespace: ${error.message}`);
  }
}

export async function cloudflareWriteKvValue(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key, value, metadata } = args;
    await cloudflareClient.kv.values.put(accountId, namespaceId, key, value, { metadata });
    return formatCloudflareResponse({ accountId, namespaceId, key, status: 'written' });
  } catch (error: any) {
    throw new Error(`Failed to write KV value: ${error.message}`);
  }
}

export async function cloudflareReadKvValue(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key } = args;
    const value = await cloudflareClient.kv.values.get(accountId, namespaceId, key);
    return formatCloudflareResponse({ key, value });
  } catch (error: any) {
    throw new Error(`Failed to read KV value: ${error.message}`);
  }
}

export async function cloudflareDeleteKvValue(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key } = args;
    await cloudflareClient.kv.values.delete(accountId, namespaceId, key);
    return formatCloudflareResponse({ accountId, namespaceId, key, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete KV value: ${error.message}`);
  }
}

export async function cloudflareListKvKeys(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, prefix } = args;
    const keys = await cloudflareClient.kv.keys.list(accountId, namespaceId, { prefix });
    return formatCloudflareResponse(keys);
  } catch (error: any) {
    throw new Error(`Failed to list KV keys: ${error.message}`);
  }
}

export async function cloudflareWriteKvBulk(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, keyValuePairs } = args;
    await cloudflareClient.kv.bulk.put(accountId, namespaceId, keyValuePairs);
    return formatCloudflareResponse({ accountId, namespaceId, count: keyValuePairs.length, status: 'written' });
  } catch (error: any) {
    throw new Error(`Failed to write KV bulk: ${error.message}`);
  }
}

export async function cloudflareDeleteKvBulk(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, keys } = args;
    await cloudflareClient.kv.bulk.delete(accountId, namespaceId, keys);
    return formatCloudflareResponse({ accountId, namespaceId, count: keys.length, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete KV bulk: ${error.message}`);
  }
}

export async function cloudflareGetKvMetadata(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key } = args;
    const metadata = await cloudflareClient.kv.metadata.get(accountId, namespaceId, key);
    return formatCloudflareResponse(metadata);
  } catch (error: any) {
    throw new Error(`Failed to get KV metadata: ${error.message}`);
  }
}

export async function cloudflareListKvNamespaceKeys(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, limit, cursor } = args;
    const keys = await cloudflareClient.kv.keys.list(accountId, namespaceId, { limit, cursor });
    return formatCloudflareResponse(keys);
  } catch (error: any) {
    throw new Error(`Failed to list KV namespace keys: ${error.message}`);
  }
}

export async function cloudflareGetKvValueWithMetadata(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key } = args;
    const result = await cloudflareClient.kv.values.getWithMetadata(accountId, namespaceId, key);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to get KV value with metadata: ${error.message}`);
  }
}

export async function cloudflareSetKvExpiration(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key, expiration } = args;
    await cloudflareClient.kv.values.put(accountId, namespaceId, key, null, { expiration });
    return formatCloudflareResponse({ accountId, namespaceId, key, expiration, status: 'set' });
  } catch (error: any) {
    throw new Error(`Failed to set KV expiration: ${error.message}`);
  }
}

// ============================================================
// D1 DATABASE - 10 handlers
// ============================================================

export async function cloudflareCreateD1Database(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name } = args;
    const database = await cloudflareClient.d1.databases.create(accountId, { name });
    return formatCloudflareResponse(database);
  } catch (error: any) {
    throw new Error(`Failed to create D1 database: ${error.message}`);
  }
}

export async function cloudflareListD1Databases(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const databases = await cloudflareClient.d1.databases.list(accountId);
    return formatCloudflareResponse(databases);
  } catch (error: any) {
    throw new Error(`Failed to list D1 databases: ${error.message}`);
  }
}

export async function cloudflareGetD1Database(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const database = await cloudflareClient.d1.databases.get(accountId, databaseId);
    return formatCloudflareResponse(database);
  } catch (error: any) {
    throw new Error(`Failed to get D1 database: ${error.message}`);
  }
}

export async function cloudflareDeleteD1Database(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    await cloudflareClient.d1.databases.delete(accountId, databaseId);
    return formatCloudflareResponse({ accountId, databaseId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete D1 database: ${error.message}`);
  }
}

export async function cloudflareQueryD1Database(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, sql, params } = args;
    const result = await cloudflareClient.d1.query.execute(accountId, databaseId, sql, params);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to query D1 database: ${error.message}`);
  }
}

export async function cloudflareBackupD1Database(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const backup = await cloudflareClient.d1.backups.create(accountId, databaseId);
    return formatCloudflareResponse(backup);
  } catch (error: any) {
    throw new Error(`Failed to backup D1 database: ${error.message}`);
  }
}

export async function cloudflareListD1Backups(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const backups = await cloudflareClient.d1.backups.list(accountId, databaseId);
    return formatCloudflareResponse(backups);
  } catch (error: any) {
    throw new Error(`Failed to list D1 backups: ${error.message}`);
  }
}

export async function cloudflareRestoreD1Backup(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, backupId } = args;
    const result = await cloudflareClient.d1.backups.restore(accountId, databaseId, backupId);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to restore D1 backup: ${error.message}`);
  }
}

export async function cloudflareDeleteD1Backup(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, backupId } = args;
    await cloudflareClient.d1.backups.delete(accountId, databaseId, backupId);
    return formatCloudflareResponse({ accountId, databaseId, backupId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete D1 backup: ${error.message}`);
  }
}

export async function cloudflareGetD1DatabaseSize(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const size = await cloudflareClient.d1.databases.size(accountId, databaseId);
    return formatCloudflareResponse(size);
  } catch (error: any) {
    throw new Error(`Failed to get D1 database size: ${error.message}`);
  }
}

// ============================================================
// QUEUES - 10 handlers
// ============================================================

export async function cloudflareCreateQueue(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name } = args;
    const queue = await cloudflareClient.queues.create(accountId, { name });
    return formatCloudflareResponse(queue);
  } catch (error: any) {
    throw new Error(`Failed to create queue: ${error.message}`);
  }
}

export async function cloudflareListQueues(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const queues = await cloudflareClient.queues.list(accountId);
    return formatCloudflareResponse(queues);
  } catch (error: any) {
    throw new Error(`Failed to list queues: ${error.message}`);
  }
}

export async function cloudflareGetQueue(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    const queue = await cloudflareClient.queues.get(accountId, queueId);
    return formatCloudflareResponse(queue);
  } catch (error: any) {
    throw new Error(`Failed to get queue: ${error.message}`);
  }
}

export async function cloudflareUpdateQueue(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, settings } = args;
    const queue = await cloudflareClient.queues.update(accountId, queueId, settings);
    return formatCloudflareResponse(queue);
  } catch (error: any) {
    throw new Error(`Failed to update queue: ${error.message}`);
  }
}

export async function cloudflareDeleteQueue(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    await cloudflareClient.queues.delete(accountId, queueId);
    return formatCloudflareResponse({ accountId, queueId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete queue: ${error.message}`);
  }
}

export async function cloudflareSendQueueMessage(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, messages } = args;
    const result = await cloudflareClient.queues.send(accountId, queueId, messages);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to send queue message: ${error.message}`);
  }
}

export async function cloudflareReceiveQueueMessages(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, batchSize } = args;
    const messages = await cloudflareClient.queues.receive(accountId, queueId, { batchSize });
    return formatCloudflareResponse(messages);
  } catch (error: any) {
    throw new Error(`Failed to receive queue messages: ${error.message}`);
  }
}

export async function cloudflareAckQueueMessage(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, messageId } = args;
    await cloudflareClient.queues.ack(accountId, queueId, messageId);
    return formatCloudflareResponse({ accountId, queueId, messageId, status: 'acknowledged' });
  } catch (error: any) {
    throw new Error(`Failed to acknowledge queue message: ${error.message}`);
  }
}

export async function cloudflareGetQueueMetrics(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    const metrics = await cloudflareClient.queues.metrics(accountId, queueId);
    return formatCloudflareResponse(metrics);
  } catch (error: any) {
    throw new Error(`Failed to get queue metrics: ${error.message}`);
  }
}

export async function cloudflarePurgeQueue(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    await cloudflareClient.queues.purge(accountId, queueId);
    return formatCloudflareResponse({ accountId, queueId, status: 'purged' });
  } catch (error: any) {
    throw new Error(`Failed to purge queue: ${error.message}`);
  }
}

// ============================================================
// WORKERS - 20 handlers
// ============================================================

export async function cloudflareUploadWorkerScript(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, script, bindings } = args;
    const worker = await cloudflareClient.workers.scripts.upload(accountId, scriptName, script, { bindings });
    return formatCloudflareResponse(worker);
  } catch (error: any) {
    throw new Error(`Failed to upload worker script: ${error.message}`);
  }
}

export async function cloudflareListWorkerScripts(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const scripts = await cloudflareClient.workers.scripts.list(accountId);
    return formatCloudflareResponse(scripts);
  } catch (error: any) {
    throw new Error(`Failed to list worker scripts: ${error.message}`);
  }
}

export async function cloudflareGetWorkerScript(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const script = await cloudflareClient.workers.scripts.get(accountId, scriptName);
    return formatCloudflareResponse(script);
  } catch (error: any) {
    throw new Error(`Failed to get worker script: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerScript(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    await cloudflareClient.workers.scripts.delete(accountId, scriptName);
    return formatCloudflareResponse({ accountId, scriptName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker script: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerRoute(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, pattern, scriptName } = args;
    const route = await cloudflareClient.workers.routes.create(zoneId, { pattern, script: scriptName });
    return formatCloudflareResponse(route);
  } catch (error: any) {
    throw new Error(`Failed to create worker route: ${error.message}`);
  }
}

export async function cloudflareListWorkerRoutes(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const routes = await cloudflareClient.workers.routes.list(zoneId);
    return formatCloudflareResponse(routes);
  } catch (error: any) {
    throw new Error(`Failed to list worker routes: ${error.message}`);
  }
}

export async function cloudflareGetWorkerRoute(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, routeId } = args;
    const route = await cloudflareClient.workers.routes.get(zoneId, routeId);
    return formatCloudflareResponse(route);
  } catch (error: any) {
    throw new Error(`Failed to get worker route: ${error.message}`);
  }
}

export async function cloudflareUpdateWorkerRoute(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, routeId, pattern, scriptName } = args;
    const route = await cloudflareClient.workers.routes.update(zoneId, routeId, { pattern, script: scriptName });
    return formatCloudflareResponse(route);
  } catch (error: any) {
    throw new Error(`Failed to update worker route: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerRoute(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, routeId } = args;
    await cloudflareClient.workers.routes.delete(zoneId, routeId);
    return formatCloudflareResponse({ zoneId, routeId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker route: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerCronTrigger(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, cron } = args;
    const trigger = await cloudflareClient.workers.cron.create(accountId, scriptName, { cron });
    return formatCloudflareResponse(trigger);
  } catch (error: any) {
    throw new Error(`Failed to create worker cron trigger: ${error.message}`);
  }
}

export async function cloudflareListWorkerCronTriggers(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const triggers = await cloudflareClient.workers.cron.list(accountId, scriptName);
    return formatCloudflareResponse(triggers);
  } catch (error: any) {
    throw new Error(`Failed to list worker cron triggers: ${error.message}`);
  }
}

export async function cloudflareUpdateWorkerCronTrigger(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, triggerId, cron } = args;
    const trigger = await cloudflareClient.workers.cron.update(accountId, scriptName, triggerId, { cron });
    return formatCloudflareResponse(trigger);
  } catch (error: any) {
    throw new Error(`Failed to update worker cron trigger: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerCronTrigger(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, triggerId } = args;
    await cloudflareClient.workers.cron.delete(accountId, scriptName, triggerId);
    return formatCloudflareResponse({ accountId, scriptName, triggerId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker cron trigger: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerSecret(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, name, text } = args;
    const secret = await cloudflareClient.workers.secrets.put(accountId, scriptName, name, text);
    return formatCloudflareResponse(secret);
  } catch (error: any) {
    throw new Error(`Failed to create worker secret: ${error.message}`);
  }
}

export async function cloudflareListWorkerSecrets(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const secrets = await cloudflareClient.workers.secrets.list(accountId, scriptName);
    return formatCloudflareResponse(secrets);
  } catch (error: any) {
    throw new Error(`Failed to list worker secrets: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerSecret(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, secretName } = args;
    await cloudflareClient.workers.secrets.delete(accountId, scriptName, secretName);
    return formatCloudflareResponse({ accountId, scriptName, secretName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker secret: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, title } = args;
    const namespace = await cloudflareClient.workers.namespaces.create(accountId, { title });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to create worker namespace: ${error.message}`);
  }
}

export async function cloudflareListWorkerNamespaces(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const namespaces = await cloudflareClient.workers.namespaces.list(accountId);
    return formatCloudflareResponse(namespaces);
  } catch (error: any) {
    throw new Error(`Failed to list worker namespaces: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    await cloudflareClient.workers.namespaces.delete(accountId, namespaceId);
    return formatCloudflareResponse({ accountId, namespaceId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker namespace: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerSubdomain(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, subdomain } = args;
    const result = await cloudflareClient.workers.subdomain.create(accountId, { subdomain });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to create worker subdomain: ${error.message}`);
  }
}

// ============================================================
// PAGES - 15 handlers
// ============================================================

export async function cloudflareCreatePagesProject(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name, productionBranch } = args;
    const project = await cloudflareClient.pages.projects.create(accountId, { name, production_branch: productionBranch });
    return formatCloudflareResponse(project);
  } catch (error: any) {
    throw new Error(`Failed to create Pages project: ${error.message}`);
  }
}

export async function cloudflareListPagesProjects(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const projects = await cloudflareClient.pages.projects.list(accountId);
    return formatCloudflareResponse(projects);
  } catch (error: any) {
    throw new Error(`Failed to list Pages projects: ${error.message}`);
  }
}

export async function cloudflareGetPagesProject(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    const project = await cloudflareClient.pages.projects.get(accountId, projectName);
    return formatCloudflareResponse(project);
  } catch (error: any) {
    throw new Error(`Failed to get Pages project: ${error.message}`);
  }
}

export async function cloudflareUpdatePagesProject(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, settings } = args;
    const project = await cloudflareClient.pages.projects.update(accountId, projectName, settings);
    return formatCloudflareResponse(project);
  } catch (error: any) {
    throw new Error(`Failed to update Pages project: ${error.message}`);
  }
}

export async function cloudflareDeletePagesProject(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    await cloudflareClient.pages.projects.delete(accountId, projectName);
    return formatCloudflareResponse({ accountId, projectName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Pages project: ${error.message}`);
  }
}

export async function cloudflareCreatePagesDeployment(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, branch } = args;
    const deployment = await cloudflareClient.pages.deployments.create(accountId, projectName, { branch });
    return formatCloudflareResponse(deployment);
  } catch (error: any) {
    throw new Error(`Failed to create Pages deployment: ${error.message}`);
  }
}

export async function cloudflareListPagesDeployments(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    const deployments = await cloudflareClient.pages.deployments.list(accountId, projectName);
    return formatCloudflareResponse(deployments);
  } catch (error: any) {
    throw new Error(`Failed to list Pages deployments: ${error.message}`);
  }
}

export async function cloudflareGetPagesDeployment(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    const deployment = await cloudflareClient.pages.deployments.get(accountId, projectName, deploymentId);
    return formatCloudflareResponse(deployment);
  } catch (error: any) {
    throw new Error(`Failed to get Pages deployment: ${error.message}`);
  }
}

export async function cloudflareRetryPagesDeployment(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    const deployment = await cloudflareClient.pages.deployments.retry(accountId, projectName, deploymentId);
    return formatCloudflareResponse(deployment);
  } catch (error: any) {
    throw new Error(`Failed to retry Pages deployment: ${error.message}`);
  }
}

export async function cloudflareRollbackPagesDeployment(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    const deployment = await cloudflareClient.pages.deployments.rollback(accountId, projectName, deploymentId);
    return formatCloudflareResponse(deployment);
  } catch (error: any) {
    throw new Error(`Failed to rollback Pages deployment: ${error.message}`);
  }
}

export async function cloudflareDeletePagesDeployment(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    await cloudflareClient.pages.deployments.delete(accountId, projectName, deploymentId);
    return formatCloudflareResponse({ accountId, projectName, deploymentId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Pages deployment: ${error.message}`);
  }
}

export async function cloudflareAddPagesDomain(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, domain } = args;
    const result = await cloudflareClient.pages.domains.add(accountId, projectName, { domain });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to add Pages domain: ${error.message}`);
  }
}

export async function cloudflareListPagesDomains(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    const domains = await cloudflareClient.pages.domains.list(accountId, projectName);
    return formatCloudflareResponse(domains);
  } catch (error: any) {
    throw new Error(`Failed to list Pages domains: ${error.message}`);
  }
}

export async function cloudflareGetPagesDomain(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, domain } = args;
    const domainInfo = await cloudflareClient.pages.domains.get(accountId, projectName, domain);
    return formatCloudflareResponse(domainInfo);
  } catch (error: any) {
    throw new Error(`Failed to get Pages domain: ${error.message}`);
  }
}

export async function cloudflareDeletePagesDomain(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, domain } = args;
    await cloudflareClient.pages.domains.delete(accountId, projectName, domain);
    return formatCloudflareResponse({ accountId, projectName, domain, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Pages domain: ${error.message}`);
  }
}

// ============================================================
// STREAM - 15 handlers
// ============================================================

export async function cloudflareUploadStreamVideo(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, file, metadata } = args;
    const video = await cloudflareClient.stream.videos.upload(accountId, file, metadata);
    return formatCloudflareResponse(video);
  } catch (error: any) {
    throw new Error(`Failed to upload Stream video: ${error.message}`);
  }
}

export async function cloudflareListStreamVideos(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const videos = await cloudflareClient.stream.videos.list(accountId);
    return formatCloudflareResponse(videos);
  } catch (error: any) {
    throw new Error(`Failed to list Stream videos: ${error.message}`);
  }
}

export async function cloudflareGetStreamVideo(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId } = args;
    const video = await cloudflareClient.stream.videos.get(accountId, videoId);
    return formatCloudflareResponse(video);
  } catch (error: any) {
    throw new Error(`Failed to get Stream video: ${error.message}`);
  }
}

export async function cloudflareUpdateStreamVideo(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId, metadata } = args;
    const video = await cloudflareClient.stream.videos.update(accountId, videoId, metadata);
    return formatCloudflareResponse(video);
  } catch (error: any) {
    throw new Error(`Failed to update Stream video: ${error.message}`);
  }
}

export async function cloudflareDeleteStreamVideo(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId } = args;
    await cloudflareClient.stream.videos.delete(accountId, videoId);
    return formatCloudflareResponse({ accountId, videoId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Stream video: ${error.message}`);
  }
}

export async function cloudflareCreateStreamLiveInput(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, metadata } = args;
    const liveInput = await cloudflareClient.stream.liveInputs.create(accountId, metadata);
    return formatCloudflareResponse(liveInput);
  } catch (error: any) {
    throw new Error(`Failed to create Stream live input: ${error.message}`);
  }
}

export async function cloudflareListStreamLiveInputs(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const liveInputs = await cloudflareClient.stream.liveInputs.list(accountId);
    return formatCloudflareResponse(liveInputs);
  } catch (error: any) {
    throw new Error(`Failed to list Stream live inputs: ${error.message}`);
  }
}

export async function cloudflareGetStreamLiveInput(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, liveInputId } = args;
    const liveInput = await cloudflareClient.stream.liveInputs.get(accountId, liveInputId);
    return formatCloudflareResponse(liveInput);
  } catch (error: any) {
    throw new Error(`Failed to get Stream live input: ${error.message}`);
  }
}

export async function cloudflareUpdateStreamLiveInput(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, liveInputId, metadata } = args;
    const liveInput = await cloudflareClient.stream.liveInputs.update(accountId, liveInputId, metadata);
    return formatCloudflareResponse(liveInput);
  } catch (error: any) {
    throw new Error(`Failed to update Stream live input: ${error.message}`);
  }
}

export async function cloudflareDeleteStreamLiveInput(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, liveInputId } = args;
    await cloudflareClient.stream.liveInputs.delete(accountId, liveInputId);
    return formatCloudflareResponse({ accountId, liveInputId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Stream live input: ${error.message}`);
  }
}

export async function cloudflareCreateStreamWebhook(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, notificationUrl } = args;
    const webhook = await cloudflareClient.stream.webhooks.create(accountId, { notificationUrl });
    return formatCloudflareResponse(webhook);
  } catch (error: any) {
    throw new Error(`Failed to create Stream webhook: ${error.message}`);
  }
}

export async function cloudflareListStreamWebhooks(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const webhooks = await cloudflareClient.stream.webhooks.list(accountId);
    return formatCloudflareResponse(webhooks);
  } catch (error: any) {
    throw new Error(`Failed to list Stream webhooks: ${error.message}`);
  }
}

export async function cloudflareUpdateStreamWebhook(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, webhookId, notificationUrl } = args;
    const webhook = await cloudflareClient.stream.webhooks.update(accountId, webhookId, { notificationUrl });
    return formatCloudflareResponse(webhook);
  } catch (error: any) {
    throw new Error(`Failed to update Stream webhook: ${error.message}`);
  }
}

export async function cloudflareDeleteStreamWebhook(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, webhookId } = args;
    await cloudflareClient.stream.webhooks.delete(accountId, webhookId);
    return formatCloudflareResponse({ accountId, webhookId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Stream webhook: ${error.message}`);
  }
}

export async function cloudflareGetStreamAnalytics(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId } = args;
    const analytics = await cloudflareClient.stream.analytics.get(accountId, videoId);
    return formatCloudflareResponse(analytics);
  } catch (error: any) {
    throw new Error(`Failed to get Stream analytics: ${error.message}`);
  }
}

// ============================================================
// DURABLE OBJECTS - 10 handlers
// ============================================================

export async function cloudflareCreateDurableObjectsNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name, scriptName, className } = args;
    const namespace = await cloudflareClient.durableObjects.namespaces.create(accountId, { name, script_name: scriptName, class_name: className });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to create Durable Objects namespace: ${error.message}`);
  }
}

export async function cloudflareListDurableObjectsNamespaces(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const namespaces = await cloudflareClient.durableObjects.namespaces.list(accountId);
    return formatCloudflareResponse(namespaces);
  } catch (error: any) {
    throw new Error(`Failed to list Durable Objects namespaces: ${error.message}`);
  }
}

export async function cloudflareGetDurableObjectsNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    const namespace = await cloudflareClient.durableObjects.namespaces.get(accountId, namespaceId);
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to get Durable Objects namespace: ${error.message}`);
  }
}

export async function cloudflareDeleteDurableObjectsNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    await cloudflareClient.durableObjects.namespaces.delete(accountId, namespaceId);
    return formatCloudflareResponse({ accountId, namespaceId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Durable Objects namespace: ${error.message}`);
  }
}

export async function cloudflareListDurableObjects(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    const objects = await cloudflareClient.durableObjects.objects.list(accountId, namespaceId);
    return formatCloudflareResponse(objects);
  } catch (error: any) {
    throw new Error(`Failed to list Durable Objects: ${error.message}`);
  }
}

export async function cloudflareGetDurableObject(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId } = args;
    const object = await cloudflareClient.durableObjects.objects.get(accountId, namespaceId, objectId);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to get Durable Object: ${error.message}`);
  }
}

export async function cloudflareDeleteDurableObject(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId } = args;
    await cloudflareClient.durableObjects.objects.delete(accountId, namespaceId, objectId);
    return formatCloudflareResponse({ accountId, namespaceId, objectId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Durable Object: ${error.message}`);
  }
}

export async function cloudflareGetDurableObjectAlarms(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId } = args;
    const alarms = await cloudflareClient.durableObjects.alarms.get(accountId, namespaceId, objectId);
    return formatCloudflareResponse(alarms);
  } catch (error: any) {
    throw new Error(`Failed to get Durable Object alarms: ${error.message}`);
  }
}

export async function cloudflareSetDurableObjectAlarm(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId, scheduledTime } = args;
    const alarm = await cloudflareClient.durableObjects.alarms.set(accountId, namespaceId, objectId, { scheduledTime });
    return formatCloudflareResponse(alarm);
  } catch (error: any) {
    throw new Error(`Failed to set Durable Object alarm: ${error.message}`);
  }
}

export async function cloudflareDeleteDurableObjectAlarm(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId } = args;
    await cloudflareClient.durableObjects.alarms.delete(accountId, namespaceId, objectId);
    return formatCloudflareResponse({ accountId, namespaceId, objectId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Durable Object alarm: ${error.message}`);
  }
}

// ============================================================
// LOAD BALANCERS - 8 handlers
// ============================================================

export async function cloudflareCreateLoadBalancer(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, name, defaultPools, fallbackPool } = args;
    const loadBalancer = await cloudflareClient.loadBalancers.create(zoneId, { name, default_pools: defaultPools, fallback_pool: fallbackPool });
    return formatCloudflareResponse(loadBalancer);
  } catch (error: any) {
    throw new Error(`Failed to create load balancer: ${error.message}`);
  }
}

export async function cloudflareListLoadBalancers(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const loadBalancers = await cloudflareClient.loadBalancers.list(zoneId);
    return formatCloudflareResponse(loadBalancers);
  } catch (error: any) {
    throw new Error(`Failed to list load balancers: ${error.message}`);
  }
}

export async function cloudflareGetLoadBalancer(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, loadBalancerId } = args;
    const loadBalancer = await cloudflareClient.loadBalancers.get(zoneId, loadBalancerId);
    return formatCloudflareResponse(loadBalancer);
  } catch (error: any) {
    throw new Error(`Failed to get load balancer: ${error.message}`);
  }
}

export async function cloudflareUpdateLoadBalancer(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, loadBalancerId, settings } = args;
    const loadBalancer = await cloudflareClient.loadBalancers.update(zoneId, loadBalancerId, settings);
    return formatCloudflareResponse(loadBalancer);
  } catch (error: any) {
    throw new Error(`Failed to update load balancer: ${error.message}`);
  }
}

export async function cloudflareDeleteLoadBalancer(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, loadBalancerId } = args;
    await cloudflareClient.loadBalancers.delete(zoneId, loadBalancerId);
    return formatCloudflareResponse({ zoneId, loadBalancerId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete load balancer: ${error.message}`);
  }
}

export async function cloudflareCreateLoadBalancerPool(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name, origins } = args;
    const pool = await cloudflareClient.loadBalancers.pools.create(accountId, { name, origins });
    return formatCloudflareResponse(pool);
  } catch (error: any) {
    throw new Error(`Failed to create load balancer pool: ${error.message}`);
  }
}

export async function cloudflareListLoadBalancerPools(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const pools = await cloudflareClient.loadBalancers.pools.list(accountId);
    return formatCloudflareResponse(pools);
  } catch (error: any) {
    throw new Error(`Failed to list load balancer pools: ${error.message}`);
  }
}

export async function cloudflareDeleteLoadBalancerPool(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, poolId } = args;
    await cloudflareClient.loadBalancers.pools.delete(accountId, poolId);
    return formatCloudflareResponse({ accountId, poolId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete load balancer pool: ${error.message}`);
  }
}

// ============================================================
// RATE LIMITS - 5 handlers
// ============================================================

export async function cloudflareCreateRateLimit(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, threshold, period, action } = args;
    const rateLimit = await cloudflareClient.rateLimits.create(zoneId, { threshold, period, action });
    return formatCloudflareResponse(rateLimit);
  } catch (error: any) {
    throw new Error(`Failed to create rate limit: ${error.message}`);
  }
}

export async function cloudflareListRateLimits(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const rateLimits = await cloudflareClient.rateLimits.list(zoneId);
    return formatCloudflareResponse(rateLimits);
  } catch (error: any) {
    throw new Error(`Failed to list rate limits: ${error.message}`);
  }
}

export async function cloudflareGetRateLimit(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, rateLimitId } = args;
    const rateLimit = await cloudflareClient.rateLimits.get(zoneId, rateLimitId);
    return formatCloudflareResponse(rateLimit);
  } catch (error: any) {
    throw new Error(`Failed to get rate limit: ${error.message}`);
  }
}

export async function cloudflareUpdateRateLimit(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, rateLimitId, settings } = args;
    const rateLimit = await cloudflareClient.rateLimits.update(zoneId, rateLimitId, settings);
    return formatCloudflareResponse(rateLimit);
  } catch (error: any) {
    throw new Error(`Failed to update rate limit: ${error.message}`);
  }
}

export async function cloudflareDeleteRateLimit(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, rateLimitId } = args;
    await cloudflareClient.rateLimits.delete(zoneId, rateLimitId);
    return formatCloudflareResponse({ zoneId, rateLimitId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete rate limit: ${error.message}`);
  }
}

// ============================================================
// WORKERS - Additional handlers (10 handlers)
// ============================================================

export async function cloudflareGetWorker(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const worker = await cloudflareClient.workers.scripts.get(accountId, scriptName);
    return formatCloudflareResponse(worker);
  } catch (error: any) {
    throw new Error(`Failed to get worker: ${error.message}`);
  }
}

export async function cloudflareDeleteWorker(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    await cloudflareClient.workers.scripts.delete(accountId, scriptName);
    return formatCloudflareResponse({ accountId, scriptName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker: ${error.message}`);
  }
}

export async function cloudflareUploadWorker(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, script, bindings } = args;
    const worker = await cloudflareClient.workers.scripts.upload(accountId, scriptName, script, { bindings });
    return formatCloudflareResponse(worker);
  } catch (error: any) {
    throw new Error(`Failed to upload worker: ${error.message}`);
  }
}

export async function cloudflareListWorkers(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const workers = await cloudflareClient.workers.scripts.list(accountId);
    return formatCloudflareResponse(workers);
  } catch (error: any) {
    throw new Error(`Failed to list workers: ${error.message}`);
  }
}

export async function cloudflareGetWorkerSettings(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const settings = await cloudflareClient.workers.scripts.getSettings(accountId, scriptName);
    return formatCloudflareResponse(settings);
  } catch (error: any) {
    throw new Error(`Failed to get worker settings: ${error.message}`);
  }
}

export async function cloudflareUpdateWorkerSettings(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, settings } = args;
    const updated = await cloudflareClient.workers.scripts.updateSettings(accountId, scriptName, settings);
    return formatCloudflareResponse(updated);
  } catch (error: any) {
    throw new Error(`Failed to update worker settings: ${error.message}`);
  }
}

export async function cloudflareGetWorkerUsage(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const usage = await cloudflareClient.workers.usage(accountId);
    return formatCloudflareResponse(usage);
  } catch (error: any) {
    throw new Error(`Failed to get worker usage: ${error.message}`);
  }
}

export async function cloudflareGetWorkerAnalytics(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const analytics = await cloudflareClient.workers.scripts.getAnalytics(accountId, scriptName);
    return formatCloudflareResponse(analytics);
  } catch (error: any) {
    throw new Error(`Failed to get worker analytics: ${error.message}`);
  }
}

export async function cloudflareGetWorkerTail(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const tail = await cloudflareClient.workers.scripts.getTail(accountId, scriptName);
    return formatCloudflareResponse(tail);
  } catch (error: any) {
    throw new Error(`Failed to get worker tail: ${error.message}`);
  }
}

export async function cloudflareListWorkerDeployments(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const deployments = await cloudflareClient.workers.scripts.listDeployments(accountId, scriptName);
    return formatCloudflareResponse(deployments);
  } catch (error: any) {
    throw new Error(`Failed to list worker deployments: ${error.message}`);
  }
}

// ============================================================
// WORKER NAMESPACES - 2 handlers
// ============================================================

export async function cloudflareRenameWorkerNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, newName } = args;
    const namespace = await cloudflareClient.workers.namespaces.rename(accountId, namespaceId, { title: newName });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to rename worker namespace: ${error.message}`);
  }
}

export async function cloudflareListWorkerSubdomain(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const subdomain = await cloudflareClient.workers.subdomain.get(accountId);
    return formatCloudflareResponse(subdomain);
  } catch (error: any) {
    throw new Error(`Failed to list worker subdomain: ${error.message}`);
  }
}

// ============================================================
// PAGES - Additional handlers (5 handlers)
// ============================================================

export async function cloudflareGetPagesBuildConfig(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    const config = await cloudflareClient.pages.projects.getBuildConfig(accountId, projectName);
    return formatCloudflareResponse(config);
  } catch (error: any) {
    throw new Error(`Failed to get Pages build config: ${error.message}`);
  }
}

export async function cloudflareUpdatePagesBuildConfig(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, buildConfig } = args;
    const updated = await cloudflareClient.pages.projects.updateBuildConfig(accountId, projectName, buildConfig);
    return formatCloudflareResponse(updated);
  } catch (error: any) {
    throw new Error(`Failed to update Pages build config: ${error.message}`);
  }
}

export async function cloudflareGetPagesEnvVars(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    const envVars = await cloudflareClient.pages.projects.getEnvVars(accountId, projectName);
    return formatCloudflareResponse(envVars);
  } catch (error: any) {
    throw new Error(`Failed to get Pages env vars: ${error.message}`);
  }
}

export async function cloudflareSetPagesEnvVar(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, key, value, environment } = args;
    const envVar = await cloudflareClient.pages.projects.setEnvVar(accountId, projectName, { key, value, environment });
    return formatCloudflareResponse(envVar);
  } catch (error: any) {
    throw new Error(`Failed to set Pages env var: ${error.message}`);
  }
}

export async function cloudflareDeletePagesEnvVar(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, key } = args;
    await cloudflareClient.pages.projects.deleteEnvVar(accountId, projectName, key);
    return formatCloudflareResponse({ accountId, projectName, key, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Pages env var: ${error.message}`);
  }
}

export async function cloudflareGetPagesDeploymentLogs(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    const logs = await cloudflareClient.pages.projects.getDeploymentLogs(accountId, projectName, deploymentId);
    return formatCloudflareResponse(logs);
  } catch (error: any) {
    throw new Error(`Failed to get Pages deployment logs: ${error.message}`);
  }
}

export async function cloudflarePurgePagesCache(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    await cloudflareClient.pages.projects.purgeCache(accountId, projectName);
    return formatCloudflareResponse({ accountId, projectName, status: 'cache purged' });
  } catch (error: any) {
    throw new Error(`Failed to purge Pages cache: ${error.message}`);
  }
}

// ============================================================
// R2 - Additional handlers (3 handlers)
// ============================================================

export async function cloudflarePutR2Object(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, body, metadata } = args;
    const object = await cloudflareClient.r2.objects.put(accountId, bucketName, key, body, metadata);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to put R2 object: ${error.message}`);
  }
}

export async function cloudflareUpdateR2ObjectMetadata(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, metadata } = args;
    const object = await cloudflareClient.r2.objects.updateMetadata(accountId, bucketName, key, metadata);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to update R2 object metadata: ${error.message}`);
  }
}

export async function cloudflareGenerateR2PresignedUrl(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, expiresIn } = args;
    const url = await cloudflareClient.r2.objects.generatePresignedUrl(accountId, bucketName, key, expiresIn);
    return formatCloudflareResponse({ url });
  } catch (error: any) {
    throw new Error(`Failed to generate R2 presigned URL: ${error.message}`);
  }
}

// ============================================================
// KV - Additional handlers (3 handlers)
// ============================================================

export async function cloudflareListKvValues(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, prefix, limit } = args;
    const values = await cloudflareClient.kv.namespaces.listKeys(accountId, namespaceId, { prefix, limit });
    return formatCloudflareResponse(values);
  } catch (error: any) {
    throw new Error(`Failed to list KV values: ${error.message}`);
  }
}

export async function cloudflareExportKvNamespace(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    const data = await cloudflareClient.kv.namespaces.export(accountId, namespaceId);
    return formatCloudflareResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to export KV namespace: ${error.message}`);
  }
}

export async function cloudflareGetKvUsage(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    const usage = await cloudflareClient.kv.namespaces.getUsage(accountId, namespaceId);
    return formatCloudflareResponse(usage);
  } catch (error: any) {
    throw new Error(`Failed to get KV usage: ${error.message}`);
  }
}

// ============================================================
// D1 - Additional handlers (6 handlers)
// ============================================================

export async function cloudflareListD1Tables(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const tables = await cloudflareClient.d1.databases.listTables(accountId, databaseId);
    return formatCloudflareResponse(tables);
  } catch (error: any) {
    throw new Error(`Failed to list D1 tables: ${error.message}`);
  }
}

export async function cloudflareGetD1TableSchema(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, tableName } = args;
    const schema = await cloudflareClient.d1.databases.getTableSchema(accountId, databaseId, tableName);
    return formatCloudflareResponse(schema);
  } catch (error: any) {
    throw new Error(`Failed to get D1 table schema: ${error.message}`);
  }
}

export async function cloudflareExportD1Database(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const data = await cloudflareClient.d1.databases.export(accountId, databaseId);
    return formatCloudflareResponse(data);
  } catch (error: any) {
    throw new Error(`Failed to export D1 database: ${error.message}`);
  }
}

export async function cloudflareImportD1Database(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, data } = args;
    const result = await cloudflareClient.d1.databases.import(accountId, databaseId, data);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to import D1 database: ${error.message}`);
  }
}

export async function cloudflareRestoreD1Database(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, backupId } = args;
    const result = await cloudflareClient.d1.databases.restore(accountId, databaseId, backupId);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to restore D1 database: ${error.message}`);
  }
}

export async function cloudflareGetD1Usage(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const usage = await cloudflareClient.d1.databases.getUsage(accountId, databaseId);
    return formatCloudflareResponse(usage);
  } catch (error: any) {
    throw new Error(`Failed to get D1 usage: ${error.message}`);
  }
}

// ============================================================
// QUEUES - Additional handlers (2 handlers)
// ============================================================

export async function cloudflareGetQueueStats(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    const stats = await cloudflareClient.queues.getStats(accountId, queueId);
    return formatCloudflareResponse(stats);
  } catch (error: any) {
    throw new Error(`Failed to get queue stats: ${error.message}`);
  }
}

export async function cloudflareUpdateQueueSettings(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, settings } = args;
    const updated = await cloudflareClient.queues.updateSettings(accountId, queueId, settings);
    return formatCloudflareResponse(updated);
  } catch (error: any) {
    throw new Error(`Failed to update queue settings: ${error.message}`);
  }
}

// ============================================================
// STREAM - Additional handlers (2 handlers)
// ============================================================

export async function cloudflareDownloadStreamVideo(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId } = args;
    const download = await cloudflareClient.stream.videos.download(accountId, videoId);
    return formatCloudflareResponse(download);
  } catch (error: any) {
    throw new Error(`Failed to download Stream video: ${error.message}`);
  }
}

export async function cloudflareGetStreamVideoEmbed(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId } = args;
    const embed = await cloudflareClient.stream.videos.getEmbed(accountId, videoId);
    return formatCloudflareResponse(embed);
  } catch (error: any) {
    throw new Error(`Failed to get Stream video embed: ${error.message}`);
  }
}

// ============================================================
// DURABLE OBJECTS - Additional handlers (2 handlers)
// ============================================================

export async function cloudflareGetDurableObjectsUsage(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const usage = await cloudflareClient.durableObjects.getUsage(accountId);
    return formatCloudflareResponse(usage);
  } catch (error: any) {
    throw new Error(`Failed to get Durable Objects usage: ${error.message}`);
  }
}

export async function cloudflareMigrateDurableObjects(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, migration } = args;
    const result = await cloudflareClient.durableObjects.migrate(accountId, namespaceId, migration);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to migrate Durable Objects: ${error.message}`);
  }
}

// ============================================================
// ANALYTICS & ZONE - 2 handlers
// ============================================================

export async function cloudflareGetAnalytics(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, since, until } = args;
    const analytics = await cloudflareClient.zones.analytics.dashboard(zoneId, { since, until });
    return formatCloudflareResponse(analytics);
  } catch (error: any) {
    throw new Error(`Failed to get analytics: ${error.message}`);
  }
}

export async function cloudflareGetZonePlan(args: any) {
  if (!cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const plan = await cloudflareClient.zones.settings.getPlan(zoneId);
    return formatCloudflareResponse(plan);
  } catch (error: any) {
    throw new Error(`Failed to get zone plan: ${error.message}`);
  }
}









