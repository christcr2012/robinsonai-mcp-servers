# Deep-clean Augment install and reinstall fresh. RUN FROM AN OUTSIDE POWERSHELL (not inside VS Code)
[CmdletBinding(SupportsShouldProcess=$true)]
param()

Write-Host "🚨 This will close all VS Code windows and reinstall Augment" -ForegroundColor Yellow
$confirm = Read-Host "Proceed? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') { Write-Host "Aborted"; exit 1 }

# Stop VS Code processes
Write-Host "🔪 Stopping VS Code processes..." -ForegroundColor Cyan
Get-Process Code -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

# Paths
$extDir = Join-Path $env:USERPROFILE ".vscode\extensions"
$augmentDirs = Get-ChildItem -Path $extDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'augment.vscode-augment-*' }
$globalStorage = Join-Path $env:APPDATA "Code\User\globalStorage\Augment.vscode-augment"

function Remove-PathForce {
  param([string]$Path)
  if (Test-Path $Path) {
    try {
      Write-Host "🧹 Removing $Path" -ForegroundColor Gray
      # Remove read-only attributes
      Get-ChildItem -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        try { $_.Attributes = 'Normal' } catch {}
      }
      Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
      Write-Host "✅ Removed $Path" -ForegroundColor Green
    } catch {
      Write-Host "⚠️ Failed to remove $Path directly: $($_.Exception.Message)" -ForegroundColor Yellow
      # Try takeown/icacls escalation
      try {
        & takeown /F "$Path" /A /R /D Y | Out-Null
        & icacls "$Path" /grant *S-1-5-32-544:(OI)(CI)F /T /C | Out-Null
        Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
        Write-Host "✅ Removed after taking ownership: $Path" -ForegroundColor Green
      } catch {
  Write-Host "❌ Still failed to remove ${Path}: $($_.Exception.Message)" -ForegroundColor Red
      }
    }
  }
}

foreach ($d in $augmentDirs) { Remove-PathForce -Path $d.FullName }
Remove-PathForce -Path $globalStorage

# Reinstall Augment
Write-Host "⬇️  Reinstalling Augment..." -ForegroundColor Cyan
& code --install-extension Augment.vscode-augment --force | Write-Host

# Relaunch VS Code current workspace if known
$cwd = (Get-Location).Path
Write-Host "🚀 Launching VS Code" -ForegroundColor Cyan
& code "$cwd"

Write-Host "\nDone. Open Augment chat and settings. If still blank, we'll do a clean-profile migration." -ForegroundColor Yellow
