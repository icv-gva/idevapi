# Spec: visor-selector

## Purpose
Every HTML visor in parent `D:\antigravity\_visores_tester\**` MUST select its `idevAPI_core` script source via a 4-branch GVA selector plus a local branch (5 total), with no jsdelivr branch. The local branch MUST point to `../../idevapi/js/idevAPI_core.js` (not the legacy `../../1.3/` path). The 27 HTML examples under `D:\antigravity\idevapi\ayuda\ejemplos\1.3` are out of scope for 1.3.21 and are deferred to a future help-system SDD.

## Requirements

### REQ-VIS-1: Selector has 5 branches total
The `scriptSrc` selection block MUST have exactly five branches: local, `*-dsa.gva.es`, `*-pre.gva.es`, other `*.gva.es`, and a non-GVA/non-local default. It MUST NOT contain a jsdelivr branch.

#### Scenario: Branch count is exactly 5
- **Given** any migrated visor HTML
- **When** the selector block is read
- **Then** there are exactly 5 branches: localhost/`127.0.0.1`/empty → local; `*.dsa.gva.es` → DSA; `*.pre.gva.es` → PRE; `*.gva.es` → PRO; else → PRO + warn

### REQ-VIS-2: Local branch loads the unminified core from the new path
The local branch MUST set `scriptSrc = "../../idevapi/js/idevAPI_core.js"` when the current domain is `localhost`, `127.0.0.1`, or empty (the empty case covers `file://`).

#### Scenario: Localhost loads local unminified core
- **Given** `location.hostname === "localhost"`
- **When** the selector evaluates
- **Then** `scriptSrc` is `../../idevapi/js/idevAPI_core.js`

#### Scenario: 127.0.0.1 loads local unminified core
- **Given** `location.hostname === "127.0.0.1"`
- **When** the selector evaluates
- **Then** `scriptSrc` is `../../idevapi/js/idevAPI_core.js`

#### Scenario: file:// loads local unminified core
- **Given** the page is opened via `file://` (hostname is empty string)
- **When** the selector evaluates
- **Then** `scriptSrc` is `../../idevapi/js/idevAPI_core.js`

### REQ-VIS-3: DSA branch loads the minified core from DSA CDN
The DSA branch MUST set `scriptSrc = "https://geoidevapi-dsa.gva.es/1.3/js/idevAPI_core-min.js"` when the hostname ends with `dsa.gva.es`.

#### Scenario: `*-dsa.gva.es` loads DSA minified core
- **Given** `location.hostname === "somevisor-dsa.gva.es"`
- **When** the selector evaluates
- **Then** `scriptSrc` is `https://geoidevapi-dsa.gva.es/1.3/js/idevAPI_core-min.js`

### REQ-VIS-4: PRE branch loads the minified core from PRE CDN
The PRE branch MUST set `scriptSrc = "https://geoidevapi-pre.gva.es/1.3/js/idevAPI_core-min.js"` when the hostname ends with `pre.gva.es` and is not DSA.

#### Scenario: `*-pre.gva.es` loads PRE minified core
- **Given** `location.hostname === "somevisor-pre.gva.es"`
- **When** the selector evaluates
- **Then** `scriptSrc` is `https://geoidevapi-pre.gva.es/1.3/js/idevAPI_core-min.js`

### REQ-VIS-5: PRO branch loads the minified core from PRO CDN
The PRO branch MUST set `scriptSrc = "https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js"` for any other `*.gva.es` hostname.

#### Scenario: Generic `*.gva.es` loads PRO minified core
- **Given** `location.hostname === "somevisor.gva.es"` (not DSA, not PRE)
- **When** the selector evaluates
- **Then** `scriptSrc` is `https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js`

### REQ-VIS-6: Unknown hostname warns (Spanish) and falls back to PRO
When the hostname matches none of the four known branches, the selector MUST emit a `console.warn` with the Spanish copy below AND load the PRO minified core as a safe degradation path. The copy is es-only (per Q2).

