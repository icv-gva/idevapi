# Proposal: idevapi-backport-resolver-r2

## Why

The remote tags `1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix` all point to commit `c0dabfa`, which introduced `lib/`, `js/patches/`, and rewrote `loadScript` paths. That commit **breaks drop-in compatibility** with the live PRO (`geoidevapi.gva.es/1.3/`, top-level paths) and live DESA (`geoidevapi-dsa.gva.es/1.3/`) deployments. jsdelivr consumers on those tags receive content whose `loadScript` paths do not match the live versions, producing 404s on the dependent libraries.

In addition, 1.3.19 and 1.3.20 had no URL resolver — they used legacy chained-if blocks for URL detection that only supported a few hard-coded GVA hostnames and did not handle jsdelivr tags. Consumers pinned to those tags in jsdelivr cannot easily load IDEVAPI in local testing or in the GVA CDN environments.

This change addresses both problems by backporting the 1.3.21 URL resolver into 1.3.19 and 1.3.20 bases, and publishing new `-r2` tags that reflect the live PRO/DESA folder layouts.

## What changes

Two work-unit commits, one per backport base, each replacing the repo's working tree with the local PRO/DESA base structure (1.3.19 = top-level layout, no `lib/`, no `patches/`; 1.3.20 = with `lib/` and `patches/`), inserting the byte-identical 1.3.21 resolver block (commit `e1e5451`, lines 18-54, 37 lines including the entry-point comment) into `js/idevAPI_core.js`, and rebuilding the minified via `npm run build`.

After both commits land and are pushed, a single tag-surgery step deletes the four broken remote tags and creates two new annotated `-r2` tags. Then three GitHub Releases are created with notes in neutral/professional Spanish.

## Impact

- **Two PRs (chained, stacked-to-main)**: PR 1 = Commit A (1.3.19-r2), PR 2 = Commit B (1.3.20-r2). Tag surgery and releases are the last step.
- **File churn per PR**: ~3000 library files added (from the local base) + ~10 files deleted (1.3.21-only structural files like `lib/`, `scripts/`, `openspec/`, `.atl/`, `js/patches/`, `build.js`, `package.json`, `package-lock.json`, `.gitignore` in the 1.3.19 case).
- **Source lines per PR**: Commit A net +9 lines; Commit B net +4 lines. Both far below the 400-line PR review budget.
- **No new dependencies**.
- **Affected**: jsdelivr consumers currently on `@1.3.19` / `@1.3.20` / `@1.3.19-fix` / `@1.3.20-fix` will silently get 404s after the broken tags are deleted. They must migrate to `@1.3.19-r2` / `@1.3.20-r2` or jump to `@1.3.21`. PRO/DESA users are unaffected (GVA CDN, not jsdelivr).

## Out of scope

- **IDEVAPI 1.3.21 itself**: already archived at `8620edf`, no change.
- **Help system at `ayuda/ejemplos/1.3`**: deferred to a future help-system SDD.
- **GVA CDN upload**: we publish to jsdelivr only; GVA CDN is a separate workflow.
- **The 1.3.20 `else`-branch local-fallback regex `^(.*?)(\/1\.[0-3]\/)`**: replaced by 1.3.21's `resolveLocal` (which only matches the literal `idevapi/js/idevAPI_core` shape). Non-standard local folder names like `idevapi-1.3.20` must rename to `idevapi` or adjust the visor.
- **Editing `loadScript`/`loadCSS` paths or other parts of the source structure** beyond the resolver block insertion. The source stays true to its version; the tree matches the source.

## Risks

1. **R1 — jsdelivr cache window**: even with new tag names, jsdelivr PoPs may serve stale content for a brief window after publish. Mitigated by 24h smoke test asserting `detectLoadFamily` in the served `-min.js` body.
2. **R3 — `*-min.js` drift**: if `npm run build` is skipped or stale, the minified output will not reflect the inserted resolver. Mitigated by 4-grep drift check (presence of the 4 function names) + the work-unit invariant (source + minified in one commit).
3. **R-NUEVO — 1.3.20 local-fallback regression**: non-standard local install paths (`idevapi-1.3.20`) no longer auto-resolve. User-confirmed Decision A: accept the regression in exchange for resolver simplicity. Documented in 1.3.20-r2 release notes.
4. **R-NUEVO-A — tree mismatch if cp step misses files**: mitigated by `Compare-Object` tree verification before source edit.

(R2 — consumers pinned to old tags break — DOWNGRADED to Low after user confirmed 2026-06-25 that there are no consumers on the old tags. Old tags can be deleted without notice.)

## Open questions

None blocking as of user-confirmed decisions 2026-06-25.

## Acceptance criteria

- The remote has exactly three tags: `1.3.19-r2` (annotated, points to commit `fc5a92b`), `1.3.20-r2` (annotated, points to commit `529cf8f`), `1.3.21` (unchanged, points to `881a4a0`).
- The four broken remote tags (`1.3.19`, `1.3.19-fix`, `1.3.20`, `1.3.20-fix`) are DELETED.
- `js/idevAPI_core.js` in `1.3.19-r2` and `1.3.20-r2` contains the resolver block (4 functions + 3 vars, in declared order).
- `js/idevAPI_core-min.js` is rebuilt and contains the 4 function names.
- The 9 smoke tests (per design §3) PASS within 24h of tag publish.
- The 3 GitHub Releases (`1.3.19-r2`, `1.3.20-r2`, `1.3.21` retroactiva) exist with notes in neutral Spanish.
