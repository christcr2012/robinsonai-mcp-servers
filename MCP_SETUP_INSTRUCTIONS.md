# MCP Server Setup Instructions

## 🎯 Quick Setup

### Option 1: Automated Setup (Recommended)
```powershell
# Run the automated setup script
.\setup-mcp-servers.ps1

# Test the configuration
.\test-mcp-connection.ps1
```

### Option 2: Manual Setup

#### For Augment Code (VS Code Extension)

1. **Import via Settings Panel:**
   - Open VS Code
   - Open Augment settings panel (gear icon in Augment panel)
   - Click "Import from JSON" in the MCP section
   - Paste the contents of `MCP_SERVERS_IMPORT.json`
   - Click Save

2. **Or use VS Code Settings:**
   - The `.vscode/settings.json` file has been created with MCP server configuration
   - Restart VS Code to load the new settings

#### For Auggie CLI

1. **Copy configuration:**
   ```powershell
   # Create .auggie directory if it doesn't exist
   mkdir "$env:USERPROFILE\.auggie" -Force
   
   # Copy the config file
   Copy-Item "auggie-config.json" "$env:USERPROFILE\.auggie\config.json"
   ```

2. **Test Auggie CLI:**
   ```bash
   auggie --help
   ```

## 🔧 MCP Servers Included

1. **FREE Agent MCP** - 0-credit code generation, analysis, refactoring, tests
2. **PAID Agent MCP** - Complex tasks requiring premium models  
3. **Robinson's Toolkit MCP** - 906 integration tools (GitHub, Vercel, Neon, etc.)
4. **Thinking Tools MCP** - 24 cognitive frameworks for planning
5. **Credit Optimizer MCP** - Tool discovery and templates
6. **OpenAI MCP** - Direct OpenAI API access

## 🧪 Testing

### Test MCP Server Installation
```powershell
# Test all servers
.\test-mcp-connection.ps1

# Test individual server
C:\nvm4w\nodejs\free-agent-mcp.cmd --help
```

### Test in Augment Code
1. Open VS Code with Augment extension
2. Open Augment Agent panel
3. Try a command like: "List available MCP tools"
4. Check if MCP servers appear in settings panel

### Test in Auggie CLI
```bash
# Start interactive mode
auggie

# Test MCP integration
/help
```

## 🚨 Troubleshooting

### MCP Servers Not Connecting
1. Verify binaries exist: `dir C:\nvm4w\nodejs\*-mcp.cmd`
2. Reinstall missing servers: `npm install -g @robinsonai/[server-name]`
3. Restart VS Code completely
4. Check Augment extension logs

### Auggie CLI Issues
1. Verify config file: `Get-Content "$env:USERPROFILE\.auggie\config.json"`
2. Check Auggie CLI installation: `auggie --version`
3. Verify MCP server paths in config match actual locations

### Permission Issues
1. Run PowerShell as Administrator
2. Check execution policy: `Get-ExecutionPolicy`
3. Set if needed: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

## 📁 Configuration Files

- **`.vscode/settings.json`** - VS Code/Augment Code MCP configuration
- **`auggie-config.json`** - Template for Auggie CLI configuration  
- **`$env:USERPROFILE\.auggie\config.json`** - Actual Auggie CLI config location
- **`MCP_SERVERS_IMPORT.json`** - Import format for Augment settings panel

## 🎉 Success Indicators

✅ All MCP server binaries found in `C:\nvm4w\nodejs\`  
✅ VS Code settings contain `augment.mcpServers` section  
✅ Auggie config exists at `~/.auggie/config.json`  
✅ MCP tools appear in Augment Agent  
✅ Auggie CLI responds to MCP commands  

## 📞 Support

If you encounter issues:
1. Run `.\test-mcp-connection.ps1` and share output
2. Check VS Code Developer Console for Augment extension errors
3. Verify all 6 MCP servers are globally installed via npm
