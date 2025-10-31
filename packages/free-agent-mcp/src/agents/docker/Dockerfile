# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim

# Base OS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash ca-certificates git python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Optional: add more language toolchains as needed
# RUN apt-get update && apt-get install -y --no-install-recommends golang
# RUN curl https://sh.rustup.rs -sSf | bash -s -- -y

WORKDIR /

# Preinstall common JS tooling (kept minimal)
RUN npm -g i ts-node typescript prettier eslint jest vitest 2>/dev/null || true

# Copy a tiny entrypoint that enforces non-root, sets up writable tmp dirs
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Default user
RUN useradd -m runner && chown -R runner:runner /home/runner
USER runner

ENTRYPOINT ["/entrypoint.sh"]

