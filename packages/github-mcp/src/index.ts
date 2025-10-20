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
        'Authorization': `Bearer ${this.token}`,
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
        { name: 'list_repos', description: 'List repositories for authenticated user or organization', inputSchema: { type: 'object', properties: { org: { type: 'string' }, type: { type: 'string', enum: ['all', 'owner', 'public', 'private', 'member'] }, sort: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } } } },
        { name: 'get_repo', description: 'Get repository details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'create_repo', description: 'Create a new repository', inputSchema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, private: { type: 'boolean' }, auto_init: { type: 'boolean' }, gitignore_template: { type: 'string' }, license_template: { type: 'string' }, org: { type: 'string' } }, required: ['name'] } },
        { name: 'update_repo', description: 'Update repository settings', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, private: { type: 'boolean' }, has_issues: { type: 'boolean' }, has_projects: { type: 'boolean' }, has_wiki: { type: 'boolean' } }, required: ['owner', 'repo'] } },
        { name: 'delete_repo', description: 'Delete a repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'list_repo_topics', description: 'List repository topics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'replace_repo_topics', description: 'Replace all repository topics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, names: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'names'] } },
        { name: 'list_repo_languages', description: 'List programming languages used in repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'list_repo_tags', description: 'List repository tags', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'list_repo_teams', description: 'List teams with access to repository', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'transfer_repo', description: 'Transfer repository to another user/org', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, new_owner: { type: 'string' } }, required: ['owner', 'repo', 'new_owner'] } },
        { name: 'enable_automated_security_fixes', description: 'Enable automated security fixes', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'disable_automated_security_fixes', description: 'Disable automated security fixes', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'enable_vulnerability_alerts', description: 'Enable vulnerability alerts', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'disable_vulnerability_alerts', description: 'Disable vulnerability alerts', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_readme', description: 'Get repository README', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_license', description: 'Get repository license', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_community_profile', description: 'Get community profile metrics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_stats_contributors', description: 'Get contributor statistics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_stats_commit_activity', description: 'Get commit activity statistics', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },

        // BRANCHES (15 tools)
        { name: 'list_branches', description: 'List repository branches', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, protected: { type: 'boolean' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_branch', description: 'Get branch details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'create_branch', description: 'Create a new branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string'}, branch: { type: 'string' }, from_branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'delete_branch', description: 'Delete a branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'merge_branch', description: 'Merge a branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, base: { type: 'string' }, head: { type: 'string' }, commit_message: { type: 'string' } }, required: ['owner', 'repo', 'base', 'head'] } },
        { name: 'get_branch_protection', description: 'Get branch protection rules', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'update_branch_protection', description: 'Update branch protection rules', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, required_status_checks: { type: 'object' }, enforce_admins: { type: 'boolean' }, required_pull_request_reviews: { type: 'object' }, restrictions: { type: 'object' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'delete_branch_protection', description: 'Remove branch protection', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'get_required_status_checks', description: 'Get required status checks', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'update_required_status_checks', description: 'Update required status checks', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, strict: { type: 'boolean' }, contexts: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'get_admin_enforcement', description: 'Get admin enforcement status', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'set_admin_enforcement', description: 'Enable/disable admin enforcement', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'get_pull_request_review_enforcement', description: 'Get PR review enforcement', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'update_pull_request_review_enforcement', description: 'Update PR review enforcement', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, dismissal_restrictions: { type: 'object' }, dismiss_stale_reviews: { type: 'boolean' }, require_code_owner_reviews: { type: 'boolean' }, required_approving_review_count: { type: 'number' } }, required: ['owner', 'repo', 'branch'] } },
        { name: 'rename_branch', description: 'Rename a branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, branch: { type: 'string' }, new_name: { type: 'string' } }, required: ['owner', 'repo', 'branch', 'new_name'] } },

        // COMMITS (10 tools)
        { name: 'list_commits', description: 'List commits', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, sha: { type: 'string' }, path: { type: 'string' }, author: { type: 'string' }, since: { type: 'string' }, until: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_commit', description: 'Get commit details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'ref'] } },
        { name: 'compare_commits', description: 'Compare two commits', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, base: { type: 'string' }, head: { type: 'string' } }, required: ['owner', 'repo', 'base', 'head'] } },
        { name: 'list_commit_comments', description: 'List commit comments', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'ref'] } },
        { name: 'create_commit_comment', description: 'Create commit comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, commit_sha: { type: 'string' }, body: { type: 'string' }, path: { type: 'string' }, position: { type: 'number' } }, required: ['owner', 'repo', 'commit_sha', 'body'] } },
        { name: 'get_commit_status', description: 'Get combined commit status', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'ref'] } },
        { name: 'list_commit_statuses', description: 'List commit statuses', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'ref'] } },
        { name: 'create_commit_status', description: 'Create commit status', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, sha: { type: 'string' }, state: { type: 'string', enum: ['error', 'failure', 'pending', 'success'] }, target_url: { type: 'string' }, description: { type: 'string' }, context: { type: 'string' } }, required: ['owner', 'repo', 'sha', 'state'] } },
        { name: 'list_pull_requests_associated_with_commit', description: 'List PRs associated with commit', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, commit_sha: { type: 'string' } }, required: ['owner', 'repo', 'commit_sha'] } },
        { name: 'get_commit_signature_verification', description: 'Get commit signature verification', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'ref'] } },

        // ISSUES (20 tools)
        { name: 'list_issues', description: 'List issues', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] }, labels: { type: 'array', items: { type: 'string' } }, sort: { type: 'string' }, direction: { type: 'string' }, since: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_issue', description: 'Get issue details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'create_issue', description: 'Create an issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, assignees: { type: 'array', items: { type: 'string' } }, milestone: { type: 'number' }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'title'] } },
        { name: 'update_issue', description: 'Update an issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, title: { type: 'string' }, body: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed'] }, assignees: { type: 'array', items: { type: 'string' } }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'lock_issue', description: 'Lock an issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, lock_reason: { type: 'string', enum: ['off-topic', 'too heated', 'resolved', 'spam'] } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'unlock_issue', description: 'Unlock an issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'add_assignees', description: 'Add assignees to issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, assignees: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number', 'assignees'] } },
        { name: 'remove_assignees', description: 'Remove assignees from issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, assignees: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number', 'assignees'] } },
        { name: 'add_labels', description: 'Add labels to issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number', 'labels'] } },
        { name: 'remove_label', description: 'Remove label from issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, name: { type: 'string' } }, required: ['owner', 'repo', 'issue_number', 'name'] } },
        { name: 'replace_labels', description: 'Replace all labels on issue', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, labels: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'list_issue_comments', description: 'List issue comments', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, since: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'create_issue_comment', description: 'Create issue comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, body: { type: 'string' } }, required: ['owner', 'repo', 'issue_number', 'body'] } },
        { name: 'update_issue_comment', description: 'Update issue comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, comment_id: { type: 'number' }, body: { type: 'string' } }, required: ['owner', 'repo', 'comment_id', 'body'] } },
        { name: 'delete_issue_comment', description: 'Delete issue comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, comment_id: { type: 'number' } }, required: ['owner', 'repo', 'comment_id'] } },
        { name: 'list_issue_events', description: 'List issue events', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'list_issue_timeline', description: 'List issue timeline events', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'issue_number'] } },
        { name: 'list_labels', description: 'List repository labels', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'create_label', description: 'Create a label', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' }, color: { type: 'string' }, description: { type: 'string' } }, required: ['owner', 'repo', 'name', 'color'] } },
        { name: 'delete_label', description: 'Delete a label', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' } }, required: ['owner', 'repo', 'name'] } },

        // PULL REQUESTS (25 tools)
        { name: 'list_pull_requests', description: 'List pull requests', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] }, head: { type: 'string' }, base: { type: 'string' }, sort: { type: 'string' }, direction: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_pull_request', description: 'Get pull request details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'create_pull_request', description: 'Create a pull request', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, head: { type: 'string' }, base: { type: 'string' }, body: { type: 'string' }, draft: { type: 'boolean' }, maintainer_can_modify: { type: 'boolean' } }, required: ['owner', 'repo', 'title', 'head', 'base'] } },
        { name: 'update_pull_request', description: 'Update a pull request', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, title: { type: 'string' }, body: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed'] }, base: { type: 'string' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'merge_pull_request', description: 'Merge a pull request', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, commit_title: { type: 'string' }, commit_message: { type: 'string' }, merge_method: { type: 'string', enum: ['merge', 'squash', 'rebase'] } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'get_pull_request_merge_status', description: 'Check if PR can be merged', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'list_pull_request_commits', description: 'List PR commits', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'list_pull_request_files', description: 'List PR files', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'list_pull_request_reviews', description: 'List PR reviews', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'get_pull_request_review', description: 'Get PR review', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, review_id: { type: 'number' } }, required: ['owner', 'repo', 'pull_number', 'review_id'] } },
        { name: 'create_pull_request_review', description: 'Create PR review', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, body: { type: 'string' }, event: { type: 'string', enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'] }, comments: { type: 'array' } }, required: ['owner', 'repo', 'pull_number', 'event'] } },
        { name: 'submit_pull_request_review', description: 'Submit PR review', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, review_id: { type: 'number' }, body: { type: 'string' }, event: { type: 'string', enum: ['APPROVE', 'REQUEST_CHANGES', 'COMMENT'] } }, required: ['owner', 'repo', 'pull_number', 'review_id', 'event'] } },
        { name: 'dismiss_pull_request_review', description: 'Dismiss PR review', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, review_id: { type: 'number' }, message: { type: 'string' } }, required: ['owner', 'repo', 'pull_number', 'review_id', 'message'] } },
        { name: 'list_pull_request_review_comments', description: 'List PR review comments', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'create_pull_request_review_comment', description: 'Create PR review comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, body: { type: 'string' }, commit_id: { type: 'string' }, path: { type: 'string' }, line: { type: 'number' } }, required: ['owner', 'repo', 'pull_number', 'body', 'commit_id', 'path'] } },
        { name: 'update_pull_request_review_comment', description: 'Update PR review comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, comment_id: { type: 'number' }, body: { type: 'string' } }, required: ['owner', 'repo', 'comment_id', 'body'] } },
        { name: 'delete_pull_request_review_comment', description: 'Delete PR review comment', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, comment_id: { type: 'number' } }, required: ['owner', 'repo', 'comment_id'] } },
        { name: 'request_pull_request_reviewers', description: 'Request PR reviewers', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, reviewers: { type: 'array', items: { type: 'string' } }, team_reviewers: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'remove_pull_request_reviewers', description: 'Remove PR reviewers', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, reviewers: { type: 'array', items: { type: 'string' } }, team_reviewers: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'update_pull_request_branch', description: 'Update PR branch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' }, expected_head_sha: { type: 'string' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'list_requested_reviewers', description: 'List requested reviewers', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'check_pull_request_reviewability', description: 'Check if PR is reviewable', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'get_pull_request_diff', description: 'Get PR diff', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'get_pull_request_patch', description: 'Get PR patch', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, pull_number: { type: 'number' } }, required: ['owner', 'repo', 'pull_number'] } },
        { name: 'convert_issue_to_pull_request', description: 'Convert issue to PR', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, issue_number: { type: 'number' }, head: { type: 'string' }, base: { type: 'string' } }, required: ['owner', 'repo', 'issue_number', 'head', 'base'] } },

        // GITHUB ACTIONS (20 tools)
        { name: 'list_workflows', description: 'List repository workflows', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_workflow', description: 'Get workflow details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' } }, required: ['owner', 'repo', 'workflow_id'] } },
        { name: 'disable_workflow', description: 'Disable a workflow', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' } }, required: ['owner', 'repo', 'workflow_id'] } },
        { name: 'enable_workflow', description: 'Enable a workflow', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' } }, required: ['owner', 'repo', 'workflow_id'] } },
        { name: 'create_workflow_dispatch', description: 'Trigger workflow dispatch event', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' }, ref: { type: 'string' }, inputs: { type: 'object' } }, required: ['owner', 'repo', 'workflow_id', 'ref'] } },
        { name: 'list_workflow_runs', description: 'List workflow runs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, workflow_id: { type: 'string' }, actor: { type: 'string' }, branch: { type: 'string' }, event: { type: 'string' }, status: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_workflow_run', description: 'Get workflow run details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'cancel_workflow_run', description: 'Cancel a workflow run', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'rerun_workflow', description: 'Re-run a workflow', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'rerun_failed_jobs', description: 'Re-run failed jobs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'delete_workflow_run', description: 'Delete a workflow run', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'list_workflow_run_artifacts', description: 'List workflow run artifacts', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'download_workflow_run_logs', description: 'Download workflow run logs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'delete_workflow_run_logs', description: 'Delete workflow run logs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'list_workflow_run_jobs', description: 'List jobs for workflow run', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, run_id: { type: 'number' }, filter: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'run_id'] } },
        { name: 'get_workflow_run_job', description: 'Get job details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, job_id: { type: 'number' } }, required: ['owner', 'repo', 'job_id'] } },
        { name: 'download_job_logs', description: 'Download job logs', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, job_id: { type: 'number' } }, required: ['owner', 'repo', 'job_id'] } },
        { name: 'list_repo_secrets', description: 'List repository secrets', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'create_or_update_repo_secret', description: 'Create/update repository secret', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, secret_name: { type: 'string' }, encrypted_value: { type: 'string' } }, required: ['owner', 'repo', 'secret_name', 'encrypted_value'] } },
        { name: 'delete_repo_secret', description: 'Delete repository secret', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, secret_name: { type: 'string' } }, required: ['owner', 'repo', 'secret_name'] } },

        // RELEASES (12 tools)
        { name: 'list_releases', description: 'List releases', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_release', description: 'Get release details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, release_id: { type: 'number' } }, required: ['owner', 'repo', 'release_id'] } },
        { name: 'get_latest_release', description: 'Get latest release', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'get_release_by_tag', description: 'Get release by tag', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tag: { type: 'string' } }, required: ['owner', 'repo', 'tag'] } },
        { name: 'create_release', description: 'Create a release', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tag_name: { type: 'string' }, target_commitish: { type: 'string' }, name: { type: 'string' }, body: { type: 'string' }, draft: { type: 'boolean' }, prerelease: { type: 'boolean' } }, required: ['owner', 'repo', 'tag_name'] } },
        { name: 'update_release', description: 'Update a release', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, release_id: { type: 'number' }, tag_name: { type: 'string' }, name: { type: 'string' }, body: { type: 'string' }, draft: { type: 'boolean' }, prerelease: { type: 'boolean' } }, required: ['owner', 'repo', 'release_id'] } },
        { name: 'delete_release', description: 'Delete a release', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, release_id: { type: 'number' } }, required: ['owner', 'repo', 'release_id'] } },
        { name: 'list_release_assets', description: 'List release assets', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, release_id: { type: 'number' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo', 'release_id'] } },
        { name: 'get_release_asset', description: 'Get release asset', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, asset_id: { type: 'number' } }, required: ['owner', 'repo', 'asset_id'] } },
        { name: 'update_release_asset', description: 'Update release asset', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, asset_id: { type: 'number' }, name: { type: 'string' }, label: { type: 'string' } }, required: ['owner', 'repo', 'asset_id'] } },
        { name: 'delete_release_asset', description: 'Delete release asset', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, asset_id: { type: 'number' } }, required: ['owner', 'repo', 'asset_id'] } },
        { name: 'generate_release_notes', description: 'Generate release notes', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tag_name: { type: 'string' }, target_commitish: { type: 'string' }, previous_tag_name: { type: 'string' } }, required: ['owner', 'repo', 'tag_name'] } },

        // FILES & CONTENT (15 tools)
        { name: 'get_content', description: 'Get repository content', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'path'] } },
        { name: 'create_or_update_file', description: 'Create or update file', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, message: { type: 'string' }, content: { type: 'string' }, sha: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'path', 'message', 'content'] } },
        { name: 'delete_file', description: 'Delete a file', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' }, message: { type: 'string' }, sha: { type: 'string' }, branch: { type: 'string' } }, required: ['owner', 'repo', 'path', 'message', 'sha'] } },
        { name: 'get_archive', description: 'Download repository archive', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, archive_format: { type: 'string', enum: ['tarball', 'zipball'] }, ref: { type: 'string' } }, required: ['owner', 'repo', 'archive_format'] } },
        { name: 'list_repo_contributors', description: 'List repository contributors', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, anon: { type: 'boolean' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_clones', description: 'Get repository clones', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per: { type: 'string', enum: ['day', 'week'] } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_views', description: 'Get repository views', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per: { type: 'string', enum: ['day', 'week'] } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_top_paths', description: 'Get top referral paths', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'get_repo_top_referrers', description: 'Get top referrers', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' } }, required: ['owner', 'repo'] } },
        { name: 'create_tree', description: 'Create a tree', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tree: { type: 'array' }, base_tree: { type: 'string' } }, required: ['owner', 'repo', 'tree'] } },
        { name: 'get_tree', description: 'Get a tree', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, tree_sha: { type: 'string' }, recursive: { type: 'boolean' } }, required: ['owner', 'repo', 'tree_sha'] } },
        { name: 'get_blob', description: 'Get a blob', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, file_sha: { type: 'string' } }, required: ['owner', 'repo', 'file_sha'] } },
        { name: 'create_blob', description: 'Create a blob', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, content: { type: 'string' }, encoding: { type: 'string' } }, required: ['owner', 'repo', 'content'] } },
        { name: 'create_commit', description: 'Create a commit', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, message: { type: 'string' }, tree: { type: 'string' }, parents: { type: 'array', items: { type: 'string' } } }, required: ['owner', 'repo', 'message', 'tree'] } },
        { name: 'get_ref', description: 'Get a reference', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' } }, required: ['owner', 'repo', 'ref'] } },

        // COLLABORATORS & PERMISSIONS (10 tools)
        { name: 'list_collaborators', description: 'List repository collaborators', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, affiliation: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'check_collaborator', description: 'Check if user is collaborator', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, username: { type: 'string' } }, required: ['owner', 'repo', 'username'] } },
        { name: 'add_collaborator', description: 'Add repository collaborator', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, username: { type: 'string' }, permission: { type: 'string', enum: ['pull', 'push', 'admin', 'maintain', 'triage'] } }, required: ['owner', 'repo', 'username'] } },
        { name: 'remove_collaborator', description: 'Remove repository collaborator', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, username: { type: 'string' } }, required: ['owner', 'repo', 'username'] } },
        { name: 'get_collaborator_permission', description: 'Get collaborator permission level', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, username: { type: 'string' } }, required: ['owner', 'repo', 'username'] } },
        { name: 'list_invitations', description: 'List repository invitations', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'update_invitation', description: 'Update repository invitation', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, invitation_id: { type: 'number' }, permissions: { type: 'string' } }, required: ['owner', 'repo', 'invitation_id'] } },
        { name: 'delete_invitation', description: 'Delete repository invitation', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, invitation_id: { type: 'number' } }, required: ['owner', 'repo', 'invitation_id'] } },
        { name: 'list_deploy_keys', description: 'List deploy keys', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'create_deploy_key', description: 'Create deploy key', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, key: { type: 'string' }, read_only: { type: 'boolean' } }, required: ['owner', 'repo', 'title', 'key'] } },

        // WEBHOOKS (8 tools)
        { name: 'list_webhooks', description: 'List repository webhooks', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_webhook', description: 'Get webhook details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'create_webhook', description: 'Create a webhook', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' }, config: { type: 'object' }, events: { type: 'array', items: { type: 'string' } }, active: { type: 'boolean' } }, required: ['owner', 'repo', 'config'] } },
        { name: 'update_webhook', description: 'Update a webhook', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' }, config: { type: 'object' }, events: { type: 'array', items: { type: 'string' } }, active: { type: 'boolean' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'delete_webhook', description: 'Delete a webhook', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'ping_webhook', description: 'Ping a webhook', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'test_webhook', description: 'Test webhook push', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },
        { name: 'list_webhook_deliveries', description: 'List webhook deliveries', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, hook_id: { type: 'number' }, per_page: { type: 'number' } }, required: ['owner', 'repo', 'hook_id'] } },

        // ORGANIZATIONS & TEAMS (12 tools)
        { name: 'list_user_orgs', description: 'List user organizations', inputSchema: { type: 'object', properties: { username: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } } } },
        { name: 'get_org', description: 'Get organization details', inputSchema: { type: 'object', properties: { org: { type: 'string' } }, required: ['org'] } },
        { name: 'update_org', description: 'Update organization', inputSchema: { type: 'object', properties: { org: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, email: { type: 'string' }, location: { type: 'string' } }, required: ['org'] } },
        { name: 'list_org_members', description: 'List organization members', inputSchema: { type: 'object', properties: { org: { type: 'string' }, filter: { type: 'string' }, role: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['org'] } },
        { name: 'check_org_membership', description: 'Check organization membership', inputSchema: { type: 'object', properties: { org: { type: 'string' }, username: { type: 'string' } }, required: ['org', 'username'] } },
        { name: 'remove_org_member', description: 'Remove organization member', inputSchema: { type: 'object', properties: { org: { type: 'string' }, username: { type: 'string' } }, required: ['org', 'username'] } },
        { name: 'list_org_teams', description: 'List organization teams', inputSchema: { type: 'object', properties: { org: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['org'] } },
        { name: 'get_team', description: 'Get team details', inputSchema: { type: 'object', properties: { org: { type: 'string' }, team_slug: { type: 'string' } }, required: ['org', 'team_slug'] } },
        { name: 'create_team', description: 'Create a team', inputSchema: { type: 'object', properties: { org: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, privacy: { type: 'string', enum: ['secret', 'closed'] } }, required: ['org', 'name'] } },
        { name: 'update_team', description: 'Update a team', inputSchema: { type: 'object', properties: { org: { type: 'string' }, team_slug: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' }, privacy: { type: 'string' } }, required: ['org', 'team_slug'] } },
        { name: 'delete_team', description: 'Delete a team', inputSchema: { type: 'object', properties: { org: { type: 'string' }, team_slug: { type: 'string' } }, required: ['org', 'team_slug'] } },
        { name: 'list_team_members', description: 'List team members', inputSchema: { type: 'object', properties: { org: { type: 'string' }, team_slug: { type: 'string' }, role: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['org', 'team_slug'] } },

        // SEARCH (6 tools)
        { name: 'search_repositories', description: 'Search repositories', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'search_code', description: 'Search code', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'search_issues', description: 'Search issues and pull requests', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'search_users', description: 'Search users', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'search_commits', description: 'Search commits', inputSchema: { type: 'object', properties: { q: { type: 'string' }, sort: { type: 'string' }, order: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },
        { name: 'search_topics', description: 'Search topics', inputSchema: { type: 'object', properties: { q: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['q'] } },

        // USERS (8 tools)
        { name: 'get_authenticated_user', description: 'Get authenticated user', inputSchema: { type: 'object', properties: {} } },
        { name: 'get_user', description: 'Get user details', inputSchema: { type: 'object', properties: { username: { type: 'string' } }, required: ['username'] } },
        { name: 'update_authenticated_user', description: 'Update authenticated user', inputSchema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, blog: { type: 'string' }, company: { type: 'string' }, location: { type: 'string' }, bio: { type: 'string' } } } },
        { name: 'list_user_repos', description: 'List user repositories', inputSchema: { type: 'object', properties: { username: { type: 'string' }, type: { type: 'string' }, sort: { type: 'string' }, direction: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['username'] } },
        { name: 'list_user_followers', description: 'List user followers', inputSchema: { type: 'object', properties: { username: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['username'] } },
        { name: 'list_user_following', description: 'List users followed by user', inputSchema: { type: 'object', properties: { username: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['username'] } },
        { name: 'check_following', description: 'Check if user follows another user', inputSchema: { type: 'object', properties: { username: { type: 'string' }, target_user: { type: 'string' } }, required: ['username', 'target_user'] } },
        { name: 'list_user_gists', description: 'List user gists', inputSchema: { type: 'object', properties: { username: { type: 'string' }, since: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['username'] } },

        // GISTS (10 tools)
        { name: 'list_gists', description: 'List public gists', inputSchema: { type: 'object', properties: { since: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } } } },
        { name: 'get_gist', description: 'Get gist details', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'create_gist', description: 'Create a gist', inputSchema: { type: 'object', properties: { description: { type: 'string' }, files: { type: 'object' }, public: { type: 'boolean' } }, required: ['files'] } },
        { name: 'update_gist', description: 'Update a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' }, description: { type: 'string' }, files: { type: 'object' } }, required: ['gist_id'] } },
        { name: 'delete_gist', description: 'Delete a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'star_gist', description: 'Star a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'unstar_gist', description: 'Unstar a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'check_gist_star', description: 'Check if gist is starred', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'fork_gist', description: 'Fork a gist', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' } }, required: ['gist_id'] } },
        { name: 'list_gist_commits', description: 'List gist commits', inputSchema: { type: 'object', properties: { gist_id: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['gist_id'] } },

        // MILESTONES & PROJECTS (8 tools)
        { name: 'list_milestones', description: 'List milestones', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] }, sort: { type: 'string' }, direction: { type: 'string' }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_milestone', description: 'Get milestone details', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, milestone_number: { type: 'number' } }, required: ['owner', 'repo', 'milestone_number'] } },
        { name: 'create_milestone', description: 'Create a milestone', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, title: { type: 'string' }, state: { type: 'string' }, description: { type: 'string' }, due_on: { type: 'string' } }, required: ['owner', 'repo', 'title'] } },
        { name: 'update_milestone', description: 'Update a milestone', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, milestone_number: { type: 'number' }, title: { type: 'string' }, state: { type: 'string' }, description: { type: 'string' }, due_on: { type: 'string' } }, required: ['owner', 'repo', 'milestone_number'] } },
        { name: 'delete_milestone', description: 'Delete a milestone', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, milestone_number: { type: 'number' } }, required: ['owner', 'repo', 'milestone_number'] } },
        { name: 'list_projects', description: 'List repository projects', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, state: { type: 'string', enum: ['open', 'closed', 'all'] }, per_page: { type: 'number' }, page: { type: 'number' } }, required: ['owner', 'repo'] } },
        { name: 'get_project', description: 'Get project details', inputSchema: { type: 'object', properties: { project_id: { type: 'number' } }, required: ['project_id'] } },
        { name: 'create_project', description: 'Create a project', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, name: { type: 'string' }, body: { type: 'string' } }, required: ['owner', 'repo', 'name'] } },
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const args = request.params.arguments as any;
      try {
        switch (request.params.name) {
          // REPOSITORY MANAGEMENT
          case 'list_repos': return await this.listRepos(args);
          case 'get_repo': return await this.getRepo(args);
          case 'create_repo': return await this.createRepo(args);
          case 'update_repo': return await this.updateRepo(args);
          case 'delete_repo': return await this.deleteRepo(args);
          case 'list_repo_topics': return await this.listRepoTopics(args);
          case 'replace_repo_topics': return await this.replaceRepoTopics(args);
          case 'list_repo_languages': return await this.listRepoLanguages(args);
          case 'list_repo_tags': return await this.listRepoTags(args);
          case 'list_repo_teams': return await this.listRepoTeams(args);
          case 'transfer_repo': return await this.transferRepo(args);
          case 'enable_automated_security_fixes': return await this.enableAutomatedSecurityFixes(args);
          case 'disable_automated_security_fixes': return await this.disableAutomatedSecurityFixes(args);
          case 'enable_vulnerability_alerts': return await this.enableVulnerabilityAlerts(args);
          case 'disable_vulnerability_alerts': return await this.disableVulnerabilityAlerts(args);
          case 'get_repo_readme': return await this.getRepoReadme(args);
          case 'get_repo_license': return await this.getRepoLicense(args);
          case 'get_repo_community_profile': return await this.getRepoCommunityProfile(args);
          case 'get_repo_stats_contributors': return await this.getRepoStatsContributors(args);
          case 'get_repo_stats_commit_activity': return await this.getRepoStatsCommitActivity(args);

          // BRANCHES
          case 'list_branches': return await this.listBranches(args);
          case 'get_branch': return await this.getBranch(args);
          case 'create_branch': return await this.createBranch(args);
          case 'delete_branch': return await this.deleteBranch(args);
          case 'merge_branch': return await this.mergeBranch(args);
          case 'get_branch_protection': return await this.getBranchProtection(args);
          case 'update_branch_protection': return await this.updateBranchProtection(args);
          case 'delete_branch_protection': return await this.deleteBranchProtection(args);
          case 'get_required_status_checks': return await this.getRequiredStatusChecks(args);
          case 'update_required_status_checks': return await this.updateRequiredStatusChecks(args);
          case 'get_admin_enforcement': return await this.getAdminEnforcement(args);
          case 'set_admin_enforcement': return await this.setAdminEnforcement(args);
          case 'get_pull_request_review_enforcement': return await this.getPullRequestReviewEnforcement(args);
          case 'update_pull_request_review_enforcement': return await this.updatePullRequestReviewEnforcement(args);
          case 'rename_branch': return await this.renameBranch(args);

          // COMMITS
          case 'list_commits': return await this.listCommits(args);
          case 'get_commit': return await this.getCommit(args);
          case 'compare_commits': return await this.compareCommits(args);
          case 'list_commit_comments': return await this.listCommitComments(args);
          case 'create_commit_comment': return await this.createCommitComment(args);
          case 'get_commit_status': return await this.getCommitStatus(args);
          case 'list_commit_statuses': return await this.listCommitStatuses(args);
          case 'create_commit_status': return await this.createCommitStatus(args);
          case 'list_pull_requests_associated_with_commit': return await this.listPullRequestsAssociatedWithCommit(args);
          case 'get_commit_signature_verification': return await this.getCommitSignatureVerification(args);

          // ISSUES
          case 'list_issues': return await this.listIssues(args);
          case 'get_issue': return await this.getIssue(args);
          case 'create_issue': return await this.createIssue(args);
          case 'update_issue': return await this.updateIssue(args);
          case 'lock_issue': return await this.lockIssue(args);
          case 'unlock_issue': return await this.unlockIssue(args);
          case 'add_assignees': return await this.addAssignees(args);
          case 'remove_assignees': return await this.removeAssignees(args);
          case 'add_labels': return await this.addLabels(args);
          case 'remove_label': return await this.removeLabel(args);
          case 'replace_labels': return await this.replaceLabels(args);
          case 'list_issue_comments': return await this.listIssueComments(args);
          case 'create_issue_comment': return await this.createIssueComment(args);
          case 'update_issue_comment': return await this.updateIssueComment(args);
          case 'delete_issue_comment': return await this.deleteIssueComment(args);
          case 'list_issue_events': return await this.listIssueEvents(args);
          case 'list_issue_timeline': return await this.listIssueTimeline(args);
          case 'list_labels': return await this.listLabels(args);
          case 'create_label': return await this.createLabel(args);
          case 'delete_label': return await this.deleteLabel(args);

          // PULL REQUESTS
          case 'list_pull_requests': return await this.listPullRequests(args);
          case 'get_pull_request': return await this.getPullRequest(args);
          case 'create_pull_request': return await this.createPullRequest(args);
          case 'update_pull_request': return await this.updatePullRequest(args);
          case 'merge_pull_request': return await this.mergePullRequest(args);
          case 'get_pull_request_merge_status': return await this.getPullRequestMergeStatus(args);
          case 'list_pull_request_commits': return await this.listPullRequestCommits(args);
          case 'list_pull_request_files': return await this.listPullRequestFiles(args);
          case 'list_pull_request_reviews': return await this.listPullRequestReviews(args);
          case 'get_pull_request_review': return await this.getPullRequestReview(args);
          case 'create_pull_request_review': return await this.createPullRequestReview(args);
          case 'submit_pull_request_review': return await this.submitPullRequestReview(args);
          case 'dismiss_pull_request_review': return await this.dismissPullRequestReview(args);
          case 'list_pull_request_review_comments': return await this.listPullRequestReviewComments(args);
          case 'create_pull_request_review_comment': return await this.createPullRequestReviewComment(args);
          case 'update_pull_request_review_comment': return await this.updatePullRequestReviewComment(args);
          case 'delete_pull_request_review_comment': return await this.deletePullRequestReviewComment(args);
          case 'request_pull_request_reviewers': return await this.requestPullRequestReviewers(args);
          case 'remove_pull_request_reviewers': return await this.removePullRequestReviewers(args);
          case 'update_pull_request_branch': return await this.updatePullRequestBranch(args);
          case 'list_requested_reviewers': return await this.listRequestedReviewers(args);
          case 'check_pull_request_reviewability': return await this.checkPullRequestReviewability(args);
          case 'get_pull_request_diff': return await this.getPullRequestDiff(args);
          case 'get_pull_request_patch': return await this.getPullRequestPatch(args);
          case 'convert_issue_to_pull_request': return await this.convertIssueToPullRequest(args);

          // GITHUB ACTIONS
          case 'list_workflows': return await this.listWorkflows(args);
          case 'get_workflow': return await this.getWorkflow(args);
          case 'disable_workflow': return await this.disableWorkflow(args);
          case 'enable_workflow': return await this.enableWorkflow(args);
          case 'create_workflow_dispatch': return await this.createWorkflowDispatch(args);
          case 'list_workflow_runs': return await this.listWorkflowRuns(args);
          case 'get_workflow_run': return await this.getWorkflowRun(args);
          case 'cancel_workflow_run': return await this.cancelWorkflowRun(args);
          case 'rerun_workflow': return await this.rerunWorkflow(args);
          case 'rerun_failed_jobs': return await this.rerunFailedJobs(args);
          case 'delete_workflow_run': return await this.deleteWorkflowRun(args);
          case 'list_workflow_run_artifacts': return await this.listWorkflowRunArtifacts(args);
          case 'download_workflow_run_logs': return await this.downloadWorkflowRunLogs(args);
          case 'delete_workflow_run_logs': return await this.deleteWorkflowRunLogs(args);
          case 'list_workflow_run_jobs': return await this.listWorkflowRunJobs(args);
          case 'get_workflow_run_job': return await this.getWorkflowRunJob(args);
          case 'download_job_logs': return await this.downloadJobLogs(args);
          case 'list_repo_secrets': return await this.listRepoSecrets(args);
          case 'create_or_update_repo_secret': return await this.createOrUpdateRepoSecret(args);
          case 'delete_repo_secret': return await this.deleteRepoSecret(args);

          // RELEASES
          case 'list_releases': return await this.listReleases(args);
          case 'get_release': return await this.getRelease(args);
          case 'get_latest_release': return await this.getLatestRelease(args);
          case 'get_release_by_tag': return await this.getReleaseByTag(args);
          case 'create_release': return await this.createRelease(args);
          case 'update_release': return await this.updateRelease(args);
          case 'delete_release': return await this.deleteRelease(args);
          case 'list_release_assets': return await this.listReleaseAssets(args);
          case 'get_release_asset': return await this.getReleaseAsset(args);
          case 'update_release_asset': return await this.updateReleaseAsset(args);
          case 'delete_release_asset': return await this.deleteReleaseAsset(args);
          case 'generate_release_notes': return await this.generateReleaseNotes(args);

          // FILES & CONTENT
          case 'get_content': return await this.getContent(args);
          case 'create_or_update_file': return await this.createOrUpdateFile(args);
          case 'delete_file': return await this.deleteFile(args);
          case 'get_archive': return await this.getArchive(args);
          case 'list_repo_contributors': return await this.listRepoContributors(args);
          case 'get_repo_clones': return await this.getRepoClones(args);
          case 'get_repo_views': return await this.getRepoViews(args);
          case 'get_repo_top_paths': return await this.getRepoTopPaths(args);
          case 'get_repo_top_referrers': return await this.getRepoTopReferrers(args);
          case 'create_tree': return await this.createTree(args);
          case 'get_tree': return await this.getTree(args);
          case 'get_blob': return await this.getBlob(args);
          case 'create_blob': return await this.createBlob(args);
          case 'create_commit': return await this.createCommit(args);
          case 'get_ref': return await this.getRef(args);

          // COLLABORATORS & PERMISSIONS
          case 'list_collaborators': return await this.listCollaborators(args);
          case 'check_collaborator': return await this.checkCollaborator(args);
          case 'add_collaborator': return await this.addCollaborator(args);
          case 'remove_collaborator': return await this.removeCollaborator(args);
          case 'get_collaborator_permission': return await this.getCollaboratorPermission(args);
          case 'list_invitations': return await this.listInvitations(args);
          case 'update_invitation': return await this.updateInvitation(args);
          case 'delete_invitation': return await this.deleteInvitation(args);
          case 'list_deploy_keys': return await this.listDeployKeys(args);
          case 'create_deploy_key': return await this.createDeployKey(args);

          // WEBHOOKS
          case 'list_webhooks': return await this.listWebhooks(args);
          case 'get_webhook': return await this.getWebhook(args);
          case 'create_webhook': return await this.createWebhook(args);
          case 'update_webhook': return await this.updateWebhook(args);
          case 'delete_webhook': return await this.deleteWebhook(args);
          case 'ping_webhook': return await this.pingWebhook(args);
          case 'test_webhook': return await this.testWebhook(args);
          case 'list_webhook_deliveries': return await this.listWebhookDeliveries(args);

          // ORGANIZATIONS & TEAMS
          case 'list_user_orgs': return await this.listUserOrgs(args);
          case 'get_org': return await this.getOrg(args);
          case 'update_org': return await this.updateOrg(args);
          case 'list_org_members': return await this.listOrgMembers(args);
          case 'check_org_membership': return await this.checkOrgMembership(args);
          case 'remove_org_member': return await this.removeOrgMember(args);
          case 'list_org_teams': return await this.listOrgTeams(args);
          case 'get_team': return await this.getTeam(args);
          case 'create_team': return await this.createTeam(args);
          case 'update_team': return await this.updateTeam(args);
          case 'delete_team': return await this.deleteTeam(args);
          case 'list_team_members': return await this.listTeamMembers(args);

          // SEARCH
          case 'search_repositories': return await this.searchRepositories(args);
          case 'search_code': return await this.searchCode(args);
          case 'search_issues': return await this.searchIssues(args);
          case 'search_users': return await this.searchUsers(args);
          case 'search_commits': return await this.searchCommits(args);
          case 'search_topics': return await this.searchTopics(args);

          // USERS
          case 'get_authenticated_user': return await this.getAuthenticatedUser(args);
          case 'get_user': return await this.getUser(args);
          case 'update_authenticated_user': return await this.updateAuthenticatedUser(args);
          case 'list_user_repos': return await this.listUserRepos(args);
          case 'list_user_followers': return await this.listUserFollowers(args);
          case 'list_user_following': return await this.listUserFollowing(args);
          case 'check_following': return await this.checkFollowing(args);
          case 'list_user_gists': return await this.listUserGists(args);

          // GISTS
          case 'list_gists': return await this.listGists(args);
          case 'get_gist': return await this.getGist(args);
          case 'create_gist': return await this.createGist(args);
          case 'update_gist': return await this.updateGist(args);
          case 'delete_gist': return await this.deleteGist(args);
          case 'star_gist': return await this.starGist(args);
          case 'unstar_gist': return await this.unstarGist(args);
          case 'check_gist_star': return await this.checkGistStar(args);
          case 'fork_gist': return await this.forkGist(args);
          case 'list_gist_commits': return await this.listGistCommits(args);

          // MILESTONES & PROJECTS
          case 'list_milestones': return await this.listMilestones(args);
          case 'get_milestone': return await this.getMilestone(args);
          case 'create_milestone': return await this.createMilestone(args);
          case 'update_milestone': return await this.updateMilestone(args);
          case 'delete_milestone': return await this.deleteMilestone(args);
          case 'list_projects': return await this.listProjects(args);
          case 'get_project': return await this.getProject(args);
          case 'create_project': return await this.createProject(args);

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


  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/github-mcp server running on stdio');
    console.error('199 GitHub tools available');
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
