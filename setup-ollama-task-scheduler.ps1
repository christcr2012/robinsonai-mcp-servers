# Setup Ollama to auto-start via Windows Task Scheduler
# Run this script as Administrator to create the scheduled task
# For Robinson AI Systems MCP Servers

# Requires Administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges!"
    Write-Host "Right-click and select 'Run as Administrator'"
    pause
    exit 1
}

$taskName = "Ollama Auto-Start"
$ollamaPath = "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe"
$scriptPath = "$PSScriptRoot\start-ollama-hidden.ps1"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️ Task '$taskName' already exists. Removing old task..."
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Create the scheduled task
Write-Host "Creating scheduled task: $taskName"

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`""

# Trigger: At logon
$trigger = New-ScheduledTaskTrigger -AtLogOn

# Settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable:$false `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

# Principal: Run with highest privileges
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive -RunLevel Highest

# Register the task
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Auto-start Ollama for Robinson AI Systems MCP Servers"

Write-Host "✅ Task created successfully!"
Write-Host ""
Write-Host "Ollama will now start automatically when you log in."
Write-Host ""
Write-Host "To test the task now, run:"
Write-Host "  Start-ScheduledTask -TaskName '$taskName'"
Write-Host ""
Write-Host "To remove the task later, run:"
Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false"
Write-Host ""
pause

