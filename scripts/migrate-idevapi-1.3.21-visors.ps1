#requires -Version 5.1
<#
.SYNOPSIS
    Migrate IDEVAPI visor selector blocks to the canonical 1.3.21 5-branch template.
.DESCRIPTION
    Replaces the selector block (var currentDomain through document.write) in every
    *.html file under the given root with the canonical local/DSA/PRO+warn template.
    The script is idempotent: running it twice produces no changes.
    It is intentionally conservative and only touches the selector block.
.PARAMETER Root
    Root folder to scan. Defaults to the parent-workspace _visores_tester folder.
#>
param(
    [Parameter(Mandatory = $false)]
    [string]$Root = "D:\antigravity\idevapi\_visores_tester"
)

$canonicalBlock = @'
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
'@

$selectorPattern = '(?s)(?<indent>[ \t]*)var\s+currentDomain\s*=\s*window\.location\.hostname;.*?document\.write\(''<script src="'' \+ scriptSrc \+ ''"><\\/script>''\);'

$files = Get-ChildItem -Path $Root -Filter '*.html' -Recurse -File
$modified = 0
$skipped = 0
$outliers = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $match = [regex]::Match($content, $selectorPattern)

    if (-not $match.Success) {
        $outliers++
        Write-Host "OUTLIER: $($file.FullName)" -ForegroundColor Yellow
        continue
    }

    $indent = $match.Groups['indent'].Value
    $replacement = ($canonicalBlock -split '\r?\n' | ForEach-Object {
        if ($_.Length -eq 0) { $_ } else { $indent + $_ }
    }) -join [Environment]::NewLine

    if ($match.Value -eq $replacement) {
        $skipped++
        continue
    }

    $newContent = $content.Substring(0, $match.Index) + $replacement + $content.Substring($match.Index + $match.Length)
    [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
    $modified++
    Write-Host "MODIFIED: $($file.FullName)"
}

Write-Host ""
Write-Host "Migration report for $Root"
Write-Host "  Files matched and modified : $modified"
Write-Host "  Files already canonical    : $skipped"
Write-Host "  Files with no selector block: $outliers"

if ($outliers -gt 0) {
    exit 1
}
