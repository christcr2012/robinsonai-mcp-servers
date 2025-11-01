# Attempts to fix Augment chat/settings webview by clearing caches and reinstalling the extension
# Safe to run multiple times. Will try to use 'code' CLI if available; else fall back to manual deletion.

Write-Host "🧼 Clearing Augment caches..." -ForegroundColor Cyan
$clearScript = Join-Path $PSScriptRoot "..\scripts\clear-augment-vscode-cache.ps1"
if (Test-Path $clearScript) {
  pwsh -File $clearScript -Force
} else {
  Write-Host "⚠️  Clear script not found at $clearScript" -ForegroundColor Yellow
}

$extDir = Join-Path $env:USERPROFILE ".vscode\extensions"
$augmentExts = Get-ChildItem -Path $extDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like "augment.vscode-augment-*" }
$globalStorage = Join-Path $env:APPDATA "Code\User\globalStorage\Augment.vscode-augment"

function Remove-PathSafe {
  param([string]$Path)
  if (Test-Path $Path) {
    try {
      Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
      Write-Host "✅ Removed: $Path" -ForegroundColor Green
    } catch {
      Write-Host "❌ Failed to remove $Path : $($_.Exception.Message)" -ForegroundColor Red
    }
  }
}

# Try using code CLI
$codeCmd = Get-Command code -ErrorAction SilentlyContinue
if ($codeCmd) {
  Write-Host "\n🔌 Uninstalling Augment via 'code' CLI..." -ForegroundColor Cyan
  try {
    & code --uninstall-extension Augment.vscode-augment --force | Out-Null
    Write-Host "✅ Uninstalled Augment extension (if installed)" -ForegroundColor Green
  } catch {
    Write-Host "⚠️  Failed to uninstall via code CLI: $($_.Exception.Message)" -ForegroundColor Yellow
  }
} else {
  Write-Host "\n⚠️  'code' CLI not found; will remove extension folder manually" -ForegroundColor Yellow
}

# Remove extension folders (in case CLI missed)
foreach ($ext in $augmentExts) {
  Remove-PathSafe -Path $ext.FullName
}

# Remove globalStorage
Write-Host "\n🧹 Removing Augment globalStorage..." -ForegroundColor Cyan
Remove-PathSafe -Path $globalStorage

# Reinstall if code CLI is available
if ($codeCmd) {
  Write-Host "\n⬇️  Installing Augment via 'code' CLI..." -ForegroundColor Cyan
  try {
    & code --install-extension Augment.vscode-augment | Out-Null
    Write-Host "✅ Installed Augment extension" -ForegroundColor Green
  } catch {
    Write-Host "❌ Failed to install Augment via code CLI: $($_.Exception.Message)" -ForegroundColor Red
  }
} else {
  Write-Host "\nℹ️  Please reinstall Augment from the Marketplace (Extensions view)" -ForegroundColor Yellow
}

Write-Host "\n📌 IMPORTANT: Reload the VS Code window now (Developer: Reload Window)" -ForegroundColor Cyan
