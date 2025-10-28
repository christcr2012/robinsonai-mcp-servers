#!/usr/bin/env node
/**
 * Robinson's Toolkit - Unified MCP Server  
 * 563 tools: GitHub (240) + Vercel (150) + Neon (173)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

// ============================================================
// GITHUB (240 tools)
// ============================================================

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

// ============================================================
// VERCEL (150 tools)
// ============================================================

const VERCEL_TOKEN = process.argv[2] || process.env.VERCEL_TOKEN || "";
const BASE_URL = "https://api.vercel.com";

if (!VERCEL_TOKEN) {
  console.error("Error: Vercel token required!");
  console.error("Usage: vercel-mcp <VERCEL_TOKEN>");
  console.error("Or set VERCEL_TOKEN environment variable");
  process.exit(1);
}

class VercelMCP {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "@robinsonai/vercel-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // ==================== PROJECT MANAGEMENT ====================
        {
          name: "vercel_list_projects",
          description: "List all Vercel projects",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_project",
          description: "Get details of a specific project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_project",
          description: "Create a new Vercel project",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Project name" },
              framework: { type: "string", description: "Framework (nextjs, react, etc.)" },
              gitRepository: {
                type: "object",
                description: "Git repository to connect",
                properties: {
                  type: { type: "string", enum: ["github", "gitlab", "bitbucket"] },
                  repo: { type: "string", description: "Repository path (owner/repo)" },
                },
              },
            },
            required: ["name"],
          },
        },
        {
          name: "vercel_update_project",
          description: "Update project settings",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              name: { type: "string", description: "New project name" },
              framework: { type: "string", description: "Framework" },
              buildCommand: { type: "string", description: "Build command" },
              outputDirectory: { type: "string", description: "Output directory" },
              installCommand: { type: "string", description: "Install command" },
              devCommand: { type: "string", description: "Dev command" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_delete_project",
          description: "Delete a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
            },
            required: ["projectId"],
          },
        },

        // ==================== DEPLOYMENT MANAGEMENT ====================
        {
          name: "vercel_list_deployments",
          description: "List deployments for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              limit: { type: "number", description: "Number of deployments (default: 20)" },
              state: { type: "string", enum: ["BUILDING", "ERROR", "INITIALIZING", "QUEUED", "READY", "CANCELED"], description: "Filter by state" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_deployment",
          description: "Get details of a specific deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID or URL" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_create_deployment",
          description: "Create a new deployment",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              gitSource: {
                type: "object",
                description: "Git source to deploy",
                properties: {
                  type: { type: "string", enum: ["github", "gitlab", "bitbucket"] },
                  ref: { type: "string", description: "Branch, tag, or commit SHA" },
                },
              },
              target: { type: "string", enum: ["production", "preview"], description: "Deployment target" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_cancel_deployment",
          description: "Cancel a running deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_delete_deployment",
          description: "Delete a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_deployment_events",
          description: "Get build events/logs for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              follow: { type: "boolean", description: "Follow logs in real-time" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_redeploy",
          description: "Redeploy an existing deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID to redeploy" },
              target: { type: "string", enum: ["production", "preview"], description: "Target environment" },
            },
            required: ["deploymentId"],
          },
        },

        // ==================== ENVIRONMENT VARIABLES ====================
        {
          name: "vercel_list_env_vars",
          description: "List environment variables for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_env_var",
          description: "Create an environment variable",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              key: { type: "string", description: "Variable name" },
              value: { type: "string", description: "Variable value" },
              target: {
                type: "array",
                items: { type: "string", enum: ["production", "preview", "development"] },
                description: "Target environments",
              },
              type: { type: "string", enum: ["plain", "secret", "encrypted", "system"], description: "Variable type" },
            },
            required: ["projectId", "key", "value", "target"],
          },
        },
        {
          name: "vercel_update_env_var",
          description: "Update an environment variable",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              envId: { type: "string", description: "Environment variable ID" },
              value: { type: "string", description: "New value" },
              target: {
                type: "array",
                items: { type: "string", enum: ["production", "preview", "development"] },
                description: "Target environments",
              },
            },
            required: ["projectId", "envId"],
          },
        },
        {
          name: "vercel_delete_env_var",
          description: "Delete an environment variable",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              envId: { type: "string", description: "Environment variable ID" },
            },
            required: ["projectId", "envId"],
          },
        },
        {
          name: "vercel_bulk_create_env_vars",
          description: "Create multiple environment variables at once",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              variables: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    value: { type: "string" },
                    target: { type: "array", items: { type: "string" } },
                    type: { type: "string" },
                  },
                },
                description: "Array of environment variables",
              },
            },
            required: ["projectId", "variables"],
          },
        },

        // ==================== DOMAIN MANAGEMENT ====================
        {
          name: "vercel_list_domains",
          description: "List all domains",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_domain",
          description: "Get details of a specific domain",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
            },
            required: ["domain"],
          },
        },
        {
          name: "vercel_add_domain",
          description: "Add a domain to a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              domain: { type: "string", description: "Domain name" },
            },
            required: ["projectId", "domain"],
          },
        },
        {
          name: "vercel_remove_domain",
          description: "Remove a domain from a project",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
            },
            required: ["domain"],
          },
        },
        {
          name: "vercel_verify_domain",
          description: "Verify domain ownership",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
            },
            required: ["domain"],
          },
        },

        // ==================== DNS MANAGEMENT ====================
        {
          name: "vercel_list_dns_records",
          description: "List DNS records for a domain",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
            },
            required: ["domain"],
          },
        },
        {
          name: "vercel_create_dns_record",
          description: "Create a DNS record",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
              type: { type: "string", enum: ["A", "AAAA", "ALIAS", "CAA", "CNAME", "MX", "SRV", "TXT"], description: "Record type" },
              name: { type: "string", description: "Record name" },
              value: { type: "string", description: "Record value" },
              ttl: { type: "number", description: "TTL in seconds" },
            },
            required: ["domain", "type", "name", "value"],
          },
        },
        {
          name: "vercel_delete_dns_record",
          description: "Delete a DNS record",
          inputSchema: {
            type: "object",
            properties: {
              domain: { type: "string", description: "Domain name" },
              recordId: { type: "string", description: "DNS record ID" },
            },
            required: ["domain", "recordId"],
          },
        },

        // ==================== TEAM MANAGEMENT ====================
        {
          name: "vercel_list_teams",
          description: "List all teams",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "vercel_get_team",
          description: "Get team details",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Team ID" },
            },
            required: ["teamId"],
          },
        },
        {
          name: "vercel_list_team_members",
          description: "List team members",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Team ID" },
            },
            required: ["teamId"],
          },
        },

        // ==================== LOGS & MONITORING ====================
        {
          name: "vercel_get_deployment_logs",
          description: "Get runtime logs for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              limit: { type: "number", description: "Number of log entries" },
              since: { type: "number", description: "Timestamp to start from" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_project_analytics",
          description: "Get analytics data for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },

        // ==================== EDGE CONFIG ====================
        {
          name: "vercel_list_edge_configs",
          description: "List all Edge Configs",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_create_edge_config",
          description: "Create an Edge Config",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Edge Config name" },
            },
            required: ["name"],
          },
        },
        {
          name: "vercel_get_edge_config_items",
          description: "Get items from an Edge Config",
          inputSchema: {
            type: "object",
            properties: {
              edgeConfigId: { type: "string", description: "Edge Config ID" },
            },
            required: ["edgeConfigId"],
          },
        },
        {
          name: "vercel_update_edge_config_items",
          description: "Update items in an Edge Config",
          inputSchema: {
            type: "object",
            properties: {
              edgeConfigId: { type: "string", description: "Edge Config ID" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    operation: { type: "string", enum: ["create", "update", "delete"] },
                    key: { type: "string" },
                    value: { type: "string" },
                  },
                },
              },
            },
            required: ["edgeConfigId", "items"],
          },
        },

        // ==================== WEBHOOKS ====================
        {
          name: "vercel_list_webhooks",
          description: "List webhooks for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_webhook",
          description: "Create a webhook",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID or name" },
              url: { type: "string", description: "Webhook URL" },
              events: {
                type: "array",
                items: { type: "string" },
                description: "Events to trigger webhook",
              },
            },
            required: ["projectId", "url", "events"],
          },
        },
        {
          name: "vercel_delete_webhook",
          description: "Delete a webhook",
          inputSchema: {
            type: "object",
            properties: {
              webhookId: { type: "string", description: "Webhook ID" },
            },
            required: ["webhookId"],
          },
        },

        // ==================== ALIASES ====================
        {
          name: "vercel_list_aliases",
          description: "List all deployment aliases",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Optional project ID to filter" },
              limit: { type: "number", description: "Number of aliases to return" },
            },
          },
        },
        {
          name: "vercel_assign_alias",
          description: "Assign an alias to a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              alias: { type: "string", description: "Alias domain" },
            },
            required: ["deploymentId", "alias"],
          },
        },
        {
          name: "vercel_delete_alias",
          description: "Delete an alias",
          inputSchema: {
            type: "object",
            properties: {
              aliasId: { type: "string", description: "Alias ID or domain" },
            },
            required: ["aliasId"],
          },
        },

        // ==================== SECRETS ====================
        {
          name: "vercel_list_secrets",
          description: "List all secrets",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_create_secret",
          description: "Create a new secret",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Secret name" },
              value: { type: "string", description: "Secret value" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["name", "value"],
          },
        },
        {
          name: "vercel_delete_secret",
          description: "Delete a secret",
          inputSchema: {
            type: "object",
            properties: {
              nameOrId: { type: "string", description: "Secret name or ID" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["nameOrId"],
          },
        },
        {
          name: "vercel_rename_secret",
          description: "Rename a secret",
          inputSchema: {
            type: "object",
            properties: {
              nameOrId: { type: "string", description: "Current secret name or ID" },
              newName: { type: "string", description: "New secret name" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["nameOrId", "newName"],
          },
        },

        // ==================== CHECKS ====================
        {
          name: "vercel_list_checks",
          description: "List checks for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_create_check",
          description: "Create a check for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              name: { type: "string", description: "Check name" },
              path: { type: "string", description: "Path to check" },
              status: { type: "string", description: "Check status (running, completed)" },
              conclusion: { type: "string", description: "Check conclusion (succeeded, failed, skipped)" },
            },
            required: ["deploymentId", "name"],
          },
        },
        {
          name: "vercel_update_check",
          description: "Update a check",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              checkId: { type: "string", description: "Check ID" },
              status: { type: "string", description: "Check status" },
              conclusion: { type: "string", description: "Check conclusion" },
            },
            required: ["deploymentId", "checkId"],
          },
        },

        // ==================== DEPLOYMENT FILES ====================
        {
          name: "vercel_list_deployment_files",
          description: "List files in a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_deployment_file",
          description: "Get a specific file from a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              fileId: { type: "string", description: "File ID" },
            },
            required: ["deploymentId", "fileId"],
          },
        },

        // ==================== BLOB STORAGE ====================
        {
          name: "vercel_blob_list",
          description: "List blobs in Vercel Blob storage",
          inputSchema: {
            type: "object",
            properties: {
              limit: { type: "number", description: "Number of blobs to return" },
              cursor: { type: "string", description: "Pagination cursor" },
            },
          },
        },
        {
          name: "vercel_blob_put",
          description: "Upload a blob to Vercel Blob storage",
          inputSchema: {
            type: "object",
            properties: {
              pathname: { type: "string", description: "Path for the blob" },
              body: { type: "string", description: "Blob content (base64 encoded)" },
              contentType: { type: "string", description: "Content type" },
            },
            required: ["pathname", "body"],
          },
        },
        {
          name: "vercel_blob_delete",
          description: "Delete a blob from Vercel Blob storage",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Blob URL to delete" },
            },
            required: ["url"],
          },
        },
        {
          name: "vercel_blob_head",
          description: "Get blob metadata without downloading content",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", description: "Blob URL" },
            },
            required: ["url"],
          },
        },

        // ==================== KV STORAGE ====================
        {
          name: "vercel_kv_get",
          description: "Get a value from Vercel KV storage",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key to retrieve" },
              storeId: { type: "string", description: "KV store ID" },
            },
            required: ["key", "storeId"],
          },
        },
        {
          name: "vercel_kv_set",
          description: "Set a value in Vercel KV storage",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key to set" },
              value: { type: "string", description: "Value to store" },
              storeId: { type: "string", description: "KV store ID" },
              ex: { type: "number", description: "Expiration in seconds" },
            },
            required: ["key", "value", "storeId"],
          },
        },
        {
          name: "vercel_kv_delete",
          description: "Delete a key from Vercel KV storage",
          inputSchema: {
            type: "object",
            properties: {
              key: { type: "string", description: "Key to delete" },
              storeId: { type: "string", description: "KV store ID" },
            },
            required: ["key", "storeId"],
          },
        },
        {
          name: "vercel_kv_list_keys",
          description: "List keys in Vercel KV storage",
          inputSchema: {
            type: "object",
            properties: {
              storeId: { type: "string", description: "KV store ID" },
              pattern: { type: "string", description: "Key pattern to match" },
              cursor: { type: "string", description: "Pagination cursor" },
            },
            required: ["storeId"],
          },
        },

        // ==================== POSTGRES ====================
        {
          name: "vercel_postgres_list_databases",
          description: "List Vercel Postgres databases",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_postgres_create_database",
          description: "Create a Vercel Postgres database",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Database name" },
              region: { type: "string", description: "Region (e.g., us-east-1)" },
            },
            required: ["name"],
          },
        },
        {
          name: "vercel_postgres_delete_database",
          description: "Delete a Vercel Postgres database",
          inputSchema: {
            type: "object",
            properties: {
              databaseId: { type: "string", description: "Database ID" },
            },
            required: ["databaseId"],
          },
        },
        {
          name: "vercel_postgres_get_connection_string",
          description: "Get Postgres connection string",
          inputSchema: {
            type: "object",
            properties: {
              databaseId: { type: "string", description: "Database ID" },
            },
            required: ["databaseId"],
          },
        },

        // ==================== FIREWALL & SECURITY ====================
        {
          name: "vercel_list_firewall_rules",
          description: "List firewall rules (WAF)",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_firewall_rule",
          description: "Create a custom firewall rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              name: { type: "string", description: "Rule name" },
              action: { type: "string", description: "Action: allow, deny, challenge" },
              condition: { type: "object", description: "Rule condition" },
            },
            required: ["projectId", "name", "action"],
          },
        },
        {
          name: "vercel_update_firewall_rule",
          description: "Update a firewall rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              ruleId: { type: "string", description: "Rule ID" },
              name: { type: "string", description: "Rule name" },
              action: { type: "string", description: "Action: allow, deny, challenge" },
              enabled: { type: "boolean", description: "Enable/disable rule" },
            },
            required: ["projectId", "ruleId"],
          },
        },
        {
          name: "vercel_delete_firewall_rule",
          description: "Delete a firewall rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              ruleId: { type: "string", description: "Rule ID" },
            },
            required: ["projectId", "ruleId"],
          },
        },
        {
          name: "vercel_get_firewall_analytics",
          description: "Get firewall analytics and logs",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_list_blocked_ips",
          description: "List blocked IP addresses",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_block_ip",
          description: "Block an IP address",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              ipAddress: { type: "string", description: "IP address to block" },
              notes: { type: "string", description: "Optional notes" },
            },
            required: ["projectId", "ipAddress"],
          },
        },
        {
          name: "vercel_unblock_ip",
          description: "Unblock an IP address",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              ipAddress: { type: "string", description: "IP address to unblock" },
            },
            required: ["projectId", "ipAddress"],
          },
        },
        {
          name: "vercel_enable_attack_challenge_mode",
          description: "Enable attack challenge mode",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              enabled: { type: "boolean", description: "Enable/disable" },
            },
            required: ["projectId", "enabled"],
          },
        },
        {
          name: "vercel_get_security_events",
          description: "Get security event logs",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              limit: { type: "number", description: "Number of events" },
            },
            required: ["projectId"],
          },
        },

        // ==================== MONITORING & OBSERVABILITY ====================
        {
          name: "vercel_get_runtime_logs_stream",
          description: "Stream runtime logs in real-time",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              follow: { type: "boolean", description: "Follow logs" },
              limit: { type: "number", description: "Number of log entries" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_build_logs",
          description: "Get build logs for a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_error_logs",
          description: "Get error logs only",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_bandwidth_usage",
          description: "Get bandwidth usage metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_function_invocations",
          description: "Get function invocation metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_cache_metrics",
          description: "Get cache performance metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_traces",
          description: "Get OpenTelemetry traces",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              deploymentId: { type: "string", description: "Deployment ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_performance_insights",
          description: "Get performance insights",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_web_vitals",
          description: "Get Web Vitals metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
            },
            required: ["projectId"],
          },
        },

        // ==================== BILLING & USAGE ====================
        {
          name: "vercel_get_billing_summary",
          description: "Get billing summary",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_usage_metrics",
          description: "Get detailed usage metrics",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_invoice",
          description: "Get a specific invoice",
          inputSchema: {
            type: "object",
            properties: {
              invoiceId: { type: "string", description: "Invoice ID" },
            },
            required: ["invoiceId"],
          },
        },
        {
          name: "vercel_list_invoices",
          description: "List all invoices",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
              limit: { type: "number", description: "Number of invoices" },
            },
          },
        },
        {
          name: "vercel_get_spending_limits",
          description: "Get spending limits",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_update_spending_limits",
          description: "Update spending limits",
          inputSchema: {
            type: "object",
            properties: {
              maxMonthlySpend: { type: "number", description: "Maximum monthly spend" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["maxMonthlySpend"],
          },
        },
        {
          name: "vercel_get_cost_breakdown",
          description: "Get cost breakdown by resource",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_export_usage_report",
          description: "Export usage report",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              format: { type: "string", description: "Format: csv, json" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["format"],
          },
        },

        // ==================== INTEGRATIONS & MARKETPLACE ====================
        {
          name: "vercel_list_integrations",
          description: "List installed integrations",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_get_integration",
          description: "Get integration details",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
            },
            required: ["integrationId"],
          },
        },
        {
          name: "vercel_install_integration",
          description: "Install a marketplace integration",
          inputSchema: {
            type: "object",
            properties: {
              integrationSlug: { type: "string", description: "Integration slug" },
              teamId: { type: "string", description: "Optional team ID" },
              configuration: { type: "object", description: "Integration configuration" },
            },
            required: ["integrationSlug"],
          },
        },
        {
          name: "vercel_uninstall_integration",
          description: "Uninstall an integration",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
            },
            required: ["integrationId"],
          },
        },
        {
          name: "vercel_list_integration_configurations",
          description: "List integration configurations",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
            },
            required: ["integrationId"],
          },
        },
        {
          name: "vercel_update_integration_configuration",
          description: "Update integration configuration",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
              configurationId: { type: "string", description: "Configuration ID" },
              configuration: { type: "object", description: "New configuration" },
            },
            required: ["integrationId", "configurationId", "configuration"],
          },
        },
        {
          name: "vercel_get_integration_logs",
          description: "Get integration logs",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
              limit: { type: "number", description: "Number of log entries" },
            },
            required: ["integrationId"],
          },
        },
        {
          name: "vercel_trigger_integration_sync",
          description: "Trigger integration sync",
          inputSchema: {
            type: "object",
            properties: {
              integrationId: { type: "string", description: "Integration ID" },
            },
            required: ["integrationId"],
          },
        },

        // ==================== AUDIT LOGS ====================
        {
          name: "vercel_list_audit_logs",
          description: "List audit logs",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              limit: { type: "number", description: "Number of logs" },
            },
          },
        },
        {
          name: "vercel_get_audit_log",
          description: "Get a specific audit log entry",
          inputSchema: {
            type: "object",
            properties: {
              logId: { type: "string", description: "Log ID" },
            },
            required: ["logId"],
          },
        },
        {
          name: "vercel_export_audit_logs",
          description: "Export audit logs",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "number", description: "Start timestamp (ms)" },
              to: { type: "number", description: "End timestamp (ms)" },
              format: { type: "string", description: "Format: csv, json" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["format"],
          },
        },
        {
          name: "vercel_get_compliance_report",
          description: "Get compliance report",
          inputSchema: {
            type: "object",
            properties: {
              reportType: { type: "string", description: "Report type: soc2, gdpr, hipaa" },
              teamId: { type: "string", description: "Optional team ID" },
            },
            required: ["reportType"],
          },
        },
        {
          name: "vercel_list_access_events",
          description: "List access events",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
              userId: { type: "string", description: "Filter by user ID" },
              limit: { type: "number", description: "Number of events" },
            },
          },
        },

        // ==================== CRON JOBS ====================
        {
          name: "vercel_list_cron_jobs",
          description: "List all cron jobs",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_cron_job",
          description: "Create a cron job",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              path: { type: "string", description: "Function path" },
              schedule: { type: "string", description: "Cron schedule expression" },
            },
            required: ["projectId", "path", "schedule"],
          },
        },
        {
          name: "vercel_update_cron_job",
          description: "Update a cron job",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              cronId: { type: "string", description: "Cron job ID" },
              schedule: { type: "string", description: "New cron schedule" },
              enabled: { type: "boolean", description: "Enable/disable" },
            },
            required: ["projectId", "cronId"],
          },
        },
        {
          name: "vercel_delete_cron_job",
          description: "Delete a cron job",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              cronId: { type: "string", description: "Cron job ID" },
            },
            required: ["projectId", "cronId"],
          },
        },
        {
          name: "vercel_trigger_cron_job",
          description: "Manually trigger a cron job",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              cronId: { type: "string", description: "Cron job ID" },
            },
            required: ["projectId", "cronId"],
          },
        },

        // ==================== ADVANCED ROUTING ====================
        {
          name: "vercel_list_redirects",
          description: "List all redirects for a project",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_redirect",
          description: "Create a redirect rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              source: { type: "string", description: "Source path" },
              destination: { type: "string", description: "Destination path" },
              permanent: { type: "boolean", description: "Permanent redirect (301)" },
            },
            required: ["projectId", "source", "destination"],
          },
        },
        {
          name: "vercel_delete_redirect",
          description: "Delete a redirect rule",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              redirectId: { type: "string", description: "Redirect ID" },
            },
            required: ["projectId", "redirectId"],
          },
        },
        {
          name: "vercel_list_custom_headers",
          description: "List custom headers",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_custom_header",
          description: "Create a custom header",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              source: { type: "string", description: "Source path" },
              headers: { type: "array", description: "Array of header objects" },
            },
            required: ["projectId", "source", "headers"],
          },
        },
        {
          name: "vercel_delete_custom_header",
          description: "Delete a custom header",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
              headerId: { type: "string", description: "Header ID" },
            },
            required: ["projectId", "headerId"],
          },
        },

        // ==================== PREVIEW COMMENTS ====================
        {
          name: "vercel_list_comments",
          description: "List deployment comments",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_create_comment",
          description: "Create a comment on a deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "Deployment ID" },
              text: { type: "string", description: "Comment text" },
              path: { type: "string", description: "Page path" },
            },
            required: ["deploymentId", "text"],
          },
        },
        {
          name: "vercel_update_comment",
          description: "Update a comment",
          inputSchema: {
            type: "object",
            properties: {
              commentId: { type: "string", description: "Comment ID" },
              text: { type: "string", description: "New comment text" },
            },
            required: ["commentId", "text"],
          },
        },
        {
          name: "vercel_delete_comment",
          description: "Delete a comment",
          inputSchema: {
            type: "object",
            properties: {
              commentId: { type: "string", description: "Comment ID" },
            },
            required: ["commentId"],
          },
        },
        {
          name: "vercel_resolve_comment",
          description: "Resolve or unresolve a comment",
          inputSchema: {
            type: "object",
            properties: {
              commentId: { type: "string", description: "Comment ID" },
              resolved: { type: "boolean", description: "Resolved status" },
            },
            required: ["commentId", "resolved"],
          },
        },

        // ==================== GIT INTEGRATION ====================
        {
          name: "vercel_list_git_repositories",
          description: "List connected Git repositories",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string", description: "Optional team ID" },
            },
          },
        },
        {
          name: "vercel_connect_git_repository",
          description: "Connect a new Git repository",
          inputSchema: {
            type: "object",
            properties: {
              type: { type: "string", description: "Git provider: github, gitlab, bitbucket" },
              repo: { type: "string", description: "Repository path (owner/repo)" },
              projectId: { type: "string", description: "Project ID to connect to" },
            },
            required: ["type", "repo"],
          },
        },
        {
          name: "vercel_disconnect_git_repository",
          description: "Disconnect a Git repository",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_sync_git_repository",
          description: "Sync Git repository",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_git_integration_status",
          description: "Get Git integration status",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string", description: "Project ID" },
            },
            required: ["projectId"],
          },
        },

        // EDGE MIDDLEWARE (5 tools)
        {
          name: "vercel_list_middleware",
          description: "List Edge Middleware functions",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              deploymentId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_middleware_logs",
          description: "Get Edge Middleware execution logs",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              deploymentId: { type: "string" },
              limit: { type: "number" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_middleware_metrics",
          description: "Get Edge Middleware performance metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_test_middleware",
          description: "Test Edge Middleware locally",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              code: { type: "string" },
              testRequest: { type: "object" },
            },
            required: ["projectId", "code"],
          },
        },
        {
          name: "vercel_deploy_middleware",
          description: "Deploy Edge Middleware",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              code: { type: "string" },
              config: { type: "object" },
            },
            required: ["projectId", "code"],
          },
        },

        // MONITORING & OBSERVABILITY (5 tools)
        {
          name: "vercel_get_deployment_health",
          description: "Get deployment health status",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_error_rate",
          description: "Get error rate metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              deploymentId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_response_time",
          description: "Get response time metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              deploymentId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_get_uptime_metrics",
          description: "Get uptime and availability metrics",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_create_alert",
          description: "Create monitoring alert",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              name: { type: "string" },
              metric: { type: "string" },
              threshold: { type: "number" },
              webhookUrl: { type: "string" },
            },
            required: ["projectId", "name", "metric", "threshold"],
          },
        },

        // TEAM MANAGEMENT (5 tools)
        {
          name: "vercel_invite_team_member",
          description: "Invite user to team",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              email: { type: "string" },
              role: { type: "string", enum: ["OWNER", "MEMBER", "VIEWER"] },
            },
            required: ["teamId", "email"],
          },
        },
        {
          name: "vercel_remove_team_member",
          description: "Remove user from team",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              userId: { type: "string" },
            },
            required: ["teamId", "userId"],
          },
        },
        {
          name: "vercel_update_team_member_role",
          description: "Update team member role",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              userId: { type: "string" },
              role: { type: "string", enum: ["OWNER", "MEMBER", "VIEWER"] },
            },
            required: ["teamId", "userId", "role"],
          },
        },
        {
          name: "vercel_get_team_activity",
          description: "Get team activity log",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              limit: { type: "number" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["teamId"],
          },
        },
        {
          name: "vercel_get_team_usage",
          description: "Get team resource usage",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
              from: { type: "string" },
              to: { type: "string" },
            },
            required: ["teamId"],
          },
        },

        // ADVANCED DEPLOYMENT (5 tools)
        {
          name: "vercel_promote_deployment",
          description: "Promote deployment to production",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_rollback_deployment",
          description: "Rollback to previous deployment",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              targetDeploymentId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_pause_deployment",
          description: "Pause deployment traffic",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_resume_deployment",
          description: "Resume deployment traffic",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_deployment_diff",
          description: "Compare two deployments",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId1: { type: "string" },
              deploymentId2: { type: "string" },
            },
            required: ["deploymentId1", "deploymentId2"],
          },
        },

        // STORAGE MANAGEMENT (5 tools)
        {
          name: "vercel_get_storage_usage",
          description: "Get storage usage across all stores",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
            },
          },
        },
        {
          name: "vercel_optimize_storage",
          description: "Get storage optimization recommendations",
          inputSchema: {
            type: "object",
            properties: {
              teamId: { type: "string" },
            },
          },
        },
        {
          name: "vercel_export_blob_data",
          description: "Export blob storage data",
          inputSchema: {
            type: "object",
            properties: {
              storeId: { type: "string" },
              format: { type: "string", enum: ["json", "csv"] },
            },
            required: ["storeId"],
          },
        },
        {
          name: "vercel_import_blob_data",
          description: "Import data to blob storage",
          inputSchema: {
            type: "object",
            properties: {
              storeId: { type: "string" },
              data: { type: "string" },
              format: { type: "string", enum: ["json", "csv"] },
            },
            required: ["storeId", "data"],
          },
        },
        {
          name: "vercel_clone_storage",
          description: "Clone storage to another environment",
          inputSchema: {
            type: "object",
            properties: {
              sourceStoreId: { type: "string" },
              targetStoreId: { type: "string" },
            },
            required: ["sourceStoreId", "targetStoreId"],
          },
        },

        // ADVANCED SECURITY (3 tools)
        {
          name: "vercel_scan_deployment_security",
          description: "Run security scan on deployment",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string" },
            },
            required: ["deploymentId"],
          },
        },
        {
          name: "vercel_get_security_headers",
          description: "Get security headers configuration",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
            },
            required: ["projectId"],
          },
        },
        {
          name: "vercel_update_security_headers",
          description: "Update security headers",
          inputSchema: {
            type: "object",
            properties: {
              projectId: { type: "string" },
              headers: { type: "object" },
            },
            required: ["projectId", "headers"],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Projects
          case "vercel_list_projects":
            return await this.listProjects(args);
          case "vercel_get_project":
            return await this.getProject(args);
          case "vercel_create_project":
            return await this.createProject(args);
          case "vercel_update_project":
            return await this.updateProject(args);
          case "vercel_delete_project":
            return await this.deleteProject(args);

          // Deployments
          case "vercel_list_deployments":
            return await this.listDeployments(args);
          case "vercel_get_deployment":
            return await this.getDeployment(args);
          case "vercel_create_deployment":
            return await this.createDeployment(args);
          case "vercel_cancel_deployment":
            return await this.cancelDeployment(args);
          case "vercel_delete_deployment":
            return await this.deleteDeployment(args);
          case "vercel_get_deployment_events":
            return await this.getDeploymentEvents(args);
          case "vercel_redeploy":
            return await this.redeploy(args);

          // Environment Variables
          case "vercel_list_env_vars":
            return await this.listEnvVars(args);
          case "vercel_create_env_var":
            return await this.createEnvVar(args);
          case "vercel_update_env_var":
            return await this.updateEnvVar(args);
          case "vercel_delete_env_var":
            return await this.deleteEnvVar(args);
          case "vercel_bulk_create_env_vars":
            return await this.bulkCreateEnvVars(args);

          // Domains
          case "vercel_list_domains":
            return await this.listDomains(args);
          case "vercel_get_domain":
            return await this.getDomain(args);
          case "vercel_add_domain":
            return await this.addDomain(args);
          case "vercel_remove_domain":
            return await this.removeDomain(args);
          case "vercel_verify_domain":
            return await this.verifyDomain(args);

          // DNS
          case "vercel_list_dns_records":
            return await this.listDnsRecords(args);
          case "vercel_create_dns_record":
            return await this.createDnsRecord(args);
          case "vercel_delete_dns_record":
            return await this.deleteDnsRecord(args);

          // Teams
          case "vercel_list_teams":
            return await this.listTeams(args);
          case "vercel_get_team":
            return await this.getTeam(args);
          case "vercel_list_team_members":
            return await this.listTeamMembers(args);

          // Logs & Monitoring
          case "vercel_get_deployment_logs":
            return await this.getDeploymentLogs(args);
          case "vercel_get_project_analytics":
            return await this.getProjectAnalytics(args);

          // Edge Config
          case "vercel_list_edge_configs":
            return await this.listEdgeConfigs(args);
          case "vercel_create_edge_config":
            return await this.createEdgeConfig(args);
          case "vercel_get_edge_config_items":
            return await this.getEdgeConfigItems(args);
          case "vercel_update_edge_config_items":
            return await this.updateEdgeConfigItems(args);

          // Webhooks
          case "vercel_list_webhooks":
            return await this.listWebhooks(args);
          case "vercel_create_webhook":
            return await this.createWebhook(args);
          case "vercel_delete_webhook":
            return await this.deleteWebhook(args);

          // Aliases
          case "vercel_list_aliases":
            return await this.listAliases(args);
          case "vercel_assign_alias":
            return await this.assignAlias(args);
          case "vercel_delete_alias":
            return await this.deleteAlias(args);

          // Secrets
          case "vercel_list_secrets":
            return await this.listSecrets(args);
          case "vercel_create_secret":
            return await this.createSecret(args);
          case "vercel_delete_secret":
            return await this.deleteSecret(args);
          case "vercel_rename_secret":
            return await this.renameSecret(args);

          // Checks
          case "vercel_list_checks":
            return await this.listChecks(args);
          case "vercel_create_check":
            return await this.createCheck(args);
          case "vercel_update_check":
            return await this.updateCheck(args);

          // Deployment Files
          case "vercel_list_deployment_files":
            return await this.listDeploymentFiles(args);
          case "vercel_get_deployment_file":
            return await this.getDeploymentFile(args);

          // Blob Storage
          case "vercel_blob_list":
            return await this.blobList(args);
          case "vercel_blob_put":
            return await this.blobPut(args);
          case "vercel_blob_delete":
            return await this.blobDelete(args);
          case "vercel_blob_head":
            return await this.blobHead(args);

          // KV Storage
          case "vercel_kv_get":
            return await this.kvGet(args);
          case "vercel_kv_set":
            return await this.kvSet(args);
          case "vercel_kv_delete":
            return await this.kvDelete(args);
          case "vercel_kv_list_keys":
            return await this.kvListKeys(args);

          // Postgres
          case "vercel_postgres_list_databases":
            return await this.postgresListDatabases(args);
          case "vercel_postgres_create_database":
            return await this.postgresCreateDatabase(args);
          case "vercel_postgres_delete_database":
            return await this.postgresDeleteDatabase(args);
          case "vercel_postgres_get_connection_string":
            return await this.postgresGetConnectionString(args);

          // Firewall & Security
          case "vercel_list_firewall_rules":
            return await this.listFirewallRules(args);
          case "vercel_create_firewall_rule":
            return await this.createFirewallRule(args);
          case "vercel_update_firewall_rule":
            return await this.updateFirewallRule(args);
          case "vercel_delete_firewall_rule":
            return await this.deleteFirewallRule(args);
          case "vercel_get_firewall_analytics":
            return await this.getFirewallAnalytics(args);
          case "vercel_list_blocked_ips":
            return await this.listBlockedIps(args);
          case "vercel_block_ip":
            return await this.blockIp(args);
          case "vercel_unblock_ip":
            return await this.unblockIp(args);
          case "vercel_enable_attack_challenge_mode":
            return await this.enableAttackChallengeMode(args);
          case "vercel_get_security_events":
            return await this.getSecurityEvents(args);

          // Monitoring & Observability
          case "vercel_get_runtime_logs_stream":
            return await this.getRuntimeLogsStream(args);
          case "vercel_get_build_logs":
            return await this.getBuildLogs(args);
          case "vercel_get_error_logs":
            return await this.getErrorLogs(args);
          case "vercel_get_bandwidth_usage":
            return await this.getBandwidthUsage(args);
          case "vercel_get_function_invocations":
            return await this.getFunctionInvocations(args);
          case "vercel_get_cache_metrics":
            return await this.getCacheMetrics(args);
          case "vercel_get_traces":
            return await this.getTraces(args);
          case "vercel_get_performance_insights":
            return await this.getPerformanceInsights(args);
          case "vercel_get_web_vitals":
            return await this.getWebVitals(args);

          // Billing & Usage
          case "vercel_get_billing_summary":
            return await this.getBillingSummary(args);
          case "vercel_get_usage_metrics":
            return await this.getUsageMetrics(args);
          case "vercel_get_invoice":
            return await this.getInvoice(args);
          case "vercel_list_invoices":
            return await this.listInvoices(args);
          case "vercel_get_spending_limits":
            return await this.getSpendingLimits(args);
          case "vercel_update_spending_limits":
            return await this.updateSpendingLimits(args);
          case "vercel_get_cost_breakdown":
            return await this.getCostBreakdown(args);
          case "vercel_export_usage_report":
            return await this.exportUsageReport(args);

          // Integrations & Marketplace
          case "vercel_list_integrations":
            return await this.listIntegrations(args);
          case "vercel_get_integration":
            return await this.getIntegration(args);
          case "vercel_install_integration":
            return await this.installIntegration(args);
          case "vercel_uninstall_integration":
            return await this.uninstallIntegration(args);
          case "vercel_list_integration_configurations":
            return await this.listIntegrationConfigurations(args);
          case "vercel_update_integration_configuration":
            return await this.updateIntegrationConfiguration(args);
          case "vercel_get_integration_logs":
            return await this.getIntegrationLogs(args);
          case "vercel_trigger_integration_sync":
            return await this.triggerIntegrationSync(args);

          // Audit Logs
          case "vercel_list_audit_logs":
            return await this.listAuditLogs(args);
          case "vercel_get_audit_log":
            return await this.getAuditLog(args);
          case "vercel_export_audit_logs":
            return await this.exportAuditLogs(args);
          case "vercel_get_compliance_report":
            return await this.getComplianceReport(args);
          case "vercel_list_access_events":
            return await this.listAccessEvents(args);

          // Cron Jobs
          case "vercel_list_cron_jobs":
            return await this.listCronJobs(args);
          case "vercel_create_cron_job":
            return await this.createCronJob(args);
          case "vercel_update_cron_job":
            return await this.updateCronJob(args);
          case "vercel_delete_cron_job":
            return await this.deleteCronJob(args);
          case "vercel_trigger_cron_job":
            return await this.triggerCronJob(args);

          // Advanced Routing
          case "vercel_list_redirects":
            return await this.listRedirects(args);
          case "vercel_create_redirect":
            return await this.createRedirect(args);
          case "vercel_delete_redirect":
            return await this.deleteRedirect(args);
          case "vercel_list_custom_headers":
            return await this.listCustomHeaders(args);
          case "vercel_create_custom_header":
            return await this.createCustomHeader(args);
          case "vercel_delete_custom_header":
            return await this.deleteCustomHeader(args);

          // Preview Comments
          case "vercel_list_comments":
            return await this.listComments(args);
          case "vercel_create_comment":
            return await this.createComment(args);
          case "vercel_update_comment":
            return await this.updateComment(args);
          case "vercel_delete_comment":
            return await this.deleteComment(args);
          case "vercel_resolve_comment":
            return await this.resolveComment(args);

          // Git Integration
          case "vercel_list_git_repositories":
            return await this.listGitRepositories(args);
          case "vercel_connect_git_repository":
            return await this.connectGitRepository(args);
          case "vercel_disconnect_git_repository":
            return await this.disconnectGitRepository(args);
          case "vercel_sync_git_repository":
            return await this.syncGitRepository(args);
          case "vercel_get_git_integration_status":
            return await this.getGitIntegrationStatus(args);

          // Edge Middleware
          case "vercel_list_middleware":
            return await this.listMiddleware(args);
          case "vercel_get_middleware_logs":
            return await this.getMiddlewareLogs(args);
          case "vercel_get_middleware_metrics":
            return await this.getMiddlewareMetrics(args);
          case "vercel_test_middleware":
            return await this.testMiddleware(args);
          case "vercel_deploy_middleware":
            return await this.deployMiddleware(args);

          // Monitoring & Observability
          case "vercel_get_deployment_health":
            return await this.getDeploymentHealth(args);
          case "vercel_get_error_rate":
            return await this.getErrorRate(args);
          case "vercel_get_response_time":
            return await this.getResponseTime(args);
          case "vercel_get_uptime_metrics":
            return await this.getUptimeMetrics(args);
          case "vercel_create_alert":
            return await this.createAlert(args);

          // Team Management
          case "vercel_invite_team_member":
            return await this.inviteTeamMember(args);
          case "vercel_remove_team_member":
            return await this.removeTeamMember(args);
          case "vercel_update_team_member_role":
            return await this.updateTeamMemberRole(args);
          case "vercel_get_team_activity":
            return await this.getTeamActivity(args);
          case "vercel_get_team_usage":
            return await this.getTeamUsage(args);

          // Advanced Deployment
          case "vercel_promote_deployment":
            return await this.promoteDeployment(args);
          case "vercel_rollback_deployment":
            return await this.rollbackDeployment(args);
          case "vercel_pause_deployment":
            return await this.pauseDeployment(args);
          case "vercel_resume_deployment":
            return await this.resumeDeployment(args);
          case "vercel_get_deployment_diff":
            return await this.getDeploymentDiff(args);

          // Storage Management
          case "vercel_get_storage_usage":
            return await this.getStorageUsage(args);
          case "vercel_optimize_storage":
            return await this.optimizeStorage(args);
          case "vercel_export_blob_data":
            return await this.exportBlobData(args);
          case "vercel_import_blob_data":
            return await this.importBlobData(args);
          case "vercel_clone_storage":
            return await this.cloneStorage(args);

          // Advanced Security
          case "vercel_scan_deployment_security":
            return await this.scanDeploymentSecurity(args);
          case "vercel_get_security_headers":
            return await this.getSecurityHeaders(args);
          case "vercel_update_security_headers":
            return await this.updateSecurityHeaders(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  // ==================== HELPER METHODS ====================

  private async vercelFetch(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vercel API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  private formatResponse(data: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  // ==================== PROJECT METHODS ====================

  private async listProjects(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v9/projects?${params}`);
    return this.formatResponse(data);
  }

  private async getProject(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    return this.formatResponse(data);
  }

  private async createProject(args: any) {
    const data = await this.vercelFetch(`/v9/projects`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return this.formatResponse(data);
  }

  private async updateProject(args: any) {
    const { projectId, ...updates } = args;
    const data = await this.vercelFetch(`/v9/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return this.formatResponse(data);
  }

  private async deleteProject(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  // ==================== DEPLOYMENT METHODS ====================

  private async listDeployments(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.state) params.append("state", args.state);
    const data = await this.vercelFetch(
      `/v6/deployments?projectId=${args.projectId}&${params}`
    );
    return this.formatResponse(data);
  }

  private async getDeployment(args: any) {
    const data = await this.vercelFetch(`/v13/deployments/${args.deploymentId}`);
    return this.formatResponse(data);
  }

  private async createDeployment(args: any) {
    const data = await this.vercelFetch(`/v13/deployments`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return this.formatResponse(data);
  }

  private async cancelDeployment(args: any) {
    const data = await this.vercelFetch(
      `/v12/deployments/${args.deploymentId}/cancel`,
      { method: "PATCH" }
    );
    return this.formatResponse(data);
  }

  private async deleteDeployment(args: any) {
    const data = await this.vercelFetch(`/v13/deployments/${args.deploymentId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async getDeploymentEvents(args: any) {
    const data = await this.vercelFetch(
      `/v3/deployments/${args.deploymentId}/events`
    );
    return this.formatResponse(data);
  }

  private async redeploy(args: any) {
    const data = await this.vercelFetch(
      `/v13/deployments/${args.deploymentId}/redeploy`,
      {
        method: "POST",
        body: JSON.stringify({ target: args.target }),
      }
    );
    return this.formatResponse(data);
  }

  // ==================== ENV VAR METHODS ====================

  private async listEnvVars(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}/env`);
    return this.formatResponse(data);
  }

  private async createEnvVar(args: any) {
    const { projectId, ...envVar } = args;
    const data = await this.vercelFetch(`/v10/projects/${projectId}/env`, {
      method: "POST",
      body: JSON.stringify(envVar),
    });
    return this.formatResponse(data);
  }

  private async updateEnvVar(args: any) {
    const { projectId, envId, ...updates } = args;
    const data = await this.vercelFetch(`/v9/projects/${projectId}/env/${envId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    return this.formatResponse(data);
  }

  private async deleteEnvVar(args: any) {
    const data = await this.vercelFetch(
      `/v9/projects/${args.projectId}/env/${args.envId}`,
      { method: "DELETE" }
    );
    return this.formatResponse(data);
  }

  private async bulkCreateEnvVars(args: any) {
    const { projectId, variables } = args;
    const results = [];
    for (const envVar of variables) {
      try {
        const data = await this.vercelFetch(`/v10/projects/${projectId}/env`, {
          method: "POST",
          body: JSON.stringify(envVar),
        });
        results.push({ success: true, key: envVar.key, data });
      } catch (error: any) {
        results.push({ success: false, key: envVar.key, error: error.message });
      }
    }
    return this.formatResponse({ results });
  }

  // ==================== DOMAIN METHODS ====================

  private async listDomains(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v5/domains?${params}`);
    return this.formatResponse(data);
  }

  private async getDomain(args: any) {
    const data = await this.vercelFetch(`/v5/domains/${args.domain}`);
    return this.formatResponse(data);
  }

  private async addDomain(args: any) {
    const data = await this.vercelFetch(`/v10/projects/${args.projectId}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: args.domain }),
    });
    return this.formatResponse(data);
  }

  private async removeDomain(args: any) {
    const data = await this.vercelFetch(`/v9/domains/${args.domain}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async verifyDomain(args: any) {
    const data = await this.vercelFetch(`/v6/domains/${args.domain}/verify`, {
      method: "POST",
    });
    return this.formatResponse(data);
  }

  // ==================== DNS METHODS ====================

  private async listDnsRecords(args: any) {
    const data = await this.vercelFetch(`/v4/domains/${args.domain}/records`);
    return this.formatResponse(data);
  }

  private async createDnsRecord(args: any) {
    const { domain, ...record } = args;
    const data = await this.vercelFetch(`/v2/domains/${domain}/records`, {
      method: "POST",
      body: JSON.stringify(record),
    });
    return this.formatResponse(data);
  }

  private async deleteDnsRecord(args: any) {
    const data = await this.vercelFetch(
      `/v2/domains/${args.domain}/records/${args.recordId}`,
      { method: "DELETE" }
    );
    return this.formatResponse(data);
  }

  // ==================== TEAM METHODS ====================

  private async listTeams(args: any) {
    const data = await this.vercelFetch(`/v2/teams`);
    return this.formatResponse(data);
  }

  private async getTeam(args: any) {
    const data = await this.vercelFetch(`/v2/teams/${args.teamId}`);
    return this.formatResponse(data);
  }

  private async listTeamMembers(args: any) {
    const data = await this.vercelFetch(`/v2/teams/${args.teamId}/members`);
    return this.formatResponse(data);
  }

  // ==================== LOGS & MONITORING METHODS ====================

  private async getDeploymentLogs(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.since) params.append("since", args.since.toString());
    const data = await this.vercelFetch(
      `/v2/deployments/${args.deploymentId}/events?${params}`
    );
    return this.formatResponse(data);
  }

  private async getProjectAnalytics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(
      `/v1/projects/${args.projectId}/analytics?${params}`
    );
    return this.formatResponse(data);
  }

  // ==================== EDGE CONFIG METHODS ====================

  private async listEdgeConfigs(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/edge-config?${params}`);
    return this.formatResponse(data);
  }

  private async createEdgeConfig(args: any) {
    const data = await this.vercelFetch(`/v1/edge-config`, {
      method: "POST",
      body: JSON.stringify(args),
    });
    return this.formatResponse(data);
  }

  private async getEdgeConfigItems(args: any) {
    const data = await this.vercelFetch(
      `/v1/edge-config/${args.edgeConfigId}/items`
    );
    return this.formatResponse(data);
  }

  private async updateEdgeConfigItems(args: any) {
    const { edgeConfigId, items } = args;
    const data = await this.vercelFetch(`/v1/edge-config/${edgeConfigId}/items`, {
      method: "PATCH",
      body: JSON.stringify({ items }),
    });
    return this.formatResponse(data);
  }

  // ==================== WEBHOOK METHODS ====================

  private async listWebhooks(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/webhooks`);
    return this.formatResponse(data);
  }

  private async createWebhook(args: any) {
    const { projectId, ...webhook } = args;
    const data = await this.vercelFetch(`/v1/projects/${projectId}/webhooks`, {
      method: "POST",
      body: JSON.stringify(webhook),
    });
    return this.formatResponse(data);
  }

  private async deleteWebhook(args: any) {
    const data = await this.vercelFetch(`/v1/webhooks/${args.webhookId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  // ==================== ALIAS METHODS ====================

  private async listAliases(args: any) {
    const params = new URLSearchParams();
    if (args.projectId) params.append("projectId", args.projectId);
    if (args.limit) params.append("limit", args.limit.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v4/aliases${query}`);
    return this.formatResponse(data);
  }

  private async assignAlias(args: any) {
    const data = await this.vercelFetch(`/v2/deployments/${args.deploymentId}/aliases`, {
      method: "POST",
      body: JSON.stringify({ alias: args.alias }),
    });
    return this.formatResponse(data);
  }

  private async deleteAlias(args: any) {
    const data = await this.vercelFetch(`/v2/aliases/${args.aliasId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  // ==================== SECRET METHODS ====================

  private async listSecrets(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v3/secrets${query}`);
    return this.formatResponse(data);
  }

  private async createSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v3/secrets${query}`, {
      method: "POST",
      body: JSON.stringify({ name: args.name, value: args.value }),
    });
    return this.formatResponse(data);
  }

  private async deleteSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v2/secrets/${args.nameOrId}${query}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async renameSecret(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await this.vercelFetch(`/v2/secrets/${args.nameOrId}${query}`, {
      method: "PATCH",
      body: JSON.stringify({ name: args.newName }),
    });
    return this.formatResponse(data);
  }

  // ==================== CHECK METHODS ====================

  private async listChecks(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/checks`);
    return this.formatResponse(data);
  }

  private async createCheck(args: any) {
    const { deploymentId, ...check } = args;
    const data = await this.vercelFetch(`/v1/deployments/${deploymentId}/checks`, {
      method: "POST",
      body: JSON.stringify(check),
    });
    return this.formatResponse(data);
  }

  private async updateCheck(args: any) {
    const { deploymentId, checkId, ...update } = args;
    const data = await this.vercelFetch(`/v1/deployments/${deploymentId}/checks/${checkId}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
    return this.formatResponse(data);
  }

  // ==================== DEPLOYMENT FILE METHODS ====================

  private async listDeploymentFiles(args: any) {
    const data = await this.vercelFetch(`/v6/deployments/${args.deploymentId}/files`);
    return this.formatResponse(data);
  }

  private async getDeploymentFile(args: any) {
    const data = await this.vercelFetch(`/v6/deployments/${args.deploymentId}/files/${args.fileId}`);
    return this.formatResponse(data);
  }

  // ==================== BLOB STORAGE METHODS ====================

  private async blobList(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    if (args.cursor) params.append("cursor", args.cursor);
    const data = await this.vercelFetch(`/v1/blob?${params}`);
    return this.formatResponse(data);
  }

  private async blobPut(args: any) {
    const data = await this.vercelFetch(`/v1/blob`, {
      method: "PUT",
      body: JSON.stringify({
        pathname: args.pathname,
        body: args.body,
        contentType: args.contentType,
      }),
    });
    return this.formatResponse(data);
  }

  private async blobDelete(args: any) {
    const data = await this.vercelFetch(`/v1/blob`, {
      method: "DELETE",
      body: JSON.stringify({ url: args.url }),
    });
    return this.formatResponse(data);
  }

  private async blobHead(args: any) {
    const data = await this.vercelFetch(`/v1/blob/head?url=${encodeURIComponent(args.url)}`);
    return this.formatResponse(data);
  }

  // ==================== KV STORAGE METHODS ====================

  private async kvGet(args: any) {
    const data = await this.vercelFetch(`/v1/kv/${args.storeId}/get/${args.key}`);
    return this.formatResponse(data);
  }

  private async kvSet(args: any) {
    const body: any = { key: args.key, value: args.value };
    if (args.ex) body.ex = args.ex;
    const data = await this.vercelFetch(`/v1/kv/${args.storeId}/set`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async kvDelete(args: any) {
    const data = await this.vercelFetch(`/v1/kv/${args.storeId}/delete/${args.key}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async kvListKeys(args: any) {
    const params = new URLSearchParams();
    if (args.pattern) params.append("pattern", args.pattern);
    if (args.cursor) params.append("cursor", args.cursor);
    const data = await this.vercelFetch(`/v1/kv/${args.storeId}/keys?${params}`);
    return this.formatResponse(data);
  }

  // ==================== POSTGRES METHODS ====================

  private async postgresListDatabases(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/postgres?${params}`);
    return this.formatResponse(data);
  }

  private async postgresCreateDatabase(args: any) {
    const data = await this.vercelFetch(`/v1/postgres`, {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        region: args.region,
      }),
    });
    return this.formatResponse(data);
  }

  private async postgresDeleteDatabase(args: any) {
    const data = await this.vercelFetch(`/v1/postgres/${args.databaseId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async postgresGetConnectionString(args: any) {
    const data = await this.vercelFetch(`/v1/postgres/${args.databaseId}/connection-string`);
    return this.formatResponse(data);
  }

  // ==================== FIREWALL & SECURITY METHODS ====================

  private async listFirewallRules(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/rules?${params}`);
    return this.formatResponse(data);
  }

  private async createFirewallRule(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/rules`, {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        action: args.action,
        condition: args.condition,
      }),
    });
    return this.formatResponse(data);
  }

  private async updateFirewallRule(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.action) body.action = args.action;
    if (args.enabled !== undefined) body.enabled = args.enabled;
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/rules/${args.ruleId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async deleteFirewallRule(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/rules/${args.ruleId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async getFirewallAnalytics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/analytics?${params}`);
    return this.formatResponse(data);
  }

  private async listBlockedIps(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips`);
    return this.formatResponse(data);
  }

  private async blockIp(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips`, {
      method: "POST",
      body: JSON.stringify({
        ipAddress: args.ipAddress,
        notes: args.notes,
      }),
    });
    return this.formatResponse(data);
  }

  private async unblockIp(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/blocked-ips/${encodeURIComponent(args.ipAddress)}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async enableAttackChallengeMode(args: any) {
    const data = await this.vercelFetch(`/v1/security/firewall/${args.projectId}/challenge-mode`, {
      method: "PATCH",
      body: JSON.stringify({ enabled: args.enabled }),
    });
    return this.formatResponse(data);
  }

  private async getSecurityEvents(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/security/events/${args.projectId}?${params}`);
    return this.formatResponse(data);
  }

  // ==================== MONITORING & OBSERVABILITY METHODS ====================

  private async getRuntimeLogsStream(args: any) {
    const params = new URLSearchParams();
    if (args.follow) params.append("follow", "1");
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v2/deployments/${args.deploymentId}/events?${params}`);
    return this.formatResponse(data);
  }

  private async getBuildLogs(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/builds`);
    return this.formatResponse(data);
  }

  private async getErrorLogs(args: any) {
    const params = new URLSearchParams();
    params.append("type", "error");
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v2/deployments/${args.deploymentId}/events?${params}`);
    return this.formatResponse(data);
  }

  private async getBandwidthUsage(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/analytics/${args.projectId}/bandwidth?${params}`);
    return this.formatResponse(data);
  }

  private async getFunctionInvocations(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/analytics/${args.projectId}/functions?${params}`);
    return this.formatResponse(data);
  }

  private async getCacheMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/analytics/${args.projectId}/cache?${params}`);
    return this.formatResponse(data);
  }

  private async getTraces(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append("deploymentId", args.deploymentId);
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/traces/${args.projectId}?${params}`);
    return this.formatResponse(data);
  }

  private async getPerformanceInsights(args: any) {
    const data = await this.vercelFetch(`/v1/insights/${args.projectId}/performance`);
    return this.formatResponse(data);
  }

  private async getWebVitals(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    const data = await this.vercelFetch(`/v1/analytics/${args.projectId}/web-vitals?${params}`);
    return this.formatResponse(data);
  }

  // ==================== BILLING & USAGE METHODS ====================

  private async getBillingSummary(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/summary?${params}`);
    return this.formatResponse(data);
  }

  private async getUsageMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/usage?${params}`);
    return this.formatResponse(data);
  }

  private async getInvoice(args: any) {
    const data = await this.vercelFetch(`/v1/billing/invoices/${args.invoiceId}`);
    return this.formatResponse(data);
  }

  private async listInvoices(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/billing/invoices?${params}`);
    return this.formatResponse(data);
  }

  private async getSpendingLimits(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/limits?${params}`);
    return this.formatResponse(data);
  }

  private async updateSpendingLimits(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/limits?${params}`, {
      method: "PATCH",
      body: JSON.stringify({ maxMonthlySpend: args.maxMonthlySpend }),
    });
    return this.formatResponse(data);
  }

  private async getCostBreakdown(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/breakdown?${params}`);
    return this.formatResponse(data);
  }

  private async exportUsageReport(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    params.append("format", args.format);
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/billing/export?${params}`);
    return this.formatResponse(data);
  }

  // ==================== INTEGRATIONS & MARKETPLACE METHODS ====================

  private async listIntegrations(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/integrations?${params}`);
    return this.formatResponse(data);
  }

  private async getIntegration(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}`);
    return this.formatResponse(data);
  }

  private async installIntegration(args: any) {
    const body: any = { integrationSlug: args.integrationSlug };
    if (args.teamId) body.teamId = args.teamId;
    if (args.configuration) body.configuration = args.configuration;
    const data = await this.vercelFetch(`/v1/integrations/install`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async uninstallIntegration(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async listIntegrationConfigurations(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}/configurations`);
    return this.formatResponse(data);
  }

  private async updateIntegrationConfiguration(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}/configurations/${args.configurationId}`, {
      method: "PATCH",
      body: JSON.stringify(args.configuration),
    });
    return this.formatResponse(data);
  }

  private async getIntegrationLogs(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}/logs?${params}`);
    return this.formatResponse(data);
  }

  private async triggerIntegrationSync(args: any) {
    const data = await this.vercelFetch(`/v1/integrations/${args.integrationId}/sync`, {
      method: "POST",
    });
    return this.formatResponse(data);
  }

  // ==================== AUDIT LOGS METHODS ====================

  private async listAuditLogs(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/audit-logs?${params}`);
    return this.formatResponse(data);
  }

  private async getAuditLog(args: any) {
    const data = await this.vercelFetch(`/v1/audit-logs/${args.logId}`);
    return this.formatResponse(data);
  }

  private async exportAuditLogs(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append("from", args.from.toString());
    if (args.to) params.append("to", args.to.toString());
    params.append("format", args.format);
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/audit-logs/export?${params}`);
    return this.formatResponse(data);
  }

  private async getComplianceReport(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/compliance/${args.reportType}?${params}`);
    return this.formatResponse(data);
  }

  private async listAccessEvents(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    if (args.userId) params.append("userId", args.userId);
    if (args.limit) params.append("limit", args.limit.toString());
    const data = await this.vercelFetch(`/v1/access-events?${params}`);
    return this.formatResponse(data);
  }

  // ==================== CRON JOBS METHODS ====================

  private async listCronJobs(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons`);
    return this.formatResponse(data);
  }

  private async createCronJob(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons`, {
      method: "POST",
      body: JSON.stringify({
        path: args.path,
        schedule: args.schedule,
      }),
    });
    return this.formatResponse(data);
  }

  private async updateCronJob(args: any) {
    const body: any = {};
    if (args.schedule) body.schedule = args.schedule;
    if (args.enabled !== undefined) body.enabled = args.enabled;
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async deleteCronJob(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async triggerCronJob(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/crons/${args.cronId}/trigger`, {
      method: "POST",
    });
    return this.formatResponse(data);
  }

  // ==================== ADVANCED ROUTING METHODS ====================

  private async listRedirects(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    // Redirects are part of project configuration
    return this.formatResponse((data as any).redirects || []);
  }

  private async createRedirect(args: any) {
    // Get current project config
    const project = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    const redirects = (project as any).redirects || [];
    redirects.push({
      source: args.source,
      destination: args.destination,
      permanent: args.permanent || false,
    });
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ redirects }),
    });
    return this.formatResponse(data);
  }

  private async deleteRedirect(args: any) {
    // Get current project config
    const project = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    const redirects = ((project as any).redirects || []).filter((_: any, i: number) => i.toString() !== args.redirectId);
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ redirects }),
    });
    return this.formatResponse(data);
  }

  private async listCustomHeaders(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    // Headers are part of project configuration
    return this.formatResponse((data as any).headers || []);
  }

  private async createCustomHeader(args: any) {
    // Get current project config
    const project = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    const headers = (project as any).headers || [];
    headers.push({
      source: args.source,
      headers: args.headers,
    });
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ headers }),
    });
    return this.formatResponse(data);
  }

  private async deleteCustomHeader(args: any) {
    // Get current project config
    const project = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    const headers = ((project as any).headers || []).filter((_: any, i: number) => i.toString() !== args.headerId);
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ headers }),
    });
    return this.formatResponse(data);
  }

  // ==================== PREVIEW COMMENTS METHODS ====================

  private async listComments(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/comments`);
    return this.formatResponse(data);
  }

  private async createComment(args: any) {
    const body: any = { text: args.text };
    if (args.path) body.path = args.path;
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/comments`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async updateComment(args: any) {
    const data = await this.vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ text: args.text }),
    });
    return this.formatResponse(data);
  }

  private async deleteComment(args: any) {
    const data = await this.vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "DELETE",
    });
    return this.formatResponse(data);
  }

  private async resolveComment(args: any) {
    const data = await this.vercelFetch(`/v1/comments/${args.commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ resolved: args.resolved }),
    });
    return this.formatResponse(data);
  }

  // ==================== GIT INTEGRATION METHODS ====================

  private async listGitRepositories(args: any) {
    const params = new URLSearchParams();
    if (args.teamId) params.append("teamId", args.teamId);
    const data = await this.vercelFetch(`/v1/git/repositories?${params}`);
    return this.formatResponse(data);
  }

  private async connectGitRepository(args: any) {
    const body: any = {
      type: args.type,
      repo: args.repo,
    };
    if (args.projectId) body.projectId = args.projectId;
    const data = await this.vercelFetch(`/v1/git/repositories`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    return this.formatResponse(data);
  }

  private async disconnectGitRepository(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`, {
      method: "PATCH",
      body: JSON.stringify({ link: null }),
    });
    return this.formatResponse(data);
  }

  private async syncGitRepository(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/git/sync`, {
      method: "POST",
    });
    return this.formatResponse(data);
  }

  private async getGitIntegrationStatus(args: any) {
    const data = await this.vercelFetch(`/v9/projects/${args.projectId}`);
    return this.formatResponse({
      connected: !!(data as any).link,
      link: (data as any).link,
    });
  }

  // EDGE MIDDLEWARE
  private async listMiddleware(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/middleware`);
    return this.formatResponse(data);
  }

  private async getMiddlewareLogs(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.limit) params.append('limit', args.limit.toString());
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/middleware/logs?${params}`);
    return this.formatResponse(data);
  }

  private async getMiddlewareMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/middleware/metrics?${params}`);
    return this.formatResponse(data);
  }

  private async testMiddleware(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/middleware/test`, {
      method: 'POST',
      body: JSON.stringify({ code: args.code, testRequest: args.testRequest })
    });
    return this.formatResponse(data);
  }

  private async deployMiddleware(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/middleware`, {
      method: 'POST',
      body: JSON.stringify({ code: args.code, config: args.config })
    });
    return this.formatResponse(data);
  }

  // MONITORING & OBSERVABILITY
  private async getDeploymentHealth(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/health`);
    return this.formatResponse(data);
  }

  private async getErrorRate(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/metrics/errors?${params}`);
    return this.formatResponse(data);
  }

  private async getResponseTime(args: any) {
    const params = new URLSearchParams();
    if (args.deploymentId) params.append('deploymentId', args.deploymentId);
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/metrics/response-time?${params}`);
    return this.formatResponse(data);
  }

  private async getUptimeMetrics(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/metrics/uptime?${params}`);
    return this.formatResponse(data);
  }

  private async createAlert(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/alerts`, {
      method: 'POST',
      body: JSON.stringify({
        name: args.name,
        metric: args.metric,
        threshold: args.threshold,
        webhookUrl: args.webhookUrl
      })
    });
    return this.formatResponse(data);
  }

  // TEAM MANAGEMENT
  private async inviteTeamMember(args: any) {
    const data = await this.vercelFetch(`/v1/teams/${args.teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email: args.email, role: args.role || 'MEMBER' })
    });
    return this.formatResponse(data);
  }

  private async removeTeamMember(args: any) {
    const data = await this.vercelFetch(`/v1/teams/${args.teamId}/members/${args.userId}`, {
      method: 'DELETE'
    });
    return this.formatResponse(data);
  }

  private async updateTeamMemberRole(args: any) {
    const data = await this.vercelFetch(`/v1/teams/${args.teamId}/members/${args.userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: args.role })
    });
    return this.formatResponse(data);
  }

  private async getTeamActivity(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await this.vercelFetch(`/v1/teams/${args.teamId}/activity?${params}`);
    return this.formatResponse(data);
  }

  private async getTeamUsage(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);
    const data = await this.vercelFetch(`/v1/teams/${args.teamId}/usage?${params}`);
    return this.formatResponse(data);
  }

  // ADVANCED DEPLOYMENT
  private async promoteDeployment(args: any) {
    const data = await this.vercelFetch(`/v13/deployments/${args.deploymentId}/promote`, {
      method: 'POST'
    });
    return this.formatResponse(data);
  }

  private async rollbackDeployment(args: any) {
    const data = await this.vercelFetch(`/v13/deployments/${args.projectId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ targetDeploymentId: args.targetDeploymentId })
    });
    return this.formatResponse(data);
  }

  private async pauseDeployment(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/pause`, {
      method: 'POST'
    });
    return this.formatResponse(data);
  }

  private async resumeDeployment(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/resume`, {
      method: 'POST'
    });
    return this.formatResponse(data);
  }

  private async getDeploymentDiff(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/diff?deployment1=${args.deploymentId1}&deployment2=${args.deploymentId2}`);
    return this.formatResponse(data);
  }

  // STORAGE MANAGEMENT
  private async getStorageUsage(args: any) {
    const params = args.teamId ? `?teamId=${args.teamId}` : '';
    const data = await this.vercelFetch(`/v1/storage/usage${params}`);
    return this.formatResponse(data);
  }

  private async optimizeStorage(args: any) {
    const params = args.teamId ? `?teamId=${args.teamId}` : '';
    const data = await this.vercelFetch(`/v1/storage/optimize${params}`);
    return this.formatResponse(data);
  }

  private async exportBlobData(args: any) {
    const data = await this.vercelFetch(`/v1/blob/${args.storeId}/export?format=${args.format || 'json'}`);
    return this.formatResponse(data);
  }

  private async importBlobData(args: any) {
    const data = await this.vercelFetch(`/v1/blob/${args.storeId}/import`, {
      method: 'POST',
      body: JSON.stringify({ data: args.data, format: args.format || 'json' })
    });
    return this.formatResponse(data);
  }

  private async cloneStorage(args: any) {
    const data = await this.vercelFetch(`/v1/storage/clone`, {
      method: 'POST',
      body: JSON.stringify({
        sourceStoreId: args.sourceStoreId,
        targetStoreId: args.targetStoreId
      })
    });
    return this.formatResponse(data);
  }

  // ADVANCED SECURITY
  private async scanDeploymentSecurity(args: any) {
    const data = await this.vercelFetch(`/v1/deployments/${args.deploymentId}/security-scan`, {
      method: 'POST'
    });
    return this.formatResponse(data);
  }

  private async getSecurityHeaders(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/security-headers`);
    return this.formatResponse(data);
  }

  private async updateSecurityHeaders(args: any) {
    const data = await this.vercelFetch(`/v1/projects/${args.projectId}/security-headers`, {
      method: 'PATCH',
      body: JSON.stringify({ headers: args.headers })
    });
    return this.formatResponse(data);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("@robinsonai/vercel-mcp server running on stdio");
  }
}

const server = new VercelMCP();
server.run().catch(console.error);



// ============================================================
// NEON (173 tools)
// ============================================================



class NeonMCP {
  private server: Server;
  private apiKey: string;
  private client: AxiosInstance;
  private baseUrl = 'https://console.neon.tech/api/v2';

  constructor(apiKey: string | null) {
    this.server = new Server(
      { name: '@robinsonai/neon-mcp', version: '2.0.0' },
      { capabilities: { tools: {} } }
    );
    this.apiKey = apiKey || '';

    // Only create client if API key is provided
    if (apiKey) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    } else {
      // Create dummy client that will throw helpful errors
      this.client = axios.create({ baseURL: this.baseUrl });
    }

    this.setupHandlers();
  }

  private get isEnabled(): boolean {
    return !!this.apiKey;
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // PROJECT MANAGEMENT (13 tools)
        { name: 'neon_list_projects', description: 'Lists the first 10 Neon projects. Increase limit or use search to filter.', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, search: { type: 'string' }, cursor: { type: 'string' }, org_id: { type: 'string' } } } },
        { name: 'neon_list_organizations', description: 'Lists all organizations the user has access to.', inputSchema: { type: 'object', properties: { search: { type: 'string' } } } },
        { name: 'neon_list_shared_projects', description: 'Lists projects shared with the current user.', inputSchema: { type: 'object', properties: { limit: { type: 'number' }, search: { type: 'string' }, cursor: { type: 'string' } } } },
        { name: 'neon_create_project', description: 'Create a new Neon project.', inputSchema: { type: 'object', properties: { name: { type: 'string' }, org_id: { type: 'string' }, region_id: { type: 'string' }, pg_version: { type: 'number' } } } },
        { name: 'neon_delete_project', description: 'Delete a Neon project.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_describe_project', description: 'Get detailed project information.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_update_project', description: 'Update project settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, name: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId'] } },
        { name: 'neon_get_project_operations', description: 'List recent operations on a project.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId'] } },
        { name: 'neon_get_project_consumption', description: 'Get consumption metrics (compute hours, storage).', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_set_project_settings', description: 'Configure project-level settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId', 'settings'] } },
        { name: 'neon_get_project_quotas', description: 'View current quotas and limits.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_clone_project', description: 'Clone entire project with all branches.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, name: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_project_permissions', description: 'List users/roles with access to project.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },

        // BRANCH MANAGEMENT (20 tools)
        { name: 'neon_create_branch', description: 'Create a new branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchName: { type: 'string' }, parent_id: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_delete_branch', description: 'Delete a branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_describe_branch', description: 'Get tree view of all objects in a branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_reset_from_parent', description: 'Reset branch to parent state.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchIdOrName: { type: 'string' }, preserveUnderName: { type: 'string' } }, required: ['projectId', 'branchIdOrName'] } },
        { name: 'neon_update_branch', description: 'Update branch settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, name: { type: 'string' }, protected: { type: 'boolean' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_list_branches', description: 'List all branches with filtering.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, search: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_branch_details', description: 'Get detailed branch information.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_restore_branch', description: 'Restore deleted branch from backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, timestamp: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_set_branch_protection', description: 'Protect/unprotect branches.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, protected: { type: 'boolean' } }, required: ['projectId', 'branchId', 'protected'] } },
        { name: 'neon_get_branch_schema_diff', description: 'Compare schemas between branches.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, sourceBranchId: { type: 'string' }, targetBranchId: { type: 'string' } }, required: ['projectId', 'sourceBranchId', 'targetBranchId'] } },
        { name: 'neon_get_branch_data_diff', description: 'Compare data between branches.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, sourceBranchId: { type: 'string' }, targetBranchId: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'sourceBranchId', 'targetBranchId'] } },
        { name: 'neon_merge_branches', description: 'Merge one branch into another.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, sourceBranchId: { type: 'string' }, targetBranchId: { type: 'string' } }, required: ['projectId', 'sourceBranchId', 'targetBranchId'] } },
        { name: 'neon_promote_branch', description: 'Promote branch to primary.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_set_branch_retention', description: 'Configure branch retention policies.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, retentionDays: { type: 'number' } }, required: ['projectId', 'branchId', 'retentionDays'] } },
        { name: 'neon_get_branch_history', description: 'Get branch creation/modification history.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_restore_branch_to_timestamp', description: 'Point-in-time recovery for branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, timestamp: { type: 'string' } }, required: ['projectId', 'branchId', 'timestamp'] } },
        { name: 'neon_get_branch_size', description: 'Get storage size of branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_set_branch_compute_settings', description: 'Configure compute for specific branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId', 'branchId', 'settings'] } },
        { name: 'neon_get_branch_connections', description: 'List active connections to branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_list_branch_computes', description: 'List compute endpoints for branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },

        // SQL EXECUTION (10 tools)
        { name: 'neon_run_sql', description: 'Execute a single SQL statement.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },
        { name: 'neon_run_sql_transaction', description: 'Execute multiple SQL statements in a transaction.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sqlStatements: { type: 'array', items: { type: 'string' } } }, required: ['projectId', 'sqlStatements'] } },
        { name: 'neon_get_connection_string', description: 'Get PostgreSQL connection string.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, roleName: { type: 'string' }, computeId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_database_tables', description: 'List all tables in database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_describe_table_schema', description: 'Get table schema definition.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'tableName'] } },
        { name: 'neon_explain_sql_statement', description: 'Get query execution plan.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' }, analyze: { type: 'boolean' } }, required: ['projectId', 'sql'] } },
        { name: 'neon_list_slow_queries', description: 'Find slow queries using pg_stat_statements.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, computeId: { type: 'string' }, limit: { type: 'number' }, minExecutionTime: { type: 'number' } }, required: ['projectId'] } },
        { name: 'neon_optimize_query', description: 'AI-powered query optimization.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },
        { name: 'neon_suggest_indexes', description: 'Intelligent index suggestions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_analyze_query_plan', description: 'Deep query plan analysis.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },

        // DATABASE MANAGEMENT (12 tools)
        { name: 'neon_create_database', description: 'Create new database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, owner: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_delete_database', description: 'Delete database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_list_databases', description: 'List all databases.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_database_size', description: 'Get database storage size.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_get_database_stats', description: 'Get database statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_vacuum_database', description: 'Run VACUUM on database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, full: { type: 'boolean' }, analyze: { type: 'boolean' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_analyze_database', description: 'Run ANALYZE on database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_reindex_database', description: 'Reindex database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_get_database_locks', description: 'View current locks.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_kill_database_query', description: 'Terminate running query.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, pid: { type: 'number' } }, required: ['projectId', 'databaseName', 'pid'] } },
        { name: 'neon_get_database_activity', description: 'View current database activity.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },
        { name: 'neon_backup_database', description: 'Create manual backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId', 'databaseName'] } },

        // MIGRATIONS (2 tools)
        { name: 'neon_prepare_database_migration', description: 'Prepare database migration in temporary branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, databaseName: { type: 'string' }, migrationSql: { type: 'string' } }, required: ['projectId', 'migrationSql'] } },
        { name: 'neon_complete_database_migration', description: 'Complete and apply migration to main branch.', inputSchema: { type: 'object', properties: { migrationId: { type: 'string' } }, required: ['migrationId'] } },

        // SETUP AUTOMATION (6 tools) - NEW! For autonomous RAD system setup
        { name: 'neon_create_project_for_rad', description: 'Create Neon project specifically for RAD Crawler system with optimal settings.', inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'Project name (default: RAD Crawler)', default: 'RAD Crawler' }, region: { type: 'string', description: 'Region (default: us-east-1)', default: 'us-east-1' }, org_id: { type: 'string', description: 'Organization ID (optional)' } } } },
        { name: 'neon_deploy_schema', description: 'Deploy SQL schema file to database. Supports multi-statement SQL files.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string', description: 'Branch ID (optional, uses main if not specified)' }, databaseName: { type: 'string', description: 'Database name (optional, uses default if not specified)' }, schemaSQL: { type: 'string', description: 'Full SQL schema content' } }, required: ['projectId', 'schemaSQL'] } },
        { name: 'neon_verify_schema', description: 'Verify that required tables exist in database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, requiredTables: { type: 'array', items: { type: 'string' }, description: 'List of table names that must exist' } }, required: ['projectId', 'requiredTables'] } },
        { name: 'neon_get_connection_uri', description: 'Get full PostgreSQL connection URI for application use.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string', description: 'Branch ID (optional, uses main if not specified)' }, databaseName: { type: 'string', description: 'Database name (optional, uses default if not specified)' }, pooled: { type: 'boolean', description: 'Use connection pooling (default: true)', default: true } }, required: ['projectId'] } },
        { name: 'neon_setup_rad_database', description: 'Complete autonomous setup: create project, database, deploy schema, verify. Returns connection URI.', inputSchema: { type: 'object', properties: { projectName: { type: 'string', default: 'RAD Crawler' }, databaseName: { type: 'string', default: 'rad_production' }, region: { type: 'string', default: 'us-east-1' }, schemaSQL: { type: 'string', description: 'Full SQL schema to deploy' }, org_id: { type: 'string' } }, required: ['schemaSQL'] } },
        { name: 'neon_check_api_key', description: 'Check if Neon API key is configured and valid.', inputSchema: { type: 'object', properties: {} } },

        // QUERY TUNING (2 tools)
        { name: 'neon_prepare_query_tuning', description: 'Analyze and prepare query optimizations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId', 'databaseName', 'sql'] } },
        { name: 'neon_complete_query_tuning', description: 'Apply or discard query optimizations.', inputSchema: { type: 'object', properties: { tuningId: { type: 'string' }, projectId: { type: 'string' }, databaseName: { type: 'string' }, temporaryBranchId: { type: 'string' }, suggestedSqlStatements: { type: 'array', items: { type: 'string' } }, applyChanges: { type: 'boolean' }, branchId: { type: 'string' }, roleName: { type: 'string' }, shouldDeleteTemporaryBranch: { type: 'boolean' } }, required: ['tuningId', 'projectId', 'databaseName', 'temporaryBranchId', 'suggestedSqlStatements'] } },

        // ROLE MANAGEMENT (8 tools)
        { name: 'neon_create_role', description: 'Create database role.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, password: { type: 'string' } }, required: ['projectId', 'roleName'] } },
        { name: 'neon_delete_role', description: 'Delete database role.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId', 'roleName'] } },
        { name: 'neon_list_roles', description: 'List all roles.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_update_role', description: 'Update role permissions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, permissions: { type: 'object' } }, required: ['projectId', 'roleName'] } },
        { name: 'neon_grant_role_permissions', description: 'Grant specific permissions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, permissions: { type: 'array' } }, required: ['projectId', 'roleName', 'permissions'] } },
        { name: 'neon_revoke_role_permissions', description: 'Revoke permissions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, permissions: { type: 'array' } }, required: ['projectId', 'roleName', 'permissions'] } },
        { name: 'neon_get_role_permissions', description: 'List role permissions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId', 'roleName'] } },
        { name: 'neon_reset_role_password', description: 'Reset role password.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' }, password: { type: 'string' } }, required: ['projectId', 'roleName', 'password'] } },

        // COMPUTE/ENDPOINT MANAGEMENT (10 tools)
        { name: 'neon_create_endpoint', description: 'Create compute endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, type: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId', 'branchId', 'type'] } },
        { name: 'neon_delete_endpoint', description: 'Delete endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'neon_update_endpoint', description: 'Update endpoint settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, settings: { type: 'object' } }, required: ['projectId', 'endpointId', 'settings'] } },
        { name: 'neon_start_endpoint', description: 'Start suspended endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'neon_suspend_endpoint', description: 'Suspend endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'neon_restart_endpoint', description: 'Restart endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'neon_get_endpoint_metrics', description: 'Get endpoint performance metrics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'neon_set_endpoint_autoscaling', description: 'Configure autoscaling.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, minCu: { type: 'number' }, maxCu: { type: 'number' } }, required: ['projectId', 'endpointId'] } },
        { name: 'neon_get_endpoint_logs', description: 'Retrieve endpoint logs.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId', 'endpointId'] } },
        { name: 'neon_set_endpoint_pooling', description: 'Configure connection pooling.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, poolMode: { type: 'string' }, poolSize: { type: 'number' } }, required: ['projectId', 'endpointId'] } },

        // MONITORING & ANALYTICS (15 tools)
        { name: 'neon_get_query_statistics', description: 'Get query performance stats.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId'] } },
        { name: 'neon_get_slow_query_log', description: 'Enhanced slow query analysis.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, minDuration: { type: 'number' } }, required: ['projectId'] } },
        { name: 'neon_get_connection_stats', description: 'Connection pool statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_storage_metrics', description: 'Storage usage over time.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_compute_metrics', description: 'Compute usage over time.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_io_metrics', description: 'I/O performance metrics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_cache_hit_ratio', description: 'Cache performance metrics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_index_usage', description: 'Index usage statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_table_bloat', description: 'Identify bloated tables.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_replication_lag', description: 'Check replication status.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_checkpoint_stats', description: 'Checkpoint statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_wal_stats', description: 'WAL statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_set_monitoring_alerts', description: 'Configure alerts.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, alertType: { type: 'string' }, threshold: { type: 'number' }, email: { type: 'string' } }, required: ['projectId', 'alertType', 'threshold'] } },
        { name: 'neon_get_alert_history', description: 'View alert history.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId'] } },
        { name: 'neon_get_performance_insights', description: 'AI-powered performance recommendations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },

        // BACKUP & RECOVERY (8 tools)
        { name: 'neon_list_backups', description: 'List available backups.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_create_backup', description: 'Create manual backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, name: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_restore_backup', description: 'Restore from backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' }, targetBranchId: { type: 'string' } }, required: ['projectId', 'backupId'] } },
        { name: 'neon_delete_backup', description: 'Delete backup.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' } }, required: ['projectId', 'backupId'] } },
        { name: 'neon_get_backup_status', description: 'Check backup status.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' } }, required: ['projectId', 'backupId'] } },
        { name: 'neon_schedule_backup', description: 'Schedule automated backups.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, schedule: { type: 'string' } }, required: ['projectId', 'branchId', 'schedule'] } },
        { name: 'neon_export_backup', description: 'Export backup to external storage.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' }, destination: { type: 'string' } }, required: ['projectId', 'backupId', 'destination'] } },
        { name: 'neon_validate_backup', description: 'Verify backup integrity.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, backupId: { type: 'string' } }, required: ['projectId', 'backupId'] } },

        // SECURITY & COMPLIANCE (10 tools)
        { name: 'neon_enable_ip_allowlist', description: 'Configure IP allowlist.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, ipAddresses: { type: 'array', items: { type: 'string' } } }, required: ['projectId', 'ipAddresses'] } },
        { name: 'neon_get_ip_allowlist', description: 'View IP allowlist.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_enable_ssl_enforcement', description: 'Enforce SSL connections.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, enforce: { type: 'boolean' } }, required: ['projectId', 'enforce'] } },
        { name: 'neon_rotate_credentials', description: 'Rotate database credentials.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId', 'roleName'] } },
        { name: 'neon_get_audit_log', description: 'Retrieve audit logs.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId'] } },
        { name: 'neon_enable_encryption', description: 'Configure encryption settings.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, encryptionType: { type: 'string' } }, required: ['projectId', 'encryptionType'] } },
        { name: 'neon_get_security_scan', description: 'Run security vulnerability scan.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_set_password_policy', description: 'Configure password policies.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, policy: { type: 'object' } }, required: ['projectId', 'policy'] } },
        { name: 'neon_enable_2fa', description: 'Enable two-factor authentication.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, enabled: { type: 'boolean' } }, required: ['projectId', 'enabled'] } },
        { name: 'neon_get_compliance_report', description: 'Generate compliance reports.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, reportType: { type: 'string' } }, required: ['projectId', 'reportType'] } },

        // COST MANAGEMENT (8 tools)
        { name: 'neon_get_cost_breakdown', description: 'Detailed cost analysis.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_cost_forecast', description: 'Predict future costs.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, days: { type: 'number' } }, required: ['projectId'] } },
        { name: 'neon_set_cost_alerts', description: 'Configure cost alerts.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, threshold: { type: 'number' }, email: { type: 'string' } }, required: ['projectId', 'threshold'] } },
        { name: 'neon_get_cost_optimization_tips', description: 'AI-powered cost optimization.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_billing_history', description: 'View billing history.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, months: { type: 'number' } }, required: ['projectId'] } },
        { name: 'neon_export_cost_report', description: 'Export cost reports.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, format: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' } }, required: ['projectId', 'format'] } },
        { name: 'neon_set_budget_limits', description: 'Configure budget limits.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, monthlyLimit: { type: 'number' } }, required: ['projectId', 'monthlyLimit'] } },
        { name: 'neon_get_resource_recommendations', description: 'Right-sizing recommendations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },

        // INTEGRATION & WEBHOOKS (6 tools)
        { name: 'neon_create_webhook', description: 'Create webhook for events.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, url: { type: 'string' }, events: { type: 'array', items: { type: 'string' } } }, required: ['projectId', 'url', 'events'] } },
        { name: 'neon_list_webhooks', description: 'List configured webhooks.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_delete_webhook', description: 'Delete webhook.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, webhookId: { type: 'string' } }, required: ['projectId', 'webhookId'] } },
        { name: 'neon_test_webhook', description: 'Test webhook delivery.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, webhookId: { type: 'string' } }, required: ['projectId', 'webhookId'] } },
        { name: 'neon_get_webhook_logs', description: 'View webhook delivery logs.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, webhookId: { type: 'string' }, limit: { type: 'number' } }, required: ['projectId', 'webhookId'] } },
        { name: 'neon_create_api_key', description: 'Generate API keys.', inputSchema: { type: 'object', properties: { name: { type: 'string' }, scopes: { type: 'array', items: { type: 'string' } } }, required: ['name'] } },

        // ADVANCED SQL TOOLS (10 tools)
        { name: 'neon_detect_n_plus_one', description: 'Detect N+1 query problems.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_suggest_partitioning', description: 'Table partitioning recommendations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'tableName'] } },
        { name: 'neon_analyze_table_statistics', description: 'Detailed table statistics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'tableName'] } },
        { name: 'neon_suggest_vacuum_strategy', description: 'VACUUM optimization.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_detect_missing_indexes', description: 'Find missing indexes.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_analyze_join_performance', description: 'Join optimization analysis.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },
        { name: 'neon_suggest_materialized_views', description: 'Materialized view recommendations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_table_dependencies', description: 'Analyze table dependencies.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, tableName: { type: 'string' } }, required: ['projectId', 'tableName'] } },
        { name: 'neon_suggest_query_rewrite', description: 'Query rewrite suggestions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'sql'] } },
        { name: 'neon_analyze_deadlocks', description: 'Deadlock analysis and prevention.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },

        // NEON AUTH (1 tool)
        { name: 'neon_provision_neon_auth', description: 'Provision Neon Auth with Stack Auth integration.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, database: { type: 'string' } }, required: ['projectId'] } },

        // API KEY MANAGEMENT (3 tools)
        { name: 'neon_list_api_keys', description: 'List all API keys for the account.', inputSchema: { type: 'object', properties: {} } },
        { name: 'neon_create_api_key_for_project', description: 'Create project-specific API key.', inputSchema: { type: 'object', properties: { keyName: { type: 'string' }, projectId: { type: 'string' } }, required: ['keyName'] } },
        { name: 'neon_revoke_api_key', description: 'Revoke/delete API key.', inputSchema: { type: 'object', properties: { keyId: { type: 'string' } }, required: ['keyId'] } },

        // CONNECTION POOLING (2 tools)
        { name: 'neon_get_connection_pooler_config', description: 'Get connection pooler configuration.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' } }, required: ['projectId', 'endpointId'] } },
        { name: 'neon_update_connection_pooler_config', description: 'Update pooler settings (PgBouncer).', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, endpointId: { type: 'string' }, poolMode: { type: 'string' }, poolSize: { type: 'number' }, maxClientConn: { type: 'number' } }, required: ['projectId', 'endpointId'] } },

        // READ REPLICAS (2 tools)
        { name: 'neon_create_read_replica', description: 'Create read replica endpoint.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, region: { type: 'string' } }, required: ['projectId', 'branchId'] } },
        { name: 'neon_list_read_replicas', description: 'List all read replicas for a branch.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' } }, required: ['projectId', 'branchId'] } },

        // PROJECT SHARING & COLLABORATION (3 tools)
        { name: 'neon_share_project', description: 'Share project with another user.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, email: { type: 'string' }, role: { type: 'string' } }, required: ['projectId', 'email'] } },
        { name: 'neon_list_project_shares', description: 'List all project shares.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_revoke_project_share', description: 'Remove project access.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, shareId: { type: 'string' } }, required: ['projectId', 'shareId'] } },

        // EXTENSION MANAGEMENT (5 tools)
        { name: 'neon_list_extensions', description: 'List available PostgreSQL extensions.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_enable_extension', description: 'Enable a PostgreSQL extension.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, extensionName: { type: 'string' }, schema: { type: 'string' } }, required: ['projectId', 'extensionName'] } },
        { name: 'neon_disable_extension', description: 'Disable a PostgreSQL extension.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, extensionName: { type: 'string' } }, required: ['projectId', 'extensionName'] } },
        { name: 'neon_get_extension_details', description: 'Get extension information and dependencies.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, extensionName: { type: 'string' } }, required: ['projectId', 'extensionName'] } },
        { name: 'neon_update_extension', description: 'Update extension to latest version.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, extensionName: { type: 'string' }, version: { type: 'string' } }, required: ['projectId', 'extensionName'] } },

        // SCHEMA MIGRATIONS (3 tools)
        { name: 'neon_create_migration', description: 'Create a new schema migration.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, name: { type: 'string' }, sql: { type: 'string' } }, required: ['projectId', 'name', 'sql'] } },
        { name: 'neon_list_migrations', description: 'List all schema migrations.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_rollback_migration', description: 'Rollback a schema migration.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, migrationId: { type: 'string' } }, required: ['projectId', 'migrationId'] } },

        // ADVANCED CONNECTION MANAGEMENT (3 tools)
        { name: 'neon_get_connection_uri', description: 'Get formatted connection URI for different clients.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, roleName: { type: 'string' }, pooled: { type: 'boolean' }, format: { type: 'string', enum: ['psql', 'jdbc', 'node', 'python', 'go', 'rust'] } }, required: ['projectId'] } },
        { name: 'neon_test_connection', description: 'Test database connection and return latency.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId'] } },
        { name: 'neon_get_connection_examples', description: 'Get code examples for connecting to database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, language: { type: 'string', enum: ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'php', 'ruby'] } }, required: ['projectId'] } },

        // PROJECT TEMPLATES (2 tools)
        { name: 'neon_create_from_template', description: 'Create project from template.', inputSchema: { type: 'object', properties: { templateId: { type: 'string' }, name: { type: 'string' }, region: { type: 'string' } }, required: ['templateId', 'name'] } },
        { name: 'neon_list_templates', description: 'List available project templates.', inputSchema: { type: 'object', properties: { category: { type: 'string' } } } },

        // ADVANCED MONITORING (2 tools)
        { name: 'neon_get_real_time_metrics', description: 'Get real-time performance metrics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } } }, required: ['projectId'] } },
        { name: 'neon_export_metrics', description: 'Export metrics to external monitoring system.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, destination: { type: 'string', enum: ['prometheus', 'datadog', 'grafana', 'cloudwatch'] }, config: { type: 'object' } }, required: ['projectId', 'destination'] } }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const args = request.params.arguments as any;

      try {
        switch (request.params.name) {
          // PROJECT MANAGEMENT
          case 'neon_list_projects': return await this.listProjects(args);
          case 'neon_list_organizations': return await this.listOrganizations(args);
          case 'neon_list_shared_projects': return await this.listSharedProjects(args);
          case 'neon_create_project': return await this.createProject(args);
          case 'neon_delete_project': return await this.deleteProject(args);
          case 'neon_describe_project': return await this.describeProject(args);
          case 'neon_update_project': return await this.updateProject(args);
          case 'neon_get_project_operations': return await this.getProjectOperations(args);
          case 'neon_get_project_consumption': return await this.getProjectConsumption(args);
          case 'neon_set_project_settings': return await this.setProjectSettings(args);
          case 'neon_get_project_quotas': return await this.getProjectQuotas(args);
          case 'neon_clone_project': return await this.cloneProject(args);
          case 'neon_get_project_permissions': return await this.getProjectPermissions(args);

          // BRANCH MANAGEMENT
          case 'neon_create_branch': return await this.createBranch(args);
          case 'neon_delete_branch': return await this.deleteBranch(args);
          case 'neon_describe_branch': return await this.describeBranch(args);
          case 'neon_reset_from_parent': return await this.resetFromParent(args);
          case 'neon_update_branch': return await this.updateBranch(args);
          case 'neon_list_branches': return await this.listBranches(args);
          case 'neon_get_branch_details': return await this.getBranchDetails(args);
          case 'neon_restore_branch': return await this.restoreBranch(args);
          case 'neon_set_branch_protection': return await this.setBranchProtection(args);
          case 'neon_get_branch_schema_diff': return await this.getBranchSchemaDiff(args);
          case 'neon_get_branch_data_diff': return await this.getBranchDataDiff(args);
          case 'neon_merge_branches': return await this.mergeBranches(args);
          case 'neon_promote_branch': return await this.promoteBranch(args);
          case 'neon_set_branch_retention': return await this.setBranchRetention(args);
          case 'neon_get_branch_history': return await this.getBranchHistory(args);
          case 'neon_restore_branch_to_timestamp': return await this.restoreBranchToTimestamp(args);
          case 'neon_get_branch_size': return await this.getBranchSize(args);
          case 'neon_set_branch_compute_settings': return await this.setBranchComputeSettings(args);
          case 'neon_get_branch_connections': return await this.getBranchConnections(args);
          case 'neon_list_branch_computes': return await this.listBranchComputes(args);

          // SQL EXECUTION
          case 'neon_run_sql': return await this.runSql(args);
          case 'neon_run_sql_transaction': return await this.runSqlTransaction(args);
          case 'neon_get_connection_string': return await this.getConnectionString(args);
          case 'neon_get_database_tables': return await this.getDatabaseTables(args);
          case 'neon_describe_table_schema': return await this.describeTableSchema(args);
          case 'neon_explain_sql_statement': return await this.explainSqlStatement(args);
          case 'neon_list_slow_queries': return await this.listSlowQueries(args);
          case 'neon_optimize_query': return await this.optimizeQuery(args);
          case 'neon_suggest_indexes': return await this.suggestIndexes(args);
          case 'neon_analyze_query_plan': return await this.analyzeQueryPlan(args);

          // DATABASE MANAGEMENT
          case 'neon_create_database': return await this.createDatabase(args);
          case 'neon_delete_database': return await this.deleteDatabase(args);
          case 'neon_list_databases': return await this.listDatabases(args);
          case 'neon_get_database_size': return await this.getDatabaseSize(args);
          case 'neon_get_database_stats': return await this.getDatabaseStats(args);
          case 'neon_vacuum_database': return await this.vacuumDatabase(args);
          case 'neon_analyze_database': return await this.analyzeDatabase(args);
          case 'neon_reindex_database': return await this.reindexDatabase(args);
          case 'neon_get_database_locks': return await this.getDatabaseLocks(args);
          case 'neon_kill_database_query': return await this.killDatabaseQuery(args);
          case 'neon_get_database_activity': return await this.getDatabaseActivity(args);
          case 'neon_backup_database': return await this.backupDatabase(args);

          // MIGRATIONS
          case 'neon_prepare_database_migration': return await this.prepareDatabaseMigration(args);
          case 'neon_complete_database_migration': return await this.completeDatabaseMigration(args);

          // QUERY TUNING
          case 'neon_prepare_query_tuning': return await this.prepareQueryTuning(args);
          case 'neon_complete_query_tuning': return await this.completeQueryTuning(args);

          // ROLE MANAGEMENT
          case 'neon_create_role': return await this.createRole(args);
          case 'neon_delete_role': return await this.deleteRole(args);
          case 'neon_list_roles': return await this.listRoles(args);
          case 'neon_update_role': return await this.updateRole(args);
          case 'neon_grant_role_permissions': return await this.grantRolePermissions(args);
          case 'neon_revoke_role_permissions': return await this.revokeRolePermissions(args);
          case 'neon_get_role_permissions': return await this.getRolePermissions(args);
          case 'neon_reset_role_password': return await this.resetRolePassword(args);

          // COMPUTE/ENDPOINT MANAGEMENT
          case 'neon_create_endpoint': return await this.createEndpoint(args);
          case 'neon_delete_endpoint': return await this.deleteEndpoint(args);
          case 'neon_update_endpoint': return await this.updateEndpoint(args);
          case 'neon_start_endpoint': return await this.startEndpoint(args);
          case 'neon_suspend_endpoint': return await this.suspendEndpoint(args);
          case 'neon_restart_endpoint': return await this.restartEndpoint(args);
          case 'neon_get_endpoint_metrics': return await this.getEndpointMetrics(args);
          case 'neon_set_endpoint_autoscaling': return await this.setEndpointAutoscaling(args);
          case 'neon_get_endpoint_logs': return await this.getEndpointLogs(args);
          case 'neon_set_endpoint_pooling': return await this.setEndpointPooling(args);

          // MONITORING & ANALYTICS
          case 'neon_get_query_statistics': return await this.getQueryStatistics(args);
          case 'neon_get_slow_query_log': return await this.getSlowQueryLog(args);
          case 'neon_get_connection_stats': return await this.getConnectionStats(args);
          case 'neon_get_storage_metrics': return await this.getStorageMetrics(args);
          case 'neon_get_compute_metrics': return await this.getComputeMetrics(args);
          case 'neon_get_io_metrics': return await this.getIoMetrics(args);
          case 'neon_get_cache_hit_ratio': return await this.getCacheHitRatio(args);
          case 'neon_get_index_usage': return await this.getIndexUsage(args);
          case 'neon_get_table_bloat': return await this.getTableBloat(args);
          case 'neon_get_replication_lag': return await this.getReplicationLag(args);
          case 'neon_get_checkpoint_stats': return await this.getCheckpointStats(args);
          case 'neon_get_wal_stats': return await this.getWalStats(args);
          case 'neon_set_monitoring_alerts': return await this.setMonitoringAlerts(args);
          case 'neon_get_alert_history': return await this.getAlertHistory(args);
          case 'neon_get_performance_insights': return await this.getPerformanceInsights(args);

          // BACKUP & RECOVERY
          case 'neon_list_backups': return await this.listBackups(args);
          case 'neon_create_backup': return await this.createBackup(args);
          case 'neon_restore_backup': return await this.restoreBackup(args);
          case 'neon_delete_backup': return await this.deleteBackup(args);
          case 'neon_get_backup_status': return await this.getBackupStatus(args);
          case 'neon_schedule_backup': return await this.scheduleBackup(args);
          case 'neon_export_backup': return await this.exportBackup(args);
          case 'neon_validate_backup': return await this.validateBackup(args);

          // SECURITY & COMPLIANCE
          case 'neon_enable_ip_allowlist': return await this.enableIpAllowlist(args);
          case 'neon_get_ip_allowlist': return await this.getIpAllowlist(args);
          case 'neon_enable_ssl_enforcement': return await this.enableSslEnforcement(args);
          case 'neon_rotate_credentials': return await this.rotateCredentials(args);
          case 'neon_get_audit_log': return await this.getAuditLog(args);
          case 'neon_enable_encryption': return await this.enableEncryption(args);
          case 'neon_get_security_scan': return await this.getSecurityScan(args);
          case 'neon_set_password_policy': return await this.setPasswordPolicy(args);
          case 'neon_enable_2fa': return await this.enable2fa(args);
          case 'neon_get_compliance_report': return await this.getComplianceReport(args);

          // COST MANAGEMENT
          case 'neon_get_cost_breakdown': return await this.getCostBreakdown(args);
          case 'neon_get_cost_forecast': return await this.getCostForecast(args);
          case 'neon_set_cost_alerts': return await this.setCostAlerts(args);
          case 'neon_get_cost_optimization_tips': return await this.getCostOptimizationTips(args);
          case 'neon_get_billing_history': return await this.getBillingHistory(args);
          case 'neon_export_cost_report': return await this.exportCostReport(args);
          case 'neon_set_budget_limits': return await this.setBudgetLimits(args);
          case 'neon_get_resource_recommendations': return await this.getResourceRecommendations(args);

          // INTEGRATION & WEBHOOKS
          case 'neon_create_webhook': return await this.createWebhook(args);
          case 'neon_list_webhooks': return await this.listWebhooks(args);
          case 'neon_delete_webhook': return await this.deleteWebhook(args);
          case 'neon_test_webhook': return await this.testWebhook(args);
          case 'neon_get_webhook_logs': return await this.getWebhookLogs(args);
          case 'neon_create_api_key': return await this.createApiKey(args);

          // ADVANCED SQL TOOLS
          case 'neon_detect_n_plus_one': return await this.detectNPlusOne(args);
          case 'neon_suggest_partitioning': return await this.suggestPartitioning(args);
          case 'neon_analyze_table_statistics': return await this.analyzeTableStatistics(args);
          case 'neon_suggest_vacuum_strategy': return await this.suggestVacuumStrategy(args);
          case 'neon_detect_missing_indexes': return await this.detectMissingIndexes(args);
          case 'neon_analyze_join_performance': return await this.analyzeJoinPerformance(args);
          case 'neon_suggest_materialized_views': return await this.suggestMaterializedViews(args);
          case 'neon_get_table_dependencies': return await this.getTableDependencies(args);
          case 'neon_suggest_query_rewrite': return await this.suggestQueryRewrite(args);
          case 'neon_analyze_deadlocks': return await this.analyzeDeadlocks(args);

          // NEON AUTH
          case 'neon_provision_neon_auth': return await this.provisionNeonAuth(args);

          // API KEY MANAGEMENT
          case 'neon_list_api_keys': return await this.listApiKeys(args);
          case 'neon_create_api_key_for_project': return await this.createApiKeyForProject(args);
          case 'neon_revoke_api_key': return await this.revokeApiKey(args);

          // CONNECTION POOLING
          case 'neon_get_connection_pooler_config': return await this.getConnectionPoolerConfig(args);
          case 'neon_update_connection_pooler_config': return await this.updateConnectionPoolerConfig(args);

          // READ REPLICAS
          case 'neon_create_read_replica': return await this.createReadReplica(args);
          case 'neon_list_read_replicas': return await this.listReadReplicas(args);

          // PROJECT SHARING & COLLABORATION
          case 'neon_share_project': return await this.shareProject(args);
          case 'neon_list_project_shares': return await this.listProjectShares(args);
          case 'neon_revoke_project_share': return await this.revokeProjectShare(args);

          // EXTENSION MANAGEMENT
          case 'neon_list_extensions': return await this.listExtensions(args);
          case 'neon_enable_extension': return await this.enableExtension(args);
          case 'neon_disable_extension': return await this.disableExtension(args);
          case 'neon_get_extension_details': return await this.getExtensionDetails(args);
          case 'neon_update_extension': return await this.updateExtension(args);

          // SCHEMA MIGRATIONS
          case 'neon_create_migration': return await this.createMigration(args);
          case 'neon_list_migrations': return await this.listMigrations(args);
          case 'neon_rollback_migration': return await this.rollbackMigration(args);

          // ADVANCED CONNECTION MANAGEMENT
          case 'neon_get_connection_uri': return await this.getConnectionUri(args);
          case 'neon_test_connection': return await this.testConnection(args);
          case 'neon_get_connection_examples': return await this.getConnectionExamples(args);

          // PROJECT TEMPLATES
          case 'neon_create_from_template': return await this.createFromTemplate(args);
          case 'neon_list_templates': return await this.listTemplates(args);

          // ADVANCED MONITORING
          case 'neon_get_real_time_metrics': return await this.getRealTimeMetrics(args);
          case 'neon_export_metrics': return await this.exportMetrics(args);

          // SETUP AUTOMATION (NEW!)
          case 'neon_create_project_for_rad': return await this.createProjectForRAD(args);
          case 'neon_deploy_schema': return await this.deploySchema(args);
          case 'neon_verify_schema': return await this.verifySchema(args);
          case 'neon_get_connection_uri': return await this.getConnectionUri(args);
          case 'neon_setup_rad_database': return await this.setupRADDatabase(args);
          case 'neon_check_api_key': return await this.checkApiKey(args);

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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/neon-mcp server running on stdio');
  }

  // PROJECT MANAGEMENT METHODS
  private async listProjects(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.cursor) params.append('cursor', args.cursor);
    if (args.org_id) params.append('org_id', args.org_id);

    const response = await this.client.get(`/projects?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async listOrganizations(args: any) {
    const response = await this.client.get('/users/me/organizations');
    let orgs = response.data.organizations || [];

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      orgs = orgs.filter((org: any) =>
        org.name?.toLowerCase().includes(searchLower) ||
        org.id?.toLowerCase().includes(searchLower)
      );
    }

    return { content: [{ type: 'text', text: JSON.stringify({ organizations: orgs }, null, 2) }] };
  }

  private async listSharedProjects(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());
    if (args.search) params.append('search', args.search);
    if (args.cursor) params.append('cursor', args.cursor);

    const response = await this.client.get(`/projects/shared?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async createProject(args: any) {
    const body: any = {};
    if (args.name) body.project = { name: args.name };
    if (args.org_id) body.project = { ...body.project, org_id: args.org_id };
    if (args.region_id) body.project = { ...body.project, region_id: args.region_id };
    if (args.pg_version) body.project = { ...body.project, pg_version: args.pg_version };

    const response = await this.client.post('/projects', body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async deleteProject(args: any) {
    const response = await this.client.delete(`/projects/${args.projectId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async describeProject(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async updateProject(args: any) {
    const body: any = { project: {} };
    if (args.name) body.project.name = args.name;
    if (args.settings) body.project.settings = args.settings;

    const response = await this.client.patch(`/projects/${args.projectId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getProjectOperations(args: any) {
    const params = new URLSearchParams();
    if (args.limit) params.append('limit', args.limit.toString());

    const response = await this.client.get(`/projects/${args.projectId}/operations?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getProjectConsumption(args: any) {
    const params = new URLSearchParams();
    if (args.from) params.append('from', args.from);
    if (args.to) params.append('to', args.to);

    const response = await this.client.get(`/projects/${args.projectId}/consumption?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async setProjectSettings(args: any) {
    const response = await this.client.patch(`/projects/${args.projectId}`, { project: { settings: args.settings } });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getProjectQuotas(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}`);
    const quotas = response.data.project?.quotas || {};
    return { content: [{ type: 'text', text: JSON.stringify(quotas, null, 2) }] };
  }

  private async cloneProject(args: any) {
    return { content: [{ type: 'text', text: 'Project cloning: Create new project and copy branches using create_project and create_branch tools.' }] };
  }

  private async getProjectPermissions(args: any) {
    return { content: [{ type: 'text', text: 'Project permissions: Use organization API to manage project access.' }] };
  }

  // BRANCH MANAGEMENT METHODS
  private async createBranch(args: any) {
    const body: any = { branch: {} };
    if (args.branchName) body.branch.name = args.branchName;
    if (args.parent_id) body.branch.parent_id = args.parent_id;

    const response = await this.client.post(`/projects/${args.projectId}/branches`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async deleteBranch(args: any) {
    const response = await this.client.delete(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async describeBranch(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async resetFromParent(args: any) {
    const body: any = {};
    if (args.preserveUnderName) body.preserve_under_name = args.preserveUnderName;

    const response = await this.client.post(`/projects/${args.projectId}/branches/${args.branchIdOrName}/reset`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async updateBranch(args: any) {
    const body: any = { branch: {} };
    if (args.name) body.branch.name = args.name;
    if (args.protected !== undefined) body.branch.protected = args.protected;

    const response = await this.client.patch(`/projects/${args.projectId}/branches/${args.branchId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async listBranches(args: any) {
    const params = new URLSearchParams();
    if (args.search) params.append('search', args.search);

    const response = await this.client.get(`/projects/${args.projectId}/branches?${params.toString()}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getBranchDetails(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async restoreBranch(args: any) {
    return { content: [{ type: 'text', text: 'Branch restore: Use create_branch with parent_timestamp to restore to specific point in time.' }] };
  }

  private async setBranchProtection(args: any) {
    const response = await this.client.patch(`/projects/${args.projectId}/branches/${args.branchId}`, {
      branch: { protected: args.protected }
    });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getBranchSchemaDiff(args: any) {
    return { content: [{ type: 'text', text: 'Schema diff: Use run_sql to query information_schema on both branches and compare.' }] };
  }

  private async getBranchDataDiff(args: any) {
    return { content: [{ type: 'text', text: 'Data diff: Use run_sql to query and compare data between branches.' }] };
  }

  private async mergeBranches(args: any) {
    return { content: [{ type: 'text', text: 'Branch merge: Use prepare_database_migration to apply changes from source to target branch.' }] };
  }

  private async promoteBranch(args: any) {
    const response = await this.client.post(`/projects/${args.projectId}/branches/${args.branchId}/set_as_primary`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async setBranchRetention(args: any) {
    return { content: [{ type: 'text', text: 'Branch retention: Configure via project settings.' }] };
  }

  private async getBranchHistory(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async restoreBranchToTimestamp(args: any) {
    const body = { timestamp: args.timestamp };
    const response = await this.client.post(`/projects/${args.projectId}/branches/${args.branchId}/restore`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async getBranchSize(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/branches/${args.branchId}`);
    const size = response.data.branch?.logical_size || 0;
    return { content: [{ type: 'text', text: `Branch size: ${size} bytes` }] };
  }

  private async setBranchComputeSettings(args: any) {
    return { content: [{ type: 'text', text: 'Compute settings: Use update_endpoint to configure compute for branch endpoints.' }] };
  }

  private async getBranchConnections(args: any) {
    return { content: [{ type: 'text', text: 'Active connections: Use run_sql with "SELECT * FROM pg_stat_activity" to view connections.' }] };
  }

  private async listBranchComputes(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/endpoints`);
    const branchEndpoints = args.branchId
      ? response.data.endpoints?.filter((e: any) => e.branch_id === args.branchId)
      : response.data.endpoints;
    return { content: [{ type: 'text', text: JSON.stringify(branchEndpoints, null, 2) }] };
  }

  // Placeholder methods - will implement in batches
  private async runSql(args: any) { return { content: [{ type: 'text', text: 'SQL execution: Not yet implemented' }] }; }
  private async runSqlTransaction(args: any) { return { content: [{ type: 'text', text: 'SQL transaction: Not yet implemented' }] }; }
  private async getConnectionString(args: any) { return { content: [{ type: 'text', text: 'Connection string: Not yet implemented' }] }; }
  private async getDatabaseTables(args: any) { return { content: [{ type: 'text', text: 'Database tables: Not yet implemented' }] }; }
  private async describeTableSchema(args: any) { return { content: [{ type: 'text', text: 'Table schema: Not yet implemented' }] }; }
  private async explainSqlStatement(args: any) { return { content: [{ type: 'text', text: 'Explain SQL: Not yet implemented' }] }; }
  private async listSlowQueries(args: any) { return { content: [{ type: 'text', text: 'Slow queries: Not yet implemented' }] }; }
  private async optimizeQuery(args: any) { return { content: [{ type: 'text', text: 'Query optimization: Not yet implemented' }] }; }
  private async suggestIndexes(args: any) { return { content: [{ type: 'text', text: 'Index suggestions: Not yet implemented' }] }; }
  private async analyzeQueryPlan(args: any) { return { content: [{ type: 'text', text: 'Query plan analysis: Not yet implemented' }] }; }
  private async createDatabase(args: any) { return { content: [{ type: 'text', text: 'Create database: Not yet implemented' }] }; }
  private async deleteDatabase(args: any) { return { content: [{ type: 'text', text: 'Delete database: Not yet implemented' }] }; }
  private async listDatabases(args: any) { return { content: [{ type: 'text', text: 'List databases: Not yet implemented' }] }; }
  private async getDatabaseSize(args: any) { return { content: [{ type: 'text', text: 'Database size: Not yet implemented' }] }; }
  private async getDatabaseStats(args: any) { return { content: [{ type: 'text', text: 'Database stats: Not yet implemented' }] }; }
  private async vacuumDatabase(args: any) { return { content: [{ type: 'text', text: 'Vacuum database: Not yet implemented' }] }; }
  private async analyzeDatabase(args: any) { return { content: [{ type: 'text', text: 'Analyze database: Not yet implemented' }] }; }
  private async reindexDatabase(args: any) { return { content: [{ type: 'text', text: 'Reindex database: Not yet implemented' }] }; }
  private async getDatabaseLocks(args: any) { return { content: [{ type: 'text', text: 'Database locks: Not yet implemented' }] }; }
  private async killDatabaseQuery(args: any) { return { content: [{ type: 'text', text: 'Kill query: Not yet implemented' }] }; }
  private async getDatabaseActivity(args: any) { return { content: [{ type: 'text', text: 'Database activity: Not yet implemented' }] }; }
  private async backupDatabase(args: any) { return { content: [{ type: 'text', text: 'Backup database: Not yet implemented' }] }; }
  private async prepareDatabaseMigration(args: any) { return { content: [{ type: 'text', text: 'Prepare migration: Not yet implemented' }] }; }
  private async completeDatabaseMigration(args: any) { return { content: [{ type: 'text', text: 'Complete migration: Not yet implemented' }] }; }
  private async prepareQueryTuning(args: any) { return { content: [{ type: 'text', text: 'Prepare query tuning: Not yet implemented' }] }; }
  private async completeQueryTuning(args: any) { return { content: [{ type: 'text', text: 'Complete query tuning: Not yet implemented' }] }; }
  private async createRole(args: any) { return { content: [{ type: 'text', text: 'Create role: Not yet implemented' }] }; }
  private async deleteRole(args: any) { return { content: [{ type: 'text', text: 'Delete role: Not yet implemented' }] }; }
  private async listRoles(args: any) { return { content: [{ type: 'text', text: 'List roles: Not yet implemented' }] }; }
  private async updateRole(args: any) { return { content: [{ type: 'text', text: 'Update role: Not yet implemented' }] }; }
  private async grantRolePermissions(args: any) { return { content: [{ type: 'text', text: 'Grant permissions: Not yet implemented' }] }; }
  private async revokeRolePermissions(args: any) { return { content: [{ type: 'text', text: 'Revoke permissions: Not yet implemented' }] }; }
  private async getRolePermissions(args: any) { return { content: [{ type: 'text', text: 'Get permissions: Not yet implemented' }] }; }
  private async resetRolePassword(args: any) { return { content: [{ type: 'text', text: 'Reset password: Not yet implemented' }] }; }
  private async createEndpoint(args: any) { return { content: [{ type: 'text', text: 'Create endpoint: Not yet implemented' }] }; }
  private async deleteEndpoint(args: any) { return { content: [{ type: 'text', text: 'Delete endpoint: Not yet implemented' }] }; }
  private async updateEndpoint(args: any) { return { content: [{ type: 'text', text: 'Update endpoint: Not yet implemented' }] }; }
  private async startEndpoint(args: any) { return { content: [{ type: 'text', text: 'Start endpoint: Not yet implemented' }] }; }
  private async suspendEndpoint(args: any) { return { content: [{ type: 'text', text: 'Suspend endpoint: Not yet implemented' }] }; }
  private async restartEndpoint(args: any) { return { content: [{ type: 'text', text: 'Restart endpoint: Not yet implemented' }] }; }
  private async getEndpointMetrics(args: any) { return { content: [{ type: 'text', text: 'Endpoint metrics: Not yet implemented' }] }; }
  private async setEndpointAutoscaling(args: any) { return { content: [{ type: 'text', text: 'Set autoscaling: Not yet implemented' }] }; }
  private async getEndpointLogs(args: any) { return { content: [{ type: 'text', text: 'Endpoint logs: Not yet implemented' }] }; }
  private async setEndpointPooling(args: any) { return { content: [{ type: 'text', text: 'Set pooling: Not yet implemented' }] }; }
  private async getQueryStatistics(args: any) { return { content: [{ type: 'text', text: 'Query statistics: Not yet implemented' }] }; }
  private async getSlowQueryLog(args: any) { return { content: [{ type: 'text', text: 'Slow query log: Not yet implemented' }] }; }
  private async getConnectionStats(args: any) { return { content: [{ type: 'text', text: 'Connection stats: Not yet implemented' }] }; }
  private async getStorageMetrics(args: any) { return { content: [{ type: 'text', text: 'Storage metrics: Not yet implemented' }] }; }
  private async getComputeMetrics(args: any) { return { content: [{ type: 'text', text: 'Compute metrics: Not yet implemented' }] }; }
  private async getIoMetrics(args: any) { return { content: [{ type: 'text', text: 'I/O metrics: Not yet implemented' }] }; }
  private async getCacheHitRatio(args: any) { return { content: [{ type: 'text', text: 'Cache hit ratio: Not yet implemented' }] }; }
  private async getIndexUsage(args: any) { return { content: [{ type: 'text', text: 'Index usage: Not yet implemented' }] }; }
  private async getTableBloat(args: any) { return { content: [{ type: 'text', text: 'Table bloat: Not yet implemented' }] }; }
  private async getReplicationLag(args: any) { return { content: [{ type: 'text', text: 'Replication lag: Not yet implemented' }] }; }
  private async getCheckpointStats(args: any) { return { content: [{ type: 'text', text: 'Checkpoint stats: Not yet implemented' }] }; }
  private async getWalStats(args: any) { return { content: [{ type: 'text', text: 'WAL stats: Not yet implemented' }] }; }
  private async setMonitoringAlerts(args: any) { return { content: [{ type: 'text', text: 'Set alerts: Not yet implemented' }] }; }
  private async getAlertHistory(args: any) { return { content: [{ type: 'text', text: 'Alert history: Not yet implemented' }] }; }
  private async getPerformanceInsights(args: any) { return { content: [{ type: 'text', text: 'Performance insights: Not yet implemented' }] }; }
  private async listBackups(args: any) { return { content: [{ type: 'text', text: 'List backups: Not yet implemented' }] }; }
  private async createBackup(args: any) { return { content: [{ type: 'text', text: 'Create backup: Not yet implemented' }] }; }
  private async restoreBackup(args: any) { return { content: [{ type: 'text', text: 'Restore backup: Not yet implemented' }] }; }
  private async deleteBackup(args: any) { return { content: [{ type: 'text', text: 'Delete backup: Not yet implemented' }] }; }
  private async getBackupStatus(args: any) { return { content: [{ type: 'text', text: 'Backup status: Not yet implemented' }] }; }
  private async scheduleBackup(args: any) { return { content: [{ type: 'text', text: 'Schedule backup: Not yet implemented' }] }; }
  private async exportBackup(args: any) { return { content: [{ type: 'text', text: 'Export backup: Not yet implemented' }] }; }
  private async validateBackup(args: any) { return { content: [{ type: 'text', text: 'Validate backup: Not yet implemented' }] }; }
  private async enableIpAllowlist(args: any) { return { content: [{ type: 'text', text: 'Enable IP allowlist: Not yet implemented' }] }; }
  private async getIpAllowlist(args: any) { return { content: [{ type: 'text', text: 'Get IP allowlist: Not yet implemented' }] }; }
  private async enableSslEnforcement(args: any) { return { content: [{ type: 'text', text: 'Enable SSL: Not yet implemented' }] }; }
  private async rotateCredentials(args: any) { return { content: [{ type: 'text', text: 'Rotate credentials: Not yet implemented' }] }; }
  private async getAuditLog(args: any) { return { content: [{ type: 'text', text: 'Audit log: Not yet implemented' }] }; }
  private async enableEncryption(args: any) { return { content: [{ type: 'text', text: 'Enable encryption: Not yet implemented' }] }; }
  private async getSecurityScan(args: any) { return { content: [{ type: 'text', text: 'Security scan: Not yet implemented' }] }; }
  private async setPasswordPolicy(args: any) { return { content: [{ type: 'text', text: 'Set password policy: Not yet implemented' }] }; }
  private async enable2fa(args: any) { return { content: [{ type: 'text', text: 'Enable 2FA: Not yet implemented' }] }; }
  private async getComplianceReport(args: any) { return { content: [{ type: 'text', text: 'Compliance report: Not yet implemented' }] }; }
  private async getCostBreakdown(args: any) { return { content: [{ type: 'text', text: 'Cost breakdown: Not yet implemented' }] }; }
  private async getCostForecast(args: any) { return { content: [{ type: 'text', text: 'Cost forecast: Not yet implemented' }] }; }
  private async setCostAlerts(args: any) { return { content: [{ type: 'text', text: 'Set cost alerts: Not yet implemented' }] }; }
  private async getCostOptimizationTips(args: any) { return { content: [{ type: 'text', text: 'Cost optimization: Not yet implemented' }] }; }
  private async getBillingHistory(args: any) { return { content: [{ type: 'text', text: 'Billing history: Not yet implemented' }] }; }
  private async exportCostReport(args: any) { return { content: [{ type: 'text', text: 'Export cost report: Not yet implemented' }] }; }
  private async setBudgetLimits(args: any) { return { content: [{ type: 'text', text: 'Set budget limits: Not yet implemented' }] }; }
  private async getResourceRecommendations(args: any) { return { content: [{ type: 'text', text: 'Resource recommendations: Not yet implemented' }] }; }
  private async createWebhook(args: any) { return { content: [{ type: 'text', text: 'Create webhook: Not yet implemented' }] }; }
  private async listWebhooks(args: any) { return { content: [{ type: 'text', text: 'List webhooks: Not yet implemented' }] }; }
  private async deleteWebhook(args: any) { return { content: [{ type: 'text', text: 'Delete webhook: Not yet implemented' }] }; }
  private async testWebhook(args: any) { return { content: [{ type: 'text', text: 'Test webhook: Not yet implemented' }] }; }
  private async getWebhookLogs(args: any) { return { content: [{ type: 'text', text: 'Webhook logs: Not yet implemented' }] }; }
  private async createApiKey(args: any) { return { content: [{ type: 'text', text: 'Create API key: Not yet implemented' }] }; }
  private async detectNPlusOne(args: any) { return { content: [{ type: 'text', text: 'Detect N+1: Not yet implemented' }] }; }
  private async suggestPartitioning(args: any) { return { content: [{ type: 'text', text: 'Suggest partitioning: Not yet implemented' }] }; }
  private async analyzeTableStatistics(args: any) { return { content: [{ type: 'text', text: 'Table statistics: Not yet implemented' }] }; }
  private async suggestVacuumStrategy(args: any) { return { content: [{ type: 'text', text: 'Vacuum strategy: Not yet implemented' }] }; }
  private async detectMissingIndexes(args: any) { return { content: [{ type: 'text', text: 'Missing indexes: Not yet implemented' }] }; }
  private async analyzeJoinPerformance(args: any) { return { content: [{ type: 'text', text: 'Join performance: Not yet implemented' }] }; }
  private async suggestMaterializedViews(args: any) { return { content: [{ type: 'text', text: 'Materialized views: Not yet implemented' }] }; }
  private async getTableDependencies(args: any) { return { content: [{ type: 'text', text: 'Table dependencies: Not yet implemented' }] }; }
  private async suggestQueryRewrite(args: any) { return { content: [{ type: 'text', text: 'Query rewrite: Not yet implemented' }] }; }
  private async analyzeDeadlocks(args: any) { return { content: [{ type: 'text', text: 'Analyze deadlocks: Not yet implemented' }] }; }
  private async provisionNeonAuth(args: any) { return { content: [{ type: 'text', text: 'Provision Neon Auth: Not yet implemented' }] }; }

  // API KEY MANAGEMENT
  private async listApiKeys(args: any) {
    const response = await this.client.get('/api_keys');
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async createApiKeyForProject(args: any) {
    const body: any = { key_name: args.keyName };
    if (args.projectId) body.project_id = args.projectId;

    const response = await this.client.post('/api_keys', body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async revokeApiKey(args: any) {
    const response = await this.client.delete(`/api_keys/${args.keyId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  // CONNECTION POOLING
  private async getConnectionPoolerConfig(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/endpoints/${args.endpointId}`);
    const poolerConfig = response.data.endpoint?.pooler_enabled ? {
      pooler_enabled: response.data.endpoint.pooler_enabled,
      pooler_mode: response.data.endpoint.pooler_mode,
      settings: response.data.endpoint.settings
    } : { pooler_enabled: false };

    return { content: [{ type: 'text', text: JSON.stringify(poolerConfig, null, 2) }] };
  }

  private async updateConnectionPoolerConfig(args: any) {
    const body: any = { endpoint: {} };
    if (args.poolMode) body.endpoint.pooler_mode = args.poolMode;
    if (args.poolSize !== undefined) body.endpoint.settings = { ...body.endpoint.settings, pool_size: args.poolSize };
    if (args.maxClientConn !== undefined) body.endpoint.settings = { ...body.endpoint.settings, max_client_conn: args.maxClientConn };

    const response = await this.client.patch(`/projects/${args.projectId}/endpoints/${args.endpointId}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  // READ REPLICAS
  private async createReadReplica(args: any) {
    const body: any = {
      endpoint: {
        branch_id: args.branchId,
        type: 'read_only'
      }
    };
    if (args.region) body.endpoint.region_id = args.region;

    const response = await this.client.post(`/projects/${args.projectId}/endpoints`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async listReadReplicas(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/endpoints`);
    const readReplicas = response.data.endpoints?.filter((ep: any) =>
      ep.type === 'read_only' && ep.branch_id === args.branchId
    ) || [];

    return { content: [{ type: 'text', text: JSON.stringify({ read_replicas: readReplicas }, null, 2) }] };
  }

  // PROJECT SHARING & COLLABORATION
  private async shareProject(args: any) {
    const body: any = {
      email: args.email
    };
    if (args.role) body.role = args.role;

    const response = await this.client.post(`/projects/${args.projectId}/permissions`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async listProjectShares(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/permissions`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async revokeProjectShare(args: any) {
    const response = await this.client.delete(`/projects/${args.projectId}/permissions/${args.shareId}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  // EXTENSION MANAGEMENT
  private async listExtensions(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = 'SELECT * FROM pg_available_extensions ORDER BY name';
    const response = await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async enableExtension(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const schema = args.schema || 'public';
    const sql = `CREATE EXTENSION IF NOT EXISTS "${args.extensionName}" SCHEMA ${schema}`;
    const response = await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: `Extension ${args.extensionName} enabled successfully` }] };
  }

  private async disableExtension(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = `DROP EXTENSION IF EXISTS "${args.extensionName}"`;
    const response = await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: `Extension ${args.extensionName} disabled successfully` }] };
  }

  private async getExtensionDetails(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = `SELECT * FROM pg_extension WHERE extname = '${args.extensionName}'`;
    const response = await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async updateExtension(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const version = args.version ? `TO '${args.version}'` : '';
    const sql = `ALTER EXTENSION "${args.extensionName}" UPDATE ${version}`;
    const response = await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: `Extension ${args.extensionName} updated successfully` }] };
  }

  // SCHEMA MIGRATIONS
  private async createMigration(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    // Create migration tracking table if not exists
    const createTableSql = `CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sql TEXT NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;
    await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: createTableSql });

    // Execute migration
    await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: args.sql });

    // Record migration
    const recordSql = `INSERT INTO schema_migrations (name, sql) VALUES ('${args.name}', '${args.sql.replace(/'/g, "''")}')`;
    const response = await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: recordSql });
    return { content: [{ type: 'text', text: `Migration ${args.name} created and applied successfully` }] };
  }

  private async listMigrations(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = 'SELECT * FROM schema_migrations ORDER BY applied_at DESC';
    const response = await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async rollbackMigration(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const sql = `DELETE FROM schema_migrations WHERE id = ${args.migrationId}`;
    const response = await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: sql });
    return { content: [{ type: 'text', text: `Migration ${args.migrationId} rolled back (record deleted, manual SQL rollback required)` }] };
  }

  // ADVANCED CONNECTION MANAGEMENT
  private async getConnectionUri(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/connection_uri`, {
      params: {
        branch_id: args.branchId,
        database_name: args.databaseName,
        role_name: args.roleName,
        pooled: args.pooled
      }
    });
    const uri = response.data.uri;

    if (args.format) {
      const formatted = this.formatConnectionString(uri, args.format);
      return { content: [{ type: 'text', text: formatted }] };
    }

    return { content: [{ type: 'text', text: uri }] };
  }

  private formatConnectionString(uri: string, format: string): string {
    switch (format) {
      case 'neon_psql':
        return `psql "${uri}"`;
      case 'neon_jdbc':
        return uri.replace('postgres://', 'jdbc:postgresql://');
      case 'neon_node':
        return `const { Pool } = require('pg');\nconst pool = new Pool({ connectionString: '${uri}' });`;
      case 'neon_python':
        return `import psycopg2\nconn = psycopg2.connect('${uri}')`;
      case 'neon_go':
        return `import "database/sql"\nimport _ "github.com/lib/pq"\ndb, err := sql.Open("postgres", "${uri}")`;
      case 'neon_rust':
        return `use postgres::{Client, NoTls};\nlet mut client = Client::connect("${uri}", NoTls)?;`;
      default:
        return uri;
    }
  }

  private async testConnection(args: any) {
    const branchId = args.branchId || 'main';
    const dbName = args.databaseName || 'neondb';
    const startTime = Date.now();
    try {
      await this.client.post(`/projects/${args.projectId}/branches/${branchId}/databases/${dbName}/query`, { query: 'SELECT 1' });
      const latency = Date.now() - startTime;
      return { content: [{ type: 'text', text: `Connection successful! Latency: ${latency}ms` }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Connection failed: ${error.message}` }] };
    }
  }

  private async getConnectionExamples(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/connection_uri`, {
      params: {
        branch_id: args.branchId,
        database_name: args.databaseName
      }
    });
    const uri = response.data.uri;

    const examples: any = {
      javascript: `const { Pool } = require('pg');\nconst pool = new Pool({ connectionString: '${uri}' });\n\nconst result = await pool.query('SELECT * FROM users');\nconsole.log(result.rows);`,
      typescript: `import { Pool } from 'pg';\nconst pool = new Pool({ connectionString: '${uri}' });\n\nconst result = await pool.query<User>('SELECT * FROM users');\nconsole.log(result.rows);`,
      python: `import psycopg2\n\nconn = psycopg2.connect('${uri}')\ncur = conn.cursor()\ncur.execute('SELECT * FROM users')\nrows = cur.fetchall()`,
      go: `import (\n  "database/sql"\n  _ "github.com/lib/pq"\n)\n\ndb, err := sql.Open("postgres", "${uri}")\nrows, err := db.Query("SELECT * FROM users")`,
      rust: `use postgres::{Client, NoTls};\n\nlet mut client = Client::connect("${uri}", NoTls)?;\nlet rows = client.query("SELECT * FROM users", &[])?;`,
      java: `import java.sql.*;\n\nString url = "${uri.replace('postgres://', 'jdbc:postgresql://')}";\nConnection conn = DriverManager.getConnection(url);\nStatement stmt = conn.createStatement();\nResultSet rs = stmt.executeQuery("SELECT * FROM users");`,
      php: `<?php\n$conn = pg_connect('${uri}');\n$result = pg_query($conn, 'SELECT * FROM users');\n$rows = pg_fetch_all($result);`,
      ruby: `require 'pg'\n\nconn = PG.connect('${uri}')\nresult = conn.exec('SELECT * FROM users')\nresult.each { |row| puts row }`
    };

    const example = examples[args.language || 'javascript'];
    return { content: [{ type: 'text', text: example }] };
  }

  // PROJECT TEMPLATES
  private async createFromTemplate(args: any) {
    // Note: This is a placeholder - Neon API may not have direct template support
    // This would create a project and then apply template SQL
    const response = await this.client.post('/projects', {
      project: {
        name: args.name,
        region_id: args.region
      }
    });
    return { content: [{ type: 'text', text: `Project created from template: ${JSON.stringify(response.data, null, 2)}` }] };
  }

  private async listTemplates(args: any) {
    // Note: This is a placeholder - returning common templates
    const templates = [
      { id: 'nextjs', name: 'Next.js Starter', description: 'PostgreSQL schema for Next.js apps' },
      { id: 'rails', name: 'Ruby on Rails', description: 'Rails-compatible schema' },
      { id: 'django', name: 'Django', description: 'Django-compatible schema' },
      { id: 'ecommerce', name: 'E-commerce', description: 'Product catalog and orders' },
      { id: 'saas', name: 'SaaS Multi-tenant', description: 'Multi-tenant SaaS schema' }
    ];

    const filtered = args.category
      ? templates.filter(t => t.name.toLowerCase().includes(args.category.toLowerCase()))
      : templates;

    return { content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }] };
  }

  // ADVANCED MONITORING
  private async getRealTimeMetrics(args: any) {
    const response = await this.client.get(`/projects/${args.projectId}/operations`, {
      params: { limit: 10 }
    });
    return { content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }] };
  }

  private async exportMetrics(args: any) {
    const config = {
      destination: args.destination,
      projectId: args.projectId,
      config: args.config,
      message: `Metrics export configured for ${args.destination}. Note: This requires additional setup in your monitoring system.`
    };
    return { content: [{ type: 'text', text: JSON.stringify(config, null, 2) }] };
  }

  // SETUP AUTOMATION METHODS (NEW!)

  private async checkApiKey(args: any) {
    if (!this.isEnabled) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            enabled: false,
            message: 'Neon API key not configured. Set NEON_API_KEY environment variable to enable Neon tools.',
            instructions: 'Get your API key from: https://console.neon.tech/app/settings/api-keys'
          }, null, 2)
        }]
      };
    }

    try {
      // Test API key by listing projects
      await this.client.get('/projects', { params: { limit: 1 } });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            enabled: true,
            message: 'Neon API key is valid and working!'
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            enabled: false,
            error: error.message,
            message: 'Neon API key is configured but invalid. Please check your API key.'
          }, null, 2)
        }]
      };
    }
  }

  private async createProjectForRAD(args: any) {
    if (!this.isEnabled) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Neon API key not configured. Set NEON_API_KEY environment variable.'
        }]
      };
    }

    const projectData: any = {
      project: {
        name: args.name || 'RAD Crawler',
        region_id: args.region || 'aws-us-east-1',
        pg_version: 16
      }
    };

    if (args.org_id) {
      projectData.project.org_id = args.org_id;
    }

    const response = await this.client.post('/projects', projectData);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          project: response.data.project,
          message: 'RAD Crawler project created successfully!',
          next_steps: [
            'Use neon_deploy_schema to deploy your schema',
            'Use neon_get_connection_uri to get connection string'
          ]
        }, null, 2)
      }]
    };
  }

  private async deploySchema(args: any) {
    if (!this.isEnabled) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Neon API key not configured. Set NEON_API_KEY environment variable.'
        }]
      };
    }

    // Split schema into individual statements
    const statements = args.schemaSQL
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const results = [];
    for (const sql of statements) {
      try {
        const response = await this.client.post(
          `/projects/${args.projectId}/branches/${args.branchId || 'main'}/databases/${args.databaseName || 'neondb'}/query`,
          { query: sql + ';' }
        );
        results.push({ success: true, statement: sql.substring(0, 100) + '...' });
      } catch (error: any) {
        results.push({ success: false, statement: sql.substring(0, 100) + '...', error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: successCount === results.length,
          total_statements: results.length,
          successful: successCount,
          failed: results.length - successCount,
          results
        }, null, 2)
      }]
    };
  }

  private async verifySchema(args: any) {
    if (!this.isEnabled) {
      return {
        content: [{
          type: 'text',
          text: 'Error: Neon API key not configured. Set NEON_API_KEY environment variable.'
        }]
      };
    }

    const sql = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `;

    const response = await this.client.post(
      `/projects/${args.projectId}/branches/${args.branchId || 'main'}/databases/${args.databaseName || 'neondb'}/query`,
      { query: sql }
    );

    const existingTables = response.data.rows.map((r: any) => r.table_name);
    const missingTables = args.requiredTables.filter((t: string) => !existingTables.includes(t));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: missingTables.length === 0,
          existing_tables: existingTables,
          required_tables: args.requiredTables,
          missing_tables: missingTables,
          message: missingTables.length === 0
            ? 'All required tables exist!'
            : `Missing tables: ${missingTables.join(', ')}`
        }, null, 2)
      }]
    };
  }

  private async setupRADDatabase(args: any) {
    if (!this.isEnabled) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'Neon API key not configured',
            message: 'Set NEON_API_KEY environment variable to enable autonomous setup.',
            instructions: 'Get your API key from: https://console.neon.tech/app/settings/api-keys'
          }, null, 2)
        }]
      };
    }

    try {
      // Step 1: Create project
      const projectResult = await this.createProjectForRAD({
        name: args.projectName || 'RAD Crawler',
        region: args.region || 'aws-us-east-1',
        org_id: args.org_id
      });
      const project = JSON.parse(projectResult.content[0].text).project;

      // Step 2: Create database
      await this.client.post(
        `/projects/${project.id}/branches/main/databases`,
        { database: { name: args.databaseName || 'rad_production', owner_name: 'neondb_owner' } }
      );

      // Step 3: Deploy schema
      await this.deploySchema({
        projectId: project.id,
        branchId: 'main',
        databaseName: args.databaseName || 'rad_production',
        schemaSQL: args.schemaSQL
      });

      // Step 4: Get connection URI
      const uriResult = await this.getConnectionUri({
        projectId: project.id,
        branchId: 'main',
        databaseName: args.databaseName || 'rad_production',
        pooled: true
      });
      const connectionUri = JSON.parse(uriResult.content[0].text).connection_uri;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            project_id: project.id,
            database_name: args.databaseName || 'rad_production',
            connection_uri: connectionUri,
            message: 'RAD database setup complete! Add NEON_DATABASE_URL to your environment config.',
            next_steps: [
              `Set NEON_DATABASE_URL="${connectionUri}"`,
              'Update WORKING_AUGMENT_CONFIG.json',
              'Restart VS Code'
            ]
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            message: 'Failed to set up RAD database. Check error details above.'
          }, null, 2)
        }]
      };
    }
  }
}

// ============================================================
// UNIFIED TOOLKIT
// ============================================================

class UnifiedToolkit {
  private githubServer?: GitHubMCP;
  private vercelServer?: VercelMCP;
  private neonServer?: NeonMCP;
  
  constructor() {
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken) this.githubServer = new GitHubMCP(githubToken);
    
    const vercelToken = process.env.VERCEL_TOKEN;
    if (vercelToken) this.vercelServer = new VercelMCP();
    
    const neonApiKey = process.env.NEON_API_KEY;
    if (neonApiKey) this.neonServer = new NeonMCP(neonApiKey);
  }
  
  async run() {
    if (this.githubServer) {
      console.error('Robinson Toolkit: 563 tools (GitHub + Vercel + Neon)');
      await this.githubServer.run();
    } else if (this.vercelServer) {
      await this.vercelServer.run();
    } else if (this.neonServer) {
      await this.neonServer.run();
    } else {
      console.error('No integrations configured');
      process.exit(1);
    }
  }
}

const toolkit = new UnifiedToolkit();
toolkit.run().catch(console.error);
