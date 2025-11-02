# Check current Augment version and suggest update
Write-Host "🔍 Checking Augment Extension Version..." -ForegroundColor Cyan

$extensionsDir = "$env:USERPROFILE\.vscode\extensions"
$augmentExt = Get-ChildItem -Path $extensionsDir -Directory | Where-Object { $_.Name -like "augment.vscode-augment-*" } | Select-Object -First 1

if ($augmentExt) {
    $pkgPath = Join-Path $augmentExt.FullName "package.json"
    if (Test-Path $pkgPath) {
        $pkg = Get-Content $pkgPath -Raw | ConvertFrom-Json
        Write-Host "✅ Current version: $($pkg.version)" -ForegroundColor Green
        Write-Host "   Extension: $($augmentExt.Name)" -ForegroundColor Gray
        
        $version = [version]$pkg.version
        if ($version -lt [version]"0.500.0") {
            Write-Host ""
            Write-Host "⚠️  Your version may not have full MCP UI support" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "To update to latest:" -ForegroundColor Cyan
            Write-Host "  1. Open VS Code Extensions (Ctrl+Shift+X)"
            Write-Host "  2. Search for 'Augment'"
            Write-Host "  3. Click 'Update' if available"
            Write-Host "  4. Reload VS Code after update"
        } else {
            Write-Host ""
            Write-Host "✅ Version should support MCP UI" -ForegroundColor Green
        }
    }
} else {
    Write-Host "❌ Augment extension not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 Note: Even if Settings page doesn't show MCP tools," -ForegroundColor Cyan
Write-Host "   your MCP servers ARE configured and should work in chat!" -ForegroundColor Cyan
Write-Host ""
Write-Host "To verify MCP is working:" -ForegroundColor Yellow
Write-Host "  1. Open Augment chat panel"
Write-Host "  2. Type: '@' and look for your MCP tools"
Write-Host "  3. Or just ask: 'What MCP tools do you have access to?'"
