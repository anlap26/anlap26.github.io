const HOST = "https://anlap26.github.io";
const AMAZON_TAG = "cynews24-21";

export const PLATFORMS = {
  ps5: { name: "PlayStation 5", short: "PS5", amazon: "PlayStation 5 console" },
  "xbox-series": { name: "Xbox Series X|S", short: "Xbox Series X|S", amazon: "Xbox Series X console" },
  "switch-2": { name: "Nintendo Switch 2", short: "Switch 2", amazon: "Nintendo Switch 2 console" },
  switch: { name: "Nintendo Switch", short: "Switch", amazon: "Nintendo Switch console" },
  pc: { name: "PC", short: "PC" },
  mobile: { name: "Mobile", short: "Mobile" },
};

export const GENRES = {
  action: { name: "Action", blurb: "Action games dated in this calendar, from character brawlers to arcade combat." },
  "action-adventure": { name: "Action-adventure", blurb: "Story-led action games with exploration, including open-world releases and cinematic adventures." },
  rpg: { name: "Role-playing", blurb: "Role-playing games with a public release date, from party-based RPGs to action hybrids." },
  racing: { name: "Racing", blurb: "Racing games with a dated launch on console or PC." },
  sports: { name: "Sports", blurb: "Sports simulations and arcade sports games, including annual editions." },
  horror: { name: "Horror", blurb: "Horror releases, including survival horror and quieter dread games." },
  shooter: { name: "Shooter", blurb: "First- and third-person shooters with a public date or a stated window." },
  fighting: { name: "Fighting", blurb: "Fighting games scheduled or already released in this calendar." },
  strategy: { name: "Strategy", blurb: "Strategy, tactics and management-leaning games with a public date." },
  simulation: { name: "Simulation", blurb: "Life sims, sandboxes and other simulation games people are waiting on." },
  platformer: { name: "Platformer", blurb: "Platformers and precision action games with a known or windowed date." },
  puzzle: { name: "Puzzle", blurb: "Puzzle and adventure-puzzle games in the notable-release calendar." },
  survival: { name: "Survival", blurb: "Survival and crafting games, including early-access launches." },
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CONFIDENCE = new Set(["confirmed", "scheduled", "window", "tba"]);
const PRECISION = new Set(["day", "month", "year", "none"]);
const KIND = new Set(["release", "port", "early-access", "expansion", "full-release"]);

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function abs(path) {
  return `${HOST}${path}`;
}

function utcDate(ymd) {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(ymd, count) {
  const date = utcDate(ymd);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function weekRange(ymd) {
  const date = utcDate(ymd);
  const weekday = date.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = addDays(ymd, mondayOffset);
  return { start, end: addDays(start, 6) };
}

function monthKey(ymd) {
  return ymd.slice(0, 7);
}

function yearOf(ymd) {
  return ymd.slice(0, 4);
}

export function formatWhen(release) {
  if (!release || release.precision === "none" || !release.date) return "TBA";
  if (release.precision === "year") return release.date.slice(0, 4);
  if (release.precision === "month") {
    const [year, month] = release.date.split("-");
    return `${MONTHS[Number(month) - 1]} ${year}`;
  }
  const date = utcDate(release.date);
  return `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatDay(ymd) {
  const date = utcDate(ymd);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatShort(ymd) {
  const date = utcDate(ymd);
  const mon = MONTHS[date.getUTCMonth()].slice(0, 3);
  return `${date.getUTCDate()} ${mon}`;
}

function formatSpan(start, end) {
  const from = utcDate(start);
  const to = utcDate(end);
  if (from.getUTCMonth() === to.getUTCMonth() && from.getUTCFullYear() === to.getUTCFullYear()) {
    return `${from.getUTCDate()}–${to.getUTCDate()} ${MONTHS[to.getUTCMonth()]} ${to.getUTCFullYear()}`;
  }
  return `${formatDay(start)} – ${formatDay(end)}`;
}

function confidenceLabel(confidence) {
  if (confidence === "confirmed") return "Confirmed";
  if (confidence === "scheduled") return "Scheduled";
  if (confidence === "window") return "Window";
  return "TBA";
}

function compareRelease(a, b) {
  const rank = { day: 0, month: 1, year: 2, none: 3 };
  const ad = a.date || "9999-99-99";
  const bd = b.date || "9999-99-99";
  if (ad !== bd) return ad < bd ? -1 : 1;
  return rank[a.precision] - rank[b.precision];
}

function platformNames(ids) {
  return ids.map((id) => PLATFORMS[id].name);
}

function platformShort(ids) {
  return ids.map((id) => PLATFORMS[id].short).join(" · ");
}

export function queryLabel(game) {
  const alias = game.aka?.[0];
  if (alias && alias.length < game.name.length && !/reboot|remake|edition/i.test(alias)) return alias;
  return game.name;
}

function amazonSearch(query) {
  const url = new URL("https://www.amazon.de/s");
  url.searchParams.set("k", query);
  url.searchParams.set("tag", AMAZON_TAG);
  return url.toString();
}

function isHttp(url) {
  return typeof url === "string" && /^https:\/\/[^\s]+$/i.test(url);
}

export function validateReleaseData(data) {
  const errors = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.asOf || "")) errors.push("asOf must be YYYY-MM-DD");
  if (!Array.isArray(data.games) || data.games.length < 20) errors.push("expected a substantial games list");
  const ids = new Set();
  const names = new Set();
  for (const game of data.games || []) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(game.id || "")) errors.push(`bad id ${game.id}`);
    if (ids.has(game.id)) errors.push(`duplicate id ${game.id}`);
    ids.add(game.id);
    if (!game.name || names.has(game.name)) errors.push(`duplicate or empty name ${game.name}`);
    names.add(game.name);
    if ((game.blurb || "").trim().length < 120) errors.push(`blurb too short ${game.id}`);
    if (/gamespot|gabe gurwin|lorem|todo|placeholder/i.test(game.blurb)) errors.push(`blurb looks copied or unfinished ${game.id}`);
    for (const genre of game.genres || []) {
      if (!GENRES[genre]) errors.push(`unknown genre ${genre} on ${game.id}`);
    }
    if (!game.genres?.length) errors.push(`no genre ${game.id}`);
    if (!Array.isArray(game.releases) || !game.releases.length) errors.push(`no releases ${game.id}`);
    for (const release of game.releases || []) {
      if (!CONFIDENCE.has(release.confidence)) errors.push(`confidence ${game.id}`);
      if (!PRECISION.has(release.precision)) errors.push(`precision ${game.id}`);
      if (!KIND.has(release.kind)) errors.push(`kind ${game.id}`);
      for (const platform of release.platforms || []) {
        if (!PLATFORMS[platform]) errors.push(`platform ${platform} on ${game.id}`);
      }
      if (release.precision === "day" && !/^\d{4}-\d{2}-\d{2}$/.test(release.date || "")) errors.push(`day date ${game.id}`);
      if (release.precision === "month" && !/^\d{4}-\d{2}$/.test(release.date || "")) errors.push(`month date ${game.id}`);
      if (release.precision === "year" && !/^\d{4}$/.test(release.date || "")) errors.push(`year date ${game.id}`);
      if (release.precision === "none" && release.date) errors.push(`tba should not have a date ${game.id}`);
      if ((release.confidence === "tba" || release.confidence === "window") && release.precision === "day") {
        errors.push(`window/tba cannot be a locked day ${game.id}`);
      }
    }
    for (const source of game.sources || []) {
      if (!isHttp(source.url)) errors.push(`bad source url ${game.id}`);
    }
    if (game.official && !isHttp(game.official)) errors.push(`bad official url ${game.id}`);
    if (game.trailer && !isHttp(game.trailer)) errors.push(`bad trailer url ${game.id}`);
  }
  if (errors.length) {
    const error = new Error(errors.slice(0, 12).join("; "));
    error.errors = errors;
    throw error;
  }
}

function normalizedReleases(game) {
  return game.releases.map((release) => ({
    ...release,
    date: release.precision === "month" ? `${release.date}-01` : release.precision === "year" ? `${release.date}-01-01` : release.date || "",
    rawDate: release.date || "",
  }));
}

function headline(game, asOf) {
  const releases = normalizedReleases(game);
  const future = releases
    .filter((release) => release.precision === "day" && release.date >= asOf)
    .sort(compareRelease);
  if (future.length) return future[0];
  const past = releases
    .filter((release) => release.precision === "day" && release.date < asOf)
    .sort((a, b) => compareRelease(b, a));
  if (past.length) return past[0];
  return releases.sort(compareRelease)[0];
}

function statusOf(game, asOf) {
  const lead = headline(game, asOf);
  const futureDay = normalizedReleases(game).some((release) => release.precision === "day" && release.date >= asOf);
  const pastDay = normalizedReleases(game).some((release) => release.precision === "day" && release.date < asOf);
  if (pastDay && futureDay) return { code: "partial", label: "Out, more platforms dated" };
  if (lead.precision !== "day") {
    if (lead.confidence === "tba" || lead.precision === "none") return { code: "tba", label: "TBA" };
    const year = String(lead.rawDate || lead.date || "").slice(0, 4);
    return { code: "window", label: year ? `${year}, no day` : "Window" };
  }
  if (lead.date >= asOf) {
    if (lead.kind === "early-access") return { code: "early", label: "Early access dated" };
    return { code: lead.confidence === "confirmed" ? "upcoming" : "scheduled", label: lead.confidence === "confirmed" ? "Upcoming" : "Scheduled" };
  }
  if (lead.kind === "early-access") return { code: "early", label: "Early access" };
  if (pastDay) return { code: "released", label: "Released" };
  return { code: "scheduled", label: "Scheduled" };
}

function allPlatforms(game) {
  const ids = [];
  for (const release of game.releases) {
    for (const platform of release.platforms || []) {
      if (!ids.includes(platform)) ids.push(platform);
    }
  }
  return ids;
}

function viewGame(game, asOf) {
  const lead = headline(game, asOf);
  const status = statusOf(game, asOf);
  const platforms = allPlatforms(game);
  return {
    ...game,
    lead,
    status,
    platforms,
    when: formatWhen(lead),
    path: `/games/games/${game.id}/`,
    questionPath: `/games/questions/${game.id}-release-date/`,
  };
}

function trimMeta(text, max = 158) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/[,:; ][^,:; ]*$/, "")}.`;
}

function crumbsHtml(items) {
  const parts = items.map((item, index) => {
    if (index === items.length - 1) return `<span>${esc(item.label)}</span>`;
    return `<a href="${esc(item.href)}">${esc(item.label)}</a>`;
  });
  return `<nav class="crumbs" aria-label="Breadcrumb">${parts.join('<span aria-hidden="true"> / </span>')}</nav>`;
}

function crumbLd(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: abs(item.href),
    })),
  };
}

