/**
 * Docker-based Sandbox Execution
 * 
 * Runs code in a Docker container for true isolation:
 * - No network access
 * - Resource limits (CPU, memory, time)
 * - Read-only filesystem (except /workspace)
 * - Non-root user
 * - Automatic cleanup
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { ExecReport, PipelineConfig, GenResult } from './types.js';
import { DEFAULT_PIPELINE_CONFIG } from './types.js';

const DOCKER_IMAGE = 'free-agent-sandbox:latest';
const DOCKER_TIMEOUT = 120000; // 2 minutes max per container

/**
 * Check if Docker is available and image is built
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    // Check if Docker is running
    execSync('docker ps', { stdio: 'pipe', timeout: 5000 });
    
    // Check if image exists
    const images = execSync('docker images -q ' + DOCKER_IMAGE, { 
      stdio: 'pipe',
      timeout: 5000,
    }).toString().trim();
    
    return images.length > 0;
  } catch {
    return false;
  }
}

/**
 * Build Docker sandbox image
 */
export async function buildDockerImage(): Promise<void> {
  const dockerfilePath = path.join(process.cwd(), 'packages', 'free-agent-mcp', '.docker');
  
  console.error('[DockerSandbox] Building Docker image...');
  
  try {
    execSync(`docker build -t ${DOCKER_IMAGE} .`, {
      cwd: dockerfilePath,
      stdio: 'inherit',
      timeout: 300000, // 5 minutes max for build
    });
    
    console.error('[DockerSandbox] ✅ Docker image built successfully');
  } catch (error: any) {
    throw new Error(`Failed to build Docker image: ${error.message}`);
  }
}

/**
 * Run sandbox pipeline in Docker container
 */
