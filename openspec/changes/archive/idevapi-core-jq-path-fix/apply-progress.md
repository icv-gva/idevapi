# Apply Progress: idevapi-core-jq-path-fix

| Field | Value |
|-------|-------|
| Change | `idevapi-core-jq-path-fix` |
| Status | **complete** (Phases 1–4 done; Phase 5 pending user QA) |
| Executor | `sdd-apply` sub-agent |
| Date | 2026-06-26 |
| Mode | Standard (no Strict TDD) |

## Phase 1: Source Edits — COMPLETE ✅

### 1.1 — Replace `resolveLocal` body (lines 45–53)
**Before** (hardcoded 2-level-deep path):
```javascript
function resolveLocal(srcCore) {
	var m = srcCore.match(/^(.*\/)idevapi\/js\/idevAPI_core/);
	if (m) return { urlAPI: "../../idevapi", URLVersion: "" };
	return null;
}
```

**After** (anchor-based, depth-independent):
```javascript
// Local (anchor-based): depth-independent path computed from the script's own URL.
function resolveLocal(srcCore) {
	var a = document.createElement('a');
	a.href = srcCore;
	var p = a.pathname;
	var base = p.replace(/\/js\/idevAPI_core.*$/, "");
	if (base !== p) return { urlAPI: base, URLVersion: "" };
	return null;
}
```

✅ Applied. Tabs preserved matching file convention.

### 1.2 — Fix fallback path (line 24)
- **Before**: `return { urlAPI: "../../idevapi", URLVersion: "" };`
- **After**: `return { urlAPI: "/idevapi", URLVersion: "" };`

✅ Applied. Root-relative `/idevapi` — depth-independent fallback.

### 1.3 — Bump `IDEVAPIVersion` (line 82, shifted from 79)
- **Before**: `var IDEVAPIVersion = "1.3.21";`
- **After**: `var IDEVAPIVersion = "1.3.22";`

✅ Applied. Line number shifted +3 due to longer `resolveLocal` body.

---

## Phase 2: Build — COMPLETE ✅

### 2.1 — `node build.js`
- `npm install` was needed first (node_modules missing after fresh clone-like state)
- `node build.js` succeeded — all 18 entries processed
- **Core files with actual content changes**: `js/idevAPI_core-min.js` (4 +/2 −), `js/idevAPI_core-min.js.map` (6 +/3 −)
- **Other 16 minified artifacts**: regenerated with identical JS content; `.map` files show 2-line metadata diffs (esbuild version/timestamp)
- **package-lock.json**: touched by `npm install` — NOT staged/committed (not part of the fix)

| Build entry | Output | Content changed? |
|-------------|--------|-----------------|
| `js/idevAPI_core.js` | `js/idevAPI_core-min.js` + `.map` | **YES** — actual fix |
| `js/idevAPI_config.js` | `js/idevAPI_config-min.js` + `.map` | `.map` metadata only |
| `js/idevAPI_general.js` | `js/idevAPI_general-min.js` + `.map` | `.map` metadata only |
| `js/idevAPI_capas_GeoJSON.js` | `js/idevAPI_capas_GeoJSON-min.js` + `.map` | `.map` metadata only |
| `js/idevAPI_consulta.js` | `js/idevAPI_consulta-min.js` + `.map` | `.map` metadata only |
| `js/idevAPI_filtro.js` | `js/idevAPI_filtro-min.js` + `.map` | `.map` metadata only |
| `js/idevAPI_leyenda.js` | `js/idevAPI_leyenda-min.js` + `.map` | `.map` metadata only |
| `js/idevAPI_idioma.js` | `js/idevAPI_idioma-min.js` + `.map` | `.map` metadata only |
| `js/idevAPI_popup.js` | `js/idevAPI_popup-min.js` + `.map` | `.map` metadata only |
| `js/idevAPI_tabla.js` | `js/idevAPI_tabla-min.js` + `.map` | `.map` metadata only |
| `js/patches/iso8601-parser.js` | `js/patches/iso8601-parser-min.js` + `.map` | `.map` metadata only |
| `js/patches/ajax-adapter.js` | `js/patches/ajax-adapter-min.js` + `.map` | `.map` metadata only |
| `css/idevAPI_estilos.css` | `css/idevAPI_estilos-min.css` + `.map` | `.map` metadata only |
| `wg/idevAPI_widgets.js` | `wg/idevAPI_widgets-min.js` + `.map` | `.map` metadata only |
| `wg/idevAPI_widgets.css` | `wg/idevAPI_widgets-min.css` + `.map` | `.map` metadata only |
| `wg/idevAPI_zoomXY.js` | `wg/idevAPI_zoomXY-min.js` + `.map` | `.map` metadata only |
| `lf_194/plugins/leaflet.wms.js` | `lf_194/plugins/leaflet.wms-min.js` + `.map` | Identical (not in git diff) |
| `lf_194/plugins/leaflet.measure/leaflet-measure.js` | `lf_194/plugins/leaflet.measure/leaflet-measure-min.js` + `.map` | Identical (not in git diff) |

