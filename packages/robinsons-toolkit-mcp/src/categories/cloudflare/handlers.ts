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

// ============================================================
// R2 STORAGE - 20 handlers
// ============================================================

export async function cloudflareCreateR2Bucket(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name } = args;
    const bucket = await this.cloudflareClient.r2.buckets.create(accountId, { name });
    return formatCloudflareResponse(bucket);
  } catch (error: any) {
    throw new Error(`Failed to create R2 bucket: ${error.message}`);
  }
}

export async function cloudflareListR2Buckets(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const buckets = await this.cloudflareClient.r2.buckets.list(accountId);
    return formatCloudflareResponse(buckets);
  } catch (error: any) {
    throw new Error(`Failed to list R2 buckets: ${error.message}`);
  }
}

export async function cloudflareGetR2Bucket(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    const bucket = await this.cloudflareClient.r2.buckets.get(accountId, bucketName);
    return formatCloudflareResponse(bucket);
  } catch (error: any) {
    throw new Error(`Failed to get R2 bucket: ${error.message}`);
  }
}

export async function cloudflareDeleteR2Bucket(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    await this.cloudflareClient.r2.buckets.delete(accountId, bucketName);
    return formatCloudflareResponse({ accountId, bucketName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete R2 bucket: ${error.message}`);
  }
}

export async function cloudflareUploadR2Object(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, body } = args;
    const object = await this.cloudflareClient.r2.objects.put(accountId, bucketName, key, body);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to upload R2 object: ${error.message}`);
  }
}

export async function cloudflareGetR2Object(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key } = args;
    const object = await this.cloudflareClient.r2.objects.get(accountId, bucketName, key);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to get R2 object: ${error.message}`);
  }
}

export async function cloudflareDeleteR2Object(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key } = args;
    await this.cloudflareClient.r2.objects.delete(accountId, bucketName, key);
    return formatCloudflareResponse({ accountId, bucketName, key, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete R2 object: ${error.message}`);
  }
}

export async function cloudflareListR2Objects(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, prefix } = args;
    const objects = await this.cloudflareClient.r2.objects.list(accountId, bucketName, { prefix });
    return formatCloudflareResponse(objects);
  } catch (error: any) {
    throw new Error(`Failed to list R2 objects: ${error.message}`);
  }
}

export async function cloudflareCopyR2Object(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, sourceKey, destinationKey } = args;
    const object = await this.cloudflareClient.r2.objects.copy(accountId, bucketName, sourceKey, destinationKey);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to copy R2 object: ${error.message}`);
  }
}

export async function cloudflareGetR2ObjectMetadata(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key } = args;
    const metadata = await this.cloudflareClient.r2.objects.head(accountId, bucketName, key);
    return formatCloudflareResponse(metadata);
  } catch (error: any) {
    throw new Error(`Failed to get R2 object metadata: ${error.message}`);
  }
}

export async function cloudflareCreateR2MultipartUpload(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key } = args;
    const upload = await this.cloudflareClient.r2.multipart.create(accountId, bucketName, key);
    return formatCloudflareResponse(upload);
  } catch (error: any) {
    throw new Error(`Failed to create R2 multipart upload: ${error.message}`);
  }
}

export async function cloudflareUploadR2Part(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, uploadId, partNumber, body } = args;
    const part = await this.cloudflareClient.r2.multipart.uploadPart(accountId, bucketName, key, uploadId, partNumber, body);
    return formatCloudflareResponse(part);
  } catch (error: any) {
    throw new Error(`Failed to upload R2 part: ${error.message}`);
  }
}

export async function cloudflareCompleteR2MultipartUpload(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, uploadId, parts } = args;
    const object = await this.cloudflareClient.r2.multipart.complete(accountId, bucketName, key, uploadId, parts);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to complete R2 multipart upload: ${error.message}`);
  }
}

export async function cloudflareAbortR2MultipartUpload(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, uploadId } = args;
    await this.cloudflareClient.r2.multipart.abort(accountId, bucketName, key, uploadId);
    return formatCloudflareResponse({ accountId, bucketName, key, uploadId, status: 'aborted' });
  } catch (error: any) {
    throw new Error(`Failed to abort R2 multipart upload: ${error.message}`);
  }
}

export async function cloudflareListR2MultipartUploads(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    const uploads = await this.cloudflareClient.r2.multipart.list(accountId, bucketName);
    return formatCloudflareResponse(uploads);
  } catch (error: any) {
    throw new Error(`Failed to list R2 multipart uploads: ${error.message}`);
  }
}

export async function cloudflareListR2Parts(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, key, uploadId } = args;
    const parts = await this.cloudflareClient.r2.multipart.listParts(accountId, bucketName, key, uploadId);
    return formatCloudflareResponse(parts);
  } catch (error: any) {
    throw new Error(`Failed to list R2 parts: ${error.message}`);
  }
}

