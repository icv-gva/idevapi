# Design: idevapi-backport-resolver-r2

## Technical Approach

Two work-unit commits, one per backport base. **Each commit replaces the repo's working tree with the local base's structure** (because the live versions have different folder layouts: 1.3.19 is top-level, 1.3.20 has `lib/` and `patches/`), then inserts the **byte-identical** 1.3.21 resolver block (commit `e1e5451`, lines 18-54, 37 lines) into `js/idevAPI_core.js`, then rebuilds the minified via `npm run build`. The work unit per commit is: **base tree + edited source + rebuilt minified**, all in ONE commit per the `work-unit-commits` skill. After both commits land and are pushed, a single tag-surgery step deletes the four broken remote tags and pushes two new annotated `-r2` tags.

**Why tree replacement is necessary (user-confirmed 2026-06-25)**: live apps may load JS from jsdelivr with paths pinned to a specific version's folder layout. The 1.3.19 base expects top-level paths (`jq_3.7.1/`, `select2_4.1.0/`, etc.); the 1.3.20 base expects `lib/...` paths; the 1.3.21 base (current repo) has `lib/` and `patches/`. If the `-r2` tags inherited the 1.3.21 tree, the source's `loadScript` paths would 404. User quote: "No quiero tocar la estructura por si acaso desde las apps leen de algún JS directamente, y cambiar a /lib rompería la app".

Traces to: REQ-19R2-1/2/5, REQ-20R2-1/2/5, REQ-TS-1/5.

## Architecture Decisions

### Decision: Rebuild the working tree from the local base per version (not surgical edits)
For each commit, `git rm -r --cached .` and `git clean -fdx` to clear the working tree, then `Copy-Item _1.3.19/* .` (or `_1.3.20/*`) to restore the base structure. Then edit `js/idevAPI_core.js` to insert the resolver. Then `npm run build`. Then `git add -A && git commit`.

**Alternatives considered**:
- *Surgical edit of `idevAPI_core.js` only*: rejected because the 1.3.19 base's `loadScript` paths point to top-level but the 1.3.21 tree has `lib/jq_3.7.1/...` → 404 in jsdelivr.
- *Edit `loadScript` paths in the 1.3.19 source to use `lib/`*: rejected because user explicitly forbade touching the source structure.

**Critical correction detected by sdd-tasks sub-agent**: `_1.3.19/` does not have `build.js`, `package.json`, or `package-lock.json`. After the base copy, the apply phase must copy the build scaffolding from the current repo (HEAD) into the working tree so `npm run build` works. `_1.3.20/` DOES have these files (1.3.20 already had tooling).

### Decision: Chained-PR stacked-to-main (user-confirmed 2026-06-25)
Two PRs, each merging a single work-unit commit to `main`. PR 1 = Commit A (1.3.19-r2); PR 2 = Commit B (1.3.20-r2). Tag surgery + 3 GitHub Releases = final step.

**Rationale**: stacked-to-main gives the reviewer a clear "merge or reject" decision per release. Each PR is a complete release artifact (tree + source + tag). Tag surgery is the last mutating step of the chain; if the reviewer wants to abort, the broken tags stay in place and no harm is done. Traces to `chained-pr` skill.

### Decision: 3 GitHub Releases, notes in neutral Spanish (user-confirmed 2026-06-25)
1. `1.3.19-r2` — linked to the new annotated tag, notes in Spanish.
2. `1.3.20-r2` — linked to the new annotated tag, notes in Spanish.
3. `1.3.21` — retroactive release for the existing tag (the repo had 0 releases before this change; this fills the gap).

**Language**: neutral/professional Spanish (no Rioplatense, no voseo, no slang). Public-facing artifact.

### Decision: 1.3.19-r2 tree is top-level (no `lib/`, no `patches/`); 1.3.20-r2 tree has `lib/` and `patches/`
- Commit A (1.3.19-r2): tree = `_1.3.19/` structure (no `lib/`, no `patches/`, no `scripts/`, no `openspec/`, no `.atl/`).
- Commit B (1.3.20-r2): tree = `_1.3.20/` structure (with `lib/`, with `patches/iso8601-parser.js` and `patches/ajax-adapter.js`).

### Decision: Annotated tags, not lightweight
`git tag -a 1.3.19-r2 <sha> -m "..."` and `1.3.20-r2`. REQ-TS-2 requires `git cat-file -t` to return `tag`.

### Decision: Tag surgery AFTER both commits land, never between
Sequence = Commit A → Commit B → push both → create+push `-r2` tags → delete broken tags → smoke test. The chained-PR split point is between A and B. Tag surgery is the final shared step and MUST be the last operation of the last slice. Traces to REQ-TS-5.

## 1. Diff Strategy

### Resolver block to insert (byte-for-byte, source: `git show e1e5451:js/idevAPI_core.js`, lines 18-54)

