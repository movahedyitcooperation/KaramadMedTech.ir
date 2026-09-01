/* gen-sitemap.mjs — writes public/sitemap.xml from the fixture (or, once wired,
   from a catalog crawl). Run: node scripts/gen-sitemap.mjs
   With the SPA on hash routes, entries use `/#/...` fragments; switch to real
   paths if the app is later served with history routing + server rewrites. */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SITE = "https://karamadmedtech.ir";
const here = dirname(fileURLToPath(import.meta.url));

// keep this in sync with src/api/fixture.js (or import it once that file is plain data)
const CAT_SLUGS = ["diagnostics", "consumables", "rehab", "homecare", "clinic", "accessories"];
const PRODUCT_SLUGS = [
  "omron-hem-6232t", "beurer-po-30", "microlife-mt-500", "nitrile-gloves-m", "surgical-mask-3ply",
  "alcohol-solution-1l", "walker-folding", "cane-adjustable", "knee-brace-hinged", "wheelchair-standard",
  "hospital-bed-2crank", "nebulizer-compressor", "exam-bed-3section", "autoclave-18l", "dressing-trolley",
  "aaa-battery-pack", "carry-case-bp",
];

const urls = [
  { loc: `${SITE}/`, priority: "1.0" },
  { loc: `${SITE}/#/cart`, priority: "0.3" },
  { loc: `${SITE}/#/login`, priority: "0.3" },
  ...CAT_SLUGS.map((s) => ({ loc: `${SITE}/#/c/${s}`, priority: "0.8" })),
  ...PRODUCT_SLUGS.map((s) => ({ loc: `${SITE}/#/p/${s}`, priority: "0.7" })),
];

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;

writeFileSync(join(here, "..", "public", "sitemap.xml"), xml);
console.log(`wrote public/sitemap.xml — ${urls.length} urls`);