export async function runDockerSandboxPipeline(
  genResult: GenResult,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): Promise<ExecReport> {
  // Check if Docker is available
  const dockerAvailable = await isDockerAvailable();
  
  if (!dockerAvailable) {
    throw new Error(
      'Docker sandbox not available. Please ensure Docker is running and run: npm run build:sandbox'
    );
  }

  // Create temp directory for code
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-docker-'));
  
  try {
    // Write all files to temp directory
    await writeFiles(tempDir, genResult);
    
    // Copy template files
    await copyTemplates(tempDir);
    
    // Run Docker container
    const report = await runInDocker(tempDir, config);
    
    return report;
  } finally {
    // Cleanup temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Write generated files to temp directory
 */
async function writeFiles(tempDir: string, genResult: GenResult): Promise<void> {
  const allFiles = [...genResult.files, ...genResult.tests];
  
  for (const file of allFiles) {
    const filePath = path.join(tempDir, file.path);
    const dir = path.dirname(filePath);
    
    // Create directory if needed
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, file.content, 'utf-8');
  }
}

/**
 * Copy template configuration files
 */
async function copyTemplates(tempDir: string): Promise<void> {
  const templateDir = path.join(
    process.cwd(),
    'packages',
    'free-agent-mcp',
    '.docker'
  );
  
  const templates = [
    'package.json.template',
    'tsconfig.json.template',
    'jest.config.js.template',
    '.eslintrc.json.template',
    '.prettierrc.json.template',
  ];
  
  for (const template of templates) {
    const src = path.join(templateDir, template);
    const dest = path.join(tempDir, template.replace('.template', ''));
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  }
}

/**
 * Run code in Docker container
 */
async function runInDocker(
  tempDir: string,
  config: PipelineConfig
): Promise<ExecReport> {
  const containerName = `agent-sandbox-${Date.now()}`;
  
  try {
    // Install dependencies first (in container)
    console.error('[DockerSandbox] Installing dependencies...');
    await runDockerCommand(tempDir, containerName, 'npm install --silent', 60000);
    
    // Run format check
    console.error('[DockerSandbox] Running format check...');
    const formatResult = await runDockerCommand(
      tempDir,
      containerName,
      'npm run format',
      10000,
      true // Allow failure
    );
    
    // Run linter
    console.error('[DockerSandbox] Running linter...');
    const lintResult = await runDockerCommand(
      tempDir,
      containerName,
      'npm run lint',
      15000,
      true
    );
    
    // Run type checker
    console.error('[DockerSandbox] Running type checker...');
    const typeResult = await runDockerCommand(
      tempDir,
      containerName,
      'npm run typecheck',
      20000,
      true
    );
    
    // Run tests
    console.error('[DockerSandbox] Running tests...');
    const testResult = await runDockerCommand(
      tempDir,
      containerName,
      'npm test',
      config.globalTimeout || 30000,
      true
    );
    
    // Parse results
    return parseResults({
      format: formatResult,
      lint: lintResult,
      type: typeResult,
      test: testResult,
    });
  } finally {
    // Cleanup container
    try {
      execSync(`docker rm -f ${containerName}`, { stdio: 'pipe' });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run a command in Docker container
 */
async function runDockerCommand(
  tempDir: string,
  containerName: string,
  command: string,
  timeout: number,
  allowFailure: boolean = false
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const dockerArgs = [
      'run',
      '--rm',
      '--name', containerName,
      '--network', 'none', // No network access
      '--memory', '512m', // 512MB memory limit
      '--cpus', '1', // 1 CPU limit
      '--read-only', // Read-only filesystem
      '--tmpfs', '/tmp:rw,noexec,nosuid,size=100m', // Temp directory
      '-v', `${tempDir}:/workspace:rw`, // Mount code directory
      '-w', '/workspace',
      DOCKER_IMAGE,
      'sh', '-c', command,
    ];
    
    const proc = spawn('docker', dockerArgs, {
      timeout,
      killSignal: 'SIGKILL',
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      const exitCode = code || 0;
      
      if (exitCode !== 0 && !allowFailure) {
        reject(new Error(`Command failed with exit code ${exitCode}: ${stderr}`));
      } else {
        resolve({ stdout, stderr, exitCode });
      }
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
    
    // Timeout handler
    setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Parse results from Docker commands
 */
function parseResults(results: {
  format: { stdout: string; stderr: string; exitCode: number };
  lint: { stdout: string; stderr: string; exitCode: number };
  type: { stdout: string; stderr: string; exitCode: number };
  test: { stdout: string; stderr: string; exitCode: number };
}): ExecReport {
  // Parse lint errors
  const lintErrors: string[] = [];
  try {
    const lintJson = JSON.parse(results.lint.stdout);
    for (const file of lintJson) {
      for (const msg of file.messages || []) {
        lintErrors.push(`${file.filePath}:${msg.line}:${msg.column} - ${msg.message} (${msg.ruleId})`);
      }
    }
  } catch {
    if (results.lint.exitCode !== 0) {
      lintErrors.push(results.lint.stderr || 'Linting failed');
    }
  }
  
  // Parse type errors
  const typeErrors: string[] = [];
  if (results.type.exitCode !== 0) {
    const lines = (results.type.stdout + results.type.stderr).split('\n');
    typeErrors.push(...lines.filter(line => line.includes('error TS')));
  }
  
  // Parse test results
  let testPassed = 0;
  let testFailed = 0;
  let coverage = 0;
  const testDetails: string[] = [];
  
  try {
    // Try to parse JSON output
    const testJson = JSON.parse(results.test.stdout);
    testPassed = testJson.numPassedTests || 0;
    testFailed = testJson.numFailedTests || 0;
    coverage = testJson.coverageMap?.total?.lines?.pct || 0;
  } catch {
    // Fallback to text parsing
    if (results.test.exitCode === 0) {
      testPassed = 1;
    } else {
      testFailed = 1;
      testDetails.push(results.test.stderr || 'Tests failed');
    }
  }
  
  return {
    compiled: results.type.exitCode === 0,
    lintErrors,
    typeErrors,
    boundaryErrors: [],
    customRuleErrors: [],
    editViolations: [],
    test: {
      passed: testPassed,
      failed: testFailed,
      details: testDetails,
      coveragePct: coverage,
    },
    security: {
      violations: [],
    },
    logsTail: [
      '=== Format ===',
      results.format.stderr,
      '=== Lint ===',
      results.lint.stderr,
      '=== Type ===',
      results.type.stderr,
      '=== Test ===',
      results.test.stderr,
    ].filter(Boolean),
  };
}

