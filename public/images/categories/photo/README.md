# Category photographs — the home rail

`components/shop/CategoryIconCards.tsx` fills each card in the home category
rail with the photograph named here. The filenames are the English department
keys, because `lib/utils/department.ts` is the only place the real
(Persian-transliterated) category slugs are translated to asset names — see
its `photoSrc` field.

Six files are expected, one per department:

| File               | Category                | Slug                    |
| ------------------ | ----------------------- | ----------------------- |
| `diagnostics.webp` | تجهیزات تشخیصی          | `tajhizat-tashkhisi`    |
| `consumables.webp` | مصرفی و بهداشتی         | `masrafi-behdashti`     |
| `rehab.webp`       | توانبخشی و ارتوپدی      | `tavanbakhshi-ortopedi` |
| `homecare.webp`    | مراقبت در منزل          | `moraghebat-dar-manzel` |
| `clinic.webp`      | تجهیزات مطب و کلینیک    | `tajhizat-matb-clinic`  |
| `accessories.webp` | لوازم جانبی             | `lavazem-janebi`        |

The card is `aspect-[5/6]` and the photo is `object-cover object-center`, so a
square source is cropped about 4% off each side and nothing is distorted.
Square originals around 1024×1024 are ideal. Convert with the `sharp` already
in `node_modules`:

```
node -e "require('sharp')('<source>').webp({quality:82}).toFile('public/images/categories/photo/<key>.webp')"
```

A missing file is not fatal — the card falls back to its `bg-emerald` ground
with the category name still readable over it — but the browser will log a 404
and show a broken-image marker, so keep all six present.

Note: these are NOT the same assets as `public/images/categories/*.webp`, which
are the owner's small line-art department icons used by `DepartmentMark` in the
nav strip, mega menu and category headings. Both sets are keyed by the same six
English names; do not overwrite one with the other.
