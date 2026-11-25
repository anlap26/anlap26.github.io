import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildGamesSite, esc } from "../scripts/games-render.mjs";

const data = JSON.parse(await readFile(new URL("../games/data/releases.json", import.meta.url), "utf8"));
const site = buildGamesSite(data);
const pages = new Map(site.pages.map((page) => [page.path, page]));

test("streetdate pages are unique, linked, and labelled", () => {
  assert.ok(site.pages.length > 80);
  const hrefs = new Set(site.pages.map((page) => page.path));
  for (const page of site.pages) {
    assert.match(page.html, /rel="canonical" href="https:\/\/anlap26\.github\.io\/games\//);
    assert.match(page.html, /Last updated 25 November 2026/);
    assert.doesNotMatch(page.html, /gamespot|gabe gurwin|betting|casino|odds/i);
    assert.equal(page.html.includes("undefined"), false, page.path);
    for (const match of page.html.matchAll(/href="(\/games\/[^"]+)"/g)) {
      const href = match[1].split("?")[0].split("#")[0];
      if (href.endsWith(".css") || href.endsWith(".js") || href.endsWith(".svg") || href.endsWith(".png") || href.endsWith(".xml") || href.endsWith(".ico") || href.endsWith(".webmanifest")) continue;
      assert.ok(hrefs.has(href), `${page.path} -> ${href}`);
    }
  }
});

test("gta, fable, duskbloods and witcher dates stay honest", () => {
  const gta = pages.get("/games/games/gta-6/").html;
  assert.match(gta, /19 November 2026/);
  assert.match(gta, /VideoGame/);
  assert.match(gta, /PC remains unannounced|has not been announced/);
  assert.match(gta, /6 November 2025/);
  assert.match(gta, /tag=cynews24-21/);
  assert.match(gta, /rel="sponsored nofollow noopener"/);

  const fable = pages.get("/games/games/fable/").html;
  assert.match(fable, /23 February 2027/);
  assert.match(fable, /Playground Games/);

  const dusk = pages.get("/games/games/the-duskbloods/").html;
  assert.match(dusk, /2027/);
  assert.match(dusk, /TBA|no day/i);
  assert.match(dusk, /29 October 2026/);

  const witcher = pages.get("/games/questions/the-witcher-4-release-date/").html;
  assert.match(witcher, /FAQPage/);
  assert.match(witcher, /2028/);
  assert.match(witcher, /When does The Witcher 4 come out/);
});

test("week, month and platform routes exist", () => {
  assert.ok(pages.has("/games/this-week/"));
  assert.ok(pages.has("/games/this-month/"));
  assert.ok(pages.has("/games/calendar/2026/november/"));
  assert.ok(pages.has("/games/calendar/2026/december/"));
  assert.ok(pages.has("/games/platforms/ps5/"));
  assert.ok(pages.has("/games/platforms/switch-2/"));
  assert.ok(pages.has("/games/genres/horror/"));
  assert.ok(pages.has("/games/most-anticipated/"));
  assert.match(pages.get("/games/this-week/").html, /Am I Nima/);
  assert.match(pages.get("/games/calendar/2026/november/").html, /Grand Theft Auto VI/);
  assert.equal(esc(`A & B < "c"`), "A &amp; B &lt; &quot;c&quot;");
});