```
// ---- Entry point: jsdelivr -> GVA -> local -> safe-degradation fallback ----
function detectLoadFamily(srcCore) {
    var family;
    family = resolveJsdelivr(srcCore); if (family) return family;
    family = resolveGVA(srcCore);      if (family) return family;
    family = resolveLocal(srcCore);    if (family) return family;
    return { urlAPI: "../../idevapi", URLVersion: "" };
}
// jsdelivr: tag-agnostic. Matches @1.3.19, @1.3.20, @1.3.21, @1.3, @1, @@latest.
function resolveJsdelivr(srcCore) { ... }
// GVA: 6 sub-environments ...
function resolveGVA(srcCore) { ... }
// Local (pattern beta): conservative — only the literal "idevapi/js/idevAPI_core" shape.
function resolveLocal(srcCore) { ... }
var family = detectLoadFamily(srcCore);
var urlAPI = family.urlAPI;
var URLVersion = family.URLVersion;
```

### Commit A (1.3.19-r2)
- Base: `_1.3.19/js/idevAPI_core.js` (2153 lines).
- Insert resolver block (lines 18-54 of e1e5451) between scripts loop and old URLDomain; remove old URLDomain + URLVersion chained-if blocks (L18-47 of 1.3.19 base).
- Net delta: +9 lines.
- Tree replacement: copy `_1.3.19/*` + `build.js`/`package.json`/`package-lock.json` from main; delete `lib/`, `scripts/`, `openspec/`, `.atl/`, `js/patches/`, `package-lock.json` etc. (1.3.21-only files).

### Commit B (1.3.20-r2)
- Base: `_1.3.20/js/idevAPI_core.js` (2771 lines).
- Replace old URLDomain (including the 1.3.20 local-fallback regex `else` branch with `var urlMatch = srcCore.match(/^(.*?)(\/1\.[0-3]\/)/)`) + URLVersion chained-if blocks with the resolver block.
- Net delta: +4 lines.
- Known-difference (Decision A): the local-fallback regex is intentionally replaced. Users with non-standard local folder names must rename to `idevapi` or adjust the visor.

## 2. Commit Sequence and Rollback Boundaries

| # | Step | Rollback if it fails |
|---|------|----------------------|
| 1-5 | Reset working tree, copy base, tree verify, edit source, build | Re-edit; no commit yet. |
| 6 | Drift check (4 or 6 greps on minified) | Re-run `npm run build`. |
| 7 | Commit A or B (work unit) | `git reset --hard HEAD~1`. |
| 8 | Push branch | Re-push. |
| 9 | Open PR (via `curl` to GitHub API; `gh` is not installed) | Re-create PR. |
| 10 | [HUMAN] Review and merge | User action. |
| 11 | Create annotated `-r2` tags | `git tag -d` (local-only). |
| 12 | Push tags | Re-push. |
| 13 | Delete broken remote tags (4) | Re-create the deleted ones at `c0dabfa` and re-push. |
| 14 | Create 3 GitHub Releases (Spanish notes) | Edit release via PATCH. |
| 15 | Smoke test (within 24h) | If fails, delete `-r2` tags and re-publish under different suffix. |

**Chained-PR split point**: between Commit A and Commit B. Each PR is independently mergeable.

## 3. Build and Verification Protocol

- **Build**: `npm run build` (esbuild ^0.27.4, 18 entries). Exit 0 before `git add`.
- **Drift check**: 4 greps on `js/idevAPI_core-min.js` for `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, `resolveLocal` (Commit B additionally: `patches/iso8601-parser` and `patches/ajax-adapter`).
- **Tree verification**: `Compare-Object` working tree vs `_1.3.19/` (or `_1.3.20/`), excluding the source file we're about to edit.
- **Smoke test**: 9 jsdelivr URLs (4 for 1.3.19-r2, 4 for 1.3.20-r2, 1 sanity for 1.3.21) per the design checklist.

## 4. Risk Register (revised)

| ID | Risk | Severity | Mitigation | Rollback |
|----|------|----------|------------|----------|
| R1 | jsdelivr cache window | Medium | 24h smoke test | Delete `-r2`, re-publish with different suffix |
| R3 | `*-min.js` drift | Medium | 4-grep drift check + work-unit invariant | Amend commit with fresh build |
| R-NUEVO-A | Tree mismatch (cp misses files) | Medium | Compare-Object verify | Amend commit with missing files |
| R-NUEVO | 1.3.20 local-fallback regression | Low (accepted) | PR body note | None — accepted known-difference |
| R2 | (DOWNGRADED) Old-tag consumers break | Low | User-confirmed no consumers | Re-create old tags if needed |

## 5. PR Body / Commit Message Templates

See `tasks.md` and the original design discussion for the conventional commit message and Spanish PR body templates.

## 6. Out of Scope (restated)

- IDEVAPI 1.3.21 itself (no change).
- Help system at `ayuda/ejemplos/1.3` (deferred to future help-system SDD).
- GVA CDN upload (we publish to jsdelivr only).
- The 1.3.20 `else`-branch local-fallback regex (replaced, not preserved).
- Editing `loadScript`/`loadCSS` paths or the structure of `js/idevAPI_core.js` beyond the resolver block insertion.
- The `1.3.21` repo additions (`scripts/`, `openspec/`, `.atl/`, `build.js`, `package.json`).

## Open Questions

None blocking. Apply phase must confirm `npm run build` exits 0 on a tree that holds the 1.3.19 base + resolver (the 1.3.19 base has no `lib/` or `patches/`, so all 18 build entries must resolve against top-level paths or the build scaffolding from current main).
