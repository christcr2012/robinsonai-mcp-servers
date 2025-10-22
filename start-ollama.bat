@echo off
REM Auto-start Ollama for Robinson AI Systems MCP Servers
REM Place this in Windows Startup folder for auto-start on login

echo Starting Ollama...
start "" "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe" serve

echo Ollama started in background!
echo You can close this window.
timeout /t 3

