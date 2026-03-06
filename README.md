# ZooMiniContent

This repository hosts ZooMini content packages and the web content studio.

## Published URLs (GitHub Pages)
- `/studio/` -> content editor UI
- `/content/manifest.json` -> manifest used by iOS app
- `/content/core_<version>.zip` -> content package

## Local workflow
1. Edit content in `content-studio/` or update `content/animals/animals_index.json`.
2. Validate:
   - `./scripts/validate_content.sh ./content`
3. Build package:
   - `./scripts/build_package.sh ./content <version> ./dist/core_<version>.zip`
4. Build manifest:
   - `./scripts/build_manifest.sh ./dist/core_<version>.zip <package_url> <version> 1.0.0 ./dist/manifest.json`

## GitHub Actions
- `Content Validate` validates content on PRs.
- `Content Pages Publish` publishes package + manifest + studio to GitHub Pages.