export async function cloudflareGetR2BucketUsage(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    const usage = await this.cloudflareClient.r2.buckets.usage(accountId, bucketName);
    return formatCloudflareResponse(usage);
  } catch (error: any) {
    throw new Error(`Failed to get R2 bucket usage: ${error.message}`);
  }
}

export async function cloudflareSetR2BucketCors(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName, corsRules } = args;
    const cors = await this.cloudflareClient.r2.buckets.setCors(accountId, bucketName, corsRules);
    return formatCloudflareResponse(cors);
  } catch (error: any) {
    throw new Error(`Failed to set R2 bucket CORS: ${error.message}`);
  }
}

export async function cloudflareGetR2BucketCors(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    const cors = await this.cloudflareClient.r2.buckets.getCors(accountId, bucketName);
    return formatCloudflareResponse(cors);
  } catch (error: any) {
    throw new Error(`Failed to get R2 bucket CORS: ${error.message}`);
  }
}

export async function cloudflareDeleteR2BucketCors(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, bucketName } = args;
    await this.cloudflareClient.r2.buckets.deleteCors(accountId, bucketName);
    return formatCloudflareResponse({ accountId, bucketName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete R2 bucket CORS: ${error.message}`);
  }
}

// ============================================================
// KV STORAGE - 15 handlers
// ============================================================

export async function cloudflareCreateKvNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, title } = args;
    const namespace = await this.cloudflareClient.kv.namespaces.create(accountId, { title });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to create KV namespace: ${error.message}`);
  }
}

export async function cloudflareListKvNamespaces(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const namespaces = await this.cloudflareClient.kv.namespaces.list(accountId);
    return formatCloudflareResponse(namespaces);
  } catch (error: any) {
    throw new Error(`Failed to list KV namespaces: ${error.message}`);
  }
}

export async function cloudflareGetKvNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    const namespace = await this.cloudflareClient.kv.namespaces.get(accountId, namespaceId);
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to get KV namespace: ${error.message}`);
  }
}

export async function cloudflareRenameKvNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, title } = args;
    const namespace = await this.cloudflareClient.kv.namespaces.update(accountId, namespaceId, { title });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to rename KV namespace: ${error.message}`);
  }
}

export async function cloudflareDeleteKvNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    await this.cloudflareClient.kv.namespaces.delete(accountId, namespaceId);
    return formatCloudflareResponse({ accountId, namespaceId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete KV namespace: ${error.message}`);
  }
}

export async function cloudflareWriteKvValue(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key, value, metadata } = args;
    await this.cloudflareClient.kv.values.put(accountId, namespaceId, key, value, { metadata });
    return formatCloudflareResponse({ accountId, namespaceId, key, status: 'written' });
  } catch (error: any) {
    throw new Error(`Failed to write KV value: ${error.message}`);
  }
}

export async function cloudflareReadKvValue(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key } = args;
    const value = await this.cloudflareClient.kv.values.get(accountId, namespaceId, key);
    return formatCloudflareResponse({ key, value });
  } catch (error: any) {
    throw new Error(`Failed to read KV value: ${error.message}`);
  }
}

export async function cloudflareDeleteKvValue(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key } = args;
    await this.cloudflareClient.kv.values.delete(accountId, namespaceId, key);
    return formatCloudflareResponse({ accountId, namespaceId, key, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete KV value: ${error.message}`);
  }
}

export async function cloudflareListKvKeys(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, prefix } = args;
    const keys = await this.cloudflareClient.kv.keys.list(accountId, namespaceId, { prefix });
    return formatCloudflareResponse(keys);
  } catch (error: any) {
    throw new Error(`Failed to list KV keys: ${error.message}`);
  }
}

export async function cloudflareWriteKvBulk(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, keyValuePairs } = args;
    await this.cloudflareClient.kv.bulk.put(accountId, namespaceId, keyValuePairs);
    return formatCloudflareResponse({ accountId, namespaceId, count: keyValuePairs.length, status: 'written' });
  } catch (error: any) {
    throw new Error(`Failed to write KV bulk: ${error.message}`);
  }
}

export async function cloudflareDeleteKvBulk(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, keys } = args;
    await this.cloudflareClient.kv.bulk.delete(accountId, namespaceId, keys);
    return formatCloudflareResponse({ accountId, namespaceId, count: keys.length, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete KV bulk: ${error.message}`);
  }
}

export async function cloudflareGetKvMetadata(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key } = args;
    const metadata = await this.cloudflareClient.kv.metadata.get(accountId, namespaceId, key);
    return formatCloudflareResponse(metadata);
  } catch (error: any) {
    throw new Error(`Failed to get KV metadata: ${error.message}`);
  }
}

export async function cloudflareListKvNamespaceKeys(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, limit, cursor } = args;
    const keys = await this.cloudflareClient.kv.keys.list(accountId, namespaceId, { limit, cursor });
    return formatCloudflareResponse(keys);
  } catch (error: any) {
    throw new Error(`Failed to list KV namespace keys: ${error.message}`);
  }
}

export async function cloudflareGetKvValueWithMetadata(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key } = args;
    const result = await this.cloudflareClient.kv.values.getWithMetadata(accountId, namespaceId, key);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to get KV value with metadata: ${error.message}`);
  }
}

