# Robinson AI MCP Servers - Development Container
# Supports: Node.js, Python, Go, Rust

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-bullseye

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# Configure apt and install packages
RUN apt-get update \
    && apt-get -y install --no-install-recommends \
    # Common utilities
    apt-utils \
    dialog \
    git \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    # Build tools
    build-essential \
    gcc \
    g++ \
    make \
    cmake \
    pkg-config \
    # Python dependencies (use default Python 3.9 from Bullseye)
    python3 \
    python3-venv \
    python3-dev \
    python3-pip \
    # Database clients
    postgresql-client \
    redis-tools \
    # Other tools
    vim \
    nano \
    htop \
    jq \
    zip \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Create symlinks for python3.11 compatibility (points to python3.9)
RUN ln -sf /usr/bin/python3 /usr/bin/python3.11 \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Install Docker CLI (for Docker-in-Docker)
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null \
    && apt-get update \
    && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# Install Go
ARG GO_VERSION=1.21.5
RUN wget https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz \
    && tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz \
    && rm go${GO_VERSION}.linux-amd64.tar.gz
ENV PATH=$PATH:/usr/local/go/bin
ENV GOPATH=/home/node/go
ENV PATH=$PATH:$GOPATH/bin

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"

# Install global npm packages
RUN npm install -g \
    typescript \
    ts-node \
    pnpm \
    yarn \
    @modelcontextprotocol/inspector \
    nodemon \
    pm2

# Create non-root user
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Ensure node user exists and has correct UID/GID
RUN if [ "$USER_UID" != "1000" ] || [ "$USER_GID" != "1000" ]; then \
    groupmod --gid $USER_GID node \
    && usermod --uid $USER_UID --gid $USER_GID node \
    && chown -R $USER_UID:$USER_GID /home/node; \
    fi

# Add node user to docker group (for Docker-in-Docker)
RUN groupadd -f docker && usermod -aG docker node

# Switch to node user
USER node

# Install Python packages for node user
RUN python3 -m pip install --user --upgrade pip setuptools wheel \
    && python3 -m pip install --user \
    black \
    pylint \
    pytest \
    pytest-cov \
    mypy \
    flake8 \
    autopep8 \
    ipython \
    jupyter

# Install Rust tools for node user
RUN /root/.cargo/bin/cargo install \
    cargo-watch \
    cargo-edit \
    cargo-outdated

# Install Go tools for node user
RUN go install golang.org/x/tools/gopls@latest \
    && go install github.com/go-delve/delve/cmd/dlv@latest \
    && go install honnef.co/go/tools/cmd/staticcheck@latest

# Set up workspace
WORKDIR /workspace

# Configure git (will be overridden by mounted .gitconfig)
RUN git config --global init.defaultBranch main \
    && git config --global core.autocrlf input

# Set environment variables
ENV SHELL=/bin/bash
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# Switch back to dialog for any ad-hoc use of apt-get
ENV DEBIAN_FRONTEND=dialog

# Default command
CMD ["bash"]

