# Dev Container Troubleshooting

## Issue: Python 3.11 Not Available in Debian Bullseye

**Error:**
```
E: Unable to locate package python3.11
E: Couldn't find any package by glob 'python3.11'
```

**Root Cause:**
Debian Bullseye (the base image for Node.js 20) only includes Python 3.9 in its default repositories. Python 3.11 requires either:
1. Upgrading to Debian Bookworm
2. Adding the deadsnakes PPA (Ubuntu only)
3. Building from source

**Solution:**
We use Python 3.9 (Debian Bullseye default) instead of Python 3.11. This is sufficient for most development tasks and avoids the complexity of adding external repositories or building from source.

**Changes Made:**
1. Updated Dockerfile to install `python3` instead of `python3.11`
2. Created symlink `/usr/bin/python3.11 -> /usr/bin/python3` for compatibility
3. Updated all pip commands to use `python3` instead of `python3.11`
4. Updated documentation to reflect Python 3.9

**Python Version:**
- **Installed:** Python 3.9.x (Debian Bullseye default)
- **Symlink:** `/usr/bin/python3.11` points to `/usr/bin/python3` for compatibility
- **Pip:** Uses `python3 -m pip` for package installation

**Compatibility:**
Python 3.9 is compatible with most Python projects. If you specifically need Python 3.11, you have two options:

### Option 1: Upgrade to Debian Bookworm (Recommended)
Change the base image in `.devcontainer/Dockerfile`:
```dockerfile
FROM node:20-bookworm  # Instead of node:20-bullseye
```

Then install Python 3.11:
```dockerfile
RUN apt-get update && apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip
```

### Option 2: Build Python 3.11 from Source
Add to Dockerfile:
```dockerfile
RUN wget https://www.python.org/ftp/python/3.11.7/Python-3.11.7.tgz \
    && tar -xf Python-3.11.7.tgz \
    && cd Python-3.11.7 \
    && ./configure --enable-optimizations \
    && make -j$(nproc) \
    && make altinstall \
    && cd .. \
    && rm -rf Python-3.11.7*
```

**Note:** Both options increase build time significantly. Python 3.9 is recommended unless you have a specific requirement for 3.11.

---

## Other Common Issues

### Issue: Container Build Timeout

**Solution:**
Increase Docker Desktop memory allocation:
1. Open Docker Desktop
2. Settings → Resources → Advanced
3. Increase Memory to at least 4GB
4. Increase CPUs to at least 2
5. Apply & Restart

### Issue: Slow File I/O on Windows

**Solution:**
Use WSL2 backend:
1. Open Docker Desktop
2. Settings → General
3. Enable "Use the WSL 2 based engine"
4. Move project to WSL2 filesystem: `\\wsl$\Ubuntu\home\<user>\projects\`

### Issue: Port Already in Use

**Solution:**
Stop conflicting services:
```bash
# Check what's using the port
netstat -ano | findstr :11434  # Windows
lsof -i :11434  # Linux/Mac

# Stop the process or change the port in docker-compose.yml
```

### Issue: Ollama Not Responding

**Solution:**
1. Check Ollama container status:
   ```bash
   docker ps | grep ollama
   ```

2. Restart Ollama container:
   ```bash
   docker restart mcp-ollama
   ```

3. Check Ollama logs:
   ```bash
   docker logs mcp-ollama
   ```

4. Pull models manually:
   ```bash
   docker exec mcp-ollama ollama pull qwen2.5:3b
   ```

### Issue: PostgreSQL Connection Failed

**Solution:**
1. Check PostgreSQL container status:
   ```bash
   docker ps | grep postgres
   ```

2. Restart PostgreSQL container:
   ```bash
   docker restart mcp-postgres
   ```

3. Check PostgreSQL logs:
   ```bash
   docker logs mcp-postgres
   ```

4. Verify connection:
   ```bash
   psql -h postgres -U postgres -d mcp_dev
   ```

---

## Rebuilding the Container

If you make changes to the Dockerfile or docker-compose.yml, rebuild the container:

1. Press `F1` in VS Code
2. Type "Dev Containers: Rebuild Container"
3. Wait for rebuild to complete (~5-10 minutes)

Or from command line:
```bash
docker compose -f .devcontainer/docker-compose.yml build --no-cache
```

---

## Resetting Everything

If things are completely broken, reset everything:

1. Close VS Code
2. Remove all containers and volumes:
   ```bash
   docker compose -f .devcontainer/docker-compose.yml down -v
   ```
3. Remove Docker images:
   ```bash
   docker rmi $(docker images -q robinsonai-mcp-servers*)
   ```
4. Reopen in container (will rebuild from scratch)

---

## Getting Help

If you're still having issues:

1. Check Docker Desktop logs
2. Check VS Code Dev Containers logs (Output → Dev Containers)
3. Check container logs: `docker logs <container-name>`
4. Search GitHub issues: https://github.com/microsoft/vscode-remote-release/issues
5. Ask in Discord/Slack

---

## Useful Commands

```bash
# List all containers
docker ps -a

# List all volumes
docker volume ls

# List all networks
docker network ls

# Inspect a container
docker inspect <container-name>

# Execute command in container
docker exec -it <container-name> bash

# View container logs
docker logs -f <container-name>

# Remove all stopped containers
docker container prune

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune

# Remove all unused images
docker image prune -a
```