export async function cloudflareSetKvExpiration(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, key, expiration } = args;
    await this.cloudflareClient.kv.values.put(accountId, namespaceId, key, null, { expiration });
    return formatCloudflareResponse({ accountId, namespaceId, key, expiration, status: 'set' });
  } catch (error: any) {
    throw new Error(`Failed to set KV expiration: ${error.message}`);
  }
}

// ============================================================
// D1 DATABASE - 10 handlers
// ============================================================

export async function cloudflareCreateD1Database(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name } = args;
    const database = await this.cloudflareClient.d1.databases.create(accountId, { name });
    return formatCloudflareResponse(database);
  } catch (error: any) {
    throw new Error(`Failed to create D1 database: ${error.message}`);
  }
}

export async function cloudflareListD1Databases(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const databases = await this.cloudflareClient.d1.databases.list(accountId);
    return formatCloudflareResponse(databases);
  } catch (error: any) {
    throw new Error(`Failed to list D1 databases: ${error.message}`);
  }
}

export async function cloudflareGetD1Database(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const database = await this.cloudflareClient.d1.databases.get(accountId, databaseId);
    return formatCloudflareResponse(database);
  } catch (error: any) {
    throw new Error(`Failed to get D1 database: ${error.message}`);
  }
}

export async function cloudflareDeleteD1Database(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    await this.cloudflareClient.d1.databases.delete(accountId, databaseId);
    return formatCloudflareResponse({ accountId, databaseId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete D1 database: ${error.message}`);
  }
}

export async function cloudflareQueryD1Database(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, sql, params } = args;
    const result = await this.cloudflareClient.d1.query.execute(accountId, databaseId, sql, params);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to query D1 database: ${error.message}`);
  }
}

export async function cloudflareBackupD1Database(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const backup = await this.cloudflareClient.d1.backups.create(accountId, databaseId);
    return formatCloudflareResponse(backup);
  } catch (error: any) {
    throw new Error(`Failed to backup D1 database: ${error.message}`);
  }
}

export async function cloudflareListD1Backups(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const backups = await this.cloudflareClient.d1.backups.list(accountId, databaseId);
    return formatCloudflareResponse(backups);
  } catch (error: any) {
    throw new Error(`Failed to list D1 backups: ${error.message}`);
  }
}

export async function cloudflareRestoreD1Backup(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, backupId } = args;
    const result = await this.cloudflareClient.d1.backups.restore(accountId, databaseId, backupId);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to restore D1 backup: ${error.message}`);
  }
}

export async function cloudflareDeleteD1Backup(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId, backupId } = args;
    await this.cloudflareClient.d1.backups.delete(accountId, databaseId, backupId);
    return formatCloudflareResponse({ accountId, databaseId, backupId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete D1 backup: ${error.message}`);
  }
}

export async function cloudflareGetD1DatabaseSize(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, databaseId } = args;
    const size = await this.cloudflareClient.d1.databases.size(accountId, databaseId);
    return formatCloudflareResponse(size);
  } catch (error: any) {
    throw new Error(`Failed to get D1 database size: ${error.message}`);
  }
}

// ============================================================
// QUEUES - 10 handlers
// ============================================================

export async function cloudflareCreateQueue(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name } = args;
    const queue = await this.cloudflareClient.queues.create(accountId, { name });
    return formatCloudflareResponse(queue);
  } catch (error: any) {
    throw new Error(`Failed to create queue: ${error.message}`);
  }
}

export async function cloudflareListQueues(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const queues = await this.cloudflareClient.queues.list(accountId);
    return formatCloudflareResponse(queues);
  } catch (error: any) {
    throw new Error(`Failed to list queues: ${error.message}`);
  }
}

export async function cloudflareGetQueue(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    const queue = await this.cloudflareClient.queues.get(accountId, queueId);
    return formatCloudflareResponse(queue);
  } catch (error: any) {
    throw new Error(`Failed to get queue: ${error.message}`);
  }
}

export async function cloudflareUpdateQueue(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, settings } = args;
    const queue = await this.cloudflareClient.queues.update(accountId, queueId, settings);
    return formatCloudflareResponse(queue);
  } catch (error: any) {
    throw new Error(`Failed to update queue: ${error.message}`);
  }
}

