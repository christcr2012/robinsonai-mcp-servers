import Cloudflare from 'cloudflare';

export class CloudflareClient {
  private client: Cloudflare;

  constructor(apiToken?: string, apiEmail?: string, apiKey?: string) {
    const token = apiToken || process.env.CLOUDFLARE_API_TOKEN;
    const email = apiEmail || process.env.CLOUDFLARE_EMAIL;
    const key = apiKey || process.env.CLOUDFLARE_API_KEY;

    if (!token && (!email || !key)) {
      throw new Error('Either CLOUDFLARE_API_TOKEN or both CLOUDFLARE_EMAIL and CLOUDFLARE_API_KEY are required');
    }

    this.client = new Cloudflare({
      apiToken: token,
      apiEmail: email,
      apiKey: key,
    });
  }

  getClient(): Cloudflare {
    return this.client;
  }

  async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    // Generic request method for endpoints not covered by the SDK
    const baseUrl = 'https://api.cloudflare.com/client/v4';
    const token = process.env.CLOUDFLARE_API_TOKEN;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${JSON.stringify(data)}`);
    }

    return data;
  }

  // Zone methods
  async createZone(params: any) {
    return await this.client.zones.create(params);
  }

  async getZone(zoneId: string) {
    return await this.client.zones.get({ zone_id: zoneId });
  }

  async listZones(params?: any) {
    return await this.client.zones.list(params);
  }

  async updateZone(zoneId: string, params: any) {
    return await this.client.zones.edit({ zone_id: zoneId, ...params });
  }

  async deleteZone(zoneId: string) {
    return await this.client.zones.delete({ zone_id: zoneId });
  }

  async purgeZoneCache(zoneId: string, params?: any) {
    // Use the correct Cloudflare API method
    return await (this.client.zones as any).purge_cache.create({ zone_id: zoneId, ...params });
  }

  // DNS Record methods
  async createDnsRecord(zoneId: string, params: any) {
    return await this.client.dns.records.create({ zone_id: zoneId, ...params });
  }

  async getDnsRecord(zoneId: string, recordId: string) {
    return await this.client.dns.records.get(recordId, { zone_id: zoneId });
  }

  async listDnsRecords(zoneId: string, params?: any) {
    return await this.client.dns.records.list({ zone_id: zoneId, ...params });
  }

  async updateDnsRecord(zoneId: string, recordId: string, params: any) {
    return await this.client.dns.records.update(recordId, { zone_id: zoneId, ...params });
  }

  async deleteDnsRecord(zoneId: string, recordId: string) {
    return await this.client.dns.records.delete(recordId, { zone_id: zoneId });
  }

  // SSL/TLS methods
  async listSslCertificates(zoneId: string) {
    return await this.client.ssl.certificatePacks.list({ zone_id: zoneId });
  }

  async getSslCertificate(zoneId: string, certId: string) {
    return await this.client.ssl.certificatePacks.get(certId, { zone_id: zoneId });
  }

  async getSslSettings(zoneId: string) {
    return await (this.client.ssl as any).settings.get({ zone_id: zoneId });
  }

  async updateSslSettings(zoneId: string, params: any) {
    return await (this.client.ssl as any).settings.edit({ zone_id: zoneId, ...params });
  }

  // Domain Registrar methods (Note: Cloudflare Registrar API is limited)
  async listDomains(accountId: string) {
    return await this.client.registrar.domains.list({ account_id: accountId });
  }

  async getDomain(accountId: string, domainName: string) {
    return await this.client.registrar.domains.get(domainName, { account_id: accountId });
  }

  async updateDomain(accountId: string, domainName: string, params: any) {
    return await this.client.registrar.domains.update(domainName, { account_id: accountId, ...params });
  }

  // Account methods
  async listAccounts() {
    return await this.client.accounts.list();
  }

  async getAccount(accountId: string) {
    return await this.client.accounts.get({ account_id: accountId });
  }

  // Analytics methods
  async getZoneAnalytics(zoneId: string, params?: any) {
    return await (this.client.zones as any).analytics.dashboard.get({ zone_id: zoneId, ...params });
  }

  // Firewall methods
  async listFirewallRules(zoneId: string) {
    return await (this.client as any).firewall.rules.list({ zone_id: zoneId });
  }

  async createFirewallRule(zoneId: string, params: any) {
    return await (this.client as any).firewall.rules.create({ zone_id: zoneId, ...params });
  }

  async updateFirewallRule(zoneId: string, ruleId: string, params: any) {
    return await (this.client as any).firewall.rules.update(ruleId, { zone_id: zoneId, ...params });
  }

  async deleteFirewallRule(zoneId: string, ruleId: string) {
    return await (this.client as any).firewall.rules.delete(ruleId, { zone_id: zoneId });
  }

  async listWafPackages(zoneId: string) {
    return await (this.client as any).firewall.waf.packages.list({ zone_id: zoneId });
  }

  async listWafRules(zoneId: string, packageId: string) {
    return await (this.client as any).firewall.waf.packages.rules.list(packageId, { zone_id: zoneId });
  }

  async updateWafRule(zoneId: string, packageId: string, ruleId: string, mode: string) {
    return await (this.client as any).firewall.waf.packages.rules.update(ruleId, { zone_id: zoneId, package_id: packageId, mode });
  }

  // Cache methods
  async getCacheSettings(zoneId: string) {
    return await (this.client.zones as any).settings.cache_level.get({ zone_id: zoneId });
  }

  async updateCacheLevel(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.cache_level.edit({ zone_id: zoneId, value });
  }

  async updateBrowserCacheTtl(zoneId: string, value: number) {
    return await (this.client.zones as any).settings.browser_cache_ttl.edit({ zone_id: zoneId, value });
  }

  // Zone settings methods
  async getAllZoneSettings(zoneId: string) {
    return await (this.client.zones as any).settings.list({ zone_id: zoneId });
  }

  async updateSecurityLevel(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.security_level.edit({ zone_id: zoneId, value });
  }

  async updateAlwaysUseHttps(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.always_use_https.edit({ zone_id: zoneId, value });
  }

  async updateMinTlsVersion(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.min_tls_version.edit({ zone_id: zoneId, value });
  }

  async updateAutomaticHttpsRewrites(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.automatic_https_rewrites.edit({ zone_id: zoneId, value });
  }

  async updateBrotli(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.brotli.edit({ zone_id: zoneId, value });
  }

  async updateMinify(zoneId: string, value: any) {
    return await (this.client.zones as any).settings.minify.edit({ zone_id: zoneId, value });
  }

  async updateRocketLoader(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.rocket_loader.edit({ zone_id: zoneId, value });
  }

  async updateHttp2(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.http2.edit({ zone_id: zoneId, value });
  }

  async updateHttp3(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.http3.edit({ zone_id: zoneId, value });
  }

  async updateIpv6(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.ipv6.edit({ zone_id: zoneId, value });
  }

  async updateWebsockets(zoneId: string, value: string) {
    return await (this.client.zones as any).settings.websockets.edit({ zone_id: zoneId, value });
  }
}

