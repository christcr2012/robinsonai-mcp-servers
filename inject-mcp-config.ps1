$settingsPath = "$env:APPDATA\Code\User\settings.json"
$importPath = "C:\Users\chris\Git Local\robinsonai-mcp-servers\AUGMENT_IMPORT_ALL_6_SERVERS_ALIGNED.json"

# Read current settings
$settings = Get-Content $settingsPath -Raw | ConvertFrom-Json

# Read MCP servers config
$mcpServers = Get-Content $importPath -Raw | ConvertFrom-Json

# Inject into settings
$settings | Add-Member -MemberType NoteProperty -Name "augment.mcpServers" -Value $mcpServers -Force

# Write back
$settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath

Write-Host "Injected MCP config into settings.json"
Write-Host "CLOSE VS Code completely (File > Exit), then restart it."