export async function cloudflareDeleteQueue(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    await this.cloudflareClient.queues.delete(accountId, queueId);
    return formatCloudflareResponse({ accountId, queueId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete queue: ${error.message}`);
  }
}

export async function cloudflareSendQueueMessage(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, messages } = args;
    const result = await this.cloudflareClient.queues.send(accountId, queueId, messages);
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to send queue message: ${error.message}`);
  }
}

export async function cloudflareReceiveQueueMessages(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, batchSize } = args;
    const messages = await this.cloudflareClient.queues.receive(accountId, queueId, { batchSize });
    return formatCloudflareResponse(messages);
  } catch (error: any) {
    throw new Error(`Failed to receive queue messages: ${error.message}`);
  }
}

export async function cloudflareAckQueueMessage(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId, messageId } = args;
    await this.cloudflareClient.queues.ack(accountId, queueId, messageId);
    return formatCloudflareResponse({ accountId, queueId, messageId, status: 'acknowledged' });
  } catch (error: any) {
    throw new Error(`Failed to acknowledge queue message: ${error.message}`);
  }
}

export async function cloudflareGetQueueMetrics(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    const metrics = await this.cloudflareClient.queues.metrics(accountId, queueId);
    return formatCloudflareResponse(metrics);
  } catch (error: any) {
    throw new Error(`Failed to get queue metrics: ${error.message}`);
  }
}

export async function cloudflarePurgeQueue(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, queueId } = args;
    await this.cloudflareClient.queues.purge(accountId, queueId);
    return formatCloudflareResponse({ accountId, queueId, status: 'purged' });
  } catch (error: any) {
    throw new Error(`Failed to purge queue: ${error.message}`);
  }
}

// ============================================================
// WORKERS - 20 handlers
// ============================================================

export async function cloudflareUploadWorkerScript(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, script, bindings } = args;
    const worker = await this.cloudflareClient.workers.scripts.upload(accountId, scriptName, script, { bindings });
    return formatCloudflareResponse(worker);
  } catch (error: any) {
    throw new Error(`Failed to upload worker script: ${error.message}`);
  }
}

export async function cloudflareListWorkerScripts(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const scripts = await this.cloudflareClient.workers.scripts.list(accountId);
    return formatCloudflareResponse(scripts);
  } catch (error: any) {
    throw new Error(`Failed to list worker scripts: ${error.message}`);
  }
}

export async function cloudflareGetWorkerScript(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const script = await this.cloudflareClient.workers.scripts.get(accountId, scriptName);
    return formatCloudflareResponse(script);
  } catch (error: any) {
    throw new Error(`Failed to get worker script: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerScript(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    await this.cloudflareClient.workers.scripts.delete(accountId, scriptName);
    return formatCloudflareResponse({ accountId, scriptName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker script: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerRoute(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, pattern, scriptName } = args;
    const route = await this.cloudflareClient.workers.routes.create(zoneId, { pattern, script: scriptName });
    return formatCloudflareResponse(route);
  } catch (error: any) {
    throw new Error(`Failed to create worker route: ${error.message}`);
  }
}

export async function cloudflareListWorkerRoutes(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const routes = await this.cloudflareClient.workers.routes.list(zoneId);
    return formatCloudflareResponse(routes);
  } catch (error: any) {
    throw new Error(`Failed to list worker routes: ${error.message}`);
  }
}

export async function cloudflareGetWorkerRoute(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, routeId } = args;
    const route = await this.cloudflareClient.workers.routes.get(zoneId, routeId);
    return formatCloudflareResponse(route);
  } catch (error: any) {
    throw new Error(`Failed to get worker route: ${error.message}`);
  }
}

export async function cloudflareUpdateWorkerRoute(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, routeId, pattern, scriptName } = args;
    const route = await this.cloudflareClient.workers.routes.update(zoneId, routeId, { pattern, script: scriptName });
    return formatCloudflareResponse(route);
  } catch (error: any) {
    throw new Error(`Failed to update worker route: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerRoute(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, routeId } = args;
    await this.cloudflareClient.workers.routes.delete(zoneId, routeId);
    return formatCloudflareResponse({ zoneId, routeId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker route: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerCronTrigger(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, cron } = args;
    const trigger = await this.cloudflareClient.workers.cron.create(accountId, scriptName, { cron });
    return formatCloudflareResponse(trigger);
  } catch (error: any) {
    throw new Error(`Failed to create worker cron trigger: ${error.message}`);
  }
}

export async function cloudflareListWorkerCronTriggers(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const triggers = await this.cloudflareClient.workers.cron.list(accountId, scriptName);
    return formatCloudflareResponse(triggers);
  } catch (error: any) {
    throw new Error(`Failed to list worker cron triggers: ${error.message}`);
  }
}

export async function cloudflareUpdateWorkerCronTrigger(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, triggerId, cron } = args;
    const trigger = await this.cloudflareClient.workers.cron.update(accountId, scriptName, triggerId, { cron });
    return formatCloudflareResponse(trigger);
  } catch (error: any) {
    throw new Error(`Failed to update worker cron trigger: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerCronTrigger(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, triggerId } = args;
    await this.cloudflareClient.workers.cron.delete(accountId, scriptName, triggerId);
    return formatCloudflareResponse({ accountId, scriptName, triggerId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker cron trigger: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerSecret(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, name, text } = args;
    const secret = await this.cloudflareClient.workers.secrets.put(accountId, scriptName, name, text);
    return formatCloudflareResponse(secret);
  } catch (error: any) {
    throw new Error(`Failed to create worker secret: ${error.message}`);
  }
}

export async function cloudflareListWorkerSecrets(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName } = args;
    const secrets = await this.cloudflareClient.workers.secrets.list(accountId, scriptName);
    return formatCloudflareResponse(secrets);
  } catch (error: any) {
    throw new Error(`Failed to list worker secrets: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerSecret(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, scriptName, secretName } = args;
    await this.cloudflareClient.workers.secrets.delete(accountId, scriptName, secretName);
    return formatCloudflareResponse({ accountId, scriptName, secretName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker secret: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, title } = args;
    const namespace = await this.cloudflareClient.workers.namespaces.create(accountId, { title });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to create worker namespace: ${error.message}`);
  }
}

export async function cloudflareListWorkerNamespaces(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const namespaces = await this.cloudflareClient.workers.namespaces.list(accountId);
    return formatCloudflareResponse(namespaces);
  } catch (error: any) {
    throw new Error(`Failed to list worker namespaces: ${error.message}`);
  }
}

export async function cloudflareDeleteWorkerNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    await this.cloudflareClient.workers.namespaces.delete(accountId, namespaceId);
    return formatCloudflareResponse({ accountId, namespaceId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete worker namespace: ${error.message}`);
  }
}

