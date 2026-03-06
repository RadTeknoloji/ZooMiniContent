# ZooMini Content Source

This directory is the source of truth for remote content packages.

## Structure
- `animals/animals_index.json`: Array of animal objects.
- `media/images/`: Main animal images + size comparison images.
- `media/audio/`: Animal sound files.
- `media/narration/`: Optional recorded narration files.
- `version.txt`: Package version used by GitHub Actions when no manual version is provided.

## Naming
- Animal image: `imageName` in JSON should match a file in `media/images`.
- Size comparison images: each animal should define 3 items in `sizeComparisonImageNames`.
- Animal sound: `soundFile` in JSON should match a file in `media/audio`.
- Narration (optional): `<animal_id>_<lang>_<age>.m4a`, age tokens: `2_4`, `5_7`, `8_10`.

## Validation
```bash
./scripts/validate_content.sh ./content
```
