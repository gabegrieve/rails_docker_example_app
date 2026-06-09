#!/usr/bin/env bash
# Writes one annotation in each available style so you can see them all in the
# build UI. Each uses a distinct --context so they render as separate blocks.
set -euo pipefail

buildkite-agent annotate "ℹ️  Informational annotation — links, **markdown**, and \`code\` all render." \
  --style info --context demo-info

buildkite-agent annotate "✅ Success annotation — e.g. \"all checks passed\"." \
  --style success --context demo-success

buildkite-agent annotate "⚠️  Warning annotation — e.g. \"3 dependencies are out of date\"." \
  --style warning --context demo-warning

buildkite-agent annotate "🚫 Error annotation — e.g. \"2 tests failed\" (purely illustrative here)." \
  --style error --context demo-error

# Annotations can be appended to incrementally.
buildkite-agent annotate --style info --context demo-info --append \
  $'\n\nAppended a second line to the info annotation.'
