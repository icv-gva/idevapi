# Verify Report: idevapi-core-jq-path-fix

| Field | Value |
|-------|-------|
| Change | `idevapi-core-jq-path-fix` |
| Phase | Verify |
| Date | 2026-06-26 |
| Verifier | `sdd-verify` sub-agent |
| Status | **PASS** — ready for archive |

## Summary

| Metric | Count |
|--------|-------|
| Total checks | 10 |
| Passed | 9 |
| Warnings | 1 |
| Suggestions | 0 |
| Failed | 0 |

**Verdict**: Ready for archive.

---

## Checks

### 1. Hunk 1 — `resolveLocal` (lines 45-53) ✅ PASS

**Expected**: Anchor-element-based `resolveLocal` that creates an `<a>` element, sets `a.href = srcCore`, reads `a.pathname`, strips `/js/idevAPI_core.*`, returns `{ urlAPI: base, URLVersion: "" }`.

**Actual** (lines 45-53):
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

**Evidence**: Exact match with proposal. Tabs preserved. Regex correctly strips `/js/idevAPI_core.*` suffix. Guard `base !== p` ensures null return when pattern doesn't match.

---

### 2. Hunk 2 — `detectLoadFamily` fallback (line 24) ✅ PASS

**Expected**: `return { urlAPI: "/idevapi", URLVersion: "" };`

**Actual** (line 24):
```javascript
	return { urlAPI: "/idevapi", URLVersion: "" };
```

**Evidence**: Exact match. Root-relative path, depth-independent.

---

### 3. Hunk 3 — `IDEVAPIVersion` (line 82) ✅ PASS

**Expected**: `var IDEVAPIVersion = "1.3.22";`

**Actual** (line 82):
```javascript
var IDEVAPIVersion = "1.3.22";	//Versión menor para evitar caché en el cliente en nuevas versiones
```

**Evidence**: Exact match. Line shifted from 79 → 82 due to longer `resolveLocal` body (+3 lines).

---

### 4. Build artifact — `idevAPI_core-min.js` ✅ PASS

**Expected**: Minified file contains anchor-based `resolveLocal` and version `1.3.22`.

**Actual**: Searched minified file for key patterns:
- `createElement("a")` — found (minified anchor creation)
- `pathname` — found (minified pathname access)
- `resolveLocal` — minified to inline function `function resolveLocal(o){var n=document.createElement("a");n.href=o;var y=n.pathname,O=y.replace(/\/js\/idevAPI_core.*$/,"");return O!==y?{urlAPI:O,URLVersion:""}:null}`
- `IDEVAPIVersion="1.3.22"` — found

**Evidence**: Minified output is a faithful transformation of source. All 3 hunks present in minified form.

---

### 5. Git state ✅ PASS

**Expected**: 2 commits on main (`4307611` fix + `6f34958` release), tag `1.3.22` on `6f34958`, both on `origin/main`.

**Actual**:
```
git log --oneline -3:
6f34958 release: 1.3.22
4307611 fix(core): compute urlAPI from script path instead of hardcoded relative
a9efe01 chore: remove openspec/ and scripts/ from public repo

git tag --list "1.3.22":
1.3.22 -> 6f34958
```

**Evidence**: Both commits present in correct order. Tag points to release commit. Push confirmed in apply-progress (Phase 4.2).

---

### 6. Commit hygiene ✅ PASS

**Expected**: Conventional commit format, no `Co-Authored-By:`, release commit empty.

**Actual**:
- `4307611`: `fix(core): compute urlAPI from script path instead of hardcoded relative` — conventional format ✅, no Co-Authored-By ✅, body explains root cause and fix ✅
- `6f34958`: `release: 1.3.22` — conventional format ✅, no Co-Authored-By ✅, empty commit (0 files) ✅

**Evidence**: `git show --no-patch --format="%B"` output confirmed.

---

### 7. CDN safety — `resolveJsdelivr` and `resolveGVA` untouched ✅ PASS

**Expected**: Both functions unchanged from pre-fix state.

**Actual**:
- `resolveJsdelivr` (lines 28-32): Still matches `cdn.jsdelivr.net/gh/...` pattern, returns `{ urlAPI: m[2], URLVersion: "" }`. Untouched.
- `resolveGVA` (lines 35-43): All 6 GVA sub-environment checks present and unchanged. Untouched.

**Evidence**: Function bodies match pre-fix code exactly. Only `resolveLocal` and the fallback were modified.

---

### 8. Decisions D1-D4 ✅ PASS

| ID | Decision | Verified? | Evidence |
|----|----------|-----------|----------|
| D1 | Tag `1.3.22` | ✅ | `1.3.22 -> 6f34958` |
| D2 | Build regen | ✅ | `-min.js` contains anchor-based code, `IDEVAPIVersion="1.3.22"` |
| D3 | Single PR | ✅ | 1 fix + 1 release = 1 logical change, direct push to main |
| D4 | 2 commits fix+release | ✅ | `4307611` + `6f34958` |

---

### 9. Manual QA (Phase 5) ✅ PASS

**Expected**: User confirms help page loads, jQuery 200, map renders.

**Actual**: User confirmed: "He hecho QA y todo bien, ya funciona." Opened help in browser, jQuery loads, map renders.

**Evidence**: User's explicit confirmation in session.

---

### 10. Visor regression ⚠️ WARNING (informational)

**Expected**: Visors at `_visores_tester/<visor>/` (2 levels deep) still work.

**Actual**: User did NOT explicitly test a visor in this session. However:
- The fix is depth-**in**dependent (works at ANY depth)
- Visors at 2 levels were the original happy path
- The anchor-based approach produces `/idevapi` for any path containing `/idevapi/js/idevAPI_core`
- No code change affects visor-specific logic

**Evidence**: Theoretical analysis confirms no regression. The fix replaces a 2-level-only path with a universal path. Visors benefit identically.

**Recommendation**: Informational only. User may test a visor for full confidence but it is not required for archive.

---

## Deviations from Proposal

None. Implementation matches proposal exactly.

## Open Issues

| # | Issue | Severity | Resolution |
|---|-------|----------|------------|
| 1 | Visor not explicitly tested by user | Informational | Fix is depth-independent; visors at 2 levels (original happy path) cannot regress. User may test for full confidence. |

## Risks

No new risks identified. All proposal risks (R1-R4) mitigated:
- R1 (CDN broken): Not applicable — CDN resolvers untouched ✅
- R2 (Build non-deterministic): Build output matches source ✅
- R3 (Anchor unsupported): IE6+, esbuild target es2015 ✅
- R4 (Fallback wrong): `resolveLocal` matches before fallback is reached ✅

---

## Final Verdict

**READY FOR ARCHIVE** ✅

All 9 substantive checks pass. 1 informational warning (visor not explicitly tested) poses no actual risk due to the depth-independent nature of the fix.
