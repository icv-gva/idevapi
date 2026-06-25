# Design: idevapi-1.3.21

## Overview

This design covers the 3-layer load contract fix for `idevAPI_core.js`: a resolver
rewrite that derives `urlAPI` + `URLVersion` from the script `src` via three explicit
families (jsdelivr → GVA → local → safe-degradation fallback), a visor-selector
migration across 33 HTML visors outside the git repo, and the release pipeline
(version bump, esbuild rebuild, tag, conditional backport).

The resolver becomes a single `detectLoadFamily(srcCore)` entry point backed by three
pure helpers, replacing the current 6-way `if/else` + parallel `URLVersion` switch
(lines 18–50) that silently falls through to GVA PRO for jsdelivr and local paths.
Visors get a canonical 5-branch selector block (local / DSA / PRE / PRO / unknown+warn)
with the local path moved from `../../1.3/` to `../../idevapi/`, allowing the Windows
junction to be deleted. Release coordinates `package.json` + `IDEVAPIVersion` + 18
esbuild artifacts + git tag `1.3.21`.

## Architecture

### Resolver structure

**Decision (Q1): single `detectLoadFamily(srcCore)` entry point with three pure
helpers** (`resolveJsdelivr`, `resolveGVA`, `resolveLocal`).

Rationale: each helper returns `{ urlAPI, URLVersion }` or `null`, so the entry point
is a short ordered chain that is trivial to reason about and matches the proposal's
"Approach" section. A monolithic `if/else` chain would inline six GVA checks +
two regexes + the fallback in one block, making the family boundaries invisible and
the regression guards (REQ-URL-6/7) harder to pin. Helpers are pure (input string →
output object), which is the closest this no-test-runner project gets to testability.

