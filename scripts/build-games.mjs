import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildGamesSite, gamesSitemap } from "./games-render.mjs";
import { sitemapIndex } from "./seo-render.mjs";

const root = process.cwd();
const dataUrl = new URL("../games/data/releases.json", import.meta.url);
const data = JSON.parse(await readFile(dataUrl, "utf8"));
const { pages } = buildGamesSite(data);
const generated = [
  "calendar",
  "this-week",
  "this-month",
  "platforms",
  "genres",
  "most-anticipated",
  "faq",
  "all",
  "games",
  "questions",
];

await Promise.all(generated.map((dir) => rm(path.join(root, "games", dir), { recursive: true, force: true })));
await rm(path.join(root, "games/index.html"), { force: true });

for (const page of pages) {
  const relative = page.path.replace(/^\//, "");
  const file = path.join(root, relative, "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, page.html);
}

const lastmod = data.asOf;
await writeFile(path.join(root, "games/sitemap.xml"), gamesSitemap(pages.map((page) => page.path), lastmod));
await writeFile(path.join(root, "sitemap.xml"), sitemapIndex());
console.log(`Wrote ${pages.length} Streetdate pages`);