export async function cloudflareCreateWorkerSubdomain(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, subdomain } = args;
    const result = await this.cloudflareClient.workers.subdomain.create(accountId, { subdomain });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to create worker subdomain: ${error.message}`);
  }
}

// ============================================================
// PAGES - 15 handlers
// ============================================================

export async function cloudflareCreatePagesProject(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name, productionBranch } = args;
    const project = await this.cloudflareClient.pages.projects.create(accountId, { name, production_branch: productionBranch });
    return formatCloudflareResponse(project);
  } catch (error: any) {
    throw new Error(`Failed to create Pages project: ${error.message}`);
  }
}

export async function cloudflareListPagesProjects(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const projects = await this.cloudflareClient.pages.projects.list(accountId);
    return formatCloudflareResponse(projects);
  } catch (error: any) {
    throw new Error(`Failed to list Pages projects: ${error.message}`);
  }
}

export async function cloudflareGetPagesProject(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    const project = await this.cloudflareClient.pages.projects.get(accountId, projectName);
    return formatCloudflareResponse(project);
  } catch (error: any) {
    throw new Error(`Failed to get Pages project: ${error.message}`);
  }
}

export async function cloudflareUpdatePagesProject(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, settings } = args;
    const project = await this.cloudflareClient.pages.projects.update(accountId, projectName, settings);
    return formatCloudflareResponse(project);
  } catch (error: any) {
    throw new Error(`Failed to update Pages project: ${error.message}`);
  }
}

export async function cloudflareDeletePagesProject(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    await this.cloudflareClient.pages.projects.delete(accountId, projectName);
    return formatCloudflareResponse({ accountId, projectName, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Pages project: ${error.message}`);
  }
}

export async function cloudflareCreatePagesDeployment(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, branch } = args;
    const deployment = await this.cloudflareClient.pages.deployments.create(accountId, projectName, { branch });
    return formatCloudflareResponse(deployment);
  } catch (error: any) {
    throw new Error(`Failed to create Pages deployment: ${error.message}`);
  }
}

export async function cloudflareListPagesDeployments(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    const deployments = await this.cloudflareClient.pages.deployments.list(accountId, projectName);
    return formatCloudflareResponse(deployments);
  } catch (error: any) {
    throw new Error(`Failed to list Pages deployments: ${error.message}`);
  }
}

export async function cloudflareGetPagesDeployment(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    const deployment = await this.cloudflareClient.pages.deployments.get(accountId, projectName, deploymentId);
    return formatCloudflareResponse(deployment);
  } catch (error: any) {
    throw new Error(`Failed to get Pages deployment: ${error.message}`);
  }
}

export async function cloudflareRetryPagesDeployment(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    const deployment = await this.cloudflareClient.pages.deployments.retry(accountId, projectName, deploymentId);
    return formatCloudflareResponse(deployment);
  } catch (error: any) {
    throw new Error(`Failed to retry Pages deployment: ${error.message}`);
  }
}

