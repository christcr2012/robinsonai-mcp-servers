param(
  [ValidateSet('basic','full')]
  [string]$Config = 'basic'
)

Write-Host "`n🔧 Auto-injecting Augment MCP configuration..." -ForegroundColor Cyan

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$basicPath = Join-Path $repoRoot 'READY_TO_PASTE_CONFIG.json'
$fullPath  = Join-Path $repoRoot 'READY_TO_PASTE_CONFIG_WITH_INTEGRATIONS.json'

if (-not (Test-Path $basicPath)) {
  Write-Host "❌ Missing $basicPath" -ForegroundColor Red
  exit 1
}
if ($Config -eq 'full' -and -not (Test-Path $fullPath)) {
  Write-Host "❌ Missing $fullPath" -ForegroundColor Red
  exit 1
}

$sourceFile = if ($Config -eq 'full') { $fullPath } else { $basicPath }
Write-Host "Using config: $sourceFile" -ForegroundColor Gray

try {
  $raw = Get-Content $sourceFile -Raw
  $config = $raw | ConvertFrom-Json
} catch {
  Write-Host "❌ Failed to parse JSON from $sourceFile" -ForegroundColor Red
  exit 1
}

if (-not $config.mcpServers) {
  Write-Host "❌ Config is missing 'mcpServers' root key" -ForegroundColor Red
  exit 1
}

# 1) VS Code Augment extension global state
$vsGlobalDir = Join-Path $env:APPDATA 'Code\User\globalStorage\augment.vscode-augment\augment-global-state'
$vsGlobalFile = Join-Path $vsGlobalDir 'mcpServers.json'

New-Item -ItemType Directory -Path $vsGlobalDir -Force | Out-Null
if (Test-Path $vsGlobalFile) { Copy-Item $vsGlobalFile "$vsGlobalFile.bak" -Force }
$config.mcpServers | ConvertTo-Json -Depth 50 | Set-Content -Path $vsGlobalFile -Encoding UTF8
Write-Host "✅ Wrote VS Code Augment global state: $vsGlobalFile" -ForegroundColor Green

# 2) VS Code settings.json (augment.mcpServers)
$settingsPath = Join-Path $env:APPDATA 'Code\User\settings.json'
if (Test-Path $settingsPath) {
  try { $settings = (Get-Content $settingsPath -Raw | ConvertFrom-Json) } catch { $settings = [pscustomobject]@{} }
} else {
  $settings = [pscustomobject]@{}
}

# Add/replace dotted key 'augment.mcpServers'
if ($settings.PSObject.Properties.Name -notcontains 'augment.mcpServers') {
  Add-Member -InputObject $settings -MemberType NoteProperty -Name 'augment.mcpServers' -Value $config.mcpServers
} else {
  $settings.'augment.mcpServers' = $config.mcpServers
}

$settingsJson = $settings | ConvertTo-Json -Depth 50
if (Test-Path $settingsPath) { Copy-Item $settingsPath "$settingsPath.bak" -Force }
Set-Content -Path $settingsPath -Value $settingsJson -Encoding UTF8
Write-Host "✅ Updated VS Code settings: augment.mcpServers → $settingsPath" -ForegroundColor Green

# 3) Augment standalone app config (best-effort)
$augmentCandidates = @(
  (Join-Path $env:APPDATA     'Augment\mcp-config.json'),
  (Join-Path $env:LOCALAPPDATA 'Augment\mcp-config.json'),
  (Join-Path $env:USERPROFILE  '.augment\mcp-config.json')
)

$writtenAugment = @()
foreach ($path in $augmentCandidates) {
  $dir = Split-Path $path -Parent
  try {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    # Standalone app expects wrapper { mcpServers: { ... } }
    $wrapper = @{ mcpServers = $config.mcpServers } | ConvertTo-Json -Depth 50
    if (Test-Path $path) { Copy-Item $path "$path.bak" -Force }
    Set-Content -Path $path -Value $wrapper -Encoding UTF8
    $writtenAugment += $path
  } catch {}
}

if ($writtenAugment.Count -gt 0) {
  Write-Host ("✅ Wrote Augment app config: " + ($writtenAugment -join ', ')) -ForegroundColor Green
} else {
  Write-Host "ℹ️  Skipped Augment app config (paths not present on this machine)." -ForegroundColor Yellow
}

# Helpful hint
Write-Host "`n📋 Summary" -ForegroundColor Cyan
Write-Host "- VS Code global storage: $vsGlobalFile" -ForegroundColor White
Write-Host "- VS Code settings:       $settingsPath" -ForegroundColor White
if ($writtenAugment.Count -gt 0) { Write-Host "- Augment app config:     $($writtenAugment -join ', ')" -ForegroundColor White }

Write-Host "`n🔁 Please reload VS Code: Ctrl+Shift+P → 'Developer: Reload Window'" -ForegroundColor White
Write-Host "Then in Augment chat: 'List available tools'" -ForegroundColor White

Write-Host "`n✨ Done." -ForegroundColor Green
