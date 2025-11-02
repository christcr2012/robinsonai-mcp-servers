# Setup Ollama Auto-Start on Windows
# Creates a scheduled task to start Ollama automatically at user logon

#Requires -RunAsAdministrator

Write-Host "`n=== Ollama Auto-Start Setup ===" -ForegroundColor Cyan
Write-Host "This script will create a scheduled task to start Ollama at logon`n" -ForegroundColor Gray

# Check if Ollama is installed
$ollamaPath = "C:\Program Files\Ollama\ollama.exe"
if (-not (Test-Path $ollamaPath)) {
    # Try alternative locations
    $ollamaPath = "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe"
    if (-not (Test-Path $ollamaPath)) {
        Write-Host "❌ Ollama executable not found" -ForegroundColor Red
        Write-Host "`nSearching for Ollama..." -ForegroundColor Yellow
        
        # Try to find ollama.exe
        $found = Get-Command ollama -ErrorAction SilentlyContinue
        if ($found) {
            $ollamaPath = $found.Source
            Write-Host "✅ Found Ollama at: $ollamaPath" -ForegroundColor Green
        } else {
            Write-Host "❌ Could not find Ollama installation" -ForegroundColor Red
            Write-Host "`nPlease install Ollama from: https://ollama.ai/download" -ForegroundColor Yellow
            exit 1
        }
    }
}

Write-Host "✅ Ollama found at: $ollamaPath" -ForegroundColor Green

# Check if task already exists
$taskName = "OllamaAutoStart"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "`n⚠️  Scheduled task '$taskName' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to replace it? (y/n)"
    if ($response -ne 'y') {
        Write-Host "Cancelled." -ForegroundColor Gray
        exit 0
    }
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "✅ Removed existing task" -ForegroundColor Green
}

# Create scheduled task
Write-Host "`nCreating scheduled task..." -ForegroundColor Cyan

try {
    # Define the action (what to run)
    $action = New-ScheduledTaskAction -Execute $ollamaPath -Argument "serve"
    
    # Define the trigger (when to run)
    $trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    
    # Define settings
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable:$false `
        -DontStopOnIdleEnd `
        -RestartCount 3 `
        -RestartInterval (New-TimeSpan -Minutes 1)
    
    # Define principal (run as current user, highest privileges)
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Highest
    
    # Register the task
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Automatically starts Ollama server at user logon for Robinson AI MCP system" `
        -Force | Out-Null
    
    Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to create scheduled task" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Verify task was created
$verifyTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($verifyTask) {
    Write-Host "`n=== Task Details ===" -ForegroundColor Cyan
    Write-Host "Task Name: $taskName" -ForegroundColor White
    Write-Host "Status: $($verifyTask.State)" -ForegroundColor White
    Write-Host "Trigger: At user logon ($env:USERNAME)" -ForegroundColor White
    Write-Host "Action: $ollamaPath serve" -ForegroundColor White
    Write-Host "Run Level: Highest (Administrator)" -ForegroundColor White
} else {
    Write-Host "⚠️  Could not verify task creation" -ForegroundColor Yellow
}

# Test the task
Write-Host "`n=== Testing ===" -ForegroundColor Cyan
$testResponse = Read-Host "Do you want to test the task now? (y/n)"
if ($testResponse -eq 'y') {
    Write-Host "Starting Ollama via scheduled task..." -ForegroundColor Gray
    Start-ScheduledTask -TaskName $taskName
    Start-Sleep -Seconds 3
    
    # Check if Ollama is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ Ollama is running!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Ollama may not be running yet (give it a few more seconds)" -ForegroundColor Yellow
        Write-Host "   Check manually: http://localhost:11434" -ForegroundColor Gray
    }
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "✅ Ollama will now start automatically when you log in" -ForegroundColor Green
Write-Host "`nTo manage the task:" -ForegroundColor Gray
Write-Host "  • View: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "  • Start: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "  • Stop: Stop-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "  • Remove: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor White

Write-Host "`nTo verify Ollama is running:" -ForegroundColor Gray
Write-Host "  • Open browser: http://localhost:11434" -ForegroundColor White
Write-Host "  • Or run: Invoke-WebRequest http://localhost:11434/api/tags" -ForegroundColor White

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Restart your computer (or start the task manually)" -ForegroundColor White
Write-Host "2. Verify Ollama is running: http://localhost:11434" -ForegroundColor White
Write-Host "3. Run model verification: .\scripts\verify-ollama-models.ps1" -ForegroundColor White
Write-Host "4. Configure Augment MCP servers" -ForegroundColor White

Write-Host ""

