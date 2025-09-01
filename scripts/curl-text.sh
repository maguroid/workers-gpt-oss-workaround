#!/usr/bin/env bash
set -euo pipefail

# Simple helper to call POST /text-input with a plain text prompt.
#
# Usage:
#   scripts/curl-text.sh "Hello world"
#   echo "Hello from stdin" | scripts/curl-text.sh
#
# Options via env vars:
#   BASE_URL   Base URL of the worker (default: http://localhost:8787)

BASE_URL=${BASE_URL:-http://localhost:8787}

# Read prompt from arg or stdin
if [[ $# -ge 1 ]]; then
  PROMPT=$1
else
  # Read all from stdin if no arg
  if [ -t 0 ]; then
    echo "Usage: $0 \"your prompt...\"" >&2
    exit 1
  fi
  PROMPT=$(cat)
fi

curl -sS \
  -X POST \
  -H 'Content-Type: text/plain; charset=utf-8' \
  --data-binary @- \
  "$BASE_URL/text-input" <<<"$PROMPT"
echo

