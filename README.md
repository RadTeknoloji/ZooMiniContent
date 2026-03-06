# ZooMiniContent

This repository is the public content host for ZooMini.

## Repository Roles
- Main app repo (private): `https://github.com/RadTeknoloji/ZooMini`
- Content host repo (public): `https://github.com/RadTeknoloji/ZooMiniContent`

Why this repo exists:
- iOS app users must download `manifest.json` and content zip without login.
- GitHub Pages serves those files publicly.
- App code stays in private repo, content publishing stays here.

## Published URLs (GitHub Pages)
- `https://radteknoloji.github.io/ZooMiniContent/studio/`
- `https://radteknoloji.github.io/ZooMiniContent/content/manifest.json`
- `https://radteknoloji.github.io/ZooMiniContent/content/core_<version>.zip`

## Daily Update Flow
1. Open studio (`/studio/`).
2. Import/edit/export `animals_index.json`.
3. Put exported JSON under `content/animals/animals_index.json`.
4. Add media files under `content/media/images` and `content/media/audio`.
5. Increase `content/version.txt`.
6. Commit + push to `main`.
7. Run `Content Pages Publish` (or rely on push trigger).
8. In app, use parent panel `Check` + `Update`.

## Local Build Commands
```bash
./scripts/validate_content.sh ./content
./scripts/build_package.sh ./content 1.0.0 ./dist/core_1.0.0.zip
./scripts/build_manifest.sh ./dist/core_1.0.0.zip https://radteknoloji.github.io/ZooMiniContent/content/core_1.0.0.zip 1.0.0 1.0.0 ./dist/manifest.json
```
