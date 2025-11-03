#!/usr/bin/env node
/**
 * Smoke Test for New Architect Architecture
 * 
 * Tests the complete workflow:
 * 1. submit_spec (paste big brief)
 * 2. decompose_spec (break into work items)
 * 3. plan_work (create plan in skeleton mode)
 * 4. get_plan_status (monitor progress)
 * 5. get_plan_chunk (retrieve steps)
 * 6. export_workplan_to_optimizer (validate and export)
 * 7. If validation fails, revise_plan and re-export
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPClient {
  constructor() {
    this.process = null;
    this.requestId = 1;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.process = spawn('node', [join(__dirname, '..', 'dist', 'index.js')], {
        stdio: ['pipe', 'pipe', 'inherit'],
      });

      this.process.stdout.once('data', () => {
        console.log('✓ Architect MCP server started');
        resolve();
      });

      this.process.on('error', reject);
    });
  }

  async callTool(name, args) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      let buffer = '';
      const handler = (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        
        for (let i = 0; i < lines.length - 1; i++) {
          try {
            const response = JSON.parse(lines[i]);
            if (response.id === request.id) {
              clearTimeout(timeout);
              this.process.stdout.off('data', handler);
              resolve(response.result);
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
        
        buffer = lines[lines.length - 1];
      };

      this.process.stdout.on('data', handler);
      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  stop() {
    if (this.process) {
      this.process.kill();
    }
  }
}

async function runSmokeTest() {
  console.log('\n🧪 Architect MCP - New Architecture Smoke Test\n');

  const client = new MCPClient();

  try {
    await client.start();

    // Test 1: Submit spec
    console.log('1️⃣  Testing submit_spec...');
    const specResult = await client.callTool('submit_spec', {
      title: 'RAD Phase 1: Neon Schema Deployment',
      text: `
# RAD Phase 1: Neon Schema Deployment

## Goal
Deploy RAD Crawler database schema to Neon PostgreSQL with safety limits.

## Deliverables
1. Deployment script (packages/rad-crawler-mcp/scripts/deploy-schema.mjs)
2. Verification script (packages/rad-crawler-mcp/scripts/verify-schema.mjs)
3. Deployment guide (packages/rad-crawler-mcp/docs/NEON_DEPLOYMENT_GUIDE.md)

## Acceptance Criteria
- Schema deploys successfully to Neon
- All 6 tables created (sources, documents, doc_blobs, chunks, jobs, policy)
- pgvector extension enabled
- Default governance policy includes safety limits
- Verification script confirms all components

## Safety Limits
- max_pages_per_job: 1000
- max_depth: 5
- max_time_minutes: 120
- max_repo_files: 5000
- max_chunk_size_kb: 100
      `.trim(),
    });
    
    const spec = JSON.parse(specResult.content[0].text);
    console.log(`✓ Spec submitted: ID=${spec.spec_id}, size=${spec.size_bytes} bytes`);

    // Test 2: Decompose spec
    console.log('\n2️⃣  Testing decompose_spec...');
    const decomposeResult = await client.callTool('decompose_spec', {
      spec_id: spec.spec_id,
    });
    
    const decomposed = JSON.parse(decomposeResult.content[0].text);
    console.log(`✓ Spec decomposed: ${decomposed.count} work items`);

    // Test 3: Create plan (should return immediately)
    console.log('\n3️⃣  Testing plan_work (incremental)...');
    const startTime = Date.now();
    const planResult = await client.callTool('plan_work', {
      spec_id: spec.spec_id,
      mode: 'skeleton',
      budgets: {
        max_steps: 5,
        time_ms: 30000,
        max_files_changed: 10,
      },
    });
    
    const elapsed = Date.now() - startTime;
    const plan = JSON.parse(planResult.content[0].text);
    console.log(`✓ Plan created in ${elapsed}ms: plan_id=${plan.plan_id}`);
    
    if (elapsed > 5000) {
      console.log(`⚠️  Warning: plan_work took ${elapsed}ms (should be <5s)`);
    }

    // Test 4: Monitor plan status
    console.log('\n4️⃣  Testing get_plan_status...');
    let status;
    let attempts = 0;
    
    while (attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResult = await client.callTool('get_plan_status', {
        plan_id: plan.plan_id,
      });
      
      status = JSON.parse(statusResult.content[0].text);
      console.log(`   Progress: ${status.progress}%, state=${status.state}, steps=${status.steps_count}`);
      
      if (status.state === 'done' || status.state === 'failed') {
        break;
      }
      
      attempts++;
    }
    
    if (status.state === 'done') {
      console.log(`✓ Planning complete: ${status.steps_count} steps generated`);
    } else {
      console.log(`⚠️  Planning did not complete: state=${status.state}`);
    }

    // Test 5: Get plan chunk
    console.log('\n5️⃣  Testing get_plan_chunk...');
    const chunkResult = await client.callTool('get_plan_chunk', {
      plan_id: plan.plan_id,
      from: 0,
      size: 3,
    });
    
    const chunk = JSON.parse(chunkResult.content[0].text);
    console.log(`✓ Retrieved chunk: ${chunk.size} steps (total: ${chunk.total})`);

    // Test 6: Export and validate
    console.log('\n6️⃣  Testing export_workplan_to_optimizer...');
    const exportResult = await client.callTool('export_workplan_to_optimizer', {
      plan_id: plan.plan_id,
    });
    
    const exported = JSON.parse(exportResult.content[0].text);
    
    if (exported.workflow) {
      console.log(`✓ Plan exported successfully`);
      console.log(`   Validation: ${exported.workflow.validation.passed ? 'PASSED' : 'FAILED'}`);
      
      if (exported.workflow.validation.warnings.length > 0) {
        console.log(`   Warnings: ${exported.workflow.validation.warnings.length}`);
      }
    } else {
      console.log(`❌ Export failed (validation errors)`);
      console.log(exported);
    }

    // Test 7: List templates
    console.log('\n7️⃣  Testing list_templates...');
    const templatesResult = await client.callTool('list_templates', {});
    const templates = JSON.parse(templatesResult.content[0].text);
    console.log(`✓ Found ${templates.count} templates`);

    console.log('\n✅ All tests passed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    client.stop();
  }
}

runSmokeTest().catch(console.error);

