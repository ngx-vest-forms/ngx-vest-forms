#!/usr/bin/env bash
# Fails when a workflow references a remote action by anything other than a
# 40-hex commit SHA (ADR-0001: SHA-Pinned Workflow Actions).
#
# Reads the `uses:` value itself, so the SHA must be the ref, not a comment.
# Covers `uses:` as its own key and as the first key of a list item
# (`- uses: owner/repo@ref`). Local actions (`./...`) and `docker://` images
# are out of scope.
#
# Textual, not a YAML parser: a `uses:` line inside a `run: |` block is
# checked too, and a block scalar (`uses: >-`) or a flow mapping
# (`- {uses: ...}`) is not understood. Write refs as plain `uses: owner/repo@sha`.
#
# Usage: check-action-pins.sh [dir]   (default: .github/workflows)
set -euo pipefail

dir="${1:-.github/workflows}"

shopt -s nullglob
files=("$dir"/*.yml "$dir"/*.yaml)
shopt -u nullglob

if [ "${#files[@]}" -eq 0 ]; then
  echo "::error::SHA-pin check found no workflow files in $dir"
  exit 2
fi

unpinned=$(awk -v q="'" '
  match($0, /^[[:space:]]*(-[[:space:]]+)?uses:[[:space:]]*/) {
    value = substr($0, RLENGTH + 1)
    sub(/[[:space:]]+#.*$/, "", value)
    sub(/[[:space:]]+$/, "", value)
    gsub("^[\"" q "]|[\"" q "]$", "", value)
    if (value ~ /^\.\// || value ~ /^docker:\/\//) next
    ref = value
    if (!sub(/^.*@/, "", ref) || length(ref) != 40 || ref ~ /[^0-9a-f]/) {
      print FILENAME ":" FNR ": " value
    }
  }
' "${files[@]}") || {
  echo "::error::SHA-pin scan failed to read the workflow files in $dir"
  exit 2
}

if [ -n "$unpinned" ]; then
  echo "::error::Workflow actions must be pinned to a lowercase 40-hex commit SHA (ADR-0001: SHA-Pinned Workflow Actions):"
  echo "$unpinned"
  exit 1
fi

echo "All ${#files[@]} workflow files pin their actions to commit SHAs."