function faqLd(faqs) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}

function itemListLd(name, games) {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: games.length,
    itemListElement: games.map((game, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: game.name,
      url: abs(game.path),
    })),
  };
}

function hashId(id) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function artMarkup(game, suffix) {
  if (game.image) {
    const label = `${game.name} official key art`;
    return `<img class="art" src="${esc(game.image)}" alt="${esc(label)}" width="1280" height="720">`;
  }
  return coverMarkup(game.id, suffix);
}

function coverMarkup(id, suffix) {
  const hash = hashId(`${suffix}:${id}`);
  const hueA = 262 + (hash % 38);
  const hueB = 172 + ((hash >> 8) % 32);
  const gid = `g-${suffix}-${id}`;
  const motif = hash % 4;
  const shapes = [
    `<circle cx="112" cy="36" r="34" fill="hsl(${hueB} 95% 62% / .45)"/>`,
    `<path d="M-8 150 L90 18 L168 78 L30 190 Z" fill="hsl(${hueA} 85% 58% / .42)"/>`,
    `<rect x="18" y="48" width="78" height="78" transform="rotate(${hash % 28} 57 87)" fill="none" stroke="hsl(${hueB} 100% 72% / .75)" stroke-width="7"/>`,
    `<path d="M0 52 H160 M0 96 H160 M0 140 H160" stroke="hsl(${hueA} 90% 70% / .35)" stroke-width="7"/>`,
  ];
  return `<svg class="art" viewBox="0 0 160 200" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hueA} 78% 38%)"/><stop offset="1" stop-color="hsl(${hueB} 65% 14%)"/></linearGradient></defs><rect width="160" height="200" fill="url(#${gid})"/>${shapes[motif]}${shapes[(motif + 1) % 4]}</svg>`;
}

const PILL = { ps5: "PS5", "xbox-series": "Xbox", "switch-2": "Switch 2", switch: "Switch", pc: "PC", mobile: "Mobile" };

function platformPills(ids) {
  if (!ids.length) return `<span class="pill">TBA</span>`;
  return ids.map((id) => `<a class="pill" href="/games/platforms/${id}/">${esc(PILL[id] || PLATFORMS[id].short)}</a>`).join("");
}

function shopLabel(game, asOf) {
  if (!game.platforms.length || game.lead.precision === "none" || game.lead.precision === "year") return "";
  if (game.lead.precision === "day" && game.lead.date >= asOf) return "Pre-order on Amazon";
  return "Buy on Amazon";
}

