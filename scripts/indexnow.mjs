import { readFile } from "node:fs/promises";

const KEY = "2c45bd3a112d6520f25bdab4786ec7fe";
const HOST = "anlap26.github.io";

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

async function readLocs(relative) {
  try {
    const xml = await readFile(new URL(relative, import.meta.url), "utf8");
    return locs(xml);
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

const urlList = [...await readLocs("../scores/sitemap.xml"), ...await readLocs("../games/sitemap.xml")];
if (!urlList.length) {
  console.error("No URLs in scores or games sitemaps");
  process.exit(1);
}

const chunkSize = 9000;
for (let start = 0; start < urlList.length; start += chunkSize) {
  const chunk = urlList.slice(start, start + chunkSize);
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: chunk,
  };
  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  console.log(`IndexNow ${response.status} for ${chunk.length} URLs`);
  if (response.status !== 200 && response.status !== 202) {
    console.error(await response.text());
    process.exit(1);
  }
}