export async function cloudflareRollbackPagesDeployment(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    const deployment = await this.cloudflareClient.pages.deployments.rollback(accountId, projectName, deploymentId);
    return formatCloudflareResponse(deployment);
  } catch (error: any) {
    throw new Error(`Failed to rollback Pages deployment: ${error.message}`);
  }
}

export async function cloudflareDeletePagesDeployment(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, deploymentId } = args;
    await this.cloudflareClient.pages.deployments.delete(accountId, projectName, deploymentId);
    return formatCloudflareResponse({ accountId, projectName, deploymentId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Pages deployment: ${error.message}`);
  }
}

export async function cloudflareAddPagesDomain(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, domain } = args;
    const result = await this.cloudflareClient.pages.domains.add(accountId, projectName, { domain });
    return formatCloudflareResponse(result);
  } catch (error: any) {
    throw new Error(`Failed to add Pages domain: ${error.message}`);
  }
}

export async function cloudflareListPagesDomains(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName } = args;
    const domains = await this.cloudflareClient.pages.domains.list(accountId, projectName);
    return formatCloudflareResponse(domains);
  } catch (error: any) {
    throw new Error(`Failed to list Pages domains: ${error.message}`);
  }
}

export async function cloudflareGetPagesDomain(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, domain } = args;
    const domainInfo = await this.cloudflareClient.pages.domains.get(accountId, projectName, domain);
    return formatCloudflareResponse(domainInfo);
  } catch (error: any) {
    throw new Error(`Failed to get Pages domain: ${error.message}`);
  }
}

export async function cloudflareDeletePagesDomain(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, projectName, domain } = args;
    await this.cloudflareClient.pages.domains.delete(accountId, projectName, domain);
    return formatCloudflareResponse({ accountId, projectName, domain, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Pages domain: ${error.message}`);
  }
}

// ============================================================
// STREAM - 15 handlers
// ============================================================

export async function cloudflareUploadStreamVideo(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, file, metadata } = args;
    const video = await this.cloudflareClient.stream.videos.upload(accountId, file, metadata);
    return formatCloudflareResponse(video);
  } catch (error: any) {
    throw new Error(`Failed to upload Stream video: ${error.message}`);
  }
}

export async function cloudflareListStreamVideos(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const videos = await this.cloudflareClient.stream.videos.list(accountId);
    return formatCloudflareResponse(videos);
  } catch (error: any) {
    throw new Error(`Failed to list Stream videos: ${error.message}`);
  }
}

export async function cloudflareGetStreamVideo(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId } = args;
    const video = await this.cloudflareClient.stream.videos.get(accountId, videoId);
    return formatCloudflareResponse(video);
  } catch (error: any) {
    throw new Error(`Failed to get Stream video: ${error.message}`);
  }
}

export async function cloudflareUpdateStreamVideo(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId, metadata } = args;
    const video = await this.cloudflareClient.stream.videos.update(accountId, videoId, metadata);
    return formatCloudflareResponse(video);
  } catch (error: any) {
    throw new Error(`Failed to update Stream video: ${error.message}`);
  }
}

export async function cloudflareDeleteStreamVideo(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId } = args;
    await this.cloudflareClient.stream.videos.delete(accountId, videoId);
    return formatCloudflareResponse({ accountId, videoId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Stream video: ${error.message}`);
  }
}

export async function cloudflareCreateStreamLiveInput(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, metadata } = args;
    const liveInput = await this.cloudflareClient.stream.liveInputs.create(accountId, metadata);
    return formatCloudflareResponse(liveInput);
  } catch (error: any) {
    throw new Error(`Failed to create Stream live input: ${error.message}`);
  }
}

export async function cloudflareListStreamLiveInputs(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const liveInputs = await this.cloudflareClient.stream.liveInputs.list(accountId);
    return formatCloudflareResponse(liveInputs);
  } catch (error: any) {
    throw new Error(`Failed to list Stream live inputs: ${error.message}`);
  }
}

export async function cloudflareGetStreamLiveInput(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, liveInputId } = args;
    const liveInput = await this.cloudflareClient.stream.liveInputs.get(accountId, liveInputId);
    return formatCloudflareResponse(liveInput);
  } catch (error: any) {
    throw new Error(`Failed to get Stream live input: ${error.message}`);
  }
}

export async function cloudflareUpdateStreamLiveInput(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, liveInputId, metadata } = args;
    const liveInput = await this.cloudflareClient.stream.liveInputs.update(accountId, liveInputId, metadata);
    return formatCloudflareResponse(liveInput);
  } catch (error: any) {
    throw new Error(`Failed to update Stream live input: ${error.message}`);
  }
}

export async function cloudflareDeleteStreamLiveInput(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, liveInputId } = args;
    await this.cloudflareClient.stream.liveInputs.delete(accountId, liveInputId);
    return formatCloudflareResponse({ accountId, liveInputId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Stream live input: ${error.message}`);
  }
}

