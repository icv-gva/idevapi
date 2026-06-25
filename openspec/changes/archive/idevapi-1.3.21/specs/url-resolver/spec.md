# Spec: url-resolver

## Purpose
The URL resolver in `js/idevAPI_core.js` (lines 9–50) MUST derive the API base URL (`urlAPI`) and version segment (`URLVersion`) from the `src` attribute of its own `<script>` tag using three explicit, ordered families: **jsdelivr**, **GVA**, and **local**. It MUST NOT silently fall through to GVA PRO for jsdelivr or local paths.

## Requirements

### REQ-URL-1: jsdelivr branch handles concrete tag forms
The system MUST match a `srcCore` containing `cdn.jsdelivr.net/gh/<owner>/<repo>@<tag>` and return `urlAPI = "//cdn.jsdelivr.net/gh/<owner>/<repo>@<tag>"` (protocol stripped) with `URLVersion = ""`. This MUST hold for the five concrete tag forms `@1.3.19`, `@1.3.20`, `@1.3.21`, `@1.3`, `@1`.

#### Scenario: Concrete tag `@1.3.19` resolves to jsdelivr
- **Given** a `<script src="https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19/js/idevAPI_core-min.js">`
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.19`
- **And** `URLVersion` is `""`
- **And** the GVA branch is never evaluated

#### Scenario: Concrete tag `@1.3.20` resolves to jsdelivr
- **Given** `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20/js/idevAPI_core-min.js`
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.20` and `URLVersion` is `""`

#### Scenario: Concrete tag `@1.3.21` resolves to jsdelivr
- **Given** `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.21/js/idevAPI_core-min.js`
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.21` and `URLVersion` is `""`

#### Scenario: Floating minor tag `@1.3` resolves to jsdelivr
- **Given** `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3/js/idevAPI_core-min.js`
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3` and `URLVersion` is `""`

#### Scenario: Floating major tag `@1` resolves to jsdelivr
- **Given** `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1/js/idevAPI_core-min.js`
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `//cdn.jsdelivr.net/gh/icv-gva/idevapi@1` and `URLVersion` is `""`

### REQ-URL-2: jsdelivr branch handles `@latest`
The system MUST treat `@latest` identically to concrete tags, returning `urlAPI = "//cdn.jsdelivr.net/gh/icv-gva/idevapi@latest"` and `URLVersion = ""`. No GVA fallback.

#### Scenario: Latest tag resolves to jsdelivr
- **Given** `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@latest/js/idevAPI_core-min.js`
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `//cdn.jsdelivr.net/gh/icv-gva/idevapi@latest` and `URLVersion` is `""`

### REQ-URL-3: Local branch handles the standard `../../idevapi/` layout
The system MUST match `srcCore` against the pattern `^(.*\/)idevapi\/js\/idevAPI_core` and return `urlAPI = "../../idevapi"` with `URLVersion = ""`. No GVA fallback.

#### Scenario: Standard local path resolves to `../../idevapi`
- **Given** `<script src="../../idevapi/js/idevAPI_core.js">` (resolved by the browser to e.g. `http://localhost/.../idevapi/js/idevAPI_core.js`)
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `../../idevapi` and `URLVersion` is `""`
- **And** the GVA branch is never evaluated

### REQ-URL-4: Local branch safe-degrades when the regex does not match
When the local regex does not match an arbitrary `srcCore` (e.g. a third-party path that happens to contain `idevapi` but not in the `idevapi/js/idevAPI_core` shape), the system MUST fall back to `urlAPI = "../../idevapi"` and `URLVersion = ""` without logging a console error.

#### Scenario: Arbitrary path falls back safely
- **Given** `srcCore` does not contain `cdn.jsdelivr.net/gh/`, does not contain a GVA hostname, and does not match the local regex (e.g. an unrelated CDN URL)
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `../../idevapi` and `URLVersion` is `""`
- **And** no `console.error` is emitted

### REQ-URL-5: GVA branch handles six sub-environments
The system MUST map each of the six GVA sub-environments to its base URL with `URLVersion = "/1.3"`. The order within the GVA family MUST be deterministic: more specific paths (`/desa/`, `/pre/`, `/api/`) MUST be checked before bare hostnames.

| Sub-environment | `urlAPI` |
|---|---|
| `idevapi.gva.es/desa/` | `//idevapi.gva.es/desa` |
| `geoidevapi-dsa.gva.es` | `//geoidevapi-dsa.gva.es` |
| `idevapi.gva.es/pre/` | `//idevapi.gva.es/pre` |
| `geoidevapi-pre.gva.es` | `//geoidevapi-pre.gva.es` |
| `idevapi.gva.es/api/` | `//idevapi.gva.es/api` |
| `geoidevapi.gva.es` | `//geoidevapi.gva.es` |

