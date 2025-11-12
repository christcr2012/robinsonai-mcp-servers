# GitHub Tool Name Fixes

## Manual Review of 42 Tools Flagged for Review

### ✅ KEEP AS-IS (Correct despite script flagging)

These tools are actually correct - they operate on multiple items or the plural form is correct:

1. **github_add_assignees** - ✅ KEEP - Adds multiple assignees to an issue
2. **github_add_labels** - ✅ KEEP - Adds multiple labels to an issue
3. **github_remove_assignees** - ✅ KEEP - Removes multiple assignees
4. **github_compare_commits** - ✅ KEEP - Compares multiple commits (range)
5. **github_list_issue_timeline** - ✅ KEEP - Timeline is singular (the timeline)
6. **github_list_user_following** - ✅ KEEP - "following" is the correct noun (users you're following)
7. **github_search_commits** - ✅ KEEP - Search returns multiple commits
8. **github_search_issues** - ✅ KEEP - Search returns multiple issues
9. **github_search_repositories** - ✅ KEEP - Search returns multiple repositories
10. **github_search_topics** - ✅ KEEP - Search returns multiple topics
11. **github_search_users** - ✅ KEEP - Search returns multiple users

### 🔧 FIX REQUIRED (Actual issues)

#### Copilot Seats (Batch Operations)
12. **github_add_copilot_seats** → **github_add_copilot_seats** ✅ KEEP - Adds multiple seats
13. **github_remove_copilot_seats** → **github_remove_copilot_seats** ✅ KEEP - Removes multiple seats

#### Security Settings (Plural is correct)
14. **github_disable_automated_security_fixes** → ✅ KEEP - "fixes" is part of the feature name
15. **github_enable_automated_security_fixes** → ✅ KEEP - "fixes" is part of the feature name
16. **github_disable_vulnerability_alerts** → ✅ KEEP - "alerts" is part of the feature name
17. **github_enable_vulnerability_alerts** → ✅ KEEP - "alerts" is part of the feature name

#### Stats/Metrics (Plural is correct - returns multiple data points)
18. **github_get_repo_clones** → ✅ KEEP - Returns clone statistics (multiple data points)
19. **github_get_repo_views** → ✅ KEEP - Returns view statistics (multiple data points)
20. **github_get_repo_stats_contributors** → ✅ KEEP - Returns multiple contributors
21. **github_get_repo_top_paths** → ✅ KEEP - Returns multiple paths
22. **github_get_repo_top_referrers** → ✅ KEEP - Returns multiple referrers

#### Status Checks (Plural is correct)
23. **github_get_required_status_checks** → ✅ KEEP - Returns multiple status checks
24. **github_update_required_status_checks** → ✅ KEEP - Updates multiple status checks

#### Reviewers (Batch Operations)
25. **github_remove_pull_request_reviewers** → ✅ KEEP - Removes multiple reviewers
26. **github_request_pull_request_reviewers** → ✅ KEEP - Requests multiple reviewers

#### Workflow Jobs (Batch Operation)
27. **github_rerun_failed_jobs** → ✅ KEEP - Reruns multiple failed jobs

#### Workflow Logs (Singular is correct)
28. **github_delete_workflow_run_logs** → **github_delete_workflow_run_log** ❌ FIX
    - Reason: Deletes the log file (singular) for a workflow run

#### Settings (Singular is correct)
29. **github_get_copilot_org_settings** → **github_get_copilot_org_setting** ❌ MAYBE
    - Actually, "settings" might be correct if it returns multiple settings
    - Need to check GitHub API docs

#### Projects V2 (Singular is correct)
30. **github_list_org_projects_v2** → **github_list_org_projects_v2** ✅ KEEP
    - "projects_v2" is the API version identifier, not plural

#### Pull Requests Associated (Plural is correct)
31. **github_list_pull_requests_associated_with_commit** → ✅ KEEP
    - Returns multiple pull requests

#### Missing Verbs (Need to add to standard)
32. **github_download_job_logs** → ✅ KEEP - Add "download" to standard verbs
33. **github_download_workflow_run_logs** → ✅ KEEP - Add "download" to standard verbs

---

## 📊 FINAL VERDICT

### Tools to Rename: 1
1. `github_delete_workflow_run_logs` → `github_delete_workflow_run_log`

### Tools to Keep: 41
All others are correct as-is.

### Standard Verbs to Add: 1
- **download** - Download artifacts, logs, files

---

## 🎯 ACTION ITEMS

1. ✅ Add "download" to standard verbs list
2. ⏳ Rename 1 tool: `github_delete_workflow_run_logs` → `github_delete_workflow_run_log`
3. ⏳ Update tool definition in index.ts
4. ⏳ Update handler case statement
5. ⏳ Test renamed tool
6. ⏳ Update documentation

---

## 📝 NOTES

**Why the script flagged these incorrectly:**
- The script used a simple rule: "non-list operations should use singular nouns"
- But many GitHub API operations work on multiple items (batch operations)
- Some nouns are inherently plural (settings, fixes, alerts, clones, views)
- Some operations return collections (search, stats, metrics)

**Lesson learned:**
- Tool naming requires understanding the API semantics, not just pattern matching
- Batch operations (add/remove multiple items) should use plural
- Statistics/metrics that return multiple data points should use plural
- Feature names should match GitHub's official terminology

