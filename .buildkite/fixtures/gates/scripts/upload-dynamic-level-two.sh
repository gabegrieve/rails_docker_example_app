#!/usr/bin/env bash
set -euo pipefail

buildkite-agent pipeline upload .buildkite/fixtures/gates/dynamic/08-level-two.yml

