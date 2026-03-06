#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <content_root> <version> <output_zip>"
  exit 1
fi

content_root="$1"
version="$2"
output_zip_input="$3"

script_dir="$(cd "$(dirname "$0")" && pwd)"

"$script_dir/validate_content.sh" "$content_root"

animals_dir="$content_root/animals"
images_dir="$content_root/media/images"
audio_dir="$content_root/media/audio"
narration_dir="$content_root/media/narration"

if [[ ! -d "$animals_dir" || ! -d "$images_dir" || ! -d "$audio_dir" ]]; then
  echo "ERROR: expected directories missing in $content_root"
  exit 1
fi

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

mkdir -p "$tmp_dir/animals" "$tmp_dir/media/images" "$tmp_dir/media/audio"

if [[ -f "$animals_dir/animals_index.json" ]]; then
  cp "$animals_dir/animals_index.json" "$tmp_dir/animals/animals_index.json"
else
  shopt -s nullglob
  animal_files=("$animals_dir"/animal_*.json)
  shopt -u nullglob
  if [[ ${#animal_files[@]} -eq 0 ]]; then
    echo "ERROR: no animal_*.json files to build index"
    exit 1
  fi
  jq -s '.' "${animal_files[@]}" > "$tmp_dir/animals/animals_index.json"
fi

cp -R "$images_dir"/. "$tmp_dir/media/images/"
cp -R "$audio_dir"/. "$tmp_dir/media/audio/"

if [[ -d "$narration_dir" ]]; then
  mkdir -p "$tmp_dir/media/narration"
  cp -R "$narration_dir"/. "$tmp_dir/media/narration/" || true
fi

output_dir="$(dirname "$output_zip_input")"
output_name="$(basename "$output_zip_input")"
mkdir -p "$output_dir"
output_dir_abs="$(cd "$output_dir" && pwd)"
output_zip="$output_dir_abs/$output_name"

rm -f "$output_zip"

(
  cd "$tmp_dir"
  zip -qr "$output_zip" .
)

size_bytes="$(stat -f%z "$output_zip")"
sha256="$(shasum -a 256 "$output_zip" | awk '{print $1}')"

echo "Package built:"
echo "  version: $version"
echo "  file: $output_zip"
echo "  sizeBytes: $size_bytes"
echo "  sha256: $sha256"
