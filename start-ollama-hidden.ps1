# Auto-start Ollama in hidden window
# For Robinson AI Systems MCP Servers
# Run this at Windows startup for silent background operation

$ollamaPath = "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe"

# Check if Ollama is already running
$ollamaProcess = Get-Process -Name "ollama" -ErrorAction SilentlyContinue

if ($ollamaProcess) {
    Write-Host "Ollama is already running (PID: $($ollamaProcess.Id))"
    exit 0
}

# Start Ollama in hidden window
Write-Host "Starting Ollama in background..."

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $ollamaPath
$processInfo.Arguments = "serve"
$processInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$processInfo.CreateNoWindow = $true

$process = [System.Diagnostics.Process]::Start($processInfo)

Write-Host "Ollama started successfully (PID: $($process.Id))"
Write-Host "Ollama is now running in the background on http://localhost:11434"

# Wait a moment to verify it started
Start-Sleep -Seconds 2

# Test connection
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Ollama is responding correctly!"
} catch {
    Write-Host "⚠️ Ollama started but not responding yet. Give it a few more seconds."
}

