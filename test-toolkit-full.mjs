// Test toolkit with full MCP server loading
import { spawn } from 'child_process';

console.log('Testing Robinson\'s Toolkit with MCP server loading...\n');

// Set all environment variables
const env = {
  ...process.env,
  RTK_EAGER_LOAD: '1',
  GITHUB_TOKEN: 'ghp_your-github-token-here',
  VERCEL_TOKEN: 'your-vercel-token-here',
  NEON_API_KEY: 'your-neon-api-key-here',
  STRIPE_API_KEY: 'sk_test_your-stripe-key-here',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_SERVICE_KEY: 'your-supabase-service-key-here',
  TWILIO_ACCOUNT_SID: 'ACyour-twilio-account-sid-here',
  TWILIO_AUTH_TOKEN: 'your-twilio-auth-token-here',
  TWILIO_FROM: '+1234567890',
  RESEND_API_KEY: 're_your-resend-api-key-here',
  RESEND_FROM: 'your-email@yourdomain.com',
  CLOUDFLARE_API_TOKEN: 'your-cloudflare-api-token-here',
  CF_ACCOUNT_ID: 'your_cf_account_id',
  REDIS_URL: 'redis://default:Ht0Z8jeQUTT4cDPNdX1RG6tKzSCJAzXP@redis-17153.c2622.us-east-1-3.ec2.redns.redis-cloud.com:17153',
  FLY_API_TOKEN: 'fm2_lJPECAAAAAAACoi/xBDy+AfDQ7grI0X4CT4Cq2/WwrVodHRwczovL2FwaS5mbHkuaW8vdjGUAJLOABQP0R8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDx6l+agyQqEDhZ91vZtBbzxBcbDxgU9/CUGlmmKSBedAwqGa7RIFFhRvRrjJgJ/mbsv5OR0FsuERCVumr3ETt2duuvEy7aJOu37eHR7pQeujURgHBBo7LB7JambZLE8Vq+BbhKozwKq+KqBYGUqh8cHBvi4LcNEp9SQm2yUKHJmmExlLZ5/+TrniQsh5cQgqihUFRcleE3MVv20ptN75of2a7bSb87FyJfNlCooPGo=,fm2_lJPETt2duuvEy7aJOu37eHR7pQeujURgHBBo7LB7JambZLE8Vq+BbhKozwKq+KqBYGUqh8cHBvi4LcNEp9SQm2yUKHJmmExlLZ5/+TrniQsh5cQQF4EA9hU7g9UeidwrwqNq8MO5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZgEks5o+Ye9zwAAAAEk8aXbF84AE0WjCpHOABNFowzEEGfiyp+IXlcq/HjiKzMBOmjEIGm1DxeY5dxRxva8dJC6hyRoSGVrD4O5O8LVCd1XGiiK'
};

const proc = spawn('node', ['packages/robinsons-toolkit-mcp/dist/index.js'], {
  env,
  stdio: ['pipe', 'pipe', 'inherit']
});

let output = '';

proc.stdout.on('data', (data) => {
  output += data.toString();
});

// Send tools/list request after a delay to let it initialize
setTimeout(() => {
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  proc.stdin.write(JSON.stringify(request) + '\n');
  
  // Wait for response
  setTimeout(() => {
    proc.kill();
    
    // Parse response
    try {
      const lines = output.split('\n').filter(l => l.trim() && l.includes('"tools"'));
      if (lines.length > 0) {
        const response = JSON.parse(lines[0]);
        if (response.result && response.result.tools) {
          const tools = response.result.tools;
          console.log(`✅ Total tools loaded: ${tools.length}\n`);
          
          // Group by vendor
          const byVendor = {};
          for (const tool of tools) {
            const vendor = tool.name.split('.')[0] || 'meta';
            if (!byVendor[vendor]) byVendor[vendor] = [];
            byVendor[vendor].push(tool.name);
          }
          
          console.log('Tools by vendor:');
          for (const [vendor, toolList] of Object.entries(byVendor)) {
            console.log(`  ${vendor}: ${toolList.length} tools`);
          }
          
          console.log('\n✅ SUCCESS! Toolkit loaded all MCP server tools!');
        } else {
          console.log('❌ No tools in response');
          console.log(output);
        }
      } else {
        console.log('❌ No valid response received');
        console.log('Output:', output);
      }
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
      console.log('Output:', output);
    }
  }, 15000); // Wait 15 seconds for MCP servers to load
}, 2000); // Wait 2 seconds for toolkit to start

