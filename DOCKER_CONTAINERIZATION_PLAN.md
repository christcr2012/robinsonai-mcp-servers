# 🐳 Docker Containerization Plan for Robinson AI MCP Servers

**Date:** 2025-10-31  
**Status:** Proposed  
**Goal:** Isolate dependencies across multiple projects with different Python/Node versions

---

## 🎯 Problem Statement

**Current Issues:**
1. Windows doesn't have the same Python version that certain projects require
2. Multiple projects with different dependency requirements
3. Dependency conflicts between projects
4. Difficult to maintain consistent development environment

**Solution:** Docker containerization for development environment

---

## 🏗️ Proposed Architecture

### Option 1: Dev Container (Recommended)
**Use VS Code Dev Containers to run entire development environment in Docker**

**Pros:**
- ✅ Full IDE integration (IntelliSense, debugging, extensions)
- ✅ Seamless experience (feels like local development)
- ✅ Automatic port forwarding
- ✅ Git integration works perfectly
- ✅ Can run multiple projects in separate containers
- ✅ Easy to share with team (`.devcontainer/devcontainer.json`)

**Cons:**
- ⚠️ Requires Docker Desktop (you already have this)
- ⚠️ Initial setup time (~5-10 minutes)
- ⚠️ Slightly slower file I/O on Windows (use WSL2 to mitigate)

### Option 2: Docker Compose for Services
**Run each MCP server as a separate Docker service**

**Pros:**
- ✅ Complete isolation between services
- ✅ Easy to scale and deploy
- ✅ Production-like environment

**Cons:**
- ❌ More complex setup
- ❌ Harder to debug
- ❌ Less IDE integration

### Option 3: Hybrid Approach (Best of Both Worlds)
**Dev Container for development + Docker Compose for testing**

**Pros:**
- ✅ Best developer experience (Dev Container)
- ✅ Production-like testing (Docker Compose)
- ✅ Flexibility

**Cons:**
- ⚠️ More configuration files

---

## 📋 Recommended Solution: Dev Container + Docker Compose

### Phase 1: Dev Container Setup

**Create `.devcontainer/devcontainer.json`:**
```json
{
  "name": "Robinson AI MCP Servers",
  "dockerComposeFile": "docker-compose.yml",
  "service": "dev",
  "workspaceFolder": "/workspace",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-python.python",
        "ms-python.vscode-pylance",
        "golang.go",
        "rust-lang.rust-analyzer"
      ],
      "settings": {
        "terminal.integrated.defaultProfile.linux": "bash"
      }
    }
  },
  "forwardPorts": [3000, 5000, 8000, 11434],
  "postCreateCommand": "npm install && npm run build",
  "remoteUser": "node"
}
```

**Create `.devcontainer/docker-compose.yml`:**
```yaml
version: '3.8'

services:
  dev:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
      - node_modules:/workspace/node_modules
      - ~/.ssh:/home/node/.ssh:ro
      - ~/.gitconfig:/home/node/.gitconfig:ro
    command: sleep infinity
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    networks:
      - mcp-network

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    networks:
      - mcp-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mcp_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - mcp-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - mcp-network

volumes:
  node_modules:
  ollama_data:
  postgres_data:
  redis_data:

networks:
  mcp-network:
    driver: bridge
```

**Create `.devcontainer/Dockerfile`:**
```dockerfile
FROM node:20-bullseye

# Install Python 3.9 (Debian Bullseye default)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-venv \
    python3-pip \
    git \
    curl \
    wget \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Go
RUN wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.5.linux-amd64.tar.gz && \
    rm go1.21.5.linux-amd64.tar.gz
ENV PATH=$PATH:/usr/local/go/bin

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install global npm packages
RUN npm install -g typescript ts-node pnpm

# Create non-root user
RUN useradd -m -s /bin/bash node && \
    mkdir -p /workspace && \
    chown -R node:node /workspace

USER node
WORKDIR /workspace

# Install Python packages
RUN python3 -m pip install --user \
    black \
    pylint \
    pytest \
    mypy

CMD ["bash"]
```

### Phase 2: Docker Compose for Testing

**Create `docker-compose.test.yml`:**
```yaml
version: '3.8'

services:
  free-agent-mcp:
    build:
      context: .
      dockerfile: packages/free-agent-mcp/Dockerfile
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - MAX_OLLAMA_CONCURRENCY=5
    depends_on:
      - ollama
      - postgres
    networks:
      - mcp-network

  paid-agent-mcp:
    build:
      context: .
      dockerfile: packages/paid-agent-mcp/Dockerfile
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - postgres
    networks:
      - mcp-network

  robinsons-toolkit-mcp:
    build:
      context: .
      dockerfile: packages/robinsons-toolkit-mcp/Dockerfile
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - VERCEL_TOKEN=${VERCEL_TOKEN}
      - NEON_API_KEY=${NEON_API_KEY}
    networks:
      - mcp-network

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    networks:
      - mcp-network

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mcp_test
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    networks:
      - mcp-network

volumes:
  ollama_data:
  postgres_test_data:

networks:
  mcp-network:
    driver: bridge
```

---

## 🚀 Implementation Steps

### Step 1: Create Dev Container Files
```bash
mkdir -p .devcontainer
# Create devcontainer.json, docker-compose.yml, Dockerfile
```

### Step 2: Open in Dev Container
1. Open VS Code
2. Press `F1` → "Dev Containers: Reopen in Container"
3. Wait for container to build (~5-10 minutes first time)
4. VS Code will reopen inside container

### Step 3: Verify Setup
```bash
# Inside container
node --version  # Should be v20.x
python3 --version  # Should be 3.9.x
go version  # Should be 1.21.x
rustc --version  # Should be latest

# Test Ollama connection
curl http://ollama:11434/api/tags

# Test Postgres connection
psql -h postgres -U postgres -d mcp_dev
```

### Step 4: Install Dependencies
```bash
npm install
npm run build
```

### Step 5: Test MCP Servers
```bash
# Test FREE agent
npm start -w @robinsonai/free-agent-mcp

# Test PAID agent
npm start -w @robinsonai/paid-agent-mcp
```

---

## 📊 Benefits

### Dependency Isolation
- ✅ Each project can have different Python versions
- ✅ No conflicts between Node.js versions
- ✅ Isolated npm/pip packages
- ✅ Clean environment every time

### Consistency
- ✅ Same environment on all machines
- ✅ Same environment for all team members
- ✅ Same environment in CI/CD
- ✅ Reproducible builds

### Flexibility
- ✅ Easy to switch between projects
- ✅ Easy to test different configurations
- ✅ Easy to reset environment (rebuild container)
- ✅ Easy to share with team

### Performance
- ✅ WSL2 backend for fast file I/O
- ✅ Volume mounts for node_modules (faster)
- ✅ Cached builds (faster rebuilds)
- ✅ Parallel service startup

---

## 🎯 Next Steps

1. **Create Dev Container files** (I can do this for you)
2. **Test Dev Container** (open in VS Code)
3. **Verify all services work** (Ollama, Postgres, Redis)
4. **Update documentation** (README.md)
5. **Share with team** (commit .devcontainer/)

**Should I create these files for you?**

