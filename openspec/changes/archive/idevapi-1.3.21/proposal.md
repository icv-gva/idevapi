# Proposal: idevapi-1.3.21 — 3-layer Load Contract (Local / GVA / jsdelivr)

## Context

`idevAPI_core.js` (9-50) does not understand jsdelivr or local paths. Six hardcoded GVA checks plus `/^(.*?)(\/1\.[0-3]\/)/` miss `cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.21/...` (no `/1.[0-3]/`) and `../../idevapi/js/idevAPI_core.js` (no version segment). Both fall through to `//geoidevapi.gva.es/1.3` — visors "work" by accident, modules always come from GVA PRO, the 3-layer contract is broken. Local visors mask this with a Windows junction `D:\antigravity\idevapi\1.3` faking `/1.3/`.

## Why now

No external consumer depends on 1.3.19/1.3.20 jsdelivr URLs yet. Cheapest window to fix resolver, drop junction, migrate visors, decide whether prior tags need backport or destructive retag.

## Scope

**In**: rewrite URL resolver in `idevAPI_core.js` (9-50) with explicit branches for jsdelivr / GVA / local, each with its own fallback. Migrate 29 visors under parent `_visores_tester/` from `../../1.3/` → `../../idevapi/` (4 already migrated; ALL 33 visors get the canonical 5-branch selector with `console.warn`). **Note**: the 27 HTML examples under `D:\antigravity\idevapi\ayuda\ejemplos\1.3` are out of scope for 1.3.21 — they use a different selector pattern (local / FTP / DSA / PRE / PRO, no jsdelivr, fixed script tag in help code display) and will be addressed in a future help-system SDD. Delete junction. Bump `package.json` → `1.3.21` and `IDEVAPIVersion` → `"1.3.21"`. `npm run build` → **18** `*-min.*` artifacts (per `build.js`; the 18th is `idevAPI_config-min.js` kept for future reactivation, not dropped). Tag `1.3.21`, push to `origin main`. **Conditional** (user-gated in apply): backport resolver fix to 1.3.19/1.3.20 and force-push those tags.

**Out**: jsdelivr branch in visors. Build-time config, test runner, npm publish. Any public API change. Migration of `ayuda/ejemplos/1.3` (deferred to future help SDD; see `idevapi/help-system-future-sdd` memory).

## Decisions

