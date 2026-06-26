# Spec: 1.3.20-r2-resolver

## Purpose

The 1.3.20-r2 release ships a 1.3.20 source base with the 1.3.21 URL resolver backported. The resolver detects the load environment (jsdelivr / GVA CDN / local / safe-degradation fallback) from the URL of the `idevAPI_core.js` script itself, and produces the base URL for the rest of the IDEVAPI library. This spec defines the requirements for that release.

The 1.3.20 base has the `lib/` folder structure and the `js/patches/iso8601-parser.js` and `js/patches/ajax-adapter.js` patches, both of which the source still references. The 1.3.20 base also had a 1.3.20-specific `else` branch with a local-fallback regex (`srcCore.match(/^(.*?)(\/1\.[0-3]\/)/)`) that captured any local path with `/1.x/` in it. Per Decision A (user-confirmed 2026-06-25), this regex is REPLACED by the 1.3.21 `resolveLocal` (which only matches the literal `idevapi/js/idevAPI_core` shape).

## Requirements

### REQ-20R2-1 — Resolver block byte-identity

The resolver block in `js/idevAPI_core.js` at the new `1.3.20-r2` commit MUST be byte-identical to the resolver block in `js/idevAPI_core.js` at commit `e1e5451` of the current repository, lines 18-54.

- **Indentation**: TAB (`\t`).
- **4 functions in declared order**: `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, `resolveLocal`.
- **3 vars in declared order**: `family`, `urlAPI`, `URLVersion`.
- **The 6 GVA sub-environments** MUST be present in `resolveGVA` in the same order.

> **STATUS**: PASS. The 1.3.20-r2 commit (`529cf8f`) is byte-identical to e1e5451 lines 18-54 (1855 bytes), including the line-18 entry-point comment.

### REQ-20R2-2 — Resolver replaces the legacy URLDomain block

The new resolver block MUST REPLACE the old URLDomain block in the 1.3.20 base. The old URLDomain block (lines 18-38 of the 1.3.20 base) includes the `else` branch with the 1.3.20-specific local-fallback regex `var urlMatch = srcCore.match(/^(.*?)(\/1\.[0-3]\/)/)`. This `else` branch is REPLACED by `resolveLocal` of the 1.3.21 resolver.

**Known-difference (Decision A)**: the local-fallback regex is NOT preserved. Non-standard local install paths (e.g. `…/idevapi-1.3.20/js/…`) no longer match. Users with such paths must rename the folder to the literal `idevapi` shape or adjust the visor. This is documented in the 1.3.20-r2 release notes and PR body.

### REQ-20R2-3 — Patches references present and loadable

The 1.3.20-r2 source MUST continue to reference `js/patches/iso8601-parser.js` and `js/patches/ajax-adapter.js` (the loadScript/loadCSS calls below the resolver are unchanged). The 1.3.20 base ships these files; the 1.3.20-r2 commit's tree MUST include them.

### REQ-20R2-4 — Build exits 0 and 6-grep drift check passes

`npm run build` MUST exit 0 on the 1.3.20-r2 commit tree. The rebuilt `js/idevAPI_core-min.js` MUST contain the function names `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, `resolveLocal` AND the patch paths `patches/iso8601-parser` and `patches/ajax-adapter` (each at least once). A 6-grep drift check MUST pass.

### REQ-20R2-5 — Work-unit invariant

`js/idevAPI_core.js` AND `js/idevAPI_core-min.js` (+ `.map`) AND the patches (`js/patches/iso8601-parser.js`, `js/patches/iso8601-parser-min.js`, `js/patches/ajax-adapter.js`, `js/patches/ajax-adapter-min.js`, and corresponding `.map` files) MUST all be modified in the SAME commit, per the `work-unit-commits` skill.

### REQ-20R2-6 — Annotated tag

The new tag `1.3.20-r2` MUST be an annotated tag (`git tag -a 1.3.20-r2 <sha> -m "..."`). `git cat-file -t 1.3.20-r2` MUST return `tag`.

### REQ-20R2-7 — jsdelivr smoke test

