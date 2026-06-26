# Spec: 1.3.19-r2-resolver

## Purpose

The 1.3.19-r2 release ships a 1.3.19 source base with the 1.3.21 URL resolver backported. The resolver detects the load environment (jsdelivr / GVA CDN / local / safe-degradation fallback) from the URL of the `idevAPI_core.js` script itself, and produces the base URL for the rest of the IDEVAPI library. This spec defines the requirements for that release.

## Requirements

### REQ-19R2-1 — Resolver block byte-identity

The resolver block in `js/idevAPI_core.js` at the new `1.3.19-r2` commit MUST be byte-identical to the resolver block in `js/idevAPI_core.js` at commit `e1e5451` of the current repository, lines 18-54 (entry-point comment through `var URLVersion = family.URLVersion;`).

- **Indentation**: TAB (`\t`), matching the 1.3.21 source.
- **4 functions in declared order**: `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, `resolveLocal`.
- **3 vars in declared order**: `family`, `urlAPI`, `URLVersion`.
- **The 6 GVA sub-environments** (desa, pre, api legacy FTP + dsa, pre, pro modern hostnames) MUST be present in `resolveGVA` in the same order.

> **STATUS**: 1 functional deviation (DEFERRED, cosmetic only). The 1.3.19-r2 commit (`fc5a92b`) is missing the line-18 comment `// ---- Entry point: jsdelivr -> GVA -> local -> safe-degradation fallback ----`. The block is functionally identical (4/4 function-name greps pass, smoke test 9/9 pass, manual visor test passes). The deviation was a copy-paste slip from the Batch 1 apply sub-agent. To fix, open a follow-up change that amends `fc5a92b` to add the comment line. Recommended priority: LOW.

### REQ-19R2-2 — Resolver insertion position

The resolver block MUST be inserted **immediately before** the existing `// ********** URL DEFINITIVA *********************` comment that ends the old URLDomain section, so that the existing `urlAPI += URLVersion;` line (which depends on the `urlAPI` and `URLVersion` variables defined by the resolver) consumes the resolver's output unchanged.

### REQ-19R2-3 — No `patches/` references in source

The 1.3.19-r2 source MUST NOT reference `js/patches/iso8601-parser.js` or `js/patches/ajax-adapter.js`. The 1.3.19 base has no `patches/` folder and the resolver is intended to work with the top-level structure.

### REQ-19R2-4 — Build exits 0 and drift check passes

`npm run build` MUST exit 0 on the 1.3.19-r2 commit tree. The rebuilt `js/idevAPI_core-min.js` MUST contain the function names `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, `resolveLocal` (each at least once). A 4-grep drift check on the minified MUST pass.

### REQ-19R2-5 — Work-unit invariant

`js/idevAPI_core.js` AND `js/idevAPI_core-min.js` (+ `.map`) MUST be modified in the SAME commit. Source and minified reflect each other in one work unit, per the `work-unit-commits` skill.

### REQ-19R2-6 — Annotated tag

The new tag `1.3.19-r2` MUST be an annotated tag (`git tag -a 1.3.19-r2 <sha> -m "..."`). `git cat-file -t 1.3.19-r2` MUST return `tag` (not `commit`). `git tag -v 1.3.19-r2` MUST succeed.

### REQ-19R2-7 — jsdelivr smoke test

Within 24h of pushing the `1.3.19-r2` tag, a smoke test MUST be performed against the jsdelivr URLs:
- `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19-r2/js/idevAPI_core-min.js` MUST return HTTP 200 with body containing `detectLoadFamily`.
- `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19-r2/jq_3.7.1/jquery-3.7.1-min.js` MUST return HTTP 200 (proves top-level path).
- `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19-r2/lib/` MUST return HTTP 404 (proves NO `lib/` in 1.3.19-r2).

## Scenarios

### Scenario: jsdelivr load with @1.3.19-r2

**Given** a visor HTML page that includes `<script src="https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19-r2/js/idevAPI_core.js"></script>`,
**When** the page loads,
**Then** the `detectLoadFamily` function identifies the jsdelivr environment, resolves `urlAPI` to `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19-r2`, and the rest of the library loads successfully.

### Scenario: local load with `idevapi/js/idevAPI_core` path

**Given** a local visor at `http://localhost/visor.html` that includes `<script src="idevapi/js/idevAPI_core.js"></script>`,
**When** the page loads,
**Then** `resolveLocal` matches the literal `idevapi/js/idevAPI_core` shape, `urlAPI` resolves to `../../idevapi`, and the library loads.

### Scenario: local load with non-standard folder name (regression accepted)

**Given** a local visor that includes `<script src="idevapi-1.3.20/js/idevAPI_core.js"></script>` (folder name has a hyphen and version suffix),
**When** the page loads,
**Then** `resolveLocal` does NOT match (it requires the literal `idevapi/js/idevAPI_core` shape), the safe-degradation fallback `../../idevapi` is returned, and the library fails to load. **This is a known regression** of Decision A: the user must rename the folder to `idevapi` or adjust the visor.

### Scenario: GVA CDN PRO load

**Given** a visor hosted at `geoidevapi.gva.es/visor.html` that includes `<script src="https://geoidevapi.gva.es/1.3/js/idevAPI_core.js"></script>`,
**When** the page loads,
**Then** `resolveGVA` matches the `geoidevapi.gva.es` hostname, `urlAPI` resolves to `//geoidevapi.gva.es/1.3`, and the library loads.

### Scenario: GVA DESA load

**Given** a visor hosted at `geoidevapi-dsa.gva.es/visor.html`,
**When** the page loads,
**Then** `resolveGVA` matches the `geoidevapi-dsa.gva.es` hostname, `urlAPI` resolves to `//geoidevapi-dsa.gva.es/1.3`, and the library loads.

### Scenario: GVA PRE load

**Given** a visor hosted at `geoidevapi-pre.gva.es/visor.html`,
**When** the page loads,
**Then** `resolveGVA` matches the `geoidevapi-pre.gva.es` hostname, `urlAPI` resolves to `//geoidevapi-pre.gva.es/1.3`, and the library loads.

### Scenario: GVA FTP legacy load

**Given** a visor that includes `<script src="https://idevapi.gva.es/api/1.3/js/idevAPI_core.js"></script>` (FTP legacy),
**When** the page loads,
**Then** `resolveGVA` matches the `idevapi.gva.es/api/` path, `urlAPI` resolves to `//idevapi.gva.es/api/1.3`, and the library loads.

### Scenario: tree verification (1.3.19-r2 has no `lib/`)

**Given** the jsdelivr tag `1.3.19-r2` is published,
**When** requesting `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19-r2/lib/`,
**Then** the response is HTTP 404 (proves the tree is top-level, not 1.3.21's `lib/`-based structure).

### Scenario: drift check on minified

**Given** `npm run build` is run on the 1.3.19-r2 commit tree,
**When** grepping `js/idevAPI_core-min.js` for `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, `resolveLocal`,
**Then** each grep returns ≥1 match (proves the minified reflects the inserted source).

### Scenario: source references no patches

**Given** the 1.3.19-r2 source,
**When** grepping `js/idevAPI_core.js` for `patches/`,
**Then** the grep returns 0 matches (REQ-19R2-3).

### Scenario: manual visor test passes

**Given** the user has loaded `file:///d:/antigravity/idevapi/_visores_tester/_smoke_tests/01_siscova.html` with the 1.3.19-r2 source,
**When** the visor renders and accepts user interaction,
**Then** the backport is functionally correct end-to-end. **STATUS: PASS, confirmed 2026-06-25.**
