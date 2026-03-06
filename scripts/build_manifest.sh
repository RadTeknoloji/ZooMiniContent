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

sha256="$(shasum -a 256 "$package_zip_path" | awk '{print $1}')"
size_bytes="$(stat -f%z "$package_zip_path")"

mkdir -p "$(dirname "$output_manifest")"

cat > "$output_manifest" <<EOF
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
EOF

echo "Manifest written: $output_manifest"