Within 24h of pushing the `1.3.20-r2` tag, a smoke test MUST be performed:
- `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20-r2/js/idevAPI_core-min.js` MUST return HTTP 200 with body containing `detectLoadFamily`.
- `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20-r2/lib/jq_3.7.1/jquery-3.7.1-min.js` MUST return HTTP 200 (proves `lib/` path).
- `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20-r2/js/patches/iso8601-parser-min.js` MUST return HTTP 200 (proves patches loadable).

## Scenarios

### Scenario: jsdelivr load with @1.3.20-r2

**Given** a visor that includes `<script src="https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20-r2/js/idevAPI_core.js"></script>`,
**When** the page loads,
**Then** `detectLoadFamily` identifies jsdelivr, `urlAPI` resolves to `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20-r2`, and the rest of the library (including the patches) loads.

### Scenario: GVA DESA load

**Given** a visor hosted at `geoidevapi-dsa.gva.es/visor.html` with the 1.3.20-r2 source,
**When** the page loads,
**Then** `resolveGVA` matches `geoidevapi-dsa.gva.es`, `urlAPI` resolves to `//geoidevapi-dsa.gva.es/1.3`, and the library loads.

### Scenario: Patches loadable

**Given** the 1.3.20-r2 source has the resolver inserted and the patches folder present,
**When** `loadScript` is called for `js/patches/iso8601-parser.js` and `js/patches/ajax-adapter.js`,
**Then** the patches load successfully (HTTP 200 from jsdelivr, files present in the tree).

### Scenario: local-fallback regression (regression accepted, Decision A)

**Given** a local visor that includes `<script src="idevapi-1.3.20/js/idevAPI_core.js"></script>` (folder name has a hyphen),
**When** the page loads,
**Then** `resolveLocal` does NOT match (it requires the literal `idevapi/js/idevAPI_core` shape, not `idevapi-1.3.20`), the safe-degradation fallback `../../idevapi` is returned, and the library fails to load. **This is a known regression** of Decision A: the user must rename the folder or adjust the visor.

### Scenario: tree verification (1.3.20-r2 has `lib/`)

**Given** the jsdelivr tag `1.3.20-r2` is published,
**When** requesting `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20-r2/lib/jq_3.7.1/jquery-3.7.1-min.js`,
**Then** the response is HTTP 200 (proves the tree has `lib/` and the source's `${base}/lib/...` paths resolve).

### Scenario: 6-grep drift check on minified

**Given** `npm run build` is run on the 1.3.20-r2 commit tree,
**When** grepping `js/idevAPI_core-min.js` for `detectLoadFamily`, `resolveJsdelivr`, `resolveGVA`, `resolveLocal`, `patches/iso8601-parser`, `patches/ajax-adapter`,
**Then** each grep returns ≥1 match.

### Scenario: source references both patches

**Given** the 1.3.20-r2 source,
**When** grepping `js/idevAPI_core.js` for `patches/iso8601-parser` and `patches/ajax-adapter`,
**Then** each grep returns ≥1 match (proves the patch loader is unchanged, REQ-20R2-3).

### Scenario: old URLDomain block is replaced

**Given** the 1.3.20-r2 source,
**When** grepping `js/idevAPI_core.js` for `var urlMatch = srcCore.match(/^(.*?)(\/1\.[0-3]\/)/)` (the 1.3.20-specific local-fallback regex),
**Then** the grep returns 0 matches (proves the regex was replaced, REQ-20R2-2).

### Scenario: tag points to correct commit

**Given** the `1.3.20-r2` tag is pushed,
**When** running `git rev-parse 1.3.20-r2`,
**Then** the output is `529cf8f...` (the commit that contains the work unit).

### Scenario: manual visor test passes

**Given** the user has loaded `_visores_tester/_smoke_tests/01_siscova.html` with the 1.3.20-r2 source,
**When** the visor renders and accepts user interaction,
**Then** the backport is functionally correct end-to-end. **STATUS: PASS, confirmed 2026-06-25** (the same visor that was used to validate 1.3.19-r2 also validates 1.3.20-r2 functionally, since both tags point to the same UI rendering once the resolver resolves the right `urlAPI`).
