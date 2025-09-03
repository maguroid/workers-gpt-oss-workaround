#!/usr/bin/env bash
set -euo pipefail

# Helper to call POST /text-input-object with a JSON payload file.
# The JSON must conform to src/schema.ts (GptOssTextGenerationInputSchema):
# {
#   "instructions": "optional string",
#   "input": "string" | [ { "role": "developer"|"user", "content": "..." }, ... ]
# }
#
# Usage:
#   scripts/curl-object.sh payload.json
#
# Options via env vars:
#   BASE_URL   Base URL of the worker (default: http://localhost:8787)

BASE_URL=${BASE_URL:-http://localhost:8787}

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 path/to/payload.json" >&2
  exit 1
fi

PAYLOAD_FILE=$1

if [[ ! -f "$PAYLOAD_FILE" ]]; then
  echo "File not found: $PAYLOAD_FILE" >&2
  exit 1
fi

curl -sS \
  -X POST \
  -H 'Content-Type: application/json' \
  --data-binary @"$PAYLOAD_FILE" \
  "$BASE_URL/structured-output"
echo
