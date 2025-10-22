# Ollama Auto-Start Setup Guide

**For Robinson AI Systems MCP Servers**  
**Date:** 2025-10-21

---

## 🎯 Goal

Keep Ollama running automatically so Architect MCP and Autonomous Agent MCP can use local LLMs without manual intervention.

---

## 📋 Available Solutions

I've created **4 different solutions** - choose the one that fits your needs:

| Solution | Complexity | Visibility | Best For |
|----------|-----------|------------|----------|
| **1. Startup Folder** | ⭐ Easy | Visible window | Quick setup, testing |
| **2. PowerShell Hidden** | ⭐⭐ Medium | Hidden window | Daily use, manual control |
| **3. VBS Silent** | ⭐ Easy | Completely silent | Set-and-forget |
| **4. Task Scheduler** | ⭐⭐⭐ Advanced | Silent, robust | Production use |

---

## ✅ **RECOMMENDED: Solution 3 - VBS Silent Startup**

**Why this is best for you:**
- ✅ Completely silent (no windows, no notifications)
- ✅ Starts automatically on login
- ✅ Checks if Ollama is already running (no duplicates)
- ✅ Easy to set up (just copy one file)
- ✅ Easy to disable (just delete the shortcut)

### **Setup Steps:**

1. **Copy the VBS file to Startup folder:**
   ```powershell
   # Run this in PowerShell:
   $startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
   Copy-Item "start-ollama-silent.vbs" "$startupFolder\start-ollama-silent.vbs"
   ```

2. **Test it now:**
   ```powershell
   # Double-click the file or run:
   wscript.exe start-ollama-silent.vbs
   ```

3. **Verify Ollama is running:**
   ```powershell
   curl http://localhost:11434/api/tags
   ```

4. **Done!** Ollama will now start automatically every time you log in.

### **To Disable Later:**
```powershell
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\start-ollama-silent.vbs"
```

---

## 🔧 Alternative Solutions

### **Solution 1: Startup Folder (Visible Window)**

**Pros:** Simple, easy to see if it's running  
**Cons:** Shows a command window

**Setup:**
```powershell
$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
Copy-Item "start-ollama.bat" "$startupFolder\start-ollama.bat"
```

---

### **Solution 2: PowerShell Hidden Window**

**Pros:** Hidden window, checks if already running, verifies connection  
**Cons:** Requires PowerShell execution policy

**Setup:**
```powershell
# 1. Allow PowerShell scripts (run as Administrator):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 2. Copy to Startup folder:
$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
Copy-Item "start-ollama-hidden.ps1" "$startupFolder\start-ollama-hidden.ps1"

# 3. Create a shortcut that runs it hidden:
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$startupFolder\Start Ollama.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startupFolder\start-ollama-hidden.ps1`""
$Shortcut.Save()
```

---

### **Solution 4: Task Scheduler (Most Robust)**

**Pros:** Most reliable, runs even if you close the window, survives reboots  
**Cons:** Requires Administrator privileges

**Setup:**
```powershell
# Run as Administrator:
.\setup-ollama-task-scheduler.ps1
```

This creates a Windows Task that:
- ✅ Starts Ollama at login
- ✅ Runs in background (hidden)
- ✅ Restarts if it crashes
- ✅ Works even on battery power

**To test the task:**
```powershell
Start-ScheduledTask -TaskName "Ollama Auto-Start"
```

**To remove the task:**
```powershell
Unregister-ScheduledTask -TaskName "Ollama Auto-Start" -Confirm:$false
```

---

## 🧪 Testing

After setting up any solution, test it:

### **1. Check if Ollama is running:**
```powershell
Get-Process -Name "ollama" -ErrorAction SilentlyContinue
```

### **2. Test the API:**
```powershell
curl http://localhost:11434/api/tags
```

### **3. Test with Architect MCP:**
In Augment Code, try:
```typescript
index_repo({ path: "c:/Users/chris/Git Local/robinsonai-mcp-servers" })
```

Should work without errors!

---

## 🔍 Troubleshooting

### **Ollama not starting?**

1. **Check if it's already running:**
   ```powershell
   Get-Process -Name "ollama"
   ```

2. **Kill existing processes:**
   ```powershell
   Stop-Process -Name "ollama" -Force
   ```

3. **Start manually to see errors:**
   ```powershell
   ollama serve
   ```

### **Multiple Ollama instances?**

All scripts check if Ollama is already running before starting a new instance. If you see multiple instances:

```powershell
# Kill all Ollama processes:
Stop-Process -Name "ollama" -Force

# Start fresh:
ollama serve
```

### **Startup script not running?**

1. **Check Startup folder:**
   ```powershell
   explorer "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
   ```

2. **Verify file is there:**
   - For VBS: `start-ollama-silent.vbs`
   - For BAT: `start-ollama.bat`
   - For PS1: `start-ollama-hidden.ps1` or shortcut

3. **Test manually:**
   - Double-click the file
   - Check if Ollama starts

---

## 📊 Comparison

| Feature | Startup BAT | PowerShell | VBS Silent | Task Scheduler |
|---------|-------------|------------|------------|----------------|
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Silent Operation** | ❌ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Reliability** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Duplicate Prevention** | ❌ | ✅ | ✅ | ✅ |
| **Admin Required** | ❌ | ❌ | ❌ | ✅ |
| **Easy to Disable** | ✅ | ✅ | ✅ | ⭐⭐ |

---

## 🎯 My Recommendation

**For you (truck driver, practical, cost-conscious):**

Use **Solution 3: VBS Silent Startup**

**Why:**
- ✅ Set it and forget it
- ✅ No windows popping up
- ✅ No admin rights needed
- ✅ Easy to disable if needed
- ✅ Works perfectly for your use case

**Quick setup:**
```powershell
$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
Copy-Item "start-ollama-silent.vbs" "$startupFolder\start-ollama-silent.vbs"
```

**Test it:**
```powershell
wscript.exe start-ollama-silent.vbs
curl http://localhost:11434/api/tags
```

**Done!** Ollama will now start automatically every time you log in, completely silently.

---

## 📝 Files Created

1. ✅ `start-ollama.bat` - Simple startup script (visible window)
2. ✅ `start-ollama-hidden.ps1` - PowerShell script (hidden window)
3. ✅ `start-ollama-silent.vbs` - VBS script (completely silent) **← RECOMMENDED**
4. ✅ `setup-ollama-task-scheduler.ps1` - Task Scheduler setup (most robust)
5. ✅ `OLLAMA_AUTO_START_GUIDE.md` - This guide

---

**Ready to set up Ollama auto-start!** 🚀

Choose your preferred solution and follow the setup steps above.

