# FREE Agent Sandbox - Hermetic Execution Environment
# 
# This Docker image provides a secure, isolated environment for running
# generated code with quality gates (format, lint, type, test, security).
#
# Features:
# - Node.js 20 LTS
# - TypeScript 5.x
# - Jest for testing
# - ESLint for linting
# - Prettier for formatting
# - No network access (air-gapped)
# - Resource limits (CPU, memory, time)
# - Read-only filesystem (except /workspace)

FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
# Use GID/UID 1001 to avoid conflicts with existing groups
RUN addgroup -g 1001 sandbox && \
    adduser -D -u 1001 -G sandbox sandbox

# Create workspace directory
RUN mkdir -p /workspace && \
    chown -R sandbox:sandbox /workspace

# Set working directory
WORKDIR /workspace

# Install global tools as root
RUN npm install -g \
    typescript@5.3.3 \
    ts-node@10.9.2 \
    prettier@3.1.1 \
    eslint@8.56.0 \
    jest@29.7.0 \
    && npm cache clean --force

# Copy package.json template for sandbox projects
COPY --chown=sandbox:sandbox package.json.template /opt/sandbox/package.json.template
COPY --chown=sandbox:sandbox tsconfig.json.template /opt/sandbox/tsconfig.json.template
COPY --chown=sandbox:sandbox jest.config.js.template /opt/sandbox/jest.config.js.template
COPY --chown=sandbox:sandbox .eslintrc.json.template /opt/sandbox/.eslintrc.json.template
COPY --chown=sandbox:sandbox .prettierrc.json.template /opt/sandbox/.prettierrc.json.template

# Switch to non-root user
USER sandbox

# Set environment variables
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

# Default command (will be overridden)
CMD ["/bin/sh"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Labels
LABEL maintainer="Robinson AI"
LABEL description="Hermetic sandbox for FREE Agent code execution"
LABEL version="1.0.0"

