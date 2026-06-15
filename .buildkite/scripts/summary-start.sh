#!/usr/bin/env bash
# Writes a "build started" summary annotation at the top of the build, modelled
# on the build header in the Buildkite UI: title, build number, branch, commit,
# author, and the list of stages this pipeline will run.
set -euo pipefail

short_sha="${BUILDKITE_COMMIT:0:7}"
# Keep the message to its first line so the annotation stays compact.
subject="$(printf '%s' "${BUILDKITE_MESSAGE:-}" | head -n 1)"

buildkite-agent annotate --style info --context build-summary <<MARKDOWN
### :buildkite: Build #${BUILDKITE_BUILD_NUMBER} started

**${subject}**

| | |
|---|---|
| **Pipeline** | \`${BUILDKITE_PIPELINE_SLUG}\` |
| **Branch** | \`${BUILDKITE_BRANCH}\` |
| **Commit** | \`${short_sha}\` |
| **Author** | ${BUILDKITE_BUILD_AUTHOR:-${BUILDKITE_BUILD_CREATOR:-unknown}} |

**Stages:** :docker: Build → :lock_with_ink_pen: Lint &amp; Security → :test_tube: Tests → :junit: Annotate → :rocket: Deploy

[View build](${BUILDKITE_BUILD_URL})
MARKDOWN
