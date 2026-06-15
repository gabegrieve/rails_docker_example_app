#!/usr/bin/env bash
# Writes a "build finished" summary annotation, modelled on the results panel in
# the Buildkite UI: a test totals line (passed / failed / skipped) plus an
# overall pass/fail verdict. Counts are summed from the JUnit XML artifacts that
# the test steps upload; if none are found it falls back to a generic message.
set -euo pipefail

reports_dir="$(mktemp -d)"
# Pull down whatever JUnit reports the test steps produced.
buildkite-agent artifact download "test/reports/**/*.xml" "$reports_dir" 2>/dev/null || true

tests=0 failures=0 errors=0 skipped=0

# Pull a numeric attribute (e.g. tests="42") out of a single XML element string.
attr() { printf '%s' "$1" | grep -oE "$2=\"[0-9]+\"" | head -n1 | grep -oE '[0-9]+' || echo 0; }

while IFS= read -r -d '' xml; do
  # Each JUnit file has one root <testsuites> (or <testsuite>) element carrying
  # the rolled-up totals; read the first such element and add its counts.
  root="$(grep -oE '<testsuites?[^>]*>' "$xml" | head -n 1)"
  [ -z "$root" ] && continue
  tests=$((tests + $(attr "$root" tests)))
  failures=$((failures + $(attr "$root" failures)))
  errors=$((errors + $(attr "$root" errors)))
  skipped=$((skipped + $(attr "$root" skipped)))
done < <(find "$reports_dir" -name '*.xml' -print0 2>/dev/null)

failed=$((failures + errors))
passed=$((tests - failed - skipped))
(( passed < 0 )) && passed=0

if (( tests > 0 )); then
  totals="**${tests}** tests — :white_check_mark: ${passed} passed, :x: ${failed} failed, :fast_forward: ${skipped} skipped"
else
  totals="_No JUnit reports were found for this build._"
fi

if (( failed > 0 )); then
  style="error"
  verdict=":red_circle: Build #${BUILDKITE_BUILD_NUMBER} finished with **${failed} failing test(s)**"
else
  style="success"
  verdict=":large_green_circle: Build #${BUILDKITE_BUILD_NUMBER} finished — **all tests green**"
fi

buildkite-agent annotate --style "$style" --context build-summary-end <<MARKDOWN
### ${verdict}

${totals}

| | |
|---|---|
| **Branch** | \`${BUILDKITE_BRANCH}\` |
| **Commit** | \`${BUILDKITE_COMMIT:0:7}\` |

[View build](${BUILDKITE_BUILD_URL})
MARKDOWN
