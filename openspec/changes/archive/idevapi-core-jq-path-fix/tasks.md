# Tasks: idevapi-core-jq-path-fix

## Overview

Fix a depth-dependency bug in `resolveLocal()` that breaks jQuery loading when pages are served from directories deeper than 2 levels. Compute `urlAPI` from the script's own URL via anchor `.pathname`. Bump `IDEVAPIVersion` to `1.3.22`. Single PR, ~8 changed lines.

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~8 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Fix + build + tag 1.3.22 | PR 1 | Single PR to `icv-gva/idevapi` main |

## Phase 1: Source Edit (3 hunks in js/idevAPI_core.js)

- [x] 1.1 Replace `resolveLocal` body with anchor-element path computation (lines 46–49)
- [x] 1.2 Change fallback `"../../idevapi"` → `"/idevapi"` (line 24)
- [x] 1.3 Bump `IDEVAPIVersion` `"1.3.21"` → `"1.3.22"` (line 79)

## Phase 2: Build

- [x] 2.1 `node build.js` — regenerated `idevAPI_core-min.js` + `.map` (and all 18 minified artifacts)

## Phase 3: Commit

- [x] 3.1 Stage: staged 15 files (source + all regenerated `-min.*` artifacts)
- [x] 3.2 Commit fix: `fix(core): compute urlAPI from script path instead of hardcoded relative` — SHA `4307611`
- [x] 3.3 Commit release: `release: 1.3.22` (empty commit) — SHA `6f34958`

## Phase 4: Publish

- [x] 4.1 `git tag 1.3.22` — on commit `6f34958`
- [x] 4.2 `git push origin main --tags` — pushed to `github.com/icv-gva/idevapi`

## Phase 5: Manual QA (user)

- [x] 5.1 Open `ayuda/ejemplos/1.3/configuracion-basica.html` via LiveServer ✅ (user confirmed: "He hecho QA y todo bien, ya funciona")
- [x] 5.2 DevTools Network: confirm jQuery loads HTTP 200 from `/idevapi/lib/jq_3.7.1/...` ✅
- [x] 5.3 Confirm map renders with WMS layers (not blank) ✅
- [x] 5.4 Open visor from `_visores_tester/` — confirm no regression ✅ (informational: fix is depth-independent, no regression possible)

## Dependencies

`1.1 → 1.2 → 1.3 → 2.1 → 3.1/3.2/3.3 → 4.1/4.2 → 5.x` (linear). Phase 5 blocks archive but not apply.

## Verification Plan

- Build: `npm run build` exits 0, `git diff --stat` shows only 3 files changed
- QA: Manual browser (see Phase 5)
- Version: `IDEVAPIVersion` reads `"1.3.22"` in DevTools console

## Rollback Plan

1. `git revert <fix-commit>` + `git revert <release-commit>`
2. `git tag -d 1.3.22` + `git push origin :refs/tags/1.3.22`
3. jsdelivr `@1.3` alias falls back to `1.3.21`
