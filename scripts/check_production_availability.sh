#!/usr/bin/env bash
set -Eeuo pipefail

SITE_URL="${DDA_SITE_URL:-https://dariusdigitalacademy.com}"
BFF_URL="${DDA_BFF_URL:-https://api.dariusdigitalacademy.com}"
SITE_URL="${SITE_URL%/}"
BFF_URL="${BFF_URL%/}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

request() {
  local expected="$1" url="$2" output="$3" status
  status="$(curl --silent --show-error --location \
    --retry 3 --retry-delay 2 --retry-all-errors --connect-timeout 10 --max-time 30 \
    --output "$output" --write-out '%{http_code}' "$url")" || {
      echo "FAIL $url — curl error" >&2
      return 1
    }
  if [[ "$status" != "$expected" ]]; then
    echo "FAIL $url — expected HTTP $expected, got HTTP $status" >&2
    sed -n '1,8p' "$output" >&2 || true
    return 1
  fi
  echo "PASS HTTP $status $url"
}

assert_json() {
  local file="$1" expression="$2" label="$3"
  python3 - "$file" "$expression" "$label" <<'PY'
import json
import sys

path, expression, label = sys.argv[1:]
try:
    with open(path, encoding="utf-8") as handle:
        value = json.load(handle)
except Exception as exc:
    print(f"FAIL {label} — invalid JSON: {exc}", file=sys.stderr)
    raise SystemExit(1)

checks = {
    "health": isinstance(value, dict) and value.get("status") == "ok",
    "brvm_items": isinstance(value, dict) and isinstance(value.get("items"), list),
}
if not checks.get(expression, False):
    print(f"FAIL {label} — unexpected JSON shape: {value!r}", file=sys.stderr)
    raise SystemExit(1)
print(f"PASS JSON {label}")
PY
}

request 200 "$SITE_URL/" "$TMP_DIR/site.html"
request 200 "$SITE_URL/academy.html" "$TMP_DIR/academy.html"
request 200 "$BFF_URL/healthz" "$TMP_DIR/healthz.json"
assert_json "$TMP_DIR/healthz.json" health "BFF healthz"
request 401 "$BFF_URL/v1/me" "$TMP_DIR/me.json"
request 401 "$BFF_URL/v1/premium/preview" "$TMP_DIR/premium.json"
request 200 "$BFF_URL/v1/publications/brvm" "$TMP_DIR/brvm.json"
assert_json "$TMP_DIR/brvm.json" brvm_items "BRVM publications"

final_site_url="$(curl --silent --show-error --location --max-time 30 --output /dev/null --write-out '%{url_effective}' "http://dariusdigitalacademy.com/")"
if [[ "$final_site_url" != https://dariusdigitalacademy.com/* ]]; then
  echo "FAIL HTTP redirect — expected HTTPS canonical URL, got $final_site_url" >&2
  exit 1
fi
echo "PASS HTTPS canonical redirect $final_site_url"

echo "Production availability check passed."
