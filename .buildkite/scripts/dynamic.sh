#!/usr/bin/env bash
# Generates pipeline steps at runtime and prints them to stdout so they can be
# piped into `buildkite-agent pipeline upload`. This is how you build dynamic
# pipelines — fan out based on changed files, env, time of day, etc.
set -euo pipefail

# Example: emit one command step per "service" directory we pretend to find.
services=(api web worker)

echo "steps:"
for service in "${services[@]}"; do
  cat <<YAML
  - label: ":package: Dynamic step for ${service}"
    command: "echo 'Generated step for ${service} at $(date -u +%FT%TZ)'"
YAML
done