#### Scenario: DSA path resolves to DSA base
- **Given** `srcCore` contains `geoidevapi-dsa.gva.es/1.3/js/idevAPI_core-min.js`
- **When** the GVA branch evaluates
- **Then** `urlAPI` is `//geoidevapi-dsa.gva.es` and `URLVersion` is `/1.3`

#### Scenario: PRE path resolves to PRE base
- **Given** `srcCore` contains `geoidevapi-pre.gva.es/1.3/js/idevAPI_core-min.js`
- **When** the GVA branch evaluates
- **Then** `urlAPI` is `//geoidevapi-pre.gva.es` and `URLVersion` is `/1.3`

#### Scenario: PRO base resolves to PRO
- **Given** `srcCore` contains `geoidevapi.gva.es/1.3/js/idevAPI_core-min.js`
- **When** the GVA branch evaluates
- **Then** `urlAPI` is `//geoidevapi.gva.es` and `URLVersion` is `/1.3`

#### Scenario: Legacy `/desa/` sub-path resolves to legacy DSA
- **Given** `srcCore` contains `idevapi.gva.es/desa/1.3/js/idevAPI_core-min.js`
- **When** the GVA branch evaluates
- **Then** `urlAPI` is `//idevapi.gva.es/desa` and `URLVersion` is `/1.3`

#### Scenario: Legacy `/pre/` sub-path resolves to legacy PRE
- **Given** `srcCore` contains `idevapi.gva.es/pre/1.3/js/idevAPI_core-min.js`
- **When** the GVA branch evaluates
- **Then** `urlAPI` is `//idevapi.gva.es/pre` and `URLVersion` is `/1.3`

#### Scenario: Legacy `/api/` sub-path resolves to legacy API
- **Given** `srcCore` contains `idevapi.gva.es/api/1.3/js/idevAPI_core-min.js`
- **When** the GVA branch evaluates
- **Then** `urlAPI` is `//idevapi.gva.es/api` and `URLVersion` is `/1.3`

### REQ-URL-6: Resolver MUST NOT silently fall through to GVA PRO for jsdelivr URLs
The system MUST NOT return `//geoidevapi.gva.es` for any `srcCore` that contains `cdn.jsdelivr.net/gh/`. This is the regression the change fixes.

#### Scenario: jsdelivr URL never returns GVA PRO
- **Given** any jsdelivr URL from REQ-URL-1 or REQ-URL-2
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is never `//geoidevapi.gva.es` and never contains `gva.es`

### REQ-URL-7: Resolver MUST NOT silently fall through to GVA PRO for the new local path
The system MUST NOT return `//geoidevapi.gva.es` for `srcCore` matching the local `idevapi/js/idevAPI_core` regex.

#### Scenario: Local path never returns GVA PRO
- **Given** `srcCore` matching the local regex from REQ-URL-3
- **When** the resolver evaluates `srcCore`
- **Then** `urlAPI` is `../../idevapi`, not `//geoidevapi.gva.es`

### REQ-URL-8: Resolver branches are evaluated in order
The system MUST evaluate jsdelivr first, then GVA, then local, then the safe-degradation fallback — in that order. No single regex match should attempt to disambiguate across families.

#### Scenario: Branch order is jsdelivr → GVA → local → fallback
- **Given** a `srcCore` that contains a jsdelivr substring
- **When** the resolver evaluates
- **Then** only the jsdelivr branch produces a non-fallback result; GVA and local branches are not entered
- **And** for a `srcCore` that contains a GVA hostname, only the GVA branch produces a result

### REQ-URL-9: `IDEVAPIVersion` is a cache-buster that must match the published tag
The `IDEVAPIVersion` constant (currently `js/idevAPI_core.js:75`) MUST be used ONLY as a `?v=` cache-buster query string. For tag `1.3.21`, `IDEVAPIVersion` MUST be the string `"1.3.21"`. For backports, the constant MUST stay at the original tag's value (`"1.3.19"` or `"1.3.20"`).

#### Scenario: Tag 1.3.21 ships with `IDEVAPIVersion = "1.3.21"`
- **Given** a release tagged `1.3.21`
- **When** the source is rebuilt
- **Then** the constant reads `var IDEVAPIVersion = "1.3.21";`
- **And** downstream module URLs embed `?v=1.3.21`

#### Scenario: Backport to 1.3.19 keeps `IDEVAPIVersion = "1.3.19"`
- **Given** a backport commit on a 1.3.19-fix branch
- **When** the source is rebuilt
- **Then** the constant reads `var IDEVAPIVersion = "1.3.19";` (NOT `"1.3.21"`)
