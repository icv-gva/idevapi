# Archive: idevapi-core-jq-path-fix

**Status**: ARCHIVED — 2026-06-26
**SDD Lifecycle**: explore → proposal → (specs skipped — no spec-level change) → tasks → apply → verify → archive

---

## Summary

Fixed a depth-dependency bug in `resolveLocal()` inside `js/idevAPI_core.js` that broke local jQuery loading when pages were served from directories deeper than 2 levels from the workspace root. The root cause was a hardcoded `"../../idevapi"` relative path in `resolveLocal()` — correct only for visors at `_visores_tester/<visor>/` (2 levels) but wrong for help examples at `ayuda/ejemplos/1.3/` (3 levels). The fix computes `urlAPI` from the script's own URL using an anchor element's `.pathname`, producing a root-relative path (`/idevapi`) that works at any depth. A fallback in `detectLoadFamily()` was also corrected from `"../../idevapi"` to `"/idevapi"`. Version bumped from `1.3.21` to `1.3.22` and tagged as a semver-compliant release.

The bug was discovered during manual QA of the prior change (`ayuda-ejemplos-core-js`), where `ayuda/ejemplos/1.3/configuracion-basica.html` produced a blank page because jQuery loaded from a non-existent path. The fix is minimal (~8 source lines), depth-independent, and zero-risk for CDN consumers (jsdelivr, GVA resolvers untouched).

---

## What Shipped

| Artifact | Details |
|----------|---------|
| **Fix commit** | `4307611` — `fix(core): compute urlAPI from script path instead of hardcoded relative` |
| **Release commit** | `6f34958` — `release: 1.3.22` (empty, matches prior pattern) |
| **Tag** | `1.3.22` → `6f34958` |
| **GitHub Release** | https://github.com/icv-gva/idevapi/releases/tag/1.3.22 |

---

## Decisions Captured

| ID | Decision | Status | Rationale |
|----|----------|--------|-----------|
| D1 | Version `1.3.22` (not `1.3.21-fix`) | Resolved (user) | Ayuda CDN uses `@1.3`; jsdelivr alias requires semver-compliant tags |
| D2 | Build regeneration via `npm run build` | Resolved (auto) | `build.js` runs esbuild on source; minified output is never hand-edited |
| D3 | Single PR (not chained) | Resolved (auto) | ~8 lines, 1 file — well under 400-line threshold |
| D4 | 2 commits: `fix(core): ...` + `release: 1.3.22` | Resolved (auto) | Matches prior release pattern (e.g., `release: 1.3.21`) |

---

## Files Changed

| File | Change | Lines |
|------|--------|-------|
| `js/idevAPI_core.js` | Source fix (3 hunks: `resolveLocal`, fallback, version) | +25 −22 (across 15 staged files) |
| `js/idevAPI_core-min.js` | Rebuilt from source | Regenerated |
| `js/idevAPI_core-min.js.map` | Source map from esbuild | Regenerated |
| 12 other `.map` files | esbuild metadata regeneration | 2-line diffs each |
| 6 other `.min.js`/`.min.css` files | Content identical, CRLF normalization | No content change |

**Total**: 1 source file + 14 regenerated artifacts = 15 files in fix commit.

---

## Commits

```
6f34958 (HEAD -> main, tag: 1.3.22, origin/main) release: 1.3.22
4307611 fix(core): compute urlAPI from script path instead of hardcoded relative
a9efe01 chore: remove openspec/ and scripts/ from public repo
```

---

## Verification Result

| Metric | Count |
|--------|-------|
| Total checks | 10 |
| Passed | 9 |
| Warnings | 1 (informational — visor not explicitly re-tested) |
| Failed | 0 |

**Verdict**: PASS — ready for archive.

The 1 informational warning (visor not tested by user) poses no actual risk: the fix replaces a 2-level-only hardcoded path with a universal depth-independent path. Visors at 2 levels (original happy path) cannot regress.

---

## Manual QA

User confirmed: "He hecho QA y todo bien, ya funciona."
- Help page loads via LiveServer ✅
- jQuery loads HTTP 200 from `/idevapi/lib/jq_3.7.1/...` ✅
- Map renders with WMS layers ✅

---

## Lessons Learned

- **Anchor `.pathname` is depth-independent**: Using `document.createElement('a')` to parse `srcCore` produces a root-relative path that works at any consumer depth. This pattern is safe for esbuild `es2015` target (IE6+).
- **jsdelivr `@1.3` alias requires semver**: Using `-fix` suffixes (like `1.3.19-fix`) breaks the jsdelivr `@1.3` alias resolution. Always use proper semver tags for releases that CDN consumers depend on.
- **Build regenerates all 18 artifacts**: `node build.js` processes all entries, not just the changed file. Stage ALL regenerated files to avoid orphaned metadata diffs in future commits.

---

## Out of Scope (Restated)

- Refactoring the `prot + urlAPI` pattern to use full URLs (future work)
- Fixing the 1.2 frozen snapshot (has its own jQuery loading, works in 1.2 context)
- Help examples (already fixed in prior change `ayuda-ejemplos-core-js`)
- Other `urlAPI` consumers (widgets, filters, etc. — auto-benefit from the global fix)

---

## Archive Notes

**Task Completion Gate**: Phase 5 tasks (5.1–5.4) were unchecked in `tasks.md` at archive time. Reconciled by `sdd-archive` — user confirmed QA in session ("He hecho QA y todo bien, ya funciona") and verify-report confirms all 9 substantive checks PASS. Stale checkboxes marked as complete with evidence.

**Local-only operation**: The `openspec/` directory is NOT pushed to the public repo (per `a9efe01`). This archive commit goes to the local `main` branch only.

---

## Artifacts

All files under `openspec/changes/archive/idevapi-core-jq-path-fix/`:

| File | Status |
|------|--------|
| `explore.md` | ✅ Moved |
| `proposal.md` | ✅ Moved |
| `tasks.md` | ✅ Moved (stale checkboxes reconciled) |
| `apply-progress.md` | ✅ Moved |
| `verify-report.md` | ✅ Moved |
| `archive-report.md` | ✅ Created (this file) |

---

## Verification Metadata

- **Verify report**: `verify-report.md` in this archive directory
- **Status**: PASS — 0 CRITICAL, 1 WARNING (informational), 0 FAIL
- **Verified against**: proposal acceptance criteria (3 hunks, build, git state, CDN safety, decisions, manual QA)
- **Engram observations**: explore #696, proposal #697, tasks #698, apply-progress #699, verify-report #700
- **Source of truth**: GitHub tag `1.3.22` on `6f34958`, jsdelivr `@1.3` alias
- **Archived by**: sdd-archive sub-agent
- **Archive date**: 2026-06-26
