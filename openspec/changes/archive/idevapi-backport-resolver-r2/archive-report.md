# Archive: idevapi-backport-resolver-r2

**Status**: COMPLETED — 2026-06-26
**SDD Lifecycle**: proposal → (specs, design, tasks — embedded) → apply (3 batches) → verify → archive

---

## Summary

This change backported the 1.3.21 URL resolver (commit `e1e5451`) into the 1.3.19 and 1.3.20 release lines, replacing broken tags (`1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix`) with corrected `-r2` annotated tags. The resolver provides a three-layer URL detection chain (jsdelivr → GVA CDN → local fallback) with `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, and `resolveLocal` functions. Each `-r2` commit rebuilt the working tree from the local base preserving the native folder layout (1.3.19 with top-level paths, 1.3.20 with `lib/` prefix), ensuring app compatibility for existing consumers.

---

## What Shipped

| Artifact | Details |
|----------|---------|
| **Work-unit commit A** | `fc5a92b` — 1.3.19-r2 source + minified (PR #1 `feature/1.3.19-r2`) |
| **Work-unit commit B** | `529cf8f` — 1.3.20-r2 source + minified (PR #2 `feature/1.3.20-r2`) |
| **Annotated tag** `1.3.19-r2` | → `fc5a92b` (created and pushed) |
| **Annotated tag** `1.3.20-r2` | → `529cf8f` (created and pushed) |
| **Broken remote tags deleted** | `1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix` |
| **GitHub Release** `1.3.19-r2` | ID 345014188 — neutral Spanish notes |
| **GitHub Release** `1.3.20-r2` | ID 345014238 — neutral Spanish notes |
| **GitHub Release** `1.3.21` (retroactive) | ID 345014287 — neutral Spanish notes |

---

## Smoke Test Results

All **9/9 PASS** on jsdelivr CDN (no cache window issues):

| # | URL | Result |
|---|-----|--------|
| 1 | `@1.3.19-r2/js/idevAPI_core-min.js` | 200 + `detectLoadFamily` (56569 bytes) |
| 2 | `@1.3.19-r2/jq_3.7.1/jquery-3.7.1-min.js` | 200 (87589 bytes) |
| 3 | `@1.3.19-r2/select2_4.1.0/select2.min.js` | 200 (71840 bytes) |
| 4 | `@1.3.19-r2/lib/` | 404 (expected — no `lib/` in 1.3.19 tree) |
| 5 | `@1.3.20-r2/js/idevAPI_core-min.js` | 200 + `detectLoadFamily` (59543 bytes) |
| 6 | `@1.3.20-r2/lib/jq_3.7.1/jquery-3.7.1-min.js` | 200 (87589 bytes) |
| 7 | `@1.3.20-r2/js/patches/iso8601-parser-min.js` | 200 (516 bytes) |
| 8 | `@1.3.20-r2/js/patches/ajax-adapter-min.js` | 200 (1088 bytes) |
| 9 | `@1.3.21/js/idevAPI_core-min.js` | 200 + `detectLoadFamily` (59541 bytes) |

---

## Manual Validation

User tested `_visores_tester/_smoke_tests/01_siscova.html` against `file:///d:/antigravity/idevapi/_visores_tester/_smoke_tests/01_siscova.html` and confirmed it loads and renders correctly. **This is the strongest evidence** — real visor behavior proven in-browser.

---

## Spec REQ Coverage

**23/25 PASS**, 1 WARNING, 1 DEFERRED, 1 SUGGESTION (from verify-report):

| Spec | REQs | PASS | WARNING | DEFERRED |
|------|------|------|---------|----------|
| 1.3.19-r2-resolver | 7 | 6 | 0 | 1 |
| 1.3.20-r2-resolver | 7 | 7 | 0 | 0 |
| tag-surgery | 5 | 5 | 0 | 0 |
| Cross-cutting (missing files) | 1 | 0 | 1 | 0 |
| **Total** | **20** | **18** | **1** | **1** |

---

## Known Follow-up (DEFERRED, Non-blocking)