export async function cloudflareCreateStreamWebhook(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, notificationUrl } = args;
    const webhook = await this.cloudflareClient.stream.webhooks.create(accountId, { notificationUrl });
    return formatCloudflareResponse(webhook);
  } catch (error: any) {
    throw new Error(`Failed to create Stream webhook: ${error.message}`);
  }
}

export async function cloudflareListStreamWebhooks(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const webhooks = await this.cloudflareClient.stream.webhooks.list(accountId);
    return formatCloudflareResponse(webhooks);
  } catch (error: any) {
    throw new Error(`Failed to list Stream webhooks: ${error.message}`);
  }
}

export async function cloudflareUpdateStreamWebhook(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, webhookId, notificationUrl } = args;
    const webhook = await this.cloudflareClient.stream.webhooks.update(accountId, webhookId, { notificationUrl });
    return formatCloudflareResponse(webhook);
  } catch (error: any) {
    throw new Error(`Failed to update Stream webhook: ${error.message}`);
  }
}

export async function cloudflareDeleteStreamWebhook(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, webhookId } = args;
    await this.cloudflareClient.stream.webhooks.delete(accountId, webhookId);
    return formatCloudflareResponse({ accountId, webhookId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Stream webhook: ${error.message}`);
  }
}

export async function cloudflareGetStreamAnalytics(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, videoId } = args;
    const analytics = await this.cloudflareClient.stream.analytics.get(accountId, videoId);
    return formatCloudflareResponse(analytics);
  } catch (error: any) {
    throw new Error(`Failed to get Stream analytics: ${error.message}`);
  }
}

// ============================================================
// DURABLE OBJECTS - 10 handlers
// ============================================================

export async function cloudflareCreateDurableObjectsNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name, scriptName, className } = args;
    const namespace = await this.cloudflareClient.durableObjects.namespaces.create(accountId, { name, script_name: scriptName, class_name: className });
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to create Durable Objects namespace: ${error.message}`);
  }
}

export async function cloudflareListDurableObjectsNamespaces(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const namespaces = await this.cloudflareClient.durableObjects.namespaces.list(accountId);
    return formatCloudflareResponse(namespaces);
  } catch (error: any) {
    throw new Error(`Failed to list Durable Objects namespaces: ${error.message}`);
  }
}

export async function cloudflareGetDurableObjectsNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    const namespace = await this.cloudflareClient.durableObjects.namespaces.get(accountId, namespaceId);
    return formatCloudflareResponse(namespace);
  } catch (error: any) {
    throw new Error(`Failed to get Durable Objects namespace: ${error.message}`);
  }
}

export async function cloudflareDeleteDurableObjectsNamespace(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    await this.cloudflareClient.durableObjects.namespaces.delete(accountId, namespaceId);
    return formatCloudflareResponse({ accountId, namespaceId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Durable Objects namespace: ${error.message}`);
  }
}

export async function cloudflareListDurableObjects(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId } = args;
    const objects = await this.cloudflareClient.durableObjects.objects.list(accountId, namespaceId);
    return formatCloudflareResponse(objects);
  } catch (error: any) {
    throw new Error(`Failed to list Durable Objects: ${error.message}`);
  }
}

export async function cloudflareGetDurableObject(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId } = args;
    const object = await this.cloudflareClient.durableObjects.objects.get(accountId, namespaceId, objectId);
    return formatCloudflareResponse(object);
  } catch (error: any) {
    throw new Error(`Failed to get Durable Object: ${error.message}`);
  }
}

export async function cloudflareDeleteDurableObject(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId } = args;
    await this.cloudflareClient.durableObjects.objects.delete(accountId, namespaceId, objectId);
    return formatCloudflareResponse({ accountId, namespaceId, objectId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Durable Object: ${error.message}`);
  }
}

export async function cloudflareGetDurableObjectAlarms(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId } = args;
    const alarms = await this.cloudflareClient.durableObjects.alarms.get(accountId, namespaceId, objectId);
    return formatCloudflareResponse(alarms);
  } catch (error: any) {
    throw new Error(`Failed to get Durable Object alarms: ${error.message}`);
  }
}

export async function cloudflareSetDurableObjectAlarm(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId, scheduledTime } = args;
    const alarm = await this.cloudflareClient.durableObjects.alarms.set(accountId, namespaceId, objectId, { scheduledTime });
    return formatCloudflareResponse(alarm);
  } catch (error: any) {
    throw new Error(`Failed to set Durable Object alarm: ${error.message}`);
  }
}

