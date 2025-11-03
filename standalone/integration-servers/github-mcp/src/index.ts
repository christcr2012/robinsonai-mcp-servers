#!/usr/bin/env node

/**
 * @robinsonai/github-mcp
 * Comprehensive GitHub MCP Server with 200+ tools
 * By Robinson AI Systems
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

interface GitHubClient {
  get(path: string, params?: any): Promise<any>;
  post(path: string, body?: any): Promise<any>;
  patch(path: string, body?: any): Promise<any>;
  put(path: string, body?: any): Promise<any>;
  delete(path: string): Promise<any>;
}

class GitHubMCP {
  private server: Server;
  private token: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string) {
    this.server = new Server(
      { name: '@robinsonai/github-mcp', version: '2.0.0' },
      { capabilities: { tools: {} } }
    );
    this.token = token;
    this.setupHandlers();
  }

  private async fetch(path: string, options: RequestInit = {}): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  private client: GitHubClient = {
    get: (path: string, params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return this.fetch(`${path}${query}`, { method: 'GET' });
    },
    post: (path: string, body?: any) =>
      this.fetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    patch: (path: string, body?: any) =>
      this.fetch(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    put: (path: string, body?: any) =>
      this.fetch(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    delete: (path: string) =>
      this.fetch(path, { method: 'DELETE' }),
  };

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // REPOSITORY MANAGEMENT (20 tools)
        { name: 'github_list_repos', description: 'List repositories for authenticated user or organization', inputSchema: { type: 'object', properties: { org: { type: 'string' }, type: { type: 'string', enum: ['all', 'owner', 'public', 'private', 'member'] }, sort: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } } } },
        { name: 'github_get_repo', description: 'Get repository details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_create_repo', description: 'Create a new repository', inputSchema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, private: { type: 'boolean' }, auto_init: { type: 'boolean' }, gitignore_template: { type: 'string' }, license_template: { type: 'string' }, org: { type: 'string' } }, required: ['name'] } },
        { name: 'github_update_repo', description: 'Update repository settings', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, private: { type: 'boolean' }, has_issues: { type: 'boolean' }, has_projects: { type: 'boolean' }, has_wiki: { type: 'boolean' } }, required: ['owner', 'repo'] } },
        { name: 'github_delete_repo', description: 'Delete a repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_list_repo_topics', description: 'List repository topics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_replace_repo_topics', description: 'Replace all repository topics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, names: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'names'] } },
        { name: 'github_list_repo_languages', description: 'List programming languages used in repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_list_repo_tags', description: 'List repository tags', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_list_repo_teams', description: 'List teams with access to repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_transfer_repo', description: 'Transfer repository to another user/org', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, new_owner: { type: 'string' } }, required: ['owner', 'repo', 'new_owner'] } },
        { name: 'github_enable_automated_security_fixes', description: 'Enable automated security fixes', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_disable_automated_security_fixes', description: 'Disable automated security fixes', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_enable_vulnerability_alerts', description: 'Enable vulnerability alerts', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_disable_vulnerability_alerts', description: 'Disable vulnerability alerts', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_readme', description: 'Get repository README', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_license', description: 'Get repository license', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_community_profile', description: 'Get community profile metrics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_stats_contributors', description: 'Get contributor statistics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_stats_commit_activity', description: 'Get commit activity statistics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },

        // BRANCHES (15 tools)
        { name: 'github_list_branches', description: 'List repository branches', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, protected: { type: 'boolean' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_branch', description: 'Get branch details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_create_branch', description: 'Create a new branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string'}, branch: { type: 'string' }, from_branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_delete_branch', description: 'Delete a branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_merge_branch', description: 'Merge a branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, base: { type: 'string' }, head: { type: 'string' }, commit_message: { type: 'string' } }, required: ['owner', 'repo', 'base', 'head'] } },
        { name: 'github_get_branch_protection', description: 'Get branch protection rules', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_update_branch_protection', description: 'Update branch protection rules', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, required_status_checks: { type: 'object' }, enforce_admins: { type: 'boolean' }, required_pull_request_reviews: { type: 'object' }, restrictions: { type: 'object' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_delete_branch_protection', description: 'Remove branch protection', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_get_required_status_checks', description: 'Get required status checks', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_update_required_status_checks', description: 'Update required status checks', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, strict: { type: 'boolean' }, contexts: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_get_admin_enforcement', description: 'Get admin enforcement status', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_set_admin_enforcement', description: 'Enable/disable admin enforcement', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_get_pull_request_review_enforcement', description: 'Get PR review enforcement', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_update_pull_request_review_enforcement', description: 'Update PR review enforcement', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, dismissal_restrictions: { type: 'object' }, dismiss_stale_reviews: { type: 'boolean' }, require_code_owner_reviews: { type: 'boolean' }, required_approving_review_count: { type: 'number' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'github_rename_branch', description: 'Rename a branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, new_name: { type: 'string' } }, required: ['owner', 'repo', 'branch', 'new_name'] } },

        // COMMITS (10 tools)
        { name: 'github_list_commits', description: 'List commits', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, sha: { type: 'string' }, path: { type: 'string' }, author: { type: 'string' }, since: { type: 'string' }, until: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_commit', description: 'Get commit details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'ref'] } },
        { name: 'github_compare_commits', description: 'Compare two commits', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, base: { type: 'string' }, head: { type: 'string' } }, required: ['owner', 'repo', 'base', 'head'] } },
        { name: 'github_list_commit_comments', description: 'List commit comments', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'ref'] } },
        { name: 'github_create_commit_comment', description: 'Create commit comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, commit_sha: { type: 'string' }, body: { type: 'string' }, path: { type: 'string' }, position: { type: 'number' } }, required: ['owner', 'repo', 'commit_sha', 'body'] } },
        { name: 'github_get_commit_status', description: 'Get combined commit status', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'ref'] } },
        { name: 'github_list_commit_statuses', description: 'List commit statuses', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'ref'] } },
        { name: 'github_create_commit_status', description: 'Create commit status', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, sha: { type: 'string' }, state: { type: 'string', enum: ['error', 'failure', 'pending', 'success'] }, target_url: { type: 'string' }, description: { type: 'string' }, context: { type: 'string' } }, required: ['owner', 'repo', 'sha', 'state'] } },
        { name: 'github_list_pull_requests_associated_with_commit', description: 'List PRs associated with commit', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, commit_sha: { type: 'string' } }, required: ['owner', 'repo', 'commit_sha'] } },
        { name: 'github_get_commit_signature_verification', description: 'Get commit signature verification', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'ref'] } },

        // ISSUES (20 tools)
        { name: 'github_list_issues', description: 'List issues', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] }, labels: { type: 'array', items: { type: 'string' } }, sort: { type: 'string' }, direction: { type: 'string' }, since: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_issue', description: 'Get issue details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'github_create_issue', description: 'Create an issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, assignees: { type: 'array', items: { type: 'string' } }, milestone: { type: 'number' }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'title'] } },
        { name: 'github_update_issue', description: 'Update an issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, title: { type: 'string' }, body: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed'] }, assignees: { type: 'array', items: { type: 'string' } }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'github_lock_issue', description: 'Lock an issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, lock_reason: { type: 'string', enum: ['off-topic', 'too heated', 'resolved', 'spam'] } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'github_unlock_issue', description: 'Unlock an issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'github_add_assignees', description: 'Add assignees to issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, assignees: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number', 'assignees'] } },
        { name: 'github_remove_assignees', description: 'Remove assignees from issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, assignees: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number', 'assignees'] } },
        { name: 'github_add_labels', description: 'Add labels to issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number', 'labels'] } },
        { name: 'github_remove_label', description: 'Remove label from issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, name: { type: 'string' } }, required: ['owner', 'repo', 'issue_number', 'name'] } },
        { name: 'github_replace_labels', description: 'Replace all labels on issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'github_list_issue_comments', description: 'List issue comments', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, since: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'github_create_issue_comment', description: 'Create issue comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, body: { type: 'string' } }, required: ['owner', 'repo', 'issue_number', 'body'] } },
        { name: 'github_update_issue_comment', description: 'Update issue comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, comment_id: { type: 'number' }, body: { type: 'string' } }, required: ['owner', 'repo', 'comment_id', 'body'] } },
        { name: 'github_delete_issue_comment', description: 'Delete issue comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, comment_id: { type: 'number' } }, required: ['owner', 'repo', 'comment_id'] } },
        { name: 'github_list_issue_events', description: 'List issue events', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'github_list_issue_timeline', description: 'List issue timeline events', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'github_list_labels', description: 'List repository labels', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_create_label', description: 'Create a label', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' }, color: { type: 'string' }, description: { type: 'string' } }, required: ['owner', 'repo', 'name', 'color'] } },
        { name: 'github_delete_label', description: 'Delete a label', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' } }, required: ['owner', 'repo', 'name'] } },

        // PULL REQUESTS (25 tools)
        { name: 'github_list_pull_requests', description: 'List pull requests', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] }, head: { type: 'string' }, base: { type: 'string' }, sort: { type: 'string' }, direction: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_pull_request', description: 'Get pull request details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_create_pull_request', description: 'Create a pull request', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, head: { type: 'string' }, base: { type: 'string' }, body: { type: 'string' }, draft: { type: 'boolean' }, maintainer_can_modify: { type: 'boolean' } }, required: ['owner', 'repo', 'title', 'head', 'base'] } },
        { name: 'github_update_pull_request', description: 'Update a pull request', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, title: { type: 'string' }, body: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed'] }, base: { type: 'string' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_merge_pull_request', description: 'Merge a pull request', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, commit_title: { type: 'string' }, commit_message: { type: 'string' }, merge_method: { type: 'string', enum: ['merge', 'squash', 'rebase'] } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_get_pull_request_merge_status', description: 'Check if PR can be merged', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_list_pull_request_commits', description: 'List PR commits', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_list_pull_request_files', description: 'List PR files', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_list_pull_request_reviews', description: 'List PR reviews', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_get_pull_request_review', description: 'Get PR review', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, review_id: { type: 'number' } }, required: ['owner', 'repo', 'pull_number', 'review_id'] } },
        { name: 'github_create_pull_request_review', description: 'Create PR review', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, body: { type: 'string' }, event: { type: 'string', enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'] }, comments: { type: 'array' } }, required: ['owner', 'repo', 'pull_number', 'event'] } },
        { name: 'github_submit_pull_request_review', description: 'Submit PR review', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, review_id: { type: 'number' }, body: { type: 'string' }, event: { type: 'string', enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'] } }, required: ['owner', 'repo', 'pull_number', 'review_id', 'event'] } },
        { name: 'github_dismiss_pull_request_review', description: 'Dismiss PR review', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, review_id: { type: 'number' }, message: { type: 'string' } }, required: ['owner', 'repo', 'pull_number', 'review_id', 'message'] } },
        { name: 'github_list_pull_request_review_comments', description: 'List PR review comments', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_create_pull_request_review_comment', description: 'Create PR review comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, body: { type: 'string' }, commit_id: { type: 'string' }, path: { type: 'string' }, line: { type: 'number' } }, required: ['owner', 'repo', 'pull_number', 'body', 'commit_id', 'path'] } },
        { name: 'github_update_pull_request_review_comment', description: 'Update PR review comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, comment_id: { type: 'number' }, body: { type: 'string' } }, required: ['owner', 'repo', 'comment_id', 'body'] } },
        { name: 'github_delete_pull_request_review_comment', description: 'Delete PR review comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, comment_id: { type: 'number' } }, required: ['owner', 'repo', 'comment_id'] } },
        { name: 'github_request_pull_request_reviewers', description: 'Request PR reviewers', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, reviewers: { type: 'array', items: { type: 'string' } }, team_reviewers: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_remove_pull_request_reviewers', description: 'Remove PR reviewers', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, reviewers: { type: 'array', items: { type: 'string' } }, team_reviewers: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_update_pull_request_branch', description: 'Update PR branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, expected_head_sha: { type: 'string' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_list_requested_reviewers', description: 'List requested reviewers', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_check_pull_request_reviewability', description: 'Check if PR is reviewable', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_get_pull_request_diff', description: 'Get PR diff', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_get_pull_request_patch', description: 'Get PR patch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'github_convert_issue_to_pull_request', description: 'Convert issue to PR', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, head: { type: 'string' }, base: { type: 'string' } }, required: ['owner', 'repo', 'issue_number', 'head', 'base'] } },

        // GITHUB ACTIONS (20 tools)
        { name: 'github_list_workflows', description: 'List repository workflows', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_workflow', description: 'Get workflow details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' } }, required: ['owner', 'repo', 'workflow_id'] } },
        { name: 'github_disable_workflow', description: 'Disable a workflow', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' } }, required: ['owner', 'repo', 'workflow_id'] } },
        { name: 'github_enable_workflow', description: 'Enable a workflow', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' } }, required: ['owner', 'repo', 'workflow_id'] } },
        { name: 'github_create_workflow_dispatch', description: 'Trigger workflow dispatch event', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' }, ref: { type: 'string' }, inputs: { type: 'object' } }, required: ['owner', 'repo', 'workflow_id', 'ref'] } },
        { name: 'github_list_workflow_runs', description: 'List workflow runs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' }, actor: { type: 'string' }, branch: { type: 'string' }, event: { type: 'string' }, status: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_workflow_run', description: 'Get workflow run details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_cancel_workflow_run', description: 'Cancel a workflow run', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_rerun_workflow', description: 'Re-run a workflow', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_rerun_failed_jobs', description: 'Re-run failed jobs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_delete_workflow_run', description: 'Delete a workflow run', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_list_workflow_run_artifacts', description: 'List workflow run artifacts', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_download_workflow_run_logs', description: 'Download workflow run logs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_delete_workflow_run_logs', description: 'Delete workflow run logs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_list_workflow_run_jobs', description: 'List jobs for workflow run', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' }, filter: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'github_get_workflow_run_job', description: 'Get job details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, job_id: { type: 'number' } }, required: ['owner', 'repo', 'job_id'] } },
        { name: 'github_download_job_logs', description: 'Download job logs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, job_id: { type: 'number' } }, required: ['owner', 'repo', 'job_id'] } },
        { name: 'github_list_repo_secrets', description: 'List repository secrets', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_create_or_update_repo_secret', description: 'Create/update repository secret', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, secret_name: { type: 'string' }, encrypted_value: { type: 'string' } }, required: ['owner', 'repo', 'secret_name', 'encrypted_value'] } },
        { name: 'github_delete_repo_secret', description: 'Delete repository secret', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, secret_name: { type: 'string' } }, required: ['owner', 'repo', 'secret_name'] } },

        // RELEASES (12 tools)
        { name: 'github_list_releases', description: 'List releases', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_release', description: 'Get release details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, release_id: { type: 'number' } }, required: ['owner', 'repo', 'release_id'] } },
        { name: 'github_get_latest_release', description: 'Get latest release', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_release_by_tag', description: 'Get release by tag', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tag: { type: 'string' } }, required: ['owner', 'repo', 'tag'] } },
        { name: 'github_create_release', description: 'Create a release', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tag_name: { type: 'string' }, target_commitish: { type: 'string' }, name: { type: 'string' }, body: { type: 'string' }, draft: { type: 'boolean' }, prerelease: { type: 'boolean' } }, required: ['owner', 'repo', 'tag_name'] } },
        { name: 'github_update_release', description: 'Update a release', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, release_id: { type: 'number' }, tag_name: { type: 'string' }, name: { type: 'string' }, body: { type: 'string' }, draft: { type: 'boolean' }, prerelease: { type: 'boolean' } }, required: ['owner', 'repo', 'release_id'] } },
        { name: 'github_delete_release', description: 'Delete a release', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, release_id: { type: 'number' } }, required: ['owner', 'repo', 'release_id'] } },
        { name: 'github_list_release_assets', description: 'List release assets', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, release_id: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'release_id'] } },
        { name: 'github_get_release_asset', description: 'Get release asset', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, asset_id: { type: 'number' } }, required: ['owner', 'repo', 'asset_id'] } },
        { name: 'github_update_release_asset', description: 'Update release asset', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, asset_id: { type: 'number' }, name: { type: 'string' }, label: { type: 'string' } }, required: ['owner', 'repo', 'asset_id'] } },
        { name: 'github_delete_release_asset', description: 'Delete release asset', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, asset_id: { type: 'number' } }, required: ['owner', 'repo', 'asset_id'] } },
        { name: 'github_generate_release_notes', description: 'Generate release notes', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tag_name: { type: 'string' }, target_commitish: { type: 'string' }, previous_tag_name: { type: 'string' } }, required: ['owner', 'repo', 'tag_name'] } },

        // FILES & CONTENT (15 tools)
        { name: 'github_get_content', description: 'Get repository content', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'path'] } },
        { name: 'github_create_or_update_file', description: 'Create or update file', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, message: { type: 'string' }, content: { type: 'string' }, sha: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'path', 'message', 'content'] } },
        { name: 'github_delete_file', description: 'Delete a file', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, message: { type: 'string' }, sha: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'path', 'message', 'sha'] } },
        { name: 'github_get_archive', description: 'Download repository archive', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, archive_format: { type: 'string', enum: ['tarball', 'zipball'] }, ref: { type: 'string' } }, required: ['owner', 'repo', 'archive_format'] } },
        { name: 'github_list_repo_contributors', description: 'List repository contributors', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, anon: { type: 'boolean' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_clones', description: 'Get repository clones', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per: { type: 'string', enum: ['day', 'week'] } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_views', description: 'Get repository views', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per: { type: 'string', enum: ['day', 'week'] } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_top_paths', description: 'Get top referral paths', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_repo_top_referrers', description: 'Get top referrers', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_create_tree', description: 'Create a tree', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tree: { type: 'array' }, base_tree: { type: 'string' } }, required: ['owner', 'repo', 'tree'] } },
        { name: 'github_get_tree', description: 'Get a tree', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tree_sha: { type: 'string' }, recursive: { type: 'boolean' } }, required: ['owner', 'repo', 'tree_sha'] } },
        { name: 'github_get_blob', description: 'Get a blob', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, file_sha: { type: 'string' } }, required: ['owner', 'repo', 'file_sha'] } },
        { name: 'github_create_blob', description: 'Create a blob', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, content: { type: 'string' }, encoding: { type: 'string' } }, required: ['owner', 'repo', 'content'] } },
        { name: 'github_create_commit', description: 'Create a commit', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, message: { type: 'string' }, tree: { type: 'string' }, parents: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'message', 'tree'] } },
        { name: 'github_get_ref', description: 'Get a reference', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'ref'] } },

        // COLLABORATORS & PERMISSIONS (10 tools)
        { name: 'github_list_collaborators', description: 'List repository collaborators', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, affiliation: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_check_collaborator', description: 'Check if user is collaborator', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, username: { type: 'string' } }, required: ['owner', 'repo', 'username'] } },
        { name: 'github_add_collaborator', description: 'Add repository collaborator', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, username: { type: 'string' }, permission: { type: 'string', enum: ['pull', 'push', 'admin', 'maintain', 'triage'] } }, required: ['owner', 'repo', 'username'] } },
        { name: 'github_remove_collaborator', description: 'Remove repository collaborator', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, username: { type: 'string' } }, required: ['owner', 'repo', 'username'] } },
        { name: 'github_get_collaborator_permission', description: 'Get collaborator permission level', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, username: { type: 'string' } }, required: ['owner', 'repo', 'username'] } },
        { name: 'github_list_invitations', description: 'List repository invitations', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_update_invitation', description: 'Update repository invitation', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, invitation_id: { type: 'number' }, permissions: { type: 'string' } }, required: ['owner', 'repo', 'invitation_id'] } },
        { name: 'github_delete_invitation', description: 'Delete repository invitation', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, invitation_id: { type: 'number' } }, required: ['owner', 'repo', 'invitation_id'] } },
        { name: 'github_list_deploy_keys', description: 'List deploy keys', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_create_deploy_key', description: 'Create deploy key', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, key: { type: 'string' }, read_only: { type: 'boolean' } }, required: ['owner', 'repo', 'title', 'key'] } },

        // WEBHOOKS (8 tools)
        { name: 'github_list_webhooks', description: 'List repository webhooks', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_webhook', description: 'Get webhook details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'github_create_webhook', description: 'Create a webhook', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' }, config: { type: 'object' }, events: { type: 'array', items: { type: 'string' } }, active: { type: 'boolean' } }, required: ['owner', 'repo', 'config'] } },
        { name: 'github_update_webhook', description: 'Update a webhook', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' }, config: { type: 'object' }, events: { type: 'array', items: { type: 'string' } }, active: { type: 'boolean' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'github_delete_webhook', description: 'Delete a webhook', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'github_ping_webhook', description: 'Ping a webhook', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'github_test_webhook', description: 'Test webhook push', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'github_list_webhook_deliveries', description: 'List webhook deliveries', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' }, per_page: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },

        // ORGANIZATIONS & TEAMS (12 tools)
        { name: 'github_list_user_orgs', description: 'List user organizations', inputSchema: { type: 'object', properties: { username: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } } } },
        { name: 'github_get_org', description: 'Get organization details', inputSchema: { type: 'object', properties: { org: { type: 'string' } }, required: ['org'] } },
        { name: 'github_update_org', description: 'Update organization', inputSchema: { type: 'object', properties: { org: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, email: { type: 'string' }, location: { type: 'string' } }, required: ['org'] } },
        { name: 'github_list_org_members', description: 'List organization members', inputSchema: { type: 'object', properties: { org: { type: 'string' }, filter: { type: 'string' }, role: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['org'] } },
        { name: 'github_check_org_membership', description: 'Check organization membership', inputSchema: { type: 'object', properties: { org: { type: 'string' }, username: { type: 'string' } }, required: ['org', 'username'] } },
        { name: 'github_remove_org_member', description: 'Remove organization member', inputSchema: { type: 'object', properties: { org: { type: 'string' }, username: { type: 'string' } }, required: ['org', 'username'] } },
        { name: 'github_list_org_teams', description: 'List organization teams', inputSchema: { type: 'object', properties: { org: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['org'] } },
        { name: 'github_get_team', description: 'Get team details', inputSchema: { type: 'object', properties: { org: { type: 'string' }, team_slug: { type: 'string' } }, required: ['org', 'team_slug'] } },
        { name: 'github_create_team', description: 'Create a team', inputSchema: { type: 'object', properties: { org: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, privacy: { type: 'string', enum: ['secret', 'closed'] } }, required: ['org', 'name'] } },
        { name: 'github_update_team', description: 'Update a team', inputSchema: { type: 'object', properties: { org: { type: 'string' }, team_slug: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, privacy: { type: 'string' } }, required: ['org', 'team_slug'] } },
        { name: 'github_delete_team', description: 'Delete a team', inputSchema: { type: 'object', properties: { org: { type: 'string' }, team_slug: { type: 'string' } }, required: ['org', 'team_slug'] } },
        { name: 'github_list_team_members', description: 'List team members', inputSchema: { type: 'object', properties: { org: { type: 'string' }, team_slug: { type: 'string' }, role: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['org', 'team_slug'] } },

        // SEARCH (6 tools)
        { name: 'github_search_repositories', description: 'Search repositories', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'github_search_code', description: 'Search code', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'github_search_issues', description: 'Search issues and pull requests', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'github_search_users', description: 'Search users', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'github_search_commits', description: 'Search commits', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'github_search_topics', description: 'Search topics', inputSchema: { type: 'object', properties: { q: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },

        // USERS (8 tools)
        { name: 'github_get_authenticated_user', description: 'Get authenticated user', inputSchema: { type: 'object', properties: {} } },
        { name: 'github_get_user', description: 'Get user details', inputSchema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] } },
        { name: 'github_update_authenticated_user', description: 'Update authenticated user', inputSchema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, blog: { type: 'string' }, company: { type: 'string' }, location: { type: 'string' }, bio: { type: 'string' } } } },
        { name: 'github_list_user_repos', description: 'List user repositories', inputSchema: { type: 'object', properties: { username: { type: 'string' }, type: { type: 'string' }, sort: { type: 'string' }, direction: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['username'] } },
        { name: 'github_list_user_followers', description: 'List user followers', inputSchema: { type: 'object', properties: { username: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['username'] } },
        { name: 'github_list_user_following', description: 'List users followed by user', inputSchema: { type: 'object', properties: { username: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['username'] } },
        { name: 'github_check_following', description: 'Check if user follows another user', inputSchema: { type: 'object', properties: { username: { type: 'string' }, target_user: { type: 'string' } }, required: ['username', 'target_user'] } },
        { name: 'github_list_user_gists', description: 'List user gists', inputSchema: { type: 'object', properties: { username: { type: 'string' }, since: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['username'] } },

        // GISTS (10 tools)
        { name: 'github_list_gists', description: 'List public gists', inputSchema: { type: 'object', properties: { since: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } } } },
        { name: 'github_get_gist', description: 'Get gist details', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'github_create_gist', description: 'Create a gist', inputSchema: { type: 'object', properties: { description: { type: 'string' }, files: { type: 'object' }, public: { type: 'boolean' } }, required: ['files'] } },
        { name: 'github_update_gist', description: 'Update a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' }, description: { type: 'string' }, files: { type: 'object' } }, required: ['gist_id'] } },
        { name: 'github_delete_gist', description: 'Delete a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'github_star_gist', description: 'Star a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'github_unstar_gist', description: 'Unstar a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'github_check_gist_star', description: 'Check if gist is starred', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'github_fork_gist', description: 'Fork a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'github_list_gist_commits', description: 'List gist commits', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['gist_id'] } },

        // MILESTONES & PROJECTS (8 tools)
        { name: 'github_list_milestones', description: 'List milestones', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] }, sort: { type: 'string' }, direction: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_milestone', description: 'Get milestone details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, milestone_number: { type: 'number' } }, required: ['owner', 'repo', 'milestone_number'] } },
        { name: 'github_create_milestone', description: 'Create a milestone', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, state: { type: 'string' }, description: { type: 'string' }, due_on: { type: 'string' } }, required: ['owner', 'repo', 'title'] } },
        { name: 'github_update_milestone', description: 'Update a milestone', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, milestone_number: { type: 'number' }, title: { type: 'string' }, state: { type: 'string' }, description: { type: 'string' }, due_on: { type: 'string' } }, required: ['owner', 'repo', 'milestone_number'] } },
        { name: 'github_delete_milestone', description: 'Delete a milestone', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, milestone_number: { type: 'number' } }, required: ['owner', 'repo', 'milestone_number'] } },
        { name: 'github_list_projects', description: 'List repository projects', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_project', description: 'Get project details', inputSchema: { type: 'object', properties: { project_id: { type: 'number' } }, required: ['project_id'] } },
        { name: 'github_create_project', description: 'Create a project', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'name'] } },



        // PACKAGES (8 tools)
        { name: 'github_list_packages', description: 'List packages for organization', inputSchema: { type: 'object', properties: { org: { type: 'string' }, package_type: { type: 'string', enum: ['npm', 'maven', 'rubygems', 'docker', 'nuget', 'container'] } }, required: ['org', 'package_type'] } },
        { name: 'github_get_package', description: 'Get package details', inputSchema: { type: 'object', properties: { org: { type: 'string' }, package_type: { type: 'string' }, package_name: { type: 'string' } }, required: ['org', 'package_type', 'package_name'] } },
        { name: 'github_delete_package', description: 'Delete package', inputSchema: { type: 'object', properties: { org: { type: 'string' }, package_type: { type: 'string' }, package_name: { type: 'string' } }, required: ['org', 'package_type', 'package_name'] } },
        { name: 'github_restore_package', description: 'Restore deleted package', inputSchema: { type: 'object', properties: { org: { type: 'string' }, package_type: { type: 'string' }, package_name: { type: 'string' } }, required: ['org', 'package_type', 'package_name'] } },
        { name: 'github_list_package_versions', description: 'List package versions', inputSchema: { type: 'object', properties: { org: { type: 'string' }, package_type: { type: 'string' }, package_name: { type: 'string' } }, required: ['org', 'package_type', 'package_name'] } },
        { name: 'github_get_package_version', description: 'Get package version', inputSchema: { type: 'object', properties: { org: { type: 'string' }, package_type: { type: 'string' }, package_name: { type: 'string' }, version_id: { type: 'number' } }, required: ['org', 'package_type', 'package_name', 'version_id'] } },
        { name: 'github_delete_package_version', description: 'Delete package version', inputSchema: { type: 'object', properties: { org: { type: 'string' }, package_type: { type: 'string' }, package_name: { type: 'string' }, version_id: { type: 'number' } }, required: ['org', 'package_type', 'package_name', 'version_id'] } },
        { name: 'github_restore_package_version', description: 'Restore package version', inputSchema: { type: 'object', properties: { org: { type: 'string' }, package_type: { type: 'string' }, package_name: { type: 'string' }, version_id: { type: 'number' } }, required: ['org', 'package_type', 'package_name', 'version_id'] } },

        // PROJECTS V2 (8 tools)
        { name: 'github_list_org_projects_v2', description: 'List organization projects v2', inputSchema: { type: 'object', properties: { org: { type: 'string' } }, required: ['org'] } },
        { name: 'github_get_project_v2', description: 'Get project v2 details', inputSchema: { type: 'object', properties: { project_id: { type: 'string' } }, required: ['project_id'] } },
        { name: 'github_create_project_v2', description: 'Create project v2', inputSchema: { type: 'object', properties: { org: { type: 'string' }, title: { type: 'string' } }, required: ['org', 'title'] } },
        { name: 'github_update_project_v2', description: 'Update project v2', inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' } }, required: ['project_id'] } },
        { name: 'github_delete_project_v2', description: 'Delete project v2', inputSchema: { type: 'object', properties: { project_id: { type: 'string' } }, required: ['project_id'] } },
        { name: 'github_list_project_items', description: 'List project items', inputSchema: { type: 'object', properties: { project_id: { type: 'string' } }, required: ['project_id'] } },
        { name: 'github_add_project_item', description: 'Add item to project', inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, content_id: { type: 'string' } }, required: ['project_id', 'content_id'] } },
        { name: 'github_remove_project_item', description: 'Remove item from project', inputSchema: { type: 'object', properties: { project_id: { type: 'string' }, item_id: { type: 'string' } }, required: ['project_id', 'item_id'] } },

        // DISCUSSIONS (8 tools)
        { name: 'github_list_discussions', description: 'List repository discussions', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, category: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_get_discussion', description: 'Get discussion details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, discussion_number: { type: 'number' } }, required: ['owner', 'repo', 'discussion_number'] } },
        { name: 'github_create_discussion', description: 'Create discussion', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, category_id: { type: 'string' } }, required: ['owner', 'repo', 'title', 'body', 'category_id'] } },
        { name: 'github_update_discussion', description: 'Update discussion', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, discussion_number: { type: 'number' }, title: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'discussion_number'] } },
        { name: 'github_delete_discussion', description: 'Delete discussion', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, discussion_number: { type: 'number' } }, required: ['owner', 'repo', 'discussion_number'] } },
        { name: 'github_list_discussion_comments', description: 'List discussion comments', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, discussion_number: { type: 'number' } }, required: ['owner', 'repo', 'discussion_number'] } },
        { name: 'github_create_discussion_comment', description: 'Create discussion comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, discussion_number: { type: 'number' }, body: { type: 'string' } }, required: ['owner', 'repo', 'discussion_number', 'body'] } },
        { name: 'github_list_discussion_categories', description: 'List discussion categories', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },

        // CODESPACES (7 tools)
        { name: 'github_list_codespaces', description: 'List user codespaces', inputSchema: { type: 'object', properties: { per_page: { type: 'number' } } } },
        { name: 'github_get_codespace', description: 'Get codespace details', inputSchema: { type: 'object', properties: { codespace_name: { type: 'string' } }, required: ['codespace_name'] } },
        { name: 'github_create_codespace', description: 'Create codespace', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' }, machine: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'github_start_codespace', description: 'Start codespace', inputSchema: { type: 'object', properties: { codespace_name: { type: 'string' } }, required: ['codespace_name'] } },
        { name: 'github_stop_codespace', description: 'Stop codespace', inputSchema: { type: 'object', properties: { codespace_name: { type: 'string' } }, required: ['codespace_name'] } },
        { name: 'github_delete_codespace', description: 'Delete codespace', inputSchema: { type: 'object', properties: { codespace_name: { type: 'string' } }, required: ['codespace_name'] } },
        { name: 'github_list_repo_codespaces', description: 'List repository codespaces', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },

        // COPILOT (5 tools)
        { name: 'github_get_copilot_org_settings', description: 'Get Copilot organization settings', inputSchema: { type: 'object', properties: { org: { type: 'string' } }, required: ['org'] } },
        { name: 'github_list_copilot_seats', description: 'List Copilot seat assignments', inputSchema: { type: 'object', properties: { org: { type: 'string' } }, required: ['org'] } },
        { name: 'github_add_copilot_seats', description: 'Add Copilot seats', inputSchema: { type: 'object', properties: { org: { type: 'string' }, selected_usernames: { type: 'array', items: { type: 'string' } } }, required: ['org', 'selected_usernames'] } },
        { name: 'github_remove_copilot_seats', description: 'Remove Copilot seats', inputSchema: { type: 'object', properties: { org: { type: 'string' }, selected_usernames: { type: 'array', items: { type: 'string' } } }, required: ['org', 'selected_usernames'] } },
        { name: 'github_get_copilot_usage', description: 'Get Copilot usage metrics', inputSchema: { type: 'object', properties: { org: { type: 'string' } }, required: ['org'] } },

        // ADVANCED SECURITY (5 tools)
        { name: 'github_list_code_scanning_alerts', description: 'List code scanning alerts', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'dismissed', 'fixed'] } }, required: ['owner', 'repo'] } },
        { name: 'github_get_code_scanning_alert', description: 'Get code scanning alert', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, alert_number: { type: 'number' } }, required: ['owner', 'repo', 'alert_number'] } },
        { name: 'github_update_code_scanning_alert', description: 'Update code scanning alert', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, alert_number: { type: 'number' }, state: { type: 'string', enum: ['dismissed', 'open'] } }, required: ['owner', 'repo', 'alert_number', 'state'] } },
        { name: 'github_list_secret_scanning_alerts', description: 'List secret scanning alerts', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'resolved'] } }, required: ['owner', 'repo'] } },
        { name: 'github_update_secret_scanning_alert', description: 'Update secret scanning alert', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, alert_number: { type: 'number' }, state: { type: 'string', enum: ['open', 'resolved'] } }, required: ['owner', 'repo', 'alert_number', 'state'] } },
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const args = request.params.arguments as any;
      try {
        switch (request.params.name) {
          // REPOSITORY MANAGEMENT
          case 'github_list_repos': return await this.listRepos(args);
          case 'github_get_repo': return await this.getRepo(args);
          case 'github_create_repo': return await this.createRepo(args);
          case 'github_update_repo': return await this.updateRepo(args);
          case 'github_delete_repo': return await this.deleteRepo(args);
          case 'github_list_repo_topics': return await this.listRepoTopics(args);
          case 'github_replace_repo_topics': return await this.replaceRepoTopics(args);
          case 'github_list_repo_languages': return await this.listRepoLanguages(args);
          case 'github_list_repo_tags': return await this.listRepoTags(args);
          case 'github_list_repo_teams': return await this.listRepoTeams(args);
          case 'github_transfer_repo': return await this.transferRepo(args);
          case 'github_enable_automated_security_fixes': return await this.enableAutomatedSecurityFixes(args);
          case 'github_disable_automated_security_fixes': return await this.disableAutomatedSecurityFixes(args);
          case 'github_enable_vulnerability_alerts': return await this.enableVulnerabilityAlerts(args);
          case 'github_disable_vulnerability_alerts': return await this.disableVulnerabilityAlerts(args);
          case 'github_get_repo_readme': return await this.getRepoReadme(args);
          case 'github_get_repo_license': return await this.getRepoLicense(args);
          case 'github_get_repo_community_profile': return await this.getRepoCommunityProfile(args);
          case 'github_get_repo_stats_contributors': return await this.getRepoStatsContributors(args);
          case 'github_get_repo_stats_commit_activity': return await this.getRepoStatsCommitActivity(args);

          // BRANCHES
          case 'github_list_branches': return await this.listBranches(args);
          case 'github_get_branch': return await this.getBranch(args);
          case 'github_create_branch': return await this.createBranch(args);
          case 'github_delete_branch': return await this.deleteBranch(args);
          case 'github_merge_branch': return await this.mergeBranch(args);
          case 'github_get_branch_protection': return await this.getBranchProtection(args);
          case 'github_update_branch_protection': return await this.updateBranchProtection(args);
          case 'github_delete_branch_protection': return await this.deleteBranchProtection(args);
          case 'github_get_required_status_checks': return await this.getRequiredStatusChecks(args);
          case 'github_update_required_status_checks': return await this.updateRequiredStatusChecks(args);
          case 'github_get_admin_enforcement': return await this.getAdminEnforcement(args);
          case 'github_set_admin_enforcement': return await this.setAdminEnforcement(args);
          case 'github_get_pull_request_review_enforcement': return await this.getPullRequestReviewEnforcement(args);
          case 'github_update_pull_request_review_enforcement': return await this.updatePullRequestReviewEnforcement(args);
          case 'github_rename_branch': return await this.renameBranch(args);

          // COMMITS
          case 'github_list_commits': return await this.listCommits(args);
          case 'github_get_commit': return await this.getCommit(args);
          case 'github_compare_commits': return await this.compareCommits(args);
          case 'github_list_commit_comments': return await this.listCommitComments(args);
          case 'github_create_commit_comment': return await this.createCommitComment(args);
          case 'github_get_commit_status': return await this.getCommitStatus(args);
          case 'github_list_commit_statuses': return await this.listCommitStatuses(args);
          case 'github_create_commit_status': return await this.createCommitStatus(args);
          case 'github_list_pull_requests_associated_with_commit': return await this.listPullRequestsAssociatedWithCommit(args);
          case 'github_get_commit_signature_verification': return await this.getCommitSignatureVerification(args);

          // ISSUES
          case 'github_list_issues': return await this.listIssues(args);
          case 'github_get_issue': return await this.getIssue(args);
          case 'github_create_issue': return await this.createIssue(args);
          case 'github_update_issue': return await this.updateIssue(args);
          case 'github_lock_issue': return await this.lockIssue(args);
          case 'github_unlock_issue': return await this.unlockIssue(args);
          case 'github_add_assignees': return await this.addAssignees(args);
          case 'github_remove_assignees': return await this.removeAssignees(args);
          case 'github_add_labels': return await this.addLabels(args);
          case 'github_remove_label': return await this.removeLabel(args);
          case 'github_replace_labels': return await this.replaceLabels(args);
          case 'github_list_issue_comments': return await this.listIssueComments(args);
          case 'github_create_issue_comment': return await this.createIssueComment(args);
          case 'github_update_issue_comment': return await this.updateIssueComment(args);
          case 'github_delete_issue_comment': return await this.deleteIssueComment(args);
          case 'github_list_issue_events': return await this.listIssueEvents(args);
          case 'github_list_issue_timeline': return await this.listIssueTimeline(args);
          case 'github_list_labels': return await this.listLabels(args);
          case 'github_create_label': return await this.createLabel(args);
          case 'github_delete_label': return await this.deleteLabel(args);

          // PULL REQUESTS
          case 'github_list_pull_requests': return await this.listPullRequests(args);
          case 'github_get_pull_request': return await this.getPullRequest(args);
          case 'github_create_pull_request': return await this.createPullRequest(args);
          case 'github_update_pull_request': return await this.updatePullRequest(args);
          case 'github_merge_pull_request': return await this.mergePullRequest(args);
          case 'github_get_pull_request_merge_status': return await this.getPullRequestMergeStatus(args);
          case 'github_list_pull_request_commits': return await this.listPullRequestCommits(args);
          case 'github_list_pull_request_files': return await this.listPullRequestFiles(args);
          case 'github_list_pull_request_reviews': return await this.listPullRequestReviews(args);
          case 'github_get_pull_request_review': return await this.getPullRequestReview(args);
          case 'github_create_pull_request_review': return await this.createPullRequestReview(args);
          case 'github_submit_pull_request_review': return await this.submitPullRequestReview(args);
          case 'github_dismiss_pull_request_review': return await this.dismissPullRequestReview(args);
          case 'github_list_pull_request_review_comments': return await this.listPullRequestReviewComments(args);
          case 'github_create_pull_request_review_comment': return await this.createPullRequestReviewComment(args);
          case 'github_update_pull_request_review_comment': return await this.updatePullRequestReviewComment(args);
          case 'github_delete_pull_request_review_comment': return await this.deletePullRequestReviewComment(args);
          case 'github_request_pull_request_reviewers': return await this.requestPullRequestReviewers(args);
          case 'github_remove_pull_request_reviewers': return await this.removePullRequestReviewers(args);
          case 'github_update_pull_request_branch': return await this.updatePullRequestBranch(args);
          case 'github_list_requested_reviewers': return await this.listRequestedReviewers(args);
          case 'github_check_pull_request_reviewability': return await this.checkPullRequestReviewability(args);
          case 'github_get_pull_request_diff': return await this.getPullRequestDiff(args);
          case 'github_get_pull_request_patch': return await this.getPullRequestPatch(args);
          case 'github_convert_issue_to_pull_request': return await this.convertIssueToPullRequest(args);

          // GITHUB ACTIONS
          case 'github_list_workflows': return await this.listWorkflows(args);
          case 'github_get_workflow': return await this.getWorkflow(args);
          case 'github_disable_workflow': return await this.disableWorkflow(args);
          case 'github_enable_workflow': return await this.enableWorkflow(args);
          case 'github_create_workflow_dispatch': return await this.createWorkflowDispatch(args);
          case 'github_list_workflow_runs': return await this.listWorkflowRuns(args);
          case 'github_get_workflow_run': return await this.getWorkflowRun(args);
          case 'github_cancel_workflow_run': return await this.cancelWorkflowRun(args);
          case 'github_rerun_workflow': return await this.rerunWorkflow(args);
          case 'github_rerun_failed_jobs': return await this.rerunFailedJobs(args);
          case 'github_delete_workflow_run': return await this.deleteWorkflowRun(args);
          case 'github_list_workflow_run_artifacts': return await this.listWorkflowRunArtifacts(args);
          case 'github_download_workflow_run_logs': return await this.downloadWorkflowRunLogs(args);
          case 'github_delete_workflow_run_logs': return await this.deleteWorkflowRunLogs(args);
          case 'github_list_workflow_run_jobs': return await this.listWorkflowRunJobs(args);
          case 'github_get_workflow_run_job': return await this.getWorkflowRunJob(args);
          case 'github_download_job_logs': return await this.downloadJobLogs(args);
          case 'github_list_repo_secrets': return await this.listRepoSecrets(args);
          case 'github_create_or_update_repo_secret': return await this.createOrUpdateRepoSecret(args);
          case 'github_delete_repo_secret': return await this.deleteRepoSecret(args);

          // RELEASES
          case 'github_list_releases': return await this.listReleases(args);
          case 'github_get_release': return await this.getRelease(args);
          case 'github_get_latest_release': return await this.getLatestRelease(args);
          case 'github_get_release_by_tag': return await this.getReleaseByTag(args);
          case 'github_create_release': return await this.createRelease(args);
          case 'github_update_release': return await this.updateRelease(args);
          case 'github_delete_release': return await this.deleteRelease(args);
          case 'github_list_release_assets': return await this.listReleaseAssets(args);
          case 'github_get_release_asset': return await this.getReleaseAsset(args);
          case 'github_update_release_asset': return await this.updateReleaseAsset(args);
          case 'github_delete_release_asset': return await this.deleteReleaseAsset(args);
          case 'github_generate_release_notes': return await this.generateReleaseNotes(args);

          // FILES & CONTENT
          case 'github_get_content': return await this.getContent(args);
          case 'github_create_or_update_file': return await this.createOrUpdateFile(args);
          case 'github_delete_file': return await this.deleteFile(args);
          case 'github_get_archive': return await this.getArchive(args);
          case 'github_list_repo_contributors': return await this.listRepoContributors(args);
          case 'github_get_repo_clones': return await this.getRepoClones(args);
          case 'github_get_repo_views': return await this.getRepoViews(args);
          case 'github_get_repo_top_paths': return await this.getRepoTopPaths(args);
          case 'github_get_repo_top_referrers': return await this.getRepoTopReferrers(args);
          case 'github_create_tree': return await this.createTree(args);
          case 'github_get_tree': return await this.getTree(args);
          case 'github_get_blob': return await this.getBlob(args);
          case 'github_create_blob': return await this.createBlob(args);
          case 'github_create_commit': return await this.createCommit(args);
          case 'github_get_ref': return await this.getRef(args);

          // COLLABORATORS & PERMISSIONS
          case 'github_list_collaborators': return await this.listCollaborators(args);
          case 'github_check_collaborator': return await this.checkCollaborator(args);
          case 'github_add_collaborator': return await this.addCollaborator(args);
          case 'github_remove_collaborator': return await this.removeCollaborator(args);
          case 'github_get_collaborator_permission': return await this.getCollaboratorPermission(args);
          case 'github_list_invitations': return await this.listInvitations(args);
          case 'github_update_invitation': return await this.updateInvitation(args);
          case 'github_delete_invitation': return await this.deleteInvitation(args);
          case 'github_list_deploy_keys': return await this.listDeployKeys(args);
          case 'github_create_deploy_key': return await this.createDeployKey(args);

          // WEBHOOKS
          case 'github_list_webhooks': return await this.listWebhooks(args);
          case 'github_get_webhook': return await this.getWebhook(args);
          case 'github_create_webhook': return await this.createWebhook(args);
          case 'github_update_webhook': return await this.updateWebhook(args);
          case 'github_delete_webhook': return await this.deleteWebhook(args);
          case 'github_ping_webhook': return await this.pingWebhook(args);
          case 'github_test_webhook': return await this.testWebhook(args);
          case 'github_list_webhook_deliveries': return await this.listWebhookDeliveries(args);

          // ORGANIZATIONS & TEAMS
          case 'github_list_user_orgs': return await this.listUserOrgs(args);
          case 'github_get_org': return await this.getOrg(args);
          case 'github_update_org': return await this.updateOrg(args);
          case 'github_list_org_members': return await this.listOrgMembers(args);
          case 'github_check_org_membership': return await this.checkOrgMembership(args);
          case 'github_remove_org_member': return await this.removeOrgMember(args);
          case 'github_list_org_teams': return await this.listOrgTeams(args);
          case 'github_get_team': return await this.getTeam(args);
          case 'github_create_team': return await this.createTeam(args);
          case 'github_update_team': return await this.updateTeam(args);
          case 'github_delete_team': return await this.deleteTeam(args);
          case 'github_list_team_members': return await this.listTeamMembers(args);

          // SEARCH
          case 'github_search_repositories': return await this.searchRepositories(args);
          case 'github_search_code': return await this.searchCode(args);
          case 'github_search_issues': return await this.searchIssues(args);
          case 'github_search_users': return await this.searchUsers(args);
          case 'github_search_commits': return await this.searchCommits(args);
          case 'github_search_topics': return await this.searchTopics(args);

          // USERS
          case 'github_get_authenticated_user': return await this.getAuthenticatedUser(args);
          case 'github_get_user': return await this.getUser(args);
          case 'github_update_authenticated_user': return await this.updateAuthenticatedUser(args);
          case 'github_list_user_repos': return await this.listUserRepos(args);
          case 'github_list_user_followers': return await this.listUserFollowers(args);
          case 'github_list_user_following': return await this.listUserFollowing(args);
          case 'github_check_following': return await this.checkFollowing(args);
          case 'github_list_user_gists': return await this.listUserGists(args);

          // GISTS
          case 'github_list_gists': return await this.listGists(args);
          case 'github_get_gist': return await this.getGist(args);
          case 'github_create_gist': return await this.createGist(args);
          case 'github_update_gist': return await this.updateGist(args);
          case 'github_delete_gist': return await this.deleteGist(args);
          case 'github_star_gist': return await this.starGist(args);
          case 'github_unstar_gist': return await this.unstarGist(args);
          case 'github_check_gist_star': return await this.checkGistStar(args);
          case 'github_fork_gist': return await this.forkGist(args);
          case 'github_list_gist_commits': return await this.listGistCommits(args);

          // MILESTONES & PROJECTS
          case 'github_list_milestones': return await this.listMilestones(args);
          case 'github_get_milestone': return await this.getMilestone(args);
          case 'github_create_milestone': return await this.createMilestone(args);
          case 'github_update_milestone': return await this.updateMilestone(args);
          case 'github_delete_milestone': return await this.deleteMilestone(args);
          case 'list_projects': return await this.listProjects(args);
          case 'get_project': return await this.getProject(args);
          case 'create_project': return await this.createProject(args);

          // Advanced Actions
          case 'github_list_workflow_runs': return await this.listWorkflowRuns(args);
          case 'github_get_workflow_run': return await this.getWorkflowRun(args);
          case 'github_cancel_workflow_run': return await this.cancelWorkflowRun(args);
          case 'github_rerun_workflow': return await this.rerunWorkflow(args);
          case 'github_download_workflow_logs': return await this.downloadWorkflowRunLogs(args);
          case 'github_list_workflow_jobs': return await this.listWorkflowRunJobs(args);
          case 'github_get_workflow_job': return await this.getWorkflowRunJob(args);
          case 'github_download_job_logs': return await this.downloadJobLogs(args);
          case 'github_list_repo_secrets': return await this.listRepoSecrets(args);
          case 'github_create_repo_secret': return await this.createRepoSecretHandler(args);

          // Packages
          case 'github_list_packages': return await this.listPackages(args);
          case 'github_get_package': return await this.getPackage(args);
          case 'github_delete_package': return await this.deletePackage(args);
          case 'github_restore_package': return await this.restorePackage(args);
          case 'github_list_package_versions': return await this.listPackageVersions(args);
          case 'github_get_package_version': return await this.getPackageVersion(args);
          case 'github_delete_package_version': return await this.deletePackageVersion(args);
          case 'github_restore_package_version': return await this.restorePackageVersion(args);

          // Projects v2
          case 'github_list_org_projects_v2': return await this.listOrgProjectsV2(args);
          case 'github_get_project_v2': return await this.getProjectV2(args);
          case 'github_create_project_v2': return await this.createProjectV2(args);
          case 'github_update_project_v2': return await this.updateProjectV2(args);
          case 'github_delete_project_v2': return await this.deleteProjectV2(args);
          case 'github_list_project_items': return await this.listProjectItems(args);
          case 'github_add_project_item': return await this.addProjectItem(args);
          case 'github_remove_project_item': return await this.removeProjectItem(args);

          // Discussions
          case 'github_list_discussions': return await this.listDiscussions(args);
          case 'github_get_discussion': return await this.getDiscussion(args);
          case 'github_create_discussion': return await this.createDiscussion(args);
          case 'github_update_discussion': return await this.updateDiscussion(args);
          case 'github_delete_discussion': return await this.deleteDiscussion(args);
          case 'github_list_discussion_comments': return await this.listDiscussionComments(args);
          case 'github_create_discussion_comment': return await this.createDiscussionComment(args);
          case 'github_list_discussion_categories': return await this.listDiscussionCategories(args);

          // Codespaces
          case 'github_list_codespaces': return await this.listCodespaces(args);
          case 'github_get_codespace': return await this.getCodespace(args);
          case 'github_create_codespace': return await this.createCodespace(args);
          case 'github_start_codespace': return await this.startCodespace(args);
          case 'github_stop_codespace': return await this.stopCodespace(args);
          case 'github_delete_codespace': return await this.deleteCodespace(args);
          case 'github_list_repo_codespaces': return await this.listRepoCodespaces(args);

          // Copilot
          case 'github_get_copilot_org_settings': return await this.getCopilotOrgSettings(args);
          case 'github_list_copilot_seats': return await this.listCopilotSeats(args);
          case 'github_add_copilot_seats': return await this.addCopilotSeats(args);
          case 'github_remove_copilot_seats': return await this.removeCopilotSeats(args);
          case 'github_get_copilot_usage': return await this.getCopilotUsage(args);

          // Advanced Security
          case 'github_list_code_scanning_alerts': return await this.listCodeScanningAlerts(args);
          case 'github_get_code_scanning_alert': return await this.getCodeScanningAlert(args);
          case 'github_update_code_scanning_alert': return await this.updateCodeScanningAlert(args);
          case 'github_list_secret_scanning_alerts': return await this.listSecretScanningAlerts(args);
          case 'github_update_secret_scanning_alert': return await this.updateSecretScanningAlert(args);

          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error: any) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message || 'Unknown error occurred'}`
          }]
        };
      }
    });
  }

  // REPOSITORY MANAGEMENT METHODS
  private async listRepos(args: any) {
    const params: any = {};
    if (args.type) params.type = args.type;
    if (args.sort) params.sort = args.sort;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const path = args.org ? `/orgs/${args.org}/repos` : '/user/repos';
    const response = await this.client.get(path, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepo(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createRepo(args: any) {
    const body: any = { name: args.name };
    if (args.description) body.description = args.description;
    if (args.private !== undefined) body.private = args.private;
    if (args.auto_init !== undefined) body.auto_init = args.auto_init;
    if (args.gitignore_template) body.gitignore_template = args.gitignore_template;
    if (args.license_template) body.license_template = args.license_template;
    const path = args.org ? `/orgs/${args.org}/repos` : '/user/repos';
    const response = await this.client.post(path, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateRepo(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.description !== undefined) body.description = args.description;
    if (args.private !== undefined) body.private = args.private;
    if (args.has_issues !== undefined) body.has_issues = args.has_issues;
    if (args.has_projects !== undefined) body.has_projects = args.has_projects;
    if (args.has_wiki !== undefined) body.has_wiki = args.has_wiki;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteRepo(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}`);
    return { content: [{ type: 'text', text: 'Repository deleted successfully' }] };
  }

  private async listRepoTopics(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/topics`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async replaceRepoTopics(args: any) {
    const response = await this.client.put(`/repos/${args.owner}/${args.repo}/topics`, { names: args.names });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listRepoLanguages(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/languages`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listRepoTags(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/tags`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listRepoTeams(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/teams`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async transferRepo(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/transfer`, { new_owner: args.new_owner });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async enableAutomatedSecurityFixes(args: any) {
    await this.client.put(`/repos/${args.owner}/${args.repo}/automated-security-fixes`);
    return { content: [{ type: 'text', text: 'Automated security fixes enabled' }] };
  }

  private async disableAutomatedSecurityFixes(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/automated-security-fixes`);
    return { content: [{ type: 'text', text: 'Automated security fixes disabled' }] };
  }

  private async enableVulnerabilityAlerts(args: any) {
    await this.client.put(`/repos/${args.owner}/${args.repo}/vulnerability-alerts`);
    return { content: [{ type: 'text', text: 'Vulnerability alerts enabled' }] };
  }

  private async disableVulnerabilityAlerts(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/vulnerability-alerts`);
    return { content: [{ type: 'text', text: 'Vulnerability alerts disabled' }] };
  }

  private async getRepoReadme(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/readme`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepoLicense(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/license`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepoCommunityProfile(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/community/profile`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepoStatsContributors(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/stats/contributors`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepoStatsCommitActivity(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/stats/commit_activity`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }


  // BRANCH MANAGEMENT METHODS
  private async listBranches(args: any) {
    const params: any = {};
    if (args.protected !== undefined) params.protected = args.protected;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/branches`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getBranch(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createBranch(args: any) {
    const fromBranch = args.from_branch || 'main';
    const refResponse = await this.client.get(`/repos/${args.owner}/${args.repo}/git/ref/heads/${fromBranch}`);
    const sha = refResponse.object.sha;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/git/refs`, {
      ref: `refs/heads/${args.branch}`,
      sha
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteBranch(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/git/refs/heads/${args.branch}`);
    return { content: [{ type: 'text', text: 'Branch deleted successfully' }] };
  }

  private async mergeBranch(args: any) {
    const body: any = { base: args.base, head: args.head };
    if (args.commit_message) body.commit_message = args.commit_message;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/merges`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getBranchProtection(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateBranchProtection(args: any) {
    const body: any = {};
    if (args.required_status_checks) body.required_status_checks = args.required_status_checks;
    if (args.enforce_admins !== undefined) body.enforce_admins = args.enforce_admins;
    if (args.required_pull_request_reviews) body.required_pull_request_reviews = args.required_pull_request_reviews;
    if (args.restrictions) body.restrictions = args.restrictions;
    const response = await this.client.put(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteBranchProtection(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`);
    return { content: [{ type: 'text', text: 'Branch protection removed' }] };
  }

  private async getRequiredStatusChecks(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_status_checks`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateRequiredStatusChecks(args: any) {
    const body: any = {};
    if (args.strict !== undefined) body.strict = args.strict;
    if (args.contexts) body.contexts = args.contexts;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_status_checks`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getAdminEnforcement(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/enforce_admins`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async setAdminEnforcement(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/enforce_admins`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getPullRequestReviewEnforcement(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_pull_request_reviews`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updatePullRequestReviewEnforcement(args: any) {
    const body: any = {};
    if (args.dismissal_restrictions) body.dismissal_restrictions = args.dismissal_restrictions;
    if (args.dismiss_stale_reviews !== undefined) body.dismiss_stale_reviews = args.dismiss_stale_reviews;
    if (args.require_code_owner_reviews !== undefined) body.require_code_owner_reviews = args.require_code_owner_reviews;
    if (args.required_approving_review_count) body.required_approving_review_count = args.required_approving_review_count;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_pull_request_reviews`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async renameBranch(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/rename`, { new_name: args.new_name });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COMMITS METHODS
  private async listCommits(args: any) {
    const params: any = {};
    if (args.sha) params.sha = args.sha;
    if (args.path) params.path = args.path;
    if (args.author) params.author = args.author;
    if (args.since) params.since = args.since;
    if (args.until) params.until = args.until;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/commits`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getCommit(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async compareCommits(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/compare/${args.base}...${args.head}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listCommitComments(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createCommitComment(args: any) {
    const body: any = { body: args.body };
    if (args.path) body.path = args.path;
    if (args.position) body.position = args.position;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/commits/${args.commit_sha}/comments`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getCommitStatus(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/status`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listCommitStatuses(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/statuses`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createCommitStatus(args: any) {
    const body: any = { state: args.state };
    if (args.target_url) body.target_url = args.target_url;
    if (args.description) body.description = args.description;
    if (args.context) body.context = args.context;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/statuses/${args.sha}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listPullRequestsAssociatedWithCommit(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/commits/${args.commit_sha}/pulls`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getCommitSignatureVerification(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.commit.verification, null, 2) }] };
  }

  // ISSUES METHODS
  private async listIssues(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.labels) params.labels = args.labels.join(',');
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/issues`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getIssue(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createIssue(args: any) {
    const body: any = { title: args.title };
    if (args.body) body.body = args.body;
    if (args.assignees) body.assignees = args.assignees;
    if (args.milestone) body.milestone = args.milestone;
    if (args.labels) body.labels = args.labels;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/issues`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateIssue(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    if (args.state) body.state = args.state;
    if (args.assignees) body.assignees = args.assignees;
    if (args.labels) body.labels = args.labels;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async lockIssue(args: any) {
    const body: any = {};
    if (args.lock_reason) body.lock_reason = args.lock_reason;
    await this.client.put(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/lock`, body);
    return { content: [{ type: 'text', text: 'Issue locked successfully' }] };
  }

  private async unlockIssue(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/lock`);
    return { content: [{ type: 'text', text: 'Issue unlocked successfully' }] };
  }

  private async addAssignees(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/assignees`, { assignees: args.assignees });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async removeAssignees(args: any) {
    const response = await this.client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/assignees`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async addLabels(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels`, { labels: args.labels });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async removeLabel(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels/${args.name}`);
    return { content: [{ type: 'text', text: 'Label removed successfully' }] };
  }

  private async replaceLabels(args: any) {
    const response = await this.client.put(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels`, { labels: args.labels || [] });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listIssueComments(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createIssueComment(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/comments`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateIssueComment(args: any) {
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/issues/comments/${args.comment_id}`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteIssueComment(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/issues/comments/${args.comment_id}`);
    return { content: [{ type: 'text', text: 'Comment deleted successfully' }] };
  }

  private async listIssueEvents(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/events`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listIssueTimeline(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/timeline`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listLabels(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/labels`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createLabel(args: any) {
    const body: any = { name: args.name, color: args.color };
    if (args.description) body.description = args.description;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/labels`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteLabel(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/labels/${args.name}`);
    return { content: [{ type: 'text', text: 'Label deleted successfully' }] };
  }

  // PULL REQUESTS METHODS
  private async listPullRequests(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.head) params.head = args.head;
    if (args.base) params.base = args.base;
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getPullRequest(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createPullRequest(args: any) {
    const body: any = { title: args.title, head: args.head, base: args.base };
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.maintainer_can_modify !== undefined) body.maintainer_can_modify = args.maintainer_can_modify;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/pulls`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updatePullRequest(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    if (args.state) body.state = args.state;
    if (args.base) body.base = args.base;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async mergePullRequest(args: any) {
    const body: any = {};
    if (args.commit_title) body.commit_title = args.commit_title;
    if (args.commit_message) body.commit_message = args.commit_message;
    if (args.merge_method) body.merge_method = args.merge_method;
    const response = await this.client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/merge`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getPullRequestMergeStatus(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/merge`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listPullRequestCommits(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/commits`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listPullRequestFiles(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/files`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listPullRequestReviews(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getPullRequestReview(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createPullRequestReview(args: any) {
    const body: any = { event: args.event };
    if (args.body) body.body = args.body;
    if (args.comments) body.comments = args.comments;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async submitPullRequestReview(args: any) {
    const body: any = { event: args.event };
    if (args.body) body.body = args.body;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}/events`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async dismissPullRequestReview(args: any) {
    const response = await this.client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}/dismissals`, { message: args.message });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listPullRequestReviewComments(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createPullRequestReviewComment(args: any) {
    const body: any = { body: args.body, commit_id: args.commit_id, path: args.path };
    if (args.line) body.line = args.line;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/comments`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updatePullRequestReviewComment(args: any) {
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/pulls/comments/${args.comment_id}`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deletePullRequestReviewComment(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/pulls/comments/${args.comment_id}`);
    return { content: [{ type: 'text', text: 'Comment deleted successfully' }] };
  }

  private async requestPullRequestReviewers(args: any) {
    const body: any = {};
    if (args.reviewers) body.reviewers = args.reviewers;
    if (args.team_reviewers) body.team_reviewers = args.team_reviewers;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async removePullRequestReviewers(args: any) {
    const body: any = {};
    if (args.reviewers) body.reviewers = args.reviewers;
    if (args.team_reviewers) body.team_reviewers = args.team_reviewers;
    const response = await this.client.delete(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updatePullRequestBranch(args: any) {
    const body: any = {};
    if (args.expected_head_sha) body.expected_head_sha = args.expected_head_sha;
    const response = await this.client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/update-branch`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listRequestedReviewers(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async checkPullRequestReviewability(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`);
    return { content: [{ type: 'text', text: JSON.stringify({ mergeable: response.mergeable, mergeable_state: response.mergeable_state }, null, 2) }] };
  }

  private async getPullRequestDiff(args: any) {
    const response = await this.fetch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, { headers: { 'Accept': 'application/vnd.github.v3.diff' } });
    return { content: [{ type: 'text', text: response }] };
  }

  private async getPullRequestPatch(args: any) {
    const response = await this.fetch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, { headers: { 'Accept': 'application/vnd.github.v3.patch' } });
    return { content: [{ type: 'text', text: response }] };
  }

  private async convertIssueToPullRequest(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/pulls`, { issue: args.issue_number, head: args.head, base: args.base });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // GITHUB ACTIONS METHODS
  private async listWorkflows(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/workflows`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getWorkflow(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async disableWorkflow(args: any) {
    await this.client.put(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/disable`, {});
    return { content: [{ type: 'text', text: 'Workflow disabled successfully' }] };
  }

  private async enableWorkflow(args: any) {
    await this.client.put(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/enable`, {});
    return { content: [{ type: 'text', text: 'Workflow enabled successfully' }] };
  }

  private async createWorkflowDispatch(args: any) {
    const body: any = { ref: args.ref };
    if (args.inputs) body.inputs = args.inputs;
    await this.client.post(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/dispatches`, body);
    return { content: [{ type: 'text', text: 'Workflow dispatch triggered successfully' }] };
  }

  private async listWorkflowRuns(args: any) {
    const params: any = {};
    if (args.workflow_id) params.workflow_id = args.workflow_id;
    if (args.actor) params.actor = args.actor;
    if (args.branch) params.branch = args.branch;
    if (args.event) params.event = args.event;
    if (args.status) params.status = args.status;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/runs`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getWorkflowRun(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async cancelWorkflowRun(args: any) {
    await this.client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/cancel`, {});
    return { content: [{ type: 'text', text: 'Workflow run cancelled successfully' }] };
  }

  private async rerunWorkflow(args: any) {
    await this.client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/rerun`, {});
    return { content: [{ type: 'text', text: 'Workflow rerun triggered successfully' }] };
  }

  private async rerunFailedJobs(args: any) {
    await this.client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/rerun-failed-jobs`, {});
    return { content: [{ type: 'text', text: 'Failed jobs rerun triggered successfully' }] };
  }

  private async deleteWorkflowRun(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}`);
    return { content: [{ type: 'text', text: 'Workflow run deleted successfully' }] };
  }

  private async listWorkflowRunArtifacts(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/artifacts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async downloadWorkflowRunLogs(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/logs`);
    return { content: [{ type: 'text', text: 'Logs download URL: ' + JSON.stringify(response, null, 2) }] };
  }

  private async deleteWorkflowRunLogs(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/logs`);
    return { content: [{ type: 'text', text: 'Workflow run logs deleted successfully' }] };
  }

  private async listWorkflowRunJobs(args: any) {
    const params: any = {};
    if (args.filter) params.filter = args.filter;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/jobs`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getWorkflowRunJob(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/jobs/${args.job_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async downloadJobLogs(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/jobs/${args.job_id}/logs`);
    return { content: [{ type: 'text', text: 'Job logs download URL: ' + JSON.stringify(response, null, 2) }] };
  }

  private async listRepoSecrets(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/actions/secrets`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createOrUpdateRepoSecret(args: any) {
    await this.client.put(`/repos/${args.owner}/${args.repo}/actions/secrets/${args.secret_name}`, { encrypted_value: args.encrypted_value });
    return { content: [{ type: 'text', text: 'Secret created/updated successfully' }] };
  }

  private async deleteRepoSecret(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/actions/secrets/${args.secret_name}`);
    return { content: [{ type: 'text', text: 'Secret deleted successfully' }] };
  }

  // RELEASES METHODS
  private async listReleases(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/releases`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRelease(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getLatestRelease(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/releases/latest`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getReleaseByTag(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/releases/tags/${args.tag}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createRelease(args: any) {
    const body: any = { tag_name: args.tag_name };
    if (args.target_commitish) body.target_commitish = args.target_commitish;
    if (args.name) body.name = args.name;
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.prerelease !== undefined) body.prerelease = args.prerelease;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/releases`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateRelease(args: any) {
    const body: any = {};
    if (args.tag_name) body.tag_name = args.tag_name;
    if (args.name) body.name = args.name;
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.prerelease !== undefined) body.prerelease = args.prerelease;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteRelease(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`);
    return { content: [{ type: 'text', text: 'Release deleted successfully' }] };
  }

  private async listReleaseAssets(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}/assets`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getReleaseAsset(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateReleaseAsset(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.label) body.label = args.label;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteReleaseAsset(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`);
    return { content: [{ type: 'text', text: 'Release asset deleted successfully' }] };
  }

  private async generateReleaseNotes(args: any) {
    const body: any = { tag_name: args.tag_name };
    if (args.target_commitish) body.target_commitish = args.target_commitish;
    if (args.previous_tag_name) body.previous_tag_name = args.previous_tag_name;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/releases/generate-notes`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // FILES & CONTENT METHODS
  private async getContent(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/contents/${args.path}`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createOrUpdateFile(args: any) {
    const body: any = { message: args.message, content: args.content };
    if (args.sha) body.sha = args.sha;
    if (args.branch) body.branch = args.branch;
    const response = await this.client.put(`/repos/${args.owner}/${args.repo}/contents/${args.path}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteFile(args: any) {
    const body: any = { message: args.message, sha: args.sha };
    if (args.branch) body.branch = args.branch;
    const response = await this.client.delete(`/repos/${args.owner}/${args.repo}/contents/${args.path}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getArchive(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/${args.archive_format}/${args.ref || 'main'}`);
    return { content: [{ type: 'text', text: 'Archive URL: ' + JSON.stringify(response, null, 2) }] };
  }

  private async listRepoContributors(args: any) {
    const params: any = {};
    if (args.anon) params.anon = args.anon;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/contributors`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepoClones(args: any) {
    const params: any = {};
    if (args.per) params.per = args.per;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/traffic/clones`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepoViews(args: any) {
    const params: any = {};
    if (args.per) params.per = args.per;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/traffic/views`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepoTopPaths(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/traffic/popular/paths`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRepoTopReferrers(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/traffic/popular/referrers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createTree(args: any) {
    const body: any = { tree: args.tree };
    if (args.base_tree) body.base_tree = args.base_tree;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/git/trees`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getTree(args: any) {
    const params: any = {};
    if (args.recursive) params.recursive = '1';
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/git/trees/${args.tree_sha}`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getBlob(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/git/blobs/${args.file_sha}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createBlob(args: any) {
    const body: any = { content: args.content };
    if (args.encoding) body.encoding = args.encoding;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/git/blobs`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createCommit(args: any) {
    const body: any = { message: args.message, tree: args.tree };
    if (args.parents) body.parents = args.parents;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/git/commits`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getRef(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/git/ref/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COLLABORATORS & PERMISSIONS METHODS
  private async listCollaborators(args: any) {
    const params: any = {};
    if (args.affiliation) params.affiliation = args.affiliation;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/collaborators`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async checkCollaborator(args: any) {
    try {
      await this.client.get(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`);
      return { content: [{ type: 'text', text: 'User is a collaborator' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not a collaborator' }] };
    }
  }

  private async addCollaborator(args: any) {
    const body: any = {};
    if (args.permission) body.permission = args.permission;
    await this.client.put(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`, body);
    return { content: [{ type: 'text', text: 'Collaborator added successfully' }] };
  }

  private async removeCollaborator(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`);
    return { content: [{ type: 'text', text: 'Collaborator removed successfully' }] };
  }

  private async getCollaboratorPermission(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}/permission`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listInvitations(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/invitations`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateInvitation(args: any) {
    const body: any = {};
    if (args.permissions) body.permissions = args.permissions;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/invitations/${args.invitation_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteInvitation(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/invitations/${args.invitation_id}`);
    return { content: [{ type: 'text', text: 'Invitation deleted successfully' }] };
  }

  private async listDeployKeys(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/keys`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createDeployKey(args: any) {
    const body: any = { title: args.title, key: args.key };
    if (args.read_only !== undefined) body.read_only = args.read_only;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/keys`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // WEBHOOKS METHODS
  private async listWebhooks(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/hooks`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getWebhook(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createWebhook(args: any) {
    const body: any = { config: args.config };
    if (args.name) body.name = args.name;
    if (args.events) body.events = args.events;
    if (args.active !== undefined) body.active = args.active;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/hooks`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateWebhook(args: any) {
    const body: any = {};
    if (args.config) body.config = args.config;
    if (args.events) body.events = args.events;
    if (args.active !== undefined) body.active = args.active;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteWebhook(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`);
    return { content: [{ type: 'text', text: 'Webhook deleted successfully' }] };
  }

  private async pingWebhook(args: any) {
    await this.client.post(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/pings`, {});
    return { content: [{ type: 'text', text: 'Webhook ping sent successfully' }] };
  }

  private async testWebhook(args: any) {
    await this.client.post(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/tests`, {});
    return { content: [{ type: 'text', text: 'Webhook test triggered successfully' }] };
  }

  private async listWebhookDeliveries(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/deliveries`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // ORGANIZATIONS & TEAMS METHODS
  private async listUserOrgs(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const path = args.username ? `/users/${args.username}/orgs` : '/user/orgs';
    const response = await this.client.get(path, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getOrg(args: any) {
    const response = await this.client.get(`/orgs/${args.org}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateOrg(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.description) body.description = args.description;
    if (args.email) body.email = args.email;
    if (args.location) body.location = args.location;
    const response = await this.client.patch(`/orgs/${args.org}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listOrgMembers(args: any) {
    const params: any = {};
    if (args.filter) params.filter = args.filter;
    if (args.role) params.role = args.role;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/orgs/${args.org}/members`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async checkOrgMembership(args: any) {
    try {
      await this.client.get(`/orgs/${args.org}/members/${args.username}`);
      return { content: [{ type: 'text', text: 'User is a member' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not a member' }] };
    }
  }

  private async removeOrgMember(args: any) {
    await this.client.delete(`/orgs/${args.org}/members/${args.username}`);
    return { content: [{ type: 'text', text: 'Member removed successfully' }] };
  }

  private async listOrgTeams(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/orgs/${args.org}/teams`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getTeam(args: any) {
    const response = await this.client.get(`/orgs/${args.org}/teams/${args.team_slug}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createTeam(args: any) {
    const body: any = { name: args.name };
    if (args.description) body.description = args.description;
    if (args.privacy) body.privacy = args.privacy;
    const response = await this.client.post(`/orgs/${args.org}/teams`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateTeam(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.description) body.description = args.description;
    if (args.privacy) body.privacy = args.privacy;
    const response = await this.client.patch(`/orgs/${args.org}/teams/${args.team_slug}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteTeam(args: any) {
    await this.client.delete(`/orgs/${args.org}/teams/${args.team_slug}`);
    return { content: [{ type: 'text', text: 'Team deleted successfully' }] };
  }

  private async listTeamMembers(args: any) {
    const params: any = {};
    if (args.role) params.role = args.role;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/orgs/${args.org}/teams/${args.team_slug}/members`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // SEARCH METHODS
  private async searchRepositories(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get('/search/repositories', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async searchCode(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get('/search/code', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async searchIssues(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get('/search/issues', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async searchUsers(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get('/search/users', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async searchCommits(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get('/search/commits', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async searchTopics(args: any) {
    const params: any = { q: args.q };
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get('/search/topics', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // USERS METHODS
  private async getAuthenticatedUser(args: any) {
    const response = await this.client.get('/user');
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getUser(args: any) {
    const response = await this.client.get(`/users/${args.username}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateAuthenticatedUser(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.email) body.email = args.email;
    if (args.blog) body.blog = args.blog;
    if (args.company) body.company = args.company;
    if (args.location) body.location = args.location;
    if (args.bio) body.bio = args.bio;
    const response = await this.client.patch('/user', body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listUserRepos(args: any) {
    const params: any = {};
    if (args.type) params.type = args.type;
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/users/${args.username}/repos`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listUserFollowers(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/users/${args.username}/followers`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listUserFollowing(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/users/${args.username}/following`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async checkFollowing(args: any) {
    try {
      await this.client.get(`/users/${args.username}/following/${args.target_user}`);
      return { content: [{ type: 'text', text: 'User is following target user' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not following target user' }] };
    }
  }

  private async listUserGists(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/users/${args.username}/gists`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // GISTS METHODS
  private async listGists(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get('/gists/public', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getGist(args: any) {
    const response = await this.client.get(`/gists/${args.gist_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createGist(args: any) {
    const body: any = { files: args.files };
    if (args.description) body.description = args.description;
    if (args.public !== undefined) body.public = args.public;
    const response = await this.client.post('/gists', body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateGist(args: any) {
    const body: any = {};
    if (args.description) body.description = args.description;
    if (args.files) body.files = args.files;
    const response = await this.client.patch(`/gists/${args.gist_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteGist(args: any) {
    await this.client.delete(`/gists/${args.gist_id}`);
    return { content: [{ type: 'text', text: 'Gist deleted successfully' }] };
  }

  private async starGist(args: any) {
    await this.client.put(`/gists/${args.gist_id}/star`, {});
    return { content: [{ type: 'text', text: 'Gist starred successfully' }] };
  }

  private async unstarGist(args: any) {
    await this.client.delete(`/gists/${args.gist_id}/star`);
    return { content: [{ type: 'text', text: 'Gist unstarred successfully' }] };
  }

  private async checkGistStar(args: any) {
    try {
      await this.client.get(`/gists/${args.gist_id}/star`);
      return { content: [{ type: 'text', text: 'Gist is starred' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'Gist is not starred' }] };
    }
  }

  private async forkGist(args: any) {
    const response = await this.client.post(`/gists/${args.gist_id}/forks`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listGistCommits(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/gists/${args.gist_id}/commits`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // MILESTONES & PROJECTS METHODS
  private async listMilestones(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/milestones`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getMilestone(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createMilestone(args: any) {
    const body: any = { title: args.title };
    if (args.state) body.state = args.state;
    if (args.description) body.description = args.description;
    if (args.due_on) body.due_on = args.due_on;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/milestones`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateMilestone(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.state) body.state = args.state;
    if (args.description) body.description = args.description;
    if (args.due_on) body.due_on = args.due_on;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteMilestone(args: any) {
    await this.client.delete(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`);
    return { content: [{ type: 'text', text: 'Milestone deleted successfully' }] };
  }

  private async listProjects(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/projects`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getProject(args: any) {
    const response = await this.client.get(`/projects/${args.project_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createProject(args: any) {
    const body: any = { name: args.name };
    if (args.body) body.body = args.body;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/projects`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createRepoSecretHandler(args: any) {
    const response = await this.client.put(`/repos/${args.owner}/${args.repo}/actions/secrets/${args.secret_name}`, {
      encrypted_value: args.encrypted_value
    });
    return { content: [{ type: 'text', text: 'Secret created successfully' }] };
  }

  // PACKAGES
  private async listPackages(args: any) {
    const response = await this.client.get(`/orgs/${args.org}/packages`, { package_type: args.package_type });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getPackage(args: any) {
    const response = await this.client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deletePackage(args: any) {
    const response = await this.client.delete(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}`);
    return { content: [{ type: 'text', text: 'Package deleted' }] };
  }

  private async restorePackage(args: any) {
    const response = await this.client.post(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/restore`, {});
    return { content: [{ type: 'text', text: 'Package restored' }] };
  }

  private async listPackageVersions(args: any) {
    const response = await this.client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getPackageVersion(args: any) {
    const response = await this.client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deletePackageVersion(args: any) {
    const response = await this.client.delete(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}`);
    return { content: [{ type: 'text', text: 'Package version deleted' }] };
  }

  private async restorePackageVersion(args: any) {
    const response = await this.client.post(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}/restore`, {});
    return { content: [{ type: 'text', text: 'Package version restored' }] };
  }

  // PROJECTS V2 (GraphQL)
  private async listOrgProjectsV2(args: any) {
    const query = `query { organization(login: "${args.org}") { projectsV2(first: 20) { nodes { id title } } } }`;
    const response = await this.client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getProjectV2(args: any) {
    const query = `query { node(id: "${args.project_id}") { ... on ProjectV2 { id title description } } }`;
    const response = await this.client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createProjectV2(args: any) {
    const mutation = `mutation { createProjectV2(input: { ownerId: "${args.org}", title: "${args.title}" }) { projectV2 { id title } } }`;
    const response = await this.client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateProjectV2(args: any) {
    const mutation = `mutation { updateProjectV2(input: { projectId: "${args.project_id}", title: "${args.title || ''}" }) { projectV2 { id title } } }`;
    const response = await this.client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteProjectV2(args: any) {
    const mutation = `mutation { deleteProjectV2(input: { projectId: "${args.project_id}" }) { projectV2 { id } } }`;
    const response = await this.client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Project deleted' }] };
  }

  private async listProjectItems(args: any) {
    const query = `query { node(id: "${args.project_id}") { ... on ProjectV2 { items(first: 20) { nodes { id } } } } }`;
    const response = await this.client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async addProjectItem(args: any) {
    const mutation = `mutation { addProjectV2ItemById(input: { projectId: "${args.project_id}", contentId: "${args.content_id}" }) { item { id } } }`;
    const response = await this.client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Item added to project' }] };
  }

  private async removeProjectItem(args: any) {
    const mutation = `mutation { deleteProjectV2Item(input: { projectId: "${args.project_id}", itemId: "${args.item_id}" }) { deletedItemId } }`;
    const response = await this.client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Item removed from project' }] };
  }

  // DISCUSSIONS
  private async listDiscussions(args: any) {
    const params: any = {};
    if (args.category) params.category = args.category;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/discussions`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getDiscussion(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createDiscussion(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/discussions`, {
      title: args.title,
      body: args.body,
      category_id: args.category_id
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateDiscussion(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async deleteDiscussion(args: any) {
    const response = await this.client.delete(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`);
    return { content: [{ type: 'text', text: 'Discussion deleted' }] };
  }

  private async listDiscussionComments(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}/comments`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createDiscussionComment(args: any) {
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}/comments`, {
      body: args.body
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listDiscussionCategories(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/discussions/categories`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // CODESPACES
  private async listCodespaces(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    const response = await this.client.get('/user/codespaces', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getCodespace(args: any) {
    const response = await this.client.get(`/user/codespaces/${args.codespace_name}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async createCodespace(args: any) {
    const body: any = {};
    if (args.ref) body.ref = args.ref;
    if (args.machine) body.machine = args.machine;
    const response = await this.client.post(`/repos/${args.owner}/${args.repo}/codespaces`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async startCodespace(args: any) {
    const response = await this.client.post(`/user/codespaces/${args.codespace_name}/start`, {});
    return { content: [{ type: 'text', text: 'Codespace started' }] };
  }

  private async stopCodespace(args: any) {
    const response = await this.client.post(`/user/codespaces/${args.codespace_name}/stop`, {});
    return { content: [{ type: 'text', text: 'Codespace stopped' }] };
  }

  private async deleteCodespace(args: any) {
    const response = await this.client.delete(`/user/codespaces/${args.codespace_name}`);
    return { content: [{ type: 'text', text: 'Codespace deleted' }] };
  }

  private async listRepoCodespaces(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/codespaces`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COPILOT
  private async getCopilotOrgSettings(args: any) {
    const response = await this.client.get(`/orgs/${args.org}/copilot/billing`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listCopilotSeats(args: any) {
    const response = await this.client.get(`/orgs/${args.org}/copilot/billing/seats`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async addCopilotSeats(args: any) {
    const response = await this.client.post(`/orgs/${args.org}/copilot/billing/selected_users`, {
      selected_usernames: args.selected_usernames
    });
    return { content: [{ type: 'text', text: 'Copilot seats added' }] };
  }

  private async removeCopilotSeats(args: any) {
    const response = await this.client.delete(`/orgs/${args.org}/copilot/billing/selected_users`);
    return { content: [{ type: 'text', text: 'Copilot seats removed' }] };
  }

  private async getCopilotUsage(args: any) {
    const response = await this.client.get(`/orgs/${args.org}/copilot/usage`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // ADVANCED SECURITY
  private async listCodeScanningAlerts(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/code-scanning/alerts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async getCodeScanningAlert(args: any) {
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/code-scanning/alerts/${args.alert_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateCodeScanningAlert(args: any) {
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/code-scanning/alerts/${args.alert_number}`, {
      state: args.state
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async listSecretScanningAlerts(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    const response = await this.client.get(`/repos/${args.owner}/${args.repo}/secret-scanning/alerts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  private async updateSecretScanningAlert(args: any) {
    const response = await this.client.patch(`/repos/${args.owner}/${args.repo}/secret-scanning/alerts/${args.alert_number}`, {
      state: args.state
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/github-mcp server running on stdio');
    console.error('250 GitHub tools available');
  }
}

// Server initialization
const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN || process.argv[2];
if (!token) {
  console.error('Error: GitHub token required!');
  console.error('Usage: github-mcp <token>');
  console.error('Or set GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_TOKEN environment variable');
  process.exit(1);
}

const server = new GitHubMCP(token);
server.run().catch(console.error);
