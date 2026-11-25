import { readFile } from "node:fs/promises";

const KEY = "2c45bd3a112d6520f25bdab4786ec7fe";
const HOST = "anlap26.github.io";

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

const scores = await readFile(new URL("../scores/sitemap.xml", import.meta.url), "utf8");
const urlList = locs(scores);
if (!urlList.length) {
  console.error("No URLs in scores sitemap");
  process.exit(1);
}

const body = {
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList,
};

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
console.log(`IndexNow ${response.status} for ${urlList.length} URLs`);
if (response.status !== 200 && response.status !== 202) {
  console.error(await response.text());
  process.exit(1);
}
