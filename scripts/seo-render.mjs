const SITE = "https://anlap26.github.io";

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

export function abs(path) {
  return `${SITE}${path}`;
}

function headIcons() {
  return `
<link rel="icon" href="/scores/favicon.ico" sizes="16x16 32x32 48x48">
<link rel="icon" href="/scores/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/scores/favicon-48x48.png" type="image/png" sizes="48x48">
<link rel="icon" href="/scores/favicon-96x96.png" type="image/png" sizes="96x96">
<link rel="icon" href="/scores/icon-192.png" type="image/png" sizes="192x192">
<link rel="icon" href="/scores/icon-512.png" type="image/png" sizes="512x512">
<link rel="apple-touch-icon" href="/scores/apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="/scores/site.webmanifest">`.trim();
}

function jsonLd(page) {
  const crumbs = {
    "@type": "BreadcrumbList",
    itemListElement: page.crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: abs(crumb.href),
    })),
  };
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${abs(page.path)}#webpage`,
      url: abs(page.path),
      name: page.title,
      description: page.description,
      isPartOf: { "@id": "https://anlap26.github.io/scores/#website" },
      breadcrumb: crumbs,
      inLanguage: "en",
    },
  ];
  if (page.faqs?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }
  for (const event of page.events || []) {
    const node = {
      "@type": "SportsEvent",
      name: `${event.home} vs ${event.away}`,
      startDate: event.iso,
      sport: event.sportLabel,
      description: event.scoreText,
      homeTeam: { "@type": "SportsTeam", name: event.home },
      awayTeam: { "@type": "SportsTeam", name: event.away },
      url: abs(event.url || page.path),
    };
    if (event.venue) node.location = { "@type": "Place", name: event.venue };
    if (event.state === "pre") node.eventStatus = "https://schema.org/EventScheduled";
    graph.push(node);
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

function fixtureHtml(fixtures) {
  if (fixtures == null) return "";
  if (!fixtures.length) {
    return "<p>No fixtures were in the latest fetch for this page. The live board below still checks ESPN when you open it.</p>";
  }
  return fixtures.map((fixture) => `<article>
    <time datetime="${esc(fixture.iso)}">${esc(fixture.dateLabel)} · ${esc(fixture.timeLabel)}</time>
    <p><strong>${esc(fixture.home)}</strong> ${esc(fixture.score)} <strong>${esc(fixture.away)}</strong></p>
    <p>${esc(fixture.status)}${fixture.venue ? ` · ${esc(fixture.venue)}` : ""}</p>
  </article>`).join("");
}

function footerHtml() {
  return `
<footer class="site-footer">
  <nav class="related" aria-label="Scores sections">
    <a href="/scores/">All scores</a>
    <a href="/scores/football/">Football</a>
    <a href="/scores/football/matches-today/">Matches today</a>
    <a href="/scores/football/results-yesterday/">Results yesterday</a>
    <a href="/scores/football/champions-league/">Champions League</a>
    <a href="/scores/football/premier-league/">Premier League</a>
    <a href="/scores/football/cyprus-first-division/">Cyprus</a>
    <a href="/scores/basketball/">Basketball</a>
    <a href="/scores/tennis/">Tennis</a>
    <a href="/scores/hockey/nhl/">NHL</a>
    <a href="/scores/nfl/">NFL</a>
  </nav>
  <p>Scores and kick-off times are loaded from ESPN’s public scoreboards. Harbourline is not affiliated with ESPN or any league. Snapshot times on this page are Europe/Nicosia. The live board uses your device time zone.</p>
  <div class="footer-partners">
    <p class="partners-kicker"><span class="ad-tag">Ad</span> Partners</p>
    <ul class="partner-links">
      <li><a href="https://aviasales.tpx.lt/1sQ7N99K" rel="sponsored noopener" target="_blank">Aviasales <span>Flights</span></a></li>
      <li><a href="https://klook.tpx.lt/xtutlwca" rel="sponsored noopener" target="_blank">Klook <span>Tickets and tours</span></a></li>
      <li><a href="https://kiwitaxi.tpx.lt/pmM77dyU" rel="sponsored noopener" target="_blank">Kiwitaxi <span>Transfers</span></a></li>
      <li><a href="https://tpx.lt/sJrz0dYS" rel="sponsored noopener" target="_blank">Welcome Pickups <span>Airport transfers</span></a></li>
      <li><a href="https://airalo.tpx.lt/nILAEUYZ" rel="sponsored noopener" target="_blank">Airalo <span>eSIM</span></a></li>
      <li><a href="https://yesim.tpx.lt/L3JvkZOj" rel="sponsored noopener" target="_blank">Yesim <span>eSIM</span></a></li>
      <li><a href="https://www.amazon.de/s?k=football%20boots%20jersey%20ball&amp;tag=cynews24-21" rel="sponsored noopener" target="_blank">Amazon.de <span>Fan gear</span></a></li>
    </ul>
    <p>Some of these are affiliate links. If you use one, Harbourline may earn a commission at no extra cost to you. <a href="/Free-online-calculators/affiliate-disclosure/">Affiliate disclosure</a>.</p>
  </div>
  <p class="footer-links"><a href="/">Home</a> <a href="/scores/">Scores</a> <a href="/Free-online-calculators/">Calculators</a></p>
</footer>`;
}

export function renderDocument(page) {
  const crumbs = page.crumbs.map((crumb, index) => {
    const last = index === page.crumbs.length - 1;
    return last ? `<span>${esc(crumb.label)}</span>` : `<a href="${esc(crumb.href)}">${esc(crumb.label)}</a>`;
  }).join(" / ");
  const faqs = (page.faqs || []).map((item) => `<details>
    <summary>${esc(item.q)}</summary>
    <p>${esc(item.a)}</p>
  </details>`).join("");
  const related = (page.related || []).map((link) => `<a href="${esc(link.href)}">${esc(link.label)}</a>`).join("");
  const paragraphs = (page.intro || []).map((paragraph) => `<p>${esc(paragraph)}</p>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${esc(abs(page.path))}">
<meta name="theme-color" content="#09090b">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${esc(abs(page.path))}">
<meta property="og:image" content="https://anlap26.github.io/scores/icon-512.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
${headIcons()}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://site.api.espn.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Unbounded:wght@600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${jsonLd(page)}</script>
<link rel="stylesheet" href="/scores/styles.css">
</head>
<body data-keep-title="1" data-sport="${esc(page.sport || "")}" data-league="${esc(page.league || "")}" data-day="${esc(page.day || "today")}">
<a class="skip" href="#static-fixtures">Skip to fixtures</a>
<header class="top">
  <div class="shell top-inner">
    <a class="brand" href="/scores/">
      <img class="mark" src="/scores/favicon.svg" width="42" height="42" alt="">
      <span>
        <p class="brand-name">Harbourline</p>
        <p class="brand-tag">Fixtures and scores, in your time</p>
      </span>
    </a>
    <nav class="sports" id="sports" aria-label="Sport"></nav>
  </div>
</header>
<div class="shell">
  <nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>
  <h1 class="day-heading">${esc(page.h1)}</h1>
  <div class="seo-intro">${paragraphs}</div>
  ${page.fixtures == null ? "" : `<section id="static-fixtures" class="snapshot">
    <h2>Latest snapshot · Europe/Nicosia</h2>
    <p>Fetched ${esc(page.fetchedAt || "")}. The live board under this list uses your device time zone and refreshes while the tab is open.</p>
    ${fixtureHtml(page.fixtures)}
  </section>`}
  ${page.extra || ""}
  <h2>Live board</h2>
  <div class="toolbar">
    <div class="days" id="days" role="group" aria-label="Day"></div>
    <div class="meta">
      <p class="tz" id="tz-label">Times in Europe/Nicosia</p>
      <p class="updated" id="updated">Loading fixtures…</p>
      <button class="refresh" id="refresh" type="button">Refresh</button>
    </div>
  </div>
  <div class="filters" id="filters" role="group" aria-label="Match status"></div>
  <div id="notice"></div>
  <div id="board"></div>
  ${faqs ? `<section class="faq"><h2>Questions</h2>${faqs}</section>` : ""}
  ${related ? `<section><h2>Related</h2><nav class="related">${related}</nav></section>` : ""}
  ${footerHtml()}
</div>
<script type="module" src="/scores/app.js"></script>
</body>
</html>
`;
}

export function sitemapXml(paths, lastmod) {
  const body = paths.map((path) => `  <url><loc>${esc(abs(path))}</loc><lastmod>${esc(lastmod)}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function sitemapIndex() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>https://anlap26.github.io/Free-online-calculators/sitemap.xml</loc></sitemap>
  <sitemap><loc>https://anlap26.github.io/scores/sitemap.xml</loc></sitemap>
</sitemapindex>
`;
}