export async function cloudflareDeleteDurableObjectAlarm(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, namespaceId, objectId } = args;
    await this.cloudflareClient.durableObjects.alarms.delete(accountId, namespaceId, objectId);
    return formatCloudflareResponse({ accountId, namespaceId, objectId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete Durable Object alarm: ${error.message}`);
  }
}

// ============================================================
// LOAD BALANCERS - 8 handlers
// ============================================================

export async function cloudflareCreateLoadBalancer(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, name, defaultPools, fallbackPool } = args;
    const loadBalancer = await this.cloudflareClient.loadBalancers.create(zoneId, { name, default_pools: defaultPools, fallback_pool: fallbackPool });
    return formatCloudflareResponse(loadBalancer);
  } catch (error: any) {
    throw new Error(`Failed to create load balancer: ${error.message}`);
  }
}

export async function cloudflareListLoadBalancers(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const loadBalancers = await this.cloudflareClient.loadBalancers.list(zoneId);
    return formatCloudflareResponse(loadBalancers);
  } catch (error: any) {
    throw new Error(`Failed to list load balancers: ${error.message}`);
  }
}

export async function cloudflareGetLoadBalancer(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, loadBalancerId } = args;
    const loadBalancer = await this.cloudflareClient.loadBalancers.get(zoneId, loadBalancerId);
    return formatCloudflareResponse(loadBalancer);
  } catch (error: any) {
    throw new Error(`Failed to get load balancer: ${error.message}`);
  }
}

export async function cloudflareUpdateLoadBalancer(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, loadBalancerId, settings } = args;
    const loadBalancer = await this.cloudflareClient.loadBalancers.update(zoneId, loadBalancerId, settings);
    return formatCloudflareResponse(loadBalancer);
  } catch (error: any) {
    throw new Error(`Failed to update load balancer: ${error.message}`);
  }
}

export async function cloudflareDeleteLoadBalancer(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, loadBalancerId } = args;
    await this.cloudflareClient.loadBalancers.delete(zoneId, loadBalancerId);
    return formatCloudflareResponse({ zoneId, loadBalancerId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete load balancer: ${error.message}`);
  }
}

export async function cloudflareCreateLoadBalancerPool(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, name, origins } = args;
    const pool = await this.cloudflareClient.loadBalancers.pools.create(accountId, { name, origins });
    return formatCloudflareResponse(pool);
  } catch (error: any) {
    throw new Error(`Failed to create load balancer pool: ${error.message}`);
  }
}

export async function cloudflareListLoadBalancerPools(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId } = args;
    const pools = await this.cloudflareClient.loadBalancers.pools.list(accountId);
    return formatCloudflareResponse(pools);
  } catch (error: any) {
    throw new Error(`Failed to list load balancer pools: ${error.message}`);
  }
}

export async function cloudflareDeleteLoadBalancerPool(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { accountId, poolId } = args;
    await this.cloudflareClient.loadBalancers.pools.delete(accountId, poolId);
    return formatCloudflareResponse({ accountId, poolId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete load balancer pool: ${error.message}`);
  }
}

// ============================================================
// RATE LIMITS - 5 handlers
// ============================================================

export async function cloudflareCreateRateLimit(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, threshold, period, action } = args;
    const rateLimit = await this.cloudflareClient.rateLimits.create(zoneId, { threshold, period, action });
    return formatCloudflareResponse(rateLimit);
  } catch (error: any) {
    throw new Error(`Failed to create rate limit: ${error.message}`);
  }
}

export async function cloudflareListRateLimits(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId } = args;
    const rateLimits = await this.cloudflareClient.rateLimits.list(zoneId);
    return formatCloudflareResponse(rateLimits);
  } catch (error: any) {
    throw new Error(`Failed to list rate limits: ${error.message}`);
  }
}

export async function cloudflareGetRateLimit(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, rateLimitId } = args;
    const rateLimit = await this.cloudflareClient.rateLimits.get(zoneId, rateLimitId);
    return formatCloudflareResponse(rateLimit);
  } catch (error: any) {
    throw new Error(`Failed to get rate limit: ${error.message}`);
  }
}

export async function cloudflareUpdateRateLimit(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, rateLimitId, settings } = args;
    const rateLimit = await this.cloudflareClient.rateLimits.update(zoneId, rateLimitId, settings);
    return formatCloudflareResponse(rateLimit);
  } catch (error: any) {
    throw new Error(`Failed to update rate limit: ${error.message}`);
  }
}

export async function cloudflareDeleteRateLimit(this: any, args: any) {
  if (!this.cloudflareClient) throw new Error('Cloudflare client not initialized');
  try {
    const { zoneId, rateLimitId } = args;
    await this.cloudflareClient.rateLimits.delete(zoneId, rateLimitId);
    return formatCloudflareResponse({ zoneId, rateLimitId, status: 'deleted' });
  } catch (error: any) {
    throw new Error(`Failed to delete rate limit: ${error.message}`);
  }
}






