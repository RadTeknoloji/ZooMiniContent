# ZooMini Content Studio

Bu klasör GitHub Pages üzerinde çalışacak statik içerik editörüdür.

## Amaç
- Hayvan verisini hızlıca form üzerinden düzenlemek
- `animals_index.json` içe/dışa aktarmak
- Yayın öncesi temel doğrulama yapmak

## Kullanım
1. `studio/index.html` sayfasını aç.
2. Hayvanları düzenle.
3. `JSON Dışa Aktar` ile `animals_index.json` indir.
4. İndirilen dosyayı `content/animals/animals_index.json` içine koy.
5. Paket üretimi için repo scriptlerini çalıştır:
   - `./scripts/validate_content.sh ./content`
   - `./scripts/build_package.sh ./content <version> ./dist/core_<version>.zip`
   - `./scripts/build_manifest.sh ...`

## Not
- Bu editör medya dosyalarını upload edip sunucuya göndermez.
- Görsel/ses dosyaları repo içinde `content/media/*` altında yönetilir.
