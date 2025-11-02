# Clear Augment VS Code cache to fix stuck UI / checkpoint hydration issues
# Safely removes Augment.vscode-augment cache directories under VS Code workspaceStorage
# and globalStorage. Creates backups where reasonable.

param(
    [switch]$Force
)

Write-Host "`n=== Clearing Augment VS Code caches ===" -ForegroundColor Cyan

$AppData = $env:APPDATA
if (-not $AppData) {
    Write-Host "APPDATA env var not found" -ForegroundColor Red
    exit 1
}

$workspaceStorage = Join-Path $AppData "Code\User\workspaceStorage"
$globalStorage    = Join-Path $AppData "Code\User\globalStorage\Augment.vscode-augment"

if (-not (Test-Path $workspaceStorage)) {
    Write-Host "workspaceStorage not found: $workspaceStorage" -ForegroundColor Yellow
} else {
    Write-Host "Scanning workspaceStorage for Augment caches..." -ForegroundColor Gray
    Get-ChildItem -Path $workspaceStorage -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $augmentDir = Join-Path $_.FullName "Augment.vscode-augment"
        if (Test-Path $augmentDir) {
            Write-Host "  Found: $augmentDir" -ForegroundColor Gray
            $targets = @(
                "checkpoint-documents",
                "checkpoint-blobs",
                "checkpoint",
                "async-msg-cache",
                "tmp",
                "cache"
            )
            foreach ($t in $targets) {
                $p = Join-Path $augmentDir $t
                if (Test-Path $p) {
                    try {
                        if (-not $Force) {
                            Write-Host "   - Removing $p" -ForegroundColor Yellow
                        }
                        Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction Stop
                    } catch {
                        Write-Host "   - Failed to remove $p (locked?). Close VS Code and re-run with -Force." -ForegroundColor Red
                    }
                }
            }
        }
    }
}

if (Test-Path $globalStorage) {
    Write-Host "Clearing globalStorage: $globalStorage" -ForegroundColor Gray
    try {
        Get-ChildItem -Path $globalStorage -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.Name -match "checkpoint|cache|tmp") {
                Write-Host "  - Removing $($_.FullName)" -ForegroundColor Yellow
                Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        Write-Host "  - Failed to clear some globalStorage entries (may be locked)." -ForegroundColor Red
    }
} else {
    Write-Host "Global storage not found (ok): $globalStorage" -ForegroundColor Gray
}

Write-Host "Done. If VS Code is open, reload the window. If still stuck, close VS Code completely and run this again with -Force." -ForegroundColor Green
