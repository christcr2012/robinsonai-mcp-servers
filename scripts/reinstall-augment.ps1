# Complete Augment Code Extension Reinstall
# Fixes: Chat not loading, Settings not rendering, Webview timeouts

Write-Host "🔧 Augment Code Complete Reinstall" -ForegroundColor Cyan
Write-Host "This will completely remove and reinstall Augment Code extension" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Continue? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Cancelled" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Step 1: Closing VS Code..." -ForegroundColor Cyan

# Kill VS Code processes
$vscodeProcesses = Get-Process -Name "Code" -ErrorAction SilentlyContinue
if ($vscodeProcesses) {
    Write-Host "  Stopping VS Code processes..." -ForegroundColor Yellow
    $vscodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 3
    Write-Host "  ✅ VS Code closed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  VS Code not running (or already closed)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Backing up MCP configuration..." -ForegroundColor Cyan

$settingsPath = "$env:APPDATA\Code\User\settings.json"
if (Test-Path $settingsPath) {
    $backupPath = "$settingsPath.pre-augment-reinstall-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $settingsPath $backupPath
    Write-Host "  ✅ Backup created: $backupPath" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  settings.json not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Removing Augment extension..." -ForegroundColor Cyan

$extensionsDir = "$env:USERPROFILE\.vscode\extensions"
$augmentDirs = Get-ChildItem -Path $extensionsDir -Directory | Where-Object { $_.Name -like "augment.vscode-augment-*" }

if ($augmentDirs) {
    foreach ($dir in $augmentDirs) {
        Write-Host "  Removing: $($dir.Name)" -ForegroundColor Yellow
        Remove-Item -Path $dir.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  ✅ Extension removed" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Extension directory not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Clearing Augment global storage..." -ForegroundColor Cyan

$globalStoragePath = "$env:APPDATA\Code\User\globalStorage\Augment.vscode-augment"
if (Test-Path $globalStoragePath) {
    Write-Host "  Removing: $globalStoragePath" -ForegroundColor Yellow
    Remove-Item -Path $globalStoragePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Global storage cleared" -ForegroundColor Green
} else {
    Write-Host "  ℹ️  Global storage not found (already clear)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Step 5: Clearing workspace storage..." -ForegroundColor Cyan

$workspaceStorageDir = "$env:APPDATA\Code\User\workspaceStorage"
if (Test-Path $workspaceStorageDir) {
    $workspaceFolders = Get-ChildItem -Path $workspaceStorageDir -Directory
    $augmentFolders = $workspaceFolders | Where-Object {
        $augmentPath = Join-Path $_.FullName "Augment.vscode-augment"
        Test-Path $augmentPath
    }
    
    foreach ($folder in $augmentFolders) {
        $augmentPath = Join-Path $folder.FullName "Augment.vscode-augment"
        Write-Host "  Clearing: $augmentPath" -ForegroundColor Yellow
        Remove-Item -Path $augmentPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    Write-Host "  ✅ Workspace storage cleared" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 6: Clearing extension cache..." -ForegroundColor Cyan

$cacheDirs = @(
    "$env:APPDATA\Code\Cache",
    "$env:APPDATA\Code\CachedData",
    "$env:APPDATA\Code\Code Cache"
)

foreach ($cacheDir in $cacheDirs) {
    if (Test-Path $cacheDir) {
        Write-Host "  Clearing: $cacheDir" -ForegroundColor Yellow
        Remove-Item -Path $cacheDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  ✅ Extension cache cleared" -ForegroundColor Green

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart VS Code"
Write-Host "  2. Open Extensions (Ctrl+Shift+X)"
Write-Host "  3. Search for 'Augment Code'"
Write-Host "  4. Click Install"
Write-Host "  5. Sign in to your Augment account"
Write-Host "  6. Your MCP configuration will be preserved in settings.json"
Write-Host ""
Write-Host "💾 Settings backup location:" -ForegroundColor Gray
Write-Host "  $backupPath" -ForegroundColor Gray
Write-Host ""
