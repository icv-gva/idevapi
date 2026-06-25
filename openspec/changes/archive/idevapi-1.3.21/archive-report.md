# Archive Report: idevapi-1.3.21

## Executive summary

The `idevapi-1.3.21` change is now **ARCHIVED**. The library was patched to support the 3-layer load contract (local / GVA CDN / jsdelivr), 33 visors in `_visores_tester/` were migrated to a canonical 5-branch selector, and the URL resolver was backported to tags 1.3.19 and 1.3.20. A jsdelivr CDN cache invalidation issue was discovered and worked around via new `-fix` tags. The user (`icv-gva`) confirmed all 6 smoke tests PASS before archive. One requirement is explicitly deferred to a future help-system SDD (`ayuda/ejemplos/1.3/` migration).

## Final state

### Library
- 5 tags on GitHub: `1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix`, `1.3.21`
- All 4 backport/touch tags point to commit `c0dabfa` (resolver rewrite + cache invalidation touch)
- `1.3.21` unchanged at `881a4a0`
- The new `detectLoadFamily(srcCore)` + 3 helpers (`resolveJsdelivr`, `resolveGVA`, `resolveLocal`) + safe-degradation fallback is in all backport/touch tags
- 18 minified artifacts (`*-min.js`, `*-min.css`, `*.map`) rebuilt and committed

### Visors
- 33 visors in `D:\antigravity\idevapi\_visores_tester\` migrated to canonical 5-branch selector
- 0 visors in `ayuda/ejemplos/1.3\` modified (deferred to future help SDD)
- Junction `D:\antigravity\idevapi\1.3` deleted
- PowerShell migration script at `D:\antigravity\idevapi\idevapi\scripts\migrate-idevapi-1.3.21-visors.ps1` (committed, auditable)

### jsdelivr state
- Fresh content for: `1.3.19-fix`, `1.3.20-fix`, `1.3.21`, `@1.3`, `@1` (5 jsdelivr forms PASS)
- Stale content (will self-correct): `1.3.19`, `1.3.20`

### Smoke tests
- 6 HTML files in `D:\antigravity\idevapi\_visores_tester\_smoke_tests\`
- All 6 tests PASS per user confirmation

## Requirements coverage

- **26 of 27 requirements PASS**
- 0 PARTIAL
- 0 FAIL
- 1 DEFERRED: REQ-VIS-8 (`ayuda/ejemplos/1.3\` migration) — moved to future help SDD (memory `idevapi/help-system-future-sdd`)

## Key learnings

1. **jsdelivr purge does NOT always work for previously cached tags**, even with force-push + per-file purge. The reliable workaround is to create a NEW tag with the same content — the new URL forces a fresh fetch. Documented in `apply-progress.md` Phase 7.3 and 7.4.

2. **For the 3-layer load contract, the resolver must be tag-agnostic** (regex `[^/]+@[^/]+` matches any jsdelivr tag form including `@1.3`, `@1`, `@latest`).

3. **Touch commits for cache invalidation must use no-op STATEMENTS (not just comments)** because esbuild strips comments during minification. `var __idevapiTouch20260625 = 1;` survives minification and changes the ETag.

4. **The 4-branch selector pattern in visors is duplicated 33 times** (one per visor). Future maintenance should extract it to a shared file, but that's out of scope for this change.

5. **GVA resolver context**: `/api` is the FTP path (pre-DESA, used when loaded from `https://idevapi.gva.es/ajuda/`), not just a CDN alias. It's kept for legacy FTP-based consumers. (Documented in memory `idevapi/gva-resolver-context`.)

6. **The `;es;va` suffix convention is used for bilingual property strings** in visors, but the visor selector and `console.warn` are es-only per REQ-VIS-6 (user confirmed in Q2).

## Follow-up actions

### Future help SDD (memory: `idevapi/help-system-future-sdd`)
- Migrate the 27 HTML examples in `D:\antigravity\idevapi\ayuda\ejemplos\1.3\`
- Different selector pattern: local / FTP / DSA / PRE / PRO (no jsdelivr)
- FTP URL: `https://idevapi.gva.es/api/1.3/js/idevAPI_core.js`
- GVA URLs: `geoidevapi[-dsa|-pre].gva.es/1.3/js/idevAPI_core-min.js`
- Deployment via SVN+Jenkins (not GitHub)
- In the help code display, the selector's `if/case` block is REPLACED by a fixed `<script src="https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js"></script>` tag

