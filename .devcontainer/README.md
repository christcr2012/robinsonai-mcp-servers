# 🐳 Robinson AI MCP Servers - Dev Container

This directory contains the VS Code Dev Container configuration for the Robinson AI MCP Servers project.

## 🚀 Quick Start

### Prerequisites
1. **Docker Desktop** - Already installed ✅
2. **VS Code** - With "Dev Containers" extension
3. **WSL2** (Windows) - For better performance

### Open in Dev Container

**Option 1: VS Code Command Palette**
1. Open this project in VS Code
2. Press `F1` or `Ctrl+Shift+P`
3. Type "Dev Containers: Reopen in Container"
4. Wait for container to build (~5-10 minutes first time)
5. VS Code will reopen inside the container

**Option 2: VS Code Notification**
1. Open this project in VS Code
2. Click "Reopen in Container" when prompted
3. Wait for container to build

**Option 3: Command Line**
```bash
# From project root
code .
# Then use Command Palette (F1) → "Reopen in Container"
```

---

## 📦 What's Included

### Languages & Runtimes
- **Node.js 20** - JavaScript/TypeScript runtime
- **Python 3.9** - Python runtime (Debian Bullseye default)
- **Go 1.21** - Go runtime
- **Rust (latest)** - Rust runtime

### Tools & Utilities
- **TypeScript** - TypeScript compiler
- **ts-node** - TypeScript execution
- **pnpm/yarn** - Package managers
- **black** - Python formatter
- **pylint** - Python linter
- **pytest** - Python testing
- **cargo** - Rust package manager
- **go tools** - Go development tools

### Services
- **Ollama** - Local LLM server (port 11434)
- **PostgreSQL 16** - Database (port 5432)
- **Redis 7** - Cache (port 6379)

### VS Code Extensions
- ESLint
- Prettier
- Python
- Pylance
- Black Formatter
- Go
- Rust Analyzer
- Tailwind CSS
- Prisma
- Docker
- GitLens
- GitHub Copilot

---

## 🔧 Configuration

### Environment Variables

The following environment variables are automatically set:

```bash
# Ollama
OLLAMA_BASE_URL=http://ollama:11434
MAX_OLLAMA_CONCURRENCY=5

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mcp_dev

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Node
NODE_ENV=development

# Python
PYTHONUNBUFFERED=1
```

### Port Forwarding

The following ports are automatically forwarded:

| Port | Service | Label |
|------|---------|-------|
| 3000 | Web App | Web App |
| 5000 | API Server | API Server |
| 11434 | Ollama | Ollama |
| 5432 | PostgreSQL | PostgreSQL |
| 6379 | Redis | Redis |

---

## 🧪 Testing the Setup

### 1. Verify Languages

```bash
# Node.js
node --version  # Should be v20.x

# Python
python3 --version  # Should be 3.9.x

# Go
go version  # Should be 1.21.x

# Rust
rustc --version  # Should be latest stable
```

### 2. Verify Services

```bash
# Ollama
curl http://ollama:11434/api/tags

# PostgreSQL
psql -h postgres -U postgres -d mcp_dev -c "SELECT version();"

# Redis
redis-cli -h redis ping
```

### 3. Install Dependencies

```bash
# Install npm packages
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### 4. Test MCP Servers

```bash
# Test FREE agent
npm start -w @robinsonai/free-agent-mcp

# Test PAID agent
npm start -w @robinsonai/paid-agent-mcp

# Test Robinson's Toolkit
npm start -w @robinsonai/robinsons-toolkit-mcp
```

---

## 📁 Volume Mounts

### Performance Optimization

The Dev Container uses named volumes for better performance:

- `node_modules` - npm packages (faster installs)
- `python_packages` - Python packages
- `cargo_registry` - Rust packages
- `go_pkg` - Go packages

### Data Persistence

The following data is persisted across container rebuilds:

- `ollama_data` - Ollama models
- `postgres_data` - PostgreSQL databases
- `redis_data` - Redis data

---

## 🛠️ Troubleshooting

### Container Won't Start

**Problem:** Container fails to build or start

**Solution:**
1. Check Docker Desktop is running
2. Check WSL2 is enabled (Windows)
3. Rebuild container: `F1` → "Dev Containers: Rebuild Container"
4. Check Docker logs: `docker logs mcp-dev`

### Slow Performance

**Problem:** File I/O is slow

**Solution:**
1. Use WSL2 backend (Windows)
2. Move project to WSL2 filesystem
3. Use named volumes for node_modules

### Ollama Not Responding

**Problem:** Ollama service not available

**Solution:**
1. Check Ollama container: `docker ps | grep ollama`
2. Restart Ollama: `docker restart mcp-ollama`
3. Check logs: `docker logs mcp-ollama`
4. Pull models: `docker exec mcp-ollama ollama pull qwen2.5:3b`

### PostgreSQL Connection Failed

**Problem:** Can't connect to PostgreSQL

**Solution:**
1. Check PostgreSQL container: `docker ps | grep postgres`
2. Restart PostgreSQL: `docker restart mcp-postgres`
3. Check logs: `docker logs mcp-postgres`
4. Verify credentials in `.devcontainer/docker-compose.yml`

---

## 🔄 Updating the Container

### Rebuild Container

When you update the Dockerfile or docker-compose.yml:

1. Press `F1`
2. Type "Dev Containers: Rebuild Container"
3. Wait for rebuild to complete

### Update Dependencies

```bash
# Update npm packages
npm update

# Update Python packages
python3 -m pip install --user --upgrade pip setuptools wheel

# Update Go tools
go get -u all

# Update Rust
rustup update
```

---

## 📚 Additional Resources

- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Docker Documentation](https://docs.docker.com/)
- [Ollama Documentation](https://ollama.ai/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

---

## 🎯 Next Steps

1. ✅ Open project in Dev Container
2. ✅ Verify all services are running
3. ✅ Install dependencies (`npm install`)
4. ✅ Build packages (`npm run build`)
5. ✅ Test MCP servers
6. ✅ Start developing!

**Happy coding! 🚀**

