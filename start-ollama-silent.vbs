' Silent Ollama Auto-Start for Robinson AI Systems
' This script starts Ollama completely silently (no windows, no notifications)
' Perfect for Windows Startup folder

Set WshShell = CreateObject("WScript.Shell")

' Check if Ollama is already running
Set objWMIService = GetObject("winmgmts:\\.\root\cimv2")
Set colProcesses = objWMIService.ExecQuery("SELECT * FROM Win32_Process WHERE Name = 'ollama.exe'")

If colProcesses.Count > 0 Then
    ' Ollama is already running, exit silently
    WScript.Quit
End If

' Start Ollama in completely hidden mode
WshShell.Run """C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe"" serve", 0, False

' Exit silently
WScript.Quit

