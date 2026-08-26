#!/usr/bin/env bash
set -euo pipefail

count="${S1_FANOUT_COUNT:-120}"

if ! [[ "$count" =~ ^[0-9]+$ ]] || (( count < 1 || count > 400 )); then
  echo "S1_FANOUT_COUNT must be an integer from 1 to 400" >&2
  exit 64
fi

printf 'steps:\n'
for ((i = 1; i <= count; i++)); do
  number="$(printf '%03d' "$i")"
  printf '  - label: "S1 / Blocked fan-out %s"\n' "$number"
  printf '    key: "s1-fanout-%s"\n' "$number"
  printf "    command: \"echo 'S1 downstream %s released by approval'; sleep 5\"\n" "$number"
  printf '    depends_on: "s1-approval"\n'
done
