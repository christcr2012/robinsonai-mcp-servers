  /**
   * Get all original tool definitions (714 tools)
   * This extracts all tool definitions that were previously in ListToolsRequestSchema
   */
  private getOriginalToolDefinitions() {
    return [
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
      { name: 'github_update_ref', description: 'Update a reference', inputSchema: { type: 'object', properties: { owner: { type: 'string' }, repo: { type: 'string' }, ref: { type: 'string' }, sha: { type: 'string' }, force: { type: 'boolean' } }, required: ['owner', 'repo', 'ref', 'sha'] } },
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
      { name: 'neon_get_connection_uri_formatted', description: 'Get formatted connection URI for different clients.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, roleName: { type: 'string' }, pooled: { type: 'boolean' }, format: { type: 'string', enum: ['psql', 'jdbc', 'node', 'python', 'go', 'rust'] } }, required: ['projectId'] } },
      { name: 'neon_test_connection', description: 'Test database connection and return latency.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, roleName: { type: 'string' } }, required: ['projectId'] } },
      { name: 'neon_get_connection_examples', description: 'Get code examples for connecting to database.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, databaseName: { type: 'string' }, language: { type: 'string', enum: ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'php', 'ruby'] } }, required: ['projectId'] } },
      // PROJECT TEMPLATES (2 tools)
      { name: 'neon_create_from_template', description: 'Create project from template.', inputSchema: { type: 'object', properties: { templateId: { type: 'string' }, name: { type: 'string' }, region: { type: 'string' } }, required: ['templateId', 'name'] } },
      { name: 'neon_list_templates', description: 'List available project templates.', inputSchema: { type: 'object', properties: { category: { type: 'string' } } } },
      // ADVANCED MONITORING (2 tools)
      { name: 'neon_get_real_time_metrics', description: 'Get real-time performance metrics.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, branchId: { type: 'string' }, metrics: { type: 'array', items: { type: 'string' } } }, required: ['projectId'] } },
      { name: 'neon_export_metrics', description: 'Export metrics to external monitoring system.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, destination: { type: 'string', enum: ['prometheus', 'datadog', 'grafana', 'cloudwatch'] }, config: { type: 'object' } }, required: ['projectId', 'destination'] } },
      // ============================================================
      // UPSTASH (140 tools)
      // Layer 1: Management API (50 tools) + Layer 2: Redis REST API (90 tools)
      // ============================================================
      // ============================================================
      // UPSTASH MANAGEMENT API - REDIS DATABASE MANAGEMENT (15 tools)
      // ============================================================
      { name: 'upstash_list_redis_databases', description: 'List all Redis databases in your Upstash account', inputSchema: { type: 'object', properties: {} } },
      { name: 'upstash_get_redis_database', description: 'Get details of a specific Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_create_redis_database', description: 'Create a new Global Redis database (regional databases are deprecated)', inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'Database name' }, primary_region: { type: 'string', description: 'Primary region (e.g., us-east-1, eu-west-1, ap-southeast-1)' }, read_regions: { type: 'array', items: { type: 'string' }, description: 'Optional: Array of read replica regions for global distribution' }, tls: { type: 'boolean', description: 'Enable TLS (default: true)' }, eviction: { type: 'boolean', description: 'Enable eviction (default: false)' } }, required: ['name', 'primary_region'] } },
      { name: 'upstash_delete_redis_database', description: 'Delete a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_rename_redis_database', description: 'Rename a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' }, name: { type: 'string', description: 'New database name' } }, required: ['databaseId', 'name'] } },
      { name: 'upstash_reset_redis_password', description: 'Reset password for a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_enable_redis_eviction', description: 'Enable eviction for a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_disable_redis_eviction', description: 'Disable eviction for a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_enable_redis_tls', description: 'Enable TLS for a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_disable_redis_tls', description: 'Disable TLS for a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_get_redis_stats', description: 'Get statistics for a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_backup_redis_database', description: 'Create a backup of a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      { name: 'upstash_restore_redis_database', description: 'Restore a Redis database from backup', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' }, backupId: { type: 'string', description: 'Backup ID' } }, required: ['databaseId', 'backupId'] } },
      { name: 'upstash_update_redis_database', description: 'Update Redis database settings', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' }, settings: { type: 'object', description: 'Settings to update' } }, required: ['databaseId', 'settings'] } },
      { name: 'upstash_get_redis_usage', description: 'Get usage metrics for a Redis database', inputSchema: { type: 'object', properties: { databaseId: { type: 'string', description: 'Database ID' } }, required: ['databaseId'] } },
      // ============================================================
      // UPSTASH MANAGEMENT API - TEAM MANAGEMENT (6 tools)
      // ============================================================
      { name: 'upstash_list_teams', description: 'List all teams in your Upstash account', inputSchema: { type: 'object', properties: {} } },
      { name: 'upstash_get_team', description: 'Get details of a specific team', inputSchema: { type: 'object', properties: { teamId: { type: 'string', description: 'Team ID' } }, required: ['teamId'] } },
      { name: 'upstash_create_team', description: 'Create a new team', inputSchema: { type: 'object', properties: { name: { type: 'string', description: 'Team name' } }, required: ['name'] } },
      { name: 'upstash_delete_team', description: 'Delete a team', inputSchema: { type: 'object', properties: { teamId: { type: 'string', description: 'Team ID' } }, required: ['teamId'] } },
      { name: 'upstash_add_team_member', description: 'Add a member to a team', inputSchema: { type: 'object', properties: { teamId: { type: 'string', description: 'Team ID' }, email: { type: 'string', description: 'Member email' }, role: { type: 'string', description: 'Member role (admin, member)' } }, required: ['teamId', 'email'] } },
      { name: 'upstash_remove_team_member', description: 'Remove a member from a team', inputSchema: { type: 'object', properties: { teamId: { type: 'string', description: 'Team ID' }, memberId: { type: 'string', description: 'Member ID' } }, required: ['teamId', 'memberId'] } },
      // ============================================================
      // UPSTASH REDIS REST API - STRING OPERATIONS (17 tools)
      // ============================================================
      { name: 'upstash_redis_get', description: 'Get value by key from Redis', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' } }, required: ['key'] } },
      { name: 'upstash_redis_set', description: 'Set a Redis key-value pair with optional TTL', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, value: { type: 'string', description: 'Value to store' }, ex: { type: 'number', description: 'TTL in seconds (optional)' }, px: { type: 'number', description: 'TTL in milliseconds (optional)' }, nx: { type: 'boolean', description: 'Only set if key does not exist' }, xx: { type: 'boolean', description: 'Only set if key exists' } }, required: ['key', 'value'] } },
      { name: 'upstash_redis_mget', description: 'Get multiple values by keys', inputSchema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' }, description: 'Array of keys to retrieve' } }, required: ['keys'] } },
      { name: 'upstash_redis_mset', description: 'Set multiple key-value pairs', inputSchema: { type: 'object', properties: { pairs: { type: 'object', description: 'Object with key-value pairs' } }, required: ['pairs'] } },
      { name: 'upstash_redis_incr', description: 'Increment the integer value of a key by 1', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' } }, required: ['key'] } },
      { name: 'upstash_redis_decr', description: 'Decrement the integer value of a key by 1', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' } }, required: ['key'] } },
      { name: 'upstash_redis_incrby', description: 'Increment the integer value of a key by a specific amount', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, increment: { type: 'number', description: 'Amount to increment by' } }, required: ['key', 'increment'] } },
      { name: 'upstash_redis_decrby', description: 'Decrement the integer value of a key by a specific amount', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, decrement: { type: 'number', description: 'Amount to decrement by' } }, required: ['key', 'decrement'] } },
      { name: 'upstash_redis_incrbyfloat', description: 'Increment the float value of a key', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, increment: { type: 'number', description: 'Float amount to increment by' } }, required: ['key', 'increment'] } },
      { name: 'upstash_redis_append', description: 'Append a value to a key', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, value: { type: 'string', description: 'Value to append' } }, required: ['key', 'value'] } },
      { name: 'upstash_redis_getrange', description: 'Get substring of string value', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Key' }, start: { type: 'number', description: 'Start offset' }, end: { type: 'number', description: 'End offset' } }, required: ['key', 'start', 'end'] } },
      { name: 'upstash_redis_setrange', description: 'Overwrite part of string at offset', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Key' }, offset: { type: 'number', description: 'Offset' }, value: { type: 'string', description: 'Value' } }, required: ['key', 'offset', 'value'] } },
      { name: 'upstash_redis_strlen', description: 'Get the length of the value stored in a key', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' } }, required: ['key'] } },
      { name: 'upstash_redis_getset', description: 'Set key to value and return old value', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, value: { type: 'string', description: 'New value' } }, required: ['key', 'value'] } },
      { name: 'upstash_redis_setnx', description: 'Set key to value only if key does not exist', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, value: { type: 'string', description: 'Value' } }, required: ['key', 'value'] } },
      { name: 'upstash_redis_setex', description: 'Set key to value with expiration in seconds', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, seconds: { type: 'number', description: 'Expiration in seconds' }, value: { type: 'string', description: 'Value' } }, required: ['key', 'seconds', 'value'] } },
      { name: 'upstash_redis_psetex', description: 'Set key to value with expiration in milliseconds', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, milliseconds: { type: 'number', description: 'Expiration in milliseconds' }, value: { type: 'string', description: 'Value' } }, required: ['key', 'milliseconds', 'value'] } },
      // ============================================================
      // UPSTASH REDIS REST API - GENERIC KEY OPERATIONS (10 tools)
      // ============================================================
      { name: 'upstash_redis_del', description: 'Delete one or more keys', inputSchema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' }, description: 'Keys to delete' } }, required: ['keys'] } },
      { name: 'upstash_redis_exists', description: 'Check if key(s) exist', inputSchema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' }, description: 'Keys to check' } }, required: ['keys'] } },
      { name: 'upstash_redis_expire', description: 'Set expiration time for a key in seconds', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, seconds: { type: 'number', description: 'Expiration time in seconds' } }, required: ['key', 'seconds'] } },
      { name: 'upstash_redis_expireat', description: 'Set expiration time for a key as Unix timestamp', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' }, timestamp: { type: 'number', description: 'Unix timestamp' } }, required: ['key', 'timestamp'] } },
      { name: 'upstash_redis_ttl', description: 'Get TTL (time to live) for a key in seconds', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' } }, required: ['key'] } },
      { name: 'upstash_redis_pttl', description: 'Get TTL for a key in milliseconds', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' } }, required: ['key'] } },
      { name: 'upstash_redis_persist', description: 'Remove the expiration from a key', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' } }, required: ['key'] } },
      { name: 'upstash_redis_keys', description: 'Find all keys matching a pattern', inputSchema: { type: 'object', properties: { pattern: { type: 'string', description: 'Pattern to match (e.g., user:*)' } }, required: ['pattern'] } },
      { name: 'upstash_redis_scan', description: 'Incrementally iterate keys', inputSchema: { type: 'object', properties: { cursor: { type: 'string', description: 'Cursor (0 to start)' }, match: { type: 'string', description: 'Pattern to match' }, count: { type: 'number', description: 'Hint for count' } }, required: ['cursor'] } },
      { name: 'upstash_redis_rename', description: 'Rename a key', inputSchema: { type: 'object', properties: { oldKey: { type: 'string', description: 'Current key name' }, newKey: { type: 'string', description: 'New key name' } }, required: ['oldKey', 'newKey'] } },
      { name: 'upstash_redis_type', description: 'Get the type of a key', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Redis key' } }, required: ['key'] } },
      // ============================================================
      // UPSTASH REDIS REST API - SERVER OPERATIONS (10 tools)
      // ============================================================
      { name: 'upstash_redis_ping', description: 'Ping the Redis server', inputSchema: { type: 'object', properties: {} } },
      { name: 'upstash_redis_echo', description: 'Echo a message', inputSchema: { type: 'object', properties: { message: { type: 'string', description: 'Message to echo' } }, required: ['message'] } },
      { name: 'upstash_redis_dbsize', description: 'Get total number of keys in database', inputSchema: { type: 'object', properties: {} } },
      { name: 'upstash_redis_flushdb', description: 'Clear all keys in current database (DANGEROUS)', inputSchema: { type: 'object', properties: { confirm: { type: 'boolean', description: 'Must be true to confirm' } }, required: ['confirm'] } },
      { name: 'upstash_redis_flushall', description: 'Clear all keys in all databases (DANGEROUS)', inputSchema: { type: 'object', properties: { confirm: { type: 'boolean', description: 'Must be true to confirm' } }, required: ['confirm'] } },
      { name: 'upstash_redis_info', description: 'Get Redis server information and statistics', inputSchema: { type: 'object', properties: { section: { type: 'string', description: 'Info section (server, memory, stats, etc.)' } } } },
      { name: 'upstash_redis_time', description: 'Get current server time', inputSchema: { type: 'object', properties: {} } },
      { name: 'upstash_redis_lastsave', description: 'Get Unix timestamp of last successful save', inputSchema: { type: 'object', properties: {} } },
      { name: 'upstash_redis_save', description: 'Synchronously save dataset to disk', inputSchema: { type: 'object', properties: {} } },
      { name: 'upstash_redis_bgsave', description: 'Asynchronously save dataset to disk', inputSchema: { type: 'object', properties: {} } },
      // ============================================================
      // UPSTASH REDIS REST API - PUB/SUB OPERATIONS (2 tools)
      // ============================================================
      { name: 'upstash_redis_publish', description: 'Publish a message to a channel', inputSchema: { type: 'object', properties: { channel: { type: 'string', description: 'Channel name' }, message: { type: 'string', description: 'Message to publish' } }, required: ['channel', 'message'] } },
      { name: 'upstash_redis_pubsub_channels', description: 'List active pub/sub channels', inputSchema: { type: 'object', properties: { pattern: { type: 'string', description: 'Pattern to match (optional)' } } } },
      // ============================================================
      // UPSTASH REDIS REST API - PIPELINE & TRANSACTION (2 tools)
      // ============================================================
      { name: 'upstash_redis_pipeline', description: 'Execute multiple commands in a single HTTP request (batch)', inputSchema: { type: 'object', properties: { commands: { type: 'array', items: { type: 'array', items: { type: 'string' } }, description: 'Array of Redis commands' } }, required: ['commands'] } },
      { name: 'upstash_redis_transaction', description: 'Execute multiple commands atomically (MULTI/EXEC)', inputSchema: { type: 'object', properties: { commands: { type: 'array', items: { type: 'array', items: { type: 'string' } }, description: 'Array of Redis commands' } }, required: ['commands'] } },
      // ============================================================
      // UPSTASH REDIS REST API - HASH OPERATIONS (15 tools)
      // ============================================================
      { name: 'upstash_redis_hset', description: 'Set field in a hash', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, field: { type: 'string', description: 'Field name' }, value: { type: 'string', description: 'Field value' } }, required: ['key', 'field', 'value'] } },
      { name: 'upstash_redis_hget', description: 'Get field value from a hash', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, field: { type: 'string', description: 'Field name' } }, required: ['key', 'field'] } },
      { name: 'upstash_redis_hgetall', description: 'Get all fields and values from a hash', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' } }, required: ['key'] } },
      { name: 'upstash_redis_hdel', description: 'Delete one or more hash fields', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, fields: { type: 'array', items: { type: 'string' }, description: 'Field names to delete' } }, required: ['key', 'fields'] } },
      { name: 'upstash_redis_hexists', description: 'Check if a hash field exists', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, field: { type: 'string', description: 'Field name' } }, required: ['key', 'field'] } },
      { name: 'upstash_redis_hkeys', description: 'Get all field names in a hash', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' } }, required: ['key'] } },
      { name: 'upstash_redis_hvals', description: 'Get all values in a hash', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' } }, required: ['key'] } },
      { name: 'upstash_redis_hlen', description: 'Get the number of fields in a hash', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' } }, required: ['key'] } },
      { name: 'upstash_redis_hincrby', description: 'Increment hash field by integer', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, field: { type: 'string', description: 'Field name' }, increment: { type: 'number', description: 'Increment amount' } }, required: ['key', 'field', 'increment'] } },
      { name: 'upstash_redis_hincrbyfloat', description: 'Increment hash field by float', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, field: { type: 'string', description: 'Field name' }, increment: { type: 'number', description: 'Float increment' } }, required: ['key', 'field', 'increment'] } },
      { name: 'upstash_redis_hmget', description: 'Get multiple hash field values', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, fields: { type: 'array', items: { type: 'string' }, description: 'Field names' } }, required: ['key', 'fields'] } },
      { name: 'upstash_redis_hmset', description: 'Set multiple hash fields', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, fields: { type: 'object', description: 'Field-value pairs' } }, required: ['key', 'fields'] } },
      { name: 'upstash_redis_hsetnx', description: 'Set hash field only if it does not exist', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, field: { type: 'string', description: 'Field name' }, value: { type: 'string', description: 'Value' } }, required: ['key', 'field', 'value'] } },
      { name: 'upstash_redis_hstrlen', description: 'Get length of hash field value', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, field: { type: 'string', description: 'Field name' } }, required: ['key', 'field'] } },
      { name: 'upstash_redis_hscan', description: 'Incrementally iterate hash fields', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Hash key' }, cursor: { type: 'string', description: 'Cursor' }, match: { type: 'string', description: 'Pattern' }, count: { type: 'number', description: 'Count hint' } }, required: ['key', 'cursor'] } },
      // ============================================================
      // UPSTASH REDIS REST API - LIST OPERATIONS (14 tools)
      // ============================================================
      { name: 'upstash_redis_lpush', description: 'Prepend one or multiple values to a list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, values: { type: 'array', items: { type: 'string' }, description: 'Values to prepend' } }, required: ['key', 'values'] } },
      { name: 'upstash_redis_rpush', description: 'Append one or multiple values to a list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, values: { type: 'array', items: { type: 'string' }, description: 'Values to append' } }, required: ['key', 'values'] } },
      { name: 'upstash_redis_lpop', description: 'Remove and get the first element in a list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, count: { type: 'number', description: 'Number of elements to pop (optional)' } }, required: ['key'] } },
      { name: 'upstash_redis_rpop', description: 'Remove and get the last element in a list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, count: { type: 'number', description: 'Number of elements to pop (optional)' } }, required: ['key'] } },
      { name: 'upstash_redis_lrange', description: 'Get a range of elements from a list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, start: { type: 'number', description: 'Start index' }, stop: { type: 'number', description: 'Stop index' } }, required: ['key', 'start', 'stop'] } },
      { name: 'upstash_redis_llen', description: 'Get the length of a list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' } }, required: ['key'] } },
      { name: 'upstash_redis_lindex', description: 'Get element at index in list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, index: { type: 'number', description: 'Index' } }, required: ['key', 'index'] } },
      { name: 'upstash_redis_lset', description: 'Set element at index in list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, index: { type: 'number', description: 'Index' }, value: { type: 'string', description: 'Value' } }, required: ['key', 'index', 'value'] } },
      { name: 'upstash_redis_lrem', description: 'Remove elements from list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, count: { type: 'number', description: 'Count' }, value: { type: 'string', description: 'Value to remove' } }, required: ['key', 'count', 'value'] } },
      { name: 'upstash_redis_ltrim', description: 'Trim list to specified range', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, start: { type: 'number', description: 'Start index' }, stop: { type: 'number', description: 'Stop index' } }, required: ['key', 'start', 'stop'] } },
      { name: 'upstash_redis_linsert', description: 'Insert element before or after pivot in list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, position: { type: 'string', description: 'BEFORE or AFTER' }, pivot: { type: 'string', description: 'Pivot element' }, element: { type: 'string', description: 'Element to insert' } }, required: ['key', 'position', 'pivot', 'element'] } },
      { name: 'upstash_redis_rpoplpush', description: 'Remove last element from list and push to another list', inputSchema: { type: 'object', properties: { source: { type: 'string', description: 'Source list' }, destination: { type: 'string', description: 'Destination list' } }, required: ['source', 'destination'] } },
      { name: 'upstash_redis_lpos', description: 'Get position of element in list', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'List key' }, element: { type: 'string', description: 'Element to find' }, rank: { type: 'number', description: 'Rank (optional)' }, count: { type: 'number', description: 'Count (optional)' }, maxlen: { type: 'number', description: 'Max length (optional)' } }, required: ['key', 'element'] } },
      { name: 'upstash_redis_lmove', description: 'Move element from one list to another', inputSchema: { type: 'object', properties: { source: { type: 'string', description: 'Source list' }, destination: { type: 'string', description: 'Destination list' }, from: { type: 'string', description: 'LEFT or RIGHT' }, to: { type: 'string', description: 'LEFT or RIGHT' } }, required: ['source', 'destination', 'from', 'to'] } },
      // ============================================================
      // UPSTASH REDIS REST API - SET OPERATIONS (15 tools)
      // ============================================================
      { name: 'upstash_redis_sadd', description: 'Add one or more members to a set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Set key' }, members: { type: 'array', items: { type: 'string' }, description: 'Members to add' } }, required: ['key', 'members'] } },
      { name: 'upstash_redis_smembers', description: 'Get all members of a set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Set key' } }, required: ['key'] } },
      { name: 'upstash_redis_srem', description: 'Remove one or more members from a set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Set key' }, members: { type: 'array', items: { type: 'string' }, description: 'Members to remove' } }, required: ['key', 'members'] } },
      { name: 'upstash_redis_sismember', description: 'Check if a value is a member of a set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Set key' }, member: { type: 'string', description: 'Member to check' } }, required: ['key', 'member'] } },
      { name: 'upstash_redis_scard', description: 'Get the number of members in a set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Set key' } }, required: ['key'] } },
      { name: 'upstash_redis_spop', description: 'Remove and return random member from set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Set key' }, count: { type: 'number', description: 'Number of members (optional)' } }, required: ['key'] } },
      { name: 'upstash_redis_srandmember', description: 'Get random member from set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Set key' }, count: { type: 'number', description: 'Number of members (optional)' } }, required: ['key'] } },
      { name: 'upstash_redis_smove', description: 'Move member from one set to another', inputSchema: { type: 'object', properties: { source: { type: 'string', description: 'Source set' }, destination: { type: 'string', description: 'Destination set' }, member: { type: 'string', description: 'Member to move' } }, required: ['source', 'destination', 'member'] } },
      { name: 'upstash_redis_sunion', description: 'Union multiple sets', inputSchema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' }, description: 'Set keys' } }, required: ['keys'] } },
      { name: 'upstash_redis_sinter', description: 'Intersect multiple sets', inputSchema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' }, description: 'Set keys' } }, required: ['keys'] } },
      { name: 'upstash_redis_sdiff', description: 'Difference of sets', inputSchema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' }, description: 'Set keys' } }, required: ['keys'] } },
      { name: 'upstash_redis_sunionstore', description: 'Union sets and store result', inputSchema: { type: 'object', properties: { destination: { type: 'string', description: 'Destination key' }, keys: { type: 'array', items: { type: 'string' }, description: 'Source keys' } }, required: ['destination', 'keys'] } },
      { name: 'upstash_redis_sinterstore', description: 'Intersect sets and store result', inputSchema: { type: 'object', properties: { destination: { type: 'string', description: 'Destination key' }, keys: { type: 'array', items: { type: 'string' }, description: 'Source keys' } }, required: ['destination', 'keys'] } },
      { name: 'upstash_redis_sdiffstore', description: 'Difference of sets and store result', inputSchema: { type: 'object', properties: { destination: { type: 'string', description: 'Destination key' }, keys: { type: 'array', items: { type: 'string' }, description: 'Source keys' } }, required: ['destination', 'keys'] } },
      { name: 'upstash_redis_sscan', description: 'Incrementally iterate set members', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Set key' }, cursor: { type: 'string', description: 'Cursor' }, match: { type: 'string', description: 'Pattern' }, count: { type: 'number', description: 'Count hint' } }, required: ['key', 'cursor'] } },
      // ============================================================
      // UPSTASH REDIS REST API - SORTED SET OPERATIONS (23 tools)
      // ============================================================
      { name: 'upstash_redis_zadd', description: 'Add one or more members to a sorted set with scores', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, members: { type: 'array', items: { type: 'object', properties: { score: { type: 'number' }, value: { type: 'string' } } }, description: 'Array of {score, value} objects' } }, required: ['key', 'members'] } },
      { name: 'upstash_redis_zrange', description: 'Get a range of members from a sorted set by index', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, start: { type: 'number', description: 'Start index' }, stop: { type: 'number', description: 'Stop index' }, withScores: { type: 'boolean', description: 'Include scores in result' } }, required: ['key', 'start', 'stop'] } },
      { name: 'upstash_redis_zrem', description: 'Remove one or more members from a sorted set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, members: { type: 'array', items: { type: 'string' }, description: 'Members to remove' } }, required: ['key', 'members'] } },
      { name: 'upstash_redis_zscore', description: 'Get the score of a member in a sorted set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, member: { type: 'string', description: 'Member to get score for' } }, required: ['key', 'member'] } },
      { name: 'upstash_redis_zcard', description: 'Get the number of members in a sorted set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' } }, required: ['key'] } },
      { name: 'upstash_redis_zrank', description: 'Get the rank of a member in a sorted set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, member: { type: 'string', description: 'Member to get rank for' } }, required: ['key', 'member'] } },
      { name: 'upstash_redis_zrevrank', description: 'Get the reverse rank of a member in a sorted set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, member: { type: 'string', description: 'Member' } }, required: ['key', 'member'] } },
      { name: 'upstash_redis_zrangebyscore', description: 'Get members in sorted set by score range', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, min: { type: 'string', description: 'Min score' }, max: { type: 'string', description: 'Max score' }, withscores: { type: 'boolean', description: 'Include scores' } }, required: ['key', 'min', 'max'] } },
      { name: 'upstash_redis_zrevrangebyscore', description: 'Get members in sorted set by score range (reverse order)', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, max: { type: 'string', description: 'Max score' }, min: { type: 'string', description: 'Min score' }, withscores: { type: 'boolean', description: 'Include scores' } }, required: ['key', 'max', 'min'] } },
      { name: 'upstash_redis_zremrangebyrank', description: 'Remove members by rank range', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, start: { type: 'number', description: 'Start rank' }, stop: { type: 'number', description: 'Stop rank' } }, required: ['key', 'start', 'stop'] } },
      { name: 'upstash_redis_zremrangebyscore', description: 'Remove members by score range', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, min: { type: 'string', description: 'Min score' }, max: { type: 'string', description: 'Max score' } }, required: ['key', 'min', 'max'] } },
      { name: 'upstash_redis_zpopmin', description: 'Remove and return members with lowest scores', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, count: { type: 'number', description: 'Number of members (optional)' } }, required: ['key'] } },
      { name: 'upstash_redis_zpopmax', description: 'Remove and return members with highest scores', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, count: { type: 'number', description: 'Number of members (optional)' } }, required: ['key'] } },
      { name: 'upstash_redis_zincrby', description: 'Increment score of member in sorted set', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, increment: { type: 'number', description: 'Increment amount' }, member: { type: 'string', description: 'Member' } }, required: ['key', 'increment', 'member'] } },
      { name: 'upstash_redis_zcount', description: 'Count members in score range', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, min: { type: 'string', description: 'Min score' }, max: { type: 'string', description: 'Max score' } }, required: ['key', 'min', 'max'] } },
      { name: 'upstash_redis_zunionstore', description: 'Union sorted sets and store result', inputSchema: { type: 'object', properties: { destination: { type: 'string', description: 'Destination key' }, keys: { type: 'array', items: { type: 'string' }, description: 'Source keys' }, weights: { type: 'array', items: { type: 'number' }, description: 'Weights (optional)' } }, required: ['destination', 'keys'] } },
      { name: 'upstash_redis_zinterstore', description: 'Intersect sorted sets and store result', inputSchema: { type: 'object', properties: { destination: { type: 'string', description: 'Destination key' }, keys: { type: 'array', items: { type: 'string' }, description: 'Source keys' }, weights: { type: 'array', items: { type: 'number' }, description: 'Weights (optional)' } }, required: ['destination', 'keys'] } },
      { name: 'upstash_redis_zscan', description: 'Incrementally iterate sorted set members', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, cursor: { type: 'string', description: 'Cursor' }, match: { type: 'string', description: 'Pattern' }, count: { type: 'number', description: 'Count hint' } }, required: ['key', 'cursor'] } },
      { name: 'upstash_redis_zrangebylex', description: 'Get members by lexicographical range', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, min: { type: 'string', description: 'Min value' }, max: { type: 'string', description: 'Max value' } }, required: ['key', 'min', 'max'] } },
      { name: 'upstash_redis_zrevrangebylex', description: 'Get members by lexicographical range (reverse)', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, max: { type: 'string', description: 'Max value' }, min: { type: 'string', description: 'Min value' } }, required: ['key', 'max', 'min'] } },
      { name: 'upstash_redis_zremrangebylex', description: 'Remove members by lexicographical range', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, min: { type: 'string', description: 'Min value' }, max: { type: 'string', description: 'Max value' } }, required: ['key', 'min', 'max'] } },
      { name: 'upstash_redis_zlexcount', description: 'Count members in lexicographical range', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, min: { type: 'string', description: 'Min value' }, max: { type: 'string', description: 'Max value' } }, required: ['key', 'min', 'max'] } },
      { name: 'upstash_redis_zmscore', description: 'Get scores of multiple members', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Sorted set key' }, members: { type: 'array', items: { type: 'string' }, description: 'Members' } }, required: ['key', 'members'] } },
      // ============================================================
      // UPSTASH REDIS REST API - GEOSPATIAL OPERATIONS (7 tools)
      // ============================================================
      { name: 'upstash_redis_geoadd', description: 'Add geospatial items (longitude, latitude, member)', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Geo key' }, members: { type: 'array', items: { type: 'object', properties: { longitude: { type: 'number' }, latitude: { type: 'number' }, member: { type: 'string' } } }, description: 'Array of geo members' } }, required: ['key', 'members'] } },
      { name: 'upstash_redis_geodist', description: 'Get distance between two members', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Geo key' }, member1: { type: 'string', description: 'First member' }, member2: { type: 'string', description: 'Second member' }, unit: { type: 'string', description: 'Unit (m, km, mi, ft)' } }, required: ['key', 'member1', 'member2'] } },
      { name: 'upstash_redis_geohash', description: 'Get geohash of members', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Geo key' }, members: { type: 'array', items: { type: 'string' }, description: 'Members' } }, required: ['key', 'members'] } },
      { name: 'upstash_redis_geopos', description: 'Get positions of members', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Geo key' }, members: { type: 'array', items: { type: 'string' }, description: 'Members' } }, required: ['key', 'members'] } },
      { name: 'upstash_redis_georadius', description: 'Query members within radius', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Geo key' }, longitude: { type: 'number', description: 'Center longitude' }, latitude: { type: 'number', description: 'Center latitude' }, radius: { type: 'number', description: 'Radius' }, unit: { type: 'string', description: 'Unit (m, km, mi, ft)' } }, required: ['key', 'longitude', 'latitude', 'radius', 'unit'] } },
      { name: 'upstash_redis_georadiusbymember', description: 'Query members within radius of a member', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Geo key' }, member: { type: 'string', description: 'Center member' }, radius: { type: 'number', description: 'Radius' }, unit: { type: 'string', description: 'Unit (m, km, mi, ft)' } }, required: ['key', 'member', 'radius', 'unit'] } },
      { name: 'upstash_redis_geosearch', description: 'Search for members in geospatial index', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Geo key' }, from: { type: 'object', description: 'Search origin (member or coordinates)' }, by: { type: 'object', description: 'Search criteria (radius or box)' } }, required: ['key', 'from', 'by'] } },
      // ============================================================
      // UPSTASH REDIS REST API - HYPERLOGLOG OPERATIONS (3 tools)
      // ============================================================
      { name: 'upstash_redis_pfadd', description: 'Add elements to HyperLogLog', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'HyperLogLog key' }, elements: { type: 'array', items: { type: 'string' }, description: 'Elements to add' } }, required: ['key', 'elements'] } },
      { name: 'upstash_redis_pfcount', description: 'Get cardinality of HyperLogLog', inputSchema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' }, description: 'HyperLogLog keys' } }, required: ['keys'] } },
      { name: 'upstash_redis_pfmerge', description: 'Merge HyperLogLogs', inputSchema: { type: 'object', properties: { destination: { type: 'string', description: 'Destination key' }, sources: { type: 'array', items: { type: 'string' }, description: 'Source keys' } }, required: ['destination', 'sources'] } },
      // ============================================================
      // UPSTASH REDIS REST API - BITMAP OPERATIONS (5 tools)
      // ============================================================
      { name: 'upstash_redis_setbit', description: 'Set or clear bit at offset', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Key' }, offset: { type: 'number', description: 'Bit offset' }, value: { type: 'number', description: '0 or 1' } }, required: ['key', 'offset', 'value'] } },
      { name: 'upstash_redis_getbit', description: 'Get bit value at offset', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Key' }, offset: { type: 'number', description: 'Bit offset' } }, required: ['key', 'offset'] } },
      { name: 'upstash_redis_bitcount', description: 'Count set bits in a string', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Key' }, start: { type: 'number', description: 'Start byte (optional)' }, end: { type: 'number', description: 'End byte (optional)' } }, required: ['key'] } },
      { name: 'upstash_redis_bitpos', description: 'Find first bit set to 0 or 1', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Key' }, bit: { type: 'number', description: '0 or 1' }, start: { type: 'number', description: 'Start byte (optional)' }, end: { type: 'number', description: 'End byte (optional)' } }, required: ['key', 'bit'] } },
      { name: 'upstash_redis_bitop', description: 'Perform bitwise operations', inputSchema: { type: 'object', properties: { operation: { type: 'string', description: 'AND, OR, XOR, NOT' }, destkey: { type: 'string', description: 'Destination key' }, keys: { type: 'array', items: { type: 'string' }, description: 'Source keys' } }, required: ['operation', 'destkey', 'keys'] } },
      // ============================================================
      // UPSTASH REDIS REST API - STREAM OPERATIONS (12 tools)
      // ============================================================
      { name: 'upstash_redis_xadd', description: 'Add entry to a stream', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' }, id: { type: 'string', description: 'Entry ID (* for auto-generate)' }, fields: { type: 'object', description: 'Field-value pairs' } }, required: ['key', 'id', 'fields'] } },
      { name: 'upstash_redis_xread', description: 'Read entries from one or more streams', inputSchema: { type: 'object', properties: { streams: { type: 'object', description: 'Stream keys and IDs' }, count: { type: 'number', description: 'Max entries to return' }, block: { type: 'number', description: 'Block for milliseconds' } }, required: ['streams'] } },
      { name: 'upstash_redis_xrange', description: 'Get range of entries from a stream', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' }, start: { type: 'string', description: 'Start ID (- for min)' }, end: { type: 'string', description: 'End ID (+ for max)' }, count: { type: 'number', description: 'Max entries' } }, required: ['key', 'start', 'end'] } },
      { name: 'upstash_redis_xrevrange', description: 'Get range of entries from a stream (reverse order)', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' }, end: { type: 'string', description: 'End ID (+ for max)' }, start: { type: 'string', description: 'Start ID (- for min)' }, count: { type: 'number', description: 'Max entries' } }, required: ['key', 'end', 'start'] } },
      { name: 'upstash_redis_xlen', description: 'Get the length of a stream', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' } }, required: ['key'] } },
      { name: 'upstash_redis_xdel', description: 'Delete entries from a stream', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' }, ids: { type: 'array', items: { type: 'string' }, description: 'Entry IDs to delete' } }, required: ['key', 'ids'] } },
      { name: 'upstash_redis_xtrim', description: 'Trim stream to specified length', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' }, strategy: { type: 'string', description: 'MAXLEN or MINID' }, threshold: { type: 'string', description: 'Threshold value' }, approximate: { type: 'boolean', description: 'Use approximate trimming' } }, required: ['key', 'strategy', 'threshold'] } },
      { name: 'upstash_redis_xack', description: 'Acknowledge stream messages', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' }, group: { type: 'string', description: 'Consumer group' }, ids: { type: 'array', items: { type: 'string' }, description: 'Message IDs' } }, required: ['key', 'group', 'ids'] } },
      { name: 'upstash_redis_xpending', description: 'Get pending messages info', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' }, group: { type: 'string', description: 'Consumer group' }, start: { type: 'string', description: 'Start ID (optional)' }, end: { type: 'string', description: 'End ID (optional)' }, count: { type: 'number', description: 'Count (optional)' } }, required: ['key', 'group'] } },
      { name: 'upstash_redis_xclaim', description: 'Claim pending messages', inputSchema: { type: 'object', properties: { key: { type: 'string', description: 'Stream key' }, group: { type: 'string', description: 'Consumer group' }, consumer: { type: 'string', description: 'Consumer name' }, minIdleTime: { type: 'number', description: 'Min idle time in ms' }, ids: { type: 'array', items: { type: 'string' }, description: 'Message IDs' } }, required: ['key', 'group', 'consumer', 'minIdleTime', 'ids'] } },
      { name: 'upstash_redis_xinfo', description: 'Get stream information', inputSchema: { type: 'object', properties: { subcommand: { type: 'string', description: 'STREAM, GROUPS, or CONSUMERS' }, key: { type: 'string', description: 'Stream key' }, group: { type: 'string', description: 'Group name (for CONSUMERS)' } }, required: ['subcommand', 'key'] } },
      { name: 'upstash_redis_xgroup', description: 'Manage consumer groups', inputSchema: { type: 'object', properties: { subcommand: { type: 'string', description: 'CREATE, DESTROY, SETID, DELCONSUMER' }, key: { type: 'string', description: 'Stream key' }, group: { type: 'string', description: 'Group name' }, id: { type: 'string', description: 'ID (for CREATE/SETID)' }, consumer: { type: 'string', description: 'Consumer name (for DELCONSUMER)' } }, required: ['subcommand', 'key', 'group'] } }
    ];
  }