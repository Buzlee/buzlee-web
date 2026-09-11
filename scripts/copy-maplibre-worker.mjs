// Copies MapLibre's worker bundle into public/ so the browser can load it.
//
// maplibre-gl >= 6 locates its worker with `new URL("./maplibre-gl-worker.mjs",
// import.meta.url)`. Bundlers rewrite import.meta.url to the app chunk, so that
// URL 404s under Next and the map silently renders nothing (the worker owns
// tile loading). We serve the dist files verbatim and point MapLibre at them
// via setWorkerUrl() in features/admin/discovery/ui/use-maplibre.ts.
// Runs on postinstall; the output directory is gitignored.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const dist = join(dirname(require.resolve("maplibre-gl/package.json")), "dist");
const out = join(process.cwd(), "public", "vendor", "maplibre-gl");

mkdirSync(out, { recursive: true });
// The worker is a module that imports ./maplibre-gl-shared.mjs relatively.
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, file), join(out, file));
}
