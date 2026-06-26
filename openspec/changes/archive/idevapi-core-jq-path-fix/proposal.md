# Proposal: idevapi-core-jq-path-fix

| Field | Value |
|-------|-------|
| Change | `idevapi-core-jq-path-fix` |
| Phase | Proposal |
| Date | 2026-06-26 |
| Maintainer | `icv-gva` (`idev@gva.es`) |
| Target version | `1.3.22` |
| Execution mode | Interactive |
| Artifact store | OpenSpec |

## What

Fix a depth-dependency bug in `resolveLocal()` inside `js/idevAPI_core.js` that breaks local loading of jQuery (and all `urlAPI`-based resources) when the consuming page is served from a directory deeper than 2 levels from the workspace root. The fix computes `urlAPI` from the script's own URL using an anchor element's `.pathname`, producing a root-relative path that is depth-independent. Bumps `IDEVAPIVersion` from `1.3.21` to `1.3.22` and tags the release.

## Why

During manual QA of the prior change (`ayuda-ejemplos-core-js`), opening `ayuda/ejemplos/1.3/configuracion-basica.html` via LiveServer produced a blank page. DevTools Network showed jQuery loading from `http://127.0.0.1:5501/ayuda/idevapi/lib/jq_3.7.1/...` — a non-existent path. Root cause: `resolveLocal()` returns a hardcoded `"../../idevapi"` which is correct for visors at `_visores_tester/<visor>/` (2 levels) but wrong for help at `ayuda/ejemplos/1.3/` (3 levels). The fallback in `detectLoadFamily()` (line 24) has the same hardcoded value.

## Scope

### In Scope
- Fix `resolveLocal()` (lines 45–50): compute `urlAPI` from `srcCore` via anchor `.pathname`
- Fix fallback (line 24): change `"../../idevapi"` → `"/idevapi"`
- Bump `IDEVAPIVersion` (line 79): `"1.3.21"` → `"1.3.22"`
- Regenerate `js/idevAPI_core-min.js` + `.map` via `npm run build`
- Tag `1.3.22` and push to `icv-gva/idevapi`

### Out of Scope
- Refactoring the `prot + urlAPI` pattern to use full URLs (future work)
- Fixing the 1.2 frozen snapshot (has its own jQuery loading, works in 1.2 context)
- Help examples (already fixed in prior change `ayuda-ejemplos-core-js`)
- Other `urlAPI` consumers (widgets, filters, etc. — auto-benefit from the global fix)

## Capabilities

### New Capabilities
None

### Modified Capabilities
None (no `openspec/specs/` directory exists; this is a bugfix in an existing resolver function, not a spec-level behavior change)

## Approach

**Approach A from exploration (recommended)**: Replace `resolveLocal` to extract the pathname from `srcCore` using `document.createElement('a')` and strip `/js/idevAPI_core.*`. Produces a root-relative path (e.g., `/idevapi`) that works at any depth.

The existing `var base = ${prot}${urlAPI}` pattern produces `"http:/idevapi"`, which browsers normalize to `http://<origin>/idevapi` per RFC 3986. This is depth-independent and works for visors (2 levels), help (3 levels), and any future consumer.

## Decisions

| ID | Decision | Status | Rationale |
|----|----------|--------|-----------|
| D1 | Version `1.3.22` (not `1.3.21-fix`) | Resolved (user) | Ayuda CDN uses `@1.3`; jsdelivr alias requires semver-compliant tags |
| D2 | Build regeneration via `npm run build` | Resolved (auto) | `build.js` runs esbuild on source; minified output is never hand-edited |
| D3 | Single PR (not chained) | Resolved (auto) | ~8 lines, 1 file — well under 400-line threshold |
| D4 | 2 commits: `fix(core): ...` + `release: 1.3.22` | Resolved (auto) | Matches prior release pattern (e.g., `release: 1.3.21`) |

## Delivery

1. Edit `js/idevAPI_core.js` (3 hunks: `resolveLocal`, fallback, version)
2. Run `npm run build` → regenerates `idevAPI_core-min.js` + `.map`
3. Manual QA: open `ayuda/ejemplos/1.3/configuracion-basica.html` via LiveServer, verify jQuery 200 + map renders
4. `git add` changed files → commit `fix(core): compute urlAPI from script path instead of hardcoded relative`
5. Commit `release: 1.3.22`
6. `git tag 1.3.22` → `git push origin main --tags`
7. jsdelivr auto-updates `@1.3` alias within minutes

## Risks

| ID | Risk | Likelihood | Mitigation |
|----|------|------------|------------|
| R1 | CDN consumers broken | None | `resolveJsdelivr` and `resolveGVA` are untouched; fix only affects local path |
| R2 | Build non-deterministic | Low | esbuild is deterministic; only `idevAPI_core-min.js` content changes |
| R3 | Anchor `.pathname` unsupported | None | Available since IE6; esbuild target is `es2015` |
| R4 | Fallback `/idevapi` wrong for unusual paths | Low | `resolveLocal` matches any path containing `/idevapi/js/idevAPI_core` before fallback is reached |

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `js/idevAPI_core.js` L45–50 | Modified | `resolveLocal()`: anchor `.pathname` replaces hardcoded `"../../idevapi"` |
| `js/idevAPI_core.js` L24 | Modified | Fallback: `"../../idevapi"` → `"/idevapi"` |
| `js/idevAPI_core.js` L79 | Modified | `IDEVAPIVersion`: `"1.3.21"` → `"1.3.22"` |
| `js/idevAPI_core-min.js` | Regenerated | esbuild output from source (not hand-edited) |
| `js/idevAPI_core-min.js.map` | Regenerated | Source map from esbuild |

## Success Criteria

- [ ] `ayuda/ejemplos/1.3/configuracion-basica.html` loads via LiveServer without blank page
- [ ] DevTools Network: jQuery loads HTTP 200 from `http://127.0.0.1:5501/idevapi/lib/jq_3.7.1/jquery-3.7.1-min.js`
- [ ] Map renders with WMS layers visible
- [ ] Visors at `_visores_tester/<visor>/` still load correctly (regression check)
- [ ] `IDEVAPIVersion` reads `"1.3.22"` in DevTools console
- [ ] Tag `1.3.22` exists on GitHub; jsdelivr `@1.3` resolves to `1.3.22`

## Rollback Plan

Revert the fix commit + release commit, delete tag `1.3.22`, push. The prior `1.3.21` tag remains untouched. CDN consumers on `@1.3` will fall back to `1.3.21` automatically.

## Dependencies

- None (self-contained library fix)

## Next Steps

This is a mechanical bugfix with a single clear approach. Recommend skipping `sdd-spec` (no spec-level behavior change) and going directly to `sdd-tasks` → `sdd-apply`.
