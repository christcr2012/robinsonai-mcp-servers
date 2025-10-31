#!/usr/bin/env bash
set -euo pipefail
# Writable dirs when running with --read-only
mkdir -p /home/runner/.npm /home/runner/.cache /tmp
exec "$@"