function shopButton(game, asOf, className = "cta slim") {
  const label = shopLabel(game, asOf);
  if (!label) return `<a class="${className} ghost" href="${esc(game.path)}">View game</a>`;
  const query = `${game.name} ${PLATFORMS[game.platforms[0]].short}`;
  return `<a class="${className}" rel="sponsored nofollow noopener" href="${esc(amazonSearch(query))}">${label}</a>`;
}

function daysUntil(from, to) {
  return Math.round((utcDate(to).getTime() - utcDate(from).getTime()) / 86400000);
}

function countdownBlock(game, asOf) {
  if (game.lead.precision !== "day") {
    return `<p class="count"><span class="count-k">Release day</span><span class="count-n">TBA</span></p>`;
  }
  if (game.lead.date < asOf) return "";
  const days = daysUntil(asOf, game.lead.date);
  const unit = days === 1 ? "day" : "days";
  return `<p class="count" data-date="${esc(game.lead.date)}"><span class="count-k">Releases in</span><span class="count-n" data-days>${days}</span><span class="count-u" data-unit>${unit}</span></p>`;
}

function shell({ title, description, path, jsonld, body, current }) {
  const nav = [
    ["Release Calendar", "/games/calendar/", "calendar"],
    ["This Week", "/games/this-week/", "week"],
    ["PS5", "/games/platforms/ps5/", "ps5"],
    ["Xbox", "/games/platforms/xbox-series/", "xbox-series"],
    ["Switch 2", "/games/platforms/switch-2/", "switch-2"],
    ["PC", "/games/platforms/pc/", "pc"],
    ["Most Anticipated", "/games/most-anticipated/", "anticipated"],
  ];
  const links = nav.map(([label, href, id]) => {
    const attrs = id === current ? ' aria-current="page"' : "";
    return `<a href="${href}"${attrs}>${label}</a>`;
  }).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(abs(path))}">
<meta name="theme-color" content="#07080f">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(path))}">
<meta property="og:image" content="${HOST}/games/icon-512.png">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="icon" href="/games/favicon.ico" sizes="16x16 32x32">
<link rel="icon" href="/games/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/games/favicon-48.png" type="image/png" sizes="48x48">
<link rel="apple-touch-icon" href="/games/apple-touch-icon.png">
<link rel="manifest" href="/games/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@420;560;700&family=Oxanium:wght@600;700;800&display=swap" rel="stylesheet">
<script type="application/ld+json">${jsonScript(jsonld)}</script>
<link rel="stylesheet" href="/games/styles.css">
</head>
<body>
<a class="skip" href="#content">Skip to content</a>
<header class="top">
  <div class="shell bar">
    <a class="brand" href="/games/"><span class="logo">STREET<b>DATE</b></span></a>
    <nav class="nav" aria-label="Games">${links}</nav>
    <form class="find" action="/games/all/" method="get" role="search">
      <label class="sr" for="site-q">Search games</label>
      <input id="site-q" name="q" type="search" placeholder="Search" autocomplete="off">
      <button type="submit">Search</button>
    </form>
  </div>
</header>
<main id="content" class="shell">
${body}
</main>
<footer class="foot">
  <div class="shell foot-grid">
    <div>
      <p class="brand-name">STREETDATE</p>
      <p>Notable video game release dates, checked against public announcements. Last updated 25 November 2026.</p>
    </div>
    <nav aria-label="Footer">
      <a href="/games/calendar/">Release calendar</a>
      <a href="/games/this-week/">This week</a>
      <a href="/games/most-anticipated/">Most anticipated</a>
      <a href="/games/genres/">Genres</a>
      <a href="/games/platforms/switch/">Switch</a>
      <a href="/games/platforms/mobile/">Mobile</a>
      <a href="/games/faq/">Release date FAQ</a>
      <a href="/games/all/">All games</a>
      <a href="/scores/">Live sports scores</a>
      <a href="/">Calculators</a>
    </nav>
    <p class="disclosure">Streetdate is not affiliated with Sony, Microsoft, Nintendo, or the studios named on these pages. Some Amazon.de links use affiliate tag cynews24-21. If you buy through them, Streetdate may earn a commission. Amazon sets the price. This site does not list wagers. Cover art on these pages is generated pattern art, not publisher key art.</p>
  </div>
