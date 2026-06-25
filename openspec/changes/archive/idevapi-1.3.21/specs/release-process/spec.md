# Spec: release-process

## Purpose
The release process for tag `1.3.21` MUST coordinate a version bump, an esbuild rebuild, a Git tag, a junction deletion, and a conditional backport — in that order — with a user-gated confirmation before any destructive force-push of prior tags.

## Requirements

### REQ-REL-1: `package.json` version is `1.3.21` before tagging
The `version` field in `package.json` MUST equal `"1.3.21"` before the `1.3.21` git tag is created.

#### Scenario: `package.json` is bumped to 1.3.21
- **Given** the resolver change is committed and the working tree is clean
- **When** `cat package.json` is read
- **Then** the `version` field reads `"1.3.21"`

### REQ-REL-2: `IDEVAPIVersion` source constant is `"1.3.21"` before tagging
The constant `var IDEVAPIVersion = "1.3.21";` MUST be present in `js/idevAPI_core.js:75` before the `1.3.21` git tag is created.

#### Scenario: Source constant matches the tag
- **Given** the source file is read at line 75
- **When** the constant is inspected
- **Then** it reads `var IDEVAPIVersion = "1.3.21";`

### REQ-REL-3: `npm run build` succeeds and regenerates all 18 minified artifacts
`npm run build` (esbuild ^0.27.4) MUST succeed and MUST overwrite all 18 `*-min.*` files under `js/` and `css/` (per `build.js` entries list; the 18th is `idevAPI_config-min.js`, kept for future reactivation per the inline comment in `build.js`). The minified `js/idevAPI_core-min.js` MUST embed (a) the new resolver block from REQ-URL-1…9 and (b) the new `IDEVAPIVersion = "1.3.21"` string.

#### Scenario: Build command exits 0
- **Given** the resolver and version constant are in source
- **When** `npm run build` is executed
- **Then** the process exits with status 0
- **And** the timestamp on each of the 18 `*-min.*` artifacts is newer than the source

#### Scenario: Minified core embeds the new resolver
- **Given** the build succeeded
- **When** `js/idevAPI_core-min.js` is inspected
- **Then** it contains the literal substring `cdn.jsdelivr.net/gh` (jsdelivr branch) and the literal substring `geoidevapi-dsa.gva.es` (GVA branch) and the literal `idevapi\/js\/idevAPI_core` (local regex)

#### Scenario: Minified core embeds the new version
- **Given** the build succeeded
- **When** `js/idevAPI_core-min.js:1` is inspected
- **Then** it contains the literal string `1.3.21` (the cache-buster value)

### REQ-REL-4: Tag `1.3.21` is created and pushed
A git tag named `1.3.21` MUST be created on the release commit and pushed to `origin main` (or the configured default branch).

#### Scenario: Tag exists locally
- **Given** the build is complete
- **When** `git tag --list 1.3.21` is executed
- **Then** the output contains `1.3.21`

#### Scenario: Tag is pushed to origin
- **Given** the tag exists locally
- **When** `git push origin 1.3.21` is executed
- **Then** the process exits 0
- **And** `git ls-remote --tags origin 1.3.21` returns the tag's SHA

### REQ-REL-5: The Windows junction `D:\antigravity\idevapi\1.3` does not exist after this change
The junction that historically aliased `D:\antigravity\idevapi\1.3` → `D:\antigravity\idevapi\idevapi` MUST be removed. Visors no longer rely on the `../../1.3/` path; they use `../../idevapi/` directly.

#### Scenario: Junction is removed
- **Given** the visor migration is complete
- **When** `Test-Path D:\antigravity\idevapi\1.3` is executed in PowerShell
- **Then** the result is `False`
- **And** no remaining visor references `../../1.3/`

### REQ-REL-6: jsdelivr reachability is verified within 24h of the tag push
The orchestrator SHOULD verify that `https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.21/js/idevAPI_core-min.js` returns HTTP 200 within 24 hours of the tag push. This is a soft check, not a gating step.

#### Scenario: jsdelivr serves the new tag
- **Given** the tag is pushed and at least one cache refresh cycle has elapsed
- **When** `Invoke-WebRequest https://cdn.jsdelivr.net/gh/icv-gva/idevapi@1.3.21/js/idevAPI_core-min.js` is executed
- **Then** the status code is 200
- **And** the response body contains the literal `1.3.21`

### REQ-REL-7: Force-push of prior tags requires explicit user confirmation
A destructive `git push --force` of tag `1.3.19` or tag `1.3.20` MUST NOT be performed without explicit, per-tag user confirmation. The apply phase MUST stop and request confirmation before any force-push of those tags.

#### Scenario: Backport is gated
- **Given** the apply phase determines that a backport to 1.3.19 or 1.3.20 is required
- **When** the orchestrator reaches the force-push step
- **Then** it MUST pause and request explicit user confirmation, naming the tag(s) to be force-pushed
- **And** it MUST NOT execute `git push --force origin <tag>` without that confirmation

### REQ-REL-8: Backport commits touch only the resolver block
A backport commit on a `1.3.19-fix` or `1.3.20-fix` branch MUST modify only the resolver block (the equivalent of `js/idevAPI_core.js` lines 9–50 in the prior source). The `IDEVAPIVersion` constant MUST stay at the original tag value (`"1.3.19"` or `"1.3.20"` respectively) and MUST NOT be bumped to `1.3.21`.

#### Scenario: Backport diff is resolver-only
- **Given** a backport commit on `1.3.19-fix`
- **When** the diff against the parent commit is computed
- **Then** the diff is limited to the resolver block
- **And** `IDEVAPIVersion` still reads `"1.3.19"`
- **And** the rebuilt minified `idevAPI_core-min.js` embeds the new resolver but `1.3.19` as the cache-buster

#### Scenario: Backport tag is force-pushed only after confirmation
- **Given** the backport commit is built and the user has explicitly confirmed the force-push for that tag
- **When** `git push --force origin 1.3.19` (or `1.3.20`) is executed
- **Then** the process exits 0

### REQ-REL-9: Smoke test is defined in `tasks.md` (not in this spec)
The manual smoke test (clean console + Leaflet container in DOM after `DOMContentLoaded`, across all 5 jsdelivr forms `@1.3.19`, `@1.3.20`, `@1.3.21`, `@1.3`, `@1`) is owned by the `tasks.md` phase. This spec references the test by name only; it does not redefine the assertion.

#### Scenario: Smoke test reference is in `tasks.md`
- **Given** the spec is finalised
- **When** `tasks.md` is read
- **Then** it contains a smoke-test task that names the 5 jsdelivr forms and the clean-console + Leaflet-container assertions
