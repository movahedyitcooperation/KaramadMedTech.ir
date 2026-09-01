/* server.mjs — zero-dependency static dev server. `npm run dev`.
   Serves this directory, maps /robots.txt & /sitemap.xml from ./public, and
   falls back to index.html for unknown non-file routes (SPA). No build step. */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 4321;
const BUILD = Date.now().toString(36); // changes every server start — busts the module cache

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jfif": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".ico": "image/x-icon",
};

async function tryFile(path) {
  try {
    const s = await stat(path);
    if (s.isFile()) return path;
  } catch { /* not found */ }
  return null;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";

    // public assets published at the root
    if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
      pathname = "/public" + pathname;
    }

    const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    let file = await tryFile(join(ROOT, safe));

    // SPA fallback: unknown route with no extension -> index.html
    if (!file && !extname(safe)) file = join(ROOT, "index.html");
    if (!file) { res.writeHead(404); res.end("Not found"); return; }

    let body = await readFile(file);
    const ext = extname(file).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";

    // Dev-only: stamp every relative import + the entry script with ?b=<BUILD> so
    // the browser's ES-module cache is invalidated on each server restart.
    if (ext === ".js" || ext === ".mjs") {
      body = Buffer.from(
        body.toString("utf8").replace(
          /(\bfrom\s+["']|\bimport\s*\(\s*["']|\bimport\s+["'])(\.\.?\/[^"']+?\.js)(["'])/g,
          (_, pre, spec, post) => pre + spec + "?b=" + BUILD + post
        )
      );
    } else if (ext === ".html") {
      body = Buffer.from(body.toString("utf8").replace('src="/src/main.js"', `src="/src/main.js?b=${BUILD}"`));
    }

    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-store, must-revalidate",
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500);
    res.end("Server error: " + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`\n  کارآمد storefront  →  http://localhost:${PORT}\n`);
});
