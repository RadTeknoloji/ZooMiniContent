#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <content_root>"
  exit 1
fi

content_root="$1"
animals_dir="$content_root/animals"
images_dir="$content_root/media/images"
audio_dir="$content_root/media/audio"
narration_dir="$content_root/media/narration"

if [[ ! -d "$animals_dir" ]]; then
  echo "ERROR: animals directory not found: $animals_dir"
  exit 1
fi

if [[ ! -d "$images_dir" ]]; then
  echo "ERROR: images directory not found: $images_dir"
  exit 1
fi

if [[ ! -d "$audio_dir" ]]; then
  echo "ERROR: audio directory not found: $audio_dir"
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required"
  exit 1
fi

errors=0
langs=(en tr ar de es it pt fr)

find_image() {
  local base="$1"
  local found=""
  for ext in jpg jpeg png heic webp; do
    if [[ -f "$images_dir/$base.$ext" ]]; then
      found="$images_dir/$base.$ext"
      break
    fi
  done
  echo "$found"
}

validate_animal_json() {
  local animal_json="$1"
  local label="$2"

  local id image_name sound_file
  id="$(echo "$animal_json" | jq -r '.id // empty')"
  image_name="$(echo "$animal_json" | jq -r '.imageName // empty')"
  sound_file="$(echo "$animal_json" | jq -r '.soundFile // empty')"

  if [[ -z "$id" ]]; then
    echo "ERROR [$label]: id missing"
    errors=$((errors + 1))
  fi

  if [[ -z "$image_name" ]]; then
    echo "ERROR [$label]: imageName missing"
    errors=$((errors + 1))
  elif [[ -z "$(find_image "$image_name")" ]]; then
    echo "ERROR [$label]: image not found for imageName=$image_name in $images_dir"
    errors=$((errors + 1))
  fi

  if [[ -z "$sound_file" ]]; then
    echo "ERROR [$label]: soundFile missing"
    errors=$((errors + 1))
  elif [[ ! -f "$audio_dir/$sound_file" ]]; then
    echo "ERROR [$label]: sound file not found: $audio_dir/$sound_file"
    errors=$((errors + 1))
  fi

  local size_count
  size_count="$(echo "$animal_json" | jq '.sizeComparisonImageNames | if type=="array" then length else 0 end')"
  if [[ "$size_count" -lt 3 ]]; then
    echo "ERROR [$label]: sizeComparisonImageNames must have at least 3 entries"
    errors=$((errors + 1))
  fi

  while IFS= read -r img_name; do
    [[ -z "$img_name" ]] && continue
    if [[ -z "$(find_image "$img_name")" ]]; then
      echo "ERROR [$label]: size comparison image not found for $img_name"
      errors=$((errors + 1))
    fi
  done < <(echo "$animal_json" | jq -r '.sizeComparisonImageNames[]?')

  for lang in "${langs[@]}"; do
    local name_value
    name_value="$(echo "$animal_json" | jq -r --arg lang "$lang" '.localizedNames[$lang] // empty')"
    if [[ -z "$name_value" ]]; then
      echo "ERROR [$label]: localizedNames.$lang missing"
      errors=$((errors + 1))
    fi

    for age_key in age_2_4 age_5_7 age_8_10; do
      local fact_value
      fact_value="$(echo "$animal_json" | jq -r --arg lang "$lang" --arg age "$age_key" '.factsByLanguage[$lang][$age] // empty')"
      if [[ "$lang" == "en" && -z "$fact_value" ]]; then
        echo "ERROR [$label]: factsByLanguage.$lang.$age_key missing"
        errors=$((errors + 1))
      elif [[ "$lang" != "en" && -z "$fact_value" ]]; then
        echo "WARN  [$label]: factsByLanguage.$lang.$age_key missing (English fallback will be used)"
      fi
    done
  done

  if [[ -d "$narration_dir" ]]; then
    local narration_missing=0
    for lang in "${langs[@]}"; do
      for token in 2_4 5_7 8_10; do
        local narration_file="${id}_${lang}_${token}.m4a"
        if [[ ! -f "$narration_dir/$narration_file" ]]; then
          narration_missing=$((narration_missing + 1))
        fi
      done
    done
    if [[ "$narration_missing" -gt 0 ]]; then
      echo "WARN  [$label]: $narration_missing narration file(s) missing (TTS fallback will be used)"
    fi
  fi
}

index_file="$animals_dir/animals_index.json"
if [[ -f "$index_file" ]]; then
  if ! jq -e 'type == "array"' "$index_file" >/dev/null; then
    echo "ERROR: animals_index.json must be an array"
    exit 1
  fi

  count="$(jq 'length' "$index_file")"
  if [[ "$count" -eq 0 ]]; then
    echo "ERROR: animals_index.json is empty"
    exit 1
  fi

  for ((i = 0; i < count; i++)); do
    animal_json="$(jq -c ".[$i]" "$index_file")"
    validate_animal_json "$animal_json" "animals_index[$i]"
  done
else
  shopt -s nullglob
  animal_files=("$animals_dir"/animal_*.json)
  shopt -u nullglob

  if [[ ${#animal_files[@]} -eq 0 ]]; then
    echo "ERROR: no animal_*.json files found in $animals_dir"
    exit 1
  fi

  for f in "${animal_files[@]}"; do
    if ! jq -e '.' "$f" >/dev/null; then
      echo "ERROR [$f]: invalid json"
      errors=$((errors + 1))
      continue
    fi
    validate_animal_json "$(jq -c '.' "$f")" "$(basename "$f")"
  done
fi

if [[ "$errors" -gt 0 ]]; then
  echo "Validation failed with $errors error(s)."
  exit 1
fi

echo "Validation passed."
