import assert from "node:assert/strict";
import test from "node:test";
import { guides, leagueMeta } from "../scripts/seo-copy.mjs";
import { esc, renderDocument, sitemapIndex, sitemapXml } from "../scripts/seo-render.mjs";

const sample = {
  path: "/scores/football/champions-league/",
  title: "Champions League live scores, fixtures, results and table",
  description: "Champions League live scores and kick-off times.",
  h1: "Champions League live scores",
  intro: ["A real intro.", "Second paragraph."],
  crumbs: [
    { href: "/", label: "Home" },
    { href: "/scores/", label: "Scores" },
    { href: "/scores/football/champions-league/", label: "Champions League" },
  ],
  fixtures: [{
    iso: "2026-11-25T17:45:00.000Z",
    dateLabel: "Wed 25 Nov",
    timeLabel: "19:45",
    home: "Arsenal",
    away: "Barcelona",
    score: "–",
    status: "Scheduled",
    venue: "Emirates",
    state: "pre",
    sport: "football",
    scoreText: "Wed 25 Nov 19:45",
  }],
  sport: "football",
  league: "ucl",
  day: "today",
  faqs: [{ q: "What time is kick-off?", a: "19:45 Europe/Nicosia." }],
  related: [{ href: "/scores/football/", label: "Football" }],
  events: [{
    home: "Arsenal",
    away: "Barcelona",
    iso: "2026-11-25T17:45:00.000Z",
    state: "pre",
    venue: "Emirates",
    sport: "football",
    scoreText: "Wed 25 Nov 19:45",
  }],
  fetchedAt: "Wed 25 Nov 16:00",
};

test("escapes HTML in titles and fixtures", () => {
  assert.equal(esc(`A & B < "c"`), "A &amp; B &lt; &quot;c&quot;");
  const html = renderDocument({ ...sample, h1: "A & B" });
  assert.equal(html.match(/<h1/g).length, 1);
  assert.match(html, /A &amp; B/);
  assert.match(html, /rel="canonical" href="https:\/\/anlap26.github.io\/scores\/football\/champions-league\/"/);
  assert.match(html, /FAQPage/);
  assert.match(html, /SportsEvent/);
  assert.match(html, /19:45/);
  assert.doesNotMatch(html, /undefined/);
});

test("competition guides are unique and attached to a real league", () => {
  const titles = new Set();
  for (const [id, guide] of Object.entries(guides)) {
    assert.ok(leagueMeta[id], id);
    assert.ok(guide.intro.length >= 2, id);
    assert.ok(guide.faq.length >= 1, id);
    assert.equal(titles.has(guide.title), false, guide.title);
    titles.add(guide.title);
    assert.doesNotMatch(guide.intro.join(" "), /undefined|lorem|TODO/i);
  }
});

test("sitemap lists every path once and the index keeps calculator URLs", () => {
  const xml = sitemapXml(["/scores/", "/scores/football/champions-league/"], "2026-11-25");
  assert.match(xml, /champions-league/);
  assert.equal(xml.match(/<loc>/g).length, 2);
  const index = sitemapIndex();
  assert.match(index, /Free-online-calculators\/sitemap\.xml/);
  assert.match(index, /scores\/sitemap\.xml/);
});