### Future visors improvement (out of scope for 1.3.21)
- Extract the 4-branch selector to a shared `wg/idevAPI_selector.js` file to avoid duplicating 33 times
- Would require updating the visor script tags to load the shared selector

### jsdelivr cache monitoring
- The 1.3.19 and 1.3.20 tags may eventually self-correct (days to weeks)
- Once corrected, consumers can be pointed back to the canonical tags
- Consider deprecating the `-fix` tags in a future version

## Artifacts produced

### OpenSpec artifacts (this change)
- `openspec/changes/archive/idevapi-1.3.21/proposal.md`
- `openspec/changes/archive/idevapi-1.3.21/specs/url-resolver/spec.md`
- `openspec/changes/archive/idevapi-1.3.21/specs/visor-selector/spec.md`
- `openspec/changes/archive/idevapi-1.3.21/specs/release-process/spec.md`
- `openspec/changes/archive/idevapi-1.3.21/design.md`
- `openspec/changes/archive/idevapi-1.3.21/tasks.md`
- `openspec/changes/archive/idevapi-1.3.21/apply-progress.md`
- `openspec/changes/archive/idevapi-1.3.21/verify-report.md`
- `openspec/changes/archive/idevapi-1.3.21/archive-report.md` (this file)

### Library code
- `js/idevAPI_core.js` (rewritten resolver with `detectLoadFamily` + 3 helpers)
- 18 `*-min.*` artifacts (rebuilt)
- `scripts/migrate-idevapi-1.3.21-visors.ps1` (PowerShell migration script)

### Smoke tests (in parent workspace, outside repo)
- `D:\antigravity\idevapi\_visores_tester\_smoke_tests\jsdelivr-1.3.19-fix.html`
- `D:\antigravity\idevapi\_visores_tester\_smoke_tests\jsdelivr-1.3.20-fix.html`
- `D:\antigravity\idevapi\_visores_tester\_smoke_tests\jsdelivr-1.3.21.html`
- `D:\antigravity\idevapi\_visores_tester\_smoke_tests\jsdelivr-1.3.html`
- `D:\antigravity\idevapi\_visores_tester\_smoke_tests\jsdelivr-1.html`
- `D:\antigravity\idevapi\_visores_tester\_smoke_tests\visor-local.html`
- `D:\antigravity\idevapi\_visores_tester\_smoke_tests\README.md`

## Git state

- Branch: main
- HEAD: c0dabfa
- Tags: 1.3.19, 1.3.19-fix, 1.3.20, 1.3.20-fix, 1.3.21
- Working tree: clean (before archive commit)

## SDD phases summary

| Phase | Status | Date | Key outcome |
|-------|--------|------|-------------|
| Preflight | ✅ | 2026-06-25 | interactive + openspec + ask-always + 400 lines |
| Init guard | ✅ | 2026-06-25 | sdd-init ran, project context cached |
| Explore | ✅ | 2026-06-25 | URL resolver bug identified, 3-layer architecture documented |
| Propose | ✅ | 2026-06-25 | 88-line proposal, 4 resolved decisions |
| Spec | ✅ | 2026-06-25 | 27 requirements, 45 scenarios, 3 capabilities |
| Design | ✅ | 2026-06-25 | 425-line design, 4 design questions resolved |
| Tasks | ✅ | 2026-06-25 | 7 phases, 14 tasks, chain=stacked-to-main, PR2 size:exception |
| Apply | ✅ | 2026-06-25 | 1.3.21 + backport + touch + -fix tags, all 5 jsdelivr + local tests PASS |
| Verify | ✅ | 2026-06-25 | 26/27 PASS, 0 FAIL, ready to archive |
| Archive | ✅ | 2026-06-25 | This document |

## Sign-off

Change is **ARCHIVED**. The user (`icv-gva`) has confirmed all smoke tests pass and approved the closure. The library IDEVAPI now supports the 3-layer load contract (local / GVA CDN / jsdelivr) for versions 1.3.19-fix, 1.3.20-fix, and 1.3.21. Future help-system SDD needed to migrate `ayuda/ejemplos/1.3/`.
