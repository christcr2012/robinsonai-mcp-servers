# Launch VS Code with a clean user profile and only Augment installed
param(
  [string]$Workspace = (Resolve-Path ".").Path
)

$base = Join-Path $env:TEMP "vscode-augment-clean"
$userDataDir = Join-Path $base "user-data"
$extDir = Join-Path $base "extensions"

New-Item -ItemType Directory -Path $userDataDir -Force | Out-Null
New-Item -ItemType Directory -Path $extDir -Force | Out-Null

Write-Host "🧪 Launching VS Code with clean profile..." -ForegroundColor Cyan
Write-Host "   user-data: $userDataDir" -ForegroundColor Gray
Write-Host "   extensions: $extDir" -ForegroundColor Gray

# Install Augment into the isolated extensions dir
Write-Host "⬇️  Installing Augment into clean profile..." -ForegroundColor Cyan
code --user-data-dir "$userDataDir" --extensions-dir "$extDir" --install-extension Augment.vscode-augment | Out-Null

# Launch VS Code to the workspace with the clean profile
Write-Host "🚀 Opening VS Code window (clean profile)" -ForegroundColor Cyan
code --new-window --user-data-dir "$userDataDir" --extensions-dir "$extDir" "$Workspace"

Write-Host "\nWhen the window opens, open Augment chat and settings. If it works here, the issue is in your main profile." -ForegroundColor Yellow