---

## Phase 3: Commits — COMPLETE ✅

### 3.1 — Stage
Staged 15 files (source + all regenerated `-min.*` artifacts):
- `js/idevAPI_core.js` (source fix)
- `js/idevAPI_core-min.js` + `.map` (rebuilt with fix)
- 12 other `.map` files (esbuild metadata regeneration)
- 6 other `.min.js`/`.min.css` files (identical content, CRLF normalization)

### 3.2 — Fix commit
```
SHA: 4307611
Message: fix(core): compute urlAPI from script path instead of hardcoded relative
Files: 15 changed, 25 insertions(+), 22 deletions(-)
```

### 3.3 — Release commit
```
SHA: 6f34958
Message: release: 1.3.22
Files: 0 (empty commit, matches prior release pattern)
```

---

## Phase 4: Publish — COMPLETE ✅

### 4.1 — Tag
```
Tag: 1.3.22
On commit: 6f34958 (release: 1.3.22)
```

### 4.2 — Push
```
Remote: origin → github.com/icv-gva/idevapi
Branch: main (a9efe01 → 6f34958)
Tag: 1.3.22 → * [new tag]
Result: OK
```

**Full git log**:
```
6f34958 (HEAD -> main, tag: 1.3.22, origin/main, origin/HEAD) release: 1.3.22
4307611 fix(core): compute urlAPI from script path instead of hardcoded relative
a9efe01 chore: remove openspec/ and scripts/ from public repo
8710eb0 archive(idevapi-backport-resolver-r2): close the change
881a4a0 (tag: 1.3.21) chore(build): rebuild 18 minified artifacts for 1.3.21 + add visor migration script
```

---

## Phase 5: Manual QA — PENDING (USER) 🔲

These tasks are the user's responsibility:

- [ ] 5.1 Open `ayuda/ejemplos/1.3/configuracion-basica.html` via LiveServer
- [ ] 5.2 DevTools Network: confirm jQuery loads HTTP 200 from `/idevapi/lib/jq_3.7.1/...`
- [ ] 5.3 Confirm map renders with WMS layers (not blank)
- [ ] 5.4 Open visor from `_visores_tester/` — confirm no regression

---

## Deviations from Plan

| # | What | Why |
|---|------|-----|
| 1 | Used `node build.js` directly instead of `npm run build` | `npm run build` delegates to `node build.js` — functionally identical. `node build.js` produces cleaner output for debugging. |
| 2 | Staged all 18 regenerated artifacts (15 files in diff), not just the 3 declared in tasks.md task 3.1 | Following orchestrator gotcha #3: "Stage ALL the regenerated files." The prior release (`1.3.21`) also committed "18 minified artifacts rebuilt." |
| 3 | `npm install` needed before build | `node_modules` was missing in the working copy. This is expected for fresh clones. |

## Issues Found

1. **Local-only git repository**: The working copy at `D:\antigravity\idevapi\idevapi\` has git configured with `origin` → `github.com/icv-gva/idevapi`, but the parent directory (`D:\antigravity\idevapi\`) is NOT a git repo. The `openspec/` directory sits outside the git-tracked area — expected and correct per project convention.
2. **package-lock.json dirty after npm install**: Not staged/committed. The lockfile change is an npm install artifact, not part of the fix. Future builds in a fresh clone will need `npm install` again.
3. **CRLF warnings on all minified files**: Standard Windows `core.autocrlf` behavior. Content is correct; only line ending normalization differs from repo-stored LF.

## Workload / PR Boundary

| Field | Value |
|-------|-------|
| Mode | Single PR (direct push to main) |
| Work unit | 1 (Fix + build + tag 1.3.22) |
| Lines changed | 25 insertions, 22 deletions |
| Review budget | ~8 source lines + 2 minified + build metadata |
| Budget risk | Low |

## Status

**9/13 tasks complete** (Phases 1–4). **4 tasks pending** (Phase 5 — manual QA, user's job).

## Open Issues

| # | Issue | Owner | Resolution |
|---|-------|-------|------------|
| 1 | Manual QA pending | User | Open `ayuda/ejemplos/1.3/configuracion-basica.html`, verify jQuery loads + map renders |
| 2 | jsdelivr cache propagation | Automatic | `@1.3` alias typically resolves to new tag within ~5 minutes after push |
| 3 | Non-core `.map` metadata diffs | Low priority | 12 `.map` files changed 2 lines each (esbuild metadata). Harmless but pollutes future diffs. Consider `.gitattributes` or build isolation in a future change. |
