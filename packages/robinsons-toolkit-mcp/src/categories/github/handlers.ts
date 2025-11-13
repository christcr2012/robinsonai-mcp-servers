/**
 * GitHub Handler Functions
 * Extracted from temp-github-mcp.ts
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || '';
const BASE_URL = 'https://api.github.com';

if (!GITHUB_TOKEN) {
  console.warn('Warning: GITHUB_TOKEN or GITHUB_PAT environment variable not set');
}

interface GitHubClient {
  get(path: string, params?: any): Promise<any>;
  post(path: string, body?: any): Promise<any>;
  patch(path: string, body?: any): Promise<any>;
  put(path: string, body?: any): Promise<any>;
  delete(path: string): Promise<any>;
}

async function githubFetch(path: string, options: RequestInit = {}): Promise<any> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
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

const client: GitHubClient = {
  get: (path: string, params?: any) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return githubFetch(`${path}${query}`, { method: 'GET' });
  },
  post: (path: string, body?: any) =>
    githubFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: any) =>
    githubFetch(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: (path: string, body?: any) =>
    githubFetch(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string) =>
    githubFetch(path, { method: 'DELETE' }),
};

function formatResponse(data: any) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

  export async function githubListRepos(args: any) {
    const params: any = {};
    if (args.type) params.type = args.type;
    if (args.sort) params.sort = args.sort;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const path = args.org ? `/orgs/${args.org}/repos` : '/user/repos';
    const response = await client.get(path, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepo(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateRepo(args: any) {
    const body: any = { name: args.name };
    if (args.description) body.description = args.description;
    if (args.private !== undefined) body.private = args.private;
    if (args.auto_init !== undefined) body.auto_init = args.auto_init;
    if (args.gitignore_template) body.gitignore_template = args.gitignore_template;
    if (args.license_template) body.license_template = args.license_template;
    const path = args.org ? `/orgs/${args.org}/repos` : '/user/repos';
    const response = await client.post(path, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateRepo(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.description !== undefined) body.description = args.description;
    if (args.private !== undefined) body.private = args.private;
    if (args.has_issues !== undefined) body.has_issues = args.has_issues;
    if (args.has_projects !== undefined) body.has_projects = args.has_projects;
    if (args.has_wiki !== undefined) body.has_wiki = args.has_wiki;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteRepo(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}`);
    return { content: [{ type: 'text', text: 'Repository deleted successfully' }] };
  }

  export async function githubListRepoTopics(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/topics`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubReplaceRepoTopics(args: any) {
    const response = await client.put(`/repos/${args.owner}/${args.repo}/topics`, { names: args.names });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListRepoLanguages(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/languages`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListRepoTags(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/tags`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListRepoTeams(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/teams`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubTransferRepo(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/transfer`, { new_owner: args.new_owner });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubEnableAutomatedSecurityFixes(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/automated-security-fixes`);
    return { content: [{ type: 'text', text: 'Automated security fixes enabled' }] };
  }

  export async function githubDisableAutomatedSecurityFixes(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/automated-security-fixes`);
    return { content: [{ type: 'text', text: 'Automated security fixes disabled' }] };
  }

  export async function githubEnableVulnerabilityAlerts(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/vulnerability-alerts`);
    return { content: [{ type: 'text', text: 'Vulnerability alerts enabled' }] };
  }

  export async function githubDisableVulnerabilityAlerts(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/vulnerability-alerts`);
    return { content: [{ type: 'text', text: 'Vulnerability alerts disabled' }] };
  }

  export async function githubGetRepoReadme(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/readme`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepoLicense(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/license`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepoCommunityProfile(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/community/profile`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepoStatsContributors(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/stats/contributors`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepoStatsCommitActivity(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/stats/commit_activity`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }


  // BRANCH MANAGEMENT METHODS
  export async function githubListBranches(args: any) {
    const params: any = {};
    if (args.protected !== undefined) params.protected = args.protected;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetBranch(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateBranch(args: any) {
    const fromBranch = args.from_branch || 'main';
    const refResponse = await client.get(`/repos/${args.owner}/${args.repo}/git/ref/heads/${fromBranch}`);
    const sha = refResponse.object.sha;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/git/refs`, {
      ref: `refs/heads/${args.branch}`,
      sha
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteBranch(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/git/refs/heads/${args.branch}`);
    return { content: [{ type: 'text', text: 'Branch deleted successfully' }] };
  }

  export async function githubMergeBranch(args: any) {
    const body: any = { base: args.base, head: args.head };
    if (args.commit_message) body.commit_message = args.commit_message;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/merges`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetBranchProtection(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateBranchProtection(args: any) {
    const body: any = {};
    if (args.required_status_checks) body.required_status_checks = args.required_status_checks;
    if (args.enforce_admins !== undefined) body.enforce_admins = args.enforce_admins;
    if (args.required_pull_request_reviews) body.required_pull_request_reviews = args.required_pull_request_reviews;
    if (args.restrictions) body.restrictions = args.restrictions;
    const response = await client.put(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteBranchProtection(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`);
    return { content: [{ type: 'text', text: 'Branch protection removed' }] };
  }

  export async function githubGetRequiredStatusChecks(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_status_checks`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateRequiredStatusChecks(args: any) {
    const body: any = {};
    if (args.strict !== undefined) body.strict = args.strict;
    if (args.contexts) body.contexts = args.contexts;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_status_checks`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetAdminEnforcement(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/enforce_admins`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubSetAdminEnforcement(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/enforce_admins`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetPullRequestReviewEnforcement(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_pull_request_reviews`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdatePullRequestReviewEnforcement(args: any) {
    const body: any = {};
    if (args.dismissal_restrictions) body.dismissal_restrictions = args.dismissal_restrictions;
    if (args.dismiss_stale_reviews !== undefined) body.dismiss_stale_reviews = args.dismiss_stale_reviews;
    if (args.require_code_owner_reviews !== undefined) body.require_code_owner_reviews = args.require_code_owner_reviews;
    if (args.required_approving_review_count) body.required_approving_review_count = args.required_approving_review_count;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_pull_request_reviews`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubRenameBranch(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/rename`, { new_name: args.new_name });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COMMITS METHODS
  export async function githubListCommits(args: any) {
    const params: any = {};
    if (args.sha) params.sha = args.sha;
    if (args.path) params.path = args.path;
    if (args.author) params.author = args.author;
    if (args.since) params.since = args.since;
    if (args.until) params.until = args.until;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetCommit(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCompareCommits(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/compare/${args.base}...${args.head}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListCommitComments(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateCommitComment(args: any) {
    const body: any = { body: args.body };
    if (args.path) body.path = args.path;
    if (args.position) body.position = args.position;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/commits/${args.commit_sha}/comments`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetCommitStatus(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/status`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListCommitStatuses(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/statuses`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateCommitStatus(args: any) {
    const body: any = { state: args.state };
    if (args.target_url) body.target_url = args.target_url;
    if (args.description) body.description = args.description;
    if (args.context) body.context = args.context;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/statuses/${args.sha}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListPullRequestsAssociatedWithCommit(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.commit_sha}/pulls`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetCommitSignatureVerification(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.commit.verification, null, 2) }] };
  }

  // ISSUES METHODS
  export async function githubListIssues(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.labels) params.labels = args.labels.join(',');
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetIssue(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateIssue(args: any) {
    const body: any = { title: args.title };
    if (args.body) body.body = args.body;
    if (args.assignees) body.assignees = args.assignees;
    if (args.milestone) body.milestone = args.milestone;
    if (args.labels) body.labels = args.labels;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/issues`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateIssue(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    if (args.state) body.state = args.state;
    if (args.assignees) body.assignees = args.assignees;
    if (args.labels) body.labels = args.labels;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubLockIssue(args: any) {
    const body: any = {};
    if (args.lock_reason) body.lock_reason = args.lock_reason;
    await client.put(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/lock`, body);
    return { content: [{ type: 'text', text: 'Issue locked successfully' }] };
  }

  export async function githubUnlockIssue(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/lock`);
    return { content: [{ type: 'text', text: 'Issue unlocked successfully' }] };
  }

  export async function githubAddAssignees(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/assignees`, { assignees: args.assignees });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubRemoveAssignees(args: any) {
    const response = await client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/assignees`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubAddLabels(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels`, { labels: args.labels });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubRemoveLabel(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels/${args.name}`);
    return { content: [{ type: 'text', text: 'Label removed successfully' }] };
  }

  export async function githubReplaceLabels(args: any) {
    const response = await client.put(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels`, { labels: args.labels || [] });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListIssueComments(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateIssueComment(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/comments`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateIssueComment(args: any) {
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/issues/comments/${args.comment_id}`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteIssueComment(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/issues/comments/${args.comment_id}`);
    return { content: [{ type: 'text', text: 'Comment deleted successfully' }] };
  }

  export async function githubListIssueEvents(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/events`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListIssueTimeline(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/timeline`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListLabels(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/labels`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateLabel(args: any) {
    const body: any = { name: args.name, color: args.color };
    if (args.description) body.description = args.description;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/labels`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteLabel(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/labels/${args.name}`);
    return { content: [{ type: 'text', text: 'Label deleted successfully' }] };
  }

  // PULL REQUESTS METHODS
  export async function githubListPullRequests(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.head) params.head = args.head;
    if (args.base) params.base = args.base;
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetPullRequest(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreatePullRequest(args: any) {
    const body: any = { title: args.title, head: args.head, base: args.base };
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.maintainer_can_modify !== undefined) body.maintainer_can_modify = args.maintainer_can_modify;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdatePullRequest(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    if (args.state) body.state = args.state;
    if (args.base) body.base = args.base;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubMergePullRequest(args: any) {
    const body: any = {};
    if (args.commit_title) body.commit_title = args.commit_title;
    if (args.commit_message) body.commit_message = args.commit_message;
    if (args.merge_method) body.merge_method = args.merge_method;
    const response = await client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/merge`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetPullRequestMergeStatus(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/merge`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListPullRequestCommits(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/commits`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListPullRequestFiles(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/files`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListPullRequestReviews(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetPullRequestReview(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreatePullRequestReview(args: any) {
    const body: any = { event: args.event };
    if (args.body) body.body = args.body;
    if (args.comments) body.comments = args.comments;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubSubmitPullRequestReview(args: any) {
    const body: any = { event: args.event };
    if (args.body) body.body = args.body;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}/events`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDismissPullRequestReview(args: any) {
    const response = await client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}/dismissals`, { message: args.message });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListPullRequestReviewComments(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreatePullRequestReviewComment(args: any) {
    const body: any = { body: args.body, commit_id: args.commit_id, path: args.path };
    if (args.line) body.line = args.line;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/comments`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdatePullRequestReviewComment(args: any) {
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/pulls/comments/${args.comment_id}`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeletePullRequestReviewComment(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/pulls/comments/${args.comment_id}`);
    return { content: [{ type: 'text', text: 'Comment deleted successfully' }] };
  }

  export async function githubRequestPullRequestReviewers(args: any) {
    const body: any = {};
    if (args.reviewers) body.reviewers = args.reviewers;
    if (args.team_reviewers) body.team_reviewers = args.team_reviewers;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubRemovePullRequestReviewers(args: any) {
    const body: any = {};
    if (args.reviewers) body.reviewers = args.reviewers;
    if (args.team_reviewers) body.team_reviewers = args.team_reviewers;
    const response = await client.delete(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdatePullRequestBranch(args: any) {
    const body: any = {};
    if (args.expected_head_sha) body.expected_head_sha = args.expected_head_sha;
    const response = await client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/update-branch`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListRequestedReviewers(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCheckPullRequestReviewability(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`);
    return { content: [{ type: 'text', text: JSON.stringify({ mergeable: response.mergeable, mergeable_state: response.mergeable_state }, null, 2) }] };
  }

  export async function githubGetPullRequestDiff(args: any) {
    const response = await this.fetch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, { headers: { 'Accept': 'application/vnd.github.v3.diff' } });
    return { content: [{ type: 'text', text: response }] };
  }

  export async function githubGetPullRequestPatch(args: any) {
    const response = await this.fetch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, { headers: { 'Accept': 'application/vnd.github.v3.patch' } });
    return { content: [{ type: 'text', text: response }] };
  }

  export async function githubConvertIssueToPullRequest(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls`, { issue: args.issue_number, head: args.head, base: args.base });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // GITHUB ACTIONS METHODS
  export async function githubListWorkflows(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/workflows`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetWorkflow(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDisableWorkflow(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/disable`, {});
    return { content: [{ type: 'text', text: 'Workflow disabled successfully' }] };
  }

  export async function githubEnableWorkflow(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/enable`, {});
    return { content: [{ type: 'text', text: 'Workflow enabled successfully' }] };
  }

  export async function githubCreateWorkflowDispatch(args: any) {
    const body: any = { ref: args.ref };
    if (args.inputs) body.inputs = args.inputs;
    await client.post(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/dispatches`, body);
    return { content: [{ type: 'text', text: 'Workflow dispatch triggered successfully' }] };
  }

  export async function githubListWorkflowRuns(args: any) {
    const params: any = {};
    if (args.workflow_id) params.workflow_id = args.workflow_id;
    if (args.actor) params.actor = args.actor;
    if (args.branch) params.branch = args.branch;
    if (args.event) params.event = args.event;
    if (args.status) params.status = args.status;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetWorkflowRun(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCancelWorkflowRun(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/cancel`, {});
    return { content: [{ type: 'text', text: 'Workflow run cancelled successfully' }] };
  }

  export async function githubRerunWorkflow(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/rerun`, {});
    return { content: [{ type: 'text', text: 'Workflow rerun triggered successfully' }] };
  }

  export async function githubRerunFailedJobs(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/rerun-failed-jobs`, {});
    return { content: [{ type: 'text', text: 'Failed jobs rerun triggered successfully' }] };
  }

  export async function githubDeleteWorkflowRun(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}`);
    return { content: [{ type: 'text', text: 'Workflow run deleted successfully' }] };
  }

  export async function githubListWorkflowRunArtifacts(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/artifacts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDownloadWorkflowRunLogs(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/logs`);
    return { content: [{ type: 'text', text: 'Logs download URL: ' + JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteWorkflowRunLogs(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/logs`);
    return { content: [{ type: 'text', text: 'Workflow run logs deleted successfully' }] };
  }

  export async function githubListWorkflowRunJobs(args: any) {
    const params: any = {};
    if (args.filter) params.filter = args.filter;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/jobs`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetWorkflowRunJob(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/jobs/${args.job_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDownloadJobLogs(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/jobs/${args.job_id}/logs`);
    return { content: [{ type: 'text', text: 'Job logs download URL: ' + JSON.stringify(response, null, 2) }] };
  }

  export async function githubListRepoSecrets(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/secrets`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateOrUpdateRepoSecret(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/actions/secrets/${args.secret_name}`, { encrypted_value: args.encrypted_value });
    return { content: [{ type: 'text', text: 'Secret created/updated successfully' }] };
  }

  export async function githubDeleteRepoSecret(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/actions/secrets/${args.secret_name}`);
    return { content: [{ type: 'text', text: 'Secret deleted successfully' }] };
  }

  // RELEASES METHODS
  export async function githubListReleases(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRelease(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetLatestRelease(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/latest`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetReleaseByTag(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/tags/${args.tag}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateRelease(args: any) {
    const body: any = { tag_name: args.tag_name };
    if (args.target_commitish) body.target_commitish = args.target_commitish;
    if (args.name) body.name = args.name;
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.prerelease !== undefined) body.prerelease = args.prerelease;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/releases`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateRelease(args: any) {
    const body: any = {};
    if (args.tag_name) body.tag_name = args.tag_name;
    if (args.name) body.name = args.name;
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.prerelease !== undefined) body.prerelease = args.prerelease;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteRelease(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`);
    return { content: [{ type: 'text', text: 'Release deleted successfully' }] };
  }

  export async function githubListReleaseAssets(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}/assets`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetReleaseAsset(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateReleaseAsset(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.label) body.label = args.label;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteReleaseAsset(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`);
    return { content: [{ type: 'text', text: 'Release asset deleted successfully' }] };
  }

  export async function githubGenerateReleaseNotes(args: any) {
    const body: any = { tag_name: args.tag_name };
    if (args.target_commitish) body.target_commitish = args.target_commitish;
    if (args.previous_tag_name) body.previous_tag_name = args.previous_tag_name;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/releases/generate-notes`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // FILES & CONTENT METHODS
  export async function githubGetContent(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/contents/${args.path}`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateOrUpdateFile(args: any) {
    const body: any = { message: args.message, content: args.content };
    if (args.sha) body.sha = args.sha;
    if (args.branch) body.branch = args.branch;
    const response = await client.put(`/repos/${args.owner}/${args.repo}/contents/${args.path}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteFile(args: any) {
    const body: any = { message: args.message, sha: args.sha };
    if (args.branch) body.branch = args.branch;
    const response = await client.delete(`/repos/${args.owner}/${args.repo}/contents/${args.path}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetArchive(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/${args.archive_format}/${args.ref || 'main'}`);
    return { content: [{ type: 'text', text: 'Archive URL: ' + JSON.stringify(response, null, 2) }] };
  }

  export async function githubListRepoContributors(args: any) {
    const params: any = {};
    if (args.anon) params.anon = args.anon;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/contributors`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepoClones(args: any) {
    const params: any = {};
    if (args.per) params.per = args.per;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/traffic/clones`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepoViews(args: any) {
    const params: any = {};
    if (args.per) params.per = args.per;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/traffic/views`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepoTopPaths(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/traffic/popular/paths`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRepoTopReferrers(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/traffic/popular/referrers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateTree(args: any) {
    const body: any = { tree: args.tree };
    if (args.base_tree) body.base_tree = args.base_tree;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/git/trees`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetTree(args: any) {
    const params: any = {};
    if (args.recursive) params.recursive = '1';
    const response = await client.get(`/repos/${args.owner}/${args.repo}/git/trees/${args.tree_sha}`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetBlob(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/git/blobs/${args.file_sha}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateBlob(args: any) {
    const body: any = { content: args.content };
    if (args.encoding) body.encoding = args.encoding;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/git/blobs`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateCommit(args: any) {
    const body: any = { message: args.message, tree: args.tree };
    if (args.parents) body.parents = args.parents;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/git/commits`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetRef(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/git/ref/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COLLABORATORS & PERMISSIONS METHODS
  export async function githubListCollaborators(args: any) {
    const params: any = {};
    if (args.affiliation) params.affiliation = args.affiliation;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/collaborators`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCheckCollaborator(args: any) {
    try {
      await client.get(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`);
      return { content: [{ type: 'text', text: 'User is a collaborator' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not a collaborator' }] };
    }
  }

  export async function githubAddCollaborator(args: any) {
    const body: any = {};
    if (args.permission) body.permission = args.permission;
    await client.put(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`, body);
    return { content: [{ type: 'text', text: 'Collaborator added successfully' }] };
  }

  export async function githubRemoveCollaborator(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`);
    return { content: [{ type: 'text', text: 'Collaborator removed successfully' }] };
  }

  export async function githubGetCollaboratorPermission(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}/permission`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListInvitations(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/invitations`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateInvitation(args: any) {
    const body: any = {};
    if (args.permissions) body.permissions = args.permissions;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/invitations/${args.invitation_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteInvitation(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/invitations/${args.invitation_id}`);
    return { content: [{ type: 'text', text: 'Invitation deleted successfully' }] };
  }

  export async function githubListDeployKeys(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/keys`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateDeployKey(args: any) {
    const body: any = { title: args.title, key: args.key };
    if (args.read_only !== undefined) body.read_only = args.read_only;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/keys`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // WEBHOOKS METHODS
  export async function githubListWebhooks(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/hooks`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetWebhook(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateWebhook(args: any) {
    const body: any = { config: args.config };
    if (args.name) body.name = args.name;
    if (args.events) body.events = args.events;
    if (args.active !== undefined) body.active = args.active;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/hooks`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateWebhook(args: any) {
    const body: any = {};
    if (args.config) body.config = args.config;
    if (args.events) body.events = args.events;
    if (args.active !== undefined) body.active = args.active;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteWebhook(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`);
    return { content: [{ type: 'text', text: 'Webhook deleted successfully' }] };
  }

  export async function githubPingWebhook(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/pings`, {});
    return { content: [{ type: 'text', text: 'Webhook ping sent successfully' }] };
  }

  export async function githubTestWebhook(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/tests`, {});
    return { content: [{ type: 'text', text: 'Webhook test triggered successfully' }] };
  }

  export async function githubListWebhookDeliveries(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/deliveries`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // ORGANIZATIONS & TEAMS METHODS
  export async function githubListUserOrgs(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const path = args.username ? `/users/${args.username}/orgs` : '/user/orgs';
    const response = await client.get(path, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetOrg(args: any) {
    const response = await client.get(`/orgs/${args.org}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateOrg(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.description) body.description = args.description;
    if (args.email) body.email = args.email;
    if (args.location) body.location = args.location;
    const response = await client.patch(`/orgs/${args.org}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListOrgMembers(args: any) {
    const params: any = {};
    if (args.filter) params.filter = args.filter;
    if (args.role) params.role = args.role;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/orgs/${args.org}/members`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCheckOrgMembership(args: any) {
    try {
      await client.get(`/orgs/${args.org}/members/${args.username}`);
      return { content: [{ type: 'text', text: 'User is a member' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not a member' }] };
    }
  }

  export async function githubRemoveOrgMember(args: any) {
    await client.delete(`/orgs/${args.org}/members/${args.username}`);
    return { content: [{ type: 'text', text: 'Member removed successfully' }] };
  }

  export async function githubListOrgTeams(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/orgs/${args.org}/teams`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetTeam(args: any) {
    const response = await client.get(`/orgs/${args.org}/teams/${args.team_slug}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateTeam(args: any) {
    const body: any = { name: args.name };
    if (args.description) body.description = args.description;
    if (args.privacy) body.privacy = args.privacy;
    const response = await client.post(`/orgs/${args.org}/teams`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateTeam(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.description) body.description = args.description;
    if (args.privacy) body.privacy = args.privacy;
    const response = await client.patch(`/orgs/${args.org}/teams/${args.team_slug}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteTeam(args: any) {
    await client.delete(`/orgs/${args.org}/teams/${args.team_slug}`);
    return { content: [{ type: 'text', text: 'Team deleted successfully' }] };
  }

  export async function githubListTeamMembers(args: any) {
    const params: any = {};
    if (args.role) params.role = args.role;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/orgs/${args.org}/teams/${args.team_slug}/members`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // SEARCH METHODS
  export async function githubSearchRepositories(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/repositories', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubSearchCode(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/code', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubSearchIssues(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/issues', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubSearchUsers(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/users', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubSearchCommits(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/commits', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubSearchTopics(args: any) {
    const params: any = { q: args.q };
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/topics', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // USERS METHODS
  export async function githubGetAuthenticatedUser(args: any) {
    const response = await client.get('/user');
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetUser(args: any) {
    const response = await client.get(`/users/${args.username}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateAuthenticatedUser(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.email) body.email = args.email;
    if (args.blog) body.blog = args.blog;
    if (args.company) body.company = args.company;
    if (args.location) body.location = args.location;
    if (args.bio) body.bio = args.bio;
    const response = await client.patch('/user', body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListUserRepos(args: any) {
    const params: any = {};
    if (args.type) params.type = args.type;
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/users/${args.username}/repos`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListUserFollowers(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/users/${args.username}/followers`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListUserFollowing(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/users/${args.username}/following`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCheckFollowing(args: any) {
    try {
      await client.get(`/users/${args.username}/following/${args.target_user}`);
      return { content: [{ type: 'text', text: 'User is following target user' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not following target user' }] };
    }
  }

  export async function githubListUserGists(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/users/${args.username}/gists`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // GISTS METHODS
  export async function githubListGists(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/gists/public', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetGist(args: any) {
    const response = await client.get(`/gists/${args.gist_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateGist(args: any) {
    const body: any = { files: args.files };
    if (args.description) body.description = args.description;
    if (args.public !== undefined) body.public = args.public;
    const response = await client.post('/gists', body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateGist(args: any) {
    const body: any = {};
    if (args.description) body.description = args.description;
    if (args.files) body.files = args.files;
    const response = await client.patch(`/gists/${args.gist_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteGist(args: any) {
    await client.delete(`/gists/${args.gist_id}`);
    return { content: [{ type: 'text', text: 'Gist deleted successfully' }] };
  }

  export async function githubStarGist(args: any) {
    await client.put(`/gists/${args.gist_id}/star`, {});
    return { content: [{ type: 'text', text: 'Gist starred successfully' }] };
  }

  export async function githubUnstarGist(args: any) {
    await client.delete(`/gists/${args.gist_id}/star`);
    return { content: [{ type: 'text', text: 'Gist unstarred successfully' }] };
  }

  export async function githubCheckGistStar(args: any) {
    try {
      await client.get(`/gists/${args.gist_id}/star`);
      return { content: [{ type: 'text', text: 'Gist is starred' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'Gist is not starred' }] };
    }
  }

  export async function githubForkGist(args: any) {
    const response = await client.post(`/gists/${args.gist_id}/forks`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListGistCommits(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/gists/${args.gist_id}/commits`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // MILESTONES & PROJECTS METHODS
  export async function githubListMilestones(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/milestones`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetMilestone(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateMilestone(args: any) {
    const body: any = { title: args.title };
    if (args.state) body.state = args.state;
    if (args.description) body.description = args.description;
    if (args.due_on) body.due_on = args.due_on;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/milestones`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateMilestone(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.state) body.state = args.state;
    if (args.description) body.description = args.description;
    if (args.due_on) body.due_on = args.due_on;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteMilestone(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`);
    return { content: [{ type: 'text', text: 'Milestone deleted successfully' }] };
  }

  export async function githubListProjects(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/projects`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetProject(args: any) {
    const response = await client.get(`/projects/${args.project_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateProject(args: any) {
    const body: any = { name: args.name };
    if (args.body) body.body = args.body;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/projects`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateRepoSecretHandler(args: any) {
    const response = await client.put(`/repos/${args.owner}/${args.repo}/actions/secrets/${args.secret_name}`, {
      encrypted_value: args.encrypted_value
    });
    return { content: [{ type: 'text', text: 'Secret created successfully' }] };
  }

  // PACKAGES
  export async function githubListPackages(args: any) {
    const response = await client.get(`/orgs/${args.org}/packages`, { package_type: args.package_type });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetPackage(args: any) {
    const response = await client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeletePackage(args: any) {
    const response = await client.delete(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}`);
    return { content: [{ type: 'text', text: 'Package deleted' }] };
  }

  export async function githubRestorePackage(args: any) {
    const response = await client.post(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/restore`, {});
    return { content: [{ type: 'text', text: 'Package restored' }] };
  }

  export async function githubListPackageVersions(args: any) {
    const response = await client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetPackageVersion(args: any) {
    const response = await client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeletePackageVersion(args: any) {
    const response = await client.delete(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}`);
    return { content: [{ type: 'text', text: 'Package version deleted' }] };
  }

  export async function githubRestorePackageVersion(args: any) {
    const response = await client.post(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}/restore`, {});
    return { content: [{ type: 'text', text: 'Package version restored' }] };
  }

  // PROJECTS V2 (GraphQL)
  export async function githubListOrgProjectsV2(args: any) {
    const query = `query { organization(login: "${args.org}") { projectsV2(first: 20) { nodes { id title } } } }`;
    const response = await client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetProjectV2(args: any) {
    const query = `query { node(id: "${args.project_id}") { ... on ProjectV2 { id title description } } }`;
    const response = await client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateProjectV2(args: any) {
    const mutation = `mutation { createProjectV2(input: { ownerId: "${args.org}", title: "${args.title}" }) { projectV2 { id title } } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateProjectV2(args: any) {
    const mutation = `mutation { updateProjectV2(input: { projectId: "${args.project_id}", title: "${args.title || ''}" }) { projectV2 { id title } } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteProjectV2(args: any) {
    const mutation = `mutation { deleteProjectV2(input: { projectId: "${args.project_id}" }) { projectV2 { id } } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Project deleted' }] };
  }

  export async function githubListProjectItems(args: any) {
    const query = `query { node(id: "${args.project_id}") { ... on ProjectV2 { items(first: 20) { nodes { id } } } } }`;
    const response = await client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubAddProjectItem(args: any) {
    const mutation = `mutation { addProjectV2ItemById(input: { projectId: "${args.project_id}", contentId: "${args.content_id}" }) { item { id } } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Item added to project' }] };
  }

  export async function githubRemoveProjectItem(args: any) {
    const mutation = `mutation { deleteProjectV2Item(input: { projectId: "${args.project_id}", itemId: "${args.item_id}" }) { deletedItemId } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Item removed from project' }] };
  }

  // DISCUSSIONS
  export async function githubListDiscussions(args: any) {
    const params: any = {};
    if (args.category) params.category = args.category;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/discussions`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetDiscussion(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateDiscussion(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/discussions`, {
      title: args.title,
      body: args.body,
      category_id: args.category_id
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateDiscussion(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubDeleteDiscussion(args: any) {
    const response = await client.delete(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`);
    return { content: [{ type: 'text', text: 'Discussion deleted' }] };
  }

  export async function githubListDiscussionComments(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}/comments`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateDiscussionComment(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}/comments`, {
      body: args.body
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListDiscussionCategories(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/discussions/categories`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // CODESPACES
  export async function githubListCodespaces(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    const response = await client.get('/user/codespaces', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetCodespace(args: any) {
    const response = await client.get(`/user/codespaces/${args.codespace_name}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubCreateCodespace(args: any) {
    const body: any = {};
    if (args.ref) body.ref = args.ref;
    if (args.machine) body.machine = args.machine;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/codespaces`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubStartCodespace(args: any) {
    const response = await client.post(`/user/codespaces/${args.codespace_name}/start`, {});
    return { content: [{ type: 'text', text: 'Codespace started' }] };
  }

  export async function githubStopCodespace(args: any) {
    const response = await client.post(`/user/codespaces/${args.codespace_name}/stop`, {});
    return { content: [{ type: 'text', text: 'Codespace stopped' }] };
  }

  export async function githubDeleteCodespace(args: any) {
    const response = await client.delete(`/user/codespaces/${args.codespace_name}`);
    return { content: [{ type: 'text', text: 'Codespace deleted' }] };
  }

  export async function githubListRepoCodespaces(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/codespaces`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COPILOT
  export async function githubGetCopilotOrgSettings(args: any) {
    const response = await client.get(`/orgs/${args.org}/copilot/billing`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListCopilotSeats(args: any) {
    const response = await client.get(`/orgs/${args.org}/copilot/billing/seats`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubAddCopilotSeats(args: any) {
    const response = await client.post(`/orgs/${args.org}/copilot/billing/selected_users`, {
      selected_usernames: args.selected_usernames
    });
    return { content: [{ type: 'text', text: 'Copilot seats added' }] };
  }

  export async function githubRemoveCopilotSeats(args: any) {
    const response = await client.delete(`/orgs/${args.org}/copilot/billing/selected_users`);
    return { content: [{ type: 'text', text: 'Copilot seats removed' }] };
  }

  export async function githubGetCopilotUsage(args: any) {
    const response = await client.get(`/orgs/${args.org}/copilot/usage`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // ADVANCED SECURITY
  export async function githubListCodeScanningAlerts(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/code-scanning/alerts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubGetCodeScanningAlert(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/code-scanning/alerts/${args.alert_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateCodeScanningAlert(args: any) {
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/code-scanning/alerts/${args.alert_number}`, {
      state: args.state
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubListSecretScanningAlerts(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/secret-scanning/alerts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubUpdateSecretScanningAlert(args: any) {
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/secret-scanning/alerts/${args.alert_number}`, {
      state: args.state
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