</footer>
<script>
document.querySelectorAll("[data-date]").forEach((node) => {
  const parts = node.getAttribute("data-date").split("-").map(Number);
  if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return;
  const target = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((target - today) / 86400000);
  const slot = node.querySelector("[data-days]");
  const unit = node.querySelector("[data-unit]");
  if (!slot) return;
  if (days > 1) slot.textContent = String(days);
  else if (days === 1) { slot.textContent = "1"; if (unit) unit.textContent = "day"; }
  else if (days === 0) node.textContent = "Releases today";
  else node.textContent = "Out now";
});
document.querySelectorAll(".month-scroller").forEach((scroller) => {
  const current = scroller.querySelector('[aria-current="true"]');
  if (!current) return;
  scroller.scrollLeft = current.offsetLeft - (scroller.clientWidth / 2) + (current.clientWidth / 2);
});
</script>
</body>
</html>
`;
}

function rowDate(game) {
  if (game.lead.precision === "day") return `${formatShort(game.lead.date)} ${game.lead.date.slice(0, 4)}`;
  return game.when;
}

function gameRow(game) {
  const hay = [game.name, ...(game.aka || []), game.when, ...game.platforms, ...game.genres].join(" ").toLowerCase();
  const platforms = game.platforms.length ? platformShort(game.platforms) : "Platforms TBA";
  const genres = game.genres.map((id) => GENRES[id].name).join(" · ");
  return `<li data-game="${esc(hay)}">
    <a class="row" href="${esc(game.path)}">
      <span class="when"><span class="when-k">${esc(confidenceLabel(game.lead.confidence))}</span><span class="when-d">${esc(rowDate(game))}</span></span>
      <span class="row-copy">
        <span class="row-title">${esc(game.name)}</span>
        <span class="row-meta">${esc(platforms)}${genres ? ` · ${esc(genres)}` : ""}</span>
      </span>
      <span class="badge ${esc(game.status.code)}">${esc(game.status.label)}</span>
    </a>
  </li>`;
}

function coverCard(game, asOf) {
  const hay = [game.name, ...(game.aka || []), game.when, ...game.platforms, ...game.genres].join(" ").toLowerCase();
  return `<li class="cover" data-game="${esc(hay)}">
    <a class="cover-link" href="${esc(game.path)}">
      <span class="chip">${esc(rowDate(game))}</span>
      ${artMarkup(game, "card")}
      <span class="cover-name">${esc(game.name)}</span>
    </a>
    <div class="cover-meta">${platformPills(game.platforms)}${shopButton(game, asOf)}</div>
  </li>`;
}

function gameList(games, empty, asOf) {
  if (!games.length) return `<p class="empty">${esc(empty)}</p>`;
  return `<ol class="covers wrap">${games.map((game) => coverCard(game, asOf)).join("")}</ol>`;
}

function rankList(games) {
  return `<ol class="ranks">${games.map((game, index) => `<li><a href="${esc(game.path)}"><span class="n">${index + 1}</span><span><strong>${esc(game.name)}</strong><em>${esc(rowDate(game))} · ${esc(game.platforms[0] ? (PILL[game.platforms[0]] || PLATFORMS[game.platforms[0]].short) : "TBA")}</em></span>${artMarkup(game, `rank${index}`)}</a></li>`).join("")}</ol>`;
}

function monthTabs(months, activeKey) {
  const index = months.indexOf(activeKey);
  const prev = index > 0 ? months[index - 1] : "";
  const next = index >= 0 && index < months.length - 1 ? months[index + 1] : "";
  let seenYear = "";
  const links = months.map((key) => {
    const [year, month] = key.split("-");
    const label = MONTHS[Number(month) - 1].slice(0, 3).toUpperCase();
    const current = key === activeKey ? ' aria-current="true"' : "";
    const marker = year === seenYear ? "" : `<span class="year-mark">${year}</span>`;
    seenYear = year;
    return `${marker}<a href="${monthPath(key)}"${current}>${label}</a>`;
  }).join("");
  return `<nav class="months" aria-label="Months">${prev ? `<a class="step" href="${monthPath(prev)}" aria-label="Previous month">‹</a>` : `<span class="step" aria-hidden="true"></span>`}<div class="month-scroller">${links}</div>${next ? `<a class="step" href="${monthPath(next)}" aria-label="Next month">›</a>` : `<span class="step" aria-hidden="true"></span>`}</nav>`;
}

function faqHtml(faqs) {
  return `<section class="faq"><h2>Questions</h2>${faqs.map((faq) => `<details><summary>${esc(faq.q)}</summary><p>${esc(faq.a)}</p></details>`).join("")}</section>`;
}

function relatedHtml(games) {
  if (!games.length) return "";
  const links = games.map((game) => `<a href="${esc(game.path)}">${esc(game.name)}</a>`).join("");
  return `<section><h2>Related on this calendar</h2><nav class="related">${links}</nav></section>`;
}

function baseCrumbs() {
  return [
    { href: "/", label: "Home" },
    { href: "/games/", label: "Streetdate" },
  ];
}

function page(spec) {
  const description = trimMeta(spec.description);
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${abs(spec.path)}#webpage`,
      url: abs(spec.path),
      name: spec.title,
      description,
      isPartOf: { "@id": `${HOST}/games/#website` },
      breadcrumb: crumbLd(spec.crumbs),
      inLanguage: "en",
    },
    ...(spec.extraLd || []),
  ];
  if (spec.path === "/games/") {
    graph.push({
      "@type": "WebSite",
      "@id": `${HOST}/games/#website`,
      url: `${HOST}/games/`,
      name: "Streetdate",
      description: "Notable video game release dates for PlayStation 5, Xbox Series X|S, Switch 2, PC and mobile.",
      inLanguage: "en",
    });
  }
  return {
    path: spec.path,
    title: spec.title,
    description,
    html: shell({
      title: spec.title,
      description,
      path: spec.path,
      current: spec.current,
      jsonld: { "@context": "https://schema.org", "@graph": graph },
      body: `${crumbsHtml(spec.crumbs)}
<h1 class="${esc(spec.h1Class || "")}">${esc(spec.h1)}</h1>
${spec.deferIntro ? "" : spec.intro.map((paragraph) => `<p class="lede">${esc(paragraph)}</p>`).join("")}
${spec.main}
${spec.deferIntro ? `<section class="about">${spec.intro.map((paragraph) => `<p class="lede">${esc(paragraph)}</p>`).join("")}</section>` : ""}`,
    }),
  };
}

function monthPath(key) {
  const [year, month] = key.split("-");
  return `/games/calendar/${year}/${MONTHS[Number(month) - 1].toLowerCase()}/`;
}

function gamesOnDates(games, predicate) {
  const out = [];
  for (const game of games) {
    const matches = normalizedReleases(game)
      .filter((release) => release.precision === "day" && predicate(release.date))
      .sort(compareRelease);
    if (!matches.length) continue;
    const lead = matches[0];
    out.push({ ...game, lead, when: formatWhen(lead) });
  }
  return out.sort((a, b) => compareRelease(a.lead, b.lead) || a.name.localeCompare(b.name));
}

function appearancesInMonth(games, key) {
  const out = [];
  for (const game of games) {
    const release = game.releases.find((item) => (item.precision === "day" || item.precision === "month") && String(item.date).startsWith(key));
    if (!release) continue;
    const date = release.precision === "month" ? `${release.date}-01` : release.date;
    const lead = { ...release, date };
    out.push({ ...game, lead, when: formatWhen(lead) });
  }
  return out.sort((a, b) => compareRelease(a.lead, b.lead) || a.name.localeCompare(b.name));
}

function byDate(games) {
  return [...games].sort((a, b) => compareRelease(a.lead, b.lead) || a.name.localeCompare(b.name));
}

function videoGameLd(game) {
  const node = {
    "@type": "VideoGame",
    name: game.name,
    description: game.blurb,
    url: abs(game.path),
    genre: game.genres.map((id) => GENRES[id].name),
    gamePlatform: platformNames(game.platforms),
  };
  if (game.developer) node.author = { "@type": "Organization", name: game.developer };
  if (game.publisher) node.publisher = { "@type": "Organization", name: game.publisher };
  if (game.image) node.image = abs(game.image);
  if (game.lead.precision === "day" && game.status.code === "released") node.datePublished = game.lead.date;
  if (game.lead.precision === "day") {
    node.additionalProperty = {
      "@type": "PropertyValue",
      name: "Release date",
      value: formatWhen(game.lead),
    };
  }
  if (game.trailer) {
    const id = game.trailer.match(/[?&]v=([^&]+)/)?.[1];
    node.trailer = {
      "@type": "VideoObject",
      name: game.trailerTitle || `${game.name} trailer`,
      url: game.trailer,
      thumbnailUrl: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined,
    };
  }
  return node;
}

