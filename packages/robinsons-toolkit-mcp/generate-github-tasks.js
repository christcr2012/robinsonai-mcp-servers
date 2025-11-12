#!/usr/bin/env node
/**
 * Generate task list for run_parallel to build missing GitHub tools
 * 
 * Usage: node generate-github-tasks.js > github-tasks.json
 */

const tasks = [];
const repo = "packages/robinsons-toolkit-mcp";

// Actions OIDC (6 tools)
const oidcEndpoints = [
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/oidc/customization/sub', name: 'get_oidc_customization', desc: 'Get OIDC subject claim customization' },
  { method: 'PUT', path: '/repos/{owner}/{repo}/actions/oidc/customization/sub', name: 'set_oidc_customization', desc: 'Set OIDC subject claim customization' },
  { method: 'GET', path: '/orgs/{org}/actions/oidc/customization/sub', name: 'get_org_oidc_customization', desc: 'Get org OIDC customization' },
  { method: 'PUT', path: '/orgs/{org}/actions/oidc/customization/sub', name: 'set_org_oidc_customization', desc: 'Set org OIDC customization' },
];

oidcEndpoints.forEach(ep => {
  tasks.push({
    repo,
    task: `Add GitHub Actions OIDC tool: ${ep.method} ${ep.path}. Tool name: github_${ep.name}. Description: "${ep.desc}". Add tool definition to index.ts tools array, add handler case statement, add handler method implementation. Follow existing GitHub tool patterns.`,
    kind: "feature",
    quality: "auto"
  });
});

// Actions Permissions (8 tools)
const permEndpoints = [
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/permissions', name: 'get_actions_permissions', desc: 'Get Actions permissions' },
  { method: 'PUT', path: '/repos/{owner}/{repo}/actions/permissions', name: 'set_actions_permissions', desc: 'Set Actions permissions' },
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/permissions/access', name: 'get_workflow_access', desc: 'Get workflow access level' },
  { method: 'PUT', path: '/repos/{owner}/{repo}/actions/permissions/access', name: 'set_workflow_access', desc: 'Set workflow access level' },
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/permissions/selected-actions', name: 'get_allowed_actions', desc: 'Get allowed actions' },
  { method: 'PUT', path: '/repos/{owner}/{repo}/actions/permissions/selected-actions', name: 'set_allowed_actions', desc: 'Set allowed actions' },
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/permissions/workflow', name: 'get_default_workflow_permissions', desc: 'Get default workflow permissions' },
  { method: 'PUT', path: '/repos/{owner}/{repo}/actions/permissions/workflow', name: 'set_default_workflow_permissions', desc: 'Set default workflow permissions' },
];

permEndpoints.forEach(ep => {
  tasks.push({
    repo,
    task: `Add GitHub Actions Permissions tool: ${ep.method} ${ep.path}. Tool name: github_${ep.name}. Description: "${ep.desc}". Add tool definition to index.ts tools array, add handler case statement, add handler method implementation. Follow existing GitHub tool patterns.`,
    kind: "feature",
    quality: "auto"
  });
});

// Actions Secrets - Org Level (6 tools)
const secretEndpoints = [
  { method: 'GET', path: '/orgs/{org}/actions/secrets', name: 'list_org_secrets', desc: 'List org secrets' },
  { method: 'GET', path: '/orgs/{org}/actions/secrets/public-key', name: 'get_org_secrets_public_key', desc: 'Get org secrets public key' },
  { method: 'GET', path: '/orgs/{org}/actions/secrets/{secret_name}', name: 'get_org_secret', desc: 'Get org secret' },
  { method: 'PUT', path: '/orgs/{org}/actions/secrets/{secret_name}', name: 'create_or_update_org_secret', desc: 'Create or update org secret' },
  { method: 'DELETE', path: '/orgs/{org}/actions/secrets/{secret_name}', name: 'delete_org_secret', desc: 'Delete org secret' },
  { method: 'GET', path: '/orgs/{org}/actions/secrets/{secret_name}/repositories', name: 'list_org_secret_repos', desc: 'List repos with access to org secret' },
];

secretEndpoints.forEach(ep => {
  tasks.push({
    repo,
    task: `Add GitHub Actions Secrets (org) tool: ${ep.method} ${ep.path}. Tool name: github_${ep.name}. Description: "${ep.desc}". Add tool definition to index.ts tools array, add handler case statement, add handler method implementation. Follow existing GitHub tool patterns.`,
    kind: "feature",
    quality: "auto"
  });
});

// Actions Self-Hosted Runners (12 tools)
const runnerEndpoints = [
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/runners', name: 'list_self_hosted_runners', desc: 'List self-hosted runners' },
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/runners/downloads', name: 'list_runner_downloads', desc: 'List runner application downloads' },
  { method: 'POST', path: '/repos/{owner}/{repo}/actions/runners/registration-token', name: 'create_runner_registration_token', desc: 'Create runner registration token' },
  { method: 'POST', path: '/repos/{owner}/{repo}/actions/runners/remove-token', name: 'create_runner_remove_token', desc: 'Create runner remove token' },
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/runners/{runner_id}', name: 'get_self_hosted_runner', desc: 'Get self-hosted runner' },
  { method: 'DELETE', path: '/repos/{owner}/{repo}/actions/runners/{runner_id}', name: 'delete_self_hosted_runner', desc: 'Delete self-hosted runner' },
  { method: 'GET', path: '/repos/{owner}/{repo}/actions/runners/{runner_id}/labels', name: 'list_runner_labels', desc: 'List runner labels' },
  { method: 'POST', path: '/repos/{owner}/{repo}/actions/runners/{runner_id}/labels', name: 'add_runner_labels', desc: 'Add runner labels' },
  { method: 'PUT', path: '/repos/{owner}/{repo}/actions/runners/{runner_id}/labels', name: 'set_runner_labels', desc: 'Set runner labels' },
  { method: 'DELETE', path: '/repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}', name: 'remove_runner_label', desc: 'Remove runner label' },
  { method: 'DELETE', path: '/repos/{owner}/{repo}/actions/runners/{runner_id}/labels', name: 'remove_all_runner_labels', desc: 'Remove all runner labels' },
];

runnerEndpoints.forEach(ep => {
  tasks.push({
    repo,
    task: `Add GitHub Actions Self-Hosted Runners tool: ${ep.method} ${ep.path}. Tool name: github_${ep.name}. Description: "${ep.desc}". Add tool definition to index.ts tools array, add handler case statement, add handler method implementation. Follow existing GitHub tool patterns.`,
    kind: "feature",
    quality: "auto"
  });
});

// Output JSON
console.log(JSON.stringify({ tasks, total: tasks.length }, null, 2));

