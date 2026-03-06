#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 5 ]]; then
  echo "Usage: $0 <package_zip_path> <package_url> <version> <min_app_version> <output_manifest>"
  exit 1
fi

package_zip_path="$1"
package_url="$2"
version="$3"
min_app_version="$4"
output_manifest="$5"

if [[ ! -f "$package_zip_path" ]]; then
  echo "ERROR: package file not found: $package_zip_path"
  exit 1
fi

file_size_bytes() {
  local path="$1"
  if stat -f%z "$path" >/dev/null 2>&1; then
    stat -f%z "$path"
  else
    stat -c%s "$path"
  fi
}

sha256_file() {
  local path="$1"
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print $1}'
  else
    sha256sum "$path" | awk '{print $1}'
  fi
}

sha256="$(sha256_file "$package_zip_path")"
size_bytes="$(file_size_bytes "$package_zip_path")"

mkdir -p "$(dirname "$output_manifest")"

cat > "$output_manifest" <<JSON
{
  "schemaVersion": 1,
  "latestVersion": "$version",
  "minAppVersion": "$min_app_version",
  "packages": [
    {
      "id": "core",
      "version": "$version",
      "url": "$package_url",
      "sha256": "$sha256",
      "sizeBytes": $size_bytes
    }
  ]
}
JSON

echo "Manifest written: $output_manifest"
