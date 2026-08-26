#!/usr/bin/env bash
set -euo pipefail

fixture="${GATE_FIXTURE:-01-fanout}"

case "$fixture" in
  01-fanout|02-chained-approvals|03-blocked-failed|04-unblocked-failed|05-explicit-bypass|06-block-vs-input|07-group-local-gates|08-dynamic-wait|09-failure-policies|10-blocked-state-passed|10-blocked-state-running|10-blocked-state-failed)
    ;;
  *)
    echo "Unknown GATE_FIXTURE: $fixture" >&2
    echo "See .buildkite/fixtures/gates/README.md for valid values." >&2
    exit 64
    ;;
esac

pipeline=".buildkite/fixtures/gates/${fixture}.yml"
echo "Uploading gate UX fixture: ${fixture} (${pipeline})"
buildkite-agent pipeline upload "$pipeline"

