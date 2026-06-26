# Tasks: idevapi-backport-resolver-r2

## Review Workload Forecast

| Metric | Value |
|---|---|
| **Total PRs** | 2 (chained, stacked-to-main) |
| **Files per PR** | ~3000 added (library binaries from local base) + ~10 deleted (1.3.21-only structural files) + 1 source edited + 1 min rebuilt + 1 map rebuilt |
| **Source lines per PR** | Commit A net +9 lines; Commit B net +4 lines |
| **400-line review budget applies?** | No (source delta is small; binary churn is mechanically verifiable against the local base) |
| **Budget risk** | Low |
| **Chained PRs recommended** | Yes |
| **Chain strategy** | stacked-to-main |
| **Decision needed before apply** | No |

## Phase 1: PR 1 — Commit A (1.3.19-r2)

- **Task 1.1** [HUMAN or machine] Create branch: `git checkout main && git pull`, then `git checkout -b feature/1.3.19-r2`. Verify main includes the merged 1.3.21-archive commit (or the current HEAD). Traces to: chained-pr setup.
- **Task 1.2** [machine] Reset working tree: `git rm -r --cached .` + `git clean -fdx`. Verify `git status` is clean. Clean up any leftover `_node_modules_` from previous batches. Traces to: design §2.
- **Task 1.3** [machine] Copy 1.3.19 base + build scaffolding: `Copy-Item _1.3.19\* -Destination . -Recurse -Force`, then `Copy-Item build.js, package.json, package-lock.json` from current repo root to working tree root (the 1.3.19 base has no build scaffolding). Traces to: design §File Changes (correction from sdd-tasks sub-agent).
- **Task 1.4** [machine] Tree verification: `Compare-Object` working tree vs `_1.3.19/` (excluding `js/idevAPI_core.js`). Expect empty diff. Traces to: REQ-19R2-1 (tree must match).
- **Task 1.5** [machine] Edit `js/idevAPI_core.js`: insert resolver block (lines 18-54 of e1e5451, byte-identical, TAB-indented) between scripts loop and old URLDomain. Remove old URLDomain + URLVersion chained-if blocks. Verify byte-identity of the inserted block. Traces to: REQ-19R2-1, REQ-19R2-2.
- **Task 1.6** [machine] Build: `npm run build` (or `npm install` first if `node_modules` is missing). Expect exit 0. Traces to: REQ-19R2-4.
- **Task 1.7** [machine] Drift check: 4 greps on `js/idevAPI_core-min.js` for `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, `resolveLocal` — each MUST return ≥1. If any returns 0, the build is stale. Re-run `npm run build`. Traces to: REQ-19R2-4.
- **Task 1.8** [machine] Commit: `git add -A && git commit -m "fix(1.3.19-r2): backport 1.3.21 URL resolver into 1.3.19 base"`. NO AI attribution. Traces to: design §5, work-unit-commits.
- **Task 1.9** [machine] Push branch: `git push -u origin feature/1.3.19-r2`.
- **Task 1.10** [machine] Open PR: `curl` to GitHub REST API (`gh` is not installed) with the Spanish PR body (from `release-notes/1.3.19-r2.md`). Traces to: design §5.
- **Task 1.11** [HUMAN] Review PR, address feedback, merge to main. NO squash, NO rebase (preserve commit SHA `fc5a92b` for tagging).
- **Task 1.12** [machine, after merge] `git checkout main && git pull`. Verify HEAD includes the resolver commit.

## Phase 2: PR 2 — Commit B (1.3.20-r2)

- **Task 2.1** [HUMAN or machine] Create branch: `git checkout main && git pull`, then `git checkout -b feature/1.3.20-r2`. Verify main includes the merged Commit A. Traces to: chained-pr setup.
- **Task 2.2** [machine] Reset working tree. Clean up `_node_modules_` from previous batch.
- **Task 2.3** [machine] Copy 1.3.20 base: `Copy-Item _1.3.20\* -Destination . -Recurse -Force`. (1.3.20 already has `build.js`/`package.json`/`package-lock.json`; no need to copy from main.)
- **Task 2.4** [machine] Tree verification: `Compare-Object` working tree vs `_1.3.20/`. Expect empty diff.
- **Task 2.5** [machine] Edit `js/idevAPI_core.js`: insert resolver block. Remove old URLDomain (including the 1.3.20 local-fallback regex `else` branch with `var urlMatch = srcCore.match(/^(.*?)(\/1\.[0-3]\/)/`) + URLVersion chained-if blocks. Verify byte-identity. Traces to: REQ-20R2-1, REQ-20R2-2 (known-difference for local-fallback).
- **Task 2.6** [machine] Build: `npm run build`.
- **Task 2.7** [machine] Drift check: 6 greps on `js/idevAPI_core-min.js` — 4 for the resolver + 2 for patches (`patches/iso8601-parser`, `patches/ajax-adapter` each MUST return ≥1). Traces to: REQ-20R2-3, REQ-20R2-4.
- **Task 2.8** [machine] Commit: `git add -A && git commit -m "fix(1.3.20-r2): backport 1.3.21 URL resolver into 1.3.20 base"`. NO AI attribution. Include the known-difference in the message body. Traces to: design §5.
- **Task 2.9** [machine] Push branch: `git push -u origin feature/1.3.20-r2`.
- **Task 2.10** [machine] Open PR: `curl` to GitHub REST API with the Spanish PR body (from `release-notes/1.3.20-r2.md`).
- **Task 2.11** [HUMAN] Review PR, merge to main. NO squash, NO rebase (preserve SHA `529cf8f`).
- **Task 2.12** [machine] `git checkout main && git pull`.

## Phase 3: Tag surgery (after PR 2 merged)

- **Task 3.1** [machine] Create annotated tags: `git tag -a 1.3.19-r2 fc5a92b -m "..."`, `git tag -a 1.3.20-r2 529cf8f -m "..."`. Verify `git cat-file -t` returns `tag`. Traces to: REQ-TS-2.
- **Task 3.2** [machine] Push tags: `git push origin 1.3.19-r2 1.3.20-r2`. Verify with `git ls-remote --tags origin | grep -E '1\.3\.(19|20)-r2'`.
- **Task 3.3** [machine] Delete broken remote tags: `git push origin --delete 1.3.19 1.3.19-fix 1.3.20 1.3.20-fix`. Traces to: REQ-TS-1.
- **Task 3.4** [machine] Verify: `git ls-remote --tags origin` shows exactly 3 tags. Traces to: REQ-TS-1, REQ-TS-3.

## Phase 4: GitHub Releases (after tag surgery)

- **Task 4.1** [machine] `curl` to GitHub API: create release for `1.3.19-r2` with Spanish body from `release-notes/1.3.19-r2.md`. Traces to: REQ-TS-6.
- **Task 4.2** [machine] Create release for `1.3.20-r2` with Spanish body from `release-notes/1.3.20-r2.md`. Mention the 1.3.20 local-fallback known-difference.
- **Task 4.3** [machine] Create retroactive release for `1.3.21` with Spanish body from `release-notes/1.3.21.md`. Points to the archive `openspec/changes/archive/idevapi-1.3.21/`.
- **Task 4.4** [machine] Verify: `curl` to `https://api.github.com/repos/icv-gva/idevapi/releases` lists 3 releases.

## Phase 5: Smoke test (within 24h of releases)

- **Task 5.1** [machine] Hit 9 jsdelivr URLs per design §3 (4 for 1.3.19-r2, 4 for 1.3.20-r2, 1 sanity for 1.3.21). Assert HTTP 200/404 per design.
- **Task 5.2** [HUMAN, only if smoke test fails] Decide on rollback per design §3 (delete `-r2` tags, re-publish under different suffix, re-create broken tags).

## Traceability summary

- All tasks 1.1-1.10 → REQ-19R2-1 through REQ-19R2-7.
- All tasks 2.1-2.10 → REQ-20R2-1 through REQ-20R2-7.
- All tasks 3.1-3.4 → REQ-TS-1 through REQ-TS-5.
- All tasks 4.1-4.4 → REQ-TS-6.
- All tasks 5.1-5.2 → REQ-19R2-7, REQ-20R2-7 (smoke test).
