# Spec: tag-surgery

## Purpose

The tag-surgery phase replaces the four broken remote tags (`1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix`, all pointing to commit `c0dabfa`) with two new annotated tags (`1.3.19-r2` pointing to `fc5a92b`, `1.3.20-r2` pointing to `529cf8f`). This spec defines the requirements for that phase.

## Requirements

### REQ-TS-1 — Four broken remote tags deleted

After the tag-surgery phase, the four remote tags `1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix` MUST be deleted from `origin`. `git ls-remote --tags origin` MUST NOT list these tags. The remote must have exactly three tags: `1.3.19-r2`, `1.3.20-r2`, `1.3.21`.

### REQ-TS-2 — New tags are annotated

The new tags `1.3.19-r2` and `1.3.20-r2` MUST be created as annotated tags: `git tag -a 1.3.19-r2 <sha> -m "..."` and `git tag -a 1.3.20-r2 <sha> -m "..."`. `git cat-file -t 1.3.19-r2` and `git cat-file -t 1.3.20-r2` MUST return `tag` (not `commit`). `git tag -v <tag>` MUST succeed.

### REQ-TS-3 — New tags point to correct commits

- `1.3.19-r2` MUST point to the `1.3.19-r2` work-unit commit `fc5a92b`. `git rev-parse 1.3.19-r2` MUST return `fc5a92b...`.
- `1.3.20-r2` MUST point to the `1.3.20-r2` work-unit commit `529cf8f`. `git rev-parse 1.3.20-r2` MUST return `529cf8f...`.

### REQ-TS-4 — Tag creation message

Each new tag MUST be created with a meaningful annotation message that describes the backport:

- `1.3.19-r2` message: `Backport 1.3.21 URL resolver into 1.3.19 base (revisión 2)`.
- `1.3.20-r2` message: `Backport 1.3.21 URL resolver into 1.3.20 base (revisión 2)`.

### REQ-TS-5 — Tag surgery happens AFTER both PRs merge

The tag-surgery phase (REQ-TS-1, REQ-TS-2, REQ-TS-3, REQ-TS-4) MUST NOT execute until BOTH PRs (1.3.19-r2 and 1.3.20-r2) have been merged into `main`. The order is:

1. Commit A (1.3.19-r2 work unit) lands on a branch.
2. Commit B (1.3.20-r2 work unit) lands on a branch.
3. PR 1 (Commit A) merges into `main`.
4. PR 2 (Commit B) merges into `main`.
5. **Only now**: tag-surgery phase executes (create new tags, push, delete broken tags).

If the broken tags are deleted BEFORE both `-r2` tags are visible on the remote, jsdelivr consumers pinned to `@1.3.20` will be served stale `c0dabfa` content during the gap. **The chained-PR split point** (if used) is between Commit A and Commit B; tag surgery is the final shared step and MUST be the last operation of the last slice.

### REQ-TS-6 — Three GitHub Releases

After the tag-surgery phase, three GitHub Releases MUST be created via the GitHub REST API (`curl`, since `gh` is not installed in this environment):

1. Release `1.3.19-r2` linked to the new tag, with body from `release-notes/1.3.19-r2.md` (neutral Spanish).
2. Release `1.3.20-r2` linked to the new tag, with body from `release-notes/1.3.20-r2.md` (neutral Spanish; mention the 1.3.20 local-fallback known-difference).
3. Release `1.3.21` linked to the existing tag (retroactive; the repo had 0 releases before this change), with body from `release-notes/1.3.21.md` (neutral Spanish; points to the archive `openspec/changes/archive/idevapi-1.3.21/`).

All three releases MUST be `draft: false` and `prerelease: false`.

## Scenarios

### Scenario: final remote tag state

**Given** the tag-surgery phase has completed,
**When** running `git ls-remote --tags origin`,
**Then** the output lists exactly three tags: `1.3.19-r2`, `1.3.20-r2`, `1.3.21`. None of `1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix` appear.

### Scenario: 1.3.19-r2 is annotated

**Given** the `1.3.19-r2` tag has been created,
**When** running `git cat-file -t 1.3.19-r2`,
**Then** the output is `tag`. When running `git tag -v 1.3.19-r2`, the verification succeeds (locally; GPG signing may be unverified but no error).

### Scenario: 1.3.20-r2 is annotated

**Given** the `1.3.20-r2` tag has been created,
**When** running `git cat-file -t 1.3.20-r2`,
**Then** the output is `tag`.

### Scenario: 1.3.19-r2 points to fc5a92b

**Given** the `1.3.19-r2` tag has been created and pushed,
**When** running `git rev-parse 1.3.19-r2`,
**Then** the output matches the SHA `fc5a92b...`.

### Scenario: 1.3.20-r2 points to 529cf8f

**Given** the `1.3.20-r2` tag has been created and pushed,
**When** running `git rev-parse 1.3.20-r2`,
**Then** the output matches the SHA `529cf8f...`.

### Scenario: tag surgery ordered after both PRs merge

**Given** PR 1 (1.3.19-r2) and PR 2 (1.3.20-r2) have been merged to `main`,
**When** the tag-surgery phase begins,
**Then** both `-r2` tags are created locally, pushed to `origin`, and the four broken tags are deleted from `origin`.

### Scenario: 3 GitHub Releases listed

**Given** the release phase has completed,
**When** calling `https://api.github.com/repos/icv-gva/idevapi/releases`,
**Then** the response lists three releases: `1.3.19-r2`, `1.3.20-r2`, `1.3.21`, each with the corresponding tag_name, the title from the release-notes file, and a body in neutral Spanish (presence of accented chars: `ó`, `í`, `ñ`, `á`, `é`).

### Scenario: rollback if tag-surgery fails mid-batch

**Given** the deletion of the four broken remote tags fails partway (e.g. one or more `git push origin --delete` commands error out),
**When** the apply phase detects the failure,
**Then** the apply phase re-creates the deleted tags via `git tag <name> <c0dabfa>` + `git push origin <name>` to restore the pre-surgery state. Abort rollout. Keep the `-r2` tags live (they are harmless; consumers are not pinned to them yet).