function gameFaqs(game) {
  const platformText = game.platforms.length
    ? `${game.name} is listed for ${platformNames(game.platforms).join(", ")}.`
    : `A platform list for ${game.name} has not been confirmed.`;
  const delayText = game.delays?.length
    ? game.delays.join(" ")
    : `Streetdate does not have a confirmed delay history for ${game.name}.`;
  const dateText = game.lead.precision === "day"
    ? `${game.name} is dated ${formatWhen(game.lead)}. That date is marked ${confidenceLabel(game.lead.confidence).toLowerCase()}.`
    : game.lead.precision === "year" || game.lead.precision === "month"
      ? `${game.name} has a ${formatWhen(game.lead)} window and no locked day. Treat the exact date as TBA.`
      : `${game.name} does not have a public release date. It stays TBA until a publisher names one.`;
  return [
    { q: `When does ${game.name} come out?`, a: dateText },
    { q: `What platforms is ${game.name} on?`, a: platformText },
    { q: `Has ${game.name} been delayed?`, a: delayText },
    { q: `Who is making ${game.name}?`, a: [game.developer && `Developer: ${game.developer}.`, game.publisher && `Publisher: ${game.publisher}.`].filter(Boolean).join(" ") || "A studio credit is not locked on this page." },
  ];
}

function amazonBlock(game, asOf) {
  const label = shopLabel(game, asOf);
  if (!label) return "";
  return `<p>${shopButton(game, asOf, "cta")}</p>`;
}

