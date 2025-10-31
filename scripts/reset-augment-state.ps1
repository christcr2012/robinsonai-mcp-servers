# Reset Augment extension state (run from an external PowerShell, with VS Code closed)
# Usage:
#  1) Close all VS Code windows
#  2) Right-click PowerShell -> Run (normal is fine), then run:
#     cd "C:\Users\chris\Git Local\robinsonai-mcp-servers\scripts"
#     .\reset-augment-state.ps1
#  3) Re-open VS Code and run: Augment: Sign In

$ErrorActionPreference = 'Stop'

function Kill-VSCodeIfRunning {
  $procs = Get-Process -Name code -ErrorAction SilentlyContinue
  if ($procs) {
    Write-Host "VS Code is running. Terminating to release file locks..." -ForegroundColor Yellow
    $procs | Stop-Process -Force
    Start-Sleep -Seconds 2
  }
}

function New-BackupFolder {
  param([string]$Root)
  $ts = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupRoot = Join-Path $Root ("augment-" + $ts)
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null
  return $backupRoot
}

function Backup-And-Remove {
  param([string]$SourcePath, [string]$BackupRoot, [string]$Label)
  if (Test-Path $SourcePath) {
    $dest = Join-Path $BackupRoot $Label
    Write-Host "Backing up $Label -> $dest" -ForegroundColor Cyan
    Copy-Item $SourcePath -Destination $dest -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removing $Label from $SourcePath" -ForegroundColor Yellow
    Remove-Item $SourcePath -Recurse -Force -ErrorAction SilentlyContinue
  }
}

# 1) Ensure VS Code is closed to release locks
Kill-VSCodeIfRunning

# 2) Prepare backup target (Desktop\VSCode-Augment-Backups)
$desktop = [Environment]::GetFolderPath('Desktop')
$backupRoot = New-BackupFolder (Join-Path $desktop 'VSCode-Augment-Backups')
Write-Host "Backup folder: $backupRoot" -ForegroundColor Green

# 3) Paths
$global = "$env:APPDATA\Code\User\globalStorage\Augment.vscode-augment"
$wsRoot = "$env:APPDATA\Code\User\workspaceStorage"

# 4) Backup and clear globalStorage
Backup-And-Remove -SourcePath $global -BackupRoot $backupRoot -Label 'globalStorage_Augment.vscode-augment'

# 5) Backup and clear all workspaceStorage Augment folders
if (Test-Path $wsRoot) {
  Get-ChildItem $wsRoot -Directory | ForEach-Object {
    $aug = Join-Path $_.FullName 'Augment.vscode-augment'
    if (Test-Path $aug) {
      Backup-And-Remove -SourcePath $aug -BackupRoot $backupRoot -Label ("workspace_" + $_.Name + '_Augment.vscode-augment')
    }
  }
}

Write-Host "Augment state reset complete." -ForegroundColor Green
Write-Host "Now re-open VS Code and run: Augment: Sign In" -ForegroundColor White