The `srcCore`-finding block (current lines 9–16) stays unchanged. Lines 18–50 (the
`urlAPI` chain + the parallel `URLVersion` switch) are replaced by the four function
declarations plus a 3-line call. Line 53 (`urlAPI += URLVersion`) stays — for
jsdelivr/local `URLVersion` is `""` (no-op), for GVA it is `"/1.3"` (appends the
version segment, preserving today's concatenation behaviour).

```js
// ---- Entry point: jsdelivr -> GVA -> local -> safe-degradation fallback ----
function detectLoadFamily(srcCore) {
    var family;
    family = resolveJsdelivr(srcCore); if (family) return family;
    family = resolveGVA(srcCore);      if (family) return family;
    family = resolveLocal(srcCore);    if (family) return family;
    return { urlAPI: "../../idevapi", URLVersion: "" };   // REQ-URL-4
}

// jsdelivr: tag-agnostic. Matches @1.3.19, @1.3.20, @1.3.21, @1.3, @1, @latest.
function resolveJsdelivr(srcCore) {
    var m = srcCore.match(/(https?:)?(\/\/cdn\.jsdelivr\.net\/gh\/[^/]+\/[^/]+@[^/]+)/);
    if (m) return { urlAPI: m[2], URLVersion: "" };        // m[2] is already protocol-relative
    return null;
}

// GVA: 6 sub-environments, grouped legacy-path-first then modern-hostname-first.
function resolveGVA(srcCore) {
    if (srcCore.indexOf("idevapi.gva.es/desa/") !== -1)  return { urlAPI: "//idevapi.gva.es/desa",  URLVersion: "/1.3" };
    if (srcCore.indexOf("idevapi.gva.es/pre/")  !== -1)  return { urlAPI: "//idevapi.gva.es/pre",   URLVersion: "/1.3" };
    if (srcCore.indexOf("idevapi.gva.es/api/")  !== -1)  return { urlAPI: "//idevapi.gva.es/api",   URLVersion: "/1.3" };
    if (srcCore.indexOf("geoidevapi-dsa.gva.es") !== -1) return { urlAPI: "//geoidevapi-dsa.gva.es", URLVersion: "/1.3" };
    if (srcCore.indexOf("geoidevapi-pre.gva.es") !== -1) return { urlAPI: "//geoidevapi-pre.gva.es", URLVersion: "/1.3" };
    if (srcCore.indexOf("geoidevapi.gva.es")    !== -1)  return { urlAPI: "//geoidevapi.gva.es",    URLVersion: "/1.3" };
    return null;
}

// Local (pattern beta): conservative — only the literal "idevapi/js/idevAPI_core" shape.
function resolveLocal(srcCore) {
    var m = srcCore.match(/^(.*\/)idevapi\/js\/idevAPI_core/);
    if (m) return { urlAPI: "../../idevapi", URLVersion: "" };
    return null;
}
```

Integration (replaces lines 18–50; line 53 unchanged):

```js
var family = detectLoadFamily(srcCore);
var urlAPI = family.urlAPI;
var URLVersion = family.URLVersion;
```

> Note: `var` + function declarations are hoisted in ES5, so definition order relative
> to the call is not load-bearing. The apply phase may place helpers above or below the
> call for readability. The minification target is `es2015` (per `build.js`), so no
> arrow functions / `const` / `let` are used in source to stay safe across the toolchain.

### Branch evaluation order

**Decision (Q2): grouped by path-prefix** — the three legacy path-based branches
(`/desa/`, `/pre/`, `/api/`) are evaluated first, then the three modern hostname-based
branches (`-dsa`, `-pre`, bare PRO), then the safe-degradation fallback.

Literal evaluation order inside `resolveGVA`:

| # | Check | `urlAPI` | Env (per memory #655) |
|---|-------|----------|------------------------|
| 1 | `idevapi.gva.es/desa/` | `//idevapi.gva.es/desa` | DESA (legacy CDN) |
| 2 | `idevapi.gva.es/pre/` | `//idevapi.gva.es/pre` | PRE (legacy CDN) |
| 3 | `idevapi.gva.es/api/` | `//idevapi.gva.es/api` | FTP (legacy pre-DESA) |
| 4 | `geoidevapi-dsa.gva.es` | `//geoidevapi-dsa.gva.es` | DESA (modern CDN) |
| 5 | `geoidevapi-pre.gva.es` | `//geoidevapi-pre.gva.es` | PRE (modern CDN) |
| 6 | `geoidevapi.gva.es` | `//geoidevapi.gva.es` | PRO (production) |

Rationale: the six branches are **disjoint** — the path-based checks key on
`idevapi.gva.es/<path>/` while the hostname-based checks key on `geoidevapi-*.gva.es`,
so no reordering can cause a misclassification. Both the interleaved order (current
code: `/desa/` → `-dsa` → `/pre/` → `-pre` → `/api/` → bare) and the grouped order are
correct. Grouped is chosen because it makes the **legacy-vs-modern** split visible at a
glance and keeps the three FTP/legacy branches together for the maintainer. This
satisfies REQ-URL-5 ("more specific paths before bare hostnames"): all three path
checks (1–3) precede the bare-hostname PRO check (6). The `/api` FTP branch is retained
for legacy FTP-based pre-DESA consumers (memory `idevapi/gva-resolver-context`).

### File impact list

| File | Lines | Change type | Requirements satisfied |
|------|-------|-------------|------------------------|
| `js/idevAPI_core.js` | 18–50 | Rewrite (resolver block → 4 functions + 3-line call) | REQ-URL-1..9 |
| `js/idevAPI_core.js` | 75 | Edit (`IDEVAPIVersion` `"1.3.20"` → `"1.3.21"`) | REQ-URL-9, REQ-REL-2 |
| `package.json` | 3 | Edit (`version` → `"1.3.21"`) | REQ-REL-1 |
| `build.js` | — | **No change** (entry list unchanged; no esbuild entry changes this release) | — |
| 18 `*-min.*` artifacts (see Build) | all | Rebuilt by `npm run build` | REQ-REL-3 |
| `_visores_tester/**/*.html` (33) | selector `<script>` block | Block replacement | REQ-VIS-1..9 |
| `ayuda/**/*.html` (N) | selector `<script>` block | Block replacement | REQ-VIS-8 |
| `D:\antigravity\idevapi\1.3` | — | Delete (Windows junction) | REQ-REL-5 |

> Per `openspec/config.yaml` design rule: `idevAPI_core.js` change is documented with the
> sequence diagram below and this full file impact list. `build.js` has no entry changes
> this release (documented alongside source per config rule — confirmed: entries array
> is untouched).

### Sequence diagram

Load flow for a jsdelivr-loaded visor (external consumer puts the script tag directly):

```
  Browser            idevAPI_core-min.js        detectLoadFamily          CDN
    |                       |                         |                    |
    |  GET visor.html       |                         |                    |
    |---------------------->|                         |                    |
    |  parse <script> tags  |                         |                    |
    |  srcCore = "...@1.3.21/js/idevAPI_core-min.js"  |                    |
    |  detectLoadFamily(srcCore)                       |                    |
    |----------------------|------------------------->|                    |
    |                       |  resolveJsdelivr:       |                    |
    |                       |  match @1.3.21          |                    |
    |                       |  -> {urlAPI:"//cdn…@1.3.21", v:""}          |
    |                       |  return family          |                    |
    |<----------------------|-------------------------|                    |
    |  urlAPI="//cdn…@1.3.21", URLVersion=""          |                    |
    |  urlAPI += ""  (no-op)                          |                    |
    |                       |                         |                    |
    |  document.write css link  (urlAPI + /css/…-min.css?v=1.3.21)        |
    |----------------------|---------------------------------------------->|
    |  load jQuery, Leaflet, widgets  (urlAPI + /…?v=1.3.21)              |
    |-------------------------------------------------------------------->|
    |  DOMContentLoaded -> initMap()                                     |
    |  #map -> .leaflet-container present  (smoke-test assertion)        |
    |  IDEVAPI ready                                                     |
```

For a GVA-loaded visor the flow is identical except `resolveGVA` returns
`{urlAPI:"//geoidevapi.gva.es", v:"/1.3"}` and `urlAPI += "/1.3"` appends the segment.
For a local visor `resolveLocal` returns `{urlAPI:"../../idevapi", v:""}`.

## Visor migration strategy

### Selector template

Canonical 5-branch selector block (replaces the existing selector `<script>` block in
all 33 visors under `_visores_tester/` and all visors under `ayuda/`):

```html
<script>
    var currentDomain = window.location.hostname;
    var scriptSrc;
    if (currentDomain === "localhost" || currentDomain === "127.0.0.1" || currentDomain === "") {
        scriptSrc = "../../idevapi/js/idevAPI_core.js";
    } else if (currentDomain.indexOf("-dsa.gva.es") !== -1) {
        scriptSrc = "https://geoidevapi-dsa.gva.es/1.3/js/idevAPI_core-min.js";
    } else if (currentDomain.indexOf("-pre.gva.es") !== -1) {
        scriptSrc = "https://geoidevapi-pre.gva.es/1.3/js/idevAPI_core-min.js";
    } else if (currentDomain.indexOf(".gva.es") !== -1) {
        scriptSrc = "https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js";
    } else {
        console.warn("IDEVAPI: hostname '" + currentDomain + "' no es GVA ni local ni jsdelivr; fallback a PRO. Si necesitás DSA/PRE, cargá el visor desde el subdominio correcto.");
        scriptSrc = "https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js";
    }
    document.write('<script src="' + scriptSrc + '"><\/script>');
</script>
```

> The proposal phrases this as "4 GVA + local" = 5 total branches. The two branches
> that differ from the current 4-branch visors are: (a) an explicit `.gva.es` → PRO
> branch, and (b) an `else` branch that emits the Spanish `console.warn` (REQ-VIS-6)
> before falling back to PRO. The warn copy is es-only per Q2.

### Per-visor diff pattern

Representative visor `geoidev-mapas_electorales/02_partido_gobernante.html` (currently
on `../../1.3/`, 4-branch, no warn):

```diff
     var scriptSrc;
     if (currentDomain === "localhost" || currentDomain === "127.0.0.1" || currentDomain === "") {
-        scriptSrc = "../../1.3/js/idevAPI_core.js";
+        scriptSrc = "../../idevapi/js/idevAPI_core.js";
     } else if (currentDomain.indexOf("-dsa.gva.es") !== -1) {
         scriptSrc = "https://geoidevapi-dsa.gva.es/1.3/js/idevAPI_core-min.js";
     } else if (currentDomain.indexOf("-pre.gva.es") !== -1) {
         scriptSrc = "https://geoidevapi-pre.gva.es/1.3/js/idevAPI_core-min.js";
-    } else {
+    } else if (currentDomain.indexOf(".gva.es") !== -1) {
         scriptSrc = "https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js";
+    } else {
+        console.warn("IDEVAPI: hostname '" + currentDomain + "' no es GVA ni local ni jsdelivr; fallback a PRO. Si necesitás DSA/PRE, cargá el visor desde el subdominio correcto.");
+        scriptSrc = "https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js";
     }
     document.write('<script src="' + scriptSrc + '"><\/script>');
```

That is a ~7-line diff (1 changed + 6 added/changed). For the 4 already-migrated
visors (e.g. `geoidev-gvanext`), the local path line is already `../../idevapi/`, so
only the `.gva.es` + warn branches are added (~5-line diff).

### Migration tool / approach

**Decision: a PowerShell search-and-replace script** run once against the parent
workspace. The visors live outside the git repo at `D:\antigravity\idevapi\_visores_tester\`
and `D:\antigravity\idevapi\ayuda\`, so filesystem edits (never `git add`) are required,
and the user is on Windows.

Approach (the apply phase writes the actual script):

1. Glob `*.html` under both roots recursively.
2. For each file, regex-match the selector block from `var currentDomain` through the
   `document.write('<script src="' + scriptSrc + '"><\/script>');` line.
3. Replace the matched block with the canonical 15-line block above (single
   `Set-Content` per file).
4. Print a report: files changed, files skipped (already canonical), files with no
   selector block found (flag for manual review).
5. Post-check: `Select-String -Pattern '../../1.3/'` over both roots must return zero
   matches (REQ-VIS-7/8).

Rationale: the selector block is near-byte-identical across all 33 visors (same
comments, same variable names, same `document.write` call), so a single regex pattern
reliably captures it. A manual 33-file loop is error-prone; a script is auditable and
re-runnable. The script must NOT touch anything outside the selector block.

## Build & release

### Build pipeline

**Decision (Q3): enumerate the artifacts** so `tasks.md` can diff each one explicitly
rather than relying on a timestamp heuristic.

`npm run build` → `node build.js` (esbuild ^0.27.4, target `es2015`, sourcemaps on).
`build.js` declares **18** entry pairs (all 18 source files exist on disk):

| # | Output artifact |
|---|-----------------|
| 1 | `js/idevAPI_core-min.js` |
| 2 | `js/idevAPI_config-min.js` |
| 3 | `js/idevAPI_general-min.js` |
| 4 | `js/idevAPI_capas_GeoJSON-min.js` |
| 5 | `js/idevAPI_consulta-min.js` |
| 6 | `js/idevAPI_filtro-min.js` |
| 7 | `js/idevAPI_leyenda-min.js` |
| 8 | `js/idevAPI_idioma-min.js` |
| 9 | `js/idevAPI_popup-min.js` |
| 10 | `js/idevAPI_tabla-min.js` |
| 11 | `js/patches/iso8601-parser-min.js` |
| 12 | `js/patches/ajax-adapter-min.js` |
| 13 | `css/idevAPI_estilos-min.css` |
| 14 | `wg/idevAPI_widgets-min.js` |
| 15 | `wg/idevAPI_widgets-min.css` |
| 16 | `wg/idevAPI_zoomXY-min.js` |
| 17 | `lf_194/plugins/leaflet.wms-min.js` |
| 18 | `lf_194/plugins/leaflet.measure/leaflet-measure-min.js` |

> **Discrepancy flagged**: the proposal, spec (REQ-REL-3), and `config.yaml` all say
> "17" artifacts, but `build.js` declares 18 and all 18 sources exist. Three further
> minified files exist on disk (`esri-leaflet-min.js`, `esri-leaflet-vector-min.js`,
> `leaflet-measure-min.css`) but are **vendored** and NOT produced by `build.js`. The
> canonical build count is **18**. See Open Questions — the apply/verify phase should
> correct the "17" references to 18 (or confirm whether one entry is intended to be
> removed).

Post-build verification (per REQ-REL-3 scenarios):
- `js/idevAPI_core-min.js` contains literal `cdn.jsdelivr.net/gh` (jsdelivr branch).
- `js/idevAPI_core-min.js` contains literal `geoidevapi-dsa.gva.es` (GVA branch).
- `js/idevAPI_core-min.js` contains literal `idevapi\/js\/idevAPI_core` (local regex).
- `js/idevAPI_core-min.js` contains literal `1.3.21` (cache-buster value).
- Each of the 18 artifacts has a timestamp newer than its source.

### Tag & push

```powershell
# 1. Version bump + source constant already committed (REQ-REL-1, REQ-REL-2)
git add js/idevAPI_core.js package.json
git commit -m "1.3.21: rewrite URL resolver (3-layer load contract) + bump version"

# 2. Rebuild all minified artifacts (REQ-REL-3) — gating step before any tag
npm run build
git add js/*-min.js js/patches/*-min.js css/*-min.css wg/*-min.js wg/*-min.css lf_194/plugins/*-min.js
git commit -m "1.3.21: rebuild 18 minified artifacts"

# 3. Tag + push (REQ-REL-4)
git tag 1.3.21
git push origin main
git push origin 1.3.21

# 4. Soft check (REQ-REL-6) — within 24h, not gating
Invoke-WebRequest https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.21/js/idevAPI_core-min.js
```

### Backport strategy

**Conditional and user-gated** (REQ-REL-7/8). Only executed if the apply phase
determines a backport is needed AND the user explicitly confirms per tag.

```powershell
# Per prior tag (repeat for 1.3.19 and 1.3.20 independently)
git checkout -b 1.3.19-fix 1.3.19

# Replace ONLY the resolver block (lines 18-50 equivalent in that tag's source).
# DO NOT touch IDEVAPIVersion — it MUST stay "1.3.19" (cache-buster matches tag).
# (Apply phase performs the same resolver-block swap as the 1.3.21 edit.)

npm run build                                  # rebuild minified with resolver fix + "1.3.19"
git add js/idevAPI_core.js js/*-min.js ...
git commit -m "1.3.19: backport resolver fix (3-layer load contract)"

# ---- STOP: request explicit user confirmation for THIS tag (REQ-REL-7) ----
# Only after confirmation:
git tag -f 1.3.19                               # move tag to new commit
git push --force origin 1.3.19                  # DESTRUCTIVE — confirmed only
```

Rules: backport diff is resolver-only; `IDEVAPIVersion` stays at the tag's original
value; the rebuilt `idevAPI_core-min.js` embeds the new resolver but the original
cache-buster string. Force-push is **not reversible** and **not auto-approved**.

## Smoke test plan

### Definition (per REQ-REL-9 / REQ-VIS-7)

**Decision (Q4): abstract single check** — the user confirmed "lo que propones está
bien" for the abstract version. Rationale: the resolver change is about URL
derivation, not map-rendering specifics; the presence of any `.leaflet-container` in
the DOM after `DOMContentLoaded` proves the full module chain (core → CSS → jQuery →
Leaflet → widgets) loaded from the resolved base. Per-form URL coverage (below) is
what catches resolver mis-derivation; the DOM assertion just confirms the chain did
not break.

Per-visor smoke test (representative visor, e.g. `_visores_tester/geoidev-gvanext/`):
1. Open the visor in a browser (local via `file://` or `localhost`).
2. Open DevTools console.
3. Assert: **no errors or warnings emitted by IDEVAPI** (clean console).
4. After `DOMContentLoaded`, assert: **`.leaflet-container` exists in the DOM** (e.g.
   `document.querySelector('.leaflet-container') !== null`).

### Per-form verification (REQ-URL-1 + 5 jsdelivr forms)

Each URL is loaded in a minimal HTML page (`<script src="..."></script>` + an empty
`<div id="map"></div>`). For each form the test asserts: console clean +
`.leaflet-container` present after `DOMContentLoaded`.

| # | jsdelivr form | Expected `urlAPI` | `URLVersion` |
|---|---------------|-------------------|--------------|
| 1 | `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19/js/idevAPI_core-min.js` | `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19` | `""` |
| 2 | `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20/js/idevAPI_core-min.js` | `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20` | `""` |
| 3 | `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.21/js/idevAPI_core-min.js` | `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.21` | `""` |
| 4 | `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3/js/idevAPI_core-min.js` | `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3` | `""` |
| 5 | `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1/js/idevAPI_core-min.js` | `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1` | `""` |

Forms 4 and 5 (`@1.3`, `@1`) are floating tags — jsdelivr resolves them virtually
against existing tags; **no git tag action is required** for them (proposal decision 6).
The smoke test exercises them solely to prove the resolver is tag-agnostic and does
not break module loading for consumers already using the floating forms.

## Rollback

Per the proposal's rollback section, expanded with exact commands:

- **Library**: `git revert <release-commit>`; retag `1.3.21-rollback`; push. jsdelivr
  serves the reverted content within its cache window (~24h).
  ```powershell
  git revert <sha-of-1.3.21-release-commit>
  git tag 1.3.21-rollback
  git push origin main
  git push origin 1.3.21-rollback
  ```
- **Visors**: revert the HTML block replacement (git/filesystem history of the parent
  workspace) and recreate the junction:
  ```powershell
  New-Item -ItemType Junction -Path "D:\antigravity\idevapi\1.3" -Target "D:\antigravity\idevapi\idevapi"
  ```
- **Retag of 1.3.19 / 1.3.20 (if backport was done)**: NOT reversible. Out of scope for
  rollback — a force-pushed prior tag cannot be undone once consumers have cached it.

## Open Questions

- [x] **Build count 17 vs 18** — **RESOLVED**: docs corrected to **18** (proposal §Scope, §Affected Areas, §Success Criteria; spec REQ-REL-3 + scenarios; design already consistent). `idevAPI_config-min.js` stays in the build (comment "Generado aunque core no lo use -min por ahora" suggests it's a future reactivation hook, not a candidate for removal).
- [x] **REQ-VIS-9 vs REQ-VIS-1/6 tension** — **RESOLVED**: full-block-replace in all 33 visors. Spec REQ-VIS-9 rewritten to mandate the canonical 5-branch template in every visor (no exemption for the 4 already-migrated). The apply phase's PowerShell script must apply the same canonical block regardless of current state.
- [ ] **`ayuda/` visor count**: the spec says "N in ayuda/" but the exact count is not pinned. sdd-tasks should glob `D:\antigravity\idevapi\ayuda\**\*.html` and record the number before the migration task.
- [ ] **Backport necessity**: whether 1.3.19/1.3.20 actually need the resolver backport is deferred to the apply phase (evaluate retro-compat, then request per-tag user confirmation per REQ-REL-7). This design documents the procedure but does not decide whether to execute it.