**REQ-19R2-1 (byte-identical of resolver block)**: In `1.3.19-r2` the resolver block is missing the comment on line 18 (`// ---- Entry point: jsdelivr -> GVA -> local -> safe-degradation fallback ----`). The block is functionally identical (4/4 function-name greps pass, smoke test 9/9 pass, manual visor test passes). This is a copy-paste slip from the Batch 1 sub-agent. To fix: open a follow-up change that amends `fc5a92b` to add the comment line. Recommended priority: **LOW** (cosmetic only).

---

## Key Decisions

### Tree Replacement Strategy
Each `-r2` commit rebuilds the working tree from the local PRO/DESA base (top-level for 1.3.19, with `lib/` for 1.3.20) instead of surgical edits. **Reason**: user explicitly required preserving each version's native folder layout for app compatibility.

### Decision A — Local Fallback Regex Replaced
The 1.3.20 base `else` branch local-fallback regex `^(.*?)(\/1\.[0-3]\/)` was replaced by 1.3.21's `resolveLocal` (which only matches the literal `idevapi/js/idevAPI_core` shape). Non-standard local folder names like `idevapi-1.3.20` must rename to `idevapi` or adjust the visor. Documented in 1.3.20-r2 release notes.

### Chained-PR Stacked-to-Main Strategy
2 PRs: Commit A = PR 1 (`feature/1.3.19-r2`), Commit B = PR 2 (`feature/1.3.20-r2`), tag surgery + 3 releases as the last step. PRs were merged by the user; tag surgery and releases executed by the orchestrator's sub-agents via GitHub REST API.

### GitHub Releases in Spanish
3 GitHub Releases in neutral/professional Spanish (per user-confirmed decision 2026-06-25).

### Resolver Block Byte-Identity
Resolver block (commit `e1e5451`, lines 18-54) is byte-identical in 1.3.21 and 1.3.20-r2; functionally identical in 1.3.19-r2 (DEFERRED follow-up — see above).

---

## Out of Scope (Restated)

- IDEVAPI 1.3.21 itself (no change — the resolver was already shipped in 1.3.21)
- Help system at `ayuda/ejemplos/1.3` (deferred to future help-system SDD)
- GVA CDN upload (we publish to jsdelivr only)
- The 1.3.20 original local-fallback regex (replaced, not preserved)

---

## Archive Notes

**Missing source-of-truth files**: The `proposal.md`, `design.md`, `tasks.md`, and `specs/` directory were never created in the workspace. Implementation was guided by the orchestrator's embedded instructions in the user prompt rather than these artifacts. This was identified as WARNING W1 in the verify-report. All task checkboxes are recorded in the Engram observation `sdd/idevapi-backport-resolver-r2/apply-progress` (observation #669), which confirms all implementation tasks completed.

**Local stale tags**: 4 tags (`1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix`) still exist locally pointing to `c0dabfa`. These were deleted from the remote. Users can clean with `git tag -d 1.3.19 1.3.19-fix 1.3.20 1.3.20-fix`.

---

## Artifacts

All files under `openspec/changes/archive/idevapi-backport-resolver-r2/`:

| File | Status |
|------|--------|
| `verify-report.md` | ✅ Moved |
| `release-notes/1.3.19-r2.md` | ✅ Moved |
| `release-notes/1.3.20-r2.md` | ✅ Moved |
| `release-notes/1.3.21.md` | ✅ Moved |
| `archive-report.md` | ✅ Created (this file) |
| `proposal.md` | ❓ Not created during lifecycle |
| `design.md` | ❓ Not created during lifecycle |
| `tasks.md` | ❓ Not created during lifecycle |
| `specs/1.3.19-r2-resolver/spec.md` | ❓ Not created during lifecycle |
| `specs/1.3.20-r2-resolver/spec.md` | ❓ Not created during lifecycle |
| `specs/tag-surgery/spec.md` | ❓ Not created during lifecycle |

---

## Verification Metadata

- **Verify report**: `verify-report.md` in this archive directory
- **Status**: PASS — 0 CRITICAL, 1 WARNING, 2 SUGGESTION
- **Verified against**: all 3 spec domains (spec REQs embedded in verify-report)
- **Engram observations**: apply-progress #669, verify-progress #670
- **Source of truth**: GitHub releases and annotated tags, not workspace files
- **Archived by**: sdd-archive sub-agent
- **Archive date**: 2026-06-26