> `IDEVAPI: hostname '<host>' no es GVA ni local ni jsdelivr; fallback a PRO. Si necesitás DSA/PRE, cargá el visor desde el subdominio correcto.`

#### Scenario: Unknown hostname warns and falls back to PRO
- **Given** `location.hostname === "staging.example.com"`
- **When** the selector evaluates
- **Then** `console.warn` is called once with the Spanish copy above, where `<host>` is `staging.example.com`
- **And** `scriptSrc` is `https://geoidevapi.gva.es/1.3/js/idevAPI_core-min.js`

### REQ-VIS-7: All visors in `_visores_tester/` are migrated to the new local path
Every visor in `D:\antigravity\_visores_tester\**` MUST have its local branch set to `../../idevapi/js/idevAPI_core.js` (not the legacy `../../1.3/` path). The 4 visors already on `../../idevapi/` are kept; the remaining 29 are migrated.

#### Scenario: No legacy `../../1.3/` path remains in `_visores_tester/`
- **Given** the migration is complete
- **When** `grep` is run over `D:\antigravity\_visores_tester\**` for `../../1.3/`
- **Then** zero matches are returned

#### Scenario: Every visor in `_visores_tester/` references `../../idevapi/`
- **Given** the migration is complete
- **When** every `*.html` in `D:\antigravity\_visores_tester\**` is read
- **Then** each contains exactly one `scriptSrc = "../../idevapi/js/idevAPI_core.js"` line in its local branch

### REQ-VIS-8: (DEFERRED) `ayuda/ejemplos/1.3` is out of scope for 1.3.21
The 27 HTML examples under `D:\antigravity\idevapi\ayuda\ejemplos\1.3` use a different selector pattern (local / FTP / DSA / PRE / PRO, no jsdelivr, fixed script tag in help code display) and are addressed in a future help-system SDD. This requirement is a placeholder so the spec structure is consistent; it MUST NOT block 1.3.21 release.

#### Scenario: 1.3.21 ships without touching `ayuda/`
- **Given** 1.3.21 is released
- **When** the working tree of `D:\antigravity\idevapi\ayuda\**` is inspected
- **Then** no file under `ayuda/ejemplos/1.3/` was modified by the 1.3.21 migration
- **And** a follow-up SDD exists (or is planned) to migrate the help examples (memory: `idevapi/help-system-future-sdd`)

### REQ-VIS-9: Migration is a full selector-block replacement in all 33 visors
Every visor in `D:\antigravity\_visores_tester\**` and every visor in `D:\antiguda\ayuda\**` MUST receive a full-block replacement of the selector `<script>` block with the canonical 5-branch template (local + DSA + PRE + PRO + unknown-with-warn, per REQ-VIS-1..6). The 4 visors already on `../../idevapi/` are NOT exempt — they receive the full block replacement too, so they gain the explicit `.gva.es` PRO branch and the `console.warn` branch they previously lacked. The PowerShell migration script applies the same canonical block to every visor regardless of its current state.

#### Scenario: Every visor in `_visores_tester/` ends with the canonical 5-branch selector
- **Given** the migration is complete
- **When** every `*.html` in `D:\antigravity\_visores_tester\**` is read
- **Then** each contains exactly one selector block matching the canonical 5-branch template (local + DSA + PRE + PRO + unknown-with-warn)
- **And** the diff against the pre-migration file is either: (a) for the 29 visors on `../../1.3/`, a 5-branch template with local path `../../idevapi/`; or (b) for the 4 visors already on `../../idevapi/`, the same canonical 5-branch template (the only changes are the added `.gva.es` explicit branch and the `console.warn` branch).

#### Scenario: PowerShell migration script reports zero outliers
- **Given** the migration script has run against both `_visores_tester/` and `ayuda/`
- **When** the script's summary report is read
- **Then** it shows: N files modified, 0 files with no selector block found (no outliers requiring manual review).