1. **Resolver: explicit branches (Option B).** Three top-level families:
   - **jsdelivr**: regex `(https?:)?(\/\/cdn\.jsdelivr\.net\/gh\/[^/]+@[^/]+)` extracts base; **`URLVersion = ""`** (tag is the version). Tag-agnostic — matches `@1.3.19`, `@1.3.20`, `@1.3.21`, `@1.3` (minor), `@1` (major), `@latest` — no special-casing per tag. Verifies in spec that all 5 forms resolve to the correct base URL.
   - **GVA**: 6 explicit hostname branches (DSA, PRE, PRO, /desa, /pre, /api). `URLVersion = "/1.3"`.
   - **Local** (pattern β — conservative, only `idevapi` literal): regex `^(.*\/)idevapi\/js\/idevAPI_core` extracts base; `URLVersion = ""`. Legacy `../../1.X/` paths fall through to GVA PRO (matches today's behaviour; the 29 visors that use `1.3/` are migrated in this same change so this is not a regression). Safe-degradation fallback when no match: `urlAPI = "../../idevapi"`, `URLVersion = ""`.
2. **Visor selector: 4 GVA + local.** `localhost`/`127.0.0.1`/`file://` → local; `*-dsa.gva.es` → DSA; `*-pre.gva.es` → PRE; other `*.gva.es` → PRO; non-GVA non-local → `console.warn` (Spanish, es-only) + PRO. No jsdelivr branch in visors.
3. **`console.warn` copy (Spanish, es-only):** `IDEVAPI: hostname '<host>' no es GVA ni local ni jsdelivr; fallback a PRO. Si necesitás DSA/PRE, cargá el visor desde el subdominio correcto.`
4. **Migration: `../../idevapi/`**. Junction deleted.
5. **Backport strategy (1.3.19/1.3.20, if needed): resolver-only.** The 1.3.19 / 1.3.20 tags keep their original `IDEVAPIVersion` constant (`"1.3.19"` and `"1.3.20"` respectively). The `IDEVAPIVersion` is used **only as cache buster** (`?v=` query string); it must always match the tag. Backport commits touch ONLY the resolver block, never the version string. Retag is **DESTRUCTIVE** (force-push) and NOT auto-approved — apply phase must request explicit user confirmation per tag.
6. **Floating jsdelivr tags (`@1.3`, `@1`): no git tag required.** jsdelivr resolves these virtually on every request, so consumers can already use `cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3/...` and `...@1/...` against the current 1.3.19 / 1.3.20 tags. The resolver is tag-agnostic (decision 1), so no special handling needed. **Smoke test must exercise these 5 forms** (1.3.19, 1.3.20, 1.3.21, 1.3, 1) to confirm none breaks module loading.

## Approach

Replace lines 9-50 with `detectLoadFamily(srcCore)` returning `{ urlAPI, URLVersion }` plus three helpers (`resolveJsdelivr`, `resolveGVA`, `resolveLocal`). Order: jsdelivr → GVA → local → GVA PRO fallback. Visor HTML edits are 1:1 textual replacement, ~5 lines per file.

## Affected Areas

| Area | Impact |
|------|--------|
| `js/idevAPI_core.js` | Modified — resolver rewrite (9-50); `IDEVAPIVersion` → `1.3.21` (75) |
| `package.json` | Modified — `version` → `1.3.21` |
| `js/*-min.js`, `css/*-min.css` | Rebuilt — all **18** via `npm run build` (per `build.js`; includes `idevAPI_config-min.js`) |
| GitHub tag `1.3.21` | New — pushed; jsdelivr cache ~24h |
| Floating tags `@1.3` / `@1` | No action — jsdelivr resolves virtually; smoke test exercises them |
| Parent `_visores_tester/**.html` | Modified — 29 migrated + 4 already; selector updated in all 33 |
| `ayuda/ejemplos/1.3/**.html` (27 files) | **Out of scope** for 1.3.21 — different selector pattern; deferred to future help SDD |
| `D:\antigravity\idevapi\1.3` | Removed — Windows junction |
| Tags `1.3.19`, `1.3.20` | **Conditional** — force-push only if backport required (user-gated) |

## Risks

| Risk | Mitigation |
|------|------------|
| Forgetting to rebuild a minified artifact → stale 1.3.20 on jsdelivr | `tasks.md` diffs all 17 `*-min.*` after build |
| Destructive force-push breaks unknown early consumer | User confirmation gate in apply; jsdelivr cache is safety net |
| Parent workspace OUTSIDE git — filesystem edits, not PR workflow | `tasks.md` calls this out; never `git add` those paths |
| Local regex over-matches a third-party path containing `idevapi` | Fallback `../../idevapi` is the documented safe-degradation path |
| `IDEVAPIVersion` mismatch (source bumped, minified not rebuilt) | `npm run build` is the gating step before any tag |

## Rollback

- **Library**: `git revert` resolver commit, retag `1.3.21-rollback`. jsdelivr serves reverted content within cache window.
- **Visors**: revert HTML edits; recreate junction — `New-Item -ItemType Junction -Path "D:\antigravity\idevapi\1.3" -Target "D:\antigravity\idevapi\idevapi"`.
- **Retag of prior versions**: NOT reversible. Out of scope for rollback.

## Dependencies

`npm run build` (esbuild ^0.27.4) succeeds before tagging. Push access to `origin` of `icv-gva/idevapi`. Filesystem write access to `D:\antigravity\idevapi\` (parent of repo) for junction delete and parent-workspace edits.

## Success Criteria

- [ ] Resolver handles jsdelivr URL `cdn.jsdelivr.net/gh/icv-gva/idevapi@<tag>/js/idevAPI_core-min.js` for `<tag>` ∈ `{1.3.19, 1.3.20, 1.3.21, 1.3, 1, latest}` → base URL `//cdn.jsdelivr.net/gh/icv-gva/idevapi@<tag>`, `URLVersion = ""`. No GVA fallback.
- [ ] Resolver handles `../../idevapi/js/idevAPI_core.js` → base `../../idevapi`, `URLVersion = ""`. No GVA fallback.
- [ ] Resolver handles 6 GVA sub-environments (DSA, PRE, PRO, /desa, /pre, /api) → respective base + `URLVersion = "/1.3"`.
- [ ] All 33 visors in `_visores_tester/` load from `../../idevapi/` and pass smoke test (clean console + Leaflet container in DOM after `DOMContentLoaded`).
- [ ] `ayuda/ejemplos/1.3` is **not** modified by 1.3.21 (deferred to future help SDD per memory `idevapi/help-system-future-sdd`).
- [ ] `npm run build` produces 18 `*-min.*` artifacts, all `1.3.21`-tagged.
- [ ] Junction `D:\antigravity\idevapi\1.3` does not exist.
- [ ] Tag `1.3.21` reachable via jsdelivr within 24h.
- [ ] Smoke test exercises all 5 jsdelivr forms (`@1.3.19`, `@1.3.20`, `@1.3.21`, `@1.3`, `@1`) — no module-load failure in any.

## Resolved Decisions (Q1–Q5 closed in interactive session)

| # | Question | Decision |
|---|----------|----------|
| Q1 | `URLVersion` for jsdelivr | **`""`** (tag-versioned; no path duplication) |
| Q1b | Channel tags `@1.3` / `@1` | No git action — jsdelivr resolves virtually; resolver is tag-agnostic |
| Q2 | `console.warn` copy | Spanish only; copy in §Decisions item 3 |
| Q3 | Backport strategy | Resolver-only; `IDEVAPIVersion` stays as `"1.3.19"` / `"1.3.20"` per tag |
| Q4 | Smoke test | `tasks.md` defines: clean console + Leaflet container in DOM after `DOMContentLoaded` |
| Q5 | Local regex | **Pattern β** — only `idevapi` literal; legacy `1.X/` paths fall to GVA PRO |
