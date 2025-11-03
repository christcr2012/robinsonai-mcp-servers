const { spawn } = require('child_process');

const vercelToken = process.argv[2] || process.env.VERCEL_TOKEN || '';

if (!vercelToken) {
  console.error('Error: Vercel token required!');
  console.error('Usage: node count-all-tools.cjs <VERCEL_TOKEN>');
  process.exit(1);
}

const child = spawn('node', ['dist/index.js', vercelToken], {
  stdio: ['pipe', 'pipe', 'inherit']
});

const request = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
}) + '\n';

child.stdin.write(request);
child.stdin.end();

let output = '';
child.stdout.on('data', (data) => {
  output += data.toString();
});

child.stdout.on('end', () => {
  try {
    const lines = output.trim().split('\n');
    const jsonLine = lines.find(line => line.startsWith('{'));
    
    if (jsonLine) {
      const response = JSON.parse(jsonLine);
      if (response.result && response.result.tools) {
        const tools = response.result.tools;
        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ VERCEL MCP SERVER - TOOL COUNT');
        console.log('═══════════════════════════════════════════════════');
        console.log(`Total Tools: ${tools.length}`);
        console.log('═══════════════════════════════════════════════════\n');
        
        // Group tools by category
        const categories = {};
        tools.forEach(tool => {
          const name = tool.name;
          let category = 'Other';
          
          if (name.includes('_project')) category = 'Projects';
          else if (name.includes('_deployment')) category = 'Deployments';
          else if (name.includes('_env_var')) category = 'Environment Variables';
          else if (name.includes('_domain')) category = 'Domains';
          else if (name.includes('_dns')) category = 'DNS';
          else if (name.includes('_team')) category = 'Teams';
          else if (name.includes('_edge_config')) category = 'Edge Config';
          else if (name.includes('_webhook')) category = 'Webhooks';
          else if (name.includes('_alias')) category = 'Aliases';
          else if (name.includes('_secret')) category = 'Secrets';
          else if (name.includes('_check')) category = 'Checks';
          else if (name.includes('_file')) category = 'Deployment Files';
          else if (name.includes('_blob_')) category = 'Blob Storage';
          else if (name.includes('_kv_')) category = 'KV Storage';
          else if (name.includes('_postgres_')) category = 'Postgres';
          else if (name.includes('_firewall') || name.includes('_ip') || name.includes('_security') || name.includes('_attack')) category = 'Firewall & Security';
          else if (name.includes('_logs') || name.includes('_analytics') || name.includes('_bandwidth') || name.includes('_function') || name.includes('_cache') || name.includes('_traces') || name.includes('_performance') || name.includes('_web_vitals')) category = 'Monitoring & Observability';
          else if (name.includes('_billing') || name.includes('_usage') || name.includes('_invoice') || name.includes('_spending') || name.includes('_cost')) category = 'Billing & Usage';
          else if (name.includes('_integration')) category = 'Integrations';
          else if (name.includes('_audit') || name.includes('_compliance') || name.includes('_access_events')) category = 'Audit Logs';
          else if (name.includes('_cron')) category = 'Cron Jobs';
          else if (name.includes('_redirect') || name.includes('_header')) category = 'Advanced Routing';
          else if (name.includes('_comment')) category = 'Preview Comments';
          else if (name.includes('_git')) category = 'Git Integration';
          
          if (!categories[category]) categories[category] = [];
          categories[category].push(name);
        });
        
        console.log('Tools by Category:');
        console.log('─'.repeat(50));
        Object.keys(categories).sort().forEach(category => {
          console.log(`${category}: ${categories[category].length} tools`);
        });
        console.log('═══════════════════════════════════════════════════\n');
      }
    }
  } catch (error) {
    console.error('Error parsing response:', error.message);
    console.log('Raw output:', output);
  }
});

