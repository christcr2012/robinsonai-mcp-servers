# Check for webview console errors and React failures
Write-Host "🔍 Checking for Augment Webview Errors..." -ForegroundColor Cyan

$logsDir = "$env:APPDATA\Code\logs"
$logFolders = Get-ChildItem -Path $logsDir -Directory | Sort-Object Name -Descending | Select-Object -First 1

if (-not $logFolders) {
    Write-Host "❌ No log folders found" -ForegroundColor Red
    exit 1
}

$augmentLogPath = Join-Path $logFolders.FullName "window1\exthost\Augment.vscode-augment\Augment.log"

# Try multiple renderer log locations depending on VS Code version
$rendererLogCandidates = @(
    (Join-Path $logFolders.FullName "renderer1\renderer.log"),
    (Join-Path $logFolders.FullName "renderer1.log"),
    (Join-Path $logFolders.FullName "window1\renderer.log")
)
$rendererLogPath = $rendererLogCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

$mainLogPath = Join-Path $logFolders.FullName "main.log"
$sharedProcessLogPath = Join-Path $logFolders.FullName "sharedprocess.log"

Write-Host "`n📂 Checking log files from: $($logFolders.Name)" -ForegroundColor Gray
Write-Host ""

# Check Augment.log for webview errors
if (Test-Path $augmentLogPath) {
    Write-Host "📄 Augment.log - Last 50 error/warning lines:" -ForegroundColor Yellow
    $content = Get-Content $augmentLogPath -Tail 500
    $errors = $content | Where-Object { $_ -match '\\[error\\]|\\[warning\\]' } | Select-Object -Last 50
    
    if ($errors) {
        $errors | ForEach-Object {
            if ($_ -match 'webview|Webview|panel|Panel|MainPanelWebviewProvider|CheckpointHydration|ChatApp|hydrate|hydration') {
                Write-Host "  ⚠️ $_" -ForegroundColor Red
            } else {
                Write-Host "  $_" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ✅ No recent errors" -ForegroundColor Green
    }
} else {
    Write-Host "📄 Augment.log not found at $augmentLogPath" -ForegroundColor DarkYellow
}

Write-Host ""

# Check renderer.log for console errors
if ($rendererLogPath) {
    Write-Host "📄 $(Split-Path $rendererLogPath -Leaf) - Checking for console errors:" -ForegroundColor Yellow
    $content = Get-Content $rendererLogPath -Tail 500
    $consoleErrors = $content | Where-Object { 
        $_ -match 'console\.error|ERR|Error|Failed|Cannot|TypeError|ReferenceError' -and 
        $_ -match 'augment|Augment'
    } | Select-Object -Last 40
    
    if ($consoleErrors) {
        $consoleErrors | ForEach-Object {
            Write-Host "  ⚠️ $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ No Augment-related console errors" -ForegroundColor Green
    }
} else {
    Write-Host "📄 renderer log not found in expected locations" -ForegroundColor DarkYellow
}

Write-Host ""

# Look for specific failure patterns
Write-Host "🔍 Analyzing Augment.log for failure patterns..." -ForegroundColor Cyan
if (Test-Path $augmentLogPath) {
    $fullContent = Get-Content $augmentLogPath -Raw
} else { $fullContent = '' }

$patterns = @{
    "Webview timeout" = "MainPanelWebviewProvider.*Timeout"
    "Chat timeout" = "ChatApp.*timeout|ChatApp.*timed out"
    "Hydration failure" = "CheckpointHydration.*Failed|Hydration failed|Failed to hydrate"
    "Extension activation failure" = "Extension host.*failed|ExtensionService.*failed"
    "React error" = "React|ReactDOM|hydrate|render|Cannot read properties of undefined"
    "CSP blocked" = "Content Security Policy|Refused to load|ERR_BLOCKED_BY_CLIENT"
}

$foundIssues = @()

foreach ($pattern in $patterns.GetEnumerator()) {
    $matches = [regex]::Matches($fullContent, $pattern.Value, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if ($matches.Count -gt 0) {
        Write-Host "  ❌ $($pattern.Key): $($matches.Count) occurrences" -ForegroundColor Red
        $foundIssues += $pattern.Key
    }
}

if ($foundIssues.Count -eq 0) {
    Write-Host "  ✅ No critical failure patterns detected in Augment.log" -ForegroundColor Green
}

# Also scan main and sharedprocess for webview failures
foreach ($extra in @($mainLogPath, $sharedProcessLogPath)) {
    if (Test-Path $extra) {
        $extraContent = Get-Content $extra -Tail 300
        $extraErrs = $extraContent | Where-Object { $_ -match 'webview|Augment|augment' -and $_ -match 'ERR|Error|Failed|Refused' }
        if ($extraErrs) {
            Write-Host "\n🧪 $(Split-Path $extra -Leaf): Found $($extraErrs.Count) relevant lines" -ForegroundColor Yellow
            $extraErrs | Select-Object -Last 20 | ForEach-Object { Write-Host "  $_" }
        } else {
            Write-Host "\n✅ $(Split-Path $extra -Leaf): No relevant errors" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "💡 Recommended Actions:" -ForegroundColor Cyan

if ($foundIssues -contains "Hydration failure") {
    Write-Host "  1) Clear Augment state completely:" -ForegroundColor Yellow
    Write-Host "     pwsh -File scripts/clear-augment-vscode-cache.ps1 -Force"
}

if ($foundIssues -contains "Chat timeout" -or $foundIssues -contains "Webview timeout") {
    Write-Host "  2) Webview timing out - possible causes:" -ForegroundColor Yellow
    Write-Host "     - Network/auth issue preventing chat initialization"
    Write-Host "     - Corrupted extension files"
    Write-Host "     - Try: Uninstall Augment + Delete extension folder + Reinstall"
}

if ($foundIssues -contains "CSP blocked") {
    Write-Host "  3) CSP blocked resources detected:" -ForegroundColor Yellow
    Write-Host "     - Disable ad-blockers or privacy extensions in VS Code"
    Write-Host "     - Reinstall Augment extension"
}

Write-Host "  4) If UI still blank after above, fully reinstall Augment:" -ForegroundColor Yellow
Write-Host "     - Extensions > Augment > Uninstall"
Write-Host "     - Manually delete: $env:USERPROFILE\.vscode\extensions\augment.vscode-augment-*"
Write-Host "     - Delete: $env:APPDATA\Code\User\globalStorage\Augment.vscode-augment"
Write-Host "     - Restart VS Code"
Write-Host "     - Reinstall Augment from marketplace"

Write-Host ""