function releaseTable(game) {
  const rows = game.releases.map((release) => {
    const platforms = release.platforms?.length ? platformShort(release.platforms) : "Platforms TBA";
    const kindLabel = { release: "Launch", port: "Later platform", "early-access": "Early access", expansion: "Expansion", "full-release": "Full release" };
    return `<tr><td>${esc(formatWhen({ ...release, date: release.precision === "month" ? `${release.date}-01` : release.precision === "year" ? `${release.date}-01-01` : release.date }))}</td><td>${esc(confidenceLabel(release.confidence))}</td><td>${esc(platforms)}</td><td>${esc(release.note || kindLabel[release.kind] || "")}</td></tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Status</th><th>Platforms</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function sourceList(game) {
  const sources = game.sources || [];
  if (!sources.length && !game.official) return "";
  const links = [
    game.official ? `<li><a href="${esc(game.official)}">Official page</a></li>` : "",
    game.trailer ? `<li><a href="${esc(game.trailer)}">${esc(game.trailerTitle || "Official trailer")}</a></li>` : "",
    ...sources.map((source) => `<li><a href="${esc(source.url)}">${esc(source.name)}</a></li>`),
  ].filter(Boolean);
  return `<section><h2>Sources</h2><ul class="sources">${links.join("")}</ul></section>`;
}

function relatedFor(game, games) {
  const scored = games
    .filter((other) => other.id !== game.id)
    .map((other) => {
      const sharedGenre = other.genres.some((genre) => game.genres.includes(genre)) ? 2 : 0;
      const sharedPlatform = other.platforms.some((platform) => game.platforms.includes(platform)) ? 1 : 0;
      return { other, score: sharedGenre + sharedPlatform + (other.anticipation || 0) / 100 };
    })
    .filter((item) => item.score >= 1)
    .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name));
  return scored.slice(0, 4).map((item) => item.other);
}

function monthLinks(keys) {
  return keys.map((key) => {
    const [year, month] = key.split("-");
    const label = `${MONTHS[Number(month) - 1]} ${year}`;
    return `<a href="${monthPath(key)}">${esc(label)}</a>`;
  }).join("");
}

export function buildGamesSite(data) {
  validateReleaseData(data);
  const asOf = data.asOf;
  const games = data.games.map((game) => viewGame(game, asOf));
  const week = weekRange(asOf);
  const month = asOf.slice(0, 7);
  const thisWeek = gamesOnDates(games, (date) => date >= week.start && date <= week.end);
  const thisMonth = appearancesInMonth(games, month);
  const justOut = gamesOnDates(games, (date) => date >= addDays(asOf, -21) && date <= asOf);
  const coming = gamesOnDates(games, (date) => date > asOf && date <= addDays(asOf, 45));
  const anticipated = [...games].filter((game) => (game.anticipation || 0) >= 50).sort((a, b) => b.anticipation - a.anticipation || a.name.localeCompare(b.name));

  const monthKeys = [];
  for (const game of games) {
    for (const release of game.releases) {
      if (release.precision === "day") monthKeys.push(release.date.slice(0, 7));
      if (release.precision === "month") monthKeys.push(release.date.slice(0, 7));
    }
  }
  const months = [...new Set(monthKeys)].sort();
  const years = [...new Set(games.flatMap((game) => game.releases.map((release) => (release.date || "").slice(0, 4))).filter((year) => /^\d{4}$/.test(year)))].sort();

  const pages = [];

  pages.push(page({
    path: "/games/",
    current: "home",
    title: "Streetdate: 2026 video game release calendar",
    description: "Notable PS5, Xbox Series X|S, Switch 2, PC and mobile release dates for 2026, plus late 2025 and dated 2027 games. Updated 25 November 2026.",
    h1: "Video game release dates, with the unsure ones labelled",
    h1Class: "eyebrow",
    deferIntro: true,
    crumbs: [...baseCrumbs().slice(0, 1), { href: "/games/", label: "Streetdate" }],
    intro: [
      "Streetdate is a calendar of notable games for PlayStation 5, Xbox Series X|S, Switch 2, PC and mobile. It also keeps late 2025 launches and announced 2027 and 2028 windows.",
      "A date is confirmed only when a publisher page or a cited public list says so. Scheduled means several public calendars agree and the day can still move. Window and TBA mean no locked day.",
    ],
    extraLd: [
      faqLd([
        { q: "What does Streetdate count as confirmed?", a: "Confirmed means a publisher page or a cited public release list names the date. Scheduled means public calendars agree but Streetdate has not opened a publisher page for that day. Window and TBA mean there is no locked day." },
        { q: "When was this calendar updated?", a: "The pages were last updated on 25 November 2026." },
      ]),
      itemListLd("Most anticipated games on Streetdate", anticipated.slice(0, 8)),
    ],
    main: (() => {
      const featured = [...games]
        .filter((game) => game.lead.precision === "day" && game.lead.date > asOf)
        .sort((a, b) => (b.anticipation || 0) - (a.anticipation || 0) || compareRelease(a.lead, b.lead))[0] || anticipated[0];
      const genre = GENRES[featured.genres[0]].name.toUpperCase();
      const line = featured.blurb.split(/(?<=\.)\s/)[0];
      return `<div class="stage">
      <section class="hero">
        <div class="hero-art">${artMarkup(featured, "hero")}</div>
        <div class="hero-copy">
          <p class="kicker">${esc(genre)}</p>
          <p class="hero-title">${esc(featured.name)}</p>
          <p class="tag">${esc(line)}</p>
          ${countdownBlock(featured, asOf)}
          <div class="pills">${platformPills(featured.platforms)}</div>
          <a class="cta" href="${esc(featured.path)}">View game</a>
          ${featured.imageCredit ? `<p class="credit">Image: ${esc(featured.imageCredit)}</p>` : ""}
        </div>
      </section>
      <aside class="rank">
        <header><h2>Most anticipated</h2><a href="/games/most-anticipated/">View all</a></header>
        ${rankList(anticipated.slice(0, 5))}
        <a class="full" href="/games/most-anticipated/">See full ranking</a>
      </aside>
      <section class="week">
        <header class="section-head"><h2>Coming this week</h2><span>${esc(formatSpan(week.start, week.end))}</span></header>
        ${monthTabs(months, month)}
        ${thisWeek.length ? `<ol class="covers">${thisWeek.map((game) => coverCard(game, asOf)).join("")}</ol>` : `<p class="empty">No notable release falls in this week.</p>`}
        <p class="more"><a href="/games/this-week/">View full week</a></p>
      </section>
    </div>
    <section>
      <div class="section-head"><h2>Recently released</h2><a href="/games/this-month/">This month</a></div>
      ${gameList(justOut.slice(0, 6), "Nothing notable in the past three weeks.", asOf)}
    </section>
    <section>
      <div class="section-head"><h2>Release-date questions</h2></div>
      <nav class="related">${anticipated.slice(0, 6).map((game) => `<a href="${esc(game.questionPath)}">${esc(queryLabel(game))} release date</a>`).join("")}</nav>
    </section>`;
    })(),
  }));

  pages.push(page({
    path: "/games/calendar/",
    current: "calendar",
    title: "Video game release calendar 2025–2028 | Streetdate",
    description: "Browse notable game releases by year and month, from late 2025 through announced 2027 and 2028 windows. Updated 25 November 2026.",
    h1: "Release calendar",
    crumbs: [...baseCrumbs(), { href: "/games/calendar/", label: "Calendar" }],
    intro: ["Pick a year, then a month. Games without a day sit on the year page instead of a made-up date."],
    extraLd: [],
    main: `<nav class="cards">${years.map((year) => `<a class="card" href="/games/calendar/${year}/"><strong>${esc(year)}</strong><span>Notable releases</span></a>`).join("")}</nav>
    <section><h2>Months with a notable date</h2><nav class="chips">${monthLinks(months)}</nav></section>`,
  }));

  for (const year of years) {
    const yearGames = games.filter((game) => game.releases.some((release) => (release.date || "").startsWith(year)));
    const yearMonths = months.filter((key) => key.startsWith(year));
    pages.push(page({
      path: `/games/calendar/${year}/`,
      current: "calendar",
      title: `${year} video game release schedule | Streetdate`,
      description: trimMeta(`Notable ${year} game releases by month for PS5, Xbox, Switch 2, PC and mobile. ${yearGames.slice(0, 3).map((game) => game.name).join(", ")}.`),
      h1: `${year} game releases`,
      crumbs: [...baseCrumbs(), { href: "/games/calendar/", label: "Calendar" }, { href: `/games/calendar/${year}/`, label: year }],
      intro: [`Notable ${year} releases in this catalogue. Annual sports games and storefront-only indies are not all listed.`],
      extraLd: [itemListLd(`${year} notable releases`, byDate(yearGames))],
      main: `<nav class="chips">${monthLinks(yearMonths)}</nav>
      <section><h2>Everything dated in ${esc(year)}</h2>${gameList(byDate(yearGames), `No notable ${year} release is in the catalogue.`, asOf)}</section>`,
    }));
  }

  for (const key of months) {
    const [year, monthNumber] = key.split("-");
    const label = `${MONTHS[Number(monthNumber) - 1]} ${year}`;
    const list = appearancesInMonth(games, key);
    const names = list.slice(0, 3).map((game) => game.name).join(", ");
    const index = months.indexOf(key);
    const prev = months[index - 1];
    const next = months[index + 1];
    pages.push(page({
      path: monthPath(key),
      current: "calendar",
      title: `${label} game releases | Streetdate`,
      description: trimMeta(`${label} notable releases: ${names || "dates still being added"}. Platforms, status and links to each game.`),
      h1: `${label} game releases`,
      crumbs: [...baseCrumbs(), { href: "/games/calendar/", label: "Calendar" }, { href: `/games/calendar/${year}/`, label: year }, { href: monthPath(key), label }],
      intro: [`Notable games with a ${label} date. Confirmed, scheduled and early-access launches are labelled on each row.`],
      extraLd: [itemListLd(`${label} game releases`, list)],
      main: `${monthTabs(months, key)}
      <nav class="pager">${prev ? `<a href="${monthPath(prev)}">Previous month</a>` : "<span></span>"}<a href="/games/calendar/${year}/">${esc(year)} overview</a>${next ? `<a href="${monthPath(next)}">Next month</a>` : "<span></span>"}</nav>
      ${gameList(list, `No notable day-dated release in ${label}.`, asOf)}`,
    }));
  }

  pages.push(page({
    path: "/games/this-week/",
    current: "week",
    title: `Games releasing this week (${formatSpan(week.start, week.end)}) | Streetdate`,
    description: trimMeta(`Notable games dated ${formatDay(week.start)} to ${formatDay(week.end)}. ${thisWeek.map((game) => game.name).join(", ") || "No flagship falls in this week."}`),
    h1: `Releasing this week, ${formatDay(week.start)} to ${formatDay(week.end)}`,
    crumbs: [...baseCrumbs(), { href: "/games/this-week/", label: "This week" }],
    intro: [
      `The week runs from ${formatDay(week.start)} to ${formatDay(week.end)}, using the catalogue date of ${formatDay(asOf)}.`,
      thisWeek.length
        ? `Notable names dated this week: ${thisWeek.map((game) => game.name).join(", ")}.`
        : "No notable day-dated game in this catalogue falls in the week. The next dated releases are below.",
    ],
    extraLd: [itemListLd("Games releasing this week", thisWeek)],
    main: gameList(thisWeek, "No notable game in this catalogue is dated for this week.", asOf) + `<section><div class="section-head"><h2>Just after this week</h2></div>${gameList(coming.slice(0, 8), "", asOf)}</section>`,
  }));

  const monthLabel = `${MONTHS[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`;
  pages.push(page({
    path: "/games/this-month/",
    current: "month",
    title: `Games releasing in ${monthLabel} | Streetdate`,
    description: trimMeta(`What is releasing in ${monthLabel}: ${thisMonth.slice(0, 4).map((game) => game.name).join(", ")}. Updated 25 November 2026.`),
    h1: `Releasing in ${monthLabel}`,
    crumbs: [...baseCrumbs(), { href: "/games/this-month/", label: "This month" }],
    intro: [`Every notable ${monthLabel} date in the catalogue, including games that have already shipped this month.`],
    extraLd: [itemListLd(`${monthLabel} releases`, thisMonth)],
    main: `${monthTabs(months, month)}${gameList(thisMonth, `No notable ${monthLabel} release.`, asOf)}<p><a href="${monthPath(month)}">${esc(monthLabel)} on the calendar</a></p>`,
  }));

  pages.push(page({
    path: "/games/platforms/",
    current: "platforms",
    title: "Game releases by platform | Streetdate",
    description: "PS5, Xbox Series X|S, Switch 2, Switch, PC and mobile release lists, with dates and TBA windows. Updated 25 November 2026.",
    h1: "Releases by platform",
    crumbs: [...baseCrumbs(), { href: "/games/platforms/", label: "Platforms" }],
    intro: ["Open a platform for every notable game that names it. A later port is included even when the original launch was earlier."],
    extraLd: [],
    main: `<nav class="cards">${Object.entries(PLATFORMS).map(([id, platform]) => {
      const count = games.filter((game) => game.platforms.includes(id)).length;
      return `<a class="card" href="/games/platforms/${id}/"><strong>${esc(platform.name)}</strong><span>${count} notable games</span></a>`;
    }).join("")}</nav>`,
  }));

  for (const [id, platform] of Object.entries(PLATFORMS)) {
    const list = byDate(games.filter((game) => game.platforms.includes(id)));
    const amazon = platform.amazon
      ? `<p><a class="cta" rel="sponsored nofollow noopener" href="${esc(amazonSearch(platform.amazon))}">Buy on Amazon</a></p>`
      : "";
    pages.push(page({
      path: `/games/platforms/${id}/`,
      current: id,
      title: `${platform.name} release schedule | Streetdate`,
      description: trimMeta(`${platform.name} notable releases for 2025–2028, including ${list.slice(0, 3).map((game) => game.name).join(", ")}.`),
      h1: `${platform.name} release schedule`,
      crumbs: [...baseCrumbs(), { href: "/games/platforms/", label: "Platforms" }, { href: `/games/platforms/${id}/`, label: platform.short }],
      intro: [`Notable games that list ${platform.name}. Dates that are only a year, or not announced, stay marked as a window or TBA.`],
      extraLd: [itemListLd(`${platform.name} releases`, list)],
      main: `${amazon}${gameList(list, `No notable ${platform.name} game is in the catalogue.`, asOf)}`,
    }));
  }

  pages.push(page({
    path: "/games/genres/",
    current: "genres",
    title: "Game releases by genre | Streetdate",
    description: "Horror, RPG, racing, sports, shooter and other notable releases sorted by genre. Updated 25 November 2026.",
    h1: "Releases by genre",
    crumbs: [...baseCrumbs(), { href: "/games/genres/", label: "Genres" }],
    intro: ["A game can sit in more than one genre. The lists are a reading aid, not a store category."],
    extraLd: [],
    main: `<nav class="cards">${Object.entries(GENRES).map(([id, genre]) => `<a class="card" href="/games/genres/${id}/"><strong>${esc(genre.name)}</strong><span>${games.filter((game) => game.genres.includes(id)).length} games</span></a>`).join("")}</nav>`,
  }));

  for (const [id, genre] of Object.entries(GENRES)) {
    const list = byDate(games.filter((game) => game.genres.includes(id)));
    pages.push(page({
      path: `/games/genres/${id}/`,
      current: "genres",
      title: `${genre.name} game release dates | Streetdate`,
      description: trimMeta(`${genre.blurb} Includes ${list.slice(0, 3).map((game) => game.name).join(", ") || "titles as they are dated"}.`),
      h1: `${genre.name} releases`,
      crumbs: [...baseCrumbs(), { href: "/games/genres/", label: "Genres" }, { href: `/games/genres/${id}/`, label: genre.name }],
      intro: [genre.blurb],
      extraLd: [itemListLd(`${genre.name} releases`, list)],
      main: gameList(list, `No notable ${genre.name.toLowerCase()} game is in the catalogue yet.`, asOf),
    }));
  }

  pages.push(page({
    path: "/games/most-anticipated/",
    current: "anticipated",
    title: "Most anticipated games of 2026 and 2027 | Streetdate",
    description: "Streetdate's editorial list of the most watched game releases, led by GTA 6, Fable, The Witcher 4 and The Duskbloods. Not a player vote.",
    h1: "Most anticipated games",
    crumbs: [...baseCrumbs(), { href: "/games/most-anticipated/", label: "Most anticipated" }],
    intro: [
      "This order reflects which announced games draw the most public attention in release-date coverage. It is not a poll, a review score, or a sales forecast.",
      "Released games stay on the list when people are still searching the date. Windows without a day stay marked TBA.",
    ],
    extraLd: [itemListLd("Most anticipated games", anticipated)],
    main: rankList(anticipated),
  }));

  const siteFaqs = [
    { q: "What do confirmed, scheduled, window and TBA mean?", a: "Confirmed means a publisher page or a cited public list names the day. Scheduled means public release calendars agree and the day can still move. Window means a year or season has been stated without a day. TBA means no public date." },
    { q: "Does this list every game coming out?", a: "No. Streetdate tracks notable releases people search for. It is not a complete Steam or eShop dump." },
    { q: "Which time zone are the dates in?", a: "Dates are calendar dates from the publisher or public list, not a worldwide unlock hour. Streetdate does not invent a midnight time." },
    { q: "Is Streetdate an official publisher site?", a: "No. Streetdate is independent of Sony, Microsoft, Nintendo and the studios named here." },
    { q: "Do you list wagers?", a: "No. There are no sportsbook links or wagering offers on these pages." },
    { q: "Why are there Amazon links?", a: "Some pages link to an Amazon.de search for a game or console using affiliate tag cynews24-21. A purchase can earn Streetdate a commission. Amazon sets the price." },
    { q: "When was the calendar last updated?", a: "25 November 2026. Change the dates in games/data/releases.json and rebuild the pages when a publisher moves a game." },
    { q: "Is GTA 6 on PC?", a: "Grand Theft Auto VI launched on 19 November 2026 for PlayStation 5 and Xbox Series X|S. Rockstar has not announced a PC date, so the PC version stays TBA." },
  ];
  pages.push(page({
    path: "/games/faq/",
    current: "faq",
    title: "Video game release date FAQ | Streetdate",
    description: "How Streetdate labels confirmed, scheduled and TBA dates, plus answers on time zones, PC versions and affiliate links.",
    h1: "Release date FAQ",
    crumbs: [...baseCrumbs(), { href: "/games/faq/", label: "FAQ" }],
    intro: ["Short answers to the questions that sit under a release calendar. Each game also has its own date page."],
    extraLd: [faqLd(siteFaqs)],
    main: `${faqHtml(siteFaqs)}<section><h2>Date pages</h2><nav class="related">${anticipated.map((game) => `<a href="${esc(game.questionPath)}">${esc(game.name)}</a>`).join("")}</nav></section>`,
  }));

  const letters = [...games].sort((a, b) => a.name.localeCompare(b.name));
  pages.push(page({
    path: "/games/all/",
    current: "home",
    title: "All notable game release dates | Streetdate",
    description: "Every notable game on the Streetdate calendar, from late 2025 through announced 2027 and 2028 windows. Search by name.",
    h1: "All notable games",
    crumbs: [...baseCrumbs(), { href: "/games/all/", label: "All games" }],
    intro: ["Search filters this list in the browser. Without JavaScript, the full list is still here."],
    extraLd: [itemListLd("All notable games", letters)],
    main: `<p class="hint" id="results">Showing ${letters.length} games. Use the search box above, or type here.</p>
    <form class="find find-inline" action="/games/all/" method="get">
      <label class="sr" for="filter-q">Filter games</label>
      <input id="filter-q" data-filter name="q" type="search" placeholder="Filter by name">
    </form>
    ${gameList(letters, "No games.", asOf)}
    <script src="/games/filter.js"></script>`,
  }));

  for (const game of games) {
    const faqs = gameFaqs(game);
    const aka = game.aka?.length ? ` Also searched as ${game.aka.join(", ")}.` : "";
    const monthHref = game.lead.precision === "day" || game.lead.precision === "month" ? monthPath(monthKey(game.lead.date)) : "";
    const platformLinks = game.platforms.map((id) => `<a href="/games/platforms/${id}/">${esc(PLATFORMS[id].short)}</a>`).join("");
    const genreLinks = game.genres.map((id) => `<a href="/games/genres/${id}/">${esc(GENRES[id].name)}</a>`).join("");
    pages.push(page({
      path: game.path,
      current: "calendar",
      title: trimMeta(`${game.name} release date and platforms | Streetdate`, 72),
      description: trimMeta(`${game.name} is ${game.when} (${confidenceLabel(game.lead.confidence).toLowerCase()}) on ${game.platforms.length ? platformShort(game.platforms) : "unannounced platforms"}.${aka} Updated 25 November 2026.`),
      h1: `${game.name} release date`,
      crumbs: [...baseCrumbs(), { href: "/games/calendar/", label: "Calendar" }, { href: game.path, label: game.name }],
      intro: [game.blurb],
      extraLd: [videoGameLd(game), faqLd(faqs)],
      main: `<section class="game-hero">
        ${artMarkup(game, "page")}
        <div>
          <p class="kicker">${esc(confidenceLabel(game.lead.confidence))}</p>
          <p class="big-date">${esc(game.when)}</p>
          <p class="badge ${esc(game.status.code)}">${esc(game.status.label)}</p>
          ${countdownBlock(game, asOf)}
          <div class="pills">${platformPills(game.platforms)}</div>
          ${amazonBlock(game, asOf)}
          ${game.imageCredit ? `<p class="credit">Image: ${esc(game.imageCredit)}</p>` : ""}
        </div>
      </section>
      <dl class="facts">
        ${game.developer ? `<div><dt>Developer</dt><dd>${esc(game.developer)}</dd></div>` : ""}
        ${game.publisher ? `<div><dt>Publisher</dt><dd>${esc(game.publisher)}</dd></div>` : ""}
        <div><dt>Platforms</dt><dd>${platformLinks || "Not confirmed"}</dd></div>
        <div><dt>Genre</dt><dd>${genreLinks}</dd></div>
        ${monthHref ? `<div><dt>Month</dt><dd><a href="${monthHref}">${esc(formatWhen({ ...game.lead, precision: "month", date: game.lead.date }))}</a></dd></div>` : ""}
      </dl>
      ${game.facts?.length ? `<section><h2>What is public</h2><ul>${game.facts.map((fact) => `<li>${esc(fact)}</li>`).join("")}</ul></section>` : ""}
      <section><h2>Release dates</h2>${releaseTable(game)}</section>
      ${game.delays?.length ? `<section><h2>Delay history</h2><ol class="delays">${game.delays.map((item) => `<li>${esc(item)}</li>`).join("")}</ol></section>` : ""}
      <p><a href="${esc(game.questionPath)}">When does ${esc(game.name)} come out?</a></p>
      ${faqHtml(faqs)}
      ${sourceList(game)}
      ${relatedHtml(relatedFor(game, games))}`,
    }));

    const queryName = queryLabel(game);
    const compactWhen = game.lead.precision === "day" ? formatShort(game.lead.date) + " " + game.lead.date.slice(0, 4) : game.when;
    pages.push(page({
      path: game.questionPath,
      current: "faq",
      title: trimMeta(`When does ${queryName} come out? ${compactWhen} | Streetdate`, 72),
      description: trimMeta(`When does ${game.name} come out? ${faqs[0].a} Updated 25 November 2026.`),
      h1: `When does ${game.name} come out?`,
      crumbs: [...baseCrumbs(), { href: "/games/faq/", label: "FAQ" }, { href: game.questionPath, label: `${game.name} release date` }],
      intro: [faqs[0].a],
      extraLd: [faqLd(faqs)],
      main: `<section class="game-hero">
        ${artMarkup(game, "ask")}
        <div>
          <p class="big-date">${esc(game.when)}</p>
          <p class="badge ${esc(game.status.code)}">${esc(game.status.label)}</p>
          ${countdownBlock(game, asOf)}
          <div class="pills">${platformPills(game.platforms)}</div>
          ${amazonBlock(game, asOf)}
          ${game.imageCredit ? `<p class="credit">Image: ${esc(game.imageCredit)}</p>` : ""}
        </div>
      </section>
      ${faqHtml(faqs)}
      <p><a href="${esc(game.path)}">Full ${esc(game.name)} page</a>${monthHref ? ` · <a href="${monthHref}">Month calendar</a>` : ""}</p>
      ${relatedHtml(relatedFor(game, games))}`,
    }));
  }

  const titles = new Set();
  const descriptions = new Set();
  for (const built of pages) {
    if (titles.has(built.title)) throw new Error(`duplicate title ${built.title}`);
    if (descriptions.has(built.description)) throw new Error(`duplicate description ${built.description}`);
    if (built.title.length > 75) throw new Error(`title too long (${built.title.length}) ${built.title}`);
    if (built.description.length < 50 || built.description.length > 170) throw new Error(`description length ${built.description.length} ${built.path}`);
    titles.add(built.title);
    descriptions.add(built.description);
  }

  return { pages, games, week, thisWeek, thisMonth, anticipated };
}

export function gamesSitemap(paths, lastmod) {
  const body = paths.map((path) => `  <url><loc>${esc(abs(path))}</loc><lastmod>${esc(lastmod)}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}
