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

  export async function githublistRepos(args: any) {
    const params: any = {};
    if (args.type) params.type = args.type;
    if (args.sort) params.sort = args.sort;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const path = args.org ? `/orgs/${args.org}/repos` : '/user/repos';
    const response = await client.get(path, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepo(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateRepo(args: any) {
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

  export async function githubupdateRepo(args: any) {
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

  export async function githubdeleteRepo(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}`);
    return { content: [{ type: 'text', text: 'Repository deleted successfully' }] };
  }

  export async function githublistRepoTopics(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/topics`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubreplaceRepoTopics(args: any) {
    const response = await client.put(`/repos/${args.owner}/${args.repo}/topics`, { names: args.names });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistRepoLanguages(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/languages`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistRepoTags(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/tags`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistRepoTeams(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/teams`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubtransferRepo(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/transfer`, { new_owner: args.new_owner });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubenableAutomatedSecurityFixes(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/automated-security-fixes`);
    return { content: [{ type: 'text', text: 'Automated security fixes enabled' }] };
  }

  export async function githubdisableAutomatedSecurityFixes(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/automated-security-fixes`);
    return { content: [{ type: 'text', text: 'Automated security fixes disabled' }] };
  }

  export async function githubenableVulnerabilityAlerts(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/vulnerability-alerts`);
    return { content: [{ type: 'text', text: 'Vulnerability alerts enabled' }] };
  }

  export async function githubdisableVulnerabilityAlerts(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/vulnerability-alerts`);
    return { content: [{ type: 'text', text: 'Vulnerability alerts disabled' }] };
  }

  export async function githubgetRepoReadme(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/readme`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepoLicense(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/license`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepoCommunityProfile(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/community/profile`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepoStatsContributors(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/stats/contributors`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepoStatsCommitActivity(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/stats/commit_activity`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }


  // BRANCH MANAGEMENT METHODS
  export async function githublistBranches(args: any) {
    const params: any = {};
    if (args.protected !== undefined) params.protected = args.protected;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetBranch(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateBranch(args: any) {
    const fromBranch = args.from_branch || 'main';
    const refResponse = await client.get(`/repos/${args.owner}/${args.repo}/git/ref/heads/${fromBranch}`);
    const sha = refResponse.object.sha;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/git/refs`, {
      ref: `refs/heads/${args.branch}`,
      sha
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteBranch(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/git/refs/heads/${args.branch}`);
    return { content: [{ type: 'text', text: 'Branch deleted successfully' }] };
  }

  export async function githubmergeBranch(args: any) {
    const body: any = { base: args.base, head: args.head };
    if (args.commit_message) body.commit_message = args.commit_message;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/merges`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetBranchProtection(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateBranchProtection(args: any) {
    const body: any = {};
    if (args.required_status_checks) body.required_status_checks = args.required_status_checks;
    if (args.enforce_admins !== undefined) body.enforce_admins = args.enforce_admins;
    if (args.required_pull_request_reviews) body.required_pull_request_reviews = args.required_pull_request_reviews;
    if (args.restrictions) body.restrictions = args.restrictions;
    const response = await client.put(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteBranchProtection(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection`);
    return { content: [{ type: 'text', text: 'Branch protection removed' }] };
  }

  export async function githubgetRequiredStatusChecks(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_status_checks`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateRequiredStatusChecks(args: any) {
    const body: any = {};
    if (args.strict !== undefined) body.strict = args.strict;
    if (args.contexts) body.contexts = args.contexts;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_status_checks`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetAdminEnforcement(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/enforce_admins`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubsetAdminEnforcement(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/enforce_admins`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetPullRequestReviewEnforcement(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_pull_request_reviews`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdatePullRequestReviewEnforcement(args: any) {
    const body: any = {};
    if (args.dismissal_restrictions) body.dismissal_restrictions = args.dismissal_restrictions;
    if (args.dismiss_stale_reviews !== undefined) body.dismiss_stale_reviews = args.dismiss_stale_reviews;
    if (args.require_code_owner_reviews !== undefined) body.require_code_owner_reviews = args.require_code_owner_reviews;
    if (args.required_approving_review_count) body.required_approving_review_count = args.required_approving_review_count;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/protection/required_pull_request_reviews`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubrenameBranch(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/branches/${args.branch}/rename`, { new_name: args.new_name });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COMMITS METHODS
  export async function githublistCommits(args: any) {
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

  export async function githubgetCommit(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcompareCommits(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/compare/${args.base}...${args.head}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistCommitComments(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateCommitComment(args: any) {
    const body: any = { body: args.body };
    if (args.path) body.path = args.path;
    if (args.position) body.position = args.position;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/commits/${args.commit_sha}/comments`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetCommitStatus(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/status`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistCommitStatuses(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}/statuses`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateCommitStatus(args: any) {
    const body: any = { state: args.state };
    if (args.target_url) body.target_url = args.target_url;
    if (args.description) body.description = args.description;
    if (args.context) body.context = args.context;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/statuses/${args.sha}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistPullRequestsAssociatedWithCommit(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.commit_sha}/pulls`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetCommitSignatureVerification(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/commits/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response.commit.verification, null, 2) }] };
  }

  // ISSUES METHODS
  export async function githublistIssues(args: any) {
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

  export async function githubgetIssue(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateIssue(args: any) {
    const body: any = { title: args.title };
    if (args.body) body.body = args.body;
    if (args.assignees) body.assignees = args.assignees;
    if (args.milestone) body.milestone = args.milestone;
    if (args.labels) body.labels = args.labels;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/issues`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateIssue(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    if (args.state) body.state = args.state;
    if (args.assignees) body.assignees = args.assignees;
    if (args.labels) body.labels = args.labels;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublockIssue(args: any) {
    const body: any = {};
    if (args.lock_reason) body.lock_reason = args.lock_reason;
    await client.put(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/lock`, body);
    return { content: [{ type: 'text', text: 'Issue locked successfully' }] };
  }

  export async function githubunlockIssue(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/lock`);
    return { content: [{ type: 'text', text: 'Issue unlocked successfully' }] };
  }

  export async function githubaddAssignees(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/assignees`, { assignees: args.assignees });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubremoveAssignees(args: any) {
    const response = await client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/assignees`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubaddLabels(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels`, { labels: args.labels });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubremoveLabel(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels/${args.name}`);
    return { content: [{ type: 'text', text: 'Label removed successfully' }] };
  }

  export async function githubreplaceLabels(args: any) {
    const response = await client.put(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/labels`, { labels: args.labels || [] });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistIssueComments(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateIssueComment(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/comments`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateIssueComment(args: any) {
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/issues/comments/${args.comment_id}`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteIssueComment(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/issues/comments/${args.comment_id}`);
    return { content: [{ type: 'text', text: 'Comment deleted successfully' }] };
  }

  export async function githublistIssueEvents(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/events`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistIssueTimeline(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}/timeline`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistLabels(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/labels`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateLabel(args: any) {
    const body: any = { name: args.name, color: args.color };
    if (args.description) body.description = args.description;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/labels`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteLabel(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/labels/${args.name}`);
    return { content: [{ type: 'text', text: 'Label deleted successfully' }] };
  }

  // PULL REQUESTS METHODS
  export async function githublistPullRequests(args: any) {
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

  export async function githubgetPullRequest(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreatePullRequest(args: any) {
    const body: any = { title: args.title, head: args.head, base: args.base };
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.maintainer_can_modify !== undefined) body.maintainer_can_modify = args.maintainer_can_modify;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdatePullRequest(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    if (args.state) body.state = args.state;
    if (args.base) body.base = args.base;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubmergePullRequest(args: any) {
    const body: any = {};
    if (args.commit_title) body.commit_title = args.commit_title;
    if (args.commit_message) body.commit_message = args.commit_message;
    if (args.merge_method) body.merge_method = args.merge_method;
    const response = await client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/merge`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetPullRequestMergeStatus(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/merge`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistPullRequestCommits(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/commits`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistPullRequestFiles(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/files`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistPullRequestReviews(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetPullRequestReview(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreatePullRequestReview(args: any) {
    const body: any = { event: args.event };
    if (args.body) body.body = args.body;
    if (args.comments) body.comments = args.comments;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubsubmitPullRequestReview(args: any) {
    const body: any = { event: args.event };
    if (args.body) body.body = args.body;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}/events`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdismissPullRequestReview(args: any) {
    const response = await client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/reviews/${args.review_id}/dismissals`, { message: args.message });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistPullRequestReviewComments(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/comments`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreatePullRequestReviewComment(args: any) {
    const body: any = { body: args.body, commit_id: args.commit_id, path: args.path };
    if (args.line) body.line = args.line;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/comments`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdatePullRequestReviewComment(args: any) {
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/pulls/comments/${args.comment_id}`, { body: args.body });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeletePullRequestReviewComment(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/pulls/comments/${args.comment_id}`);
    return { content: [{ type: 'text', text: 'Comment deleted successfully' }] };
  }

  export async function githubrequestPullRequestReviewers(args: any) {
    const body: any = {};
    if (args.reviewers) body.reviewers = args.reviewers;
    if (args.team_reviewers) body.team_reviewers = args.team_reviewers;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubremovePullRequestReviewers(args: any) {
    const body: any = {};
    if (args.reviewers) body.reviewers = args.reviewers;
    if (args.team_reviewers) body.team_reviewers = args.team_reviewers;
    const response = await client.delete(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdatePullRequestBranch(args: any) {
    const body: any = {};
    if (args.expected_head_sha) body.expected_head_sha = args.expected_head_sha;
    const response = await client.put(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/update-branch`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistRequestedReviewers(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}/requested_reviewers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcheckPullRequestReviewability(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`);
    return { content: [{ type: 'text', text: JSON.stringify({ mergeable: response.mergeable, mergeable_state: response.mergeable_state }, null, 2) }] };
  }

  export async function githubgetPullRequestDiff(args: any) {
    const response = await this.fetch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, { headers: { 'Accept': 'application/vnd.github.v3.diff' } });
    return { content: [{ type: 'text', text: response }] };
  }

  export async function githubgetPullRequestPatch(args: any) {
    const response = await this.fetch(`/repos/${args.owner}/${args.repo}/pulls/${args.pull_number}`, { headers: { 'Accept': 'application/vnd.github.v3.patch' } });
    return { content: [{ type: 'text', text: response }] };
  }

  export async function githubconvertIssueToPullRequest(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/pulls`, { issue: args.issue_number, head: args.head, base: args.base });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // GITHUB ACTIONS METHODS
  export async function githublistWorkflows(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/workflows`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetWorkflow(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdisableWorkflow(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/disable`, {});
    return { content: [{ type: 'text', text: 'Workflow disabled successfully' }] };
  }

  export async function githubenableWorkflow(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/enable`, {});
    return { content: [{ type: 'text', text: 'Workflow enabled successfully' }] };
  }

  export async function githubcreateWorkflowDispatch(args: any) {
    const body: any = { ref: args.ref };
    if (args.inputs) body.inputs = args.inputs;
    await client.post(`/repos/${args.owner}/${args.repo}/actions/workflows/${args.workflow_id}/dispatches`, body);
    return { content: [{ type: 'text', text: 'Workflow dispatch triggered successfully' }] };
  }

  export async function githublistWorkflowRuns(args: any) {
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

  export async function githubgetWorkflowRun(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcancelWorkflowRun(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/cancel`, {});
    return { content: [{ type: 'text', text: 'Workflow run cancelled successfully' }] };
  }

  export async function githubrerunWorkflow(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/rerun`, {});
    return { content: [{ type: 'text', text: 'Workflow rerun triggered successfully' }] };
  }

  export async function githubrerunFailedJobs(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/rerun-failed-jobs`, {});
    return { content: [{ type: 'text', text: 'Failed jobs rerun triggered successfully' }] };
  }

  export async function githubdeleteWorkflowRun(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}`);
    return { content: [{ type: 'text', text: 'Workflow run deleted successfully' }] };
  }

  export async function githublistWorkflowRunArtifacts(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/artifacts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdownloadWorkflowRunLogs(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/logs`);
    return { content: [{ type: 'text', text: 'Logs download URL: ' + JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteWorkflowRunLogs(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/logs`);
    return { content: [{ type: 'text', text: 'Workflow run logs deleted successfully' }] };
  }

  export async function githublistWorkflowRunJobs(args: any) {
    const params: any = {};
    if (args.filter) params.filter = args.filter;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/runs/${args.run_id}/jobs`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetWorkflowRunJob(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/jobs/${args.job_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdownloadJobLogs(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/jobs/${args.job_id}/logs`);
    return { content: [{ type: 'text', text: 'Job logs download URL: ' + JSON.stringify(response, null, 2) }] };
  }

  export async function githublistRepoSecrets(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/actions/secrets`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateOrUpdateRepoSecret(args: any) {
    await client.put(`/repos/${args.owner}/${args.repo}/actions/secrets/${args.secret_name}`, { encrypted_value: args.encrypted_value });
    return { content: [{ type: 'text', text: 'Secret created/updated successfully' }] };
  }

  export async function githubdeleteRepoSecret(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/actions/secrets/${args.secret_name}`);
    return { content: [{ type: 'text', text: 'Secret deleted successfully' }] };
  }

  // RELEASES METHODS
  export async function githublistReleases(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRelease(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetLatestRelease(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/latest`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetReleaseByTag(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/tags/${args.tag}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateRelease(args: any) {
    const body: any = { tag_name: args.tag_name };
    if (args.target_commitish) body.target_commitish = args.target_commitish;
    if (args.name) body.name = args.name;
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.prerelease !== undefined) body.prerelease = args.prerelease;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/releases`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateRelease(args: any) {
    const body: any = {};
    if (args.tag_name) body.tag_name = args.tag_name;
    if (args.name) body.name = args.name;
    if (args.body) body.body = args.body;
    if (args.draft !== undefined) body.draft = args.draft;
    if (args.prerelease !== undefined) body.prerelease = args.prerelease;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteRelease(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}`);
    return { content: [{ type: 'text', text: 'Release deleted successfully' }] };
  }

  export async function githublistReleaseAssets(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/${args.release_id}/assets`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetReleaseAsset(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateReleaseAsset(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.label) body.label = args.label;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteReleaseAsset(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/releases/assets/${args.asset_id}`);
    return { content: [{ type: 'text', text: 'Release asset deleted successfully' }] };
  }

  export async function githubgenerateReleaseNotes(args: any) {
    const body: any = { tag_name: args.tag_name };
    if (args.target_commitish) body.target_commitish = args.target_commitish;
    if (args.previous_tag_name) body.previous_tag_name = args.previous_tag_name;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/releases/generate-notes`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // FILES & CONTENT METHODS
  export async function githubgetContent(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/contents/${args.path}`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateOrUpdateFile(args: any) {
    const body: any = { message: args.message, content: args.content };
    if (args.sha) body.sha = args.sha;
    if (args.branch) body.branch = args.branch;
    const response = await client.put(`/repos/${args.owner}/${args.repo}/contents/${args.path}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteFile(args: any) {
    const body: any = { message: args.message, sha: args.sha };
    if (args.branch) body.branch = args.branch;
    const response = await client.delete(`/repos/${args.owner}/${args.repo}/contents/${args.path}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetArchive(args: any) {
    const params: any = {};
    if (args.ref) params.ref = args.ref;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/${args.archive_format}/${args.ref || 'main'}`);
    return { content: [{ type: 'text', text: 'Archive URL: ' + JSON.stringify(response, null, 2) }] };
  }

  export async function githublistRepoContributors(args: any) {
    const params: any = {};
    if (args.anon) params.anon = args.anon;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/contributors`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepoClones(args: any) {
    const params: any = {};
    if (args.per) params.per = args.per;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/traffic/clones`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepoViews(args: any) {
    const params: any = {};
    if (args.per) params.per = args.per;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/traffic/views`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepoTopPaths(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/traffic/popular/paths`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRepoTopReferrers(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/traffic/popular/referrers`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateTree(args: any) {
    const body: any = { tree: args.tree };
    if (args.base_tree) body.base_tree = args.base_tree;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/git/trees`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetTree(args: any) {
    const params: any = {};
    if (args.recursive) params.recursive = '1';
    const response = await client.get(`/repos/${args.owner}/${args.repo}/git/trees/${args.tree_sha}`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetBlob(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/git/blobs/${args.file_sha}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateBlob(args: any) {
    const body: any = { content: args.content };
    if (args.encoding) body.encoding = args.encoding;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/git/blobs`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateCommit(args: any) {
    const body: any = { message: args.message, tree: args.tree };
    if (args.parents) body.parents = args.parents;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/git/commits`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetRef(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/git/ref/${args.ref}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COLLABORATORS & PERMISSIONS METHODS
  export async function githublistCollaborators(args: any) {
    const params: any = {};
    if (args.affiliation) params.affiliation = args.affiliation;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/collaborators`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcheckCollaborator(args: any) {
    try {
      await client.get(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`);
      return { content: [{ type: 'text', text: 'User is a collaborator' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not a collaborator' }] };
    }
  }

  export async function githubaddCollaborator(args: any) {
    const body: any = {};
    if (args.permission) body.permission = args.permission;
    await client.put(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`, body);
    return { content: [{ type: 'text', text: 'Collaborator added successfully' }] };
  }

  export async function githubremoveCollaborator(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}`);
    return { content: [{ type: 'text', text: 'Collaborator removed successfully' }] };
  }

  export async function githubgetCollaboratorPermission(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/collaborators/${args.username}/permission`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistInvitations(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/invitations`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateInvitation(args: any) {
    const body: any = {};
    if (args.permissions) body.permissions = args.permissions;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/invitations/${args.invitation_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteInvitation(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/invitations/${args.invitation_id}`);
    return { content: [{ type: 'text', text: 'Invitation deleted successfully' }] };
  }

  export async function githublistDeployKeys(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/keys`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateDeployKey(args: any) {
    const body: any = { title: args.title, key: args.key };
    if (args.read_only !== undefined) body.read_only = args.read_only;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/keys`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // WEBHOOKS METHODS
  export async function githublistWebhooks(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/hooks`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetWebhook(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateWebhook(args: any) {
    const body: any = { config: args.config };
    if (args.name) body.name = args.name;
    if (args.events) body.events = args.events;
    if (args.active !== undefined) body.active = args.active;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/hooks`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateWebhook(args: any) {
    const body: any = {};
    if (args.config) body.config = args.config;
    if (args.events) body.events = args.events;
    if (args.active !== undefined) body.active = args.active;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteWebhook(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}`);
    return { content: [{ type: 'text', text: 'Webhook deleted successfully' }] };
  }

  export async function githubpingWebhook(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/pings`, {});
    return { content: [{ type: 'text', text: 'Webhook ping sent successfully' }] };
  }

  export async function githubtestWebhook(args: any) {
    await client.post(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/tests`, {});
    return { content: [{ type: 'text', text: 'Webhook test triggered successfully' }] };
  }

  export async function githublistWebhookDeliveries(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/hooks/${args.hook_id}/deliveries`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // ORGANIZATIONS & TEAMS METHODS
  export async function githublistUserOrgs(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const path = args.username ? `/users/${args.username}/orgs` : '/user/orgs';
    const response = await client.get(path, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetOrg(args: any) {
    const response = await client.get(`/orgs/${args.org}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateOrg(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.description) body.description = args.description;
    if (args.email) body.email = args.email;
    if (args.location) body.location = args.location;
    const response = await client.patch(`/orgs/${args.org}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistOrgMembers(args: any) {
    const params: any = {};
    if (args.filter) params.filter = args.filter;
    if (args.role) params.role = args.role;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/orgs/${args.org}/members`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcheckOrgMembership(args: any) {
    try {
      await client.get(`/orgs/${args.org}/members/${args.username}`);
      return { content: [{ type: 'text', text: 'User is a member' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not a member' }] };
    }
  }

  export async function githubremoveOrgMember(args: any) {
    await client.delete(`/orgs/${args.org}/members/${args.username}`);
    return { content: [{ type: 'text', text: 'Member removed successfully' }] };
  }

  export async function githublistOrgTeams(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/orgs/${args.org}/teams`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetTeam(args: any) {
    const response = await client.get(`/orgs/${args.org}/teams/${args.team_slug}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateTeam(args: any) {
    const body: any = { name: args.name };
    if (args.description) body.description = args.description;
    if (args.privacy) body.privacy = args.privacy;
    const response = await client.post(`/orgs/${args.org}/teams`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateTeam(args: any) {
    const body: any = {};
    if (args.name) body.name = args.name;
    if (args.description) body.description = args.description;
    if (args.privacy) body.privacy = args.privacy;
    const response = await client.patch(`/orgs/${args.org}/teams/${args.team_slug}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteTeam(args: any) {
    await client.delete(`/orgs/${args.org}/teams/${args.team_slug}`);
    return { content: [{ type: 'text', text: 'Team deleted successfully' }] };
  }

  export async function githublistTeamMembers(args: any) {
    const params: any = {};
    if (args.role) params.role = args.role;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/orgs/${args.org}/teams/${args.team_slug}/members`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // SEARCH METHODS
  export async function githubsearchRepositories(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/repositories', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubsearchCode(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/code', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubsearchIssues(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/issues', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubsearchUsers(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/users', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubsearchCommits(args: any) {
    const params: any = { q: args.q };
    if (args.sort) params.sort = args.sort;
    if (args.order) params.order = args.order;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/commits', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubsearchTopics(args: any) {
    const params: any = { q: args.q };
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/search/topics', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // USERS METHODS
  export async function githubgetAuthenticatedUser(args: any) {
    const response = await client.get('/user');
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetUser(args: any) {
    const response = await client.get(`/users/${args.username}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateAuthenticatedUser(args: any) {
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

  export async function githublistUserRepos(args: any) {
    const params: any = {};
    if (args.type) params.type = args.type;
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/users/${args.username}/repos`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistUserFollowers(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/users/${args.username}/followers`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistUserFollowing(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/users/${args.username}/following`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcheckFollowing(args: any) {
    try {
      await client.get(`/users/${args.username}/following/${args.target_user}`);
      return { content: [{ type: 'text', text: 'User is following target user' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'User is not following target user' }] };
    }
  }

  export async function githublistUserGists(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/users/${args.username}/gists`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // GISTS METHODS
  export async function githublistGists(args: any) {
    const params: any = {};
    if (args.since) params.since = args.since;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get('/gists/public', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetGist(args: any) {
    const response = await client.get(`/gists/${args.gist_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateGist(args: any) {
    const body: any = { files: args.files };
    if (args.description) body.description = args.description;
    if (args.public !== undefined) body.public = args.public;
    const response = await client.post('/gists', body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateGist(args: any) {
    const body: any = {};
    if (args.description) body.description = args.description;
    if (args.files) body.files = args.files;
    const response = await client.patch(`/gists/${args.gist_id}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteGist(args: any) {
    await client.delete(`/gists/${args.gist_id}`);
    return { content: [{ type: 'text', text: 'Gist deleted successfully' }] };
  }

  export async function githubstarGist(args: any) {
    await client.put(`/gists/${args.gist_id}/star`, {});
    return { content: [{ type: 'text', text: 'Gist starred successfully' }] };
  }

  export async function githubunstarGist(args: any) {
    await client.delete(`/gists/${args.gist_id}/star`);
    return { content: [{ type: 'text', text: 'Gist unstarred successfully' }] };
  }

  export async function githubcheckGistStar(args: any) {
    try {
      await client.get(`/gists/${args.gist_id}/star`);
      return { content: [{ type: 'text', text: 'Gist is starred' }] };
    } catch (error) {
      return { content: [{ type: 'text', text: 'Gist is not starred' }] };
    }
  }

  export async function githubforkGist(args: any) {
    const response = await client.post(`/gists/${args.gist_id}/forks`, {});
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistGistCommits(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/gists/${args.gist_id}/commits`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // MILESTONES & PROJECTS METHODS
  export async function githublistMilestones(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.sort) params.sort = args.sort;
    if (args.direction) params.direction = args.direction;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/milestones`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetMilestone(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateMilestone(args: any) {
    const body: any = { title: args.title };
    if (args.state) body.state = args.state;
    if (args.description) body.description = args.description;
    if (args.due_on) body.due_on = args.due_on;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/milestones`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateMilestone(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.state) body.state = args.state;
    if (args.description) body.description = args.description;
    if (args.due_on) body.due_on = args.due_on;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteMilestone(args: any) {
    await client.delete(`/repos/${args.owner}/${args.repo}/milestones/${args.milestone_number}`);
    return { content: [{ type: 'text', text: 'Milestone deleted successfully' }] };
  }

  export async function githublistProjects(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    if (args.per_page) params.per_page = args.per_page;
    if (args.page) params.page = args.page;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/projects`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetProject(args: any) {
    const response = await client.get(`/projects/${args.project_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateProject(args: any) {
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
  export async function githublistPackages(args: any) {
    const response = await client.get(`/orgs/${args.org}/packages`, { package_type: args.package_type });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetPackage(args: any) {
    const response = await client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeletePackage(args: any) {
    const response = await client.delete(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}`);
    return { content: [{ type: 'text', text: 'Package deleted' }] };
  }

  export async function githubrestorePackage(args: any) {
    const response = await client.post(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/restore`, {});
    return { content: [{ type: 'text', text: 'Package restored' }] };
  }

  export async function githublistPackageVersions(args: any) {
    const response = await client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetPackageVersion(args: any) {
    const response = await client.get(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeletePackageVersion(args: any) {
    const response = await client.delete(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}`);
    return { content: [{ type: 'text', text: 'Package version deleted' }] };
  }

  export async function githubrestorePackageVersion(args: any) {
    const response = await client.post(`/orgs/${args.org}/packages/${args.package_type}/${args.package_name}/versions/${args.version_id}/restore`, {});
    return { content: [{ type: 'text', text: 'Package version restored' }] };
  }

  // PROJECTS V2 (GraphQL)
  export async function githublistOrgProjectsV2(args: any) {
    const query = `query { organization(login: "${args.org}") { projectsV2(first: 20) { nodes { id title } } } }`;
    const response = await client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetProjectV2(args: any) {
    const query = `query { node(id: "${args.project_id}") { ... on ProjectV2 { id title description } } }`;
    const response = await client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateProjectV2(args: any) {
    const mutation = `mutation { createProjectV2(input: { ownerId: "${args.org}", title: "${args.title}" }) { projectV2 { id title } } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateProjectV2(args: any) {
    const mutation = `mutation { updateProjectV2(input: { projectId: "${args.project_id}", title: "${args.title || ''}" }) { projectV2 { id title } } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteProjectV2(args: any) {
    const mutation = `mutation { deleteProjectV2(input: { projectId: "${args.project_id}" }) { projectV2 { id } } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Project deleted' }] };
  }

  export async function githublistProjectItems(args: any) {
    const query = `query { node(id: "${args.project_id}") { ... on ProjectV2 { items(first: 20) { nodes { id } } } } }`;
    const response = await client.post('/graphql', { query });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubaddProjectItem(args: any) {
    const mutation = `mutation { addProjectV2ItemById(input: { projectId: "${args.project_id}", contentId: "${args.content_id}" }) { item { id } } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Item added to project' }] };
  }

  export async function githubremoveProjectItem(args: any) {
    const mutation = `mutation { deleteProjectV2Item(input: { projectId: "${args.project_id}", itemId: "${args.item_id}" }) { deletedItemId } }`;
    const response = await client.post('/graphql', { query: mutation });
    return { content: [{ type: 'text', text: 'Item removed from project' }] };
  }

  // DISCUSSIONS
  export async function githublistDiscussions(args: any) {
    const params: any = {};
    if (args.category) params.category = args.category;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/discussions`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetDiscussion(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateDiscussion(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/discussions`, {
      title: args.title,
      body: args.body,
      category_id: args.category_id
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateDiscussion(args: any) {
    const body: any = {};
    if (args.title) body.title = args.title;
    if (args.body) body.body = args.body;
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubdeleteDiscussion(args: any) {
    const response = await client.delete(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}`);
    return { content: [{ type: 'text', text: 'Discussion deleted' }] };
  }

  export async function githublistDiscussionComments(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}/comments`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateDiscussionComment(args: any) {
    const response = await client.post(`/repos/${args.owner}/${args.repo}/discussions/${args.discussion_number}/comments`, {
      body: args.body
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistDiscussionCategories(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/discussions/categories`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // CODESPACES
  export async function githublistCodespaces(args: any) {
    const params: any = {};
    if (args.per_page) params.per_page = args.per_page;
    const response = await client.get('/user/codespaces', params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetCodespace(args: any) {
    const response = await client.get(`/user/codespaces/${args.codespace_name}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubcreateCodespace(args: any) {
    const body: any = {};
    if (args.ref) body.ref = args.ref;
    if (args.machine) body.machine = args.machine;
    const response = await client.post(`/repos/${args.owner}/${args.repo}/codespaces`, body);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubstartCodespace(args: any) {
    const response = await client.post(`/user/codespaces/${args.codespace_name}/start`, {});
    return { content: [{ type: 'text', text: 'Codespace started' }] };
  }

  export async function githubstopCodespace(args: any) {
    const response = await client.post(`/user/codespaces/${args.codespace_name}/stop`, {});
    return { content: [{ type: 'text', text: 'Codespace stopped' }] };
  }

  export async function githubdeleteCodespace(args: any) {
    const response = await client.delete(`/user/codespaces/${args.codespace_name}`);
    return { content: [{ type: 'text', text: 'Codespace deleted' }] };
  }

  export async function githublistRepoCodespaces(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/codespaces`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // COPILOT
  export async function githubgetCopilotOrgSettings(args: any) {
    const response = await client.get(`/orgs/${args.org}/copilot/billing`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistCopilotSeats(args: any) {
    const response = await client.get(`/orgs/${args.org}/copilot/billing/seats`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubaddCopilotSeats(args: any) {
    const response = await client.post(`/orgs/${args.org}/copilot/billing/selected_users`, {
      selected_usernames: args.selected_usernames
    });
    return { content: [{ type: 'text', text: 'Copilot seats added' }] };
  }

  export async function githubremoveCopilotSeats(args: any) {
    const response = await client.delete(`/orgs/${args.org}/copilot/billing/selected_users`);
    return { content: [{ type: 'text', text: 'Copilot seats removed' }] };
  }

  export async function githubgetCopilotUsage(args: any) {
    const response = await client.get(`/orgs/${args.org}/copilot/usage`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  // ADVANCED SECURITY
  export async function githublistCodeScanningAlerts(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/code-scanning/alerts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubgetCodeScanningAlert(args: any) {
    const response = await client.get(`/repos/${args.owner}/${args.repo}/code-scanning/alerts/${args.alert_number}`);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateCodeScanningAlert(args: any) {
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/code-scanning/alerts/${args.alert_number}`, {
      state: args.state
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githublistSecretScanningAlerts(args: any) {
    const params: any = {};
    if (args.state) params.state = args.state;
    const response = await client.get(`/repos/${args.owner}/${args.repo}/secret-scanning/alerts`, params);
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

  export async function githubupdateSecretScanningAlert(args: any) {
    const response = await client.patch(`/repos/${args.owner}/${args.repo}/secret-scanning/alerts/${args.alert_number}`, {
      state: args.state
    });
    return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
  }

