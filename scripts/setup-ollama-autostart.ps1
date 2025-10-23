# Setup Ollama Auto-Start on Windows
# Run this script as Administrator

Write-Host "Setting up Ollama to auto-start at logon..." -ForegroundColor Cyan

$Action = New-ScheduledTaskAction -Execute "C:\Program Files\Ollama\ollama.exe" -Argument "serve"
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

try {
    Register-ScheduledTask -TaskName "OllamaAutoStart" -Action $Action -Trigger $Trigger -Settings $Settings -RunLevel Highest -Force
    Write-Host "✅ Ollama auto-start configured successfully!" -ForegroundColor Green
    Write-Host "Ollama will start automatically when you log in." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create scheduled task: $_" -ForegroundColor Red
    Write-Host "Make sure you're running PowerShell as Administrator." -ForegroundColor Yellow
}

