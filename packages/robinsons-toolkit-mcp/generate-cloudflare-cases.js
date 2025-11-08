// Script to generate Cloudflare case statements
const fs = require('fs');
const path = require('path');

// Read all cloudflare-tools files
const toolsFiles = [
  'cloudflare-tools.ts',
  'cloudflare-tools-2.ts',
  'cloudflare-tools-3.ts',
  'cloudflare-tools-4.ts',
  'cloudflare-tools-5.ts',
];

// Map tool names to handler modules
const handlerMap = {
  // Zones (22 tools) - CloudflareHandlers1
  'cloudflare_list_zones': 'CloudflareHandlers1.cloudflareListZones',
  'cloudflare_get_zone': 'CloudflareHandlers1.cloudflareGetZone',
  'cloudflare_create_zone': 'CloudflareHandlers1.cloudflareCreateZone',
  'cloudflare_delete_zone': 'CloudflareHandlers1.cloudflareDeleteZone',
  'cloudflare_purge_cache': 'CloudflareHandlers1.cloudflarePurgeCache',
  'cloudflare_list_dns_records': 'CloudflareHandlers1.cloudflareListDnsRecords',
  'cloudflare_get_dns_record': 'CloudflareHandlers1.cloudflareGetDnsRecord',
  'cloudflare_create_dns_record': 'CloudflareHandlers1.cloudflareCreateDnsRecord',
  'cloudflare_update_dns_record': 'CloudflareHandlers1.cloudflareUpdateDnsRecord',
  'cloudflare_delete_dns_record': 'CloudflareHandlers1.cloudflareDeleteDnsRecord',
  'cloudflare_get_zone_settings': 'CloudflareHandlers1.cloudflareGetZoneSettings',
  'cloudflare_update_zone_setting': 'CloudflareHandlers1.cloudflareUpdateZoneSetting',
  'cloudflare_get_ssl_setting': 'CloudflareHandlers1.cloudflareGetSslSetting',
  'cloudflare_update_ssl_setting': 'CloudflareHandlers1.cloudflareUpdateSslSetting',
  'cloudflare_list_firewall_rules': 'CloudflareHandlers1.cloudflareListFirewallRules',
  'cloudflare_create_firewall_rule': 'CloudflareHandlers1.cloudflareCreateFirewallRule',
  'cloudflare_update_firewall_rule': 'CloudflareHandlers1.cloudflareUpdateFirewallRule',
  'cloudflare_delete_firewall_rule': 'CloudflareHandlers1.cloudflareDeleteFirewallRule',
  'cloudflare_list_page_rules': 'CloudflareHandlers1.cloudflareListPageRules',
  'cloudflare_create_page_rule': 'CloudflareHandlers1.cloudflareCreatePageRule',
  'cloudflare_update_page_rule': 'CloudflareHandlers1.cloudflareUpdatePageRule',
  'cloudflare_delete_page_rule': 'CloudflareHandlers1.cloudflareDeletePageRule',
  
  // Zones remaining (8) + Workers (25) - CloudflareHandlers2
  'cloudflare_get_analytics': 'CloudflareHandlers2.cloudflareGetAnalytics',
  'cloudflare_get_zone_plan': 'CloudflareHandlers2.cloudflareGetZonePlan',
  'cloudflare_list_rate_limits': 'CloudflareHandlers2.cloudflareListRateLimits',
  'cloudflare_create_rate_limit': 'CloudflareHandlers2.cloudflareCreateRateLimit',
  'cloudflare_delete_rate_limit': 'CloudflareHandlers2.cloudflareDeleteRateLimit',
  'cloudflare_list_load_balancers': 'CloudflareHandlers2.cloudflareListLoadBalancers',
  'cloudflare_create_load_balancer': 'CloudflareHandlers2.cloudflareCreateLoadBalancer',
  'cloudflare_delete_load_balancer': 'CloudflareHandlers2.cloudflareDeleteLoadBalancer',
  'cloudflare_list_workers': 'CloudflareHandlers2.cloudflareListWorkers',
  'cloudflare_get_worker': 'CloudflareHandlers2.cloudflareGetWorker',
  'cloudflare_upload_worker': 'CloudflareHandlers2.cloudflareUploadWorker',
  'cloudflare_delete_worker': 'CloudflareHandlers2.cloudflareDeleteWorker',
  'cloudflare_list_worker_routes': 'CloudflareHandlers2.cloudflareListWorkerRoutes',
  'cloudflare_create_worker_route': 'CloudflareHandlers2.cloudflareCreateWorkerRoute',
  'cloudflare_update_worker_route': 'CloudflareHandlers2.cloudflareUpdateWorkerRoute',
  'cloudflare_delete_worker_route': 'CloudflareHandlers2.cloudflareDeleteWorkerRoute',
  'cloudflare_list_worker_cron_triggers': 'CloudflareHandlers2.cloudflareListWorkerCronTriggers',
  'cloudflare_create_worker_cron_trigger': 'CloudflareHandlers2.cloudflareCreateWorkerCronTrigger',
  'cloudflare_delete_worker_cron_trigger': 'CloudflareHandlers2.cloudflareDeleteWorkerCronTrigger',
  'cloudflare_get_worker_settings': 'CloudflareHandlers2.cloudflareGetWorkerSettings',
  'cloudflare_update_worker_settings': 'CloudflareHandlers2.cloudflareUpdateWorkerSettings',
  'cloudflare_list_worker_subdomain': 'CloudflareHandlers2.cloudflareListWorkerSubdomain',
  'cloudflare_create_worker_subdomain': 'CloudflareHandlers2.cloudflareCreateWorkerSubdomain',
  'cloudflare_get_worker_tail': 'CloudflareHandlers2.cloudflareGetWorkerTail',
  'cloudflare_list_worker_secrets': 'CloudflareHandlers2.cloudflareListWorkerSecrets',
  'cloudflare_create_worker_secret': 'CloudflareHandlers2.cloudflareCreateWorkerSecret',
  'cloudflare_delete_worker_secret': 'CloudflareHandlers2.cloudflareDeleteWorkerSecret',
};

// Generate case statements
const cases = [];
for (const [toolName, handler] of Object.entries(handlerMap)) {
  cases.push(`          case '${toolName}': return await ${handler}.call(this, args);`);
}

console.log('// CLOUDFLARE CASE STATEMENTS (first 75)');
console.log(cases.join('\n'));
console.log(`\n// Total: ${cases.length} case statements generated`);

